/**
 * @fileoverview Módulo de Utilidades de Seguridad y Sanitización para FightConnect.
 * 
 * Este módulo proporciona funciones defensivas esenciales contra:
 * 1. Inyecciones de código en el DOM (Cross-Site Scripting - XSS).
 * 2. Inyección de esquemas URL maliciosos (javascript:, vbscript:, data:text/html).
 * 3. Carga de archivos maliciosos (Polyglots) mediante validación de Magic Bytes y tipos MIME.
 * 4. Normalización y validación de longitudes de entradas del usuario.
 * 
 * @module security-utils
 * @author FightConnect Development Team
 * @version 1.0.0
 */

// ============================================================================
// 1. ESCAPE Y SANITIZACIÓN DE CARACTERES HTML (ANTI-XSS)
// ============================================================================

/**
 * Mapa de caracteres especiales a entidades HTML seguras.
 * @constant {Object.<string, string>}
 */
const HTML_ENTITY_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;'
};

/**
 * Convierte caracteres especiales en entidades HTML para evitar inyecciones XSS
 * al renderizar datos ingresados por usuarios dentro de plantillas innerHTML.
 * 
 * @function escapeHtml
 * @param {string|number|null|undefined} input - Valor que será renderizado en el DOM.
 * @returns {string} Cadena sanitizada y segura para inserción en HTML.
 * @example
 * escapeHtml('<script>alert("hack")</script>');
 * // Retorna: '&lt;script&gt;alert(&quot;hack&quot;)&lt;&#x2F;script&gt;'
 */
export function escapeHtml(input) {
    if (input === null || input === undefined) {
        return '';
    }
    const str = String(input);
    return str.replace(/[&<>"'`/]/g, char => HTML_ENTITY_MAP[char] || char);
}

/**
 * Normaliza y sanitiza un texto de usuario con límite opcional de longitud.
 * Remueve caracteres de control no imprimibles (excepto saltos de línea y tabulaciones).
 * 
 * @function sanitizeText
 * @param {string} input - Texto a limpiar.
 * @param {number} [maxLength=1500] - Longitud máxima permitida en caracteres.
 * @returns {string} Texto limpio y recortado si excede el límite.
 */
export function sanitizeText(input, maxLength = 1500) {
    if (!input || typeof input !== 'string') return '';
    
    // Remueve caracteres de control ASCII (0-8, 11-12, 14-31, 127) manteniendo saltos de línea (\n) y retorno (\r)
    let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    
    if (maxLength > 0 && cleaned.length > maxLength) {
        cleaned = cleaned.substring(0, maxLength);
    }
    
    return cleaned;
}

// ============================================================================
// 2. VALIDACIÓN DE URLs SEGURAS
// ============================================================================

/**
 * Protocolos seguros permitidos para enlaces e imágenes en la plataforma.
 * @constant {Array<string>}
 */
const SAFE_PROTOCOLS = ['http:', 'https:', 'data:'];

/**
 * Valida y desinfecta una URL para evitar inyecciones como `javascript:...` o `vbscript:...`.
 * 
 * @function sanitizeUrl
 * @param {string} url - URL a validar.
 * @param {string} [fallbackUrl=''] - URL alternativa si la original no es segura.
 * @returns {string} URL segura o fallbackUrl.
 */
export function sanitizeUrl(url, fallbackUrl = '') {
    if (!url || typeof url !== 'string') return fallbackUrl;

    const trimmed = url.trim();

    // Rutas relativas seguras (/uploads/..., assets/..., index.html, etc.)
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
        // Bloquear rutas con caracteres peligrosos
        if (trimmed.includes('javascript:') || trimmed.includes('<') || trimmed.includes('>')) {
            return fallbackUrl;
        }
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed, window.location.origin);
        if (!SAFE_PROTOCOLS.includes(parsed.protocol)) {
            console.warn(`⚠️ [SecurityUtils] Protocolo bloqueado por seguridad: ${parsed.protocol}`);
            return fallbackUrl;
        }
        
        // Si es un data: URI, solo permitir formatos multimedia válidos
        if (parsed.protocol === 'data:') {
            const isMediaData = /^data:(image\/(jpeg|png|webp|gif)|video\/(mp4|webm));base64,/i.test(trimmed);
            if (!isMediaData) {
                console.warn(`⚠️ [SecurityUtils] Data URI no multimedia bloqueado`);
                return fallbackUrl;
            }
        }

        return trimmed;
    } catch {
        // Si la URL no es parseable como URL absoluta o relativa válida
        return fallbackUrl;
    }
}

// ============================================================================
// 3. SEGURIDAD DE ARCHIVOS MULTIMEDIA (MAGIC BYTES & MIME TYPES)
// ============================================================================

/**
 * Firmas binarias (Magic Bytes) de formatos de archivo seguros permitidos.
 * @constant {Object.<string, Array<number>>}
 */
const MAGIC_BYTE_SIGNATURES = {
    // JPEG: FF D8 FF
    jpeg: [0xFF, 0xD8, 0xFF],
    // PNG: 89 50 4E 47
    png: [0x89, 0x50, 0x4E, 0x47],
    // GIF: 47 49 46 38 (GIF87a o GIF89a)
    gif: [0x47, 0x49, 0x46, 0x38],
    // WebP: RIFF ... WEBP (52 49 46 46)
    webp: [0x52, 0x49, 0x46, 0x47],
    // PDF: 25 50 44 46 (%PDF)
    pdf: [0x25, 0x50, 0x44, 0x46]
};

/**
 * Verifica si los primeros bytes de un ArrayBuffer o Uint8Array coinciden con la firma real del tipo de archivo.
 * 
 * @function verifyFileMagicBytes
 * @param {ArrayBuffer|Uint8Array} buffer - Buffer de bytes del archivo.
 * @param {'image'|'pdf'|'video'} [expectedCategory='image'] - Categoría esperada.
 * @returns {boolean} True si la firma binaria corresponde a un formato seguro conocido.
 */
export function verifyFileMagicBytes(buffer, expectedCategory = 'image') {
    if (!buffer) return false;

    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer.slice(0, 16));
    if (bytes.length < 4) return false;

    // Verificar firmas conocidas
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
    const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46; // RIFF header
    const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF

    // MP4 / MOV (ftyp box): los bytes 4 a 7 son 'ftyp' (0x66 0x74 0x79 0x70)
    const isMp4 = bytes.length >= 8 && 
        bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
    
    // WebM: encabezado EBML (1A 45 DF A3)
    const isWebm = bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3;

    if (expectedCategory === 'image') {
        return isJpeg || isPng || isGif || isWebp;
    }
    if (expectedCategory === 'pdf') {
        return isPdf;
    }
    if (expectedCategory === 'video') {
        return isMp4 || isWebm;
    }

    return isJpeg || isPng || isGif || isWebp || isPdf || isMp4 || isWebm;
}

/**
 * Valida un archivo cargado en el navegador (tamaño, tipo MIME y Magic Bytes).
 * 
 * @async
 * @function validateUploadedFile
 * @param {File} file - Archivo seleccionado por el usuario.
 * @param {Object} [options]
 * @param {number} [options.maxSizeMB=5] - Tamaño máximo permitido en Megabytes.
 * @param {Array<string>} [options.allowedTypes] - Lista blanca de tipos MIME.
 * @param {'image'|'pdf'|'video'} [options.category='image'] - Categoría de archivo.
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateUploadedFile(file, options = {}) {
    const {
        maxSizeMB = 5,
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        category = 'image'
    } = options;

    if (!file) {
        return { valid: false, error: 'No se ha proporcionado ningún archivo.' };
    }

    // 1. Verificación de tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return { 
            valid: false, 
            error: `El archivo excede el tamaño máximo permitido de ${maxSizeMB} MB (Tamaño actual: ${(file.size / (1024 * 1024)).toFixed(2)} MB).` 
        };
    }

    // 2. Verificación de tipo MIME declarado
    const fileType = (file.type || '').toLowerCase();
    if (allowedTypes.length > 0 && !allowedTypes.includes(fileType)) {
        return { 
            valid: false, 
            error: `Formato de archivo no admitido (${fileType || 'desconocido'}). Se permiten: ${allowedTypes.join(', ')}.` 
        };
    }

    // 3. Verificación de Magic Bytes (firma binaria real)
    try {
        const slice = file.slice(0, 16);
        const arrayBuffer = await slice.arrayBuffer();
        const magicValid = verifyFileMagicBytes(arrayBuffer, category);
        if (!magicValid) {
            return { 
                valid: false, 
                error: 'El contenido binario del archivo no coincide con un formato multimedia válido y seguro.' 
            };
        }
    } catch (err) {
        console.warn('⚠️ [SecurityUtils] No se pudo verificar Magic Bytes:', err);
    }

    return { valid: true };
}

// ============================================================================
// 4. EXPOSICIÓN GLOBAL EN WINDOW
// ============================================================================

/**
 * Objeto unificado de seguridad exportado en el ámbito global para disponibilidad
 * inmediata en todos los scripts de vistas y componentes MPA.
 */
export const SecurityUtils = {
    escapeHtml,
    sanitizeText,
    sanitizeUrl,
    verifyFileMagicBytes,
    validateUploadedFile
};

if (typeof window !== 'undefined') {
    window.SecurityUtils = SecurityUtils;
    window.escapeHtml = escapeHtml;
}

export default SecurityUtils;
