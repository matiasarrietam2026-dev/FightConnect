/**
 * Automated Verification for Fan Favorites Purging and Date Constraints
 */
const fs = require('fs');
const vm = require('vm');

// Mock browser environment
const localStorageData = {};
const localStorageMock = {
    getItem: (k) => localStorageData[k] || null,
    setItem: (k, v) => { localStorageData[k] = String(v); },
    removeItem: (k) => { delete localStorageData[k]; },
    clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

let alertCalled = false;
let alertMsg = '';
const alertMock = (msg) => {
    alertCalled = true;
    alertMsg = msg;
};

// Extract relevant logic from js/app.js to verify in isolation
const appCode = fs.readFileSync('js/app.js', 'utf8');

// Test the actual functions from app.js
const sandbox = {
    localStorage: localStorageMock,
    alert: alertMock,
    console: console,
    Date: Date,
    JSON: JSON,
    Array: Array,
    Object: Object,
    parseInt: parseInt,
    isNaN: isNaN,
    String: String,
    RegExp: RegExp,
    db: null,
    window: {}
};

vm.createContext(sandbox);

// Execute helper extraction
const scriptToRun = `
${appCode.match(/const MESES_ES_DICT =[\s\S]*?function toggleSeguirEvento[\s\S]*?return isNowSaved;\s*\}/)[0]}

this.parseFechaEventoToDate = parseFechaEventoToDate;
this.esEventoVigenteOFuturo = esEventoVigenteOFuturo;
this.esEventoEnCursoOHoy = esEventoEnCursoOHoy;
this.obtenerEventosFavoritos = obtenerEventosFavoritos;
this.guardarEventosFavoritos = guardarEventosFavoritos;
this.toggleSeguirEvento = toggleSeguirEvento;
`;

vm.runInContext(scriptToRun, sandbox);

console.log('--- TEST 1: Parsing Dates ---');
const dateOct10 = sandbox.parseFechaEventoToDate('SÁBADO, 10 OCTUBRE 2026');
console.log('Parsed "SÁBADO, 10 OCTUBRE 2026":', dateOct10 ? dateOct10.toISOString() : 'null');
if (!dateOct10) throw new Error('Failed to parse Spanish text date');

console.log('\n--- TEST 2: Evaluating Event Status with System Date ---');
const refDate = new Date('2026-10-12T21:15:00-05:00'); // Moment of user request

const pastEvent = {
    id: 'bjj-one-grappling-sub',
    titulo: 'ONE Fight Night: World Submission Grappling',
    fecha: 'SÁBADO, 10 OCTUBRE 2026',
    fechaIso: '2026-10-10T19:00:00Z',
    ubicacion: 'Bangkok, Tailandia'
};

const futureEvent = {
    id: 'bjj-polaris-30',
    titulo: 'Polaris 30: World Squads Championship',
    fecha: 'SÁBADO, 17 OCTUBRE 2026',
    fechaIso: '2026-10-17T18:00:00Z',
    ubicacion: 'Londres, Reino Unido'
};

const ongoingEvent = {
    id: 'live-fight-tonight',
    titulo: 'Noche de Combate en Vivo',
    fecha: 'LUNES, 12 OCTUBRE 2026',
    fechaIso: '2026-10-12T20:00:00-05:00',
    ubicacion: 'Medellín, Colombia'
};

const isPastVigente = sandbox.esEventoVigenteOFuturo(pastEvent, refDate);
const isFutureVigente = sandbox.esEventoVigenteOFuturo(futureEvent, refDate);
const isOngoingVigente = sandbox.esEventoVigenteOFuturo(ongoingEvent, refDate);
const isOngoingLive = sandbox.esEventoEnCursoOHoy(ongoingEvent, refDate);

console.log('Past event (10 Oct 2026) vigente?:', isPastVigente, '(Expected: false)');
console.log('Future event (17 Oct 2026) vigente?:', isFutureVigente, '(Expected: true)');
console.log('Ongoing event (12 Oct 2026) vigente?:', isOngoingVigente, '(Expected: true)');
console.log('Ongoing event is live/today?:', isOngoingLive, '(Expected: true)');

if (isPastVigente !== false) throw new Error('Past event was marked as vigente!');
if (isFutureVigente !== true) throw new Error('Future event was NOT marked as vigente!');
if (isOngoingVigente !== true) throw new Error('Ongoing event was NOT marked as vigente!');

console.log('\n--- TEST 3: Auto-Purge from Local Storage & Favorites ---');
const testUid = 'user_fan_123';
localStorageData['userId'] = testUid;
localStorageData['userRole'] = 'fan';

// Seed favorites with both past and future events
const initialFavorites = [pastEvent, futureEvent, ongoingEvent];
localStorageData[`fightconnect_fan_fav_events_${testUid}`] = JSON.stringify(initialFavorites);

console.log('Pre-filter count in localStorage:', JSON.parse(localStorageData[`fightconnect_fan_fav_events_${testUid}`]).length);

// Call obtenerEventosFavoritos
const retrieved = sandbox.obtenerEventosFavoritos(testUid);
console.log('Post-filter count returned:', retrieved.length);
console.log('IDs in favorites now:', retrieved.map(e => e.id));

const storedNow = JSON.parse(localStorageData[`fightconnect_fan_fav_events_${testUid}`]);
console.log('IDs in localStorage now:', storedNow.map(e => e.id));

if (storedNow.some(e => e.id === 'bjj-one-grappling-sub')) {
    throw new Error('Past event was NOT purged from localStorage!');
}
if (!storedNow.some(e => e.id === 'bjj-polaris-30')) {
    throw new Error('Future event was mistakenly removed!');
}

console.log('\n--- TEST 4: Attempting to Follow a Concluded Event ---');
alertCalled = false;
alertMsg = '';
const followResult = sandbox.toggleSeguirEvento(pastEvent, testUid);
console.log('Follow result on past event:', followResult, '(Expected: false)');
console.log('Alert shown to user:', alertMsg);

if (followResult !== false) {
    throw new Error('User was able to follow a past event!');
}
if (!alertCalled) {
    throw new Error('No alert was shown when trying to follow a past event!');
}

console.log('\n✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
