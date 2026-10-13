/**
 * @fileoverview Módulo de Noticias y Prensa de Deportes de Combate en FightConnect.
 * 
 * Consume, clasifica y agrega en tiempo real las fuentes oficiales de APIs de deportes de combate:
 * - UFC Oficial (ESPN UFC API, MMA Fighting, Bloody Elbow) -> Cobertura estelar y prioritaria
 * - MMA Internacional (PFL, Bellator, ONE Championship MMA, Rizin)
 * - ESPN Boxing (Boxeo profesional de élite, campeonatos mundiales WBA/WBC/IBF/WBO)
 * - ONE Championship (Muay Thai & Kickboxing de élite en Lumpinee / Rajadamnern)
 * - ESPN Wrestling (Lucha olímpica, colegial NCAA y freestyle)
 * 
 * Sincronización cronológica en vivo, filtrado por organización/disciplina y
 * extracción dinámica de imágenes de alta resolución.
 * 
 * @module noticias
 * @author FightConnect Development Team
 * @version 4.0.0
 */

// ============================================================================
// 1. FUENTES DE APIs OFICIALES
// ============================================================================

const API_SOURCES = {
    // 1. Cobertura estelar de UFC y MMA Internacional
    ufc_espn: 'https://site.api.espn.com/apis/site/v2/sports/mma/ufc/news?limit=50',
    mma_espn: 'https://site.api.espn.com/apis/site/v2/sports/mma/all/news?limit=50',
    pfl_espn: 'https://site.api.espn.com/apis/site/v2/sports/mma/pfl/news?limit=50',
    mma_fighting: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.mmafighting.com/rss/current.xml',
    bloody_combat: 'https://api.rss2json.com/v1/api.json?rss_url=https://bloodyelbow.com/feed/',

    // 2. Otras disciplinas y organizaciones de combate
    one_combat: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.onefc.com/feed/',
    boxing: 'https://now.core.api.espn.com/v1/sports/boxing/news?limit=50',
    wrestling: 'https://now.core.api.espn.com/v1/sports/wrestling/news?limit=50'
};

const CACHE_STORAGE_KEY = 'fc_live_combat_news_v4';

// ============================================================================
// 2. ESTADO GLOBAL REACTIVO
// ============================================================================

/** @type {Array<Object>} Artículos cargados en memoria */
let allNewsArticles = [];

/** @type {string} Filtro activo ('all', 'ufc', 'mma', 'boxing', 'bjj', 'muaythai', 'kickboxing', 'lucha') */
let currentNewsFilter = 'all';

/** @type {string} Búsqueda textual del usuario */
let currentNewsSearch = '';

// ============================================================================
// 3. INICIALIZACIÓN Y CICLO DE VIDA
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initNewsPortal();
});

/**
 * Inicializa el portal de noticias.
 * @function initNewsPortal
 * @returns {void}
 */
function initNewsPortal() {
    setupNewsFilters();
    setupNewsSearch();
    setupNewsModal();

    // 1. Cargar caché previa si existe para renderizado inmediato (0ms)
    const cached = loadCachedNews();
    if (cached && cached.length > 0) {
        allNewsArticles = cached;
        renderNews(allNewsArticles);
        renderBreakingTicker(allNewsArticles);
    } else {
        renderLoadingSkeleton();
    }

    // 2. Sincronizar en vivo con las APIs oficiales
    fetchLiveNewsData();
}

/**
 * Muestra el estado visual de carga.
 * @function renderLoadingSkeleton
 * @returns {void}
 */
function renderLoadingSkeleton() {
    const heroContainer = document.getElementById('featured-news-hero');
    const gridContainer = document.getElementById('news-grid-container');

    if (heroContainer) {
        heroContainer.innerHTML = `
            <div class="loading-state" style="border: 1px dashed var(--border-light); padding: 3rem; text-align: center; border-radius: 12px; background: var(--card-bg);">
                <i class="fas fa-satellite-dish fa-spin" style="font-size: 2.5rem; color: var(--accent-red); margin-bottom: 1rem;"></i>
                <p style="color: var(--text-white); font-size: 1.1rem; letter-spacing: 2px;">CONECTANDO CON LA RED OFICIAL DE NOTICIAS DE COMBATE (UFC & GLOBAL)...</p>
                <span style="color: var(--text-gray); font-size: 0.85rem;">Sincronizando información e imágenes en tiempo real desde ESPN, UFC y feeds de combate</span>
            </div>
        `;
    }

    if (gridContainer) {
        gridContainer.innerHTML = `
            <div class="loading-state" style="grid-column: 1 / -1; border: none; padding: 2rem; text-align: center;">
                <p style="color: var(--text-gray); font-size: 0.9rem;"><i class="fas fa-spinner fa-spin"></i> Cargando coberturas oficiales...</p>
            </div>
        `;
    }
}

// ============================================================================
// 4. CLASIFICACIÓN Y FORMATEO PRECISO POR ORGANIZACIÓN Y DISCIPLINA
// ============================================================================

/**
 * Clasifica rigurosamente un artículo identificando su organización (UFC, PFL, ONE, Bellator)
 * y su disciplina deportiva (MMA, Boxeo, BJJ, Muay Thai, Kickboxing, Lucha).
 * @function classifyArticle
 * @param {string} title 
 * @param {string} description 
 * @param {string} sourceCategory 
 * @param {Array<any>} [rawCategories=[]]
 * @returns {{category: string, organization: string, filter: string, filters: Array<string>, badgeClass: string}}
 */
function classifyArticle(title, description, sourceCategory, rawCategories = []) {
    const catsText = Array.isArray(rawCategories) 
        ? rawCategories.map(c => typeof c === 'object' ? (c.description || c.name || '') : String(c)).join(' ')
        : String(rawCategories || '');
    const text = `${title || ''} ${description || ''} ${catsText}`.toLowerCase();
    const titleText = `${title || ''} ${catsText}`.toLowerCase();

    // 1. PFL (Professional Fighters League) - si proviene del feed de PFL o trata explícitamente de PFL
    const isPfl = (sourceCategory === 'pfl' && (/\b(pfl|professional fighters league)\b/i.test(text) || !/\b(ufc\s*\d+|ufc\s*fight\s*night)\b/i.test(title))) ||
                  /\b(pfl|professional fighters league|pfl playoffs|pfl championship|pfl superfights|dakota ditcheva|brendan loughnane|denis goltsov|renan ferreira)\b/i.test(text);
    if (isPfl && !/\b(ufc\s*\d+|dana white)\b/i.test(title)) {
        return {
            category: 'PFL',
            organization: 'PFL',
            filter: 'pfl',
            filters: ['all', 'mma'],
            badgeClass: 'badge-pfl'
        };
    }

    // 2. Bellator Champions Series
    const isBellator = /\b(bellator|bellator champions series|pitbull freire|yaroslav amosov|vadim nemkov|usman nurmagomedov)\b/i.test(text);
    if (isBellator && !/\b(ufc\s*\d+|dana white)\b/i.test(title)) {
        return {
            category: 'BELLATOR',
            organization: 'BELLATOR',
            filter: 'bellator',
            filters: ['all', 'mma'],
            badgeClass: 'badge-bellator'
        };
    }

    // 3. UFC (Ultimate Fighting Championship) - Máxima prioridad y buque insignia de MMA
    const isUfc = sourceCategory === 'ufc' ||
                  /\b(ufc|dana white|oct[aá]gon|oct[aá]gono|apex las vegas)\b/i.test(titleText) ||
                  (/\b(ufc\s*\d+|ufc\s*fight\s*night|ufc\s*on\s*espn|dana white|shevchenko|makhachev|pereira|adesanya|topuria|o'malley|volkanovski|chimaev|poirier|gaethje|holloway|mcgregor|jon jones|aspinall|zhang weili|grasso|payton talbott|natalia silva|wang cong|van|tsarukyan|cejudo|aljamain sterling|merab|dvalishvili|prochazka|ankalaev|du plessis|strickland|whittaker|shavkat|sandhagen|figueiredo|ribovics|pavlovich|herb dean|sean sharaf|anthony wint|jacobe smith)\b/i.test(text) && !/\b(wbc|wba|ibf|wbo|boxing title)\b/i.test(title));

    if (isUfc) {
        return {
            category: 'UFC',
            organization: 'UFC',
            filter: 'ufc',
            filters: ['all', 'ufc', 'mma'],
            badgeClass: 'badge-ufc'
        };
    }

    // 4. Muay Thai (ONE Championship / Lumpinee / Rajadamnern / RWS)
    if (/\b(muay\s*thai|muaythai|lumpinee|rajadamnern|rws|rodtang|superlek|tawanchai|selina flores|petmuangsri|gregor thom|rak erawan|ferrari fairtex|mongkoldetlek)\b/i.test(text)) {
        return {
            category: 'MUAY THAI',
            organization: sourceCategory === 'one' ? 'ONE FC' : 'MUAY THAI',
            filter: 'muaythai',
            filters: ['all', 'muaythai'],
            badgeClass: 'badge-muaythai'
        };
    }

    // 5. Kickboxing (GLORY, K-1, Rise, ONE Kickboxing)
    if (/\b(kickboxing|kickbox|kickboxer|glory\s*kickboxing|glory\s*\d+|k-1\s*world|verhoeven|plazibat|abena|maslobojev|tariq osaro)\b/i.test(text)) {
        return {
            category: 'KICKBOXING',
            organization: sourceCategory === 'one' ? 'ONE FC' : 'KICKBOXING',
            filter: 'kickboxing',
            filters: ['all', 'kickboxing'],
            badgeClass: 'badge-kickboxing'
        };
    }

    // 6. ONE Championship MMA
    if (sourceCategory === 'one' || /\b(one championship|one fight night|one friday fights)\b/i.test(text)) {
        return {
            category: 'ONE FC',
            organization: 'ONE FC',
            filter: 'mma',
            filters: ['all', 'mma'],
            badgeClass: 'badge-one'
        };
    }

    // 7. Jiu-Jitsu / BJJ / Submission Grappling (ADCC, IBJJF, FloGrappling)
    if (/\b(jiu-jitsu|jiujitsu|bjj|adcc|ibjjf|submission fighting|submission grappling|grappling match|tatami|flograppling|gi|no-gi|gordon ryan|meregali|mica galv[aã]o|kade ruotolo|tye ruotolo)\b/i.test(text)) {
        return {
            category: 'JIU-JITSU',
            organization: 'IBJJF/ADCC',
            filter: 'bjj',
            filters: ['all', 'bjj'],
            badgeClass: 'badge-bjj'
        };
    }

    // 8. Boxeo profesional
    if (sourceCategory === 'boxing' || /\b(boxing|boxer|boxers|boxeo|boxeador|wba|wbc|ibf|wbo|canelo|ali act|magsayo|taylor|fury|joshua|hrgovic|itauma|navarrete|unification clash|welterweight title|heavyweight title)\b/i.test(text)) {
        return {
            category: 'BOXEO',
            organization: 'BOXEO',
            filter: 'boxing',
            filters: ['all', 'boxing'],
            badgeClass: 'badge-boxing'
        };
    }

    // 9. Lucha Olímpica / Freestyle / NCAA / RAF
    if (sourceCategory === 'wrestling' || /\b(freestyle wrestling|ncaa wrestling|grecorromana|lucha olímpica|lucha libre|raf\s*14|real american freestyle|penn state wrestling|starocci)\b/i.test(text)) {
        return {
            category: 'LUCHA',
            organization: 'WRESTLING',
            filter: 'lucha',
            filters: ['all', 'lucha'],
            badgeClass: 'badge-lucha'
        };
    }

    // 10. Artes Marciales Mixtas (MMA general / Otras Ligas)
    return {
        category: 'MMA',
        organization: 'MMA',
        filter: 'mma',
        filters: ['all', 'mma'],
        badgeClass: 'badge-mma'
    };
}

/**
 * Filtro estricto para excluir deportes ajenos (béisbol, fútbol, tenis, hockey, NFL).
 * @function isCombatSportArticle
 * @param {string} title 
 * @param {string} description 
 * @param {string} sourceUrl 
 * @returns {boolean}
 */
function isCombatSportArticle(title, description, sourceUrl) {
    const text = `${title || ''} ${description || ''} ${sourceUrl || ''}`.toLowerCase();

    const nonCombatRegex = /\b(dodgeball|stanley cup|nhl|ice hockey|hockey|nfl|super bowl|touchdown|quarterback|baseball|mlb|yankees|dodgers|red sox|home run|pitcher|world series|basketball|nba|lakers|celtics|wnba|tennis|wimbledon|us open|roland garros|atp|wta|eala|golf|pga|nascar|formula 1|f1|soccer|fifa|uefa|champions league|premier league|laliga|mls|darts|cricket|mcmahon secures deal|dad jokes -- how wwe)\b/i;
    if (nonCombatRegex.test(text)) {
        return false;
    }

    return true;
}

/**
 * Valida y extrae una URL de imagen oficial garantizando correspondencia con el deporte de combate.
 * Soporta imágenes de RSS enclosure, thumbnail, etiquetas <img> dentro de HTML y arrays de ESPN.
 * @function getValidCombatImageUrl
 * @param {Object} item 
 * @returns {string|null}
 */
function getValidCombatImageUrl(item) {
    // 1. Imagen desde RSS enclosure
    if (item.enclosure && item.enclosure.link && typeof item.enclosure.link === 'string' && item.enclosure.link.startsWith('http')) {
        return item.enclosure.link;
    }

    // 2. Imagen desde RSS thumbnail
    if (item.thumbnail && typeof item.thumbnail === 'string' && item.thumbnail.startsWith('http') && !item.thumbnail.includes('1f3a5.png')) {
        return item.thumbnail;
    }

    // 3. Imagen dentro del HTML (content o description en feeds como MMA Fighting)
    const htmlPayload = `${item.content || ''} ${item.description || ''}`;
    const imgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/i;
    const imgMatch = htmlPayload.match(imgRegex);
    if (imgMatch && imgMatch[1] && !imgMatch[1].includes('1f3a5.png')) {
        return imgMatch[1];
    }

    // 4. Imagen desde ESPN API
    if (Array.isArray(item.images) && item.images.length > 0) {
        const isBadImage = (url) => {
            if (!url || typeof url !== 'string' || !url.startsWith('http')) return true;
            return url.includes('r1709592') || url.includes('r1163456') || url.includes('r1710243') || 
                   url.includes('r1042784') || url.includes('espn_ocho') || url.includes('1f3a5.png');
        };

        for (const imgObj of item.images) {
            if (imgObj && imgObj.url && !isBadImage(imgObj.url)) {
                return imgObj.url;
            }
        }
    }

    return null;
}

/**
 * Formatea una fecha relativa amigable.
 * @function formatTimeAgo
 * @param {Date} date 
 * @returns {string}
 */
function formatTimeAgo(date) {
    if (!date || isNaN(date.getTime())) return 'EN VIVO';
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'HACE MENOS DE 1 HORA';
    if (diffHours < 24) return `HACE ${diffHours} HORA${diffHours > 1 ? 'S' : ''}`;
    if (diffDays === 1) return 'AYER';
    if (diffDays < 7) return `HACE ${diffDays} DÍAS`;
    return 'RECIENTE';
}

/**
 * Normaliza un artículo de cualquier API o feed al modelo estándar de FightConnect.
 * @function normalizeArticle
 * @param {Object} item 
 * @param {string} sourceCategory 
 * @param {number} idx 
 * @returns {Object|null}
 */
function normalizeArticle(item, sourceCategory, idx) {
    const title = (item.headline || item.title || '').trim();
    if (!title) return null;

    // Limpiar etiquetas HTML residuales en descripciones de RSS
    const rawDesc = item.description || item.headline || title;
    const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, '').trim();
    const description = cleanDesc || title;

    const sourceUrl = item.links?.web?.href || item.link || 'https://www.espn.com/';

    // Filtro anti deportes ajenos
    if (!isCombatSportArticle(title, description, sourceUrl)) {
        return null;
    }

    // Imagen traída exclusivamente de la API
    const imageUrl = getValidCombatImageUrl(item);
    if (!imageUrl) {
        return null;
    }

    const pubDate = item.published || item.pubDate ? new Date(item.published || item.pubDate) : new Date();
    const timestamp = !isNaN(pubDate.getTime()) ? pubDate.getTime() : Date.now();
    const formattedDate = !isNaN(pubDate.getTime())
        ? pubDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
        : 'HOY';

    const discipline = classifyArticle(title, description, sourceCategory, item.categories || []);

    const author = item.byline || item.author || (
        discipline.category === 'UFC' ? 'UFC Editorial / ESPN' :
        discipline.category === 'PFL' ? 'PFL Media Group' :
        discipline.category === 'BELLATOR' ? 'Bellator Press' :
        discipline.category === 'BOXEO' ? 'ESPN Boxing' :
        discipline.category === 'MUAY THAI' ? 'ONE Championship' :
        discipline.category === 'KICKBOXING' ? 'GLORY / K-1 Press' :
        discipline.category === 'JIU-JITSU' ? 'Combat Submission' :
        discipline.category === 'LUCHA' ? 'Olympic & NCAA Wrestling' :
        'ESPN MMA'
    );

    const wordCount = description.split(' ').length;
    const readTime = `${Math.max(2, Math.ceil(wordCount / 20) + 1)} min de lectura`;

    return {
        id: `news-${sourceCategory}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
        title: title,
        headline: description,
        category: discipline.category,
        organization: discipline.organization,
        filter: discipline.filter,
        filters: discipline.filters,
        badgeClass: discipline.badgeClass,
        date: formattedDate,
        timestamp: timestamp,
        timeAgo: formatTimeAgo(pubDate),
        author: author,
        readTime: readTime,
        imageUrl: imageUrl,
        excerpt: description,
        content: `
            <p style="font-size: 1.15rem; line-height: 1.7; color: var(--text-white); margin-bottom: 1.5rem; font-weight: 500;">
                ${description}
            </p>
            <div class="news-quote-block" style="border-left: 4px solid var(--accent-red); background: rgba(230,36,41,0.08); padding: 1.2rem 1.5rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0;">
                <p style="font-style: italic; color: #fff; margin: 0;">"${title}"</p>
                <span style="font-size: 0.8rem; color: var(--text-gray); margin-top: 0.5rem; display: block;">— Cobertura oficial por ${author}</span>
            </div>
            <p style="color: var(--text-gray); line-height: 1.8;">
                Para acceder al reporte completo de la organización, estadísticas de asalto, declaraciones oficiales y video resumen, consulta la fuente de prensa original.
            </p>
        `,
        sourceUrl: sourceUrl,
        sourceName: author
    };
}

// ============================================================================
// 5. CONSUMO, AGREGACIÓN Y ORDENAMIENTO EN TIEMPO REAL DESDE LAS APIs
// ============================================================================

/**
 * Consulta en paralelo todas las fuentes oficiales de noticias, garantizando
 * prominencia total para UFC y ordenamiento cronológico.
 * @async
 * @function fetchLiveNewsData
 * @returns {Promise<void>}
 */
async function fetchLiveNewsData() {
    try {
        const fetchWithTimeout = async (url) => {
            try {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 6000);
                const res = await fetch(url, { signal: ctrl.signal });
                clearTimeout(timer);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn(`Aviso de conexión con ${url}:`, e.message);
            }
            return null;
        };

        const [
            ufcData,
            mmaData,
            pflData,
            mmaFightingData,
            bloodyData,
            oneData,
            boxingData,
            wrestlingData
        ] = await Promise.all([
            fetchWithTimeout(API_SOURCES.ufc_espn),
            fetchWithTimeout(API_SOURCES.mma_espn),
            fetchWithTimeout(API_SOURCES.pfl_espn),
            fetchWithTimeout(API_SOURCES.mma_fighting),
            fetchWithTimeout(API_SOURCES.bloody_combat),
            fetchWithTimeout(API_SOURCES.one_combat),
            fetchWithTimeout(API_SOURCES.boxing),
            fetchWithTimeout(API_SOURCES.wrestling)
        ]);

        const seenTitles = new Set();
        const aggregated = [];

        const processList = (items, sourceCat, isHeadlineObj = false) => {
            if (!Array.isArray(items)) return;
            items.forEach((item, i) => {
                const titleKey = (item.headline || item.title || '').trim().toLowerCase();
                if (!titleKey || seenTitles.has(titleKey)) return;
                const mapped = normalizeArticle(item, sourceCat, i);
                if (mapped) {
                    seenTitles.add(titleKey);
                    aggregated.push(mapped);
                }
            });
        };

        // 1. Noticias de UFC Oficial de ESPN (50 artículos)
        if (ufcData && Array.isArray(ufcData.articles)) {
            processList(ufcData.articles, 'ufc');
        }

        // 2. Noticias de MMA Fighting (Cobertura premium de UFC y MMA)
        if (mmaFightingData && Array.isArray(mmaFightingData.items)) {
            processList(mmaFightingData.items, 'mmafighting');
        }

        // 3. Noticias de MMA Global de ESPN
        if (mmaData && Array.isArray(mmaData.articles)) {
            processList(mmaData.articles, 'mma');
        }

        // 4. Noticias de PFL Oficial de ESPN
        if (pflData && Array.isArray(pflData.articles)) {
            processList(pflData.articles, 'pfl');
        }

        // 5. Cobertura de Bloody Elbow (UFC, MMA y combate)
        if (bloodyData && Array.isArray(bloodyData.items)) {
            processList(bloodyData.items, 'bloody');
        }

        // 6. Noticias de ONE Championship (Muay Thai, Kickboxing y ONE MMA)
        if (oneData && Array.isArray(oneData.items)) {
            processList(oneData.items, 'one');
        }

        // 7. Noticias de Boxeo oficial de ESPN
        if (boxingData && Array.isArray(boxingData.headlines)) {
            processList(boxingData.headlines, 'boxing', true);
        }

        // 8. Noticias de Lucha / Wrestling de ESPN
        if (wrestlingData && Array.isArray(wrestlingData.headlines)) {
            processList(wrestlingData.headlines, 'wrestling', true);
        }

        if (aggregated.length > 0) {
            // ORDENAMIENTO CRONOLÓGICO ESTRICTO (Lo más reciente primero)
            aggregated.sort((a, b) => b.timestamp - a.timestamp);

            allNewsArticles = aggregated;
            saveCachedNews(allNewsArticles);
            renderNews(allNewsArticles);
            renderBreakingTicker(allNewsArticles);
            console.log(`✅ ${allNewsArticles.length} noticias de combate cargadas y ordenadas cronológicamente con UFC prioritario.`);
        }
    } catch (e) {
        console.error('Error sincronizando noticias desde las APIs:', e);
    }
}

// ============================================================================
// 6. GESTIÓN DE CACHÉ LOCAL
// ============================================================================

function saveCachedNews(articles) {
    try {
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(articles));
    } catch (e) {
        console.warn('No se pudo guardar la caché de noticias:', e.message);
    }
}

function loadCachedNews() {
    try {
        const data = localStorage.getItem(CACHE_STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn('Error leyendo caché de noticias:', e.message);
    }
    return null;
}

// ============================================================================
// 7. RENDERIZADO DE VISTAS (TICKER, HERO, GRID)
// ============================================================================

/**
 * Renderiza el Breaking Ticker interactivo con las últimas noticias de combate.
 * @function renderBreakingTicker
 * @param {Array<Object>} articles 
 * @returns {void}
 */
function renderBreakingTicker(articles) {
    const tickerContainer = document.getElementById('breaking-ticker-marquee');
    if (!tickerContainer || !articles || articles.length === 0) return;

    const tickerItems = articles.slice(0, 14).map(art => `
        <span class="ticker-item" onclick="openArticleModal('${art.id}')">
            <span class="ticker-tag">${art.category}</span>
            <span>${art.title}</span>
            <i class="fas fa-chevron-right" style="font-size: 0.65rem; color: var(--accent-red); opacity: 0.7;"></i>
        </span>
    `).join('');

    tickerContainer.innerHTML = tickerItems + tickerItems;
}

/**
 * Renderiza los artículos según el filtro activo y búsqueda.
 * Garantiza que en la vista global 'TODOS' se destaque un evento estelar (UFC / Título Mundial).
 * @function renderNews
 * @param {Array<Object>} articles 
 * @returns {void}
 */
function renderNews(articles) {
    const heroContainer = document.getElementById('featured-news-hero');
    const gridContainer = document.getElementById('news-grid-container');
    if (!gridContainer) return;

    // Filtrado estricto por categoría/organización y término de búsqueda
    const filtered = articles.filter(art => {
        let matchesCat = true;
        if (currentNewsFilter !== 'all') {
            if (Array.isArray(art.filters)) {
                matchesCat = art.filters.includes(currentNewsFilter);
            } else {
                matchesCat = art.filter === currentNewsFilter;
            }
        }

        const query = currentNewsSearch.toLowerCase().trim();
        const matchesQuery = !query || 
            (art.title && art.title.toLowerCase().includes(query)) ||
            (art.headline && art.headline.toLowerCase().includes(query)) ||
            (art.excerpt && art.excerpt.toLowerCase().includes(query)) ||
            (art.category && art.category.toLowerCase().includes(query)) ||
            (art.organization && art.organization.toLowerCase().includes(query)) ||
            (art.author && art.author.toLowerCase().includes(query));

        return matchesCat && matchesQuery;
    });

    if (filtered.length === 0) {
        if (heroContainer) heroContainer.innerHTML = '';
        const catName = currentNewsFilter === 'ufc' ? 'UFC' :
                        currentNewsFilter === 'mma' ? 'MMA' :
                        currentNewsFilter === 'boxing' ? 'BOXEO' :
                        currentNewsFilter === 'lucha' ? 'LUCHA' :
                        currentNewsFilter === 'bjj' ? 'JIU-JITSU' :
                        currentNewsFilter === 'muaythai' ? 'MUAY THAI' :
                        currentNewsFilter === 'kickboxing' ? 'KICKBOXING' : 'ESTA CATEGORÍA';

        gridContainer.innerHTML = `
            <div class="loading-state" style="grid-column: 1 / -1; border: 1px dashed var(--border-light); padding: 4rem; text-align: center; border-radius: 12px; background: var(--card-bg);">
                <i class="fas fa-newspaper" style="font-size: 2.5rem; color: var(--accent-red); margin-bottom: 1.5rem;"></i>
                <p style="color: var(--text-white); font-size: 1.1rem; letter-spacing: 2px;">NO SE ENCONTRARON NOTICIAS EN ${catName}</p>
                <span style="color: var(--text-gray); margin-top: 0.5rem; display: block;">Prueba seleccionando otra disciplina o consulta la sección TODOS o UFC.</span>
            </div>
        `;
        return;
    }

    // 7.1. Selección del Hero Banner Principal
    let heroArt = filtered[0];
    if (currentNewsFilter === 'all') {
        // En portada general, destacar la noticia más relevante de UFC o campeonato estelar entre las más recientes
        const topUfcOrTitle = filtered.slice(0, 8).find(art => art.category === 'UFC' || art.organization === 'UFC');
        if (topUfcOrTitle) {
            heroArt = topUfcOrTitle;
        }
    }

    if (heroContainer) {
        heroContainer.innerHTML = `
            <div class="featured-hero-card" onclick="openArticleModal('${heroArt.id}')">
                <div class="hero-image-wrapper">
                    <img src="${heroArt.imageUrl}" class="hero-image" alt="${heroArt.title}" loading="lazy" onerror="this.src='https://a.espncdn.com/photo/2026/0829/r1708497_600x400_3-2.jpg';">
                    <div class="hero-image-overlay"></div>
                </div>
                <div class="hero-content">
                    <div class="hero-meta-top">
                        <span class="news-card-badge ${heroArt.badgeClass}" style="position: static;">${heroArt.category}</span>
                        <span style="color: var(--accent-red); font-size: 0.8rem; font-weight: 700; letter-spacing: 1px;"><i class="fas fa-bolt"></i> ${heroArt.timeAgo}</span>
                        <span style="color: var(--text-gray); font-size: 0.8rem;"><i class="far fa-clock"></i> ${heroArt.readTime}</span>
                    </div>
                    <h2 class="hero-title">${heroArt.title}</h2>
                    <p class="hero-excerpt">${heroArt.excerpt}</p>
                    <div class="hero-meta-bottom">
                        <span><i class="fas fa-feather-alt"></i> ${heroArt.author}</span>
                        <button class="btn-read-hero">
                            LEER ARTÍCULO <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // 7.2. Grid de Noticias (Excluye el hero para no duplicar contenido)
    const gridArticles = filtered.filter(art => art.id !== heroArt.id);
    gridContainer.innerHTML = '';

    gridArticles.forEach(art => {
        const cardHTML = `
            <article class="news-card" onclick="openArticleModal('${art.id}')">
                <div class="news-card-thumb">
                    <img src="${art.imageUrl}" class="news-card-img" alt="${art.title}" loading="lazy" onerror="this.src='https://a.espncdn.com/photo/2026/0829/r1708497_600x400_3-2.jpg';">
                    <div class="news-thumb-overlay"></div>
                    <span class="news-card-badge ${art.badgeClass}">${art.category}</span>
                </div>
                <div class="news-card-body">
                    <div class="news-card-meta">
                        <span><i class="far fa-calendar-alt"></i> ${art.date}</span>
                        <span>•</span>
                        <span><i class="far fa-clock"></i> ${art.readTime}</span>
                    </div>
                    <h3 class="news-card-title">${art.title}</h3>
                    <p class="news-card-excerpt">${art.excerpt}</p>
                    <div class="news-card-footer">
                        <span><i class="fas fa-user-edit" style="margin-right: 4px;"></i> ${art.author}</span>
                        <span class="read-more-link">LEER <i class="fas fa-chevron-right" style="font-size: 0.7rem;"></i></span>
                    </div>
                </div>
            </article>
        `;
        gridContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// ============================================================================
// 8. FILTROS Y MOTOR DE BÚSQUEDA
// ============================================================================

function setupNewsFilters() {
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            currentNewsFilter = pill.dataset.filter || 'all';
            renderNews(allNewsArticles);
        });
    });
}

function setupNewsSearch() {
    const searchInput = document.getElementById('news-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentNewsSearch = e.target.value;
            renderNews(allNewsArticles);
        });
    }
}

// ============================================================================
// 9. MODAL DE LECTURA COMPLETA
// ============================================================================

window.openArticleModal = function(articleId) {
    const article = allNewsArticles.find(a => String(a.id) === String(articleId));
    if (!article) return;

    const modal = document.getElementById('news-detail-modal');
    const content = document.getElementById('news-modal-dynamic-content');
    if (!modal || !content) return;

    content.innerHTML = `
        <div class="news-modal-banner">
            <img src="${article.imageUrl}" alt="${article.title}" loading="lazy" onerror="this.src='https://a.espncdn.com/photo/2026/0829/r1708497_600x400_3-2.jpg';">
            <div class="news-modal-banner-overlay"></div>
        </div>
        <div class="news-modal-body">
            <div style="display: flex; gap: 0.8rem; margin-bottom: 1rem; align-items: center;">
                <span class="news-card-badge ${article.badgeClass}" style="position: static;">${article.category}</span>
                <span style="color: var(--accent-red); font-size: 0.82rem; font-weight: 700; letter-spacing: 1px;"><i class="fas fa-bolt"></i> ${article.timeAgo}</span>
            </div>
            <h1 class="news-modal-headline">${article.title}</h1>
            <div class="news-modal-meta">
                <span><i class="far fa-calendar-alt"></i> ${article.date}</span>
                <span><i class="fas fa-user-edit"></i> ${article.author}</span>
                <span><i class="far fa-clock"></i> ${article.readTime}</span>
            </div>
            <div class="news-modal-content">
                ${article.content}
            </div>
            <div class="news-modal-footer">
                <span style="color: var(--text-gray); font-size: 0.85rem;">Fuente Original: <strong>${article.sourceName}</strong></span>
                ${article.sourceUrl ? `
                    <a href="${article.sourceUrl}" target="_blank" rel="noopener noreferrer" class="btn-read-hero" style="text-decoration: none;">
                        VER REPORTE EN ${article.sourceName.toUpperCase()} <i class="fas fa-external-link-alt" style="font-size: 0.8rem;"></i>
                    </a>
                ` : ''}
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

function setupNewsModal() {
    const modal = document.getElementById('news-detail-modal');
    const closeBtn = document.getElementById('news-modal-close-btn');
    const backdrop = document.querySelector('.news-modal-backdrop');
    if (!modal) return;

    const closeModal = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    window.closeNewsModal = closeModal;

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('news-modal-backdrop')) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}
