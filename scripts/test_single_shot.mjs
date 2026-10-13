import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9226;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let data = ''; res.on('data', d => data += d);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function testOne() {
    const profileDir = path.join(process.cwd(), 'public', 'manual', 'temp_prof_' + Date.now());
    const proc = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--window-size=1280,820',
        `--user-data-dir=${profileDir}`
    ]);
    await sleep(2000);
    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
    const page = targets[0];
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const send = (m, p = {}) => new Promise((resolve, reject) => {
        const curId = id++;
        const handler = (evt) => {
            const data = JSON.parse(evt.data);
            if (data.id === curId) {
                ws.removeEventListener('message', handler);
                if (data.error) reject(data.error);
                else resolve(data.result);
            }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method: m, params: p }));
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://localhost:5173/local.html' });
    await sleep(2000);

    console.log('Sending captureScreenshot...');
    const startTime = Date.now();
    const res = await send('Page.captureScreenshot', { format: 'png' });
    console.log('Screenshot done in', Date.now() - startTime, 'ms, bytes:', res.data?.length);

    const outPath = path.join(process.cwd(), 'public', 'manual', 'screenshots', '03_cartelera_local.png');
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    console.log('Saved to:', outPath);

    ws.close();
    proc.kill();
}

testOne().catch(console.error);
