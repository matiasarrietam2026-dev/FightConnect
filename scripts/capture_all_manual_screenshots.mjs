import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9225;
const BASE_URL = "http://localhost:5173";
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'manual', 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.msgId = 1;
        this.callbacks = new Map();
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = reject;
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.id && this.callbacks.has(data.id)) {
                    const { resolve, reject } = this.callbacks.get(data.id);
                    this.callbacks.delete(data.id);
                    if (data.error) reject(data.error);
                    else resolve(data.result);
                }
            };
        });
    }

    send(method, params = {}, timeoutMs = 8000) {
        return new Promise((resolve, reject) => {
            const id = this.msgId++;
            const timer = setTimeout(() => {
                if (this.callbacks.has(id)) {
                    this.callbacks.delete(id);
                    reject(new Error(`CDP command ${method} timed out after ${timeoutMs}ms`));
                }
            }, timeoutMs);
            this.callbacks.set(id, {
                resolve: (val) => { clearTimeout(timer); resolve(val); },
                reject: (err) => { clearTimeout(timer); reject(err); }
            });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async evaluate(expression, retries = 2) {
        try {
            const res = await this.send('Runtime.evaluate', {
                expression,
                returnByValue: true,
                awaitPromise: true
            });
            if (res.exceptionDetails) {
                throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
            }
            return res.result?.value;
        } catch (err) {
            const msg = String(err.message || JSON.stringify(err));
            if (retries > 0 && (msg.includes('navigated') || msg.includes('destroyed') || msg.includes('-32000'))) {
                await sleep(1000);
                return this.evaluate(expression, retries - 1);
            }
            throw err;
        }
    }

    async navigate(url) {
        await this.send('Page.navigate', { url });
        await sleep(1400);
        try {
            await this.evaluate(`(() => {
                window.alert = () => {};
                window.confirm = () => true;
            })()`);
        } catch (e) {}
    }

    async captureScreenshot(filename) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' });
        const filePath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
        console.log(`📸 Captura guardada: ${filename} (${(res.data.length / 1024).toFixed(0)} KB)`);
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

async function captureAllPages() {
    console.log("===============================================================================");
    console.log("📷 GENERANDO CAPTURAS DE PANTALLA OFICIALES PARA EL MANUAL DE USUARIO 📷");
    console.log("===============================================================================");

    const profileDir = path.join(process.cwd(), 'scratch', 'temp_manual_cap_' + Date.now());
    const chromeProc = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--window-size=1280,820',
        `--user-data-dir=${profileDir}`
    ]);

    await sleep(2000);

    let versionInfo;
    for (let i = 0; i < 6; i++) {
        try {
            versionInfo = await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
            break;
        } catch (e) {
            await sleep(1000);
        }
    }

    if (!versionInfo || !versionInfo.webSocketDebuggerUrl) {
        console.error("❌ No se pudo conectar a Chrome DevTools");
        chromeProc.kill();
        process.exit(1);
    }

    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    // Helper para configurar sesión
    const setSession = async (role, name = '', uid = 'user_demo_1', extra = {}) => {
        await client.evaluate(`((role, name, uid, extra) => {
            if (role === 'guest') {
                localStorage.clear();
                return;
            }
            localStorage.setItem('userRole', role);
            localStorage.setItem('userName', name);
            localStorage.setItem('userId', uid);
            localStorage.setItem('userEmail', name.toLowerCase().replace(/[^a-z]/g, '') + '@fightconnect.com');
            if (role === 'fighter') {
                localStorage.setItem('fighterDiscipline', 'MMA');
                localStorage.setItem('fighterWeight', '77 KG');
                localStorage.setItem('fighterDivision', 'PESO WÉLTER');
                localStorage.setItem('fighterRecord', '8 - 1 - 0');
            } else if (role === 'promotion') {
                localStorage.setItem('promoterKybStatus', extra.kybStatus || 'unverified');
            }
        })('${role}', '${name}', '${uid}', ${JSON.stringify(extra)})`);
    };

    // 1. Index (Portal de Acceso)
    console.log("\n[1/21] Capturando Portal de Bienvenida y Login...");
    await client.navigate(`${BASE_URL}/index.html`);
    await setSession('guest');
    await client.navigate(`${BASE_URL}/index.html`);
    await sleep(1200);
    await client.captureScreenshot('01_index_portal.png');

    // 2. FightFeed
    console.log("[2/21] Capturando FightFeed Comunitario...");
    await setSession('fighter', 'CARLOS SILVA', 'fighter_01');
    await client.navigate(`${BASE_URL}/fightfeed.html`);
    await sleep(1200);
    await client.captureScreenshot('02_fightfeed_social.png');

    // 3. Cartelera Local
    console.log("[3/21] Capturando Cartelera Local...");
    await client.navigate(`${BASE_URL}/local.html`);
    await sleep(1200);
    await client.captureScreenshot('03_cartelera_local.png');

    // 4. Cartelera Internacional
    console.log("[4/21] Capturando Cartelera Internacional...");
    await client.navigate(`${BASE_URL}/internacional.html`);
    await sleep(1200);
    await client.captureScreenshot('04_cartelera_internacional.png');

    // 5. Evento Detalle
    console.log("[5/21] Capturando Detalle de Evento...");
    await client.navigate(`${BASE_URL}/evento-detalle.html`);
    await sleep(1200);
    await client.captureScreenshot('05_evento_detalle.png');

    // 6. Noticias
    console.log("[6/21] Capturando Portal de Noticias...");
    await client.navigate(`${BASE_URL}/noticias.html`);
    await sleep(1200);
    await client.captureScreenshot('06_noticias_mma.png');

    // 7. Fighter Dashboard
    console.log("[7/21] Capturando Panel de Peleador...");
    await setSession('fighter', 'ALEX \"EL DEPREDADOR\" ROJAS', 'fighter_pro_1');
    await client.navigate(`${BASE_URL}/fighter-dashboard.html`);
    await sleep(1200);
    await client.captureScreenshot('07_fighter_dashboard.png');

    // 8. Fighter Postulaciones
    console.log("[8/21] Capturando Postulaciones de Peleador...");
    await client.navigate(`${BASE_URL}/fighter-postulaciones.html`);
    await sleep(1200);
    await client.captureScreenshot('08_fighter_postulaciones.png');

    // 9. Fighter Historial
    console.log("[9/21] Capturando Historial y Récord de Peleador...");
    await client.navigate(`${BASE_URL}/fighter-historial.html`);
    await sleep(1200);
    await client.captureScreenshot('09_fighter_historial.png');

    // 10. Fighter Buscar (Oportunidades)
    console.log("[10/21] Capturando Buscador de Combates...");
    await client.navigate(`${BASE_URL}/fighter-buscar.html`);
    await sleep(1200);
    await client.captureScreenshot('10_fighter_buscar.png');

    // 11. Promotor Dashboard (Nivel 0 / Preliminar)
    console.log("[11/21] Capturando Panel de Promotora (Nivel 0)...");
    await setSession('promotion', 'WARRIORS COMBAT PROMOTIONS', 'promo_audit_1', { kybStatus: 'unverified' });
    await client.navigate(`${BASE_URL}/promotor-dashboard.html`);
    await sleep(1200);
    await client.captureScreenshot('11_promotor_dashboard.png');

    // 12. Promotor Ajustes (KYB Radicación)
    console.log("[12/21] Capturando Ajustes de Promotora & Expediente KYB...");
    await client.navigate(`${BASE_URL}/promotor-ajustes.html#kyb-section`);
    await sleep(1200);
    await client.captureScreenshot('12_promotor_ajustes_kyb.png');

    // 13. Promotor Scouting
    console.log("[13/21] Capturando Scouting de Atletas para Promotoras...");
    await client.navigate(`${BASE_URL}/promotor-scouting.html`);
    await sleep(1200);
    await client.captureScreenshot('13_promotor_scouting.png');

    // 14. Fan Dashboard
    console.log("[14/21] Capturando Panel del Fanático...");
    await setSession('fan', 'SEBASTIÁN GÓMEZ', 'fan_demo_1');
    await client.navigate(`${BASE_URL}/fan-dashboard.html`);
    await sleep(1200);
    await client.captureScreenshot('14_fan_dashboard.png');

    // 15. Fan Favoritos
    console.log("[15/21] Capturando Favoritos de Fanático...");
    await client.navigate(`${BASE_URL}/fan-favoritos.html`);
    await sleep(1200);
    await client.captureScreenshot('15_fan_favoritos.png');

    // 16. Fan Buscar
    console.log("[16/21] Capturando Buscador de Aficionados...");
    await client.navigate(`${BASE_URL}/fan-buscar.html`);
    await sleep(1200);
    await client.captureScreenshot('16_fan_buscar.png');

    // 17. Fan Ajustes
    console.log("[17/21] Capturando Ajustes de Perfil de Fanático...");
    await client.navigate(`${BASE_URL}/fan-ajustes.html`);
    await sleep(1200);
    await client.captureScreenshot('17_fan_ajustes.png');

    // 18. Sanciones
    console.log("[18/21] Capturando Comisión Reguladora y Sanciones...");
    await client.navigate(`${BASE_URL}/sanciones.html`);
    await sleep(1200);
    await client.captureScreenshot('18_sanciones_comision.png');

    // 19. Términos
    console.log("[19/21] Capturando Términos y Condiciones Legales...");
    await client.navigate(`${BASE_URL}/terminos.html`);
    await sleep(1200);
    await client.captureScreenshot('19_terminos_legales.png');

    // 20. Privacidad
    console.log("[20/21] Capturando Política de Privacidad...");
    await client.navigate(`${BASE_URL}/privacidad.html`);
    await sleep(1200);
    await client.captureScreenshot('20_privacidad_datos.png');

    // 21. Media Kit
    console.log("[21/21] Capturando Kit de Prensa y Medios...");
    await client.navigate(`${BASE_URL}/media-kit.html`);
    await sleep(1200);
    await client.captureScreenshot('21_media_kit.png');

    // Finalizar proceso de Chrome
    client.close();
    chromeProc.kill();

    try {
        fs.rmSync(profileDir, { recursive: true, force: true });
    } catch (e) {}

    console.log("\n===============================================================================");
    console.log("🎉 ¡LAS 21 CAPTURAS DE PANTALLA FUERON GENERADAS CON ÉXITO EN PUBLIC/MANUAL/! 🎉");
    console.log("===============================================================================\n");
}

captureAllPages().catch(console.error);
