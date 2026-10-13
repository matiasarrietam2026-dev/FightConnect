/**
 * @fileoverview Configuración del empaquetador Vite para FightConnect.
 * 
 * Este archivo define la configuración de compilación para una aplicación Multi-Página (MPA).
 * Escanea de forma dinámica el directorio raíz en busca de todos los archivos `.html`
 * para registrarlos como puntos de entrada independientes (entry points) en Rollup.
 * 
 * @module vite.config
 * @author FightConnect Development Team
 * @version 1.0.0
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Obtención del directorio base absoluto en entornos de módulos ES (ESM).
 * En ESM, `__dirname` no existe de forma predeterminada, por lo que se reconstruye usando `import.meta.url`.
 * 
 * @constant {string}
 */
const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Mapeo dinámico de todas las páginas HTML de la raíz del proyecto.
 * Lee el directorio actual de manera sincrónica, filtra solo los archivos `.html`
 * y construye un objeto de configuración para Rollup con el formato:
 * { [nombreSinExtension]: rutaAbsolutaAlHtml }
 * 
 * @constant {Object.<string, string>}
 * @example
 * {
 *   index: '/ruta/al/proyecto/index.html',
 *   'fan-dashboard': '/ruta/al/proyecto/fan-dashboard.html',
 *   ...
 * }
 */
const htmlFiles = fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.html'))
  .reduce((inputs, file) => {
    // Extrae el nombre del archivo sin la extensión .html para usarlo como clave
    const name = file.replace(/\.html$/, '');
    inputs[name] = resolve(__dirname, file);
    return inputs;
  }, {});

// Registro explícito de manuales en subdirectorios autónomos
if (fs.existsSync(resolve(__dirname, 'manual-usuario/index.html'))) {
  htmlFiles['manual-usuario'] = resolve(__dirname, 'manual-usuario/index.html');
}
if (fs.existsSync(resolve(__dirname, 'manual-programador/index.html'))) {
  htmlFiles['manual-programador'] = resolve(__dirname, 'manual-programador/index.html');
}

/**
 * Plugin de servidor de imágenes local para almacenamiento estático y persistencia.
 * Procesa subidas de logotipos, avatares y afiches y los almacena en `public/uploads/`
 * retornando una URL web pública (/uploads/archivo.jpg).
 */
function localImageServerPlugin() {
  return {
    name: 'local-image-server',
    configureServer(server) {
      server.middlewares.use('/api/upload-image', (req, res, next) => {
        if (req.method !== 'POST') return next();

        let body = '';
        req.on('data', chunk => { 
          body += chunk; 
          if (body.length > 35 * 1024 * 1024) {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: 'El archivo excede el tamaño máximo permitido' }));
          }
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const base64Data = data.image || data.data;
            if (!base64Data) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              return res.end(JSON.stringify({ success: false, error: 'No image provided' }));
            }

            const folder = (data.folder || 'uploads').replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 30);
            const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
            const buffer = Buffer.from(cleanBase64, 'base64');

            // Límite de tamaño máximo del archivo procesado (25 MB)
            if (buffer.length > 25 * 1024 * 1024) {
              res.statusCode = 413;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Archivo demasiado grande (máximo 25MB)' }));
            }

            // Verificación binaria de Magic Bytes para rechazar scripts camuflados y ejecutables
            let ext = null;
            if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
              ext = 'jpg';
            } else if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
              ext = 'png';
            } else if (buffer.length >= 4 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
              ext = 'gif';
            } else if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
              ext = 'webp';
            } else if (buffer.length >= 8 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
              ext = 'mp4';
            } else if (buffer.length >= 4 && buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
              ext = 'webm';
            } else if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
              ext = 'pdf';
            }

            if (!ext) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Formato no admitido o contenido binario sospechoso' }));
            }

            const uploadsDir = resolve(__dirname, 'public', 'uploads');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
            const filePath = resolve(uploadsDir, fileName);

            fs.writeFileSync(filePath, buffer);

            const distUploads = resolve(__dirname, 'dist', 'uploads');
            if (fs.existsSync(distUploads)) {
              fs.copyFileSync(filePath, resolve(distUploads, fileName));
            }

            const publicUrl = `/uploads/${fileName}`;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: true, url: publicUrl }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });

      // Middleware dedicado para servir imágenes y videos dinámicos desde public/uploads/ sin depender de la caché de Vite
      server.middlewares.use((req, res, next) => {
        const urlPath = req.url ? req.url.split('?')[0] : '';
        if (urlPath.startsWith('/uploads/')) {
          const fileName = decodeURIComponent(urlPath.replace(/^\/uploads\//, ''));
          const filePath = resolve(__dirname, 'public', 'uploads', fileName);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = fileName.split('.').pop().toLowerCase();
            const mimeTypes = {
              'png': 'image/png',
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'webp': 'image/webp',
              'gif': 'image/gif',
              'svg': 'image/svg+xml',
              'mp4': 'video/mp4',
              'webm': 'video/webm',
              'mov': 'video/quicktime'
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            return fs.createReadStream(filePath).pipe(res);
          }
        }
        next();
      });
    }
  };
}

/**
 * Configuración exportada de Vite.
 * @see {@link https://vitejs.dev/config/}
 */
export default defineConfig({
  plugins: [localImageServerPlugin()],
  server: {
    watch: {
      ignored: ['**/public/uploads/**', '**/dist/**']
    }
  },
  build: {
    rollupOptions: {
      // Registra todos los HTML descubiertos dinámicamente como puntos de entrada de compilación
      input: htmlFiles
    }
  }
});


