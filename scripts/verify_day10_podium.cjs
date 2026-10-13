const fs = require('fs');
const path = require('path');

console.log("=== VERIFICACIÓN DE REGLAS DE NEGOCIO: PODIO DEL DÍA 10 EN FIGHTFEED ===");

// 1. Simulación de fechas
function getPodiumState(testDate) {
    const isDay10 = (testDate.getDate() === 10);
    const currentDay = testDate.getDate();
    let daysUntil10 = 0;
    let nextMonthName = '';

    if (currentDay < 10) {
        daysUntil10 = 10 - currentDay;
        nextMonthName = testDate.toLocaleDateString('es-ES', { month: 'long' });
    } else {
        const next10Date = new Date(testDate.getFullYear(), testDate.getMonth() + 1, 10);
        const diffTime = next10Date.getTime() - testDate.getTime();
        daysUntil10 = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        nextMonthName = next10Date.toLocaleDateString('es-ES', { month: 'long' });
    }

    return {
        isDay10,
        currentDay,
        daysUntil10,
        nextMonthName
    };
}

// Test 1: Día que NO es 10 (ej. Día 12)
const oct12 = new Date(2026, 9, 12); // 12 de Octubre
const stateOct12 = getPodiumState(oct12);
console.log("\n--- TEST 1: Estado el 12 de Octubre (NO es día 10) ---");
console.log("¿Muestra podio con pedestales?:", stateOct12.isDay10, "(Esperado: false)");
console.log("Días que faltan para el próximo día 10:", stateOct12.daysUntil10, "días");
if (stateOct12.isDay10 !== false) throw new Error("Fallo: El podio no debe mostrarse el día 12.");

// Test 2: Día 10 oficial (10 de Octubre)
const oct10 = new Date(2026, 9, 10); // 10 de Octubre
const stateOct10 = getPodiumState(oct10);
console.log("\n--- TEST 2: Estado el 10 de Octubre (SÍ es día 10 oficial) ---");
console.log("¿Muestra podio con pedestales?:", stateOct10.isDay10, "(Esperado: true)");
if (stateOct10.isDay10 !== true) throw new Error("Fallo: El podio debe mostrarse el día 10.");

// Test 4: Top 10 cálculo con predicciones, votos y participaciones
console.log("\n--- TEST 4: Clasificación del Top 10 con los mejores puntajes ---");
const benchmarkAnalysts = [
    { name: "Carlos 'El Tanque' Mendoza", pts: 1245 },
    { name: "Academia Gracie BJJ", pts: 1120 },
    { name: "Dr. Marcos Valdés", pts: 995 },
    { name: "Diego 'Pitbull' Rivas", pts: 880 },
    { name: "Sofia Restrepo MMA", pts: 790 },
    { name: "Team Alpha Bogotá", pts: 715 },
    { name: "Mateo Torres Pick'em", pts: 650 },
    { name: "Laura 'La Cobra' Gómez", pts: 590 },
    { name: "Octagon Master VIP", pts: 520 },
    { name: "Striking Coach Medellín", pts: 460 }
];

const myUser = { name: "Olivo P (Tú)", pts: 1320, isMe: true };
const allCompetitors = [myUser, ...benchmarkAnalysts].sort((a, b) => b.pts - a.pts).slice(0, 10);

console.log("Total de clasificados en el podio:", allCompetitors.length, "(Esperado: 10)");
console.log("1º Lugar (Campeón Oro):", allCompetitors[0].name, "-", allCompetitors[0].pts, "pts");
console.log("2º Lugar (Plata):", allCompetitors[1].name, "-", allCompetitors[1].pts, "pts");
console.log("3º Lugar (Bronce):", allCompetitors[2].name, "-", allCompetitors[2].pts, "pts");
console.log("Puestos 4 al 10:", allCompetitors.slice(3).map((c, i) => `${i + 4}º: ${c.name} (${c.pts} pts)`).join(', '));

if (allCompetitors.length !== 10) throw new Error("Fallo: Debe contener exactamente 10 clasificados.");
if (allCompetitors[0].name !== "Olivo P (Tú)") throw new Error("Fallo: El usuario con 1320 pts debe ser el 1º lugar.");

console.log("\n✅ TODAS LAS PRUEBAS DEL PODIO DEL DÍA 10 PASARON EXITOSAMENTE!");
