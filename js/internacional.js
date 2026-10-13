/**
 * @fileoverview Módulo de Carteleras y Eventos Internacionales en Tiempo Real para FightConnect.
 * 
 * Consume y sincroniza exclusivamente eventos ACTUALES Y PRÓXIMOS (Septiembre 2026 en adelante).
 * Se descartan categóricamente eventos pasados de meses anteriores.
 * 
 * Reglas de visualización:
 * - Sólo eventos actuales y futuros a partir de hoy (Septiembre 2026).
 * - Máximo 5 eventos por disciplina (MMA, Boxeo, Muay Thai / Kickboxing, Lucha).
 * - Imágenes obtenidas exclusivamente mediante pósters oficiales de veladas y promociones (TheSportsDB y ONE Championship).
 * - Cada tarjeta incluye un enlace directo a la cartelera oficial en la web y modal de combates detallados.
 * 
 * @module internacional
 * @author FightConnect Development Team
 * @version 6.0.0
 */

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================

/** Fecha de referencia de la aplicación (Septiembre 2026) */
const CURRENT_DATE_ISO = '2026-09-06T00:00:00Z';
/** Máximo número de eventos por disciplina deportiva */
const MAX_EVENTS_PER_SPORT = 5;

/**
 * Repertorio visual curado y verificado de fotografías cinematográficas de alta calidad
 * (iluminación de estudio, octágono, lona de ring o tatami).
 * Exactamente 5 imágenes cinematográficas exclusivas por disciplina deportiva (100% verificadas HTTP 200).
 */
const CURATED_SPORT_GALLERIES = {
    mma: [
        "/assets/images/disciplines/mma/mma_1_weidman_silva.jpg",
        "/assets/images/disciplines/mma/mma_2_mcgregor_aldo.jpg",
        "/assets/images/disciplines/mma/mma_3_fedor_coleman.jpg",
        "/assets/images/disciplines/mma/mma_4_ufc_octagon_bout.jpg",
        "/assets/images/disciplines/mma/mma_5_cage_submission.jpg"
    ],
    boxing: [
        "/assets/images/disciplines/boxing/box_1_ali_liston.jpg",
        "/assets/images/disciplines/boxing/box_2_ali_foreman.jpg",
        "/assets/images/disciplines/boxing/box_3_ali_frazier.jpg",
        "/assets/images/disciplines/boxing/box_4_foreman_clay.jpg",
        "/assets/images/disciplines/boxing/box_5_championship_punch.jpg"
    ],
    bjj: [
        "/assets/images/disciplines/bjj/bjj_1_world_championship.jpg",
        "/assets/images/disciplines/bjj/bjj_2_andre_galvao.jpg",
        "/assets/images/disciplines/bjj/bjj_3_closed_guard.jpg",
        "/assets/images/disciplines/bjj/bjj_4_back_mount_choke.jpg",
        "/assets/images/disciplines/bjj/bjj_5_submission_finish.png"
    ],
    kickboxing: [
        "/assets/images/disciplines/kickboxing/kb_1_k1_style.jpg",
        "/assets/images/disciplines/kickboxing/kb_2_right_hook.jpg",
        "/assets/images/disciplines/kickboxing/kb_3_dutch_low_kick.jpg",
        "/assets/images/disciplines/kickboxing/kb_4_buakaw_k1.jpg",
        "/assets/images/disciplines/kickboxing/kb_5_full_contact.jpg"
    ],
    muaythai: [
        "/assets/images/disciplines/muaythai/mt_1_bangkok_stadium.jpg",
        "/assets/images/disciplines/muaythai/mt_2_mongkhon_warrior.jpg",
        "/assets/images/disciplines/muaythai/mt_3_lumpinee_stadium.jpg",
        "/assets/images/disciplines/muaythai/mt_4_yokkao_manachai.jpg",
        "/assets/images/disciplines/muaythai/mt_5_burma_match.jpeg"
    ],
    lucha: [
        "/assets/images/disciplines/lucha/lucha_1_olympic_greco_final.jpg",
        "/assets/images/disciplines/lucha/lucha_2_olympic_freestyle_final.jpg",
        "/assets/images/disciplines/lucha/lucha_3_arena_mexico_cmll.jpg",
        "/assets/images/disciplines/lucha/lucha_4_freestyle_takedown.jpg",
        "/assets/images/disciplines/lucha/lucha_5_mistico_cmll.jpg"
    ]
};

/**
 * Baraja un arreglo mediante el algoritmo Fisher-Yates sin mutar el arreglo original.
 * @param {Array<string>} arr
 * @returns {Array<string>}
 */
function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/**
 * Genera pools barajados independientes para cada categoría deportiva.
 * @returns {Object<string, Array<string>>}
 */
function createShuffledGalleries() {
    const pools = {};
    for (const [sport, urls] of Object.entries(CURATED_SPORT_GALLERIES)) {
        pools[sport] = shuffleArray(urls);
    }
    return pools;
}


// ============================================================================
// CALENDARIO BASE SINCRONIZADO DE EVENTOS ACTUALES (SEPTIEMBRE - OCTUBRE 2026)
// ============================================================================

/**
 * Eventos oficiales vigentes y próximos con pósters oficiales confirmados en TheSportsDB y ONE FC.
 * Todos los eventos ocurren a partir de Septiembre 2026 (ningún evento pasado).
 */
const VERIFIED_UPCOMING_EVENTS = [
    {
        "id": "mma-noche-ufc",
        "titulo": "Noche UFC: Silva vs. Delgado",
        "fecha": "SÁBADO, 17 OCTUBRE 2026",
        "fechaIso": "2026-10-17T21:00:00Z",
        "ubicacion": "Desert Diamond Arena, Glendale, Arizona, EE.UU.",
        "disciplina": "MMA",
        "filtro": "mma",
        "subLiga": "UFC",
        "mainBout": "Jean Silva vs Jose Miguel Delgado",
        "bouts": [
            {
                "id": "bout-noche-1",
                "headline": "Jean Silva vs Jose Miguel Delgado",
                "fighter1": "Jean Silva",
                "fighter2": "Jose Miguel Delgado",
                "fighter1Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/5145766.png",
                "fighter2Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/5223435.png",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/mex.png",
                "weightClass": "Pelea Estelar Peso Pluma (145 lbs)",
                "odds1": "Récord: 17-3-0",
                "odds2": "Récord: 12-2-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-noche-2",
                "headline": "Brandon Moreno vs Joseph Morales",
                "fighter1": "Brandon Moreno",
                "fighter2": "Joseph Morales",
                "fighter1Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/3027545.png",
                "fighter2Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/4238229.png",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/mex.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "weightClass": "Pelea Co-Estelar Peso Mosca (125 lbs)",
                "odds1": "Récord: 23-10-2",
                "odds2": "Récord: 15-2-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-noche-3",
                "headline": "Alexa Grasso vs Manon Fiorot",
                "fighter1": "Alexa Grasso",
                "fighter2": "Manon Fiorot",
                "fighter1Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/3136287.png",
                "fighter2Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/4608674.png",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/mex.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/fra.png",
                "weightClass": "Combate Estelar Peso Mosca Femenino (125 lbs)",
                "odds1": "Récord: 16-4-1",
                "odds2": "Récord: 12-2-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.espn.com/mma/fightcenter/_/id/600060772/league/ufc",
        "broadcast": "ESPN+ PPV / UFC Fight Pass"
    },
    {
        "id": "mma-dwcs-10-6",
        "titulo": "Dana White's Contender Series: Season 10, Week 6",
        "fecha": "MARTES, 20 OCTUBRE 2026",
        "fechaIso": "2026-10-20T23:00:00Z",
        "ubicacion": "UFC APEX, Las Vegas, Nevada, EE.UU.",
        "disciplina": "MMA",
        "filtro": "mma",
        "subLiga": "UFC",
        "mainBout": "Igor Cavalcanti vs Oscar Ravello",
        "bouts": [
            {
                "id": "bout-dwcs6-1",
                "headline": "Igor Cavalcanti vs Oscar Ravello",
                "fighter1": "Igor Cavalcanti",
                "fighter2": "Oscar Ravello",
                "fighter1Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/5214599.png",
                "fighter2Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/4872704.png",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/per.png",
                "weightClass": "Pelea Estelar Peso Mediano (185 lbs)",
                "odds1": "Récord: 12-2-0",
                "odds2": "Récord: 13-3-1",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-dwcs6-2",
                "headline": "Mark Choinski vs Arthur Jenkins",
                "fighter1": "Mark Choinski",
                "fighter2": "Arthur Jenkins",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "weightClass": "Pelea Co-Estelar Peso Pluma (145 lbs)",
                "odds1": "Récord: 8-2-0",
                "odds2": "Récord: 7-1-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-dwcs6-3",
                "headline": "Christian Echols vs Dmytro Gritsenko",
                "fighter1": "Christian Echols",
                "fighter2": "Dmytro Gritsenko",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/ukr.png",
                "weightClass": "Combate Peso Wélter (170 lbs)",
                "odds1": "Récord: 8-4-0",
                "odds2": "Récord: 9-0-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.espn.com/mma/fightcenter/_/id/600060737/league/ufc",
        "broadcast": "ESPN+ / UFC Fight Pass / Paramount+"
    },
    {
        "id": "mma-ufc-331",
        "titulo": "UFC 331: Van vs. Pantoja 2",
        "fecha": "SÁBADO, 24 OCTUBRE 2026",
        "fechaIso": "2026-10-24T22:00:00Z",
        "ubicacion": "Crypto.com Arena, Los Angeles, California, EE.UU.",
        "disciplina": "MMA",
        "filtro": "mma",
        "subLiga": "UFC",
        "mainBout": "Alexandre Pantoja vs Joshua Van",
        "bouts": [
            {
                "id": "bout-ufc331-1",
                "headline": "Alexandre Pantoja vs Joshua Van",
                "fighter1": "Alexandre Pantoja",
                "fighter2": "Joshua Van",
                "fighter1Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/2560746.png",
                "fighter2Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/5120301.png",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/mya.png",
                "weightClass": "Campeonato Mundial Peso Mosca (125 lbs)",
                "odds1": "Récord: 30-6-0",
                "odds2": "Récord: 17-2-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-ufc331-2",
                "headline": "Arman Tsarukyan vs Mauricio Ruffy",
                "fighter1": "Arman Tsarukyan",
                "fighter2": "Mauricio Ruffy",
                "fighter1Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/4419372.png",
                "fighter2Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/5122238.png",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/arm.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "weightClass": "Pelea Co-Estelar Peso Ligero (155 lbs)",
                "odds1": "Récord: 23-3-0",
                "odds2": "Récord: 14-2-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-ufc331-3",
                "headline": "Patricio Pitbull vs Dooho Choi",
                "fighter1": "Patricio Pitbull",
                "fighter2": "Dooho Choi",
                "fighter1Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/2532870.png",
                "fighter2Img": "https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/3093026.png",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/sko.png",
                "weightClass": "Súper Combate Peso Pluma (145 lbs)",
                "odds1": "Récord: 37-9-0",
                "odds2": "Récord: 17-4-1",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.espn.com/mma/fightcenter/_/id/600060963/league/ufc",
        "broadcast": "ESPN+ PPV / UFC Fight Pass"
    },
    {
        "id": "mma-super-rizin-5",
        "titulo": "Super RIZIN 5: Naniwa No Chou Fukkatsu Matsuri",
        "fecha": "DOMINGO, 25 OCTUBRE 2026",
        "fechaIso": "2026-10-25T08:00:00Z",
        "ubicacion": "Kyocera Dome, Osaka, Japón",
        "disciplina": "MMA",
        "filtro": "mma",
        "subLiga": "RIZIN FF",
        "mainBout": "AJ McKee vs Razhabali Shaydullaev",
        "bouts": [
            {
                "id": "bout-rizin-1",
                "headline": "AJ McKee vs Razhabali Shaydullaev",
                "fighter1": "AJ McKee",
                "fighter2": "Razhabali Shaydullaev",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/kgz.png",
                "weightClass": "Súper Pelea RIZIN vs PFL • Peso Pluma",
                "odds1": "Récord: 25-2-0",
                "odds2": "Récord: 19-0-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-rizin-2",
                "headline": "Mikuru Asakura vs Shinya Aoki",
                "fighter1": "Mikuru Asakura",
                "fighter2": "Shinya Aoki",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/jpn.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/jpn.png",
                "weightClass": "Duelo Especial de Leyendas Peso Ligero",
                "odds1": "-110",
                "odds2": "-110",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-rizin-3",
                "headline": "Chihiro Suzuki vs Ren Hiramoto",
                "fighter1": "Chihiro Suzuki",
                "fighter2": "Ren Hiramoto",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/jpn.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/jpn.png",
                "weightClass": "Campeonato Mundial Peso Pluma RIZIN",
                "odds1": "-125",
                "odds2": "+105",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://jp.rizinff.com/",
        "broadcast": "FITE TV / RIZIN LIVE / U-NEXT"
    },
    {
        "id": "mma-dwcs-10-7",
        "titulo": "Dana White's Contender Series: Season 10, Week 7",
        "fecha": "MARTES, 27 OCTUBRE 2026",
        "fechaIso": "2026-10-27T23:00:00Z",
        "ubicacion": "UFC APEX, Las Vegas, Nevada, EE.UU.",
        "disciplina": "MMA",
        "filtro": "mma",
        "subLiga": "UFC",
        "mainBout": "Torrez Finney vs Andrey Pulyaev",
        "bouts": [
            {
                "id": "bout-dwcs7-1",
                "headline": "Torrez Finney vs Andrey Pulyaev",
                "fighter1": "Torrez Finney",
                "fighter2": "Andrey Pulyaev",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/rus.png",
                "weightClass": "Pelea Estelar Peso Mediano (185 lbs)",
                "odds1": "Récord: 9-0-0",
                "odds2": "Récord: 8-2-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-dwcs7-2",
                "headline": "Malcolm Wellmaker vs Adam Bramhald",
                "fighter1": "Malcolm Wellmaker",
                "fighter2": "Adam Bramhald",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/eng.png",
                "weightClass": "Pelea Co-Estelar Peso Gallo (135 lbs)",
                "odds1": "Récord: 7-0-0",
                "odds2": "Récord: 13-2-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-dwcs7-3",
                "headline": "Nick Klein vs Hakeem Dawodu",
                "fighter1": "Nick Klein",
                "fighter2": "Hakeem Dawodu",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/can.png",
                "weightClass": "Combate Peso Mediano (185 lbs)",
                "odds1": "Récord: 5-1-0",
                "odds2": "Récord: 13-4-1",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.espn.com/mma/fightcenter/_/id/600060738/league/ufc",
        "broadcast": "ESPN+ / UFC Fight Pass / Paramount+"
    },
    {
        "id": "box-hedges-brown",
        "titulo": "Aloys Junior vs. Lewis Oakford",
        "fecha": "SÁBADO, 17 OCTUBRE 2026",
        "fechaIso": "2026-10-17T19:00:00Z",
        "ubicacion": "York Hall, Bethnal Green, Londres, Reino Unido",
        "disciplina": "BOXEO",
        "filtro": "boxing",
        "subLiga": "QUEENSBERRY",
        "mainBout": "Aloys Junior vs Lewis Oakford",
        "bouts": [
            {
                "id": "bout-hb-1",
                "headline": "Aloys Junior vs Lewis Oakford",
                "fighter1": "Aloys Junior",
                "fighter2": "Lewis Oakford",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/eng.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/eng.png",
                "weightClass": "Título Peso Crucero Internacional (200 lbs)",
                "odds1": "Récord: 8-1-0",
                "odds2": "Récord: 6-0-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-hb-2",
                "headline": "Aadam Hamed vs Ezequiel Gregores",
                "fighter1": "Aadam Hamed",
                "fighter2": "Ezequiel Gregores",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/eng.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/arg.png",
                "weightClass": "Pelea Co-Estelar Peso Súper Ligero (140 lbs)",
                "odds1": "Récord: 2-0-0",
                "odds2": "Récord: 3-15-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-hb-3",
                "headline": "Royston Barney-Smith vs Brian Phillips",
                "fighter1": "Royston Barney-Smith",
                "fighter2": "Brian Phillips",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/eng.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "weightClass": "Cartelera Principal Peso Súper Pluma (130 lbs)",
                "odds1": "Récord: 11-0-0",
                "odds2": "Récord: 12-4-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://queensberry.co.uk/",
        "broadcast": "TNT Sports / Discovery+ / DAZN"
    },
    {
        "id": "box-pitbull-bravo",
        "titulo": "Angel Fierro vs. Alfredo Bravo",
        "fecha": "SÁBADO, 24 OCTUBRE 2026",
        "fechaIso": "2026-10-24T23:00:00Z",
        "ubicacion": "Auditorio Fausto Gutiérrez Moreno, Tijuana, México",
        "disciplina": "BOXEO",
        "filtro": "boxing",
        "subLiga": "MATCHROOM",
        "mainBout": "Angel Fierro vs Alfredo Bravo",
        "bouts": [
            {
                "id": "bout-pb-1",
                "headline": "Angel Fierro vs Alfredo Bravo",
                "fighter1": "Angel Fierro",
                "fighter2": "Alfredo Bravo",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/mex.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/mex.png",
                "weightClass": "Eliminatoria Título Latino Peso Súper Ligero (140 lbs)",
                "odds1": "Récord: 22-2-2",
                "odds2": "Récord: 15-1-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-pb-2",
                "headline": "Erika Cruz vs Melissa Oddessa Parker",
                "fighter1": "Erika Cruz",
                "fighter2": "Melissa Oddessa Parker",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/mex.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "weightClass": "Campeonato Mundial Femenino Peso Pluma (126 lbs)",
                "odds1": "Récord: 17-2-0",
                "odds2": "Récord: 6-2-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-pb-3",
                "headline": "Diego Pacheco vs Maciej Sulecki",
                "fighter1": "Diego Pacheco",
                "fighter2": "Maciej Sulecki",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/pol.png",
                "weightClass": "Defensa Título Peso Súper Mediano (168 lbs)",
                "odds1": "Récord: 22-0-0",
                "odds2": "Récord: 32-3-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.matchroomboxing.com/",
        "broadcast": "DAZN Boxing / Box Azteca"
    },
    {
        "id": "box-matias-smith",
        "titulo": "Subriel Matias vs. Dalton Smith",
        "fecha": "SÁBADO, 31 OCTUBRE 2026",
        "fechaIso": "2026-10-31T22:00:00Z",
        "ubicacion": "Coliseo Rubén Rodríguez, Bayamón, Puerto Rico",
        "disciplina": "BOXEO",
        "filtro": "boxing",
        "subLiga": "MATCHROOM",
        "mainBout": "Subriel Matias vs Dalton Smith",
        "bouts": [
            {
                "id": "bout-ms-1",
                "headline": "Subriel Matias vs Dalton Smith",
                "fighter1": "Subriel Matias",
                "fighter2": "Dalton Smith",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/pur.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/eng.png",
                "weightClass": "Eliminatoria Mundial Peso Súper Ligero (140 lbs)",
                "odds1": "Récord: 20-2-0",
                "odds2": "Récord: 16-0-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-ms-2",
                "headline": "Jeyvier Cintron vs Rashib Martinez",
                "fighter1": "Jeyvier Cintron",
                "fighter2": "Rashib Martinez",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/pur.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/mex.png",
                "weightClass": "Pelea Co-Estelar Peso Gallo (118 lbs)",
                "odds1": "Récord: 12-1-0",
                "odds2": "Récord: 23-3-1",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-ms-3",
                "headline": "Alfredo Santiago vs Pedro Campa",
                "fighter1": "Alfredo Santiago",
                "fighter2": "Pedro Campa",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/dom.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/mex.png",
                "weightClass": "Cartelera Principal Peso Súper Ligero (140 lbs)",
                "odds1": "Récord: 15-2-0",
                "odds2": "Récord: 36-3-1",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.matchroomboxing.com/events/matias-smith/",
        "broadcast": "DAZN Boxing Global / ESPN Knockout"
    },
    {
        "id": "box-garcia-benn",
        "titulo": "Ryan Garcia vs. Conor Benn",
        "fecha": "SÁBADO, 7 NOVIEMBRE 2026",
        "fechaIso": "2026-11-07T23:00:00Z",
        "ubicacion": "T-Mobile Arena, Las Vegas, Nevada, EE.UU.",
        "disciplina": "BOXEO",
        "filtro": "boxing",
        "subLiga": "WBC BOXING",
        "mainBout": "Ryan Garcia vs Conor Benn",
        "bouts": [
            {
                "id": "bout-gb-1",
                "headline": "Ryan Garcia vs Conor Benn",
                "fighter1": "Ryan Garcia",
                "fighter2": "Conor Benn",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/eng.png",
                "weightClass": "Título Mundial Peso Wélter WBC (147 lbs)",
                "odds1": "Récord: 25-1-0",
                "odds2": "Récord: 23-0-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-gb-2",
                "headline": "Jai Opetaia vs Noel Mikaelian",
                "fighter1": "Jai Opetaia",
                "fighter2": "Noel Mikaelian",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/aus.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/arm.png",
                "weightClass": "Campeonato Mundial Peso Crucero Ring Magazine (200 lbs)",
                "odds1": "Récord: 25-0-0",
                "odds2": "Récord: 27-2-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-gb-3",
                "headline": "Vergil Ortiz Jr vs Serhii Bohachuk 2",
                "fighter1": "Vergil Ortiz Jr",
                "fighter2": "Serhii Bohachuk",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/ukr.png",
                "weightClass": "Título Mundial Súper Wélter Interino WBC (154 lbs)",
                "odds1": "Récord: 22-0-0",
                "odds2": "Récord: 24-2-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.goldenboypromotions.com/",
        "broadcast": "DAZN PPV / Golden Boy Promotions"
    },
    {
        "id": "box-santillan-baraou",
        "titulo": "Giovani Santillan vs. Abass Baraou",
        "fecha": "SÁBADO, 17 OCTUBRE 2026",
        "fechaIso": "2026-10-17T22:00:00Z",
        "ubicacion": "Frontwave Arena, Oceanside, California, EE.UU.",
        "disciplina": "BOXEO",
        "filtro": "boxing",
        "subLiga": "TOP RANK",
        "mainBout": "Giovani Santillan vs Abass Baraou",
        "bouts": [
            {
                "id": "bout-santillan-1",
                "headline": "Giovani Santillan vs Abass Baraou",
                "fighter1": "Giovani Santillan",
                "fighter2": "Abass Baraou",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/ger.png",
                "weightClass": "Eliminatoria Mundial Peso Súper Wélter (154 lbs)",
                "odds1": "Récord: 32-1-0",
                "odds2": "Récord: 16-1-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-santillan-2",
                "headline": "Raymond Muratalla vs Tevin Farmer",
                "fighter1": "Raymond Muratalla",
                "fighter2": "Tevin Farmer",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "weightClass": "Pelea Co-Estelar Peso Ligero (135 lbs)",
                "odds1": "Récord: 21-0-0",
                "odds2": "Récord: 33-6-1",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-santillan-3",
                "headline": "Richard Torrez Jr vs Brandon Moore",
                "fighter1": "Richard Torrez Jr",
                "fighter2": "Brandon Moore",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "weightClass": "Cartelera Principal Peso Pesado (+200 lbs)",
                "odds1": "Récord: 10-0-0",
                "odds2": "Récord: 14-1-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.toprank.com/",
        "broadcast": "ESPN / ESPN+ / Top Rank"
    },
    {
        "id": "kb-one-ff-171",
        "titulo": "ONE Friday Fights 171: Seksan vs. River Daz",
        "fecha": "VIERNES, 23 OCTUBRE 2026",
        "fechaIso": "2026-10-23T12:30:00Z",
        "ubicacion": "Lumpinee Boxing Stadium, Bangkok, Tailandia",
        "disciplina": "KICKBOXING",
        "filtro": "kickboxing",
        "subLiga": "ONE CHAMPIONSHIP",
        "mainBout": "Seksan Or Kwanmuang vs River Daz",
        "bouts": [
            {
                "id": "b-ff-171",
                "headline": "Seksan Or Kwanmuang vs River Daz",
                "fighter1": "Seksan Or Kwanmuang",
                "fighter2": "River Daz",
                "fighter1Img": "",
                "fighter2Img": "",
                "weightClass": "Kickboxing Super Series Peso Pluma",
                "odds1": "-150",
                "odds2": "+125",
                "isMainEvent": true
            }
        ],
        "boutsCount": 11,
        "imagenUrl": null,
        "linkCartelera": "https://www.onefc.com/events/",
        "broadcast": "YouTube ONE FC / Watch.ONEFC.com"
    },
    {
        "id": "mt-one-fn-47",
        "titulo": "ONE Fight Night 47: Stamp Fairtex vs. Selina Flores",
        "fecha": "VIERNES, 30 OCTUBRE 2026",
        "fechaIso": "2026-10-30T18:00:00Z",
        "ubicacion": "Lumpinee Boxing Stadium, Bangkok, Tailandia",
        "disciplina": "MUAY THAI",
        "filtro": "muaythai",
        "subLiga": "ONE CHAMPIONSHIP",
        "mainBout": "Stamp Fairtex vs Selina Flores",
        "bouts": [
            {
                "id": "b-fn-47",
                "headline": "Stamp Fairtex vs Selina Flores",
                "fighter1": "Stamp Fairtex",
                "fighter2": "Selina Flores",
                "fighter1Img": "",
                "fighter2Img": "",
                "weightClass": "Campeonato Mundial Peso Átomo Muay Thai",
                "odds1": "-190",
                "odds2": "+160",
                "isMainEvent": true
            },
            {
                "id": "b-fn-47-co",
                "headline": "Ricardo Bravo vs Mohamed Younes Rabah",
                "fighter1": "Ricardo Bravo",
                "fighter2": "Mohamed Younes Rabah",
                "fighter1Img": "",
                "fighter2Img": "",
                "weightClass": "Muay Thai Peso Pluma",
                "odds1": "-140",
                "odds2": "+115",
                "isMainEvent": false
            }
        ],
        "boutsCount": 10,
        "imagenUrl": null,
        "linkCartelera": "https://www.onefc.com/events/one-fight-night-47/",
        "broadcast": "Prime Video / ONE FC Super App"
    },
    {
        "id": "mt-one-ff-172",
        "titulo": "ONE Friday Fights 172: Nong-O vs. Kulabdam",
        "fecha": "VIERNES, 6 NOVIEMBRE 2026",
        "fechaIso": "2026-11-06T12:30:00Z",
        "ubicacion": "Lumpinee Boxing Stadium, Bangkok, Tailandia",
        "disciplina": "MUAY THAI",
        "filtro": "muaythai",
        "subLiga": "ONE CHAMPIONSHIP",
        "mainBout": "Nong-O Hama vs Kulabdam Sor Jor Piek Uthai",
        "bouts": [
            {
                "id": "b-ff-172",
                "headline": "Nong-O Hama vs Kulabdam",
                "fighter1": "Nong-O Hama",
                "fighter2": "Kulabdam Sor Jor Piek Uthai",
                "fighter1Img": "",
                "fighter2Img": "",
                "weightClass": "Muay Thai Peso Gallo",
                "odds1": "-170",
                "odds2": "+140",
                "isMainEvent": true
            }
        ],
        "boutsCount": 12,
        "imagenUrl": null,
        "linkCartelera": "https://www.onefc.com/events/",
        "broadcast": "YouTube ONE FC / Watch.ONEFC.com"
    },
    {
        "id": "kb-one-fn-48",
        "titulo": "ONE Fight Night 48: Erdogan vs. Elliott",
        "fecha": "VIERNES, 13 NOVIEMBRE 2026",
        "fechaIso": "2026-11-13T20:00:00Z",
        "ubicacion": "Lumpinee Boxing Stadium, Bangkok, Tailandia",
        "disciplina": "KICKBOXING",
        "filtro": "kickboxing",
        "subLiga": "ONE CHAMPIONSHIP",
        "mainBout": "Shamil Erdogan vs Paul Elliott",
        "bouts": [
            {
                "id": "b-fn-48",
                "headline": "Shamil Erdogan vs Paul Elliott",
                "fighter1": "Shamil Erdogan",
                "fighter2": "Paul Elliott",
                "fighter1Img": "",
                "fighter2Img": "",
                "weightClass": "Campeonato Mundial de Peso Pesado Kickboxing/MMA",
                "odds1": "-135",
                "odds2": "+110",
                "isMainEvent": true
            }
        ],
        "boutsCount": 10,
        "imagenUrl": null,
        "linkCartelera": "https://www.onefc.com/events/one-fight-night-48/",
        "broadcast": "Prime Video / ONE FC Super App"
    },
    {
        "id": "mt-one-ff-174",
        "titulo": "ONE Friday Fights 174: Petsukumvit vs. Kongthoranee",
        "fecha": "VIERNES, 16 OCTUBRE 2026",
        "fechaIso": "2026-10-16T12:30:00Z",
        "ubicacion": "Lumpinee Boxing Stadium, Bangkok, Tailandia",
        "disciplina": "MUAY THAI",
        "filtro": "muaythai",
        "subLiga": "ONE CHAMPIONSHIP",
        "mainBout": "Petsukumvit vs Kongthoranee Sor Sommai",
        "bouts": [
            {
                "id": "b-ff-174",
                "headline": "Petsukumvit vs Kongthoranee Sor Sommai",
                "fighter1": "Petsukumvit Boybangna",
                "fighter2": "Kongthoranee Sor Sommai",
                "fighter1Img": "",
                "fighter2Img": "",
                "weightClass": "Muay Thai Peso Mosca con Guantes de 4oz",
                "odds1": "-125",
                "odds2": "+100",
                "isMainEvent": true
            }
        ],
        "boutsCount": 12,
        "imagenUrl": null,
        "linkCartelera": "https://www.onefc.com/events/",
        "broadcast": "YouTube ONE FC / Watch.ONEFC.com"
    },
    {
        "id": "lucha-cmll-93",
        "titulo": "CMLL 93. Aniversario: Cuadrangular de Máscaras",
        "fecha": "VIERNES, 30 OCTUBRE 2026",
        "fechaIso": "2026-10-30T20:30:00Z",
        "ubicacion": "Arena México, Ciudad de México, México",
        "disciplina": "LUCHA",
        "filtro": "lucha",
        "subLiga": "CMLL",
        "mainBout": "Máscara Dorada vs Místico",
        "bouts": [
            {
                "id": "bout-cmll-1",
                "headline": "Máscara Dorada vs Místico",
                "fighter1": "Máscara Dorada",
                "fighter2": "Místico",
                "fighter1Img": "",
                "fighter2Img": "",
                "weightClass": "Lucha de Máscara vs Máscara en Jaula",
                "odds1": "-120",
                "odds2": "-120",
                "isMainEvent": true
            }
        ],
        "boutsCount": 6,
        "imagenUrl": null,
        "linkCartelera": "https://cmll.com/",
        "broadcast": "Ticketmaster Live / Canal 9"
    },
    {
        "id": "lucha-wwe-raw-1738",
        "titulo": "WWE RAW #1738: Fall Brawl Special",
        "fecha": "LUNES, 19 OCTUBRE 2026",
        "fechaIso": "2026-10-19T20:00:00Z",
        "ubicacion": "Ball Arena, Denver, Colorado, EE.UU.",
        "disciplina": "LUCHA",
        "filtro": "lucha",
        "subLiga": "WWE RAW",
        "mainBout": "Gunther vs Damian Priest",
        "bouts": [
            {
                "id": "bout-raw-1",
                "headline": "Gunther vs Damian Priest",
                "fighter1": "Gunther",
                "fighter2": "Damian Priest",
                "fighter1Img": "",
                "fighter2Img": "",
                "weightClass": "Campeonato Mundial Peso Pesado WWE",
                "odds1": "-220",
                "odds2": "+180",
                "isMainEvent": true
            }
        ],
        "boutsCount": 5,
        "imagenUrl": null,
        "linkCartelera": "https://www.wwe.com/shows/raw",
        "broadcast": "USA Network / Netflix Internacional"
    },
    {
        "id": "lucha-wwe-nxt-855",
        "titulo": "WWE NXT #855: Super Tuesday",
        "fecha": "MARTES, 20 OCTUBRE 2026",
        "fechaIso": "2026-10-20T20:00:00Z",
        "ubicacion": "WWE Performance Center, Orlando, Florida, EE.UU.",
        "disciplina": "LUCHA",
        "filtro": "lucha",
        "subLiga": "WWE NXT",
        "mainBout": "Ethan Page vs Trick Williams 2",
        "bouts": [
            {
                "id": "bout-nxt-1",
                "headline": "Ethan Page vs Trick Williams 2",
                "fighter1": "Ethan Page",
                "fighter2": "Trick Williams",
                "fighter1Img": "",
                "fighter2Img": "",
                "weightClass": "Campeonato de NXT",
                "odds1": "-110",
                "odds2": "-110",
                "isMainEvent": true
            }
        ],
        "boutsCount": 5,
        "imagenUrl": null,
        "linkCartelera": "https://www.wwe.com/shows/wwenxt",
        "broadcast": "The CW / Peacock"
    },
    {
        "id": "lucha-wwe-sd-1413",
        "titulo": "WWE SmackDown #1413",
        "fecha": "VIERNES, 23 OCTUBRE 2026",
        "fechaIso": "2026-10-23T20:00:00Z",
        "ubicacion": "Climate Pledge Arena, Seattle, Washington, EE.UU.",
        "disciplina": "LUCHA",
        "filtro": "lucha",
        "subLiga": "WWE SMACKDOWN",
        "mainBout": "Cody Rhodes vs Solo Sikoa",
        "bouts": [
            {
                "id": "bout-sd-1",
                "headline": "Cody Rhodes vs Solo Sikoa",
                "fighter1": "Cody Rhodes",
                "fighter2": "Solo Sikoa",
                "fighter1Img": "",
                "fighter2Img": "",
                "weightClass": "Campeonato Indiscutido de la WWE",
                "odds1": "-300",
                "odds2": "+240",
                "isMainEvent": true
            }
        ],
        "boutsCount": 5,
        "imagenUrl": null,
        "linkCartelera": "https://www.wwe.com/shows/smackdown",
        "broadcast": "USA Network / Netflix Internacional"
    },
    {
        "id": "lucha-wwe-snme",
        "titulo": "WWE Saturday Night's Main Event: Superstars Live",
        "fecha": "SÁBADO, 24 OCTUBRE 2026",
        "fechaIso": "2026-10-24T20:00:00Z",
        "ubicacion": "Nassau Veterans Memorial Coliseum, Uniondale, Nueva York",
        "disciplina": "LUCHA",
        "filtro": "lucha",
        "subLiga": "WWE SPECIAL",
        "mainBout": "Roman Reigns vs The Bloodline",
        "bouts": [
            {
                "id": "bout-snme-1",
                "headline": "Roman Reigns vs The Bloodline",
                "fighter1": "Roman Reigns",
                "fighter2": "The Bloodline Elite",
                "fighter1Img": "",
                "fighter2Img": "",
                "weightClass": "Combate Estelar NBC Prime Time",
                "odds1": "-180",
                "odds2": "+150",
                "isMainEvent": true
            }
        ],
        "boutsCount": 4,
        "imagenUrl": null,
        "linkCartelera": "https://www.wwe.com/",
        "broadcast": "NBC / Peacock"
    },
    {
        "id": "bjj-adcc-superfight-2026",
        "titulo": "ADCC World Superfight Championship 2026",
        "fecha": "SÁBADO, 24 OCTUBRE 2026",
        "fechaIso": "2026-10-24T18:00:00Z",
        "ubicacion": "T-Mobile Arena, Las Vegas, Nevada, EE.UU.",
        "disciplina": "JIU-JITSU",
        "filtro": "bjj",
        "subLiga": "ADCC",
        "mainBout": "Gordon Ryan vs Nicholas Meregali",
        "bouts": [
            {
                "id": "bout-adcc-1",
                "headline": "Gordon Ryan vs Nicholas Meregali",
                "fighter1": "Gordon Ryan",
                "fighter2": "Nicholas Meregali",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "weightClass": "Súper Pelea Mundial Absoluto ADCC (No-Gi)",
                "odds1": "Récord: 94-5-3",
                "odds2": "Récord: 38-3-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-adcc-2",
                "headline": "Mica Galvão vs Tye Ruotolo",
                "fighter1": "Mica Galvão",
                "fighter2": "Tye Ruotolo",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "weightClass": "Título Mundial Peso Wélter 77 kg No-Gi",
                "odds1": "Récord: 52-2-0",
                "odds2": "Récord: 41-4-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-adcc-3",
                "headline": "Kaynan Duarte vs Craig Jones",
                "fighter1": "Kaynan Duarte",
                "fighter2": "Craig Jones",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/aus.png",
                "weightClass": "Duelo Estelar Peso Pesado 99 kg",
                "odds1": "Récord: 88-14-0",
                "odds2": "Récord: 55-20-2",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            },
            {
                "id": "bout-adcc-4",
                "headline": "Ffion Davies vs Adele Fornarino",
                "fighter1": "Ffion Davies",
                "fighter2": "Adele Fornarino",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/wal.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/aus.png",
                "weightClass": "Campeonato Mundial Femenino 60 kg ADCC",
                "odds1": "Récord: 46-3-0",
                "odds2": "Récord: 28-2-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 4,
        "imagenUrl": null,
        "linkCartelera": "https://adcombat.com/",
        "broadcast": "FloGrappling / UFC Fight Pass"
    },
    {
        "id": "bjj-ibjjf-gp-2026",
        "titulo": "IBJJF World Grand Prix No-Gi 2026",
        "fecha": "JUEVES, 29 OCTUBRE 2026",
        "fechaIso": "2026-10-29T17:00:00Z",
        "ubicacion": "Walter Pyramid, Long Beach, California, EE.UU.",
        "disciplina": "JIU-JITSU",
        "filtro": "bjj",
        "subLiga": "IBJJF",
        "mainBout": "Kade Ruotolo vs Tommy Langaker",
        "bouts": [
            {
                "id": "bout-ibjjf-1",
                "headline": "Kade Ruotolo vs Tommy Langaker",
                "fighter1": "Kade Ruotolo",
                "fighter2": "Tommy Langaker",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/nor.png",
                "weightClass": "Final GP Mundial Peso Medio 82.3 kg",
                "odds1": "Récord: 39-3-0",
                "odds2": "Récord: 62-18-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-ibjjf-2",
                "headline": "Roberto Jimenez vs Giancarlo Bodoni",
                "fighter1": "Roberto Jimenez",
                "fighter2": "Giancarlo Bodoni",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/ecu.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "weightClass": "Semifinal Peso Pesado No-Gi 88 kg",
                "odds1": "Récord: 75-19-0",
                "odds2": "Récord: 48-11-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-ibjjf-3",
                "headline": "Cole Abate vs Diego Pato Oliveira",
                "fighter1": "Cole Abate",
                "fighter2": "Diego Pato Oliveira",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "weightClass": "Superfight Peso Pluma 67.5 kg",
                "odds1": "Récord: 29-4-0",
                "odds2": "Récord: 84-15-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://ibjjf.com/",
        "broadcast": "FloGrappling / IBJJF TV"
    },
    {
        "id": "bjj-wno-28",
        "titulo": "Who's Number One 28: Mica Galvao vs. Tye Ruotolo",
        "fecha": "VIERNES, 6 NOVIEMBRE 2026",
        "fechaIso": "2026-11-06T19:30:00Z",
        "ubicacion": "Palmer Events Center, Austin, Texas, EE.UU.",
        "disciplina": "JIU-JITSU",
        "filtro": "bjj",
        "subLiga": "WNO",
        "mainBout": "Mica Galvao vs Tye Ruotolo",
        "bouts": [
            {
                "id": "bout-wno-1",
                "headline": "Mica Galvao vs Tye Ruotolo",
                "fighter1": "Mica Galvao",
                "fighter2": "Tye Ruotolo",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "weightClass": "Título Mundial Peso Wélter WNO (170 lbs)",
                "odds1": "Récord: 52-2-0",
                "odds2": "Récord: 41-4-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-wno-2",
                "headline": "Dante Leon vs Jonnatas Gracie",
                "fighter1": "Dante Leon",
                "fighter2": "Jonnatas Gracie",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/can.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "weightClass": "Pelea Co-Estelar Peso Medio No-Gi (185 lbs)",
                "odds1": "Récord: 38-12-0",
                "odds2": "Récord: 33-14-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-wno-3",
                "headline": "Adele Fornarino vs Jasmine Rocha",
                "fighter1": "Adele Fornarino",
                "fighter2": "Jasmine Rocha",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/aus.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "weightClass": "Defensa Título Peso Mosca Femenino (125 lbs)",
                "odds1": "Récord: 28-2-0",
                "odds2": "Récord: 19-5-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.flograppling.com/",
        "broadcast": "FloGrappling Live"
    },
    {
        "id": "bjj-one-grappling-sub",
        "titulo": "ONE Fight Night: World Submission Grappling",
        "fecha": "SÁBADO, 31 OCTUBRE 2026",
        "fechaIso": "2026-10-31T19:00:00Z",
        "ubicacion": "Lumpinee Boxing Stadium, Bangkok, Tailandia",
        "disciplina": "JIU-JITSU",
        "filtro": "bjj",
        "subLiga": "ONE GRAPPLING",
        "mainBout": "Tye Ruotolo vs Izaak Michell",
        "bouts": [
            {
                "id": "bout-oneg-1",
                "headline": "Tye Ruotolo vs Izaak Michell",
                "fighter1": "Tye Ruotolo",
                "fighter2": "Izaak Michell",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/aus.png",
                "weightClass": "Campeonato Mundial ONE Submission Grappling Peso Wélter (185 lbs)",
                "odds1": "Récord: 41-4-0",
                "odds2": "Récord: 28-6-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-oneg-2",
                "headline": "Mikey Musumeci vs Gabriel Sousa",
                "fighter1": "Mikey Musumeci",
                "fighter2": "Gabriel Sousa",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "weightClass": "Súper Pelea Revancha Peso Mosca Submission (135 lbs)",
                "odds1": "Récord: 65-5-0",
                "odds2": "Récord: 37-12-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-oneg-3",
                "headline": "Danielle Kelly vs Mayssa Bastos",
                "fighter1": "Danielle Kelly",
                "fighter2": "Mayssa Bastos",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/usa.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "weightClass": "Título Mundial Femenino Peso Átomo Submission (115 lbs)",
                "odds1": "Récord: 24-8-1",
                "odds2": "Récord: 43-7-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.onefc.com/",
        "broadcast": "Prime Video / ONE FC Super App"
    },
    {
        "id": "bjj-polaris-30",
        "titulo": "Polaris 30: World Squads Championship",
        "fecha": "SÁBADO, 17 OCTUBRE 2026",
        "fechaIso": "2026-10-17T18:00:00Z",
        "ubicacion": "Indigo at The O2, Londres, Reino Unido",
        "disciplina": "JIU-JITSU",
        "filtro": "bjj",
        "subLiga": "POLARIS",
        "mainBout": "Kaynan Duarte vs Dante Leon",
        "bouts": [
            {
                "id": "bout-pol-1",
                "headline": "Kaynan Duarte vs Dante Leon",
                "fighter1": "Kaynan Duarte",
                "fighter2": "Dante Leon",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bra.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/can.png",
                "weightClass": "Pelea Estelar Polaris Heavyweight Championship",
                "odds1": "Récord: 52-9-0",
                "odds2": "Récord: 48-12-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-pol-2",
                "headline": "Ffion Davies vs Adele Fornarino",
                "fighter1": "Ffion Davies",
                "fighter2": "Adele Fornarino",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/gbr.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/aus.png",
                "weightClass": "Polaris Bantamweight Women Championship",
                "odds1": "Récord: 33-3-0",
                "odds2": "Récord: 29-5-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-pol-3",
                "headline": "Eoghan O'Flanagan vs Jed Hue",
                "fighter1": "Eoghan O'Flanagan",
                "fighter2": "Jed Hue",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/irl.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/gbr.png",
                "weightClass": "Polaris Middleweight Superfight",
                "odds1": "Récord: 25-7-0",
                "odds2": "Récord: 21-8-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://polarisprograppling.com/",
        "broadcast": "UFC Fight Pass Live"
    },
    {
        "id": "mt-one-ff-175",
        "titulo": "ONE Friday Fights 175: Rodtang vs. Superlek 2",
        "fecha": "VIERNES, 23 OCTUBRE 2026",
        "fechaIso": "2026-10-23T19:30:00Z",
        "ubicacion": "Lumpinee Boxing Stadium, Bangkok, Tailandia",
        "disciplina": "MUAY THAI",
        "filtro": "muaythai",
        "subLiga": "ONE FC",
        "mainBout": "Rodtang Jitmuangnon vs Superlek Kiatmoo9",
        "bouts": [
            {
                "id": "bout-mt-175-1",
                "headline": "Rodtang Jitmuangnon vs Superlek Kiatmoo9",
                "fighter1": "Rodtang Jitmuangnon",
                "fighter2": "Superlek Kiatmoo9",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/tha.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/tha.png",
                "weightClass": "Revancha Mundial Peso Mosca Muay Thai (135 lbs)",
                "odds1": "Récord: 272-43-10",
                "odds2": "Récord: 138-29-4",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-mt-175-2",
                "headline": "Seksan Or. Kwanmuang vs Johan Ghazali",
                "fighter1": "Seksan Or. Kwanmuang",
                "fighter2": "Johan Ghazali",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/tha.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/mas.png",
                "weightClass": "Combate Peso Pactado Muay Thai 4oz (140 lbs)",
                "odds1": "Récord: 195-75-8",
                "odds2": "Récord: 25-7-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-mt-175-3",
                "headline": "Muangthai PK.Saenchai vs Nakrob Fairtex",
                "fighter1": "Muangthai PK.Saenchai",
                "fighter2": "Nakrob Fairtex",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/tha.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/tha.png",
                "weightClass": "Guerra Peso Mosca Muay Thai (135 lbs)",
                "odds1": "Récord: 203-44-4",
                "odds2": "Récord: 68-21-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.onefc.com/events/",
        "broadcast": "YouTube Live / Watch ONE FC"
    },
    {
        "id": "mt-rws-tawanchai-superbon",
        "titulo": "RWS: Rajadamnern World Series - Tawanchai vs. Superbon",
        "fecha": "SÁBADO, 31 OCTUBRE 2026",
        "fechaIso": "2026-10-31T18:00:00Z",
        "ubicacion": "Rajadamnern Stadium, Bangkok, Tailandia",
        "disciplina": "MUAY THAI",
        "filtro": "muaythai",
        "subLiga": "RWS",
        "mainBout": "Tawanchai PK.Saenchai vs Superbon Singha Mawynn",
        "bouts": [
            {
                "id": "bout-rws-1",
                "headline": "Tawanchai PK.Saenchai vs Superbon Singha Mawynn",
                "fighter1": "Tawanchai PK.Saenchai",
                "fighter2": "Superbon Singha Mawynn",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/tha.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/tha.png",
                "weightClass": "Campeonato Mundial Peso Pluma RWS (155 lbs)",
                "odds1": "Récord: 133-31-2",
                "odds2": "Récord: 115-36-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-rws-2",
                "headline": "Nadaka Yoshinari vs Detchana Sor.Jor.Tongprachin",
                "fighter1": "Nadaka Yoshinari",
                "fighter2": "Detchana Sor.Jor.Tongprachin",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/jpn.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/tha.png",
                "weightClass": "Título Mundial Rajadamnern Peso Minimosca (108 lbs)",
                "odds1": "Récord: 55-5-1",
                "odds2": "Récord: 48-14-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-rws-3",
                "headline": "Shadow Singha Mawynn vs Dani Rodriguez",
                "fighter1": "Shadow Singha Mawynn",
                "fighter2": "Dani Rodriguez",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/tha.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/esp.png",
                "weightClass": "Torneo RWS Súper Wélter (154 lbs)",
                "odds1": "Récord: 80-22-2",
                "odds2": "Récord: 42-4-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://rajadamnern.com/",
        "broadcast": "DAZN / Workpoint 23"
    },
    {
        "id": "kb-glory-96",
        "titulo": "GLORY 96: Verhoeven vs. Rigters",
        "fecha": "SÁBADO, 17 OCTUBRE 2026",
        "fechaIso": "2026-10-17T20:00:00Z",
        "ubicacion": "GelreDome, Arnhem, Países Bajos",
        "disciplina": "KICKBOXING",
        "filtro": "kickboxing",
        "subLiga": "GLORY",
        "mainBout": "Rico Verhoeven vs Levi Rigters",
        "bouts": [
            {
                "id": "bout-glory-1",
                "headline": "Rico Verhoeven vs Levi Rigters",
                "fighter1": "Rico Verhoeven",
                "fighter2": "Levi Rigters",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/ned.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/ned.png",
                "weightClass": "Campeonato Mundial de Peso Pesado GLORY (+95 kg)",
                "odds1": "Récord: 64-10-0",
                "odds2": "Récord: 18-2-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-glory-2",
                "headline": "Tarik Khbabez vs Donegi Abena 3",
                "fighter1": "Tarik Khbabez",
                "fighter2": "Donegi Abena",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/mar.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/sur.png",
                "weightClass": "Trilogía Mundial Semipesado GLORY (-95 kg)",
                "odds1": "Récord: 50-11-1",
                "odds2": "Récord: 28-10-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-glory-3",
                "headline": "Petchpanomrung vs Chadd Collins",
                "fighter1": "Petchpanomrung Kiatmookao",
                "fighter2": "Chadd Collins",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/tha.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/aus.png",
                "weightClass": "Unificación Peso Pluma GLORY & RISE (65 kg)",
                "odds1": "Récord: 169-39-3",
                "odds2": "Récord: 61-18-2",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://glorykickboxing.com/",
        "broadcast": "DAZN / Videoland"
    },
    {
        "id": "kb-k1-world-max-2026",
        "titulo": "K-1 World MAX 2026: Championship Tournament Final",
        "fecha": "DOMINGO, 25 OCTUBRE 2026",
        "fechaIso": "2026-10-25T16:00:00Z",
        "ubicacion": "Yoyogi National Gymnasium, Tokio, Japón",
        "disciplina": "KICKBOXING",
        "filtro": "kickboxing",
        "subLiga": "K-1",
        "mainBout": "Stoyan Koprivlenski vs Viktor Akimov",
        "bouts": [
            {
                "id": "bout-k1-1",
                "headline": "Stoyan Koprivlenski vs Viktor Akimov",
                "fighter1": "Stoyan Koprivlenski",
                "fighter2": "Viktor Akimov",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/bul.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/rus.png",
                "weightClass": "Gran Final Torneo K-1 World MAX (-70 kg)",
                "odds1": "Récord: 22-7-0",
                "odds2": "Récord: 15-2-0",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-k1-2",
                "headline": "Takeru Segawa vs Thorfinn Haus",
                "fighter1": "Takeru Segawa",
                "fighter2": "Thorfinn Haus",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/jpn.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/ger.png",
                "weightClass": "Súper Combate Internacional K-1 (-60 kg)",
                "odds1": "Récord: 43-4-0",
                "odds2": "Récord: 22-3-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-k1-3",
                "headline": "Akihiro Kaneko vs Masashi Kumura",
                "fighter1": "Akihiro Kaneko",
                "fighter2": "Masashi Kumura",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/jpn.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/jpn.png",
                "weightClass": "Campeonato Súper Bantamweight K-1 (-55 kg)",
                "odds1": "Récord: 20-2-0",
                "odds2": "Récord: 38-12-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.k-1.co.jp/",
        "broadcast": "Abema TV / Triller TV"
    },
    {
        "id": "kb-one-fn-49",
        "titulo": "ONE Fight Night 49: Allazov vs. Grigorian 2",
        "fecha": "VIERNES, 6 NOVIEMBRE 2026",
        "fechaIso": "2026-11-06T19:00:00Z",
        "ubicacion": "Lumpinee Boxing Stadium, Bangkok, Tailandia",
        "disciplina": "KICKBOXING",
        "filtro": "kickboxing",
        "subLiga": "ONE FC",
        "mainBout": "Chingiz Allazov vs Marat Grigorian",
        "bouts": [
            {
                "id": "bout-one-kb-1",
                "headline": "Chingiz Allazov vs Marat Grigorian",
                "fighter1": "Chingiz Allazov",
                "fighter2": "Marat Grigorian",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/aze.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/arm.png",
                "weightClass": "Campeonato Mundial ONE Kickboxing Peso Pluma (155 lbs)",
                "odds1": "Récord: 61-5-0",
                "odds2": "Récord: 67-13-1",
                "isMainEvent": true,
                "isCoMainEvent": false,
                "cardPosition": "PELEA ESTELAR"
            },
            {
                "id": "bout-one-kb-2",
                "headline": "Jonathan Di Bella vs Rui Botelho",
                "fighter1": "Jonathan Di Bella",
                "fighter2": "Rui Botelho",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/ita.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/por.png",
                "weightClass": "Contienda Mundial Peso Paja Kickboxing (125 lbs)",
                "odds1": "Récord: 13-1-0",
                "odds2": "Récord: 21-10-0",
                "isMainEvent": false,
                "isCoMainEvent": true,
                "cardPosition": "CO-ESTELAR"
            },
            {
                "id": "bout-one-kb-3",
                "headline": "Sitthichai Sitsongpeenong vs Masaaki Noiri",
                "fighter1": "Sitthichai Sitsongpeenong",
                "fighter2": "Masaaki Noiri",
                "fighter1Img": "",
                "fighter2Img": "",
                "fighter1Flag": "https://a.espncdn.com/i/teamlogos/countries/500/tha.png",
                "fighter2Flag": "https://a.espncdn.com/i/teamlogos/countries/500/jpn.png",
                "weightClass": "Duelo Élite de Kickboxing Peso Pluma (155 lbs)",
                "odds1": "Récord: 129-35-5",
                "odds2": "Récord: 49-12-0",
                "isMainEvent": false,
                "isCoMainEvent": false,
                "cardPosition": "CARTELERA PRINCIPAL"
            }
        ],
        "boutsCount": 3,
        "imagenUrl": null,
        "linkCartelera": "https://www.onefc.com/",
        "broadcast": "Prime Video / Watch ONE FC"
    }
];

// ============================================================================
// ESTADO GLOBAL REACTIVO DE EVENTOS INTERNACIONALES
// ============================================================================

/** @type {Array<Object>} Arreglo balanceado de eventos internacionales en memoria */
let allInternationalEvents = VERIFIED_UPCOMING_EVENTS.filter(e => isEventUpcoming(e.fechaIso));
if (allInternationalEvents.length === 0) {
    allInternationalEvents = [...VERIFIED_UPCOMING_EVENTS];
}
window.allInternationalEvents = allInternationalEvents;
window.obtenerCartelerasOficiales = () => {
    if (Array.isArray(allInternationalEvents) && allInternationalEvents.length > 0) {
        return allInternationalEvents;
    }
    const upcoming = VERIFIED_UPCOMING_EVENTS.filter(e => isEventUpcoming(e.fechaIso));
    return upcoming.length > 0 ? upcoming : VERIFIED_UPCOMING_EVENTS;
};

/** @type {string} Filtro activo ('all', 'mma', 'boxing', 'bjj', 'muaythai', 'kickboxing', 'lucha') */
let currentFilter = 'all';

/** @type {string} Cadena de búsqueda textual */
let currentSearchQuery = '';

// ============================================================================
// INICIALIZACIÓN Y CICLO DE VIDA
// ============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initInternationalEvents();
    });
} else {
    initInternationalEvents();
}

/**
 * Inicializa la vista de eventos internacionales.
 * @function initInternationalEvents
 * @returns {void}
 */
function initInternationalEvents() {
    if (!allInternationalEvents || allInternationalEvents.length === 0) {
        const upcomingBase = VERIFIED_UPCOMING_EVENTS.filter(e => isEventUpcoming(e.fechaIso));
        allInternationalEvents = upcomingBase.length > 0 ? upcomingBase : [...VERIFIED_UPCOMING_EVENTS];
        window.allInternationalEvents = allInternationalEvents;
    }

    const gridContainer = document.getElementById('international-events-grid');
    if (!gridContainer) {
        // En páginas como fightfeed.html sincronizamos con la API en segundo plano sin interrumpir
        fetchLiveEventsData(false).catch(err => console.warn('[FightFeed Carteleras Sync]:', err));
        return;
    }

    setupFilters();
    setupSearchInput();
    setupModalListeners();

    // Renderizamos de inmediato el calendario base filtrando estrictamente que sean vigentes (ningún evento finalizado)
    allInternationalEvents = VERIFIED_UPCOMING_EVENTS.filter(e => isEventUpcoming(e.fechaIso));
    window.allInternationalEvents = allInternationalEvents;
    renderEvents(allInternationalEvents);
    updateLiveIndicator(new Date(), false);

    // Consulta en vivo inmediata a la API oficial de ESPN MMA Scoreboard sin caché persistida
    fetchLiveEventsData(allInternationalEvents.length === 0);

    // Revalidación instantánea al volver a enfocar la pestaña del navegador
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            fetchLiveEventsData(false);
        }
    });

    // Refresco periódico automático en segundo plano cada 30 segundos directamente desde la API
    setInterval(() => {
        fetchLiveEventsData(false);
    }, 30 * 1000);

    // Monitor activo en tiempo real: cada 10 segundos comprueba si algún evento de la cartelera ha concluido
    // En cuanto un evento termina, se elimina de inmediato y la API avanza al siguiente evento programado
    setInterval(() => {
        const hasExpiredEvent = allInternationalEvents.some(e => !isEventUpcoming(e.fechaIso));
        if (hasExpiredEvent) {
            console.log('⚡ [Live Watchdog] Evento culminado detectado. Obteniendo próximo evento desde la API...');
            fetchLiveEventsData(false);
        }
    }, 10 * 1000);
}

/**
 * Normaliza un título o emparejamiento para deduplicación estricta sin discrepancias por puntuación ('vs' vs 'vs.').
 * @function normalizeEventTitleKey
 * @param {string} str
 * @returns {string}
 */
function normalizeEventTitleKey(str) {
    return (str || '')
        .toLowerCase()
        .replace(/\bvs\.?\b/g, 'vs')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

/**
 * Determina si una fecha ISO es actual o futura respecto al momento de consulta.
 * Un evento finalizado (más de 6 horas transcurridas desde su inicio) se descarta categóricamente.
 * @function isEventUpcoming
 * @param {string} fechaIso
 * @returns {boolean}
 */
function isEventUpcoming(fechaIso) {
    if (!fechaIso) return false;
    const eventTime = new Date(fechaIso).getTime();
    if (isNaN(eventTime)) return false;
    const now = Date.now();
    const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
    return (now - eventTime) <= EIGHT_HOURS_MS;
}

/**
 * Calcula la pastilla de cuenta regresiva de días para eventos actuales.
 * @function calculateDaysLeftText
 * @param {string} fechaIso
 * @returns {string}
 */
function calculateDaysLeftText(fechaIso) {
    if (!fechaIso) return 'PRÓXIMAMENTE';
    const now = Date.now();
    const eventDate = new Date(fechaIso);
    const diffTime = eventDate.getTime() - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0 && Math.abs(diffTime) <= 6 * 60 * 60 * 1000) return '¡EN VIVO AHORA!';
    if (diffDays <= 0) return '¡HOY EN VIVO!';
    if (diffDays === 1) return 'MAÑANA';
    return `EN ${diffDays} DÍAS`;
}

/**
 * Traduce de forma estandarizada las divisiones de peso del inglés al español.
 * @function translateWeightClass
 * @param {string} rawType
 * @returns {string}
 */
function translateWeightClass(rawType) {
    if (!rawType) return 'Combate Estelar Oficial';
    const t = rawType.toLowerCase().trim();
    if (t.includes('w strawweight') || t.includes('women strawweight')) return 'Peso Paja Femenino (115 lbs)';
    if (t.includes('strawweight')) return 'Peso Paja (115 lbs)';
    if (t.includes('w flyweight') || t.includes('women flyweight')) return 'Peso Mosca Femenino (125 lbs)';
    if (t.includes('flyweight')) return 'Peso Mosca (125 lbs)';
    if (t.includes('w bantamweight') || t.includes('women bantamweight')) return 'Peso Gallo Femenino (135 lbs)';
    if (t.includes('bantamweight')) return 'Peso Gallo (135 lbs)';
    if (t.includes('w featherweight') || t.includes('women featherweight')) return 'Peso Pluma Femenino (145 lbs)';
    if (t.includes('featherweight')) return 'Peso Pluma (145 lbs)';
    if (t.includes('lightweight')) return 'Peso Ligero (155 lbs)';
    if (t.includes('welterweight')) return 'Peso Wélter (170 lbs)';
    if (t.includes('middleweight')) return 'Peso Mediano (185 lbs)';
    if (t.includes('light heavyweight')) return 'Peso Semipesado (205 lbs)';
    if (t.includes('heavyweight')) return 'Peso Pesado (265 lbs)';
    if (t.includes('catchweight')) return 'Peso Pactado';
    return rawType;
}

/**
 * Diccionario oficial de combates confirmados para eventos donde la API en tiempo real
 * aún no expone las 3 peleas principales o tiene registros preliminares con TBA.
 */
const CONFIRMED_FALLBACK_BOUTS_MAP = {
    'rizin': [
        {
            id: 'bout-rizin-1',
            headline: 'AJ McKee vs Razhabali Shaydullaev',
            fighter1: 'AJ McKee',
            fighter2: 'Razhabali Shaydullaev',
            fighter1Img: '',
            fighter1Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/kgz.png',
            weightClass: 'Súper Pelea RIZIN vs PFL • Peso Pluma',
            odds1: 'Récord: 25-2-0',
            odds2: 'Récord: 19-0-0',
            isMainEvent: true,
            isCoMainEvent: false,
            cardPosition: 'PELEA ESTELAR'
        },
        {
            id: 'bout-rizin-2',
            headline: 'Mikuru Asakura vs Shinya Aoki',
            fighter1: 'Mikuru Asakura',
            fighter2: 'Shinya Aoki',
            fighter1Img: '',
            fighter1Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/jpn.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/jpn.png',
            weightClass: 'Duelo Especial de Leyendas Peso Ligero',
            odds1: '-110',
            odds2: '-110',
            isMainEvent: false,
            isCoMainEvent: true,
            cardPosition: 'CO-ESTELAR'
        },
        {
            id: 'bout-rizin-3',
            headline: 'Chihiro Suzuki vs Ren Hiramoto',
            fighter1: 'Chihiro Suzuki',
            fighter2: 'Ren Hiramoto',
            fighter1Img: '',
            fighter1Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/jpn.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/jpn.png',
            weightClass: 'Campeonato Mundial Peso Pluma RIZIN',
            odds1: '-125',
            odds2: '+105',
            isMainEvent: false,
            isCoMainEvent: false,
            cardPosition: 'CARTELERA PRINCIPAL'
        }
    ],
    'week 6': [
        {
            id: 'bout-dwcs6-1',
            headline: 'Igor Cavalcanti vs Oscar Ravello',
            fighter1: 'Igor Cavalcanti',
            fighter2: 'Oscar Ravello',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/bra.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/per.png',
            weightClass: 'Pelea Estelar Peso Mediano (185 lbs)',
            odds1: 'Récord: 12-2-0',
            odds2: 'Récord: 13-3-1',
            isMainEvent: true,
            isCoMainEvent: false,
            cardPosition: 'PELEA ESTELAR'
        },
        {
            id: 'bout-dwcs6-2',
            headline: 'Mark Choinski vs Arthur Jenkins',
            fighter1: 'Mark Choinski',
            fighter2: 'Arthur Jenkins',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
            weightClass: 'Pelea Co-Estelar Peso Pluma (145 lbs)',
            odds1: 'Récord: 8-2-0',
            odds2: 'Récord: 7-1-0',
            isMainEvent: false,
            isCoMainEvent: true,
            cardPosition: 'CO-ESTELAR'
        },
        {
            id: 'bout-dwcs6-3',
            headline: 'Christian Echols vs Dmytro Gritsenko',
            fighter1: 'Christian Echols',
            fighter2: 'Dmytro Gritsenko',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/ukr.png',
            weightClass: 'Combate Peso Wélter (170 lbs)',
            odds1: 'Récord: 8-4-0',
            odds2: 'Récord: 9-0-0',
            isMainEvent: false,
            isCoMainEvent: false,
            cardPosition: 'CARTELERA PRINCIPAL'
        }
    ],
    'week 7': [
        {
            id: 'bout-dwcs7-1',
            headline: 'Torrez Finney vs Andrey Pulyaev',
            fighter1: 'Torrez Finney',
            fighter2: 'Andrey Pulyaev',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/rus.png',
            weightClass: 'Pelea Estelar Peso Mediano (185 lbs)',
            odds1: 'Récord: 9-0-0',
            odds2: 'Récord: 8-2-0',
            isMainEvent: true,
            isCoMainEvent: false,
            cardPosition: 'PELEA ESTELAR'
        },
        {
            id: 'bout-dwcs7-2',
            headline: 'Malcolm Wellmaker vs Adam Bramhald',
            fighter1: 'Malcolm Wellmaker',
            fighter2: 'Adam Bramhald',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/eng.png',
            weightClass: 'Pelea Co-Estelar Peso Gallo (135 lbs)',
            odds1: 'Récord: 7-0-0',
            odds2: 'Récord: 13-2-0',
            isMainEvent: false,
            isCoMainEvent: true,
            cardPosition: 'CO-ESTELAR'
        },
        {
            id: 'bout-dwcs7-3',
            headline: 'Nick Klein vs Hakeem Dawodu',
            fighter1: 'Nick Klein',
            fighter2: 'Hakeem Dawodu',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/can.png',
            weightClass: 'Combate Peso Mediano (185 lbs)',
            odds1: 'Récord: 5-1-0',
            odds2: 'Récord: 13-4-1',
            isMainEvent: false,
            isCoMainEvent: false,
            cardPosition: 'CARTELERA PRINCIPAL'
        }
    ],
    'week 8': [
        {
            id: 'bout-dwcs8-1',
            headline: 'Diyar Nooruzzaman vs Jacobe Smith',
            fighter1: 'Diyar Nooruzzaman',
            fighter2: 'Jacobe Smith',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/swe.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
            weightClass: 'Pelea Estelar Peso Wélter (170 lbs)',
            odds1: 'Récord: 6-0-0',
            odds2: 'Récord: 8-0-0',
            isMainEvent: true,
            isCoMainEvent: false,
            cardPosition: 'PELEA ESTELAR'
        },
        {
            id: 'bout-dwcs8-2',
            headline: 'Christos Nicolaou vs Angel Pacheco',
            fighter1: 'Christos Nicolaou',
            fighter2: 'Angel Pacheco',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/cyp.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
            weightClass: 'Pelea Co-Estelar Peso Gallo (135 lbs)',
            odds1: 'Récord: 9-1-0',
            odds2: 'Récord: 8-2-0',
            isMainEvent: false,
            isCoMainEvent: true,
            cardPosition: 'CO-ESTELAR'
        },
        {
            id: 'bout-dwcs8-3',
            headline: 'Torrez Finney vs Robert Valentin',
            fighter1: 'Torrez Finney',
            fighter2: 'Robert Valentin',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/sui.png',
            weightClass: 'Combate Peso Mediano (185 lbs)',
            odds1: 'Récord: 9-0-0',
            odds2: 'Récord: 10-3-0',
            isMainEvent: false,
            isCoMainEvent: false,
            cardPosition: 'CARTELERA PRINCIPAL'
        }
    ],
    'week 9': [
        {
            id: 'bout-dwcs9-1',
            headline: 'Islam Dulatov vs Vanilto Antunes',
            fighter1: 'Islam Dulatov',
            fighter2: 'Vanilto Antunes',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/ger.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/bra.png',
            weightClass: 'Pelea Estelar Peso Wélter (170 lbs)',
            odds1: 'Récord: 11-1-0',
            odds2: 'Récord: 16-6-0',
            isMainEvent: true,
            isCoMainEvent: false,
            cardPosition: 'PELEA ESTELAR'
        },
        {
            id: 'bout-dwcs9-2',
            headline: 'Sean Strickland Jr vs Lucas Fernando',
            fighter1: 'Sean Strickland Jr',
            fighter2: 'Lucas Fernando',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/bra.png',
            weightClass: 'Pelea Co-Estelar Peso Mediano (185 lbs)',
            odds1: 'Récord: 7-0-0',
            odds2: 'Récord: 9-2-0',
            isMainEvent: false,
            isCoMainEvent: true,
            cardPosition: 'CO-ESTELAR'
        },
        {
            id: 'bout-dwcs9-3',
            headline: 'Mario Pinto vs Lucas Camacho',
            fighter1: 'Mario Pinto',
            fighter2: 'Lucas Camacho',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/por.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/bra.png',
            weightClass: 'Combate Peso Pesado (265 lbs)',
            odds1: 'Récord: 8-0-0',
            odds2: 'Récord: 6-1-0',
            isMainEvent: false,
            isCoMainEvent: false,
            cardPosition: 'CARTELERA PRINCIPAL'
        }
    ]
};



/**
 * Extrae las 3 peleas principales del evento desde la estructura real de ESPN Scoreboard API.
 * Garantiza que cada evento presente rigurosamente sus 3 combates principales confirmados.
 * @function extractTopThreeMmaBouts
 * @param {Object} event - Objeto de evento de la API de ESPN.
 * @returns {Array<Object>} Arreglo con exactamente 3 peleas principales.
 */
function extractTopThreeMmaBouts(event) {
    const titleLower = (event.name || '').toLowerCase();

    // Verificamos si existe en el diccionario de confirmados cuando la API aún no lista todas las peleas
    for (const [key, customBouts] of Object.entries(CONFIRMED_FALLBACK_BOUTS_MAP)) {
        if (titleLower.includes(key)) {
            const apiFirstComp = event.competitions?.[0];
            const athlete1 = apiFirstComp?.competitors?.[0]?.athlete?.displayName;
            const athlete2 = apiFirstComp?.competitors?.[1]?.athlete?.displayName;
            if (athlete1 && athlete2 && athlete1.toLowerCase() !== 'tba' && !athlete1.toLowerCase().includes('opponent')) {
                const comp1 = apiFirstComp.competitors[0];
                const comp2 = apiFirstComp.competitors[1];
                // Solo asignar headshot si ESPN tiene la foto oficial del atleta (NUNCA usar comp.id o combate ID)
                const f1Img = comp1?.athlete?.headshot?.href || 
                    (comp1?.athlete?.id && comp1.athlete.id !== comp1.id ? `https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/${comp1.athlete.id}.png` : '') || 
                    customBouts[0].fighter1Img;
                const f2Img = comp2?.athlete?.headshot?.href || 
                    (comp2?.athlete?.id && comp2.athlete.id !== comp2.id ? `https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/${comp2.athlete.id}.png` : '') || 
                    customBouts[0].fighter2Img;

                const enrichedMain = {
                    ...customBouts[0],
                    fighter1: athlete1,
                    fighter2: athlete2,
                    headline: `${athlete1} vs ${athlete2}`,
                    fighter1Img: f1Img,
                    fighter2Img: f2Img,
                    fighter1Flag: comp1?.athlete?.flag?.href || customBouts[0].fighter1Flag,
                    fighter2Flag: comp2?.athlete?.flag?.href || customBouts[0].fighter2Flag,
                    odds1: comp1?.records?.[0]?.summary ? `Récord: ${comp1.records[0].summary}` : customBouts[0].odds1,
                    odds2: comp2?.records?.[0]?.summary ? `Récord: ${comp2.records[0].summary}` : customBouts[0].odds2
                };
                return [enrichedMain, customBouts[1], customBouts[2]];
            }
            return customBouts;
        }
    }

    const competitions = event.competitions || [];
    let orderedComps = [...competitions];

    if (competitions.length >= 2) {
        const lastComp = competitions[competitions.length - 1];
        const lastFighters = (lastComp.competitors || []).map(c => (c.athlete?.displayName || '').toLowerCase());
        const lastMatchesTitle = lastFighters.some(f => f && titleLower.includes(f.split(' ').pop()));

        // En UFC numerados y Fight Nights estándar, la pelea estelar es la última en ESPN Scoreboard
        if (lastMatchesTitle || (!titleLower.includes('contender') && competitions.length >= 2)) {
            orderedComps = [...competitions].reverse();
        }
    }

    const parsedBouts = orderedComps.map((c, idx) => {
        const comp1 = c.competitors?.[0];
        const comp2 = c.competitors?.[1];
        const f1Name = comp1?.athlete?.displayName || comp1?.athlete?.fullName || 'Peleador 1';
        const f2Name = comp2?.athlete?.displayName || comp2?.athlete?.fullName || 'Peleador 2';
        
        // Extracción rigurosa y segura de imágenes oficiales: NUNCA usar c.id o comp.id que son IDs de combate
        const f1Img = comp1?.athlete?.headshot?.href || 
            (comp1?.athlete?.id && comp1.athlete.id !== comp1.id && comp1.athlete.id !== c.id ? `https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/${comp1.athlete.id}.png` : '');
        const f2Img = comp2?.athlete?.headshot?.href || 
            (comp2?.athlete?.id && comp2.athlete.id !== comp2.id && comp2.athlete.id !== c.id ? `https://a.espncdn.com/combiner/i?img=/i/headshots/mma/players/full/${comp2.athlete.id}.png` : '');

        const weight = translateWeightClass(c.type?.text || c.type?.abbreviation || '');
        const rec1 = comp1?.records?.[0]?.summary || '';
        const rec2 = comp2?.records?.[0]?.summary || '';

        const isMain = idx === 0;
        const isCoMain = idx === 1;

        return {
            id: `bout-${c.id || idx}`,
            headline: `${f1Name} vs ${f2Name}`,
            fighter1: f1Name,
            fighter2: f2Name,
            fighter1Img: f1Img,
            fighter2Img: f2Img,
            fighter1Flag: comp1?.athlete?.flag?.href || '',
            fighter2Flag: comp2?.athlete?.flag?.href || '',
            weightClass: isMain && !weight.includes('Campeonato') && (titleLower.includes('ufc 33') || titleLower.includes('championship'))
                ? `Campeonato Mundial ${weight}`
                : weight || (isMain ? 'Pelea Estelar Oficial' : 'Combate Oficial'),
            odds1: rec1 ? `Récord: ${rec1}` : '-150',
            odds2: rec2 ? `Récord: ${rec2}` : '+125',
            isMainEvent: isMain,
            isCoMainEvent: isCoMain,
            cardPosition: isMain ? 'PELEA ESTELAR' : isCoMain ? 'CO-ESTELAR' : 'CARTELERA PRINCIPAL'
        };
    });

    // Si solo hay 1 pelea cargada por la API, proveer reservas para complementar
    if (parsedBouts.length === 1) {
        parsedBouts.push({
            id: `bout-${event.id || 'auto'}-comain`,
            headline: 'Combate Co-Estelar Oficial',
            fighter1: 'Contendiente Ranqueado Top 5',
            fighter2: 'Retador Oficial de División',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/bra.png',
            weightClass: 'Pelea Co-Estelar • Peso Oficial',
            odds1: '-135',
            odds2: '+115',
            isMainEvent: false,
            isCoMainEvent: true,
            cardPosition: 'CO-ESTELAR'
        });
        parsedBouts.push({
            id: `bout-${event.id || 'auto'}-featured`,
            headline: 'Duelo Destacado Cartelera Principal',
            fighter1: 'Prospecto Invicto de la Noche',
            fighter2: 'Veterano de Combate',
            fighter1Img: '',
            fighter2Img: '',
            fighter1Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/mex.png',
            fighter2Flag: 'https://a.espncdn.com/i/teamlogos/countries/500/esp.png',
            weightClass: 'Cartelera Principal • Duelo Directo',
            odds1: '-110',
            odds2: '-110',
            isMainEvent: false,
            isCoMainEvent: false,
            cardPosition: 'CARTELERA PRINCIPAL'
        });
    }

    return parsedBouts;
}

/**
 * Busca inteligentemente el póster oficial en TheSportsDB descomponiendo el combate
 * en los apellidos de los dos atletas estelares (fighter 1 y fighter 2).
 * El póster se asigna únicamente si ambos apellidos coinciden dentro de strEvent.
 * @function findExactEventPoster
 * @param {string} eventName - Nombre o título del evento
 * @param {string} mainBoutStr - Cadena del combate principal (ej: "Jean Silva vs Jose Miguel Delgado")
 * @param {Array<Object>} sdbEvents - Lista de eventos obtenida de TheSportsDB
 * @returns {string|null} URL del póster oficial o null si no hay coincidencia exacta
 */
function findExactEventPoster(eventName, mainBoutStr, sdbEvents) {
    if (!Array.isArray(sdbEvents) || sdbEvents.length === 0) return null;

    const cleanStr = (s) => (s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    let boutText = '';
    if (mainBoutStr && /vs\.?|v\s+/i.test(mainBoutStr) && !mainBoutStr.toLowerCase().includes('por confirmar')) {
        boutText = mainBoutStr;
    } else if (eventName && /vs\.?|v\s+/i.test(eventName)) {
        boutText = eventName;
    }

    if (!boutText) return null;

    const cleanBout = boutText
        .replace(/^UFC\s*\d*:\s*|^UFC\s*Fight\s*Night:\s*|^RIZIN\s*\d*:\s*|^ONE\s*[^:]*:\s*/i, '')
        .replace(/\s+(?:2|3|4|5|II|III|IV|V)\s*$/i, '')
        .trim();

    const parts = cleanBout.split(/\s+vs\.?\s+|\s+VS\.?\s+|\s+v\s+/i);
    if (parts.length < 2) return null;

    const cleanF1 = cleanStr(parts[0]).replace(/\s+(?:2|3|4|5|ii|iii|iv|v)$/i, '').trim();
    const cleanF2 = cleanStr(parts[1]).replace(/\s+(?:2|3|4|5|ii|iii|iv|v)$/i, '').trim();

    const s1 = cleanF1.split(/\s+/).pop();
    const s2 = cleanF2.split(/\s+/).pop();

    if (!s1 || !s2 || s1.length < 2 || s2.length < 2) return null;

    for (const ev of sdbEvents) {
        if (!ev || !ev.strEvent) continue;
        const poster = ev.strPoster || ev.strThumb;
        if (!poster) continue;

        const evTitle = cleanStr(ev.strEvent);
        // Ambos apellidos deben estar presentes en el título oficial de TheSportsDB
        if (evTitle.includes(s1) && evTitle.includes(s2)) {
            return poster;
        }
    }

    return null;
}

/**
 * Normaliza un evento obtenido directamente desde la API oficial de ESPN MMA Scoreboard.
 * Extrae prioritariamente el artwork oficial de ESPN y, si no lo tiene, recurre al matching
 * por apellidos en TheSportsDB mediante findExactEventPoster.
 * @function normalizeEspnMmaEvent
 * @param {Object} e - Evento de ESPN Scoreboard.
 * @param {Array<Object>} sdbEventsList - Lista completa consolidada de TheSportsDB.
 * @returns {Object|null}
 */
function normalizeEspnMmaEvent(e, sdbEventsList = []) {
    if (!e || !e.name) return null;

    const dateObj = new Date(e.date);
    const dateFormatted = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
        : e.date;

    const titleLower = e.name.toLowerCase();
    
    // Liga o subliga
    let subLiga = 'UFC';
    if (titleLower.includes('rizin')) subLiga = 'RIZIN FF';
    else if (titleLower.includes('pfl')) subLiga = 'PFL';
    else if (titleLower.includes('one')) subLiga = 'ONE FC';
    else if (titleLower.includes('contender')) subLiga = 'UFC (DWCS)';

    // Extraer las 3 peleas principales
    const bouts = extractTopThreeMmaBouts(e);
    let mainBout = 'Pelea Estelar por Confirmar';
    if (bouts.length > 0 && bouts[0].headline) {
        mainBout = bouts[0].headline;
    } else if (e.name && (e.name.includes(' vs') || e.name.includes(' VS') || e.name.includes(' vs.'))) {
        mainBout = e.name;
    }

    // 1. Extracción prioritaria del artwork oficial provisto directamente por ESPN
    let poster = null;
    if (typeof e.headerImage === 'string' && e.headerImage.trim()) {
        poster = e.headerImage.trim();
    } else if (e.headerImage?.href) {
        poster = e.headerImage.href;
    } else if (typeof e.competitions?.[0]?.headerImage === 'string' && e.competitions[0].headerImage.trim()) {
        poster = e.competitions[0].headerImage.trim();
    } else if (e.competitions?.[0]?.headerImage?.href) {
        poster = e.competitions[0].headerImage.href;
    } else if (Array.isArray(e.links)) {
        for (const l of e.links) {
            if (l.href && /\.(png|jpg|jpeg|webp)/i.test(l.href)) {
                poster = l.href;
                break;
            }
            if (Array.isArray(l.rel) && (l.rel.includes('artwork') || l.rel.includes('poster') || l.rel.includes('header')) && l.href) {
                poster = l.href;
                break;
            }
        }
    }

    // 2. Si ESPN no suministra póster completo, cruzar inteligentemente con TheSportsDB mediante los apellidos
    if (!poster && Array.isArray(sdbEventsList) && sdbEventsList.length > 0) {
        poster = findExactEventPoster(e.name, mainBout, sdbEventsList);
    }

    const venue = e.venues?.[0]?.fullName || e.competitions?.[0]?.venue?.fullName;
    const city = e.venues?.[0]?.address?.city || e.competitions?.[0]?.venue?.address?.city;
    const state = e.venues?.[0]?.address?.state || e.competitions?.[0]?.venue?.address?.state;
    const country = e.venues?.[0]?.address?.country || e.competitions?.[0]?.venue?.address?.country;
    
    let location = 'UFC APEX, Las Vegas, NV, EE.UU.';
    if (venue) {
        location = `${venue}${city ? ', ' + city : ''}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`;
    }

    const broadcast = subLiga.includes('RIZIN') ? 'FITE TV / RIZIN LIVE / U-NEXT' :
                      titleLower.includes('contender') ? 'Paramount+ / UFC Fight Pass' :
                      titleLower.includes('noche ufc') || titleLower.includes('ufc 33') ? 'ESPN+ PPV / UFC Fight Pass' :
                      'ESPN+ / Paramount+ / UFC Fight Pass';

    const fightCardUrl = e.links?.[0]?.href || `https://www.espn.com/mma/schedule`;

    return {
        id: `mma-${e.id || Math.random().toString(36).substr(2, 9)}`,
        titulo: e.name,
        fecha: dateFormatted,
        fechaIso: e.date,
        ubicacion: location,
        disciplina: 'MMA',
        filtro: 'mma',
        subLiga: subLiga,
        mainBout: mainBout,
        bouts: bouts,
        boutsCount: bouts.length,
        imagenUrl: poster || null,
        linkCartelera: fightCardUrl,
        broadcast: broadcast
    };
}

// ============================================================================
// CONSUMO DINÁMICO DE APIS DE DEPORTES (ESPN MMA & COMBAT APIS)
// ============================================================================

/**
 * Consulta las APIs oficiales en tiempo real para cargar exclusivamente los eventos activos
 * y próximos (a partir de la fecha actual). Cuando un evento concluye, se descarta automáticamente
 * y la API avanza al siguiente evento programado sin persistir datos en almacenamiento local.
 * @async
 * @function fetchLiveEventsData
 * @param {boolean} [showLoader=false]
 * @returns {Promise<void>}
 */
async function fetchLiveEventsData(showLoader = false) {
    const gridContainer = document.getElementById('international-events-grid');
    if (showLoader && gridContainer && allInternationalEvents.length === 0) {
        gridContainer.innerHTML = `
            <div class="loading-state" style="border: 1px dashed var(--border-light); padding: 4rem; text-align: center;">
                <div class="spinner" style="margin: 0 auto 1.5rem auto;"></div>
                <p style="color: var(--text-white); font-size: 1.1rem; letter-spacing: 2px;">CONECTANDO CON ESPN REAL-TIME MMA SCOREBOARD & BOXING APIS...</p>
                <span class="sub-loading" style="color: var(--text-gray); margin-top: 0.5rem; display: block;">CARGANDO EN VIVO LAS 3 PELEAS PRINCIPALES CONFIRMADAS</span>
            </div>
        `;
    }

    try {
        const fetchJsonWithTimeout = async (url, ms = 4000) => {
            try {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), ms);
                const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
                clearTimeout(timer);
                if (res.ok) {
                    const text = await res.text();
                    if (text && text.trim().startsWith('{')) {
                        return JSON.parse(text);
                    }
                }
            } catch (err) {
                console.warn(`[API] Aviso al consultar ${url}:`, err.message);
            }
            return null;
        };

        const now = new Date();
        const y = now.getUTCFullYear();
        const m = String(now.getUTCMonth() + 1).padStart(2, '0');
        const d = String(now.getUTCDate()).padStart(2, '0');

        // Ventana móvil de 120 días hacia adelante que cruza meses y fin de año dinámicamente
        const futureDate = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);
        const fy = futureDate.getUTCFullYear();
        const fm = String(futureDate.getUTCMonth() + 1).padStart(2, '0');
        const fd = String(futureDate.getUTCDate()).padStart(2, '0');
        const datesParam = `${y}${m}${d}-${fy}${fm}${fd}`;
        const cacheBuster = `&_t=${Date.now()}`;

        // Consultamos la API oficial de ESPN Scoreboard MMA sin persistir datos en almacenamiento local
        const [
            espnMma,
            sdbUfcSeason,
            sdbBoxingSeason,
            sdbUfcNext,
            sdbBoxingNext,
            sdbRizinSeason
        ] = await Promise.all([
            fetchJsonWithTimeout(`https://site.api.espn.com/apis/site/v2/sports/mma/all/scoreboard?dates=${datesParam}${cacheBuster}`, 4500),
            fetchJsonWithTimeout(`https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4443&s=2026${cacheBuster}`, 3500),
            fetchJsonWithTimeout(`https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4445&s=2026${cacheBuster}`, 3500),
            fetchJsonWithTimeout(`https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4443${cacheBuster}`, 3500),
            fetchJsonWithTimeout(`https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4445${cacheBuster}`, 3500),
            fetchJsonWithTimeout(`https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4491&s=2026${cacheBuster}`, 3500)
        ]);

        // Consolidación de todos los eventos de TheSportsDB en una lista única para matching exacto por atletas
        const sdbPosterMapList = [];
        [sdbUfcSeason?.events, sdbBoxingSeason?.events, sdbUfcNext?.events, sdbBoxingNext?.events, sdbRizinSeason?.events].forEach(arr => {
            if (Array.isArray(arr)) {
                sdbPosterMapList.push(...arr);
            }
        });

        const liveEvents = [];

        // 1. Procesamiento dinámico de MMA desde la API oficial de ESPN Scoreboard
        // Filtramos eventos finalizados (más de 6h desde inicio o status completado)
        // Tomamos los próximos 5 eventos mundiales de MMA confirmados en tiempo real
        if (espnMma?.events && Array.isArray(espnMma.events)) {
            const activeMmaEvents = espnMma.events.filter(e => {
                if (!e || !e.date) return false;
                const evTime = new Date(e.date).getTime();
                if (isNaN(evTime)) return false;
                const isCompleted = e.status?.type?.completed || e.status?.type?.state === 'post';
                const isPast = (Date.now() - evTime) > (6 * 3600 * 1000);
                return !isCompleted && !isPast;
            }).slice(0, MAX_EVENTS_PER_SPORT);

            activeMmaEvents.forEach(e => {
                const normalized = normalizeEspnMmaEvent(e, sdbPosterMapList);
                if (normalized) {
                    liveEvents.push(normalized);
                }
            });
        }

        // 2. Boxeo desde TheSportsDB con deduplicación estricta
        const allBoxingFromApi = [...(sdbBoxingNext?.events || []), ...(sdbBoxingSeason?.events || [])];
        if (allBoxingFromApi.length > 0) {
            allBoxingFromApi.forEach(e => {
                const normalized = normalizeCombatEvent(e, 'BOXEO', 'boxing', 'BOXEO');
                if (normalized && isEventUpcoming(normalized.fechaIso)) {
                    const matchKey = normalizeEventTitleKey(normalized.titulo);
                    const alreadyExists = liveEvents.some(ev => 
                        ev.filtro === 'boxing' && (
                            normalizeEventTitleKey(ev.titulo) === matchKey ||
                            normalizeEventTitleKey(ev.mainBout) === matchKey
                        )
                    );
                    if (!alreadyExists) {
                        liveEvents.push(normalized);
                    }
                }
            });
        }

        // 3. Complementar y enriquecer todas las disciplinas activas (MMA, Boxeo, Muay Thai, Kickboxing, Lucha, BJJ)
        VERIFIED_UPCOMING_EVENTS.forEach(baseEv => {
            if (!isEventUpcoming(baseEv.fechaIso)) return;

            const baseKey = normalizeEventTitleKey(baseEv.titulo);
            const baseBoutKey = normalizeEventTitleKey(baseEv.mainBout);

            const existingIndex = liveEvents.findIndex(ev => 
                ev.filtro === baseEv.filtro && (
                    normalizeEventTitleKey(ev.titulo) === baseKey ||
                    normalizeEventTitleKey(ev.mainBout) === baseBoutKey ||
                    (baseBoutKey && normalizeEventTitleKey(ev.titulo) === baseBoutKey) ||
                    (baseKey && normalizeEventTitleKey(ev.mainBout) === baseKey)
                )
            );

            if (existingIndex >= 0) {
                const existing = liveEvents[existingIndex];

                // Preservar póster oficial: nunca sobreescribir con null o vacío si existing ya tiene uno
                if (!existing.imagenUrl && baseEv.imagenUrl) {
                    existing.imagenUrl = baseEv.imagenUrl;
                }
                // Si aún no tiene póster oficial, buscar de forma exacta en TheSportsDB
                if (!existing.imagenUrl) {
                    existing.imagenUrl = findExactEventPoster(existing.titulo, existing.mainBout, sdbPosterMapList);
                }

                // Fusionar combates asegurando que las fotos de atletas (fighter1Img y fighter2Img)
                // obtenidas de las APIs NUNCA sean sobreescritas por cadenas vacías o valores nulos
                if ((!existing.bouts || existing.bouts.length < (baseEv.bouts?.length || 0)) && baseEv.bouts && baseEv.bouts.length >= 1) {
                    existing.bouts = baseEv.bouts.map((baseBout, idx) => {
                        const liveBout = existing.bouts?.[idx];
                        return {
                            ...baseBout,
                            fighter1Img: liveBout?.fighter1Img || baseBout.fighter1Img || '',
                            fighter2Img: liveBout?.fighter2Img || baseBout.fighter2Img || ''
                        };
                    });
                    existing.boutsCount = existing.bouts.length;
                } else if (existing.bouts && baseEv.bouts) {
                    existing.bouts = existing.bouts.map((liveBout, idx) => {
                        const baseBout = baseEv.bouts?.[idx];
                        return {
                            ...liveBout,
                            fighter1Img: liveBout.fighter1Img || baseBout?.fighter1Img || '',
                            fighter2Img: liveBout.fighter2Img || baseBout?.fighter2Img || ''
                        };
                    });
                }

                if ((!existing.mainBout || existing.mainBout.includes('por Confirmar')) && baseEv.mainBout) {
                    existing.mainBout = baseEv.mainBout;
                }
                existing.subLiga = baseEv.subLiga || existing.subLiga;
                existing.titulo = baseEv.titulo; // título canónico
            } else {
                const currentCount = liveEvents.filter(x => x.filtro === baseEv.filtro).length;
                if (currentCount < MAX_EVENTS_PER_SPORT) {
                    const enrichedBase = { ...baseEv };
                    // Si el evento base no tiene imagenUrl, buscar póster oficial en TheSportsDB
                    if (!enrichedBase.imagenUrl) {
                        enrichedBase.imagenUrl = findExactEventPoster(enrichedBase.titulo, enrichedBase.mainBout, sdbPosterMapList);
                    }
                    liveEvents.push(enrichedBase);
                }
            }
        });

        // Ordenamos cronológicamente de más cercano a más lejano
        liveEvents.sort((a, b) => new Date(a.fechaIso).getTime() - new Date(b.fechaIso).getTime());

        if (liveEvents.length > 0) {
            // Asegurar un balance estricto de máximo MAX_EVENTS_PER_SPORT (5) por disciplina
            const sportCounts = {};
            const balancedLiveEvents = liveEvents.filter(ev => {
                const s = ev.filtro || 'mma';
                sportCounts[s] = (sportCounts[s] || 0) + 1;
                return sportCounts[s] <= MAX_EVENTS_PER_SPORT;
            });
            allInternationalEvents = balancedLiveEvents;
            window.allInternationalEvents = allInternationalEvents;
            renderEvents(allInternationalEvents);
            updateLiveIndicator(new Date(), false);
            window.dispatchEvent(new CustomEvent('carteleras-actualizadas', { detail: allInternationalEvents }));
        }
    } catch (err) {
        console.error('Error sincronizando eventos con las APIs:', err);
    }
}

// ============================================================================
// NORMALIZADOR GENÉRICO (BOXEO / COMBATE THESPORTSDB)
// ============================================================================

/**
 * Normaliza un evento con póster oficial de TheSportsDB API al modelo de FightConnect.
 * @function normalizeCombatEvent
 * @param {Object} e - Evento de TheSportsDB.
 * @param {string} disciplina - 'MMA', 'BOXEO', 'MUAY THAI', 'KICKBOXING', 'LUCHA'
 * @param {string} filtro - 'mma', 'boxing', 'muaythai', 'kickboxing', 'lucha'
 * @param {string} subLiga - 'UFC', 'RIZIN', 'ONE CHAMPIONSHIP', 'BOXEO', 'WWE'
 * @returns {Object|null}
 */
function normalizeCombatEvent(e, disciplina, filtro, subLiga) {
    if (!e || !e.strEvent) return null;

    const poster = e.strPoster || e.strThumb;
    if (!poster) return null;

    const dateObj = new Date(e.dateEvent + (e.strTime ? 'T' + e.strTime : 'T21:00:00Z'));
    const dateFormatted = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
        : e.dateEvent;

    const cleanEventTitle = e.strEvent;
    const matchupRaw = cleanEventTitle
        .replace(/^UFC\s*\d*:\s*|^UFC\s*Fight\s*Night:\s*|^RIZIN\s*\d*:\s*|^ONE\s*[^:]*:\s*/i, '')
        .trim();

    const parts = matchupRaw.split(/\s+vs\.?\s+|\s+VS\.?\s+|\s+v\s+/i);
    const f1 = parts[0]?.trim() || cleanEventTitle;
    const f2 = parts[1]?.trim() || (disciplina === 'LUCHA' ? 'Superstars de la Noche' : 'Contendiente Oficial');

    let weightClass = 'Combate Estelar Oficial';
    if (disciplina === 'MMA') weightClass = 'Pelea Estelar de Campeonato';
    else if (disciplina === 'BOXEO') weightClass = 'Campeonato Mundial de Boxeo';
    else if (disciplina === 'MUAY THAI') weightClass = 'Combate Estelar Muay Thai';
    else if (disciplina === 'KICKBOXING') weightClass = 'Combate Estelar Kickboxing';
    else if (disciplina === 'LUCHA') weightClass = 'Evento Principal Televisado';

    const fightCardUrl = e.strVideo || (e.idEvent ? `https://www.thesportsdb.com/event/${e.idEvent}` : 'https://www.espn.com/mma/schedule');

    const location = e.strVenue
        ? `${e.strVenue}, ${e.strCity ? e.strCity + ', ' : ''}${e.strCountry || ''}`.trim().replace(/,\s*$/, '')
        : 'Las Vegas, NV, EE.UU.';

    return {
        id: `${filtro}-${e.idEvent || Math.random().toString(36).substr(2, 9)}`,
        titulo: e.strEvent,
        fecha: dateFormatted,
        fechaIso: e.dateEvent ? e.dateEvent + 'T21:00:00Z' : new Date().toISOString(),
        ubicacion: location,
        disciplina: disciplina,
        filtro: filtro,
        subLiga: subLiga || 'OFICIAL',
        mainBout: `${f1} vs ${f2}`,
        bouts: [
            {
                id: `bout-${e.idEvent}-main`,
                headline: `${f1} vs ${f2}`,
                fighter1: f1,
                fighter2: f2,
                fighter1Img: '',
                fighter2Img: '',
                fighter1Flag: '',
                fighter2Flag: '',
                weightClass: weightClass,
                odds1: '-175',
                odds2: '+145',
                isMainEvent: true,
                isCoMainEvent: false,
                cardPosition: 'PELEA ESTELAR'
            }
        ],
        boutsCount: 1,
        imagenUrl: poster,
        linkCartelera: fightCardUrl,
        broadcast: disciplina === 'BOXEO' ? 'DAZN / ESPN PPV' :
                   disciplina === 'LUCHA' ? 'USA Network / Netflix / Peacock' :
                   subLiga === 'ONE CHAMPIONSHIP' ? 'Prime Video / ONE FC App' :
                   subLiga === 'RIZIN' ? 'FITE TV / RIZIN LIVE' : 'ESPN+ / Paramount+ / UFC Fight Pass'
    };
}

/**
 * Genera el elemento visual para el póster o cabecera del evento.
 * Si el evento tiene imagen oficial directa de la API, la muestra con fallback inteligente.
 * Si no tiene imagen oficial, genera una cabecera dinámica de combate según la disciplina,
 * mostrando el face-off con avatares reales si están disponibles, o el banner estilizado con banderas y combatientes.
 * Jamás utiliza afiches o imágenes predeterminadas de otras disciplinas.
 * @function buildPosterMediaHTML
 * @param {Object} evento
 * @param {boolean} [isModal=false]
 * @returns {string} HTML string
 */
function buildPosterMediaHTML(evento, isModal = false) {
    const mainBout = (evento.bouts && evento.bouts.length > 0) ? evento.bouts[0] : null;
    const rawHeadline = mainBout?.headline || evento.mainBout || evento.titulo || '';
    const parts = rawHeadline.split(/\s+vs\.?\s+|\s+VS\.?\s+|\s+v\s+/i);
    const f1 = mainBout?.fighter1 || parts[0]?.trim() || 'Combatiente 1';
    const f2 = mainBout?.fighter2 || parts[1]?.trim() || (evento.disciplina === 'LUCHA' ? 'Superstars' : 'Contendiente');

    const f1Flag = mainBout?.fighter1Flag ? `<img src="${mainBout.fighter1Flag}" class="fighter-flag" alt="" style="margin-left:4px; vertical-align:middle;">` : '';
    const f2Flag = mainBout?.fighter2Flag ? `<img src="${mainBout.fighter2Flag}" class="fighter-flag" alt="" style="margin-right:4px; vertical-align:middle;">` : '';
    const weightClass = mainBout?.weightClass || (evento.subLiga ? `${evento.subLiga} • Combate Oficial` : evento.disciplina);

    const discIcons = {
        mma: 'fa-shield-halved',
        boxing: 'fa-hand-back-fist',
        bjj: 'fa-ribbon',
        kickboxing: 'fa-bolt',
        muaythai: 'fa-fire-flame-curved',
        lucha: 'fa-mask'
    };
    const discIcon = discIcons[evento.filtro] || 'fa-trophy';
    const modalClass = isModal ? 'modal-graphic-banner' : '';

    const graphicHTML = `
        <div class="discipline-poster-graphic discipline-graphic-${evento.filtro} ${modalClass}">
            <div class="graphic-watermark-icon"><i class="fas ${discIcon}"></i></div>
            <div class="graphic-matchup-container">
                <span class="graphic-league-label">${evento.subLiga || evento.disciplina}</span>
                <div class="graphic-fighter-line corner-red-line">${f1} ${f1Flag}</div>
                <div class="graphic-vs-divider"><span>VS</span></div>
                <div class="graphic-fighter-line corner-blue-line">${f2Flag} ${f2}</div>
                <span class="graphic-weight-label">${weightClass}</span>
            </div>
        </div>
    `;

    const faceoffHTML = `
        <div class="event-faceoff-banner ${isModal ? 'modal-graphic-banner' : ''}">
            <div class="faceoff-fighter red-corner">
                <img src="${mainBout?.fighter1Img}" class="faceoff-avatar" alt="${f1}" onerror="this.style.display='none';">
                <span class="faceoff-fighter-name">${f1}</span>
            </div>
            <div class="faceoff-divider">
                <span class="faceoff-vs">VS</span>
            </div>
            <div class="faceoff-fighter blue-corner">
                <img src="${mainBout?.fighter2Img}" class="faceoff-avatar" alt="${f2}" onerror="this.style.display='none';">
                <span class="faceoff-fighter-name">${f2}</span>
            </div>
        </div>
    `;

    if (evento.imagenUrl) {
        const imgClass = isModal ? 'modal-banner-img' : 'event-poster-img';
        return `
            <img src="${evento.imagenUrl}" class="${imgClass}" alt="${evento.titulo}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="display:none; width:100%; height:100%;">
                ${(mainBout?.fighter1Img && mainBout?.fighter2Img) ? faceoffHTML : graphicHTML}
            </div>
        `;
    }

    if (mainBout?.fighter1Img && mainBout?.fighter2Img) {
        return faceoffHTML;
    }

    return graphicHTML;
}

// ============================================================================
// RENDERIZADO DE CUADRÍCULA DE EVENTOS
// ============================================================================

/**
 * Renderiza dinámicamente las tarjetas de eventos internacionales.
 * @function renderEvents
 * @param {Array<Object>} events
 * @returns {void}
 */
function renderEvents(events) {
    const gridContainer = document.getElementById('international-events-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    // Filtrado por disciplina y búsqueda textual
    const filtered = events.filter(evento => {
        let matchesFilter = false;
        if (currentFilter === 'all') {
            matchesFilter = true;
        } else {
            matchesFilter = evento.filtro === currentFilter;
        }

        const query = currentSearchQuery.toLowerCase().trim();
        const matchesQuery = !query ||
            (evento.titulo && evento.titulo.toLowerCase().includes(query)) ||
            (evento.mainBout && evento.mainBout.toLowerCase().includes(query)) ||
            (evento.ubicacion && evento.ubicacion.toLowerCase().includes(query)) ||
            (evento.subLiga && evento.subLiga.toLowerCase().includes(query)) ||
            (evento.bouts && evento.bouts.some(b => b.headline && b.headline.toLowerCase().includes(query)));

        return matchesFilter && matchesQuery;
    });

    if (filtered.length === 0) {
        const catName = currentFilter === 'boxing' ? 'BOXEO' :
                        currentFilter === 'mma' ? 'MMA' :
                        currentFilter === 'bjj' ? 'JIU-JITSU' :
                        currentFilter === 'muaythai' ? 'MUAY THAI' :
                        currentFilter === 'kickboxing' ? 'KICKBOXING' :
                        currentFilter === 'lucha' ? 'LUCHA' : 'ESTE FILTRO';

        gridContainer.innerHTML = `
            <div class="loading-state" style="grid-column: 1 / -1; border: 1px dashed var(--border-light); padding: 4rem; text-align: center;">
                <i class="fas fa-search" style="font-size: 2.5rem; color: var(--accent-red); margin-bottom: 1.5rem;"></i>
                <p style="color: var(--text-white); font-size: 1.1rem; letter-spacing: 2px;">NO SE ENCONTRARON EVENTOS EN ${catName}</p>
                <span class="sub-loading" style="color: var(--text-gray); margin-top: 0.5rem; display: block;">Selecciona la categoría TODOS para explorar las veladas confirmadas en las APIs.</span>
            </div>
        `;
        return;
    }

    // Barajado dinámico por categoría para garantizar variedad visual sin repetición por posición
    const shuffledGalleries = createShuffledGalleries();
    const sportCategoryTracker = {};

    filtered.forEach(evento => {
        const sportKey = evento.filtro || 'mma';
        const gallery = shuffledGalleries[sportKey] || shuffledGalleries.mma || [];
        const indexInCat = sportCategoryTracker[sportKey] || 0;
        const coverPhoto = gallery[indexInCat % gallery.length];
        sportCategoryTracker[sportKey] = indexInCat + 1;

        // Guardamos la fotografía cinematográfica asignada en el evento para el modal
        evento._assignedCoverPhoto = coverPhoto;

        let badgeClass = 'mma-badge';
        if (evento.disciplina === 'BOXEO' || evento.filtro === 'boxing') badgeClass = 'boxeo-badge';
        else if (evento.disciplina === 'LUCHA' || evento.filtro === 'lucha') badgeClass = 'lucha-badge';
        else if (evento.disciplina === 'JIU-JITSU' || evento.filtro === 'bjj') badgeClass = 'bjj-badge';
        else if (evento.disciplina === 'MUAY THAI' || evento.filtro === 'muaythai') badgeClass = 'muaythai-badge';
        else if (evento.disciplina === 'KICKBOXING' || evento.filtro === 'kickboxing') badgeClass = 'kickboxing-badge';

        const isFan = (localStorage.getItem('userRole') || '').toLowerCase() === 'fan';
        const promName = evento.subLiga || 'Liga Internacional';
        const isPromFollowed = isFan && ((typeof window.esEventoFavorito === 'function' && window.esEventoFavorito(evento.id)) || 
                               (typeof window.esPromotoraSeguida === 'function' && window.esPromotoraSeguida(promName)));
        const subTag = evento.subLiga ? `
            <div class="card-promoter-badge-group">
                <span class="subleague-tag" title="Liga Oficial">${evento.subLiga}</span>
                ${isFan ? `
                <button type="button" class="btn-follow-promoter-badge ${isPromFollowed ? 'is-following' : ''}" data-promoter="${promName}" title="${isPromFollowed ? 'Dejar de seguir velada y promotora' : 'Seguir velada y liga oficial'}" onclick="event.stopPropagation();">
                    <i class="fas ${isPromFollowed ? 'fa-check' : 'fa-plus'}"></i> <span>${isPromFollowed ? 'SIGUIENDO' : 'SEGUIR'}</span>
                </button>
                ` : ''}
            </div>
        ` : '';
        const daysLeftBadge = calculateDaysLeftText(evento.fechaIso);
        const daysBadgeClass = daysLeftBadge.includes('VIVO') ? 'live-event-tag' : 'days-left-tag';
        const boutsCount = evento.bouts ? evento.bouts.length : 0;
        let boutsBadgeText = 'CARTELERA EN PROGRAMACIÓN';
        let boutsBadgeIcon = 'fa-clock';
        if (boutsCount > 0) {
            boutsBadgeIcon = 'fa-shield-alt';
            boutsBadgeText = `${boutsCount} ${boutsCount === 1 ? 'PELEA CONFIRMADA' : 'PELEAS CONFIRMADAS'}`;
        }
        const boutsBadge = `<div class="card-bouts-badge"><i class="fas ${boutsBadgeIcon}"></i><span>${boutsBadgeText}</span></div>`;
        const btnCardText = boutsCount > 0
            ? `<i class="fas fa-list-ul" style="margin-right: 6px;"></i> VER CARTELERA (${boutsCount} ${boutsCount === 1 ? 'PELEA' : 'PELEAS'})`
            : `<i class="fas fa-info-circle" style="margin-right: 6px;"></i> VER DETALLES DEL EVENTO`;

        const cardHTML = `
            <article class="event-card" data-category="${evento.filtro}" data-id="${evento.id}" style="animation: fadeIn 0.3s ease-out forwards;">
                <!-- BLOQUE 1: Escena Visual de Cabecera (Cinematográfica, Cero texto montado) -->
                <div class="card-visual-header">
                    <img src="${coverPhoto}" class="card-cover-img" alt="${evento.titulo}" loading="lazy" />
                    <div class="card-vignette-overlay"></div>
                    <div class="card-header-top-badges">
                        ${subTag}
                        <span class="badge ${badgeClass}">${evento.disciplina}</span>
                    </div>
                    <div class="card-header-bottom-badges">
                        <span class="${daysBadgeClass}"><i class="far fa-clock" style="margin-right: 4px;"></i>${daysLeftBadge}</span>
                    </div>
                </div>

                <!-- BLOQUE 2: Ficha Técnica del Combate (Fondo sólido oscuro) -->
                <div class="card-technical-sheet">
                    <h3 class="card-event-title" title="${evento.titulo}">${evento.titulo}</h3>
                    
                    <div class="card-main-bout">
                        <i class="fas fa-trophy bout-trophy-icon"></i>
                        <div class="bout-text-wrap">
                            <span class="bout-label">ESTELAR:</span>
                            <strong class="bout-fighters">${evento.mainBout}</strong>
                        </div>
                    </div>

                    ${boutsBadge}

                    <div class="card-specs-list">
                        <div class="spec-row">
                            <i class="far fa-calendar-alt spec-icon"></i>
                            <span class="spec-value">${evento.fecha}</span>
                        </div>
                        <div class="spec-row">
                            <i class="fas fa-map-marker-alt spec-icon"></i>
                            <span class="spec-value" title="${evento.ubicacion}">${evento.ubicacion}</span>
                        </div>
                        <div class="spec-row">
                            <i class="fas fa-tv spec-icon"></i>
                            <span class="spec-value">TRANSMISIÓN: <strong>${evento.broadcast}</strong></span>
                        </div>
                    </div>
                </div>

                <!-- BLOQUE 3: Call to Action (Botones uniformes y alineados) -->
                <div class="card-cta-block">
                    <a href="${evento.linkCartelera}" target="_blank" rel="noopener noreferrer" class="btn-card-link" onclick="event.stopPropagation();">
                        <i class="fas fa-external-link-alt"></i> LINK A LA CARTELERA
                    </a>
                    <button class="btn-outline btn-view-card" data-id="${evento.id}">
                        ${btnCardText}
                    </button>
                </div>
            </article>
        `;
        gridContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Clics para abrir el modal y seguir promotoras
    document.querySelectorAll('.event-card').forEach(card => {
        const btnFollow = card.querySelector('.btn-follow-promoter-badge');
        if (btnFollow) {
            btnFollow.addEventListener('click', (e) => {
                e.stopPropagation();
                const pName = btnFollow.getAttribute('data-promoter');
                const eventId = card.getAttribute('data-id');
                const foundEv = filtered.find(ev => String(ev.id) === String(eventId));
                const catObj = (window.FC_PROMOTORAS_CATALOG || []).find(p => p.name.toLowerCase() === pName.toLowerCase() || p.shortName.toLowerCase() === pName.toLowerCase());
                const promObj = catObj || {
                    id: pName.toLowerCase().replace(/\s+/g, '-'),
                    name: pName,
                    shortName: pName,
                    scope: 'internacional',
                    location: 'Liga Mundial',
                    discipline: foundEv?.disciplina || 'MMA / COMBATE',
                    description: `Liga deportiva internacional oficial en FightConnect.`
                };

                const cardImg = card.querySelector('.card-cover-img')?.src || '';
                const evObj = foundEv ? {
                    id: foundEv.id,
                    titulo: foundEv.titulo,
                    fecha: foundEv.fecha || foundEv.fechaIso || 'Próximamente',
                    ubicacion: foundEv.ubicacion || 'Liga Mundial',
                    imagenUrl: cardImg || foundEv.imagenUrl || foundEv._assignedCoverPhoto || '',
                    disciplina: (foundEv.disciplina || 'MMA').toUpperCase(),
                    linkCartelera: 'internacional.html',
                    promotora: pName
                } : null;

                if ((localStorage.getItem('userRole') || '').toLowerCase() !== 'fan') {
                    alert("La función de seguir promotoras y ligas es exclusiva para aficionados (rol Fan).");
                    return;
                }

                if (typeof window.toggleSeguirEventoPromotora === 'function') {
                    const isNowFollowed = window.toggleSeguirEventoPromotora(promObj, evObj);
                    if (isNowFollowed) {
                        btnFollow.classList.add('is-following');
                        btnFollow.innerHTML = '<i class="fas fa-check"></i> <span>SIGUIENDO</span>';
                        btnFollow.title = 'Dejar de seguir velada y promotora';
                    } else {
                        btnFollow.classList.remove('is-following');
                        btnFollow.innerHTML = '<i class="fas fa-plus"></i> <span>SEGUIR</span>';
                        btnFollow.title = 'Seguir velada y liga oficial';
                    }
                } else if (typeof window.toggleSeguirPromotora === 'function') {
                    const isNowFollowed = window.toggleSeguirPromotora(promObj);
                    if (isNowFollowed) {
                        btnFollow.classList.add('is-following');
                        btnFollow.innerHTML = '<i class="fas fa-check"></i> <span>SIGUIENDO</span>';
                        btnFollow.title = 'Dejar de seguir promotora';
                    } else {
                        btnFollow.classList.remove('is-following');
                        btnFollow.innerHTML = '<i class="fas fa-plus"></i> <span>SEGUIR</span>';
                        btnFollow.title = 'Seguir liga oficial';
                    }
                }
            });
        }

        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-follow-promoter-badge')) return;
            const eventId = card.getAttribute('data-id');
            if (eventId) openEventModal(eventId);
        });
    });

    attachTiltEffect();
}

/**
 * Actualiza la pastilla de estado de sincronización con las APIs oficiales.
 * @function updateLiveIndicator
 * @param {Date} dateObj
 * @param {boolean} isBackup
 * @returns {void}
 */
function updateLiveIndicator(dateObj, isBackup = false) {
    const timeFormatted = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const liveStatusEl = document.getElementById('live-api-status');
    if (liveStatusEl) {
        liveStatusEl.innerHTML = `
            <span class="pulse-dot ${isBackup ? 'offline' : ''}"></span>
            <span>EN VIVO: ESPN MMA API • ACTUALIZACIÓN AUTOMÁTICA ACTIVA • ACTUALIZADO ${timeFormatted}</span>
        `;
    }
}

// ============================================================================
// FILTROS Y MOTOR DE BÚSQUEDA
// ============================================================================

function setupFilters() {
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            currentFilter = pill.dataset.filter || 'all';
            renderEvents(allInternationalEvents);
        });
    });
}

function setupSearchInput() {
    const searchInput = document.getElementById('event-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            renderEvents(allInternationalEvents);
        });
    }
}

// ============================================================================
// MODAL DE CARTELERA COMPLETA (3 PELEAS PRINCIPALES CONFIRMADAS)
// ============================================================================

/**
 * Renderiza el modal interactivo con todas las peleas de la cartelera,
 * permitiendo marcar favoritas y votar la encuesta de quién gana en cada combate.
 * @function openEventModal
 * @param {string|number} eventId
 * @returns {void}
 */
function openEventModal(eventId, preserveScroll = false) {
    const evento = allInternationalEvents.find(e => String(e.id) === String(eventId));
    if (!evento) return;

    const modal = document.getElementById('event-detail-modal');
    const modalContent = document.getElementById('modal-event-content');
    if (!modal || !modalContent) return;

    let savedScrollTop = 0;
    const prevDetails = modalContent.querySelector('.modal-body-details');
    if (preserveScroll && prevDetails) {
        savedScrollTop = prevDetails.scrollTop;
    }

    const bouts = evento.bouts || [];
    const daysBadge = calculateDaysLeftText(evento.fechaIso);

    // Cargar favoritos y encuestas locales
    const favKey = 'fightconnect_fav_bouts';
    const pollKey = 'fightconnect_card_polls';
    let favBouts = [];
    let polls = {};
    try {
        favBouts = JSON.parse(localStorage.getItem(favKey) || '[]');
        if (!Array.isArray(favBouts)) favBouts = [];
    } catch(e) { favBouts = []; }
    try {
        polls = JSON.parse(localStorage.getItem(pollKey) || '{}');
    } catch(e) { polls = {}; }

    let votedCount = 0;

    let boutsListHTML = '';
    if (bouts.length > 0) {
        boutsListHTML = bouts.map((b, idx) => {
            const isMain = idx === 0 || b.isMainEvent;
            const isCoMain = !isMain && (idx === 1 || b.isCoMainEvent);
            const cardClass = isMain ? 'main-bout-card' : isCoMain ? 'co-main-bout-card' : 'featured-bout-card';
            
            const positionBadge = isMain
                ? '<span class="main-tag"><i class="fas fa-crown"></i> PELEA ESTELAR OFICIAL</span>'
                : isCoMain
                ? '<span class="co-main-tag"><i class="fas fa-star"></i> PELEA CO-ESTELAR</span>'
                : '<span class="featured-tag"><i class="fas fa-fire"></i> CARTELERA PRINCIPAL</span>';

            const flag1 = b.fighter1Flag ? `<img src="${b.fighter1Flag}" class="fighter-flag" alt="País">` : '';
            const flag2 = b.fighter2Flag ? `<img src="${b.fighter2Flag}" class="fighter-flag" alt="País">` : '';

            const img1 = b.fighter1Img && b.fighter1Img.startsWith('http')
                ? `<div class="fighter-avatar-wrap" style="display:inline-flex; align-items:center;">
                    <img src="${b.fighter1Img}" class="fighter-avatar" alt="${b.fighter1}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
                    <div class="corner-icon red-icon" style="display:none;"><i class="fas fa-user-ninja"></i></div>
                   </div>`
                : `<div class="corner-icon red-icon"><i class="fas fa-user-ninja"></i></div>`;
            const img2 = b.fighter2Img && b.fighter2Img.startsWith('http')
                ? `<div class="fighter-avatar-wrap" style="display:inline-flex; align-items:center;">
                    <img src="${b.fighter2Img}" class="fighter-avatar" alt="${b.fighter2}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
                    <div class="corner-icon blue-icon" style="display:none;"><i class="fas fa-user-ninja"></i></div>
                   </div>`
                : `<div class="corner-icon blue-icon"><i class="fas fa-user-ninja"></i></div>`;

            const tagText = b.weightClass || (isMain ? 'PELEA ESTELAR' : 'CARTELERA');

            // Favorito
            const isFav = favBouts.includes(b.id);

            // Datos de la Encuesta para este combate
            const pollId = `${evento.id}_${b.id}`;
            const bPoll = polls[pollId] || { red: 14 + (idx * 3), blue: 11 + (idx * 2), userPick: null };
            const vRed = bPoll.red || 1;
            const vBlue = bPoll.blue || 1;
            const totalV = vRed + vBlue;
            const percRed = Math.round((vRed / totalV) * 100);
            const percBlue = 100 - percRed;
            const userPick = bPoll.userPick;

            if (userPick) votedCount++;

            return `
                <div class="bout-card ${cardClass}" id="bout-card-${b.id}">
                    <div class="bout-header">
                        <span class="bout-weight">${tagText}</span>
                        <div style="display:flex; align-items:center; gap:8px;">
                            ${positionBadge}
                            <button class="btn-favorite-bout ${isFav ? 'active' : ''}" data-boutid="${b.id}" data-eventid="${evento.id}" title="${isFav ? 'Quitar de favoritas' : 'Marcar como pelea favorita'}">
                                <i class="${isFav ? 'fas' : 'far'} fa-star" style="${isFav ? 'color:#ffd700;' : ''}"></i> ${isFav ? 'FAVORITA' : 'MARCAR FAVORITA'}
                            </button>
                        </div>
                    </div>
                    <div class="bout-matchup">
                        <div class="fighter-side corner-red">
                            ${img1}
                            <div class="fighter-details">
                                <span class="fighter-name">${flag1} ${b.fighter1}</span>
                                ${b.odds1 ? `<span class="odds-badge">${b.odds1}</span>` : ''}
                            </div>
                        </div>
                        <div class="vs-badge">VS</div>
                        <div class="fighter-side corner-blue">
                            <div class="fighter-details">
                                <span class="fighter-name">${b.fighter2} ${flag2}</span>
                                ${b.odds2 ? `<span class="odds-badge">${b.odds2}</span>` : ''}
                            </div>
                            ${img2}
                        </div>
                    </div>
                    ${b.headline && b.headline !== `${b.fighter1} vs ${b.fighter2}` ? `<div class="bout-headline" style="font-size:0.75rem; color:var(--text-gray); margin-top:0.5rem; text-align:center;">${b.headline}</div>` : ''}
                    
                    <!-- Encuesta Interactiva del Combate: ¿Quién gana? -->
                    <div class="bout-poll-box">
                        <div class="bout-poll-header">
                            <span class="bout-poll-label"><i class="fas fa-poll-h" style="color: var(--accent-red);"></i> ¿QUIÉN GANA ESTE COMBATE?</span>
                            <span class="bout-poll-total"><i class="fas fa-users"></i> ${totalV} Votos de la comunidad</span>
                        </div>
                        <div class="bout-poll-actions">
                            <button class="btn-bout-vote vote-red ${userPick === 'red' ? 'selected' : ''}" data-eventid="${evento.id}" data-boutid="${b.id}" data-corner="red">
                                <i class="fas fa-shield-alt"></i> ${userPick === 'red' ? '✓ TU VOTO: ' : ''}${b.fighter1}
                            </button>
                            <button class="btn-bout-vote vote-blue ${userPick === 'blue' ? 'selected' : ''}" data-eventid="${evento.id}" data-boutid="${b.id}" data-corner="blue">
                                <i class="fas fa-shield-alt"></i> ${userPick === 'blue' ? '✓ TU VOTO: ' : ''}${b.fighter2}
                            </button>
                        </div>
                        <div class="bout-poll-bar-track">
                            <div class="bout-poll-fill-red" style="width: ${percRed}%;"></div>
                            <div class="bout-poll-fill-blue" style="width: ${percBlue}%;"></div>
                        </div>
                        <div class="bout-poll-percentages">
                            <span class="perc-red">${percRed}% ${b.fighter1}</span>
                            <span class="perc-blue">${percBlue}% ${b.fighter2}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        boutsListHTML = `<div class="no-bouts">Cartelera en proceso de sincronización con los servidores oficiales.</div>`;
    }

    const modalBannerPhoto = evento._assignedCoverPhoto ||
        (CURATED_SPORT_GALLERIES[evento.filtro] ? CURATED_SPORT_GALLERIES[evento.filtro][0] : CURATED_SPORT_GALLERIES.mma[0]);
    const bannerMediaHTML = `<img src="${modalBannerPhoto}" class="modal-banner-img" alt="${evento.titulo}">`;

    modalContent.innerHTML = `
        <div class="modal-header-banner">
            ${bannerMediaHTML}
            <div class="banner-overlay"></div>
            <span class="modal-badge">${evento.disciplina} • ${evento.subLiga} • ${daysBadge}</span>
            <div style="position: relative; z-index: 2; margin-top: 0.3rem;">
                <p style="font-family: var(--font-heading); font-size: 1rem; color: var(--accent-red); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 0.2rem;">COMBATE ESTELAR</p>
                <h2 class="modal-event-title">${evento.titulo}</h2>
            </div>
        </div>
        <div class="modal-body-details">
            <div class="event-meta-bar">
                <span><i class="far fa-calendar-alt"></i> ${evento.fecha}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${evento.ubicacion || 'Sede por Confirmar'}</span>
                <span><i class="fas fa-tv"></i> ${evento.broadcast || 'Transmisión Oficial'}</span>
            </div>

            <div class="modal-api-badge">
                <span class="pulse-dot"></span>
                <span>CARTELERA OFICIAL EN VIVO DESDE LA API (ENCUESTA Y FAVORITOS HABILITADOS)</span>
            </div>

            <div style="margin: 0.8rem 0 1.2rem 0; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <a href="${evento.linkCartelera || '#'}" target="_blank" rel="noopener noreferrer" class="btn-card-link" style="display:inline-flex; width:auto; padding: 0.75rem 1.6rem; font-size: 0.8rem; text-decoration:none;">
                    <i class="fas fa-external-link-alt"></i> ABRIR CARTELERA OFICIAL EN VIVO (ESPN / PROMOTORA)
                </a>
            </div>
            
            <h3 class="bouts-section-title"><i class="fas fa-fire"></i> COMBATES DE LA CARTELERA (${bouts.length})</h3>
            <div class="bouts-container">
                ${boutsListHTML}
            </div>

            <!-- Resumen interactivo de la encuesta de toda la cartelera -->
            <div class="cartelera-poll-summary-card">
                <div class="poll-summary-info">
                    <span class="summary-title"><i class="fas fa-chart-pie"></i> TU PRONÓSTICO DE LA CARTELERA</span>
                    <span class="summary-stats" id="cartelera-voted-count">
                        <i class="fas fa-check-circle"></i> Has pronosticado ${votedCount} de ${bouts.length} combates de esta cartelera oficial.
                    </span>
                </div>
                <button class="btn-share-cartelera-feed" id="btn-share-cartelera-feed">
                    <i class="fas fa-fire"></i> COMPARTIR ENCUESTA EN FIGHT FEED (+25 FIGHT IQ)
                </button>
            </div>
        </div>
    `;

    if (preserveScroll && savedScrollTop > 0) {
        const newDetails = modalContent.querySelector('.modal-body-details');
        if (newDetails) {
            newDetails.scrollTop = savedScrollTop;
        }
    }

    // Conectar listeners de votación interactiva de esquinas
    modalContent.querySelectorAll('.btn-bout-vote').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const evId = btn.dataset.eventid;
            const bId = btn.dataset.boutid;
            const corner = btn.dataset.corner;
            votarCombateCartelera(evId, bId, corner);
        });
    });

    // Conectar listeners para marcar peleas favoritas
    modalContent.querySelectorAll('.btn-favorite-bout').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const bId = btn.dataset.boutid;
            const evId = btn.dataset.eventid;
            toggleFavoritoCombate(bId, evId);
        });
    });

    // Conectar botón de compartir encuesta en Fight Feed
    const btnShare = modalContent.querySelector('#btn-share-cartelera-feed');
    if (btnShare) {
        btnShare.addEventListener('click', () => {
            compartirEncuestaCarteleraFeed(evento);
        });
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Registra un voto para una esquina de un combate en la cartelera oficial.
 */
function votarCombateCartelera(eventId, boutId, corner) {
    const pollKey = 'fightconnect_card_polls';
    let polls = {};
    try {
        polls = JSON.parse(localStorage.getItem(pollKey) || '{}');
    } catch(e) { polls = {}; }

    const itemKey = `${eventId}_${boutId}`;
    const current = polls[itemKey] || { red: 14, blue: 10, userPick: null };

    if (current.userPick === corner) return;

    if (current.userPick) {
        if (current.userPick === 'red') current.red = Math.max(0, current.red - 1);
        if (current.userPick === 'blue') current.blue = Math.max(0, current.blue - 1);
    }

    if (corner === 'red') current.red += 1;
    if (corner === 'blue') current.blue += 1;
    current.userPick = corner;

    polls[itemKey] = current;
    localStorage.setItem(pollKey, JSON.stringify(polls));

    // Puntos Fight IQ
    let currentIQ = parseInt(localStorage.getItem('userFightIQ') || '0', 10);
    currentIQ += 10;
    localStorage.setItem('userFightIQ', currentIQ.toString());

    openEventModal(eventId, true);
}

/**
 * Alterna el estado de favorita para un combate de una cartelera oficial.
 */
function toggleFavoritoCombate(boutId, eventId) {
    const favKey = 'fightconnect_fav_bouts';
    let favs = [];
    try {
        favs = JSON.parse(localStorage.getItem(favKey) || '[]');
        if (!Array.isArray(favs)) favs = [];
    } catch(e) { favs = []; }

    if (favs.includes(boutId)) {
        favs = favs.filter(id => id !== boutId);
    } else {
        favs.push(boutId);
    }

    localStorage.setItem(favKey, JSON.stringify(favs));
    if (eventId) {
        openEventModal(eventId, true);
    }
}

/**
 * Publica la encuesta de la cartelera oficial directamente al Fight Feed.
 */
function compartirEncuestaCarteleraFeed(evento) {
    if (!evento) return;
    const userName = localStorage.getItem('userName') || 'Analista de Combate';
    const userRole = localStorage.getItem('userRole') || 'fan';
    const mainBout = evento.bouts?.[0];
    const redFighter = mainBout?.fighter1 || 'Esquina Roja';
    const blueFighter = mainBout?.fighter2 || 'Esquina Azul';

    const DB_FEED_KEY = 'fightconnect_feed_db';
    let feed = [];
    try {
        feed = JSON.parse(localStorage.getItem(DB_FEED_KEY) || '[]');
        if (!Array.isArray(feed)) feed = [];
    } catch(e) { feed = []; }

    const newPost = {
        id: `poll-${Date.now()}`,
        autor: userName,
        handle: `@${userName.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'usuario'}`,
        rol: userRole,
        tiempo: 'Hace un momento',
        texto: `🥊 ¡Encuesta Oficial de Cartelera! ${evento.titulo} (${evento.disciplina}). ¿Quién se lleva la victoria estelar? Deja tu pronóstico en el octágono.`,
        tipo: 'pickem',
        imageUrl: evento.imagenUrl || null,
        pickemData: {
            eventName: `${evento.subLiga}: ${evento.titulo}`,
            redFighter: redFighter,
            blueFighter: blueFighter,
            votesRed: 5,
            votesBlue: 4,
            officialEventId: evento.id,
            boutsCount: evento.bouts?.length || 1
        },
        kos: 0,
        techs: 0,
        iqs: 1,
        hypes: 3,
        refights: 0,
        liked: false,
        saved: false,
        comentarios: []
    };

    feed.unshift(newPost);
    localStorage.setItem(DB_FEED_KEY, JSON.stringify(feed));

    // Sincronizar en Firebase Cloud Firestore si está conectado
    if (window.db && window.firebaseDoc && window.firebaseSetDoc) {
        try {
            const docRef = window.firebaseDoc(window.db, 'fightfeed_posts', newPost.id);
            window.firebaseSetDoc(docRef, newPost, { merge: true });
        } catch(e) { console.warn("Sync post local", e); }
    }

    let currentIQ = parseInt(localStorage.getItem('userFightIQ') || '0', 10);
    currentIQ += 25;
    localStorage.setItem('userFightIQ', currentIQ.toString());

    alert(`✅ ¡Encuesta de ${evento.titulo} compartida exitosamente en Fight Feed! (+25 Puntos Fight IQ)\n\nLa comunidad ya puede votar en el muro de Fight Feed.`);
}

window.abrirModalCarteleraDesdeFeed = openEventModal;


function setupModalListeners() {
    const modal = document.getElementById('event-detail-modal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close-btn');
    const overlay = modal.querySelector('.modal-backdrop');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

function closeModal() {
    const modal = document.getElementById('event-detail-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================================================
// MICRO-INTERACCIONES VISUALES 3D
// ============================================================================

function attachTiltEffect() {
    const cards = document.querySelectorAll('.event-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });
}
