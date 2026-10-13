/**
 * @fileoverview Controlador de Eventos Locales y Carteleras Nacionales en FightConnect.
 * 
 * Este módulo gestiona:
 * 1. El renderizado reactivo del catálogo de eventos locales provisto por Cloud Firestore (`app.js`).
 * 2. La asignación dinámica de insignias (badges) y pósters oficiales de respaldo según la disciplina deportiva
 *    (MMA, Boxeo, Jiu-Jitsu, Muay Thai, Kickboxing).
 * 3. Los efectos interactivos de perspectiva 3D (Tilt Effect) para las tarjetas de cartelera.
 * 
 * @module local
 * @author FightConnect Development Team
 * @version 1.0.0
 */

import { escapeHtml, sanitizeUrl } from "./security-utils.js";

document.addEventListener('DOMContentLoaded', () => {
    // La animación global y la orquestación de datos de Firestore son gestionadas por app.js
});

// ============================================================================
// DEFINICIONES DE TIPOS DE DATOS (JSDOC TYPEDEF)
// ============================================================================

/**
 * Representa la información de un evento de combate local en la plataforma.
 * @typedef {Object} EventoLocal
 * @property {string|number} id - Identificador único del evento en Firestore o memoria.
 * @property {string} titulo - Título comercial del evento o nombre de la velada.
 * @property {string} disciplina - Nombre de la disciplina (ej. "MMA", "BOXEO", "JIU-JITSU").
 * @property {string} fecha - Fecha legible de realización del evento.
 * @property {string} ubicacion - Ciudad, recinto o arena del combate.
 * @property {string} [imagenUrl] - Enlace al póster oficial alojado en la nube.
 * @property {string} [filtro] - Clave de categoría para filtrado (ej. "mma", "boxing", "bjj", "all").
 */

// ============================================================================
// 1. RENDERIZADO REACTIVO DE EVENTOS EN EL GRID
// ============================================================================

/**
 * Función global expuesta para renderizar la colección de eventos en la vista de eventos locales.
 * Sustituye el spinner de carga inicial por las tarjetas de eventos o por un mensaje de estado vacío.
 * 
 * @function renderizarEventos
 * @param {EventoLocal[]} eventos - Arreglo con la lista de eventos a mostrar en pantalla.
 * @returns {void}
 */
/**
 * Genera el enlace directo a la taquilla oficial, web o canal de WhatsApp de la promotora.
 * FightConnect actúa exclusivamente como difusor de información sin custodiar ni procesar pagos.
 * @function obtenerEnlaceTaquilla
 * @param {EventoLocal} evento
 * @returns {string} URL de compra o contacto directo con taquilla
 */
function obtenerEnlaceTaquilla(evento) {
    if (!evento) return 'https://wa.me/573000000000';
    if (evento.ticketUrl && evento.ticketUrl.startsWith('http')) return evento.ticketUrl;
    if (evento.ticketLink && evento.ticketLink.startsWith('http')) return evento.ticketLink;
    if (evento.contact && (evento.contact.startsWith('http') || evento.contact.startsWith('wa.me'))) {
        return evento.contact.startsWith('http') ? evento.contact : `https://${evento.contact}`;
    }
    const cleanPhone = (evento.contact || evento.promoterPhone || '').replace(/[^0-9]/g, '');
    const promptText = `Hola, solicito información y boletas para el evento oficial "${evento.titulo || evento.name || 'Cartelera Oficial'}".`;
    if (cleanPhone && cleanPhone.length >= 7) {
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(promptText)}`;
    }
    return `https://wa.me/573000000000?text=${encodeURIComponent(promptText)}`;
}

window.renderizarEventos = function(eventos) {
    const gridContainer = document.getElementById('local-events-grid');
    if (!gridContainer) return;  
        
    // Limpieza previa del contenedor para remover estados de carga (spinners)
    gridContainer.innerHTML = '';

    // Manejo de estado sin resultados
    if (!eventos || eventos.length === 0) {
        gridContainer.innerHTML = `
            <div class="loading-state" style="border: none; padding: 4rem;">
                <p style="color: var(--text-gray); font-size: 1rem; letter-spacing: 2px;">NO HAY EVENTOS DISPONIBLES EN ESTA CATEGORÍA.</p>
            </div>
        `;
        return;
    }

    // Generación dinámica de tarjetas para cada evento
    eventos.forEach(evento => {
        // Determinación de la clase CSS de la insignia según la disciplina
        let badgeClass = 'mma-badge';
        if (evento.disciplina === 'JIU-JITSU') badgeClass = 'bjj-badge';
        else if (evento.disciplina === 'BOXEO') badgeClass = 'boxeo-badge';
        else if (evento.disciplina === 'LUCHA') badgeClass = 'lucha-badge';
        else if (evento.disciplina === 'MUAY THAI') badgeClass = 'muaythai-badge';
        else if (evento.disciplina === 'KICKBOXING') badgeClass = 'kickboxing-badge';

        // Imagen de respaldo de alta fidelidad según la disciplina del evento desde la API
        const fallbackImg = evento.disciplina === 'BOXEO' ? 'https://a.espncdn.com/photo/2023/0423/r1163456_1296x729_16-9.jpg' :
                           evento.disciplina === 'LUCHA' ? 'https://a.espncdn.com/photo/2026/0810/r1700045_600x600_1-1.jpg' :
                           evento.disciplina === 'JIU-JITSU' ? 'https://a.espncdn.com/photo/2026/0816/r1702390_600x400_3-2.jpg' :
                           evento.disciplina === 'MUAY THAI' ? 'https://a.espncdn.com/photo/2026/0829/r1708497_600x400_3-2.jpg' :
                           evento.disciplina === 'KICKBOXING' ? 'https://a.espncdn.com/photo/2026/0831/r1709592_608x342_16-9.jpg' :
                           'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg';

        const posterImg = evento.imagenUrl || fallbackImg;
        const fights = Array.isArray(evento.fights) ? evento.fights : [];
        const boutsCount = fights.length;

        let boutsBadgeText = 'CARTELERA EN PROGRAMACIÓN';
        let boutsBadgeIcon = 'fa-clock';
        if (boutsCount > 0) {
            boutsBadgeIcon = 'fa-shield-alt';
            boutsBadgeText = `${boutsCount} ${boutsCount === 1 ? 'PELEA CONFIRMADA' : 'PELEAS CONFIRMADAS'}`;
        }

        const mainBout = fights.find(f => f.type === 'estelar') || (boutsCount > 0 ? fights[0] : null);
        let mainBoutPreviewHtml = '';
        let f1Name = '';
        let f2Name = '';
        if (mainBout) {
            f1Name = mainBout.fighter1?.alias ? `"${mainBout.fighter1.alias}"` : (mainBout.fighter1?.name || 'Peleador 1');
            f2Name = mainBout.fighter2?.alias ? `"${mainBout.fighter2.alias}"` : (mainBout.fighter2?.name || 'Peleador 2');
            mainBoutPreviewHtml = `
                <div class="card-main-bout-preview" style="background: rgba(230,36,41,0.08); border-left: 3px solid var(--accent-red); padding: 0.45rem 0.75rem; border-radius: 4px; margin-top: 0.6rem; font-size: 0.78rem;">
                    <span style="color: var(--accent-red); font-size: 0.65rem; font-weight: bold; letter-spacing: 0.8px; display: block; text-transform: uppercase;">
                        <i class="fas fa-star" style="color: #ffc107; font-size: 0.65rem;"></i> ESTELAR:
                    </span>
                    <strong style="color: #fff; font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">
                        ${f1Name} <span style="color: var(--accent-red);">VS</span> ${f2Name}
                    </strong>
                </div>
            `;
        }

        const isFan = (localStorage.getItem('userRole') || '').toLowerCase() === 'fan';
        const promoterName = evento.promoter || 'Promotora Oficial';
        const isPromFollowed = isFan && ((typeof window.esEventoFavorito === 'function' && window.esEventoFavorito(evento.id)) || 
                               (typeof window.esPromotoraSeguida === 'function' && window.esPromotoraSeguida(promoterName)));

        const isPromoterVerified = Boolean(
            evento.isVerified === true || 
            evento.kybStatus === 'approved' || 
            (evento.promoter && (evento.promoter.toLowerCase().includes('connect pro') || evento.promoter.toLowerCase().includes('ocamm'))) ||
            localStorage.getItem(`kyb_verified_promoter_${evento.promoterId}`) === 'true' ||
            (evento.promoterId && evento.promoterId === localStorage.getItem('userId') && localStorage.getItem('promoterKybStatus') === 'approved')
        );

        // Estructura HTML moderna y profesional de la tarjeta de evento local
        const safePosterImg = sanitizeUrl(posterImg, fallbackImg);
        const cardHTML = `
            <article class="event-card local-event-card" data-category="${escapeHtml(evento.filtro || 'all')}" data-event-id="${escapeHtml(evento.id || '')}" style="animation: fadeIn 0.4s ease-out forwards; cursor: pointer;">
                <!-- BLOQUE 1: Escena Visual de Cabecera (Cinematográfica) -->
                <div class="card-visual-header">
                    <img src="${safePosterImg}" class="card-cover-img" alt="${escapeHtml(evento.titulo)}" onerror="this.onerror=null; this.src='${fallbackImg}';" loading="lazy">
                    <div class="card-vignette-overlay"></div>
                    <div class="card-header-top-badges">
                        <div class="card-promoter-badge-group">
                            <span class="subleague-tag" title="Organización Promotora: ${escapeHtml(promoterName)}">
                                <i class="fas fa-shield-alt" style="color: #ffc107; margin-right: 4px;"></i>${escapeHtml(promoterName)}
                            </span>
                            ${isPromoterVerified ? `
                            <span class="kyb-verified-badge" title="Promotora Verificada por FightConnect (KYB Aprobado - Entidad Deportiva Legítima)">
                                <i class="fas fa-certificate"></i> VERIFICADA
                            </span>
                            ` : ''}
                            ${isFan ? `
                            <button type="button" class="btn-follow-promoter-badge ${isPromFollowed ? 'is-following' : ''}" data-promoter="${escapeHtml(promoterName)}" title="${isPromFollowed ? 'Dejar de seguir velada y promotora' : 'Seguir velada y promotora oficial'}" onclick="event.stopPropagation();">
                                <i class="fas ${isPromFollowed ? 'fa-check' : 'fa-plus'}"></i> <span>${isPromFollowed ? 'SIGUIENDO' : 'SEGUIR'}</span>
                            </button>
                            ` : ''}
                        </div>
                        <span class="badge ${badgeClass}">${escapeHtml(evento.disciplina)}</span>
                    </div>
                    <div class="card-header-bottom-badges">
                        <span class="days-left-tag" style="background: rgba(0,0,0,0.85); border-color: rgba(255,255,255,0.2);">
                            <i class="fas ${boutsBadgeIcon}" style="color: ${boutsCount > 0 ? 'var(--accent-red)' : '#ff9800'}; margin-right: 5px;"></i>${escapeHtml(boutsBadgeText)}
                        </span>
                    </div>
                </div>

                <!-- BLOQUE 2: Ficha Técnica Organizada y Alineada -->
                <div class="card-technical-sheet">
                    <h3 class="card-event-title" title="${escapeHtml(evento.titulo)}">${escapeHtml(evento.titulo)}</h3>
                    
                    ${mainBout ? `
                        <div class="card-main-bout">
                            <i class="fas fa-trophy bout-trophy-icon"></i>
                            <div class="bout-text-wrap">
                                <span class="bout-label">ESTELAR:</span>
                                <strong class="bout-fighters">
                                    ${escapeHtml(f1Name)} 
                                    <span style="color: var(--accent-red); font-weight: 800;">VS</span> 
                                    ${escapeHtml(f2Name)}
                                </strong>
                            </div>
                        </div>
                    ` : ''}

                    <div class="card-specs-list" style="margin-top: auto;">
                        <div class="spec-row">
                            <i class="fas fa-building spec-icon" style="color: #ffc107;" title="Promotora Oficial"></i>
                            <span class="spec-value" title="${escapeHtml(evento.promoter || '')}">
                                PROMOTORA: <strong>${escapeHtml(evento.promoter || 'Organización Oficial')}</strong>
                                ${isPromoterVerified ? '<span style="color: #ffc107; font-size: 0.72rem; margin-left: 6px; font-weight: 700;"><i class="fas fa-shield-alt"></i> [VERIFICADA PRO]</span>' : ''}
                            </span>
                        </div>
                        <div class="spec-row">
                            <i class="far fa-calendar-alt spec-icon" title="Fecha y Hora"></i>
                            <span class="spec-value">${escapeHtml(evento.fecha || '')}</span>
                        </div>
                        <div class="spec-row">
                            <i class="fas fa-map-marker-alt spec-icon" title="Sede y Ubicación"></i>
                            <span class="spec-value" title="${escapeHtml(evento.ubicacion || '')}">${escapeHtml(evento.ubicacion || '')}</span>
                        </div>
                    </div>
                </div>


                <!-- BLOQUE 3: Llamado a la Acción (Ver Cartelera y Taquilla Oficial) -->
                <div class="card-cta-block" style="display: flex; gap: 8px; width: 100%;">
                    <button class="btn-outline btn-ver-cartelera-local" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.8rem; padding: 0.65rem 0.4rem; white-space: nowrap; border-radius: 8px;">
                        <i class="fas fa-list-ul"></i> VER CARTELERA ${boutsCount > 0 ? `(${boutsCount})` : ''}
                    </button>
                    <a href="${obtenerEnlaceTaquilla(evento)}" target="_blank" rel="noopener noreferrer" class="btn-taquilla-premium btn-comprar-boletas-local" onclick="event.stopPropagation();" title="Comprar entradas oficiales para este evento" style="flex: 1;">
                        <i class="fas fa-ticket-alt"></i> ENTRADAS OFICIALES
                    </a>
                </div>
            </article>
        `;
        gridContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Conectar clics para abrir la cartelera oficial y seguir promotoras
    const cards = gridContainer.querySelectorAll('.event-card');
    cards.forEach((card, idx) => {
        const evento = eventos[idx];
        const btnCartelera = card.querySelector('.btn-ver-cartelera-local');
        const btnFollowProm = card.querySelector('.btn-follow-promoter-badge');

        if (btnFollowProm) {
            btnFollowProm.addEventListener('click', (e) => {
                e.stopPropagation();
                const pName = btnFollowProm.getAttribute('data-promoter');
                const catObj = (window.FC_PROMOTORAS_CATALOG || []).find(p => p.name.toLowerCase() === pName.toLowerCase() || p.shortName.toLowerCase() === pName.toLowerCase());
                const promObj = catObj || {
                    id: pName.toLowerCase().replace(/\s+/g, '-'),
                    name: pName,
                    shortName: pName,
                    scope: 'local',
                    location: evento?.ubicacion || 'Colombia',
                    discipline: evento?.disciplina || 'MMA',
                    description: `Promotora oficial organizadora de ${evento?.titulo || 'evento local'}.`
                };

                const cardImgEl = card.querySelector('.card-cover-img');
                const cardImgSrc = cardImgEl ? cardImgEl.src : '';

                const evObj = evento ? {
                    id: evento.id,
                    titulo: evento.titulo,
                    fecha: evento.fecha || evento.fechaIso || 'Próximamente',
                    ubicacion: evento.ubicacion || 'Colombia',
                    imagenUrl: cardImgSrc || evento.imagenUrl || '',
                    disciplina: (evento.disciplina || 'MMA').toUpperCase(),
                    linkCartelera: 'local.html',
                    promotora: pName
                } : null;

                if ((localStorage.getItem('userRole') || '').toLowerCase() !== 'fan') {
                    alert("La función de seguir promotoras y carteleras es exclusiva para aficionados (rol Fan).");
                    return;
                }

                if (typeof window.toggleSeguirEventoPromotora === 'function') {
                    const isNowFollowed = window.toggleSeguirEventoPromotora(promObj, evObj);
                    if (isNowFollowed) {
                        btnFollowProm.classList.add('is-following');
                        btnFollowProm.innerHTML = '<i class="fas fa-check"></i> <span>SIGUIENDO</span>';
                        btnFollowProm.title = 'Dejar de seguir velada y promotora';
                    } else {
                        btnFollowProm.classList.remove('is-following');
                        btnFollowProm.innerHTML = '<i class="fas fa-plus"></i> <span>SEGUIR</span>';
                        btnFollowProm.title = 'Seguir velada y promotora oficial';
                    }
                } else if (typeof window.toggleSeguirPromotora === 'function') {
                    const isNowFollowed = window.toggleSeguirPromotora(promObj);
                    if (isNowFollowed) {
                        btnFollowProm.classList.add('is-following');
                        btnFollowProm.innerHTML = '<i class="fas fa-check"></i> <span>SIGUIENDO</span>';
                        btnFollowProm.title = 'Dejar de seguir promotora';
                    } else {
                        btnFollowProm.classList.remove('is-following');
                        btnFollowProm.innerHTML = '<i class="fas fa-plus"></i> <span>SEGUIR</span>';
                        btnFollowProm.title = 'Seguir promotora oficial';
                    }
                }
            });
        }
        
        const abrirModal = (e) => {
            e.stopPropagation();
            if (evento) abrirModalCarteleraLocal(evento);
        };

        if (btnCartelera) btnCartelera.addEventListener('click', abrirModal);
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-comprar-boletas-local') || e.target.closest('.btn-follow-promoter-badge')) return;
            if (evento) abrirModalCarteleraLocal(evento);
        });
    });

    // Vinculación de efectos de interacción 3D a las tarjetas recién creadas
    attachTiltEffect();
};

/**
 * Despliega el modal oficial de la cartelera del evento mostrando combates estelares y preliminares.
 * @function abrirModalCarteleraLocal
 * @param {EventoLocal} evento - Datos completos del evento seleccionado
 */
function abrirModalCarteleraLocal(evento) {
    const modal = document.getElementById('modal-cartelera-local');
    if (!modal) return;

    const posterEl = document.getElementById('mcl-poster');
    const badgeEl = document.getElementById('mcl-discipline-badge');
    const titleEl = document.getElementById('mcl-title');
    const dateEl = document.getElementById('mcl-date');
    const locationEl = document.getElementById('mcl-location');
    const container = document.getElementById('mcl-bouts-container');
    const closeBtn = document.getElementById('close-cartelera-local-modal');
    const ticketLinkEl = document.getElementById('mcl-ticket-link');

    if (ticketLinkEl) {
        ticketLinkEl.href = obtenerEnlaceTaquilla(evento);
    }

    if (posterEl) {
        if (evento.imagenUrl) {
            posterEl.src = evento.imagenUrl;
            posterEl.style.display = 'block';
        } else {
            posterEl.style.display = 'none';
        }
    }

    if (badgeEl) badgeEl.textContent = (evento.disciplina || 'MMA').toUpperCase();
    if (titleEl) titleEl.textContent = evento.titulo;
    if (dateEl) dateEl.textContent = evento.fecha;
    if (locationEl) locationEl.textContent = evento.ubicacion;

    const fights = Array.isArray(evento.fights) ? evento.fights : [];

    if (fights.length === 0) {
        container.innerHTML = `
            <div style="padding: 3.5rem 1.5rem; text-align: center; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
                <i class="fas fa-clock" style="font-size: 2.5rem; color: #ff9800; margin-bottom: 0.8rem; opacity: 0.8; display: block;"></i>
                <h3 style="color: #fff; font-family: var(--font-heading); margin-bottom: 0.4rem; font-size: 1.3rem; letter-spacing: 1px;">CARTELERA EN PROGRAMACIÓN</h3>
                <p style="color: var(--text-gray); font-size: 0.85rem; max-width: 440px; margin: 0 auto;">
                    La promotora aún no ha pactado combates para esta cartelera. ¡Vuelve pronto para consultar los enfrentamientos estelares y preliminares!
                </p>
            </div>
        `;
    } else {
        const estelares = fights.filter(f => f.type === 'estelar');
        const prelims = fights.filter(f => f.type !== 'estelar');

        const renderFighterCard = (f, alignRight = false) => {
            const avatarHtml = f.avatar && (f.avatar.startsWith('http') || f.avatar.startsWith('/uploads/'))
                ? `<img src="${f.avatar}" alt="${f.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                : `<i class="fas fa-user-ninja" style="font-size: 1.4rem; color: var(--accent-red);"></i>`;

            return `
                <div style="flex: 1; display: flex; align-items: center; gap: 0.8rem; ${alignRight ? 'justify-content: flex-end; text-align: right;' : 'text-align: left;'}">
                    ${!alignRight ? `<div style="width: 52px; height: 52px; border-radius: 50%; background: #16161a; overflow: hidden; border: 2px solid rgba(230,36,41,0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 10px rgba(230,36,41,0.2);">${avatarHtml}</div>` : ''}
                    <div style="overflow: hidden;">
                        <h4 style="color: #fff; margin: 0; font-family: var(--font-heading); font-size: 1.05rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.5px;">${f.name}</h4>
                        <p style="color: var(--accent-red); margin: 0.15rem 0; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">${f.alias ? `"${f.alias}"` : ''}</p>
                        <small style="color: var(--text-gray); font-size: 0.72rem; display: block;">RÉCORD: ${f.record || '0-0-0'}</small>
                    </div>
                    ${alignRight ? `<div style="width: 52px; height: 52px; border-radius: 50%; background: #16161a; overflow: hidden; border: 2px solid rgba(230,36,41,0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 10px rgba(230,36,41,0.2);">${avatarHtml}</div>` : ''}
                </div>
            `;
        };

        const renderBoutRow = (b, isMain = false) => {
            return `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid ${isMain ? 'rgba(230,36,41,0.3)' : 'rgba(255,255,255,0.08)'}; border-radius: 12px; padding: 1.2rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; position: relative; overflow: hidden; transition: transform 0.2s;">
                    ${isMain ? `<div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, var(--accent-red), transparent);"></div>` : ''}
                    ${renderFighterCard(b.fighter1, false)}
                    
                    <div style="text-align: center; flex-shrink: 0; padding: 0 0.8rem;">
                        <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--accent-red); color: #fff; font-family: var(--font-heading); font-weight: bold; font-size: 0.88rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.3rem auto; box-shadow: 0 0 12px rgba(230,36,41,0.4);">
                            VS
                        </div>
                        <span style="display: block; font-size: 0.72rem; color: #fff; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">${b.weightClass || 'Peso Pactado'}</span>
                        <small style="color: #ff9800; font-size: 0.68rem; font-weight: bold;"><i class="fas fa-stopwatch"></i> ${b.rounds || 3} ASALTOS</small>
                    </div>

                    ${renderFighterCard(b.fighter2, true)}
                </div>
            `;
        };

        let html = '';

        if (estelares.length > 0) {
            html += `
                <div style="margin-bottom: 1.8rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.8rem; border-bottom: 1px solid rgba(255,193,7,0.2); padding-bottom: 0.4rem;">
                        <i class="fas fa-star" style="color: #ffc107; font-size: 0.9rem;"></i>
                        <h3 style="color: #fff; font-family: var(--font-heading); font-size: 1.15rem; margin: 0; letter-spacing: 1px;">CARTELERA ESTELAR (MAIN CARD)</h3>
                    </div>
                    ${estelares.map(b => renderBoutRow(b, true)).join('')}
                </div>
            `;
        }

        if (prelims.length > 0) {
            html += `
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4rem;">
                        <i class="fas fa-fist-raised" style="color: var(--accent-red); font-size: 0.9rem;"></i>
                        <h3 style="color: #fff; font-family: var(--font-heading); font-size: 1.15rem; margin: 0; letter-spacing: 1px;">CARTELERA PRELIMINAR (PRELIMS)</h3>
                    </div>
                    ${prelims.map(b => renderBoutRow(b, false)).join('')}
                </div>
            `;
        }

        container.innerHTML = html;
    }

    const cerrarModal = () => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    };

    if (closeBtn) closeBtn.onclick = cerrarModal;
    modal.onclick = (e) => {
        if (e.target === modal) cerrarModal();
    };

    const handleEsc = (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            cerrarModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

// ============================================================================
// 2. EFECTOS VISUALES 3D (TILT EFFECT)
// ============================================================================

/**
 * Agrega escucha de eventos del ratón a cada tarjeta `.event-card` para aplicar
 * una transformación de rotación 3D realista proporcional a la posición del cursor.
 * 
 * @function attachTiltEffect
 * @returns {void}
 */
function attachTiltEffect() {
    const cards = document.querySelectorAll('.event-card');
    cards.forEach(card => {
        // Cálculo de inclinación en los ejes X e Y durante el movimiento
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;
            
            card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
        });

        // Retorno suave a la posición inicial al retirar el cursor
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.transition = 'transform 0.5s ease';
        });

        // Remueve la transición mientras el cursor está sobre la tarjeta para respuesta inmediata
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
        });
    });
}
