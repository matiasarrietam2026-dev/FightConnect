import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const destDir = path.join(process.cwd(), 'public', 'manual', 'screenshots');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

const pages = [
    { file: 'fightfeed.html', output: '02_fightfeed_social.png' },
    { file: 'internacional.html', output: '04_cartelera_internacional.png' },
    { file: 'evento-detalle.html', output: '05_evento_detalle.png' },
    { file: 'noticias.html', output: '06_noticias_mma.png' },
    { file: 'fighter-postulaciones.html', output: '08_fighter_postulaciones.png' },
    { file: 'fighter-historial.html', output: '09_fighter_historial.png' },
    { file: 'fighter-buscar.html', output: '10_fighter_buscar.png' },
    { file: 'promotor-scouting.html', output: '13_promotor_scouting.png' },
    { file: 'fan-favoritos.html', output: '15_fan_favoritos.png' },
    { file: 'fan-buscar.html', output: '16_fan_buscar.png' },
    { file: 'sanciones.html', output: '18_sanciones_comision.png' },
    { file: 'privacidad.html', output: '20_privacidad_datos.png' },
    { file: 'media-kit.html', output: '21_media_kit.png' }
];

console.log('Capturando páginas restantes...');
for (const p of pages) {
    const dest = path.join(destDir, p.output);
    const url = `http://localhost:5173/${p.file}`;
    console.log(`📸 Capturando ${p.file} -> ${p.output}...`);
    const res = spawnSync(CHROME, [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--window-size=1280,820',
        '--screenshot=' + dest,
        url
    ], { timeout: 15000 });
    
    if (fs.existsSync(dest)) {
        console.log(`  ✅ Guardado: ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`);
    } else {
        console.log(`  ⚠️ No se pudo generar para ${p.file}`);
    }
}

console.log('Proceso de captura completado.');
