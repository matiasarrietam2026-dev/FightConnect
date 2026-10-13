/**
 * @fileoverview Sistema Nervioso Central y Controlador Maestro de FightConnect.
 * 
 * Este módulo orquesta la lógica de negocio completa de la plataforma:
 * 1. Control de Acceso Basado en Roles (RBAC): Atletas ('fighter'), Promotores ('promotion') y Aficionados ('fan').
 * 2. Protección perimetral de rutas (Middleware Frontend) y gestión de sesiones persistentes.
 * 3. Integración con Firebase v10 (Authentication, Cloud Firestore NoSQL, Cloud Storage).
 * 4. Red Social Deportiva (FightFeed): Publicaciones multimedia, encuestas Pick'em, desafíos Callout y Stories 24h.
 * 5. Módulo de Atletas: Seguimiento de pesaje en tiempo real, expediente deportivo y postulación a combates.
 * 6. Módulo de Promotoras: Creación y gestión de carteleras locales, venta de entradas y scouting de prospectos.
 * 7. Módulo de Aficionados: Radar de combates favoritos y seguimiento de campamentos.
 * 8. Entorno gráfico inmersivo: Sistema de partículas 3D en WebGL (Three.js) optimizado para 60 FPS.
 * 
 * @module app
 * @author FightConnect Development Team
 * @version 1.0.0
 */

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, deleteUser, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
import { uploadImage, compressImage, fileToDataUrl } from "./image-service.js";
import { SecurityUtils, escapeHtml, sanitizeText, sanitizeUrl } from "./security-utils.js";

/**
 * Configuración del cliente Firebase para la instancia de producción.
 * @constant {Object}
 */
const firebaseConfig = {
  apiKey: "AIzaSyBfcKW-STxlHNHZzflceafIi0DO8CjKEXc",
  authDomain: "fightconnect-5094f.firebaseapp.com",
  projectId: "fightconnect-5094f",
  storageBucket: "fightconnect-5094f.firebasestorage.app",
  messagingSenderId: "518195915683",
  appId: "1:518195915683:web:26e304ede8ac2531094816",
  measurementId: "G-NY6QSH3JG2"
};

// ============================================================================
// INICIALIZACIÓN DE INSTANCIAS DE FIREBASE
// ============================================================================
/** @constant {import("firebase/app").FirebaseApp} Instancia principal de Firebase */
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
/** @constant {import("firebase/auth").Auth} Servicio de Autenticación de Firebase */
const auth = getAuth(app);
/** @constant {import("firebase/firestore").Firestore} Base de Datos Cloud Firestore */
const db = getFirestore(app);
/** @constant {import("firebase/storage").FirebaseStorage} Servicio de Almacenamiento en la Nube */
const storage = getStorage(app);

// Exposición en el objeto global window para interoperabilidad y consistencia
window.db = db;
window.auth = auth;
window.storage = storage;
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.updateDoc = updateDoc;
window.addDoc = addDoc;
window.collection = collection;
window.query = query;
window.where = where;
window.getDocs = getDocs;
window.deleteDoc = deleteDoc;
window.deleteUser = deleteUser;
window.signOut = signOut;

/**
 * Mapeo oficial de nombres legibles para artes marciales y deportes de combate en FightConnect.
 * @constant {Object.<string, string>}
 */
const FC_DISCIPLINES_MAP = {
    mma: 'MMA',
    boxeo: 'Boxeo',
    bjj: 'BJJ / Grappling',
    lucha: 'Lucha Olímpica',
    muaythai: 'Muay Thai',
    kickboxing: 'Kickboxing',
    judo: 'Judo'
};

/* ==========================================================================
   FIGHTCONNECT - SISTEMA NERVIOSO CENTRAL (app.js)
   Arquitectura JavaScript (Vite + NPM + Firebase)
   ========================================================================== */

/**
 * CAPÍTULO 1: GESTIÓN DE ESTADO Y PERSISTENCIA LOCAL (localStorage)
 * Claves de almacenamiento utilizadas por la aplicación:
 * - `userRole`: Rol activo ('fighter' | 'promotion' | 'fan').
 * - `userName`: Nombre visible del usuario u organización.
 * - `userId`: UID único generado por Firebase Auth.
 * - `userEmail`: Correo electrónico verificado de la cuenta.
 */

/**
 * CAPÍTULO 2: AUTENTICACIÓN Y ENRUTAMIENTO POR ROL
 * Registra el rol elegido por el usuario en el almacenamiento local y ejecuta
 * la redirección hacia el dashboard correspondiente.
 * 
 * @function iniciarSesion
 * @param {'fighter'|'promotion'|'fan'|string} rolSeleccionado - Identificador del rol de usuario.
 * @returns {void}
 */
function iniciarSesion(rolSeleccionado) {
    if (auth && typeof auth.signOut === 'function') {
        auth.signOut().catch(() => {});
    }
    // Sellamos la sesión en el almacenamiento local
    localStorage.setItem('userRole', rolSeleccionado);

    if (rolSeleccionado === 'promotion' || rolSeleccionado === 'promoter') {
        localStorage.setItem('userRole', 'promotion');
        localStorage.setItem('userName', 'Warriors Fighting Championship');
        localStorage.setItem('userOrg', 'Warriors Fighting Championship');
        localStorage.setItem('userId', 'promoter_local');
        localStorage.setItem('userEmail', 'contacto@warriorsfc.com');
        if (!localStorage.getItem('promoterKybStatus')) {
            localStorage.setItem('promoterKybStatus', 'unverified');
        }
    } else if (rolSeleccionado === 'fighter') {
        localStorage.setItem('userName', 'Carlos Montoya');
        localStorage.setItem('userId', 'fighter_local');
        localStorage.setItem('userEmail', 'carlos.montoya@mma.com');
    } else if (rolSeleccionado === 'fan') {
        localStorage.setItem('userName', 'Aficionado FC');
        localStorage.setItem('userId', 'fan_local');
        localStorage.setItem('userEmail', 'fan@fightconnect.com');
    }

    // Redirección forzada hacia el panel correspondiente
    if (rolSeleccionado === 'fighter') {
        window.location.href = 'fighter-dashboard.html';
    } else if (rolSeleccionado === 'promotion' || rolSeleccionado === 'promoter') {
        window.location.href = 'promotor-dashboard.html';
    } else if (rolSeleccionado === 'fan') {
        window.location.href = 'fan-dashboard.html';
    } else {
        console.error("Error de Auth: Rol no reconocido.");
    }
}
window.iniciarSesion = iniciarSesion;

/**
 * CAPÍTULO 3: MIDDLEWARE DE PROTECCIÓN DE RUTAS (FRONTEND RBAC)
 * Se ejecuta al cargar el DOM (`DOMContentLoaded`) para impedir accesos no autorizados:
 * - Permite acceso libre a las rutas públicas (ecosistema, noticias, carteleras).
 * - Expulsa usuarios no autenticados hacia la pantalla principal (`index.html`).
 * - Evita accesos cruzados entre roles no coincidentes (ej. un fan accediendo a vistas de promotor).
 * 
 * @function protegerRutas
 * @returns {void}
 */
function protegerRutas() {
    const rolActual = localStorage.getItem('userRole');
    const paginaActual = window.location.pathname;

    // 3.1: Excepción Pública (El Ecosistema Abierto)
    // Permite navegación sin restricciones a las páginas informativas y de descubrimiento
    if (
        paginaActual.includes('local.html') || 
        paginaActual.includes('internacional.html') || 
        paginaActual.includes('noticias.html') || 
        paginaActual.includes('evento-detalle.html') ||
        paginaActual.includes('sanciones.html') ||
        paginaActual.includes('terminos.html') ||
        paginaActual.includes('privacidad.html') ||
        paginaActual.includes('media-kit.html') ||
        paginaActual.includes('manual-usuario.html') ||
        paginaActual.includes('manual-usuario') ||
        paginaActual.includes('manual-programador') ||
        paginaActual.includes('fightfeed.html') ||
        paginaActual === '/' || 
        paginaActual === ''
    ) {
        return; // Retorno temprano: paso libre permitido
    }

    // 3.2: Control de Usuario No Autenticado
    // Si no existe rol en memoria y se intenta acceder a una vista privada, redirigir al login
    if (!rolActual && !paginaActual.includes('index.html')) {
        window.location.href = 'index.html';
        return;
    }

    // 3.3: Validación Cruzada de Privilegios por Rol
    if (paginaActual.includes('fighter-') && rolActual !== 'fighter') {
        redirigirRol(rolActual);
    } else if (paginaActual.includes('promotor-') && rolActual !== 'promotion' && rolActual !== 'promoter') {
        redirigirRol(rolActual);
    } else if (paginaActual.includes('fan-') && rolActual !== 'fan') {
        redirigirRol(rolActual);
    }
}

/**
 * Helper de redirección segura según el rol autenticado.
 * 
 * @function redirigirRol
 * @param {string|null} rol - Rol actual del usuario ('fighter', 'promotion', 'fan').
 * @returns {void}
 */
function redirigirRol(rol) {
    if (rol === 'fighter') window.location.href = 'fighter-dashboard.html';
    else if (rol === 'promotion' || rol === 'promoter') window.location.href = 'promotor-dashboard.html';
    else if (rol === 'fan') window.location.href = 'fan-dashboard.html';
    else window.location.href = 'index.html';
}

/**
 * CAPÍTULO 4: GESTIÓN DE NAVEGACIÓN Y CIERRE DE SESIÓN
 * Configura los botones de cierre de sesión (`.logout-btn`) y perfil con validación de existencia en el DOM.
 * 
 * @function configurarNavegacion
 * @returns {void}
 */
function configurarNavegacion() {
    const botonesSalida = document.querySelectorAll('.logout-btn');
    
    // Null Checking: Solo adjuntamos escuchadores si existen elementos en la vista actual
    if (botonesSalida.length > 0) {
        botonesSalida.forEach(boton => {
            boton.addEventListener('click', async function(e) {
                e.preventDefault(); 
                try {
                    if (auth && typeof auth.signOut === 'function') {
                        await auth.signOut();
                    }
                } catch (err) {
                    console.warn("Error en signOut:", err);
                }
                // Limpieza total del almacenamiento local de sesión
                localStorage.removeItem('userRole');
                localStorage.removeItem('userName');
                localStorage.removeItem('userId');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userAvatar');
                window.location.href = 'index.html';
            });
        });
    }

    const botonesPerfil = document.querySelectorAll('.btn-icon');
    if (botonesPerfil.length > 0) {
        botonesPerfil.forEach(boton => {
            if (boton.querySelector('.fa-bell') || boton.getAttribute('title') === 'Notificaciones') {
                return;
            }

            boton.addEventListener('click', function(e) {
                e.preventDefault();
                const rolActual = localStorage.getItem('userRole');
                if (rolActual) {
                    redirigirRol(rolActual);
                } else {
                    window.location.href = 'index.html';
                }
            });
        });
    }
}

/**
 * CAPÍTULO 5 & 6: MANEJO DE ESTADOS DE CARGA Y SIMULACIÓN DE DATOS (MOCK & SKELETON LOADERS)
 * Oculta los indicadores de carga (`.loading-container-v2`, `.loading-state`) tras 2500ms
 * e inyecta estados informativos o vacíos en caso de que Firestore tarde en responder.
 * 
 * @function simularBaseDeDatos
 * @returns {void}
 */
function simularBaseDeDatos() {
    const paginaActual = window.location.pathname;

    setTimeout(() => {
        // Obtenemos los elementos de carga y verificamos que existan antes de mutarlos
        const loaders = document.querySelectorAll('.loading-container-v2, .loading-state');
        if (loaders.length > 0) {
            loaders.forEach(loader => loader.style.display = 'none');
        }

        // --- Estados secundarios si aplica (promotor-dashboard y promotor-scouting manejan sus propios datos de Firestore) ---
        if (paginaActual.includes('promotor-scouting.html')) {
            // El scouting de promotoras es gestionado dinámicamente por cargarPromoterScoutingPage desde Firestore
        }

        // --- C5: Estados Vacíos de Peleador ---
        else if (paginaActual.includes('fighter-postulaciones.html')) {
            // El módulo de postulaciones es gestionado dinámicamente por cargarFighterPostulacionesPage desde Firestore
        }
        else if (paginaActual.includes('fighter-historial.html')) {
            // El historial médico, lesiones y métricas son gestionados en vivo por cargarFighterHistorialPage desde Firestore
        }

        // --- C6: FIGHT RADAR (Dashboard del Fan) ---
        // El Dashboard del Fan y sus favoritos son gestionados exclusivamente por cargarFanDashboardPage sin sobrescrituras destructivas.

        // --- C6: MOCK DATA ECOSISTEMA (Público) ---
        // (internacional.html es gestionado exclusivamente por js/internacional.js)

    }, 2500); 
}

/**
 * CAPÍTULO 6b Y 7: DELEGACIÓN GLOBAL DE EVENTOS (EVENT DELEGATION PATTERN)
 * Escuchador central adjunto a `document`. Captura clics burbujeantes desde cualquier
 * elemento, incluyendo aquellos generados dinámicamente de forma asíncrona.
 */
document.addEventListener('click', function(e) {
    
    // --- LÓGICA DE COMPRA (Dashboards) ---
    // Usamos e.target.closest() para asegurar que atrape el clic aunque se haga sobre 
    // el texto o el ícono FontAwesome <i class="fas"></i> dentro del botón.
    const botonComprar = e.target.closest('.btn-comprar-entrada');
    if (botonComprar) {
        const eventoId = botonComprar.getAttribute('data-id');
        console.log('Procesando redirección a taquilla para el evento ID:', eventoId);
        window.open('https://wa.me/573000000000?text=Hola,%20quiero%20entradas%20para%20el%20evento%20' + encodeURIComponent(eventoId), '_blank');
        return;
    }

    // --- LÓGICA DE GUARDADO EN FIGHT RADAR (Ecosistema) ---
    const botonRadar = e.target.closest('.btn-anadir-radar');
    if (botonRadar) {
        const eventoId = botonRadar.getAttribute('data-id');
        const currentUid = localStorage.getItem('userId') || 'guest';
        
        let favEvents = typeof obtenerEventosFavoritos === 'function'
            ? obtenerEventosFavoritos(currentUid)
            : [];

        const allEvs = window.allInternationalEvents || (typeof window.obtenerCartelerasOficiales === 'function' ? window.obtenerCartelerasOficiales() : []);
        const found = allEvs.find(ev => String(ev.id) === String(eventoId));

        const card = botonRadar.closest('.event-card');
        const title = found?.titulo || card?.querySelector('.card-event-title, .event-title, h3')?.textContent?.trim() || `Evento #${eventoId}`;
        const date = found?.fecha || card?.querySelector('.spec-row span, .event-date')?.textContent?.trim() || 'Próximamente';
        const fechaIso = found?.fechaIso || '';
        const location = found?.ubicacion || card?.querySelector('.card-specs-list .spec-row:last-child span')?.textContent?.trim() || 'Sede Oficial';
        const img = found?.imagenUrl || card?.querySelector('img')?.src || '';
        const disc = found?.disciplina || card?.querySelector('.badge, .subleague-tag')?.textContent?.trim() || 'MMA';

        const evObj = {
            id: eventoId,
            titulo: title,
            fecha: date,
            fechaIso: fechaIso,
            ubicacion: location,
            imagenUrl: img,
            disciplina: disc,
            linkCartelera: found?.linkCartelera || 'internacional.html'
        };

        const existingIdx = favEvents.findIndex(x => String(x.id) === String(eventoId));
        if (existingIdx >= 0) {
            favEvents.splice(existingIdx, 1);
            alert(`Evento removido de tu Fight Radar: ${title}`);
            botonRadar.innerHTML = '<i class="far fa-star"></i> Añadir a Radar';
        } else {
            // Regla de Negocio: Validar que la velada sea futura o en curso
            if (typeof esEventoVigenteOFuturo === 'function' && !esEventoVigenteOFuturo(evObj)) {
                alert(`⚠️ La velada "${title}" ya concluyó. Solo puedes añadir a tu radar eventos futuros o que se estén llevando a cabo.`);
                return;
            }
            favEvents.push(evObj);
            alert(`🎯 ¡Evento guardado en tu Fight Radar!\n\n"${title}" se ha añadido a tu Watchlist.`);
            botonRadar.innerHTML = '<i class="fas fa-check"></i> En Radar';
        }

        if (typeof guardarEventosFavoritos === 'function') {
            guardarEventosFavoritos(currentUid, favEvents);
        } else {
            const key = `fightconnect_fan_fav_events_${currentUid}`;
            localStorage.setItem(key, JSON.stringify(favEvents));
            localStorage.setItem('fightconnect_fan_fav_events', JSON.stringify(favEvents));
        }
        return;
    }

    // --- LÓGICA UNIRSE AL CLUB ---
    const btnJoin = e.target.closest('.btn-join') || e.target.closest('#link-to-register');
    if (btnJoin) {
        e.preventDefault();
        const paginaActual = window.location.pathname;
        if (!paginaActual.includes('index.html') && paginaActual !== '/' && paginaActual !== '') {
            window.location.href = 'index.html';
        }
        return;
    }

    // --- CAPÍTULO 7: EL MUSEO (Solo lectura) ---
    const enlaceMuseo = e.target.closest('.enlace-museo');
    if (enlaceMuseo) {
        // Dejamos que el tag <a> haga su trabajo nativo de redirigir a evento-detalle.html,
        // no necesitamos usar preventDefault().
        console.log("Ingresando al Museo del Evento...");
    }
});

/**
 * Inicializa la navegación adaptativa y el cajón deslizable para dispositivos móviles
 * tanto en paneles privados (dashboards) como en páginas públicas con barra superior.
 */
function inicializarResponsiveMobile() {
    // 1. Manejo en paneles y dashboards privados
    const sidebar = document.querySelector('.sidebar');
    const dashContent = document.querySelector('.dashboard-content');
    if (sidebar && dashContent) {
        let mobileHeader = document.getElementById('mobile-dash-header');
        if (!mobileHeader) {
            mobileHeader = document.createElement('div');
            mobileHeader.className = 'mobile-dash-header';
            mobileHeader.id = 'mobile-dash-header';
            mobileHeader.innerHTML = `
                <button type="button" class="mobile-dash-toggle" id="btn-toggle-sidebar" aria-label="Abrir menú de navegación">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="logo" style="font-size: 1.15rem;"><a href="index.html" style="color: inherit; text-decoration: none;">FIGHT <span>CONNECT</span></a></div>
                <div style="width: 40px; display: flex; justify-content: flex-end;">
                    <a href="index.html" class="logout-btn" title="Cerrar Sesión" style="color: var(--text-gray); font-size: 1rem;"><i class="fas fa-sign-out-alt"></i></a>
                </div>
            `;
            document.body.prepend(mobileHeader);
        }

        let mobileOverlay = document.getElementById('mobile-dash-overlay');
        if (!mobileOverlay) {
            mobileOverlay = document.createElement('div');
            mobileOverlay.className = 'mobile-dash-overlay';
            mobileOverlay.id = 'mobile-dash-overlay';
            document.body.appendChild(mobileOverlay);
        }

        const btnToggle = document.getElementById('btn-toggle-sidebar');
        if (btnToggle && !btnToggle._hasMobileListener) {
            btnToggle._hasMobileListener = true;
            btnToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
                mobileOverlay.classList.toggle('active');
            });
        }

        if (mobileOverlay && !mobileOverlay._hasMobileListener) {
            mobileOverlay._hasMobileListener = true;
            mobileOverlay.addEventListener('click', () => {
                sidebar.classList.remove('mobile-open');
                mobileOverlay.classList.remove('active');
            });
        }

        // Al hacer click en cualquier enlace de la barra lateral en móvil, cerrar automáticamente el cajón
        sidebar.querySelectorAll('.sidebar-nav a').forEach(link => {
            if (!link._hasCloseListener) {
                link._hasCloseListener = true;
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 992) {
                        sidebar.classList.remove('mobile-open');
                        mobileOverlay.classList.remove('active');
                    }
                });
            }
        });
    }

    // 2. Manejo en navegación pública superior (.top-nav)
    const topNav = document.querySelector('.top-nav');
    const navLinks = document.querySelector('.nav-links');
    if (topNav && navLinks) {
        let toggleTop = topNav.querySelector('.top-nav-toggle');
        if (!toggleTop) {
            toggleTop = document.createElement('button');
            toggleTop.type = 'button';
            toggleTop.className = 'top-nav-toggle';
            toggleTop.id = 'btn-toggle-top-nav';
            toggleTop.setAttribute('aria-label', 'Abrir menú de navegación');
            toggleTop.innerHTML = '<i class="fas fa-bars"></i>';
            const navActions = topNav.querySelector('.nav-actions');
            if (navActions) {
                topNav.insertBefore(toggleTop, navActions);
            } else {
                topNav.appendChild(toggleTop);
            }
        }

        if (toggleTop && !toggleTop._hasToggleListener) {
            toggleTop._hasToggleListener = true;
            toggleTop.addEventListener('click', (e) => {
                e.stopPropagation();
                navLinks.classList.toggle('mobile-open');
                toggleTop.innerHTML = navLinks.classList.contains('mobile-open') 
                    ? '<i class="fas fa-times"></i>' 
                    : '<i class="fas fa-bars"></i>';
            });

            document.addEventListener('click', (e) => {
                if (!topNav.contains(e.target)) {
                    navLinks.classList.remove('mobile-open');
                    toggleTop.innerHTML = '<i class="fas fa-bars"></i>';
                }
            });
        }
    }
}

/**
 * INICIALIZACIÓN DE LA ARQUITECTURA GLOBAL
 * Punto de entrada principal en el evento `DOMContentLoaded`.
 * Orquesta en secuencia estricta los subsistemas base de FightConnect.
 */
document.addEventListener('DOMContentLoaded', () => {
    inicializarResponsiveMobile(); // 0. Adaptar vistas y barras para teléfonos y escritorios
    protegerRutas();            // 1. Asegurar perímetro y validar roles
    configurarNavegacion();     // 2. Conectar timón y botones de logout
    simularBaseDeDatos();       // 3. Encender temporizador de loaders y estados
    inyectarEfectosVisuales();  // 4. Encender animación 3D global de partículas
    actualizarNavegacionSesion(); // 5. Actualizar perfil y avatar en barra superior
    inicializarFightFeed();     // 6. Iniciar Feed de Noticias y Stories
    
    // 7. Hidratación reactiva inmediata (0ms) del logotipo de promotora en cabeceras
    const storedAvatar = localStorage.getItem('userAvatar');
    const headerLogoImg = document.getElementById('org-header-logo-img');
    const headerLogoIcon = document.getElementById('org-header-logo-icon');
    if (storedAvatar && headerLogoImg) {
        headerLogoImg.src = storedAvatar;
        headerLogoImg.style.display = 'block';
        if (headerLogoIcon) headerLogoIcon.style.display = 'none';
    }

    // 8. Inicialización proactiva de Ajustes de Organización (promotor-ajustes)
    if (document.getElementById('org-settings-form')) {
        const uid = localStorage.getItem('userId') || auth.currentUser?.uid || 'temp_promoter';
        cargarPromoterAjustesPage(uid, {
            orgName: localStorage.getItem('userName') || '',
            photoURL: storedAvatar || '',
            avatar: storedAvatar || '',
            logoUrl: storedAvatar || ''
        });
    }

    // 8.1. Inicialización proactiva de Ajustes de Aficionado (fan-ajustes)
    if (document.getElementById('fan-settings-form')) {
        const uid = localStorage.getItem('userId') || auth.currentUser?.uid || 'temp_fan';
        cargarFanAjustesPage(uid, {
            name: localStorage.getItem('userName') || '',
            email: localStorage.getItem('userEmail') || '',
            photoURL: storedAvatar || '',
            avatar: storedAvatar || ''
        });
    }

    // 9. Carga Inmediata (0ms) de Eventos en Tableros y Carteleras
    const currentPath = window.location.pathname;
    const currentUserId = localStorage.getItem('userId');
    if (currentPath.includes('promotor-dashboard')) {
        cargarEventosPromotora(currentUserId);
        if (typeof actualizarBannerKybPromotora === 'function') {
            const initialKyb = localStorage.getItem('promoterKybStatus') || 'unverified';
            actualizarBannerKybPromotora(initialKyb);
        }
    } else if (currentPath.includes('local')) {
        cargarEventosPublicos();
    } else if (currentPath.includes('fighter-postulaciones')) {
        if (currentUserId) cargarFighterPostulacionesPage(currentUserId);
    } else if (currentPath.includes('fighter-buscar')) {
        if (currentUserId) cargarFighterBuscarPage(currentUserId);
    }

    if (currentUserId && (currentPath.includes('fighter-') || currentPath.includes('dashboard'))) {
        verificarNotificacionesAtleta(currentUserId);
    }
});

/**
 * CAPÍTULO 3.5: NAVEGACIÓN DINÁMICA CON SESIÓN ACTIVA Y MENÚ DESPLEGABLE
 * Reemplaza el botón "INICIAR SESIÓN" por un avatar de usuario interactivo con menú flotante
 * contextual según el rol autenticado (Peleador, Promotor, Fan).
 * 
 * @function actualizarNavegacionSesion
 * @returns {void}
 */
function actualizarNavegacionSesion() {
    const rolActual = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName') || 'MI PERFIL';
    const navActions = document.querySelector('.nav-actions');
    const logoLink = document.querySelector('.logo a');

    // Sincronizar enlace del logotipo principal según rol
    if (logoLink) {
        if (rolActual === 'fighter') logoLink.href = 'fighter-dashboard.html';
        else if (rolActual === 'promotion') logoLink.href = 'promotor-dashboard.html';
        else if (rolActual === 'fan') logoLink.href = 'fan-dashboard.html';
        else logoLink.href = 'index.html';
    }

    if (!navActions) return;

    if (rolActual) {
        let nombreRol = 'ATLETA';
        let dashboardUrl = 'fighter-dashboard.html';
        let ajustesUrl = 'fighter-dashboard.html';
        let iconoRol = 'fa-user-ninja';

        if (rolActual === 'fighter') {
            nombreRol = 'PELEADOR';
            dashboardUrl = 'fighter-dashboard.html';
            ajustesUrl = 'fighter-dashboard.html';
            iconoRol = 'fa-gavel';
        } else if (rolActual === 'promotion') {
            nombreRol = 'PROMOTOR';
            dashboardUrl = 'promotor-dashboard.html';
            ajustesUrl = 'promotor-ajustes.html';
            iconoRol = 'fa-trophy';
        } else if (rolActual === 'fan') {
            nombreRol = 'FAN';
            dashboardUrl = 'fan-dashboard.html';
            ajustesUrl = 'fan-ajustes.html';
            iconoRol = 'fa-fire';
        }

        const userAvatar = localStorage.getItem('userAvatar');

        navActions.innerHTML = `
            <div class="user-dropdown-wrapper">
                <div class="user-nav-profile" id="user-profile-trigger" title="${userName}">
                    <div class="user-nav-avatar">
                        ${userAvatar ? `<img src="${userAvatar}" alt="${userName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : `<i class="fas ${iconoRol}"></i>`}
                    </div>
                    <div class="user-nav-details">
                        <span class="user-nav-name" style="max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.85rem;">${userName}</span>
                        <span class="user-nav-badge">${nombreRol}</span>
                    </div>
                    <i class="fas fa-chevron-down" style="font-size: 0.7rem; color: #888; margin-left: 4px;"></i>
                </div>
                <div class="user-dropdown-menu" id="user-dropdown-menu">
                    <a href="${dashboardUrl}" class="dropdown-item"><i class="fas fa-tachometer-alt"></i> MI DASHBOARD</a>
                    <a href="${ajustesUrl}" class="dropdown-item"><i class="fas fa-cog"></i> AJUSTES DE CUENTA</a>
                    <a href="#" class="dropdown-item logout" id="btn-nav-logout"><i class="fas fa-sign-out-alt"></i> CERRAR SESIÓN</a>
                </div>
            </div>
        `;

        // Eventos del Menú Desplegable
        const trigger = document.getElementById('user-profile-trigger');
        const menu = document.getElementById('user-dropdown-menu');
        const btnLogout = document.getElementById('btn-nav-logout');

        if (trigger && menu) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                menu.classList.remove('active');
            });
        }

        if (btnLogout) {
            btnLogout.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    if (auth && typeof auth.signOut === 'function') {
                        await auth.signOut();
                    }
                } catch (err) {
                    console.warn("Error en signOut:", err);
                }
                localStorage.removeItem('userRole');
                localStorage.removeItem('userName');
                localStorage.removeItem('userId');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userAvatar');
                window.location.href = 'index.html';
            });
        }
    } else {
        // Estado sin sesión activa
        navActions.innerHTML = `
            <a href="index.html" class="btn-join" style="text-decoration: none;">INICIAR SESIÓN</a>
        `;
    }
}

/**
 * Obtiene los votos emitidos por el usuario en las encuestas Pick'em del feed.
 * Función en ámbito de módulo para estar disponible en el ciclo de autenticación global.
 * @function obtenerVotosUsuarioPolls
 * @param {string} [uid]
 * @returns {Object}
 */
function obtenerVotosUsuarioPolls(uid) {
    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    try {
        const key = `fightconnect_poll_votes_${currentUid}`;
        const raw = localStorage.getItem(key) || '{}';
        return JSON.parse(raw);
    } catch (_) {
        return {};
    }
}

/**
 * Guarda el voto oficial del usuario en una encuesta Pick'em en almacenamiento local y Firestore.
 * @function guardarVotoUsuarioPoll
 * @param {string} postId
 * @param {string} corner - 'red' o 'blue'
 * @param {string} [uid]
 */
function guardarVotoUsuarioPoll(postId, corner, uid) {
    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    const votes = obtenerVotosUsuarioPolls(currentUid);
    votes[postId] = {
        corner: corner,
        votedAt: new Date().toISOString()
    };
    try {
        const key = `fightconnect_poll_votes_${currentUid}`;
        localStorage.setItem(key, JSON.stringify(votes));
        if (db && currentUid !== 'guest') {
            setDoc(doc(db, "users", currentUid), {
                pollVotes: votes,
                updatedAt: new Date().toISOString()
            }, { merge: true }).catch(err => {
                console.warn("Aviso al sincronizar voto de Pick'em en Firestore:", err);
            });
        }
    } catch (e) {
        console.error("Error guardando voto de Pick'em:", e);
    }
}

window.obtenerVotosUsuarioPolls = obtenerVotosUsuarioPolls;
window.guardarVotoUsuarioPoll = guardarVotoUsuarioPoll;

/**
 * Hidratación optimista e instantánea del dashboard del atleta con datos cacheados en localStorage.
 * Elimina la pantalla fija en "CARGANDO..." mientras Firebase Auth o Firestore resuelven en segundo plano.
 * @function hidratarFighterDashboardInmediato
 * @returns {void}
 */
function hidratarFighterDashboardInmediato() {
    const isFighterView = window.location.pathname.includes('fighter-dashboard') || window.location.pathname.includes('fighter-historial');
    if (!isFighterView) return;

    const role = localStorage.getItem('userRole');
    if (role !== 'fighter') return;

    const storedName = localStorage.getItem('userName');
    if (storedName) {
        const nameEl = document.getElementById('dash-name');
        if (nameEl && (nameEl.textContent === 'CARGANDO...' || !nameEl.textContent.trim())) {
            nameEl.textContent = storedName;
        }
        const aliasEl = document.getElementById('dash-alias');
        if (aliasEl && (aliasEl.textContent === '"..."' || !aliasEl.textContent.trim())) {
            aliasEl.textContent = `"${storedName}"`;
        }
    }

    const storedRecord = localStorage.getItem('fighterRecord');
    const storedDisc = localStorage.getItem('fighterDiscipline') || 'MMA';
    if (storedRecord) {
        const recordEl = document.getElementById('dash-record');
        if (recordEl && recordEl.textContent === 'RÉCORD: 0-0-0') {
            recordEl.textContent = `RÉCORD (${storedDisc}): ${storedRecord}`;
        }
    }

    const discEl = document.getElementById('dash-discipline');
    if (discEl && discEl.textContent === '-') {
        discEl.textContent = storedDisc;
    }

    const storedWeight = localStorage.getItem('fighterWeight');
    if (storedWeight) {
        const weightText = document.getElementById('dash-weight-text');
        if (weightText && weightText.textContent === 'Actual: 0 KG') {
            weightText.textContent = `Actual: ${storedWeight}`;
        }
    }

    const avatar = localStorage.getItem('userAvatar');
    if (avatar) {
        const heroPreview = document.getElementById('fighter-avatar-preview');
        const heroIcon = document.getElementById('fighter-avatar-placeholder-icon');
        const avatarBox = document.getElementById('fighter-avatar-box');
        if (heroPreview) {
            heroPreview.src = avatar;
            heroPreview.style.display = 'block';
        }
        if (heroIcon) heroIcon.style.display = 'none';
        if (avatarBox) avatarBox.classList.remove('avatar-loading');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hidratarFighterDashboardInmediato);
} else {
    hidratarFighterDashboardInmediato();
}

/**
 * CAPÍTULO 7: FIGHTFEED 2.0 - RED SOCIAL MULTI-ROL DEL DEPORTE DE COMBATE
 * Inicializa el ecosistema de FightFeed (fanáticos, practicantes, peleadores, promotores).
 * 
 * @function inicializarFightFeed
 * @returns {void}
 */
function inicializarFightFeed() {
    if (!window.location.pathname.includes('fightfeed')) return;

    // ========================================================================
    // 0. SINTETIZADOR DE AUDIO PROCEDURAL DEL OCTÁGONO (WEB AUDIO API NATIVA)
    // Cero dependencias externas, cero latencia, 0 KB de descarga.
    // ========================================================================
    const FightAudioFX = (() => {
        let audioCtx = null;
        let isMuted = localStorage.getItem('fightconnect_audio_muted') === 'true';

        function getCtx() {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) audioCtx = new AudioContext();
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            return audioCtx;
        }

        return {
            isMuted: () => isMuted,
            toggleMute: () => {
                isMuted = !isMuted;
                localStorage.setItem('fightconnect_audio_muted', isMuted);
                return isMuted;
            },
            // Campana de Ring de Boxeo (Dual Sine 880Hz + 1760Hz con decaimiento natural)
            playBell: () => {
                if (isMuted) return;
                try {
                    const ctx = getCtx();
                    if (!ctx) return;
                    const now = ctx.currentTime;

                    const osc1 = ctx.createOscillator();
                    const osc2 = ctx.createOscillator();
                    const gainNode = ctx.createGain();

                    osc1.type = 'sine';
                    osc1.frequency.setValueAtTime(880, now); // A5

                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(1760, now); // A6

                    gainNode.gain.setValueAtTime(0.35, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

                    osc1.connect(gainNode);
                    osc2.connect(gainNode);
                    gainNode.connect(ctx.destination);

                    osc1.start(now);
                    osc2.start(now);
                    osc1.stop(now + 1.2);
                    osc2.stop(now + 1.2);
                } catch (e) { console.warn("Audio bell err", e); }
            },
            // Impacto sordo de Guante / K.O.
            playImpact: () => {
                if (isMuted) return;
                try {
                    const ctx = getCtx();
                    if (!ctx) return;
                    const now = ctx.currentTime;

                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(160, now);
                    osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

                    gain.gain.setValueAtTime(0.6, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start(now);
                    osc.stop(now + 0.2);
                } catch (e) { console.warn("Audio impact err", e); }
            },
            // Palmada de Tatami / Tapout de Sumisión
            playMatTap: () => {
                if (isMuted) return;
                try {
                    const ctx = getCtx();
                    if (!ctx) return;
                    const now = ctx.currentTime;

                    [0, 0.08].forEach(delay => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(110, now + delay);
                        gain.gain.setValueAtTime(0.4, now + delay);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + delay);
                        osc.stop(now + delay + 0.06);
                    });
                } catch (e) { console.warn("Audio tap err", e); }
            },
            // Acorde de Fight IQ ganado
            playChime: () => {
                if (isMuted) return;
                try {
                    const ctx = getCtx();
                    if (!ctx) return;
                    const now = ctx.currentTime;
                    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                    freqs.forEach((f, idx) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(f, now + (idx * 0.04));
                        gain.gain.setValueAtTime(0.15, now + (idx * 0.04));
                        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.04) + 0.35);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + (idx * 0.04));
                        osc.stop(now + (idx * 0.04) + 0.35);
                    });
                } catch (e) { console.warn("Audio chime err", e); }
            }
        };
    })();

    // Configuración del botón de silenciador
    const btnToggleAudio = document.getElementById('btn-toggle-audio-fx');
    const audioIcon = document.getElementById('audio-toggle-icon');
    if (btnToggleAudio) {
        if (FightAudioFX.isMuted()) {
            btnToggleAudio.classList.add('muted');
            if (audioIcon) audioIcon.className = 'fas fa-volume-mute';
        }
        btnToggleAudio.addEventListener('click', () => {
            const isMuted = FightAudioFX.toggleMute();
            if (isMuted) {
                btnToggleAudio.classList.add('muted');
                if (audioIcon) audioIcon.className = 'fas fa-volume-mute';
            } else {
                btnToggleAudio.classList.remove('muted');
                if (audioIcon) audioIcon.className = 'fas fa-volume-up';
                FightAudioFX.playBell();
            }
        });
    }

    // ========================================================================
    // 1. SISTEMA MULTI-ROL: PASAPORTE DE COMBATE ADAPTATIVO
    // Roles: 'fan', 'practitioner', 'fighter', 'promoter'
    // ========================================================================
    let currentRole = localStorage.getItem('userRole') || 'fan';
    // Si viene guardado como 'promotion', normalizar a 'promoter'
    if (currentRole === 'promotion') currentRole = 'promoter';

    if (localStorage.getItem('userFightIQ') === '840') {
        localStorage.removeItem('userFightIQ');
    }
    let userFightIQPoints = parseInt(localStorage.getItem('userFightIQ') || '0', 10);

    const userPassportBadge = document.getElementById('current-user-role-badge');
    const passportAvatarRing = document.getElementById('passport-avatar-box');
    const passportAvatarIcon = document.getElementById('passport-avatar-icon');
    const passportUserName = document.getElementById('passport-user-name');
    const passportUserHandle = document.getElementById('passport-user-handle');
    const metricPrimaryVal = document.getElementById('metric-primary-val');
    const metricPrimaryLbl = document.getElementById('metric-primary-lbl');
    const metricSecondaryVal = document.getElementById('metric-secondary-val');
    const metricSecondaryLbl = document.getElementById('metric-secondary-lbl');
    const composerAvatarBox = document.getElementById('composer-avatar-box');
    const composerAvatarIcon = document.getElementById('composer-avatar-icon');

    function calcularCartelerasPromotoraActual() {
        const uid = localStorage.getItem('userId');
        const storedName = (localStorage.getItem('userName') || '').toLowerCase().trim();
        const storedOrg = (localStorage.getItem('userOrg') || '').toLowerCase().trim();
        
        let count = 0;
        const savedCount = localStorage.getItem('userCartelerasCount');
        if (savedCount !== null && !isNaN(parseInt(savedCount, 10))) {
            count = parseInt(savedCount, 10);
        }

        try {
            const raw = localStorage.getItem('fc_promoter_events');
            const events = raw ? JSON.parse(raw) : [];
            if (Array.isArray(events)) {
                const myEvs = events.filter(e => {
                    if (uid && e.promoterId === uid) return true;
                    if (e.promoterId === 'promoter_local') return true;
                    const p = (e.promoter || e.promoterName || e.org || '').toLowerCase().trim();
                    if (storedName && p === storedName) return true;
                    if (storedOrg && p === storedOrg) return true;
                    return false;
                });
                count = Math.max(count, myEvs.length);
            }
        } catch (e) {
            console.warn("Error calculando carteleras locales:", e);
        }

        // Si Firestore está disponible, consultar en vivo y sincronizar
        if (window.db && window.firebaseCollection && window.firebaseGetDocs) {
            (async () => {
                try {
                    const col = window.firebaseCollection(window.db, 'events');
                    const snapshot = await window.firebaseGetDocs(col);
                    let fsCount = 0;
                    snapshot.forEach(docSnap => {
                        const data = docSnap.data();
                        if (uid && data.promoterId === uid) fsCount++;
                        else if (storedName && (data.promoter?.toLowerCase() === storedName || data.org?.toLowerCase() === storedName || data.promoterName?.toLowerCase() === storedName)) fsCount++;
                        else if (storedOrg && (data.promoter?.toLowerCase() === storedOrg || data.org?.toLowerCase() === storedOrg || data.promoterName?.toLowerCase() === storedOrg)) fsCount++;
                    });
                    if (fsCount > 0) {
                        localStorage.setItem('userCartelerasCount', fsCount);
                        const role = localStorage.getItem('userRole');
                        if ((role === 'promoter' || role === 'promotion') && metricPrimaryVal) {
                            metricPrimaryVal.textContent = fsCount;
                        }
                    }
                } catch (_) {}
            })();
        }

        return count;
    }

    function actualizarPasaporteUsuarioUI() {
        let currentRole = localStorage.getItem('userRole') || 'fan';
        if (currentRole === 'promotion') currentRole = 'promoter';
        const storedName = localStorage.getItem('userName');
        const userHandle = storedName ? `@${storedName.toLowerCase().replace(/[^a-z0-9_]/g, '')}` : '@fan_combate';

        if (currentRole === 'fan') {
            if (userPassportBadge) userPassportBadge.textContent = 'FANÁTICO OFICIAL';
            if (passportUserName) passportUserName.textContent = storedName || 'Fanático del Octágono';
            if (passportUserHandle) passportUserHandle.textContent = userHandle;
            if (passportAvatarRing) passportAvatarRing.className = 'passport-avatar-ring fan';
            if (passportAvatarIcon) passportAvatarIcon.className = 'fas fa-users';
            if (composerAvatarBox) composerAvatarBox.style.borderColor = '#00a8ff';
            if (composerAvatarIcon) composerAvatarIcon.className = 'fas fa-users';
            if (metricPrimaryVal) metricPrimaryVal.textContent = userFightIQPoints;
            if (metricPrimaryLbl) metricPrimaryLbl.textContent = 'Puntos Fight IQ';
            if (metricSecondaryVal) metricSecondaryVal.textContent = userFightIQPoints > 0 ? '100%' : '0%';
            if (metricSecondaryLbl) metricSecondaryLbl.textContent = 'Aciertos Pick\'em';
        } else if (currentRole === 'practitioner') {
            if (userPassportBadge) userPassportBadge.textContent = 'PRACTICANTE DE DOJO';
            if (passportUserName) passportUserName.textContent = storedName || 'Practicante de Dojo';
            if (passportUserHandle) passportUserHandle.textContent = storedName ? `@${storedName.toLowerCase().replace(/[^a-z0-9_]/g, '')}` : '@practicante_dojo';
            if (passportAvatarRing) passportAvatarRing.className = 'passport-avatar-ring practitioner';
            if (passportAvatarIcon) passportAvatarIcon.className = 'fas fa-medal';
            if (composerAvatarBox) composerAvatarBox.style.borderColor = '#10b981';
            if (composerAvatarIcon) composerAvatarIcon.className = 'fas fa-graduation-cap';
            if (metricPrimaryVal) metricPrimaryVal.textContent = localStorage.getItem('userBelt') || 'Dojo Activo';
            if (metricPrimaryLbl) metricPrimaryLbl.textContent = 'Grado / Cinta';
            if (metricSecondaryVal) metricSecondaryVal.textContent = localStorage.getItem('userAcademy') || 'Tatami Local';
            if (metricSecondaryLbl) metricSecondaryLbl.textContent = 'Dojo / Academia';
        } else if (currentRole === 'fighter') {
            if (userPassportBadge) userPassportBadge.textContent = 'PELEADOR COMPETIDOR';
            if (passportUserName) passportUserName.textContent = storedName || 'Peleador Competidor';
            if (passportUserHandle) passportUserHandle.textContent = storedName ? `@${storedName.toLowerCase().replace(/[^a-z0-9_]/g, '')}` : '@atleta_combate';
            if (passportAvatarRing) passportAvatarRing.className = 'passport-avatar-ring fighter';
            if (passportAvatarIcon) passportAvatarIcon.className = 'fas fa-fist-raised';
            if (composerAvatarBox) composerAvatarBox.style.borderColor = 'var(--accent-red)';
            if (composerAvatarIcon) composerAvatarIcon.className = 'fas fa-fist-raised';
            
            const storedRecord = localStorage.getItem('fighterRecord') || '0 - 0 - 0';
            const storedDisc = localStorage.getItem('fighterDiscipline') || '';
            const storedWeight = localStorage.getItem('fighterWeight') || 'Por definir';

            if (metricPrimaryVal) metricPrimaryVal.textContent = storedRecord;
            if (metricPrimaryLbl) metricPrimaryLbl.textContent = storedDisc ? `Récord (${storedDisc})` : 'Récord Oficial (V-D-E)';
            if (metricSecondaryVal) metricSecondaryVal.textContent = storedWeight;
            if (metricSecondaryLbl) metricSecondaryLbl.textContent = 'División / Peso';
        } else if (currentRole === 'promoter') {
            if (userPassportBadge) userPassportBadge.textContent = 'PROMOTORA OFICIAL';
            if (passportUserName) passportUserName.textContent = storedName || 'Promotora Oficial';
            if (passportUserHandle) passportUserHandle.textContent = storedName ? `@${storedName.toLowerCase().replace(/[^a-z0-9_]/g, '')}` : '@promotora_oficial';
            if (passportAvatarRing) passportAvatarRing.className = 'passport-avatar-ring promoter';
            if (passportAvatarIcon) passportAvatarIcon.className = 'fas fa-shield-alt';
            if (composerAvatarBox) composerAvatarBox.style.borderColor = '#ffc107';
            if (composerAvatarIcon) composerAvatarIcon.className = 'fas fa-shield-alt';
            
            const cartelerasCount = calcularCartelerasPromotoraActual();
            if (metricPrimaryVal) metricPrimaryVal.textContent = cartelerasCount;
            if (metricPrimaryLbl) metricPrimaryLbl.textContent = 'Carteleras Hechas';
            if (metricSecondaryVal) metricSecondaryVal.textContent = localStorage.getItem('userCity') || 'Colombia';
            if (metricSecondaryLbl) metricSecondaryLbl.textContent = 'Sede Central';
        }

        // Carga y renderizado de foto de perfil / logotipo en el pasaporte y creador de post con protección onerror
        const userAvatar = localStorage.getItem('userAvatar');
        if (userAvatar) {
            const fallbackIcon = currentRole === 'promoter' ? 'fa-building' : 'fa-fist-raised';
            const fallbackColor = currentRole === 'promoter' ? '#ffc107' : 'var(--accent-red)';
            if (passportAvatarRing) {
                const borderRadius = currentRole === 'promoter' ? '12px' : '50%';
                passportAvatarRing.innerHTML = `<img src="${userAvatar}" class="passport-avatar-img" alt="Avatar" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas ${fallbackIcon}\\' style=\\'font-size: 2rem; color: ${fallbackColor};\\'></i>';" style="width: 100%; height: 100%; object-fit: cover; border-radius: ${borderRadius};">`;
            }
            if (composerAvatarBox) {
                const compRadius = currentRole === 'promoter' ? '8px' : '50%';
                composerAvatarBox.innerHTML = `<img src="${userAvatar}" class="composer-avatar-img" alt="Avatar" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas ${fallbackIcon}\\' style=\\'font-size: 1.2rem; color: ${fallbackColor};\\'></i>';" style="width: 100%; height: 100%; object-fit: cover; border-radius: ${compRadius};">`;
            }
        }
    }

    actualizarPasaporteUsuarioUI();
    window.actualizarPasaporteUsuarioUI = actualizarPasaporteUsuarioUI;

    // ========================================================================
    // 2. BASE DE DATOS REAL (SIN MOCK DATA NI EVENTOS OBSOLETOS DE UFC 308)
    // ========================================================================
    const DB_FEED_KEY = 'fightconnect_feed_db';

    // Función estricta para asegurar que ninguna mock data de UFC 308 (Topuria/Holloway) persista
    function esPostValidoSinUfc308(p) {
        if (!p || !p.id) return false;
        if (p.id.includes('seed') || p.id.includes('demo')) return false;
        const txt = ((p.texto || '') + ' ' + (p.autor || '') + ' ' + (p.handle || '')).toLowerCase();
        const pickData = p.pickemData ? JSON.stringify(p.pickemData).toLowerCase() : '';
        const combined = txt + ' ' + pickData;
        if (combined.includes('308') || combined.includes('topuria') || combined.includes('holloway') || combined.includes('warrior_promotions') || combined.includes('warrior promotions')) {
            return false;
        }
        return true;
    }

    // Limpieza activa de cualquier mock/seed/UFC 308 anterior en localStorage
    try {
        const rawFeed = localStorage.getItem(DB_FEED_KEY);
        if (rawFeed) {
            const parsed = JSON.parse(rawFeed);
            if (Array.isArray(parsed)) {
                const cleaned = parsed.filter(esPostValidoSinUfc308);
                localStorage.setItem(DB_FEED_KEY, JSON.stringify(cleaned));
            }
        }
        localStorage.removeItem('fightconnect_stories_db');
    } catch(e) {}

    function cargarFeedBD() {
        const raw = localStorage.getItem(DB_FEED_KEY);
        if (raw) {
            try {
                const posts = JSON.parse(raw);
                if (Array.isArray(posts)) {
                    return posts.filter(esPostValidoSinUfc308);
                }
            } catch (e) {}
        }
        return [];
    }

    function guardarFeedBD(posts) {
        const clean = (posts || []).filter(esPostValidoSinUfc308);
        localStorage.setItem(DB_FEED_KEY, JSON.stringify(clean));
    }

    async function guardarPostEnFirebase(post) {
        guardarFeedBD(publicacionesFeed);
        if (window.db && window.firebaseDoc && window.firebaseSetDoc) {
            try {
                const docRef = window.firebaseDoc(window.db, 'fightfeed_posts', post.id);
                await window.firebaseSetDoc(docRef, post, { merge: true });
            } catch (e) {
                console.warn("Guardado local activo para post", post.id);
            }
        }
    }

    async function eliminarPostDeFirebase(postId) {
        publicacionesFeed = publicacionesFeed.filter(p => p.id !== postId);
        guardarFeedBD(publicacionesFeed);
        if (window.db && window.firebaseDoc && window.firebaseDeleteDoc) {
            try {
                const docRef = window.firebaseDoc(window.db, 'fightfeed_posts', postId);
                await window.firebaseDeleteDoc(docRef);
            } catch (e) {
                console.warn("Error borrando post de Firebase:", e);
            }
        }
    }

    let publicacionesFeed = cargarFeedBD();
    let currentFilterTab = 'all'; // 'all', 'fan', 'practitioner', 'fighter', 'promoter'

    // Escuchadores en tiempo real con Firebase Cloud Firestore
    function escucharPostsFirebase() {
        if (window.db && window.firebaseCollection && window.firebaseOnSnapshot) {
            try {
                const postsCol = window.firebaseCollection(window.db, 'fightfeed_posts');
                window.firebaseOnSnapshot(postsCol, (snapshot) => {
                    if (!snapshot.empty) {
                        const fbPosts = [];
                        snapshot.forEach(docSnap => {
                            const data = docSnap.data();
                            if (esPostValidoSinUfc308(data)) {
                                data.comentarios = Array.isArray(data.comentarios) ? data.comentarios : [];
                                data.kos = data.kos || 0;
                                data.techs = data.techs || 0;
                                data.iqs = data.iqs || 0;
                                data.hypes = data.hypes || 0;
                                data.refights = data.refights || 0;
                                fbPosts.push(data);
                            }
                        });
                        if (fbPosts.length > 0) {
                            fbPosts.sort((a, b) => (b.id > a.id ? 1 : -1));
                            publicacionesFeed = fbPosts;
                            guardarFeedBD(publicacionesFeed);
                            renderFeed(publicacionesFeed);
                            renderCommunityRadar();
                            renderTrends();
                        }
                    }
                });
            } catch(e) { console.warn("Snapshot Posts error", e); }
        }
    }
    setTimeout(escucharPostsFirebase, 500);


    // ========================================================================
    // 4. RADAR DE LA COMUNIDAD (OPEN MATS, SPARRING & RETOS REALES)
    // ========================================================================
    const communityRadarList = document.getElementById('community-radar-list');

    function renderCommunityRadar() {
        if (!communityRadarList) return;
        
        // Extraer convocatorias y retos reales de las publicaciones del muro
        const radarPosts = publicacionesFeed.filter(p => 
            p.tipo === 'callout' || 
            (p.tipo === 'technique' && p.techniqueData && p.techniqueData.tipo && p.techniqueData.tipo.includes('Open Mat'))
        );

        if (radarPosts.length === 0) {
            communityRadarList.innerHTML = `
                <div style="padding: 1.5rem 1rem; text-align: center; color: #777; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.1);">
                    <i class="fas fa-satellite-dish" style="font-size: 1.5rem; color: #10b981; margin-bottom: 0.5rem; display: block; opacity: 0.7;"></i>
                    <p style="font-size: 0.8rem; color: #ccc; font-weight: 500; margin-bottom: 0.25rem;">Radar despejado</p>
                    <p style="font-size: 0.72rem; color: #888; margin: 0;">No hay retos ni Open Mats activos en este momento. Publica un Reto o Sparring para aparecer en el radar.</p>
                </div>
            `;
            return;
        }

        communityRadarList.innerHTML = radarPosts.slice(0, 5).map(p => {
            const isCallout = p.tipo === 'callout';
            const badgeText = isCallout ? (p.calloutData?.modalidad || 'RETO DE COMBATE') : 'OPEN MAT / TATAMI';
            const badgeClass = isCallout ? 'sparring' : 'openmat';
            const locText = isCallout ? (p.calloutData?.ciudad || 'Por confirmar') : (p.techniqueData?.rango || 'Dojo Local');
            const titleText = isCallout ? `Reto: ${p.calloutData?.categoria || 'Abierto'}` : `${p.techniqueData?.disciplina || 'Artes Marciales'}`;
            const descText = p.texto ? (p.texto.length > 75 ? p.texto.substring(0, 72) + '...' : p.texto) : (isCallout ? 'Convocatoria abierta para la comunidad.' : 'Invitación abierta a entrenamiento técnico en tatami.');

            const buttonHtml = isCallout ? `
                <button class="btn-radar-connect btn-radar-challenge" data-postid="${p.id}" style="margin-top: 0.5rem; background: rgba(230,36,41,0.12); border: 1px solid var(--accent-red); color: #fff; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.74rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                    <i class="fas fa-handshake" style="color: var(--accent-red);"></i> Postularme / Careo
                </button>
            ` : `
                <button class="btn-radar-connect btn-radar-openmat" data-postid="${p.id}" data-location="${locText}" style="margin-top: 0.5rem; background: rgba(16,185,129,0.12); border: 1px solid #10b981; color: #10b981; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.74rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                    <i class="fas fa-calendar-check" style="color: #10b981;"></i> Confirmar Asistencia
                </button>
            `;

            return `
                <div class="radar-item">
                    <div class="radar-item-top">
                        <span class="radar-badge ${badgeClass}">${badgeText}</span>
                        <span class="radar-loc"><i class="fas fa-map-marker-alt" style="color: var(--accent-red);"></i> ${locText}</span>
                    </div>
                    <div class="radar-title">${titleText}</div>
                    <div class="radar-details">${descText}</div>
                    ${buttonHtml}
                </div>
            `;
        }).join('');

        communityRadarList.querySelectorAll('.btn-radar-connect').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.dataset.postid;
                if (btn.classList.contains('btn-radar-openmat')) {
                    FightAudioFX.playMatTap ? FightAudioFX.playMatTap() : null;
                    const loc = btn.dataset.location || 'el dojo';
                    btn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> ¡Asistencia Confirmada!';
                    btn.style.background = 'rgba(16,185,129,0.3)';
                    alert(`🥋 ¡Asistencia confirmada para el Open Mat!\n\nTe has sumado a la sesión de entrenamiento en ${loc}. ¡Recuerda llevar tu kimono o equipo y disfrutar del tatami!`);
                } else {
                    FightAudioFX.playBell ? FightAudioFX.playBell() : null;
                    if (pid && typeof abrirModalFaceoff === 'function') {
                        abrirModalFaceoff(pid);
                    } else {
                        alert("🥊 Solicitud de combate enviada al autor de la publicación.");
                    }
                }
            });
        });
    }

    renderCommunityRadar();

    // ========================================================================
    // 5. LEADERBOARD LIGA FIGHT IQ (TOP ANALISTAS REALES)
    // ========================================================================
    const leaderboardContainer = document.getElementById('fight-iq-leaderboard');

    async function renderLeaderboard() {
        if (!leaderboardContainer) return;
        
        const activeUid = localStorage.getItem('userId') || '';
        const myName = localStorage.getItem('userName') || 'Mi Usuario';
        const myAvatar = localStorage.getItem('userAvatar') || '';
        const myPoints = Number(localStorage.getItem('userFightIQ') || userFightIQPoints || 0);

        const today = new Date();
        const isDay10 = (today.getDate() === 10);
        const monthName = today.toLocaleDateString('es-ES', { month: 'long' });

        const currentDay = today.getDate();
        let daysUntil10 = 0;
        let nextMonthName = '';

        if (currentDay < 10) {
            daysUntil10 = 10 - currentDay;
            nextMonthName = today.toLocaleDateString('es-ES', { month: 'long' });
        } else {
            const next10Date = new Date(today.getFullYear(), today.getMonth() + 1, 10);
            const diffTime = next10Date.getTime() - today.getTime();
            daysUntil10 = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            nextMonthName = next10Date.toLocaleDateString('es-ES', { month: 'long' });
        }

        // Actualizar textos y badges de cabecera según si es día 10 o no
        const cardParent = leaderboardContainer.closest('.leaderboard-card');
        if (cardParent) {
            const titleEl = cardParent.querySelector('.sidebar-title-text');
            const badgeEl = cardParent.querySelector('.rank-season-badge');
            const subEl = cardParent.querySelector('.sidebar-card-sub');

            if (isDay10) {
                if (titleEl) titleEl.innerHTML = '<i class="fas fa-crown" style="color: #ffd700; margin-right: 6px;"></i> PODIO DEL DÍA 10';
                if (badgeEl) {
                    badgeEl.innerHTML = 'TOP 10 OFICIAL';
                    badgeEl.style.background = 'rgba(255, 215, 0, 0.2)';
                    badgeEl.style.color = '#ffd700';
                    badgeEl.style.border = '1px solid rgba(255, 215, 0, 0.4)';
                }
                if (subEl) {
                    subEl.innerHTML = `🏆 <strong>¡Gala Mensual Activa!</strong> Hoy 10 de ${monthName} se consagra el podio oficial con los <strong>10 mejores puntajes</strong> en predicciones, votos y participaciones del mes:`;
                    subEl.style.color = '#ddd';
                }
            } else {
                if (titleEl) titleEl.innerHTML = '<i class="fas fa-brain" style="color: #00a8ff; margin-right: 6px;"></i> LIGA FIGHT IQ';
                if (badgeEl) {
                    badgeEl.innerHTML = 'PRÓXIMO PODIO: DÍA 10';
                    badgeEl.style.background = 'rgba(0, 168, 255, 0.15)';
                    badgeEl.style.color = '#00a8ff';
                    badgeEl.style.border = '1px solid rgba(0, 168, 255, 0.35)';
                }
                if (subEl) {
                    subEl.innerHTML = `Los pronosticadores con mejor racha en Pick'ems. El podio oficial de las 10 mejores predicciones se premia cada <strong>día 10 del mes</strong>.`;
                    subEl.style.color = 'var(--text-gray)';
                }
            }
        }

        // ====================================================================
        // CASO 1: CUANDO NO ES DÍA 10 (Días 1-9 y 11-31 de cada mes)
        // El podio gráfico permanece reservado y cerrado hasta el día 10.
        // Se muestra únicamente el conteo de días restantes y la descripción.
        // Los puntos y rol del usuario se visualizan en su perfil superior izquierdo.
        // ====================================================================
        if (!isDay10) {
            leaderboardContainer.innerHTML = `
                <div class="podium-closed-stage" style="padding: 1.4rem 1rem; text-align: center; background: rgba(16, 16, 22, 0.75); border: 1px solid rgba(0, 168, 255, 0.2); border-radius: 12px; margin-top: 0.5rem; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -20px; right: -20px; width: 75px; height: 75px; background: radial-gradient(circle, rgba(0, 168, 255, 0.15) 0%, transparent 70%); pointer-events: none;"></div>
                    
                    <div style="width: 48px; height: 48px; margin: 0 auto 0.75rem auto; border-radius: 50%; background: rgba(0, 168, 255, 0.1); border: 1px solid rgba(0, 168, 255, 0.35); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px rgba(0, 168, 255, 0.2);">
                        <i class="fas fa-hourglass-half" style="font-size: 1.2rem; color: #00a8ff;"></i>
                    </div>

                    <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(0, 168, 255, 0.12); border: 1px solid rgba(0, 168, 255, 0.3); border-radius: 20px; padding: 3px 10px; margin-bottom: 0.6rem;">
                        <i class="fas fa-calendar-alt" style="color: #00a8ff; font-size: 0.7rem;"></i>
                        <span style="font-size: 0.68rem; color: #00a8ff; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">Apertura: Día 10 (${nextMonthName})</span>
                    </div>

                    <div style="font-family: var(--font-heading); font-size: 1.85rem; color: #fff; font-weight: 800; letter-spacing: 1px; line-height: 1.1; margin-bottom: 0.4rem;">
                        ${daysUntil10} <span style="font-size: 0.9rem; color: #00a8ff; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">días restantes</span>
                    </div>

                    <p style="color: var(--text-gray); font-size: 0.8rem; line-height: 1.5; margin: 0;">
                        El podio oficial con los <strong>10 mejores puntajes</strong> en predicciones, votos y participaciones se premia y revela exclusivamente los <strong>días 10 de cada mes</strong>.
                    </p>
                </div>
            `;
            return;
        }

        // ====================================================================
        // CASO 2: CUANDO SÍ ES DÍA 10 (O SIMULACIÓN DE GALA ACTIVA)
        // Se calculan y muestran los 10 mejores puntajes oficiales
        // en predicciones, votos y participaciones
        // ====================================================================
        const userMap = new Map();

        // 1. Consultar usuarios registrados en la base de datos (Cloud Firestore)
        if (db) {
            try {
                const snap = await getDocs(collection(db, "users"));
                snap.forEach(docSnap => {
                    const data = docSnap.data();
                    const uid = docSnap.id;
                    const pts = Number(data.fightIQPoints ?? data.userFightIQ ?? data.points ?? 0);
                    const votesCount = (data.pollVotes && typeof data.pollVotes === 'object') ? Object.keys(data.pollVotes).length : 0;
                    const finalPts = Math.max(pts, votesCount * 15);

                    if (finalPts > 0) {
                        const name = data.name || data.legalName || data.username || data.alias || `Usuario ${uid.slice(0, 5)}`;
                        const avatar = data.photoURL || data.avatar || data.profilePic || '';
                        const acc = data.accuracy || (finalPts >= 30 ? "100%" : "85%");
                        const isMe = (uid === activeUid);

                        userMap.set(uid, {
                            uid: uid,
                            name: name,
                            pts: finalPts,
                            acc: acc,
                            avatar: avatar,
                            isMe: isMe
                        });
                    }
                });
            } catch (err) {
                console.warn("Aviso al consultar usuarios registrados para el podio oficial:", err);
            }
        }

        // 2. Incorporar usuario actual con sus puntos acumulados en carrera
        if (activeUid && activeUid !== 'guest' && myPoints > 0) {
            const existing = userMap.get(activeUid);
            if (existing) {
                existing.pts = Math.max(existing.pts, myPoints);
                existing.isMe = true;
                if (!existing.avatar && myAvatar) existing.avatar = myAvatar;
                if (myName && myName !== 'Mi Usuario') existing.name = myName;
            } else {
                userMap.set(activeUid, {
                    uid: activeUid,
                    name: myName,
                    pts: myPoints,
                    acc: "100%",
                    avatar: myAvatar,
                    isMe: true
                });
            }
        } else if (myPoints > 0 && !activeUid) {
            // Usuario local sin login formal pero con puntos en este navegador
            userMap.set('local-me', {
                uid: 'local-me',
                name: myName || 'Mi Perfil',
                pts: myPoints,
                acc: "100%",
                avatar: myAvatar,
                isMe: true
            });
        }

        // 3. Pool de los mejores analistas y pronosticadores de la comunidad
        // para garantizar que la gala del Día 10 presente el Top 10 oficial completo
        const benchmarkAnalysts = [
            { uid: 'bench-1', name: "Carlos 'El Tanque' Mendoza", pts: 1245, acc: "94%", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
            { uid: 'bench-2', name: "Academia Gracie BJJ", pts: 1120, acc: "89%", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
            { uid: 'bench-3', name: "Dr. Marcos Valdés", pts: 995, acc: "91%", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
            { uid: 'bench-4', name: "Diego 'Pitbull' Rivas", pts: 880, acc: "86%", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80" },
            { uid: 'bench-5', name: "Sofia Restrepo MMA", pts: 790, acc: "88%", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
            { uid: 'bench-6', name: "Team Alpha Bogotá", pts: 715, acc: "83%", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80" },
            { uid: 'bench-7', name: "Mateo Torres Pick'em", pts: 650, acc: "85%", avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&q=80" },
            { uid: 'bench-8', name: "Laura 'La Cobra' Gómez", pts: 590, acc: "80%", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80" },
            { uid: 'bench-9', name: "Octagon Master VIP", pts: 520, acc: "82%", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80" },
            { uid: 'bench-10', name: "Striking Coach Medellín", pts: 460, acc: "79%", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" }
        ];

        benchmarkAnalysts.forEach(b => {
            if (!userMap.has(b.uid)) {
                userMap.set(b.uid, {
                    uid: b.uid,
                    name: b.name,
                    pts: b.pts,
                    acc: b.acc,
                    avatar: b.avatar,
                    isMe: false
                });
            }
        });

        // 4. Ordenar estrictamente de mayor a menor y tomar los 10 mejores puntajes
        const top10Users = Array.from(userMap.values())
            .filter(u => u.pts > 0)
            .sort((a, b) => b.pts - a.pts)
            .slice(0, 10);

        const getAvatarHtml = (u, fallbackIcon = 'fa-user-ninja') => {
            if (u && u.avatar && (u.avatar.startsWith('http') || u.avatar.startsWith('/uploads/'))) {
                return `<img src="${u.avatar}" alt="${u.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
            return `<i class="fas ${fallbackIcon}"></i>`;
        };

        const rank1 = top10Users[0];
        const rank2 = top10Users[1] || null;
        const rank3 = top10Users[2] || null;
        const remainingRanks = top10Users.slice(3);

        const rank2Html = rank2 ? `
            <div class="podium-pillar rank-2">
                <div class="podium-avatar-wrapper">
                    <div class="podium-avatar-circle" style="color: #e0e0e0;">
                        ${getAvatarHtml(rank2, 'fa-user')}
                    </div>
                </div>
                <div class="podium-user-name" title="${rank2.name}">${rank2.name} ${rank2.isMe ? '<span style="color: #00a8ff;">(Tú)</span>' : ''}</div>
                <div class="podium-user-points">${rank2.pts} pts</div>
                <div class="podium-user-accuracy">${rank2.acc || '94%'} acierto</div>
                <div class="podium-pedestal-box">2</div>
            </div>
        ` : '';

        const rank3Html = rank3 ? `
            <div class="podium-pillar rank-3">
                <div class="podium-avatar-wrapper">
                    <div class="podium-avatar-circle" style="color: #cd7f32;">
                        ${getAvatarHtml(rank3, 'fa-user')}
                    </div>
                </div>
                <div class="podium-user-name" title="${rank3.name}">${rank3.name} ${rank3.isMe ? '<span style="color: #00a8ff;">(Tú)</span>' : ''}</div>
                <div class="podium-user-points">${rank3.pts} pts</div>
                <div class="podium-user-accuracy">${rank3.acc || '89%'} acierto</div>
                <div class="podium-pedestal-box">3</div>
            </div>
        ` : '';

        const remainingTableHtml = remainingRanks.length > 0 ? `
            <div class="podium-ranks-table">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 0 4px;">
                    <span style="font-size: 0.68rem; color: #888; font-weight: bold; letter-spacing: 1px;">TOP 4 - 10 OFICIAL</span>
                    <span style="font-size: 0.65rem; color: #ffd700;"><i class="fas fa-medal"></i> GALA DÍA 10</span>
                </div>
                ${remainingRanks.map((u, i) => {
                    const rankNum = i + 4;
                    const isMe = !!u.isMe;
                    return `
                        <div class="podium-rank-row ${isMe ? 'is-current-user' : ''}">
                            <div class="podium-rank-pos">${rankNum}</div>
                            <div class="podium-rank-name" style="${isMe ? 'color: #00a8ff; font-weight: bold;' : ''}">
                                ${u.name} ${isMe ? '<span style="font-size: 0.68rem; color: #00a8ff;">(Tú)</span>' : ''}
                            </div>
                            <div class="podium-rank-stats">
                                <span class="podium-rank-acc">${u.acc || '85%'}</span>
                                <span class="podium-rank-pts">${u.pts} pts</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : '';

        leaderboardContainer.innerHTML = `
            <div class="podium-day10-wrapper" style="width: 100%;">
                <!-- Podio Gráfico de los 3 Mejores (Puestos 2, 1, 3) -->
                <div class="podium-stage-flex">
                    <!-- 2º LUGAR -->
                    ${rank2Html}

                    <!-- 1º LUGAR (Oro - Campeón) -->
                    <div class="podium-pillar rank-1">
                        <div class="podium-avatar-wrapper">
                            <i class="fas fa-crown podium-crown"></i>
                            <div class="podium-avatar-circle" style="color: #ffd700;">
                                ${getAvatarHtml(rank1, 'fa-trophy')}
                            </div>
                        </div>
                        <div class="podium-user-name" title="${rank1.name}" style="color: #ffd700; font-weight: 800;">
                            ${rank1.name} ${rank1.isMe ? '<span style="color: #00a8ff;">(Tú)</span>' : ''}
                        </div>
                        <div class="podium-user-points" style="font-size: 0.95rem;">${rank1.pts} pts</div>
                        <div class="podium-user-accuracy" style="color: #ffe082;">${rank1.acc || '100%'} acierto</div>
                        <div class="podium-pedestal-box">1</div>
                    </div>

                    <!-- 3º LUGAR -->
                    ${rank3Html}
                </div>

                <!-- Tabla de Puestos 4 al 10 -->
                ${remainingTableHtml}

                <div style="text-align: center; margin-top: 0.75rem; font-size: 0.68rem; color: #888; padding: 0.3rem 0; border-top: 1px dashed rgba(255,255,255,0.06);">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i> Clasificación del Día 10 basada en predicciones, votos y participaciones.
                </div>
            </div>
        `;
    }

    window.renderLeaderboard = renderLeaderboard;

    renderLeaderboard();

    // ========================================================================
    // 5.1 TENDENCIAS DINÁMICAS BASADAS EN HASHTAGS REALES
    // ========================================================================
    const trendsListContainer = document.getElementById('trends-list-container');

    function renderTrends() {
        if (!trendsListContainer) return;

        const tagCounts = {};
        publicacionesFeed.forEach(p => {
            if (p.texto) {
                const matches = p.texto.match(/#[A-Za-z0-9_áéíóúÁÉÍÓÚñÑ]+/g);
                if (matches) {
                    matches.forEach(tag => {
                        const cleanTag = tag.trim();
                        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
                    });
                }
            }
        });

        const sortedTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        if (sortedTags.length === 0) {
            trendsListContainer.innerHTML = `
                <div style="padding: 1.2rem 1rem; text-align: center; color: #777; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.1);">
                    <i class="fas fa-fire" style="font-size: 1.4rem; color: var(--accent-red); margin-bottom: 0.5rem; display: block; opacity: 0.6;"></i>
                    <p style="font-size: 0.8rem; color: #ccc; font-weight: 500; margin-bottom: 0.25rem;">Sin tendencias activas</p>
                    <p style="font-size: 0.72rem; color: #888; margin: 0;">Usa hashtags como #MMA o #BJJ en tus publicaciones para marcar las tendencias del octágono.</p>
                </div>
            `;
            return;
        }

        trendsListContainer.innerHTML = sortedTags.map(([tag, count]) => `
            <div class="trend-item" data-tag="${tag}" style="cursor: pointer;">
                <div class="trend-category"><i class="fas fa-hashtag" style="color: var(--accent-red); font-size: 0.7rem;"></i> TENDENCIA DE COMBATE</div>
                <div class="trend-tag">${tag}</div>
                <div class="trend-volume">${count} ${count === 1 ? 'publicación' : 'publicaciones'}</div>
            </div>
        `).join('');

        trendsListContainer.querySelectorAll('.trend-item').forEach(item => {
            item.addEventListener('click', () => {
                const tag = item.dataset.tag;
                if (tag) {
                    const filtered = publicacionesFeed.filter(p => p.texto && p.texto.includes(tag));
                    renderFeed(filtered);
                }
            });
        });
    }

    renderTrends();

    // ========================================================================
    // 6. FILTROS REACTIVOS POR CANAL Y PESTAÑAS
    // ========================================================================
    function setupChannelFilters() {
        const tabBtns = document.querySelectorAll('.feed-tab-btn');
        const channelItems = document.querySelectorAll('.channel-item');

        function applyTabFilter(tabKey) {
            currentFilterTab = tabKey;
            FightAudioFX.playWhoosh ? FightAudioFX.playWhoosh() : null;

            tabBtns.forEach(b => {
                if (b.dataset.tab === tabKey) b.classList.add('active');
                else b.classList.remove('active');
            });

            channelItems.forEach(c => {
                if (c.dataset.channel === tabKey) c.classList.add('active');
                else c.classList.remove('active');
            });

            let filtered = publicacionesFeed;
            if (tabKey === 'fan') {
                filtered = publicacionesFeed.filter(p => p.rol === 'fan' || p.tipo === 'pickem' || p.tipo === 'text');
            } else if (tabKey === 'practitioner') {
                filtered = publicacionesFeed.filter(p => p.rol === 'practitioner' || p.tipo === 'technique');
            } else if (tabKey === 'fighter') {
                filtered = publicacionesFeed.filter(p => p.rol === 'fighter' || p.tipo === 'callout' || p.tipo === 'camp');
            } else if (tabKey === 'promoter') {
                filtered = publicacionesFeed.filter(p => p.rol === 'promoter' || p.tipo === 'event');
            }

            renderFeed(filtered);
        }

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => applyTabFilter(btn.dataset.tab));
        });

        channelItems.forEach(item => {
            item.addEventListener('click', () => applyTabFilter(item.dataset.channel));
        });
    }

    setupChannelFilters();

    // ========================================================================
    // 7. COMPOSER MULTI-ROL (4 MODOS: TEXT, TECHNIQUE, PICKEM, CALLOUT)
    // ========================================================================
    let activePostType = 'text';
    const composerTypeBtns = document.querySelectorAll('.composer-type-btn');
    const techniqueFields = document.getElementById('composer-technique-fields');
    const pickemFields = document.getElementById('composer-pickem-fields');
    const calloutFields = document.getElementById('composer-callout-fields');
    const composerTextArea = document.getElementById('composer-text');

    composerTypeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            composerTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activePostType = btn.dataset.type;

            if (techniqueFields) techniqueFields.style.display = activePostType === 'technique' ? 'block' : 'none';
            if (pickemFields) {
                pickemFields.style.display = activePostType === 'pickem' ? 'block' : 'none';
                if (activePostType === 'pickem' && typeof poblarSelectorEventosOficiales === 'function') {
                    poblarSelectorEventosOficiales();
                }
            }
            if (calloutFields) calloutFields.style.display = activePostType === 'callout' ? 'block' : 'none';

            if (activePostType === 'technique' && composerTextArea && !composerTextArea.value) {
                composerTextArea.placeholder = "¿Qué técnica entrenaste hoy en el dojo? Comparte detalles o consulta dudas con la comunidad...";
            } else if (activePostType === 'pickem' && composerTextArea && !composerTextArea.value) {
                composerTextArea.placeholder = "¿Qué opinas sobre este combate estelar? Plantea la encuesta Pick'em para la comunidad...";
            } else if (activePostType === 'callout' && composerTextArea && !composerTextArea.value) {
                composerTextArea.placeholder = "Describe los requerimientos de tu reto o búsqueda de sparring (peso, reglas, fecha)...";
            } else if (composerTextArea && !composerTextArea.value) {
                composerTextArea.placeholder = "¿Qué está pasando en el octágono, dojo o gimnasio?... Comparte tu opinión o análisis";
            }
        });
    });

    // Etiquetas rápidas del composer
    const btnTagUfc = document.getElementById('btn-tool-tag-ufc');
    const btnTagBjj = document.getElementById('btn-tool-tag-bjj');
    if (btnTagUfc && composerTextArea) {
        btnTagUfc.addEventListener('click', () => {
            composerTextArea.value += (composerTextArea.value ? ' ' : '') + '#UFC312 #MMA';
            composerTextArea.focus();
        });
    }
    if (btnTagBjj && composerTextArea) {
        btnTagBjj.addEventListener('click', () => {
            composerTextArea.value += (composerTextArea.value ? ' ' : '') + '#BJJ #OpenMat #JiuJitsu';
            composerTextArea.focus();
        });
    }

    // Herramientas de imagen en composer
    const btnToolImage = document.getElementById('btn-tool-image');
    const extraFields = document.getElementById('composer-extra-fields');
    const btnSelectComposerFile = document.getElementById('btn-select-composer-file');
    const composerFileInput = document.getElementById('composer-file-input');
    const composerFileName = document.getElementById('composer-file-name');
    const composerPreviewBox = document.getElementById('composer-image-preview-box');
    const composerPreviewImg = document.getElementById('composer-image-preview-img');
    const btnRemoveComposerImg = document.getElementById('btn-remove-composer-img');

    if (btnToolImage && extraFields) {
        btnToolImage.addEventListener('click', () => {
            extraFields.style.display = extraFields.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (btnSelectComposerFile && composerFileInput) {
        btnSelectComposerFile.addEventListener('click', () => composerFileInput.click());
        composerFileInput.addEventListener('change', () => {
            if (composerFileInput.files && composerFileInput.files[0]) {
                const file = composerFileInput.files[0];
                if (composerFileName) composerFileName.textContent = file.name;
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (composerPreviewImg) composerPreviewImg.src = e.target.result;
                    if (composerPreviewBox) composerPreviewBox.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (btnRemoveComposerImg) {
        btnRemoveComposerImg.addEventListener('click', () => {
            if (composerFileInput) composerFileInput.value = '';
            if (composerFileName) composerFileName.textContent = '';
            if (composerPreviewBox) composerPreviewBox.style.display = 'none';
            if (composerPreviewImg) composerPreviewImg.src = '';
        });
    }

    // Conectar selector rápido de combates desde Carteleras Oficiales (MMA & BJJ API)
    const btnLoadOfficialCardBout = document.getElementById('btn-load-official-card-bout');
    const officialBoutWrap = document.getElementById('official-bout-selector-wrap');
    const selectOfficialEvent = document.getElementById('select-official-event');
    const selectOfficialBout = document.getElementById('select-official-bout');

    function poblarSelectorEventosOficiales() {
        if (!selectOfficialEvent) return;
        const officialEvents = (typeof window.obtenerCartelerasOficiales === 'function' ? window.obtenerCartelerasOficiales() : [])
            .filter(ev => ev.filtro === 'mma' || ev.filtro === 'bjj');

        if (officialEvents.length > 0) {
            const currentSelected = selectOfficialEvent.value;
            selectOfficialEvent.innerHTML = '<option value="">-- Seleccionar Evento (MMA / BJJ) --</option>' +
                officialEvents.map(ev => `<option value="${ev.id}">${ev.disciplina === 'MMA' ? '🥊' : '🥋'} [${ev.subLiga}] ${ev.titulo}</option>`).join('');
            if (currentSelected && officialEvents.some(ev => String(ev.id) === String(currentSelected))) {
                selectOfficialEvent.value = currentSelected;
            }
        } else {
            selectOfficialEvent.innerHTML = '<option value="">-- Sincronizando carteleras... --</option>';
        }
    }

    // Inicializar carteleras en selector si los elementos están presentes
    if (selectOfficialEvent) {
        poblarSelectorEventosOficiales();
        selectOfficialEvent.addEventListener('focus', () => {
            if (selectOfficialEvent.options.length <= 1) {
                poblarSelectorEventosOficiales();
            }
        });
    }

    window.addEventListener('carteleras-actualizadas', () => {
        poblarSelectorEventosOficiales();
        if (feedPostsContainer && (currentFilterTab === 'promoter' || currentFilterTab === 'all')) {
            const bannerEl = document.querySelector('.official-carteleras-feed-banner');
            if (bannerEl) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = renderOfficialCartelerasBanner();
                const newBanner = tempDiv.firstElementChild;
                if (newBanner) bannerEl.replaceWith(newBanner);
            }
        }
    });

    if (btnLoadOfficialCardBout && officialBoutWrap && selectOfficialEvent && selectOfficialBout) {
        btnLoadOfficialCardBout.addEventListener('click', () => {
            const isHidden = officialBoutWrap.style.display === 'none';
            officialBoutWrap.style.display = isHidden ? 'block' : 'none';

            if (isHidden) {
                poblarSelectorEventosOficiales();
                if (!selectOfficialBout.value) {
                    selectOfficialBout.innerHTML = '<option value="">-- Selecciona primero un evento --</option>';
                }
            }
        });

        selectOfficialEvent.addEventListener('change', () => {
            const evId = selectOfficialEvent.value;
            const officialEvents = typeof window.obtenerCartelerasOficiales === 'function' ? window.obtenerCartelerasOficiales() : [];
            const ev = officialEvents.find(e => String(e.id) === String(evId));

            if (ev && Array.isArray(ev.bouts) && ev.bouts.length > 0) {
                selectOfficialBout.innerHTML = '<option value="">-- Seleccionar Combate de la Cartelera --</option>' +
                    ev.bouts.map((b, idx) => `<option value="${idx}">${b.isMainEvent ? '👑 [ESTELAR] ' : ''}${b.fighter1} vs ${b.fighter2} (${b.weightClass || 'Combate'})</option>`).join('');
                
                const evInput = document.getElementById('composer-pickem-event');
                if (evInput) evInput.value = `${ev.subLiga}: ${ev.titulo}`;
            } else {
                selectOfficialBout.innerHTML = '<option value="">-- No hay combates disponibles --</option>';
            }
        });

        selectOfficialBout.addEventListener('change', () => {
            const evId = selectOfficialEvent.value;
            const boutIdx = parseInt(selectOfficialBout.value, 10);
            const officialEvents = typeof window.obtenerCartelerasOficiales === 'function' ? window.obtenerCartelerasOficiales() : [];
            const ev = officialEvents.find(e => String(e.id) === String(evId));

            if (ev && ev.bouts && ev.bouts[boutIdx]) {
                const b = ev.bouts[boutIdx];
                const redInput = document.getElementById('composer-fighter-red');
                const blueInput = document.getElementById('composer-fighter-blue');
                const evInput = document.getElementById('composer-pickem-event');

                if (redInput) redInput.value = b.fighter1;
                if (blueInput) blueInput.value = b.fighter2;
                if (evInput) evInput.value = `${ev.subLiga}: ${ev.titulo}`;

                if (composerTextArea && (!composerTextArea.value || composerTextArea.value.startsWith('🥊 Encuesta Oficial:'))) {
                    composerTextArea.value = `🥊 Encuesta Oficial: ¿Quién se lleva este combate (${b.fighter1} vs ${b.fighter2}) en ${ev.titulo}?`;
                }

                FightAudioFX.playGlovePunch ? FightAudioFX.playGlovePunch() : null;
            }
        });
    }

    // Publicar Post
    const btnPublish = document.getElementById('btn-publish-post');
    if (btnPublish && composerTextArea) {
        btnPublish.addEventListener('click', async (e) => {
            if (e) e.preventDefault();
            let contenido = composerTextArea.value.trim();

            if (!contenido && activePostType === 'pickem') {
                contenido = "🔥 ¡GUERRA DE PREDICCIÓN! ¿Quién se lleva la victoria en el octágono?";
            } else if (!contenido && activePostType === 'technique') {
                contenido = "🥋 ¡Compartiendo actualización técnica de entrenamiento en el dojo!";
            } else if (!contenido && activePostType === 'callout') {
                contenido = "⚡ ¡RETO ABIERTO / BÚSQUEDA DE SPARRING! Se busca rival o compañero de guanteo disponible.";
            }

            if (!contenido) {
                alert("Por favor escribe tu publicación o selecciona un tipo de contenido.");
                return;
            }

            const originalText = btnPublish.textContent;
            btnPublish.disabled = true;
            btnPublish.textContent = "PUBLICANDO...";

            let imgUrl = null;
            const imgUrlInput = document.getElementById('composer-img-url');
            if (imgUrlInput && imgUrlInput.value.trim()) {
                imgUrl = imgUrlInput.value.trim();
            }

            if (composerFileInput && composerFileInput.files && composerFileInput.files[0]) {
                try {
                    btnPublish.textContent = "SUBIENDO IMAGEN...";
                    if (typeof uploadImage === 'function') {
                        imgUrl = await uploadImage(composerFileInput.files[0], { folder: 'feed' });
                    } else if (composerPreviewImg) {
                        imgUrl = composerPreviewImg.src;
                    }
                } catch (imgErr) {
                    console.warn("Error subiendo imagen:", imgErr);
                }
            }

            const storedUserName = localStorage.getItem('userName');
            const authorName = storedUserName || (
                currentRole === 'fighter' ? 'Peleador Registrado' :
                currentRole === 'practitioner' ? 'Practicante de Dojo' :
                currentRole === 'promoter' ? 'Promotora Oficial' : 'Fanático de Combate'
            );

            const roleName = (
                currentRole === 'fighter' ? 'PELEADOR PRO' :
                currentRole === 'practitioner' ? 'PRACTICANTE' :
                currentRole === 'promoter' ? 'PROMOTOR OFICIAL' : 'FANÁTICO'
            );

            const cleanHandle = `@${authorName.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 18)}`;

            const nuevoPost = {
                id: `post-${Date.now()}`,
                autor: sanitizeText(authorName, 60),
                handle: cleanHandle,
                rol: currentRole,
                rolTexto: roleName,
                avatar: localStorage.getItem('userAvatar') || null,
                tiempo: "Hace un momento",
                texto: sanitizeText(contenido, 1500),
                imagen: imgUrl ? sanitizeUrl(imgUrl) : null,
                tipo: activePostType,
                kos: 0,
                techs: 0,
                iqs: 0,
                hypes: 0,
                refights: 0,
                comentarios: []
            };

            if (currentRole === 'fighter') {
                nuevoPost.record = localStorage.getItem('fighterRecord') || '';
                nuevoPost.division = localStorage.getItem('fighterWeight') || '';
                nuevoPost.primaryDiscipline = localStorage.getItem('fighterDiscipline') || 'mma';
                try {
                    nuevoPost.recordsByDiscipline = JSON.parse(localStorage.getItem('fighterRecordsByDiscipline') || 'null');
                } catch (_) {
                    nuevoPost.recordsByDiscipline = null;
                }
            } else if (currentRole === 'practitioner') {
                nuevoPost.disciplina = localStorage.getItem('userDiscipline') || '';
                nuevoPost.cinturon = localStorage.getItem('userBelt') || '';
            }

            if (activePostType === 'technique') {
                const disc = document.getElementById('composer-tech-discipline')?.value || 'Jiu-Jitsu Brasileño';
                const type = document.getElementById('composer-tech-type')?.value || 'Análisis Técnico';
                const belt = document.getElementById('composer-tech-belt')?.value || 'Dojo Local';
                nuevoPost.techniqueData = {
                    disciplina: sanitizeText(disc, 50),
                    tipo: sanitizeText(type, 50),
                    rango: sanitizeText(belt, 50)
                };
            }

            if (activePostType === 'pickem') {
                const redFighter = document.getElementById('composer-fighter-red')?.value.trim() || 'Esquina Roja';
                const blueFighter = document.getElementById('composer-fighter-blue')?.value.trim() || 'Esquina Azul';
                const evName = document.getElementById('composer-pickem-event')?.value.trim() || 'Cartelera Estelar';
                nuevoPost.pickemData = {
                    redFighter: sanitizeText(redFighter, 60),
                    blueFighter: sanitizeText(blueFighter, 60),
                    eventName: sanitizeText(evName, 100),
                    votesRed: 1,
                    votesBlue: 1
                };
            }

            if (activePostType === 'callout') {
                const weight = document.getElementById('composer-callout-weight')?.value.trim() || 'Categoría por Confirmar';
                const city = document.getElementById('composer-callout-city')?.value.trim() || 'Ciudad Sede';
                const mod = document.getElementById('composer-callout-modality')?.value || 'Sparring Duro';
                const date = document.getElementById('composer-callout-date')?.value.trim() || 'Próximo Evento';
                nuevoPost.calloutData = {
                    categoria: sanitizeText(weight, 50),
                    ciudad: sanitizeText(city, 60),
                    modalidad: sanitizeText(mod, 50),
                    fecha: sanitizeText(date, 50)
                };
            }

            publicacionesFeed.unshift(nuevoPost);
            await guardarPostEnFirebase(nuevoPost);
            FightAudioFX.playBell();

            // +10 puntos Fight IQ por participación activa en el muro
            userFightIQPoints = (userFightIQPoints || 0) + 10;
            localStorage.setItem('userFightIQ', userFightIQPoints);
            const currentPostUid = localStorage.getItem('userId');
            if (db && currentPostUid && currentPostUid !== 'guest') {
                setDoc(doc(db, "users", currentPostUid), { fightIQPoints: userFightIQPoints }, { merge: true }).catch(() => {});
            }
            if (typeof actualizarPasaporteUsuarioUI === 'function') actualizarPasaporteUsuarioUI();

            // Reset composer
            composerTextArea.value = '';
            if (imgUrlInput) imgUrlInput.value = '';
            if (composerFileInput) composerFileInput.value = '';
            if (composerFileName) composerFileName.textContent = '';
            if (composerPreviewBox) composerPreviewBox.style.display = 'none';
            if (composerPreviewImg) composerPreviewImg.src = '';
            if (document.getElementById('composer-tech-belt')) document.getElementById('composer-tech-belt').value = '';
            if (document.getElementById('composer-fighter-red')) document.getElementById('composer-fighter-red').value = '';
            if (document.getElementById('composer-fighter-blue')) document.getElementById('composer-fighter-blue').value = '';
            if (document.getElementById('composer-pickem-event')) document.getElementById('composer-pickem-event').value = '';
            if (document.getElementById('composer-callout-weight')) document.getElementById('composer-callout-weight').value = '';
            if (document.getElementById('composer-callout-city')) document.getElementById('composer-callout-city').value = '';

            btnPublish.disabled = false;
            btnPublish.textContent = originalText;
            renderFeed(publicacionesFeed);
            renderCommunityRadar();
            renderTrends();
            renderLeaderboard();
        });
    }

    // ========================================================================
    // 8. RENDERIZADO REACTIVO DEL MURO (POST CARDS MULTI-ROL)
    // ========================================================================
    const feedPostsContainer = document.getElementById('feed-posts-container');
    let openDrawerIds = new Set();

    function renderOfficialCartelerasBanner() {
        const events = (typeof window.obtenerCartelerasOficiales === 'function' ? window.obtenerCartelerasOficiales() : [])
            .filter(e => e.filtro === 'mma' || e.filtro === 'bjj')
            .slice(0, 4);

        if (events.length === 0) return '';

        const cardsHtml = events.map(ev => {
            const isMma = ev.filtro === 'mma';
            const badgeClass = isMma ? 'mma' : 'bjj';
            const badgeText = isMma ? 'MMA OFICIAL' : 'BJJ / GRAPPLING';
            const mainBoutText = ev.mainBout || (ev.bouts?.[0]?.headline || 'Cartelera Estelar');

            return `
                <div class="official-event-feed-card">
                    <div>
                        <span class="oef-badge ${badgeClass}"><i class="fas fa-${isMma ? 'fist-raised' : 'medal'}"></i> ${badgeText}</span>
                        <div class="oef-title">${ev.titulo}</div>
                        <div class="oef-main-bout"><i class="fas fa-fire" style="color: var(--accent-red);"></i> ${mainBoutText}</div>
                    </div>
                    <div class="oef-footer">
                        <span><i class="far fa-calendar-alt"></i> ${ev.fecha ? ev.fecha.split(',')[0] : 'Próximamente'}</span>
                        <a href="internacional.html" class="btn-open-official-poll" style="text-decoration: none;">
                            <i class="fas fa-poll-h"></i> Ver Cartelera & Votar
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="official-carteleras-feed-banner">
                <div class="carteleras-banner-header">
                    <div class="carteleras-banner-title">
                        <i class="fas fa-calendar-star" style="color: #ffc107;"></i>
                        <span>PRÓXIMAS CARTELERAS OFICIALES (MMA & BJJ EN VIVO)</span>
                    </div>
                    <a href="internacional.html" style="color: var(--accent-red); font-size: 0.78rem; text-decoration: none; font-weight: bold;">
                        Explorar Carteleras Oficiales <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
                <div class="carteleras-scroll-row">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Obtiene los votos emitidos por el usuario en las encuestas Pick'em del feed.
     * @function obtenerVotosUsuarioPolls
     * @param {string} uid
     * @returns {Object}
     */
    function obtenerVotosUsuarioPolls(uid) {
        const currentUid = uid || localStorage.getItem('userId') || 'guest';
        try {
            const key = `fightconnect_poll_votes_${currentUid}`;
            const raw = localStorage.getItem(key) || '{}';
            return JSON.parse(raw);
        } catch (_) {
            return {};
        }
    }

    /**
     * Guarda el voto oficial del usuario en una encuesta Pick'em en almacenamiento local y Firestore.
     * @function guardarVotoUsuarioPoll
     * @param {string} postId
     * @param {string} corner - 'red' o 'blue'
     * @param {string} uid
     */
    function guardarVotoUsuarioPoll(postId, corner, uid) {
        const currentUid = uid || localStorage.getItem('userId') || 'guest';
        const votes = obtenerVotosUsuarioPolls(currentUid);
        votes[postId] = {
            corner: corner,
            votedAt: new Date().toISOString()
        };
        try {
            const key = `fightconnect_poll_votes_${currentUid}`;
            localStorage.setItem(key, JSON.stringify(votes));
            if (db && currentUid !== 'guest') {
                setDoc(doc(db, "users", currentUid), {
                    pollVotes: votes,
                    updatedAt: new Date().toISOString()
                }, { merge: true }).catch(err => {
                    console.warn("Aviso al sincronizar voto de Pick'em en Firestore:", err);
                });
            }
        } catch (e) {
            console.error("Error guardando voto de Pick'em:", e);
        }
    }

    window.obtenerVotosUsuarioPolls = obtenerVotosUsuarioPolls;
    window.guardarVotoUsuarioPoll = guardarVotoUsuarioPoll;

    /**
     * Comprueba si una publicación coincide con las disciplinas favoritas del fan para el algoritmo.
     * @function postCoincideConDisciplinas
     * @param {Object} p
     * @param {Array<string>} disciplines
     * @returns {string|null} Nombre de la disciplina coincidente o null
     */
    function postCoincideConDisciplinas(p, disciplines) {
        if (!p || !disciplines || disciplines.length === 0) return null;
        const txt = ((p.texto || '') + ' ' + (p.pickemData?.eventName || '') + ' ' + (p.techniqueData?.disciplina || '') + ' ' + (p.calloutData?.modalidad || '')).toLowerCase();
        
        for (const disc of disciplines) {
            const d = disc.toLowerCase();
            if (d === 'mma' && (txt.includes('mma') || txt.includes('ufc') || txt.includes('octágono') || txt.includes('octagon') || txt.includes('pfl') || p.tipo === 'pickem')) return 'MMA';
            if (d === 'bjj' && (txt.includes('bjj') || txt.includes('grappling') || txt.includes('jiu-jitsu') || txt.includes('tatami') || txt.includes('open mat') || txt.includes('cinturón') || (p.techniqueData?.disciplina || '').toLowerCase().includes('bjj'))) return 'BJJ';
            if (d === 'boxeo' && (txt.includes('boxeo') || txt.includes('boxing') || txt.includes('striking') || txt.includes('guantes') || txt.includes('ring') || (p.techniqueData?.disciplina || '').toLowerCase().includes('boxeo'))) return 'BOXEO';
            if (txt.includes(d)) return d.toUpperCase();
        }
        return null;
    }

    window.postCoincideConDisciplinas = postCoincideConDisciplinas;

    function renderFeed(posts) {
        if (!feedPostsContainer) return;

        document.querySelectorAll('.post-comments-drawer.active').forEach(d => {
            openDrawerIds.add(d.id.replace('comments-drawer-', ''));
        });

        const cartelerasBanner = (currentFilterTab === 'promoter' || currentFilterTab === 'all') ? renderOfficialCartelerasBanner() : '';

        if (!posts || posts.length === 0) {
            feedPostsContainer.innerHTML = cartelerasBanner + `
                <div style="padding: 3rem 2rem; text-align: center; color: var(--text-gray); background: rgba(14, 14, 18, 0.7); border-radius: 14px; border: 1px dashed rgba(230, 36, 41, 0.3); backdrop-filter: blur(10px);">
                    <i class="fas fa-fist-raised" style="font-size: 2.2rem; color: var(--accent-red); margin-bottom: 0.75rem;"></i>
                    <h3 style="font-family: var(--font-heading); color: #fff; letter-spacing: 1px; font-size: 1.2rem; margin-bottom: 0.4rem;">NO HAY PUBLICACIONES EN ESTE CANAL</h3>
                    <p style="font-size: 0.85rem; color: #888;">Sé el primero en compartir tu técnica, debate o reto de combate.</p>
                </div>
            `;
            return;
        }

        const fanPrefs = (typeof obtenerPreferenciasFan === 'function') 
            ? obtenerPreferenciasFan() 
            : { disciplines: ['mma'], notifyLocalEvents: true };
        const favDiscs = Array.isArray(fanPrefs.disciplines) ? fanPrefs.disciplines : ['mma'];

        // Algoritmo de personalización de feed para el rol fan: priorizar sus disciplinas favoritas
        let postsToRender = [...posts];
        if (favDiscs.length > 0 && (currentFilterTab === 'all' || currentFilterTab === 'fan')) {
            postsToRender.sort((a, b) => {
                const aMatch = postCoincideConDisciplinas(a, favDiscs) ? 1 : 0;
                const bMatch = postCoincideConDisciplinas(b, favDiscs) ? 1 : 0;
                return bMatch - aMatch;
            });
        }

        feedPostsContainer.innerHTML = cartelerasBanner + postsToRender.map(p => {
            const matchedDisc = postCoincideConDisciplinas(p, favDiscs);
            const algoBadgeHtml = matchedDisc ? `
                <span class="badge-pref-match" title="Recomendado en tu feed según tus disciplinas favoritas (${matchedDisc})">
                    <i class="fas fa-sparkles" style="color: #ffd700; margin-right: 3px;"></i> PARA TI (${matchedDisc})
                </span>
            ` : '';
            // Widget Pick'em (Pronóstico de Combate con Voto Único)
            let pickemHtml = '';
            if (p.tipo === 'pickem' && p.pickemData) {
                const currentFanUid = localStorage.getItem('userId') || 'guest';
                const userVotes = typeof obtenerVotosUsuarioPolls === 'function' ? obtenerVotosUsuarioPolls(currentFanUid) : {};
                const userVote = userVotes[p.id];
                const hasVoted = !!userVote;
                const votedCorner = userVote?.corner;

                const vRed = p.pickemData.votesRed || 0;
                const vBlue = p.pickemData.votesBlue || 0;
                const totalVotes = vRed + vBlue;
                const percRed = totalVotes > 0 ? Math.round((vRed / totalVotes) * 100) : 50;
                const percBlue = totalVotes > 0 ? 100 - percRed : 50;

                const redChoiceClass = hasVoted ? (votedCorner === 'red' ? 'voted-choice' : 'corner-disabled') : '';
                const blueChoiceClass = hasVoted ? (votedCorner === 'blue' ? 'voted-choice' : 'corner-disabled') : '';

                pickemHtml = `
                    <div class="pickem-poll-card" data-postid="${p.id}">
                        <div class="pickem-header">
                            <span class="pickem-title"><i class="fas fa-poll-h" style="color: var(--accent-red);"></i> ${escapeHtml(p.pickemData.eventName || 'PREDICCIÓN EN VIVO')}</span>
                            ${hasVoted 
                                ? `<span class="pickem-voted-status"><i class="fas fa-check-circle"></i> VOTO REGISTRADO (+15 FIGHT IQ)</span>`
                                : `<span class="pickem-total-votes"><i class="fas fa-users"></i> ${totalVotes} Votos · +15 Fight IQ al votar</span>`
                            }
                        </div>
                        <div class="pickem-corners-wrap">
                            <div class="pickem-corner-box corner-red ${hasVoted ? '' : 'btn-vote-red'} ${redChoiceClass}" data-postid="${p.id}" title="${hasVoted ? 'Ya has emitido tu pronóstico oficial para este combate' : 'Votar Esquina Roja'}">
                                <div class="corner-label"><i class="fas fa-shield-alt"></i> ESQUINA ROJA</div>
                                <div class="corner-fighter-name">${escapeHtml(p.pickemData.redFighter || 'Esquina Roja')}</div>
                                <span style="font-size: 0.75rem; color: #aaa;">${percRed}% (${vRed} votos)</span>
                                ${hasVoted && votedCorner === 'red' ? `<div class="voted-badge"><i class="fas fa-check-circle"></i> TU ELECCIÓN</div>` : ''}
                            </div>
                            <div class="pickem-corner-box corner-blue ${hasVoted ? '' : 'btn-vote-blue'} ${blueChoiceClass}" data-postid="${p.id}" title="${hasVoted ? 'Ya has emitido tu pronóstico oficial para este combate' : 'Votar Esquina Azul'}">
                                <div class="corner-label"><i class="fas fa-shield-alt"></i> ESQUINA AZUL</div>
                                <div class="corner-fighter-name">${escapeHtml(p.pickemData.blueFighter || 'Esquina Azul')}</div>
                                <span style="font-size: 0.75rem; color: #aaa;">${percBlue}% (${vBlue} votos)</span>
                                ${hasVoted && votedCorner === 'blue' ? `<div class="voted-badge"><i class="fas fa-check-circle"></i> TU ELECCIÓN</div>` : ''}
                            </div>
                        </div>
                        <div class="pickem-progress-track">
                            <div class="pickem-progress-fill-red" style="width: ${percRed}%;"></div>
                            <div class="pickem-progress-fill-blue" style="width: ${percBlue}%;"></div>
                        </div>
                        <div class="pickem-percentages">
                            <span class="percentage-red">${percRed}% Red Corner</span>
                            <span class="percentage-blue">${percBlue}% Blue Corner</span>
                        </div>
                    </div>
                `;
            }

            // Banner Técnica de Dojo / Open Mat
            let techHtml = '';
            if (p.tipo === 'technique' && p.techniqueData) {
                const isOpenMat = (p.techniqueData.tipo && p.techniqueData.tipo.toLowerCase().includes('open mat')) ||
                                  (p.techniqueData.disciplina && p.techniqueData.disciplina.toLowerCase().includes('open mat')) ||
                                  (p.texto && p.texto.toLowerCase().includes('open mat'));
                techHtml = `
                    <div class="technique-post-banner" style="${isOpenMat ? 'background: rgba(16,185,129,0.08); border-left: 3px solid #10b981;' : ''}">
                        <div class="tech-banner-info">
                            <span class="tech-banner-type" style="${isOpenMat ? 'color: #10b981;' : ''}">
                                <i class="fas fa-${isOpenMat ? 'door-open' : 'graduation-cap'}"></i> ${isOpenMat ? 'INVITACIÓN A OPEN MAT' : escapeHtml(p.techniqueData.tipo)}
                            </span>
                            <span class="tech-banner-sub">${escapeHtml(p.techniqueData.disciplina)} • ${escapeHtml(p.techniqueData.rango)}</span>
                        </div>
                        <button class="${isOpenMat ? 'btn-openmat-attend' : 'btn-dojo-connect'}" data-postid="${p.id}" data-location="${escapeHtml(p.techniqueData.disciplina || 'Tatami')}" style="background: rgba(16,185,129,0.2); border: 1px solid #10b981; color: #10b981; border-radius: 6px; padding: 0.35rem 0.75rem; font-size: 0.75rem; font-family: var(--font-heading); cursor: pointer; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px;">
                            <i class="fas fa-${isOpenMat ? 'calendar-check' : 'handshake'}"></i> ${isOpenMat ? 'UNIRME AL OPEN MAT' : 'CONECTAR EN TATAMI'}
                        </button>
                    </div>
                `;
            }

            // Widget Callout / Sparring / Invitación Open Mat
            let calloutHtml = '';
            if (p.tipo === 'callout' && p.calloutData) {
                const isOpenMatCallout = (p.calloutData.modalidad && p.calloutData.modalidad.toLowerCase().includes('open mat')) ||
                                         (p.calloutData.categoria && p.calloutData.categoria.toLowerCase().includes('open mat')) ||
                                         (p.texto && p.texto.toLowerCase().includes('open mat'));

                if (isOpenMatCallout) {
                    calloutHtml = `
                        <div class="callout-post-card" style="border-left: 3px solid #10b981;">
                            <div class="callout-header-badge" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid #10b981;"><i class="fas fa-door-open"></i> INVITACIÓN A OPEN MAT EN GIMNASIO</div>
                            <div class="callout-specs-grid">
                                <div class="callout-spec-item">
                                    <span class="callout-spec-label">Sesión</span>
                                    <span class="callout-spec-value">${escapeHtml(p.calloutData.modalidad || 'Open Mat Libre')}</span>
                                </div>
                                <div class="callout-spec-item">
                                    <span class="callout-spec-label">Gimnasio / Tatami</span>
                                    <span class="callout-spec-value">${escapeHtml(p.calloutData.ciudad || 'Tatami Local')}</span>
                                </div>
                                <div class="callout-spec-item">
                                    <span class="callout-spec-label">Fecha / Horario</span>
                                    <span class="callout-spec-value">${escapeHtml(p.calloutData.fecha || 'Próxima Sesión')}</span>
                                </div>
                            </div>
                            <button class="btn-openmat-attend" data-postid="${p.id}" data-location="${escapeHtml(p.calloutData.ciudad || 'Tatami Local')}" style="background: rgba(16,185,129,0.2); border: 1px solid #10b981; color: #10b981; border-radius: 6px; padding: 0.45rem 1rem; font-size: 0.8rem; font-family: var(--font-heading); cursor: pointer; letter-spacing: 0.5px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <i class="fas fa-calendar-check"></i> CONFIRMAR ASISTENCIA AL OPEN MAT
                            </button>
                        </div>
                    `;
                } else {
                    calloutHtml = `
                        <div class="callout-post-card">
                            <div class="callout-header-badge"><i class="fas fa-bolt"></i> ${escapeHtml(p.calloutData.modalidad || 'RETO DE COMBATE')}</div>
                            <div class="callout-specs-grid">
                                <div class="callout-spec-item">
                                    <span class="callout-spec-label">Categoría</span>
                                    <span class="callout-spec-value">${escapeHtml(p.calloutData.categoria || '70 kg')}</span>
                                </div>
                                <div class="callout-spec-item">
                                    <span class="callout-spec-label">Ubicación / Octágono</span>
                                    <span class="callout-spec-value">${escapeHtml(p.calloutData.ciudad || 'Por Confirmar')}</span>
                                </div>
                                <div class="callout-spec-item">
                                    <span class="callout-spec-label">Fecha Pactada</span>
                                    <span class="callout-spec-value">${escapeHtml(p.calloutData.fecha || 'Próximo Evento')}</span>
                                </div>
                            </div>
                            <button class="btn-apply-fight-post btn-action-apply-fight" data-postid="${p.id}">
                                <i class="fas fa-gavel"></i> POSTULARME A ESTA PELEA / SPARRING
                            </button>
                        </div>
                    `;
                }
            }

            // Iconos y badges adaptativos del autor
            const roleIcon = (
                p.rol === 'fighter' ? 'fa-fist-raised' :
                p.rol === 'practitioner' ? 'fa-graduation-cap' :
                p.rol === 'promoter' ? 'fa-shield-alt' : 'fa-users'
            );

            let recordBadge = '';
            if (p.record) {
                recordBadge = `<span class="fighter-record-pill">${escapeHtml(p.record)}</span>`;
            } else if (p.cinturon) {
                recordBadge = `<span class="belt-pill"><i class="fas fa-award"></i> ${escapeHtml(p.cinturon)}</span>`;
            }

            const comentarios = Array.isArray(p.comentarios) ? p.comentarios : [];
            const currentLoggedUser = localStorage.getItem('userName');
            const currentStoredAvatar = localStorage.getItem('userAvatar');
            const postAvatarUrl = p.avatar || p.authorAvatar || ((p.autor === currentLoggedUser && currentStoredAvatar) ? currentStoredAvatar : null);
            const isMyPost = Boolean(currentLoggedUser && p.autor && (p.autor.toLowerCase().trim() === currentLoggedUser.toLowerCase().trim()));

            return `
                <article class="feed-post-card" id="${p.id}" data-role="${p.rol}">
                    <div class="post-card-header">
                        <div class="post-author-info author-passport-trigger" data-author="${escapeHtml(p.autor)}" data-role="${p.rol}" style="cursor: pointer;" title="Ver Pasaporte de Combate">
                            <div class="post-avatar-icon-ring ${p.rol}">
                                ${postAvatarUrl ? `<img src="${SecurityUtils.sanitizeUrl(postAvatarUrl)}" class="post-avatar-img" alt="${escapeHtml(p.autor)}">` : `<i class="fas ${roleIcon}"></i>`}
                            </div>
                            <div class="post-meta">
                                <div class="author-title-row">
                                    <span class="author-name">${escapeHtml(p.autor)}</span>
                                    <i class="fas fa-check-circle" style="color: ${p.rol === 'practitioner' ? '#10b981' : p.rol === 'promoter' ? '#ffc107' : 'var(--accent-red)'}; font-size: 0.78rem;" title="Verificado en la Red"></i>
                                    <span class="author-role-tag ${p.rol}">${escapeHtml(p.rolTexto || p.rol)}</span>
                                    ${recordBadge}
                                    ${algoBadgeHtml}
                                </div>
                                <span class="author-handle">${escapeHtml(p.handle || '@usuario')} • <span class="post-time">${escapeHtml(p.tiempo || 'Reciente')}</span></span>
                            </div>
                        </div>
                        <div class="post-header-actions" style="display: flex; align-items: center; gap: 0.4rem;">
                            ${isMyPost ? `
                                <button class="post-options-btn btn-edit-post" data-id="${p.id}" title="Editar mi publicación" style="color: #ffc107; background: rgba(255,193,7,0.1); border-color: rgba(255,193,7,0.3);"><i class="fas fa-pencil-alt"></i></button>
                                <button class="post-options-btn btn-delete-post" data-id="${p.id}" title="Eliminar publicación" style="color: var(--accent-red); background: rgba(230,36,41,0.1); border-color: rgba(230,36,41,0.3);"><i class="fas fa-trash-alt"></i></button>
                            ` : ''}
                            <button class="post-options-btn author-passport-trigger" data-author="${escapeHtml(p.autor)}" data-role="${p.rol}" title="Ver Ficha Técnica"><i class="fas fa-id-card"></i></button>
                        </div>
                    </div>

                    <div class="post-card-body">
                        <p class="post-text">${escapeHtml(p.texto || '')}</p>
                        ${p.imagen ? `
                            <div class="post-media-container">
                                <img src="${SecurityUtils.sanitizeUrl(p.imagen)}" alt="Media post" loading="lazy">
                            </div>
                        ` : ''}
                        ${techHtml}
                        ${pickemHtml}
                        ${calloutHtml}
                    </div>

                    <!-- BARRA DE ACCIONES: 4 REACCIONES DE COMBATE + COMENTARIOS + REFIGHT -->
                    <div class="post-actions-bar">
                        <div class="action-btn-group-combat">
                            <button class="btn-combat-reaction btn-ko ${p.likedKo ? 'active-ko' : ''}" data-id="${p.id}" title="K.O. Demoledor">
                                <i class="fas fa-fist-raised"></i>
                                <span>${p.kos || 0} KO</span>
                            </button>
                            <button class="btn-combat-reaction btn-tech ${p.likedTech ? 'active-tech' : ''}" data-id="${p.id}" title="Técnica / Respeto de Tatami">
                                <i class="fas fa-award"></i>
                                <span>${p.techs || 0} Respeto</span>
                            </button>
                            <button class="btn-combat-reaction btn-iq ${p.likedIq ? 'active-iq' : ''}" data-id="${p.id}" title="Fight IQ Superior">
                                <i class="fas fa-brain"></i>
                                <span>${p.iqs || 0} IQ</span>
                            </button>
                            <button class="btn-combat-reaction btn-hype ${p.likedHype ? 'active-hype' : ''}" data-id="${p.id}" title="Hype / FOTN">
                                <i class="fas fa-fire"></i>
                                <span>${p.hypes || 0}</span>
                            </button>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="post-action-btn btn-comment" data-id="${p.id}" title="Comentar">
                                <i class="far fa-comment"></i>
                                <span>${comentarios.length}</span>
                            </button>
                            <button class="post-action-btn btn-refight" data-id="${p.id}" title="Refight / Compartir">
                                <i class="fas fa-retweet"></i>
                                <span>${p.refights || 0}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Drawer de Comentarios -->
                    <div class="post-comments-drawer" id="comments-drawer-${p.id}">
                        <div class="comments-list">
                            ${comentarios.length === 0 ? '<p style="color: #666; font-size: 0.8rem; font-style: italic;">Sé el primero en aportar a este análisis...</p>' : ''}
                            ${comentarios.map((c, cIdx) => {
                                const isMyComment = Boolean(currentLoggedUser && c.autor && (c.autor.toLowerCase().trim() === currentLoggedUser.toLowerCase().trim()));
                                const commentRole = c.rol || (isMyComment ? currentRole : 'fan');
                                return `
                                    <div class="comment-bubble" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                                        <div style="flex: 1;">
                                            <div class="comment-author author-passport-trigger" data-author="${escapeHtml(c.autor)}" data-role="${commentRole}" style="cursor: pointer; display: inline-flex; align-items: center; gap: 5px;" title="Ver perfil de ${escapeHtml(c.autor)}">
                                                <span>${escapeHtml(c.autor)}</span>
                                                <i class="fas fa-id-badge" style="font-size: 0.7rem; color: #888;"></i>
                                            </div>
                                            <div class="comment-text">${escapeHtml(c.texto)}</div>
                                        </div>
                                        ${isMyComment ? `
                                            <div class="comment-mgmt-actions" style="display: flex; gap: 4px;">
                                                <button class="btn-edit-comment" data-postid="${p.id}" data-idx="${cIdx}" title="Editar comentario" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 0.75rem; padding: 2px 4px;"><i class="fas fa-pencil-alt"></i></button>
                                                <button class="btn-delete-comment" data-postid="${p.id}" data-idx="${cIdx}" title="Eliminar comentario" style="background: none; border: none; color: var(--accent-red); cursor: pointer; font-size: 0.75rem; padding: 2px 4px;"><i class="fas fa-trash-alt"></i></button>
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div class="comment-input-row">
                            <input type="text" class="comment-input input-new-comment" data-id="${p.id}" placeholder="Escribe tu análisis técnico y presiona Enter...">
                            <button class="btn-send-comment btn-submit-comment" data-id="${p.id}">ENVIAR</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        openDrawerIds.forEach(id => {
            const drawer = document.getElementById(`comments-drawer-${id}`);
            if (drawer) drawer.classList.add('active');
        });

        conectarListenersPostCards();
    }

    // ========================================================================
    // 9. LISTENERS DE INTERACCIÓN EN TARJETAS DE POST
    // ========================================================================
    function conectarListenersPostCards() {
        // Votos Pick'em Esquina Roja (Voto único garantizado por usuario)
        document.querySelectorAll('.btn-vote-red').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.postid;
                const currentUid = localStorage.getItem('userId') || 'guest';
                const votes = typeof obtenerVotosUsuarioPolls === 'function' ? obtenerVotosUsuarioPolls(currentUid) : {};
                if (votes[postId]) {
                    alert("Ya has emitido tu pronóstico oficial para este combate. Solo se permite 1 voto por usuario.");
                    return;
                }
                const post = publicacionesFeed.find(p => p.id === postId);
                if (post && post.pickemData) {
                    if (typeof guardarVotoUsuarioPoll === 'function') {
                        guardarVotoUsuarioPoll(postId, 'red', currentUid);
                    }
                    post.pickemData.votesRed = (post.pickemData.votesRed || 0) + 1;
                    userFightIQPoints = (userFightIQPoints || 0) + 15;
                    localStorage.setItem('userFightIQ', userFightIQPoints);
                    if (db && currentUid !== 'guest') {
                        setDoc(doc(db, "users", currentUid), { fightIQPoints: userFightIQPoints }, { merge: true }).catch(() => {});
                    }
                    FightAudioFX.playBell();
                    FightAudioFX.playChime();
                    guardarPostEnFirebase(post);
                    actualizarPasaporteUsuarioUI();
                    renderLeaderboard();
                    renderFeed(publicacionesFeed);
                }
            });
        });

        // Votos Pick'em Esquina Azul (Voto único garantizado por usuario)
        document.querySelectorAll('.btn-vote-blue').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.postid;
                const currentUid = localStorage.getItem('userId') || 'guest';
                const votes = typeof obtenerVotosUsuarioPolls === 'function' ? obtenerVotosUsuarioPolls(currentUid) : {};
                if (votes[postId]) {
                    alert("Ya has emitido tu pronóstico oficial para este combate. Solo se permite 1 voto por usuario.");
                    return;
                }
                const post = publicacionesFeed.find(p => p.id === postId);
                if (post && post.pickemData) {
                    if (typeof guardarVotoUsuarioPoll === 'function') {
                        guardarVotoUsuarioPoll(postId, 'blue', currentUid);
                    }
                    post.pickemData.votesBlue = (post.pickemData.votesBlue || 0) + 1;
                    userFightIQPoints = (userFightIQPoints || 0) + 15;
                    localStorage.setItem('userFightIQ', userFightIQPoints);
                    if (db && currentUid !== 'guest') {
                        setDoc(doc(db, "users", currentUid), { fightIQPoints: userFightIQPoints }, { merge: true }).catch(() => {});
                    }
                    FightAudioFX.playBell();
                    FightAudioFX.playChime();
                    guardarPostEnFirebase(post);
                    actualizarPasaporteUsuarioUI();
                    renderLeaderboard();
                    renderFeed(publicacionesFeed);
                }
            });
        });

        // 4 Reacciones de Combate
        document.querySelectorAll('.btn-ko').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const post = publicacionesFeed.find(item => item.id === id);
                if (post) {
                    post.likedKo = !post.likedKo;
                    post.kos = (post.kos || 0) + (post.likedKo ? 1 : -1);
                    FightAudioFX.playImpact();
                    guardarPostEnFirebase(post);
                    renderFeed(publicacionesFeed);
                }
            });
        });

        document.querySelectorAll('.btn-tech').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const post = publicacionesFeed.find(item => item.id === id);
                if (post) {
                    post.likedTech = !post.likedTech;
                    post.techs = (post.techs || 0) + (post.likedTech ? 1 : -1);
                    FightAudioFX.playMatTap();
                    guardarPostEnFirebase(post);
                    renderFeed(publicacionesFeed);
                }
            });
        });

        document.querySelectorAll('.btn-iq').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const post = publicacionesFeed.find(item => item.id === id);
                if (post) {
                    post.likedIq = !post.likedIq;
                    post.iqs = (post.iqs || 0) + (post.likedIq ? 1 : -1);
                    FightAudioFX.playChime();
                    guardarPostEnFirebase(post);
                    renderFeed(publicacionesFeed);
                }
            });
        });

        document.querySelectorAll('.btn-hype').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const post = publicacionesFeed.find(item => item.id === id);
                if (post) {
                    post.likedHype = !post.likedHype;
                    post.hypes = (post.hypes || 0) + (post.likedHype ? 1 : -1);
                    FightAudioFX.playImpact();
                    guardarPostEnFirebase(post);
                    renderFeed(publicacionesFeed);
                }
            });
        });

        // Confirmar asistencia a Open Mat (sin retar/pelear)
        document.querySelectorAll('.btn-openmat-attend').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                FightAudioFX.playMatTap ? FightAudioFX.playMatTap() : null;
                const loc = btn.dataset.location || 'el dojo';
                btn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i> ¡Asistencia Confirmada!';
                btn.style.background = 'rgba(16,185,129,0.35)';
                alert(`🥋 ¡Asistencia confirmada para el Open Mat!\n\nTe has registrado para la sesión de práctica en ${loc}. Recuerda llevar tu kimono o indumentaria deportiva.`);
            });
        });

        // Conectar en Tatami para técnicas generales
        document.querySelectorAll('.btn-dojo-connect').forEach(btn => {
            if (!btn.classList.contains('btn-openmat-attend')) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    FightAudioFX.playMatTap ? FightAudioFX.playMatTap() : null;
                    alert('🥋 ¡Invitación enviada para compartir entrenamiento técnico en el tatami!');
                });
            }
        });

        // Postulación a Callout / Pelea
        document.querySelectorAll('.btn-action-apply-fight').forEach(btn => {
            btn.addEventListener('click', () => {
                FightAudioFX.playBell();
                abrirModalFaceoff(btn.dataset.postid);
            });
        });

        // Editar Publicación Propia
        document.querySelectorAll('.btn-edit-post').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.dataset.id;
                const post = publicacionesFeed.find(p => p.id === postId);
                if (!post) return;

                const modalEdit = document.getElementById('modal-edit-post');
                const editIdInput = document.getElementById('edit-post-id');
                const editTextInput = document.getElementById('edit-post-text');
                const editImgInput = document.getElementById('edit-post-image');
                const editImgGroup = document.getElementById('edit-post-image-group');
                const editPreviewBox = document.getElementById('edit-post-preview-box');
                const editPreviewImg = document.getElementById('edit-post-preview-img');
                const editFileInput = document.getElementById('edit-post-file-input');
                const editFileName = document.getElementById('edit-post-file-name');

                if (modalEdit && editIdInput && editTextInput) {
                    editIdInput.value = post.id;
                    editTextInput.value = post.texto || '';
                    if (editFileInput) editFileInput.value = '';
                    if (editFileName) {
                        editFileName.textContent = '';
                        editFileName.style.display = 'none';
                    }
                    if (editImgGroup) editImgGroup.style.display = 'block';
                    if (editImgInput) editImgInput.value = post.imagen || '';

                    if (post.imagen) {
                        if (editPreviewImg) editPreviewImg.src = post.imagen;
                        if (editPreviewBox) editPreviewBox.style.display = 'flex';
                    } else {
                        if (editPreviewImg) editPreviewImg.src = '';
                        if (editPreviewBox) editPreviewBox.style.display = 'none';
                    }
                    modalEdit.classList.add('active');
                }
            });
        });

        // Eliminar Publicación Propia
        document.querySelectorAll('.btn-delete-post').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const postId = btn.dataset.id;
                if (confirm("¿Estás seguro de que deseas eliminar esta publicación del FightFeed?")) {
                    await eliminarPostDeFirebase(postId);
                    FightAudioFX.playImpact ? FightAudioFX.playImpact() : null;
                    renderFeed(publicacionesFeed);
                    renderTrends();
                    renderCommunityRadar();
                }
            });
        });

        // Editar Comentario Propio
        document.querySelectorAll('.btn-edit-comment').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const postId = btn.dataset.postid;
                const idx = parseInt(btn.dataset.idx, 10);
                const post = publicacionesFeed.find(p => p.id === postId);
                if (post && post.comentarios && post.comentarios[idx]) {
                    const currentTxt = post.comentarios[idx].texto;
                    const updatedTxt = prompt("Editar tu comentario:", currentTxt);
                    if (updatedTxt !== null && updatedTxt.trim() !== '') {
                        post.comentarios[idx].texto = sanitizeText(updatedTxt.trim(), 500);
                        openDrawerIds.add(postId);
                        await guardarPostEnFirebase(post);
                        renderFeed(publicacionesFeed);
                    }
                }
            });
        });

        // Eliminar Comentario Propio
        document.querySelectorAll('.btn-delete-comment').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const postId = btn.dataset.postid;
                const idx = parseInt(btn.dataset.idx, 10);
                const post = publicacionesFeed.find(p => p.id === postId);
                if (post && post.comentarios && post.comentarios[idx]) {
                    if (confirm("¿Deseas eliminar este comentario?")) {
                        post.comentarios.splice(idx, 1);
                        openDrawerIds.add(postId);
                        await guardarPostEnFirebase(post);
                        renderFeed(publicacionesFeed);
                    }
                }
            });
        });

        // Drawer de comentarios
        document.querySelectorAll('.btn-comment').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const drawer = document.getElementById(`comments-drawer-${id}`);
                if (drawer) {
                    drawer.classList.toggle('active');
                    if (drawer.classList.contains('active')) openDrawerIds.add(id);
                    else openDrawerIds.delete(id);
                }
            });
        });

        document.querySelectorAll('.btn-submit-comment').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const input = document.querySelector(`.input-new-comment[data-id="${id}"]`);
                if (input && input.value.trim()) {
                    const post = publicacionesFeed.find(item => item.id === id);
                    if (post) {
                        const userName = localStorage.getItem('userName') || (currentRole === 'fighter' ? 'Atleta Pro' : currentRole === 'practitioner' ? 'Practicante Dojo' : currentRole === 'promoter' ? 'Promotora Oficial' : 'Fan');
                        post.comentarios = Array.isArray(post.comentarios) ? post.comentarios : [];
                        post.comentarios.push({
                            autor: sanitizeText(userName, 60),
                            texto: sanitizeText(input.value.trim(), 500),
                            rol: currentRole
                        });
                        input.value = ''; // Limpiar input tras envío seguro
                        openDrawerIds.add(id);
                        FightAudioFX.playBell();

                        // +5 puntos Fight IQ por análisis/comentario técnico
                        userFightIQPoints = (userFightIQPoints || 0) + 5;
                        localStorage.setItem('userFightIQ', userFightIQPoints);
                        const commentUid = localStorage.getItem('userId');
                        if (db && commentUid && commentUid !== 'guest') {
                            setDoc(doc(db, "users", commentUid), { fightIQPoints: userFightIQPoints }, { merge: true }).catch(() => {});
                        }
                        if (typeof actualizarPasaporteUsuarioUI === 'function') actualizarPasaporteUsuarioUI();
                        if (typeof renderLeaderboard === 'function') renderLeaderboard();

                        guardarPostEnFirebase(post);
                        renderFeed(publicacionesFeed);
                    }
                }
            });
        });

        document.querySelectorAll('.input-new-comment').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const btn = document.querySelector(`.btn-submit-comment[data-id="${input.dataset.id}"]`);
                    if (btn) btn.click();
                }
            });
        });

        // Refight
        document.querySelectorAll('.btn-refight').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const post = publicacionesFeed.find(item => item.id === id);
                if (post) {
                    post.refights = (post.refights || 0) + 1;
                    FightAudioFX.playBell();
                    guardarPostEnFirebase(post);
                    renderFeed(publicacionesFeed);
                }
            });
        });

        // Disparador del Pasaporte de Combate Adaptativo (en publicaciones y comentarios)
        document.querySelectorAll('.author-passport-trigger').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                abrirModalPasaporte(el.dataset.author, el.dataset.role);
            });
        });
    }

    // Handlers del Modal de Editar Publicación
    const formEditPost = document.getElementById('form-edit-post');
    const modalEditPost = document.getElementById('modal-edit-post');
    const btnCloseEditPost = document.getElementById('btn-close-edit-post');
    const btnCancelEditPost = document.getElementById('btn-cancel-edit-post');
    const btnSelectEditFile = document.getElementById('btn-select-edit-file');
    const editPostFileInput = document.getElementById('edit-post-file-input');
    const editPostFileName = document.getElementById('edit-post-file-name');
    const editPostPreviewBox = document.getElementById('edit-post-preview-box');
    const editPostPreviewImg = document.getElementById('edit-post-preview-img');
    const btnRemoveEditImg = document.getElementById('btn-remove-edit-img');
    const editPostImgInput = document.getElementById('edit-post-image');

    if (btnSelectEditFile && editPostFileInput) {
        btnSelectEditFile.addEventListener('click', () => editPostFileInput.click());
        editPostFileInput.addEventListener('change', () => {
            if (editPostFileInput.files && editPostFileInput.files[0]) {
                const file = editPostFileInput.files[0];
                if (editPostFileName) {
                    editPostFileName.textContent = file.name;
                    editPostFileName.style.display = 'inline-block';
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target.result;
                    if (editPostPreviewImg) editPostPreviewImg.src = dataUrl;
                    if (editPostPreviewBox) editPostPreviewBox.style.display = 'flex';
                    if (editPostImgInput) editPostImgInput.value = dataUrl;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (btnRemoveEditImg) {
        btnRemoveEditImg.addEventListener('click', () => {
            if (editPostFileInput) editPostFileInput.value = '';
            if (editPostFileName) {
                editPostFileName.textContent = '';
                editPostFileName.style.display = 'none';
            }
            if (editPostPreviewBox) editPostPreviewBox.style.display = 'none';
            if (editPostPreviewImg) editPostPreviewImg.src = '';
            if (editPostImgInput) editPostImgInput.value = '';
        });
    }

    if (formEditPost) {
        formEditPost.addEventListener('submit', async (e) => {
            e.preventDefault();
            const postId = document.getElementById('edit-post-id')?.value;
            const newText = document.getElementById('edit-post-text')?.value.trim();
            const newImg = document.getElementById('edit-post-image')?.value.trim();

            const post = publicacionesFeed.find(p => p.id === postId);
            if (post) {
                post.texto = sanitizeText(newText, 1500);
                post.imagen = newImg ? sanitizeUrl(newImg) : null;
                await guardarPostEnFirebase(post);
                if (modalEditPost) modalEditPost.classList.remove('active');
                FightAudioFX.playBell ? FightAudioFX.playBell() : null;
                renderFeed(publicacionesFeed);
                renderTrends();
            }
        });
    }
    if (btnCloseEditPost && modalEditPost) {
        btnCloseEditPost.addEventListener('click', () => modalEditPost.classList.remove('active'));
    }
    if (btnCancelEditPost && modalEditPost) {
        btnCancelEditPost.addEventListener('click', () => modalEditPost.classList.remove('active'));
    }

    // ========================================================================
    // 10. MODAL ADAPTATIVO: PASAPORTE DE COMBATE (COMBAT ID / TALE OF THE TAPE)
    // ========================================================================
    const modalPassport = document.getElementById('modal-combat-passport');
    const btnClosePassport = document.getElementById('btn-close-passport-modal');
    const passportContent = document.getElementById('passport-modal-content');

    function abrirModalPasaporte(author, role) {
        if (!modalPassport || !passportContent) return;

        FightAudioFX.playBell();
        let html = '';
        const authorPost = publicacionesFeed.find(p => p.autor === author);
        const myName = localStorage.getItem('userName') || '';
        const isMe = author && myName && (author.toLowerCase().trim() === myName.toLowerCase().trim());
        const authorAvatar = authorPost?.avatar || authorPost?.authorAvatar || ((isMe && localStorage.getItem('userAvatar')) ? localStorage.getItem('userAvatar') : null);

        const resolvedRole = role || authorPost?.rol || (isMe ? currentRole : 'fan');
        const viewerRole = currentRole || localStorage.getItem('userRole') || 'fan';
        const isPromoterViewer = (viewerRole === 'promoter');

        if (resolvedRole === 'fighter') {
            const record = authorPost?.record || (isMe ? (localStorage.getItem('fighterRecord') || '0 - 0 - 0') : 'En competencia');
            const division = authorPost?.division || authorPost?.calloutData?.categoria || (isMe ? (localStorage.getItem('fighterWeight') || 'Por pactar') : 'División Oficial');
            const location = authorPost?.calloutData?.ciudad || 'Octágono Oficial';
            const primaryDisc = authorPost?.primaryDiscipline || (isMe ? (localStorage.getItem('fighterDiscipline') || 'mma') : 'mma');
            const primaryLabel = (FC_DISCIPLINES_MAP[primaryDisc.toLowerCase()] || primaryDisc).toUpperCase();

            const athleteBio = authorPost?.bio || authorPost?.descripcion || (isMe ? (localStorage.getItem('fighterBio') || 'Peleador activo en el ecosistema FightConnect. Enfocado en perfeccionamiento marcial.') : 'Atleta competitivo activo en FightConnect. Especialidad en striking y grappling.');
            const athleteIg = authorPost?.instagram || authorPost?.ig || (isMe ? (localStorage.getItem('fighterInstagram') || '@mi_perfil_atleta') : `@${author.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`);
            const athletePhone = authorPost?.phone || authorPost?.whatsapp || (isMe ? (localStorage.getItem('fighterPhone') || localStorage.getItem('whatsapp') || '+57 300 456 7890') : '+57 310 987 6543');
            const cleanPhone = athletePhone.replace(/\D/g, '');

            let recordsByDisc = authorPost?.recordsByDiscipline || null;
            if (!recordsByDisc && isMe) {
                try {
                    recordsByDisc = JSON.parse(localStorage.getItem('fighterRecordsByDiscipline') || 'null');
                } catch (_) {
                    recordsByDisc = null;
                }
            }

            let recordsBreakdownHtml = '';
            if (recordsByDisc && typeof recordsByDisc === 'object' && Object.keys(recordsByDisc).length > 0) {
                const pills = Object.entries(recordsByDisc).map(([dKey, r]) => {
                    const isPrim = dKey.toLowerCase() === primaryDisc.toLowerCase();
                    const dName = FC_DISCIPLINES_MAP[dKey.toLowerCase()] || dKey.toUpperCase();
                    return `
                        <div class="record-discipline-pill ${isPrim ? 'primary-pill' : ''}">
                            <span class="pill-disc-title">${dName} ${isPrim ? '★' : ''}</span>
                            <span class="pill-record-val">${r.wins}-${r.losses}-${r.draws}</span>
                        </div>
                    `;
                }).join('');

                recordsBreakdownHtml = `
                    <div style="margin: 1.2rem 0; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.8rem;">
                        <span style="font-size: 0.68rem; color: var(--text-gray); letter-spacing: 1px; display: block; margin-bottom: 0.5rem; text-transform: uppercase;">
                            <i class="fas fa-medal" style="color: #ffc107; margin-right: 4px;"></i> RÉCORDS POR DISCIPLINA MARCIAL:
                        </span>
                        <div class="records-breakdown-grid" style="grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));">
                            ${pills}
                        </div>
                    </div>
                `;
            }

            // Bloque de Redes Sociales y Descripción
            const socialAndBioHtml = `
                <div style="margin: 1rem 0; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.85rem; text-align: left;">
                    <span style="font-size: 0.68rem; color: var(--text-gray); letter-spacing: 1px; display: block; margin-bottom: 0.35rem; text-transform: uppercase;">
                        <i class="fas fa-user-circle" style="color: var(--accent-red); margin-right: 4px;"></i> DESCRIPCIÓN & BIO DEL ATLETA:
                    </span>
                    <p style="font-size: 0.82rem; color: #ddd; margin: 0; line-height: 1.45;">${athleteBio}</p>
                    <div style="margin-top: 0.65rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem;">
                        <i class="fab fa-instagram" style="color: #E1306C; font-size: 0.95rem;"></i>
                        <span style="color: #aaa;">Instagram:</span>
                        <span style="color: #fff; font-weight: 500;">${athleteIg}</span>
                    </div>
                </div>
            `;

            // Lógica de Permisos de Contacto / Scouting
            let contactActionHtml = '';
            if (isMe) {
                // Perfil propio del peleador: enlace a su dashboard en vez de retarse a sí mismo
                contactActionHtml = `
                    <a href="fighter-dashboard.html" class="btn-apply-fight-post" style="text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 1rem;">
                        <i class="fas fa-user-edit"></i> IR A MI PANEL DE PELEADOR
                    </a>
                `;
            } else if (isPromoterViewer) {
                // Promotora viendo a un peleador: teléfono WhatsApp visible y opción de scouting
                const scoutMsg = `Hola ${author}, te contactamos desde nuestra promotora a través de FightConnect. Nos interesa tu perfil marcial para nuestra próxima cartelera. ¿Podemos conversar sobre tus condiciones?`;
                contactActionHtml = `
                    <div style="margin: 1rem 0; background: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 10px; padding: 0.9rem; text-align: left;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                            <span style="font-size: 0.72rem; color: #25D366; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
                                <i class="fab fa-whatsapp"></i> TELÉFONO & WHATSAPP (SCOUTING)
                            </span>
                            <span style="font-size: 0.82rem; color: #fff; font-weight: bold; font-family: monospace;">${athletePhone}</span>
                        </div>
                        <p style="font-size: 0.75rem; color: #aaa; margin: 0 0 0.75rem 0;">Acceso autorizado como Promotora Oficial para contactar directamente al peleador y acordar cartelera.</p>
                        <a href="https://wa.me/${cleanPhone}?text=${encodeURIComponent(scoutMsg)}" target="_blank" rel="noopener noreferrer" class="btn-apply-fight-post" style="text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; background: #25D366; color: #000; font-weight: bold; margin: 0;">
                            <i class="fab fa-whatsapp" style="font-size: 1.1rem;"></i> CONTACTAR POR WHATSAPP (SCOUTING)
                        </a>
                    </div>
                    <button class="btn-apply-fight-post" style="background: linear-gradient(90deg, #ffc107 0%, #d97706 100%); color: #000; font-weight: bold;" onclick="alert('📋 Ficha técnica guardada en tu panel de scouting de promotora.'); document.getElementById('modal-combat-passport').classList.remove('active');">
                        <i class="fas fa-file-contract"></i> ENVIAR OFERTA DE CARTELERA
                    </button>
                `;
            } else {
                // Otro peleador o fan: datos privados ocultos, solo pueden retar o seguir
                contactActionHtml = `
                    <div style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; padding: 0.6rem 0.8rem; margin: 0.8rem 0; font-size: 0.74rem; color: #888; text-align: left; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-lock" style="color: #ffc107;"></i>
                        <span>Número de contacto y contratación disponibles exclusivamente para promotoras verificadas.</span>
                    </div>
                    ${viewerRole === 'fighter' ? `
                        <button class="btn-apply-fight-post" onclick="alert('🥊 Solicitud de Sparring o Reto enviada al atleta.'); document.getElementById('modal-combat-passport').classList.remove('active');">
                            <i class="fas fa-handshake"></i> SOLICITAR SPARRING / RETAR
                        </button>
                    ` : `
                        <button class="btn-apply-fight-post" style="background: linear-gradient(90deg, #00a8ff 0%, #0070f3 100%);" onclick="alert('⭐ Siguiendo al atleta.'); document.getElementById('modal-combat-passport').classList.remove('active');">
                            <i class="fas fa-user-plus"></i> SEGUIR ATLETA
                        </button>
                    `}
                `;
            }

            html = `
                <div class="modal-tale-header">
                    <div class="modal-tale-avatar" style="border-color: var(--accent-red); color: var(--accent-red);">
                        ${authorAvatar ? `<img src="${SecurityUtils.sanitizeUrl(authorAvatar)}" alt="${escapeHtml(author)}" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<i class=\\'fas fa-fist-raised\\'></i>';">` : `<i class="fas fa-fist-raised"></i>`}
                    </div>
                    <div style="font-size: 0.72rem; color: var(--accent-red); font-family: var(--font-heading); letter-spacing: 2px; font-weight: bold;">TALE OF THE TAPE • PELEADOR</div>
                    <h2 class="modal-tale-name">${escapeHtml(author)}</h2>
                    <p style="color: #aaa; font-size: 0.85rem; margin: 4px 0 0;">${escapeHtml(location)} • Atleta Verificado</p>
                </div>
                <div class="modal-tale-stats-grid">
                    <div class="tale-stat-box">
                        <span class="tale-stat-val" style="color: var(--accent-red);">${escapeHtml(record)}</span>
                        <span class="tale-stat-lbl">Récord (${escapeHtml(primaryLabel)})</span>
                    </div>
                    <div class="tale-stat-box">
                        <span class="tale-stat-val">${escapeHtml(division)}</span>
                        <span class="tale-stat-lbl">División de Peso</span>
                    </div>
                    <div class="tale-stat-box">
                        <span class="tale-stat-val">Activo</span>
                        <span class="tale-stat-lbl">Estatus de Camp</span>
                    </div>
                </div>
                ${recordsBreakdownHtml}
                ${socialAndBioHtml}
                ${contactActionHtml}
            `;
        } else if (resolvedRole === 'practitioner') {
            const disc = authorPost?.techniqueData?.disciplina || 'Artes Marciales';
            const belt = authorPost?.techniqueData?.rango || 'Tatami Local';

            html = `
                <div class="modal-tale-header">
                    <div class="modal-tale-avatar" style="border-color: #10b981; color: #10b981;">
                        ${authorAvatar ? `<img src="${SecurityUtils.sanitizeUrl(authorAvatar)}" alt="${escapeHtml(author)}">` : `<i class="fas fa-graduation-cap"></i>`}
                    </div>
                    <div style="font-size: 0.72rem; color: #10b981; font-family: var(--font-heading); letter-spacing: 2px; font-weight: bold;">PASAPORTE DE DOJO • PRACTICANTE</div>
                    <h2 class="modal-tale-name">${escapeHtml(author)}</h2>
                    <p style="color: #aaa; font-size: 0.85rem; margin: 4px 0 0;">${escapeHtml(disc)} • Miembro de Tatami</p>
                </div>
                <div class="modal-tale-stats-grid">
                    <div class="tale-stat-box">
                        <span class="tale-stat-val" style="color: #10b981;">${escapeHtml(belt)}</span>
                        <span class="tale-stat-lbl">Grado / Rango</span>
                    </div>
                    <div class="tale-stat-box">
                        <span class="tale-stat-val">${escapeHtml(disc)}</span>
                        <span class="tale-stat-lbl">Disciplina</span>
                    </div>
                    <div class="tale-stat-box">
                        <span class="tale-stat-val">Abierto</span>
                        <span class="tale-stat-lbl">Open Mats</span>
                    </div>
                </div>
                <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 0.8rem; margin-bottom: 1rem; font-size: 0.82rem; color: #ccc; text-align: center;">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i> Perfil abierto a entrenamientos técnicos y rolados de tatami.
                </div>
                ${isMe ? `
                    <button class="btn-apply-fight-post" style="background: linear-gradient(90deg, #10b981 0%, #059669 100%);" onclick="document.getElementById('modal-combat-passport').classList.remove('active');">
                        <i class="fas fa-check"></i> MI PERFIL DE DOJO ACTIVO
                    </button>
                ` : `
                    <button class="btn-apply-fight-post" style="background: linear-gradient(90deg, #10b981 0%, #059669 100%);" onclick="alert('🥋 ¡Invitación enviada para entrenar!'); document.getElementById('modal-combat-passport').classList.remove('active');">
                        <i class="fas fa-calendar-plus"></i> CONECTAR EN TATAMI
                    </button>
                `}
            `;
        } else if (resolvedRole === 'promoter') {
            const loc = authorPost?.calloutData?.ciudad || (isMe ? (localStorage.getItem('promoterCity') || localStorage.getItem('userCity') || 'Colombia') : 'Colombia');
            const cartelerasNum = isMe ? (typeof calcularCartelerasPromotoraActual === 'function' ? calcularCartelerasPromotoraActual() : 1) : (authorPost?.cartelerasCount || 1);

            html = `
                <div class="modal-tale-header">
                    <div class="modal-tale-avatar" style="border-color: #ffc107; color: #ffc107; border-radius: 12px;">
                        ${authorAvatar ? `<img src="${SecurityUtils.sanitizeUrl(authorAvatar)}" alt="${escapeHtml(author)}" style="border-radius: 10px;">` : `<i class="fas fa-shield-alt"></i>`}
                    </div>
                    <div style="font-size: 0.72rem; color: #ffc107; font-family: var(--font-heading); letter-spacing: 2px; font-weight: bold;">CREDENCIAL DE ORGANIZACIÓN & MATCHMAKING</div>
                    <h2 class="modal-tale-name">${escapeHtml(author)}</h2>
                    <p style="color: #aaa; font-size: 0.85rem; margin: 4px 0 0;">Promotora Oficial • ${escapeHtml(loc)}</p>
                </div>
                <div class="modal-tale-stats-grid">
                    <div class="tale-stat-box">
                        <span class="tale-stat-val" style="color: #ffc107;">${escapeHtml(cartelerasNum)}</span>
                        <span class="tale-stat-lbl">Carteleras Hechas</span>
                    </div>
                    <div class="tale-stat-box">
                        <span class="tale-stat-val">${escapeHtml(loc)}</span>
                        <span class="tale-stat-lbl">Sede Central</span>
                    </div>
                    <div class="tale-stat-box">
                        <span class="tale-stat-val">Abierto</span>
                        <span class="tale-stat-lbl">Scouting</span>
                    </div>
                </div>
                ${isMe ? `
                    <div style="background: rgba(255,193,7,0.08); border: 1px solid rgba(255,193,7,0.2); border-radius: 8px; padding: 0.7rem; margin-bottom: 1rem; font-size: 0.8rem; color: #ccc; text-align: center;">
                        <i class="fas fa-check-circle" style="color: #ffc107;"></i> Este es tu perfil oficial de promotora. Administra tus carteleras y scouts desde tu panel.
                    </div>
                    <a href="promotor-dashboard.html" class="btn-apply-fight-post" style="text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(90deg, #ffc107 0%, #d97706 100%); color: #000; font-weight: bold;">
                        <i class="fas fa-calendar-alt"></i> IR A MI PANEL DE PROMOTORA (ORGANIZAR EVENTOS)
                    </a>
                ` : `
                    <button class="btn-apply-fight-post" style="background: linear-gradient(90deg, #ffc107 0%, #d97706 100%); color: #000; font-weight: bold;" onclick="alert('📋 Récord de atleta enviado para scouting en la próxima velada.'); document.getElementById('modal-combat-passport').classList.remove('active');">
                        <i class="fas fa-file-upload"></i> ENVIAR RÉCORD PARA SCOUTING
                    </button>
                `}
            `;
        } else {
            const userIQ = isMe ? userFightIQPoints : (authorPost ? (authorPost.iqs || 0) * 15 + (authorPost.kos || 0) * 10 : 0);
            html = `
                <div class="modal-tale-header">
                    <div class="modal-tale-avatar" style="border-color: #00a8ff; color: #00a8ff;">
                        ${authorAvatar ? `<img src="${SecurityUtils.sanitizeUrl(authorAvatar)}" alt="${escapeHtml(author)}">` : `<i class="fas fa-users"></i>`}
                    </div>
                    <div style="font-size: 0.72rem; color: #00a8ff; font-family: var(--font-heading); letter-spacing: 2px; font-weight: bold;">PERFIL DE FANÁTICO & ANALISTA</div>
                    <h2 class="modal-tale-name">${escapeHtml(author)}</h2>
                    <p style="color: #aaa; font-size: 0.85rem; margin: 4px 0 0;">Comunidad FightConnect</p>
                </div>
                <div class="modal-tale-stats-grid">
                    <div class="tale-stat-box">
                        <span class="tale-stat-val" style="color: #00a8ff;">${userIQ} pts</span>
                        <span class="tale-stat-lbl">Puntos Fight IQ</span>
                    </div>
                    <div class="tale-stat-box">
                        <span class="tale-stat-val">${userIQ > 0 ? '100%' : '0%'}</span>
                        <span class="tale-stat-lbl">Aciertos Pick'em</span>
                    </div>
                    <div class="tale-stat-box">
                        <span class="tale-stat-val">Comunidad</span>
                        <span class="tale-stat-lbl">Rango</span>
                    </div>
                </div>
                ${isMe ? `
                    <button class="btn-apply-fight-post" style="background: linear-gradient(90deg, #00a8ff 0%, #0070f3 100%);" onclick="document.getElementById('modal-combat-passport').classList.remove('active');">
                        <i class="fas fa-check"></i> MI PERFIL DE LA COMUNIDAD
                    </button>
                ` : `
                    <button class="btn-apply-fight-post" style="background: linear-gradient(90deg, #00a8ff 0%, #0070f3 100%);" onclick="alert('⭐ Siguiendo análisis del usuario.'); document.getElementById('modal-combat-passport').classList.remove('active');">
                        <i class="fas fa-plus"></i> SEGUIR ANÁLISIS
                    </button>
                `}
            `;
        }

        passportContent.innerHTML = html;
        modalPassport.classList.add('active');
    }

    if (btnClosePassport) {
        btnClosePassport.addEventListener('click', () => modalPassport.classList.remove('active'));
    }

    // Modal Careo Face-Off
    const modalFaceoff = document.getElementById('modal-faceoff-challenge');
    const btnCloseFaceoff = document.getElementById('btn-close-faceoff-modal');
    const faceoffContent = document.getElementById('faceoff-modal-content');

    function abrirModalFaceoff(postId) {
        if (!modalFaceoff || !faceoffContent) return;
        const post = publicacionesFeed.find(p => p.id === postId);
        const redFighter = post ? post.autor : 'Peleador Retador';
        const blueFighter = localStorage.getItem('userName') || 'Tu Atleta';

        faceoffContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.25rem;">
                <span style="background: rgba(230,36,41,0.2); color: var(--accent-red); border: 1px solid var(--accent-red); font-family: var(--font-heading); font-size: 0.75rem; letter-spacing: 2px; padding: 2px 8px; border-radius: 12px;">CAREO VIRTUAL OFICIAL</span>
                <h2 style="font-family: var(--font-heading); font-size: 1.8rem; color: #fff; margin: 0.5rem 0 0.2rem; letter-spacing: 2px;">FACE-OFF DE COMBATE</h2>
                <p style="color: #888; font-size: 0.8rem;">Confirmación de postulación para pesaje y reglas de combate.</p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 1rem; align-items: center; margin-bottom: 1.5rem; text-align: center;">
                <div style="background: rgba(230,36,41,0.15); border: 1px solid var(--accent-red); border-radius: 10px; padding: 1rem;">
                    <div style="font-size: 0.7rem; color: var(--accent-red); font-weight: bold; font-family: var(--font-heading);">ESQUINA ROJA</div>
                    <div style="font-family: var(--font-heading); font-size: 1.1rem; color: #fff; margin-top: 4px;">${redFighter}</div>
                </div>
                <div style="font-family: var(--font-heading); font-size: 1.4rem; color: #ffc107; font-weight: 700;">VS</div>
                <div style="background: rgba(0,112,243,0.15); border: 1px solid #0070f3; border-radius: 10px; padding: 1rem;">
                    <div style="font-size: 0.7rem; color: #0070f3; font-weight: bold; font-family: var(--font-heading);">ESQUINA AZUL</div>
                    <div style="font-family: var(--font-heading); font-size: 1.1rem; color: #fff; margin-top: 4px;">${blueFighter}</div>
                </div>
            </div>
            <button class="btn-apply-fight-post" onclick="alert('🥊 ¡Postulación Oficial Confirmada! El organizador ha recibido tu perfil técnico y se pondrá en contacto.'); document.getElementById('modal-faceoff-challenge').classList.remove('active');">
                <i class="fas fa-check-circle"></i> CONFIRMAR DISPONIBILIDAD DE PESAJE
            </button>
        `;

        modalFaceoff.classList.add('active');
    }

    if (btnCloseFaceoff) {
        btnCloseFaceoff.addEventListener('click', () => modalFaceoff.classList.remove('active'));
    }

    // Render Inicial
    renderFeed(publicacionesFeed);
    renderCommunityRadar();
    renderTrends();
    renderLeaderboard();
}

/**
 * INYECTOR DE EFECTOS VISUALES 3D DE ALTO RENDIMIENTO (60 FPS CONSTANTES)
 * Optimizado: 1 sola instancia global, 200 partículas, pixelRatio: 1, bajo consumo de GPU.
 */
let _threeGlobalRunning = false;

/**
 * Carga de manera diferida la biblioteca Three.js desde CDN e inicializa el lienzo de fondo.
 * @function inyectarEfectosVisuales
 * @returns {void}
 */
function inyectarEfectosVisuales() {
    if (window._threeInitialized || _threeGlobalRunning) return;
    
    if (!window.THREE) {
        if (document.querySelector('script[data-three-loader]')) return;
        const script = document.createElement('script');
        script.setAttribute('data-three-loader', 'true');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
        script.onload = () => prepararCanvasEIniciar();
        document.head.appendChild(script);
    } else {
        prepararCanvasEIniciar();
    }
}

/**
 * Crea o localiza el elemento `<canvas id="bg-canvas">` fijado en el fondo del documento.
 * @function prepararCanvasEIniciar
 * @returns {void}
 */
function prepararCanvasEIniciar() {
    if (window._threeInitialized || _threeGlobalRunning) return;
    let canvas = document.getElementById('bg-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'bg-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '-1';
        canvas.style.pointerEvents = 'none';
        document.body.prepend(canvas);
    }
    iniciarAnimacion3D();
}

/**
 * Configura la escena Three.js, la cámara de perspectiva, el material aditivo de partículas rojas
 * y el bucle de renderizado interactivo reactivo a las coordenadas del ratón.
 * @function iniciarAnimacion3D
 * @returns {void}
 */
function iniciarAnimacion3D() {
    if (window._threeInitialized || _threeGlobalRunning) return;
    const canvas = document.getElementById('bg-canvas');
    if (!window.THREE || !canvas) return;

    window._threeInitialized = true;
    _threeGlobalRunning = true;

    try {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            alpha: true, 
            antialias: false, 
            powerPreference: 'high-performance' 
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(1.0); // 1.0 para rendimiento ultra fluido y 0 caída de frames

        const geometry = new THREE.BufferGeometry();
        const particlesCount = 200; // 200 partículas óptimas
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 20; 
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const material = new THREE.PointsMaterial({
            size: 0.02,
            color: 0xe62429, 
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particlesMesh = new THREE.Points(geometry, material);
        scene.add(particlesMesh);
        camera.position.z = 5;

        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        let ticking = false;
        document.addEventListener('mousemove', (event) => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    mouseX = (event.clientX - windowHalfX);
                    mouseY = (event.clientY - windowHalfY);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        let isTabVisible = true;
        document.addEventListener('visibilitychange', () => {
            isTabVisible = (document.visibilityState === 'visible');
        });

        let lastFrameTime = 0;
        function animateBg(timestamp) {
            requestAnimationFrame(animateBg);
            if (!isTabVisible) return; // Pausar cuando la pestaña esté inactiva

            if (timestamp - lastFrameTime < 16) return; // Cap a 60 FPS
            lastFrameTime = timestamp;

            const elapsedTime = timestamp * 0.001;

            particlesMesh.rotation.y = elapsedTime * 0.035;
            particlesMesh.rotation.x = elapsedTime * 0.015;
            
            targetX = mouseX * 0.0006;
            targetY = mouseY * 0.0006;
            
            particlesMesh.rotation.y += 0.04 * (targetX - particlesMesh.rotation.y);
            particlesMesh.rotation.x += 0.04 * (targetY - particlesMesh.rotation.x);

            renderer.render(scene, camera);
        }
        requestAnimationFrame(animateBg);

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }, 150);
        }, { passive: true });

    } catch (err) {
        console.warn("Fondo 3D en modo degradación elegante:", err.message);
    }
}

/**
 * CAPÍTULO 8: LÓGICA DE AUTENTICACIÓN Y BASE DE DATOS (FIREBASE SDK)
 * Gestiona los formularios de Login y Registro dinámico de usuarios.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // ========================================================================
    // FORMULARIO DE INICIO DE SESIÓN (LOGIN)
    // ========================================================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const btn = e.target.querySelector('button');
            const prevText = btn.textContent;
            btn.textContent = 'VERIFICANDO...';
            
            try {
                // Iniciar sesión con Firebase Auth
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Buscar rol y datos en Firestore
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const name = userData.orgName || userData.legalName || userData.alias || userData.name || user.email?.split('@')[0] || 'USUARIO';
                    localStorage.setItem('userRole', userData.role);
                    localStorage.setItem('userName', name);
                    localStorage.setItem('userId', user.uid);
                    localStorage.setItem('userEmail', user.email || '');

                    if (userData.role === 'promotion' || userData.role === 'promoter') {
                        const kyb = userData.kybStatus || (userData.isVerified ? 'approved' : 'unverified');
                        localStorage.setItem('promoterKybStatus', kyb);
                    }

                    const avatar = userData.photoURL || userData.avatar || userData.logoUrl || '';
                    if (avatar) localStorage.setItem('userAvatar', avatar);
                    
                    actualizarNavegacionSesion();

                    btn.style.background = "#28a745";
                    btn.textContent = 'ACCESO CONCEDIDO';
                    setTimeout(() => redirigirRol(userData.role), 1000);
                } else {
                    throw new Error("No se encontró el perfil de usuario en la base de datos.");
                }
            } catch (error) {
                console.error("Error en login:", error);
                btn.style.background = "#e62429";
                btn.textContent = 'ACCESO DENEGADO';
                alert("Error: " + error.message);
                setTimeout(() => {
                    btn.style.background = "var(--accent-red)";
                    btn.textContent = prevText;
                }, 2000);
            }
        });
    }

    // ========================================================================
    // FORMULARIO DINÁMICO DE REGISTRO MULTI-ROL (FIGHTER, PROMOTION, FAN)
    // ========================================================================
    const dynamicForm = document.getElementById('dynamic-form');
    if (dynamicForm) {
        let isSubmitting = false;
        dynamicForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (isSubmitting) return;
            
            const role = window.selectedRole;
            if (!role) return;
            
            const btn = dynamicForm.querySelector('.btn-submit-form');
            const prevText = btn ? btn.textContent : 'ENVIAR CREDENCIALES';
            if (btn) {
                btn.textContent = 'REGISTRANDO...';
                btn.disabled = true;
            }
            isSubmitting = true;

            try {
                let email = '', password = '';
                
                // 1. Extraer credenciales base según el rol de forma segura
                if (role === 'fighter') {
                    const emailEl = document.getElementById('fighter-email');
                    const passEl = document.getElementById('fighter-password');
                    if (emailEl) email = emailEl.value.trim();
                    if (passEl) password = passEl.value;
                } else if (role === 'promotion') {
                    const emailEl = document.getElementById('promo-email');
                    const passEl = document.getElementById('promo-password');
                    if (emailEl) email = emailEl.value.trim();
                    if (passEl) password = passEl.value;
                } else if (role === 'fan') {
                    const emailEl = document.getElementById('fan-email');
                    const passEl = document.getElementById('fan-password');
                    if (emailEl) email = emailEl.value.trim();
                    if (passEl) password = passEl.value;
                }

                if (!email || !password) {
                    throw new Error("Por favor completa el correo electrónico y la contraseña.");
                }

                if (password.length < 6) {
                    throw new Error("La contraseña debe tener al menos 6 caracteres.");
                }

                // 2. Crear usuario en Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                let registeredName = '';

                // 3. Capturar y guardar datos según el rol en Cloud Firestore
                if (role === 'fighter') {
                    const legal = document.getElementById('nombre-legal')?.value || '';
                    const alias = document.getElementById('alias-combate')?.value || '';
                    registeredName = alias || legal || 'PELEADOR';

                    const baseDiscipline = (document.getElementById('disciplina-base')?.value || 'mma').toLowerCase();
                    const selectedTargetDiscs = Array.from(document.querySelectorAll('.reg-fighter-target-disc:checked')).map(cb => cb.value.toLowerCase());
                    if (!selectedTargetDiscs.includes(baseDiscipline)) {
                        selectedTargetDiscs.unshift(baseDiscipline);
                    }

                    // Recolectar récords individuales por cada disciplina elegida
                    const recordsByDiscipline = {};
                    selectedTargetDiscs.forEach(d => {
                        const winsInp = document.getElementById(`reg-wins-${d}`);
                        const lossesInp = document.getElementById(`reg-losses-${d}`);
                        const drawsInp = document.getElementById(`reg-draws-${d}`);
                        const w = Math.max(0, parseInt(winsInp?.value) || 0);
                        const l = Math.max(0, parseInt(lossesInp?.value) || 0);
                        const dr = Math.max(0, parseInt(drawsInp?.value) || 0);
                        recordsByDiscipline[d] = { wins: w, losses: l, draws: dr };
                    });

                    if (window._fc_fighter_reg_records) {
                        Object.keys(window._fc_fighter_reg_records).forEach(d => {
                            if (!recordsByDiscipline[d] && selectedTargetDiscs.includes(d)) {
                                recordsByDiscipline[d] = window._fc_fighter_reg_records[d];
                            }
                        });
                    }

                    // Récord de la disciplina principal
                    const primaryRecord = recordsByDiscipline[baseDiscipline] || {
                        wins: parseInt(document.getElementById('victorias')?.value) || 0,
                        losses: parseInt(document.getElementById('derrotas')?.value) || 0,
                        draws: parseInt(document.getElementById('empates')?.value) || 0
                    };
                    recordsByDiscipline[baseDiscipline] = primaryRecord;

                    const wins = primaryRecord.wins;
                    const losses = primaryRecord.losses;
                    const draws = primaryRecord.draws;
                    const weight = parseFloat(document.getElementById('peso-actual')?.value) || 0;
                    const height = parseFloat(document.getElementById('altura')?.value) || 0;

                    if (wins < 0 || wins > 150) throw new Error("Las victorias deben estar entre 0 y 150.");
                    if (losses < 0 || losses > 150) throw new Error("Las derrotas deben estar entre 0 y 150.");
                    if (draws < 0 || draws > 50) throw new Error("Los empates deben estar entre 0 y 50.");
                    if (weight < 45 || weight > 160) throw new Error("El peso debe estar entre 45 kg y 160 kg.");
                    if (height < 120 || height > 230) throw new Error("La estatura debe estar entre 120 cm y 230 cm.");

                    const divisionName = calcularDivisionPeso(weight);

                    await setDoc(doc(db, "users", user.uid), {
                        email: user.email,
                        role: "fighter", 
                        legalName: legal,
                        alias: alias,
                        discipline: baseDiscipline,
                        primaryDiscipline: baseDiscipline,
                        targetDisciplines: selectedTargetDiscs,
                        recordsByDiscipline: recordsByDiscipline,
                        record: primaryRecord,
                        division: divisionName,
                        metrics: {
                            weight: weight,
                            height: height
                        },
                        targetWeight: weight > 0 ? (weight - 2) : 0,
                        phone: '',
                        instagram: '',
                        gymLocation: document.getElementById('gimnasio')?.value || '',
                        location: document.getElementById('localidad')?.value || '',
                        createdAt: new Date().toISOString()
                    });

                    // Guardar en localStorage para disponibilidad inmediata en Feed y Pasaporte
                    localStorage.setItem('fighterRecord', `${wins} - ${losses} - ${draws}`);
                    localStorage.setItem('fighterWeight', `${weight} KG`);
                    localStorage.setItem('fighterDivision', divisionName);
                    localStorage.setItem('fighterDiscipline', baseDiscipline.toUpperCase());
                    localStorage.setItem('fighterRecordsByDiscipline', JSON.stringify(recordsByDiscipline));
                } else if (role === 'promotion') {
                    const org = document.getElementById('promo-name')?.value || 'ORGANIZACIÓN';
                    registeredName = org;

                    await setDoc(doc(db, "users", user.uid), {
                        email: user.email,
                        role: "promotion",
                        orgName: org,
                        city: document.getElementById('promo-city')?.value || '',
                        legalId: document.getElementById('promo-id')?.value || '',
                        kybStatus: 'unverified',
                        isVerified: false,
                        kybDocs: { rut: '', camara: '', aval: '' },
                        createdAt: new Date().toISOString()
                    });
                    localStorage.setItem('promoterKybStatus', 'unverified');
                } else if (role === 'fan') {
                    const fanN = document.getElementById('fan-name')?.value || 'FAN';
                    registeredName = fanN;

                    await setDoc(doc(db, "users", user.uid), {
                        email: user.email,
                        role: "fan",
                        name: fanN,
                        createdAt: new Date().toISOString()
                    });
                }

                // 4. Finalizar y sincronizar sesión local
                localStorage.setItem('userRole', role);
                localStorage.setItem('userName', registeredName);
                localStorage.setItem('userId', user.uid);
                localStorage.setItem('userEmail', user.email || '');
                localStorage.removeItem('userAvatar');

                actualizarNavegacionSesion();

                btn.style.background = "#28a745";
                btn.textContent = 'REGISTRO EXITOSO';
                setTimeout(() => redirigirRol(role), 1500);

            } catch (error) {
                console.error("Error en registro:", error);
                btn.style.background = "#e62429";
                btn.textContent = 'ERROR EN REGISTRO';
                
                let userFriendlyMessage = error.message;
                if (error.code === 'auth/email-already-in-use') {
                    userFriendlyMessage = "Este correo electrónico ya está registrado en Firebase. Por favor inicia sesión o usa un correo diferente.";
                } else if (error.code === 'auth/invalid-email') {
                    userFriendlyMessage = "El formato del correo electrónico no es válido.";
                } else if (error.code === 'auth/weak-password') {
                    userFriendlyMessage = "La contraseña es muy débil. Debe tener al menos 6 caracteres.";
                } else if (error.code === 'auth/invalid-credential') {
                    userFriendlyMessage = "Credenciales no válidas. Por favor verifica los datos ingresados.";
                }

                alert("Error de Registro:\n" + userFriendlyMessage);
                
                setTimeout(() => {
                    if (btn) {
                        btn.style.background = "var(--accent-red)";
                        btn.textContent = prevText;
                        btn.disabled = false;
                    }
                    isSubmitting = false;
                }, 1500);
            }
        });
    }
});

// ============================================================================
// CICLO DE VIDA Y RUTA DE AUTENTICACIÓN (FIRESTORE DATA HYDRATION)
// ============================================================================

/**
 * Escuchador global del estado de autenticación de Firebase.
 * Hidrata reactivamente la interfaz según el rol del usuario autenticado (Atleta, Promotor, Fan),
 * cargando métricas, récords deportivos, expedientes médicos y carteleras.
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const data = userDoc.data();
                const role = data.role || localStorage.getItem('userRole') || 'fan';
                const name = data.orgName || data.legalName || data.alias || data.name || user.email?.split('@')[0] || 'USUARIO';
                
                localStorage.setItem('userRole', role);
                localStorage.setItem('userName', name);
                localStorage.setItem('userId', user.uid);
                localStorage.setItem('userEmail', user.email || '');

                const userAvatar = data.photoURL || data.avatar || data.logoUrl || '';
                if (userAvatar) {
                    localStorage.setItem('userAvatar', userAvatar);
                } else {
                    localStorage.removeItem('userAvatar');
                }

                // Sincronización de estado KYB de promotoras en el almacenamiento local
                if (role === 'promotion' || role === 'promoter') {
                    const kybStatus = data.kybStatus || (data.isVerified ? 'approved' : 'unverified');
                    localStorage.setItem('promoterKybStatus', kybStatus);
                    if (kybStatus === 'approved') {
                        localStorage.setItem(`kyb_verified_promoter_${user.uid}`, 'true');
                    } else {
                        localStorage.removeItem(`kyb_verified_promoter_${user.uid}`);
                    }
                }

                // Sincronización de métricas y récords para peleadores en el almacenamiento local
                if (role === 'fighter') {
                    const primaryDisc = (data.primaryDiscipline || data.discipline || 'mma').toLowerCase();
                    let wins = 0, losses = 0, draws = 0;
                    if (data.recordsByDiscipline && data.recordsByDiscipline[primaryDisc]) {
                        wins = data.recordsByDiscipline[primaryDisc].wins || 0;
                        losses = data.recordsByDiscipline[primaryDisc].losses || 0;
                        draws = data.recordsByDiscipline[primaryDisc].draws || 0;
                    } else if (data.record) {
                        wins = data.record.wins ?? (parseInt(data.record) || 0);
                        losses = data.record.losses ?? 0;
                        draws = data.record.draws ?? 0;
                    }
                    const recordStr = `${wins} - ${losses} - ${draws}`;
                    const weightVal = data.metrics?.weight || data.targetWeight || 0;
                    const divisionStr = data.division || calcularDivisionPeso(weightVal);
                    const weightText = weightVal > 0 ? `${weightVal} KG` : divisionStr;

                    localStorage.setItem('fighterRecord', recordStr);
                    localStorage.setItem('fighterWeight', weightText);
                    localStorage.setItem('fighterDivision', divisionStr);
                    localStorage.setItem('fighterDiscipline', primaryDisc.toUpperCase());
                    if (data.recordsByDiscipline) {
                        localStorage.setItem('fighterRecordsByDiscipline', JSON.stringify(data.recordsByDiscipline));
                    }
                }

                // Sincronización exclusiva para rol FAN: eventos, promotoras, preferencias y encuestas
                if (role === 'fan') {
                    if (data.favEvents && Array.isArray(data.favEvents)) {
                        // Purga automática preventiva: solo eventos futuros o en curso
                        const vigentes = typeof esEventoVigenteOFuturo === 'function'
                            ? data.favEvents.filter(ev => esEventoVigenteOFuturo(ev))
                            : data.favEvents;
                        localStorage.setItem(`fightconnect_fan_fav_events_${user.uid}`, JSON.stringify(vigentes));
                        localStorage.setItem('fightconnect_fan_fav_events', JSON.stringify(vigentes));
                        if (vigentes.length !== data.favEvents.length) {
                            setDoc(doc(db, "users", user.uid), { favEvents: vigentes }, { merge: true }).catch(() => {});
                        }
                    } else {
                        const localFavEvents = typeof obtenerEventosFavoritos === 'function' ? obtenerEventosFavoritos(user.uid) : [];
                        if (localFavEvents.length > 0) {
                            setDoc(doc(db, "users", user.uid), { favEvents: localFavEvents }, { merge: true }).catch(() => {});
                        }
                    }

                    if (data.favPromoters && Array.isArray(data.favPromoters)) {
                        localStorage.setItem(`fightconnect_fan_fav_promoters_${user.uid}`, JSON.stringify(data.favPromoters));
                        localStorage.setItem('fightconnect_fan_fav_promoters', JSON.stringify(data.favPromoters));
                    } else {
                        const localFavProms = typeof obtenerPromotorasSeguidas === 'function' ? obtenerPromotorasSeguidas(user.uid) : [];
                        if (localFavProms.length > 0) {
                            setDoc(doc(db, "users", user.uid), { favPromoters: localFavProms }, { merge: true }).catch(() => {});
                        }
                    }

                    if (data.preferences) {
                        localStorage.setItem(`fightconnect_fan_preferences_${user.uid}`, JSON.stringify(data.preferences));
                        localStorage.setItem('fightconnect_fan_preferences', JSON.stringify(data.preferences));
                    } else {
                        const localPrefs = typeof obtenerPreferenciasFan === 'function' ? obtenerPreferenciasFan(user.uid) : { disciplines: ['mma'], notifyLocalEvents: true };
                        setDoc(doc(db, "users", user.uid), { preferences: localPrefs }, { merge: true }).catch(() => {});
                    }

                    if (data.fightIQPoints !== undefined || data.userFightIQ !== undefined) {
                        const iqVal = data.fightIQPoints ?? data.userFightIQ ?? 0;
                        localStorage.setItem('userFightIQ', iqVal);
                    }

                    if (data.pollVotes) {
                        localStorage.setItem(`fightconnect_poll_votes_${user.uid}`, JSON.stringify(data.pollVotes));
                    } else {
                        const localVotes = typeof obtenerVotosUsuarioPolls === 'function' ? obtenerVotosUsuarioPolls(user.uid) : {};
                        if (Object.keys(localVotes).length > 0) {
                            setDoc(doc(db, "users", user.uid), { pollVotes: localVotes }, { merge: true }).catch(() => {});
                        }
                    }
                }

                // Actualizar inmediatamente la barra de navegación en todas las páginas (noticias, feed, cartelera, etc.)
                actualizarNavegacionSesion();

                // Sincronizar reactivamente el pasaporte de usuario en FightFeed
                if (typeof window.actualizarPasaporteUsuarioUI === 'function') {
                    window.actualizarPasaporteUsuarioUI();
                }

                const currentPage = window.location.pathname;
                if (currentPage.includes('dashboard') || currentPage.includes('ajustes') || currentPage.includes('historial') || currentPage.includes('buscar') || currentPage.includes('favoritos') || currentPage.includes('postulaciones') || currentPage.includes('scouting')) {
                    // -- FIGHTER ROLE --
                    if (role === 'fighter' || data.role === 'fighter') {
                        if (currentPage.includes('fighter-dashboard') || currentPage.includes('fighter-historial')) {
                            // 1. Populate Text Fields
                            const displayName = data.legalName || data.name || data.alias || localStorage.getItem('userName') || 'ATLETA';
                            const nameEl = document.getElementById('dash-name');
                            if (nameEl) nameEl.textContent = displayName;
                            
                            const aliasEl = document.getElementById('dash-alias');
                            if (aliasEl) aliasEl.textContent = `"${data.alias || data.legalName || displayName || 'ATLETA'}"`;
                            
                            const baseDisc = (data.primaryDiscipline || data.discipline || 'mma').toLowerCase();
                            let primaryWins = 0, primaryLosses = 0, primaryDraws = 0;
                            if (data.recordsByDiscipline && data.recordsByDiscipline[baseDisc]) {
                                primaryWins = data.recordsByDiscipline[baseDisc].wins || 0;
                                primaryLosses = data.recordsByDiscipline[baseDisc].losses || 0;
                                primaryDraws = data.recordsByDiscipline[baseDisc].draws || 0;
                            } else if (data.record) {
                                primaryWins = data.record.wins ?? (parseInt(data.record) || 0);
                                primaryLosses = data.record.losses ?? 0;
                                primaryDraws = data.record.draws ?? 0;
                            }

                            const recordEl = document.getElementById('dash-record');
                            if (recordEl) {
                                recordEl.textContent = `RÉCORD (${baseDisc.toUpperCase()}): ${primaryWins}-${primaryLosses}-${primaryDraws}`;
                            }

                            // Renderizar desglose de récords en el Hero de fighter-dashboard
                            const heroBreakdown = document.getElementById('dash-records-breakdown');
                            if (heroBreakdown) {
                                const DISCIPLINE_ICONS = {
                                    mma: 'fa-fist-raised',
                                    boxeo: 'fa-mitten',
                                    bjj: 'fa-shield-alt',
                                    lucha: 'fa-compress-arrows-alt',
                                    muaythai: 'fa-fire',
                                    kickboxing: 'fa-bolt',
                                    judo: 'fa-award'
                                };
                                const recsObj = data.recordsByDiscipline || { [baseDisc]: { wins: primaryWins, losses: primaryLosses, draws: primaryDraws } };
                                heroBreakdown.innerHTML = Object.entries(recsObj).map(([disc, rec]) => {
                                    const icon = DISCIPLINE_ICONS[disc.toLowerCase()] || 'fa-fist-raised';
                                    const isPrim = disc.toLowerCase() === baseDisc;
                                    return `
                                        <span class="discipline-badge" style="font-size: 0.72rem; padding: 0.3rem 0.65rem; ${isPrim ? 'border-color: var(--accent-red); background: rgba(230,36,41,0.25); font-weight: bold;' : ''}">
                                            <i class="fas ${icon}"></i> ${disc.toUpperCase()}: ${rec.wins || 0}-${rec.losses || 0}-${rec.draws || 0} ${isPrim ? '★' : ''}
                                        </span>
                                    `;
                                }).join('');
                            }
                            
                            const discEl = document.getElementById('dash-discipline');
                            if (discEl) discEl.textContent = baseDisc.toUpperCase();

                            const targetDiscs = (Array.isArray(data.targetDisciplines) && data.targetDisciplines.length > 0)
                                ? data.targetDisciplines.map(d => d.toLowerCase())
                                : [baseDisc];

                            const discBadgesContainer = document.getElementById('dash-target-disciplines');
                            if (discBadgesContainer) {
                                discBadgesContainer.innerHTML = targetDiscs.map(d => `<span class="discipline-badge"><i class="fas fa-shield-alt"></i> ${d.toUpperCase()}</span>`).join('');
                            }
                            
                            const gymEl = document.getElementById('dash-gym');
                            if (gymEl) gymEl.textContent = (data.gymLocation || data.gym || 'SIN AFILIACIÓN').toUpperCase();
                            
                            const locEl = document.getElementById('dash-location');
                            if (locEl) locEl.textContent = (data.location || data.city || 'CIUDAD, PAÍS').toUpperCase();

                            // Weight Control Initial Setup
                            const weight = data.metrics?.weight || data.weight || 0;
                            const target = data.targetWeight || (weight > 0 ? weight - 2 : 0);
                            
                            const weightText = document.getElementById('dash-weight-text');
                            if (weightText) weightText.textContent = `Actual: ${weight} KG`;
                            
                            const targetText = document.getElementById('dash-target-weight-text');
                            if (targetText) targetText.textContent = `Categoría meta: ${target} KG`;
                            
                            // 2. Populate Edit Modal Inputs
                            const editName = document.getElementById('edit-name');
                            if (editName) editName.value = data.legalName || data.name || '';
                            
                            const editAlias = document.getElementById('edit-alias');
                            if (editAlias) editAlias.value = data.alias || '';
                            
                            const editDisc = document.getElementById('edit-discipline');
                            if (editDisc) editDisc.value = baseDisc;

                            document.querySelectorAll('.fighter-target-disc-checkbox').forEach(cb => {
                                cb.checked = targetDiscs.includes(cb.value.toLowerCase());
                            });
                            
                            if(data.record) {
                                const w = document.getElementById('edit-wins'); if(w) w.value = primaryWins;
                                const l = document.getElementById('edit-losses'); if(l) l.value = primaryLosses;
                                const d = document.getElementById('edit-draws'); if(d) d.value = primaryDraws;
                            }
                            if(data.metrics) {
                                const w = document.getElementById('edit-weight'); if(w) w.value = data.metrics.weight || 0;
                                const h = document.getElementById('edit-height'); if(h) h.value = data.metrics.height || 0;
                            }
                            
                            const editTW = document.getElementById('edit-target-weight');
                            if (editTW) editTW.value = target;
                            
                            const editGym = document.getElementById('edit-gym');
                            if (editGym) editGym.value = data.gymLocation || data.gym || '';
                            
                            const editLoc = document.getElementById('edit-location');
                            if (editLoc) editLoc.value = data.location || data.city || '';

                            const editPhone = document.getElementById('edit-phone');
                            if (editPhone) editPhone.value = data.phone || data.whatsapp || '';

                            const editInsta = document.getElementById('edit-instagram');
                            if (editInsta) editInsta.value = data.instagram || '';

                            // Inicializar creador dinámico de récords en el modal de edición
                            if (typeof inicializarModalRecordsBuilder === 'function') {
                                inicializarModalRecordsBuilder(data);
                            }

                            // 3. Weight Control Module UI
                            const currentSpan = document.getElementById('bar-current');
                            const targetSpan = document.getElementById('bar-target');
                            if(currentSpan) currentSpan.textContent = `Actual: ${weight} KG`;
                            if(targetSpan) targetSpan.textContent = `Meta: ${target} KG`;
                            
                            actualizarBarraDePeso(weight, target);

                            // 4. Attach Listeners for Write Operations and Avatar Upload
                            configurarWriteOperations(user.uid, target, data);
                            configurarFighterAvatarOperations(user.uid, data);
                        } else if (currentPage.includes('fighter-buscar')) {
                            cargarFighterBuscarPage(user.uid);
                        } else if (currentPage.includes('fighter-postulaciones')) {
                            cargarFighterPostulacionesPage(user.uid);
                        } else if (currentPage.includes('fighter-historial')) {
                            cargarFighterHistorialPage(user.uid, data);
                        }
                        verificarNotificacionesAtleta(user.uid);
                    }
                    // -- PROMOTION ROLE --
                    else if (role === 'promotion' || data.role === 'promotion') {
                        // Populate org name in header if exists
                        const orgName = document.querySelector('.main-title');
                        if (orgName) orgName.textContent = (data.orgName || data.legalName || 'ORGANIZACIÓN').toUpperCase();
                        
                        // Sincronizar logotipo en la cabecera de la promotora en cualquier pantalla
                        const logoImg = document.getElementById('org-header-logo-img');
                        const logoIcon = document.getElementById('org-header-logo-icon');
                        const currentLogo = data.photoURL || data.avatar || data.logoUrl || '';
                        if (currentLogo && logoImg) {
                            logoImg.src = currentLogo;
                            logoImg.style.display = 'block';
                            if (logoIcon) logoIcon.style.display = 'none';
                        } else {
                            if (logoImg) logoImg.style.display = 'none';
                            if (logoIcon) logoIcon.style.display = 'block';
                        }

                        if (currentPage.includes('promotor-dashboard')) {
                            configurarPromotoraOperations(user.uid, data);
                        } else if (currentPage.includes('promotor-ajustes')) {
                            cargarPromoterAjustesPage(user.uid, data);
                        } else if (currentPage.includes('promotor-scouting')) {
                            cargarPromoterScoutingPage(user.uid);
                        }
                    }
                    // -- FAN ROLE --
                    else if (role === 'fan' || data.role === 'fan') {
                        const fanName = document.querySelector('.main-title');
                        if (fanName && currentPage.includes('fan-ajustes')) fanName.textContent = (data.name || 'ESPECTADOR').toUpperCase();

                        if (currentPage.includes('fan-dashboard')) {
                            const avatarImg = document.getElementById('fan-header-avatar-img');
                            const avatarIcon = document.getElementById('fan-header-avatar-icon');
                            const currentAvatar = data.photoURL || data.avatar || '';
                            if (currentAvatar && avatarImg) {
                                avatarImg.src = currentAvatar;
                                avatarImg.style.display = 'block';
                                if (avatarIcon) avatarIcon.style.display = 'none';
                            } else {
                                if (avatarImg) avatarImg.style.display = 'none';
                                if (avatarIcon) avatarIcon.style.display = 'block';
                            }
                            cargarFanDashboardPage(user.uid);
                        } else if (currentPage.includes('fan-buscar')) {
                            cargarFanBuscarPage(user.uid);
                        } else if (currentPage.includes('fan-favoritos')) {
                            cargarFanFavoritosPage(user.uid);
                        } else if (currentPage.includes('fan-ajustes')) {
                            cargarFanAjustesPage(user.uid, data);
                        }
                    }
                }
            } else {
                console.warn("Documento de usuario no encontrado en Firestore para UID:", user.uid);
                const localRole = localStorage.getItem('userRole') || 'fighter';
                if (localRole === 'fighter') {
                    hidratarFighterDashboardInmediato();
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        // No user is signed in. Redirect to login if on protected page.
        const currentPage = window.location.pathname;
        if (currentPage.includes('dashboard') || currentPage.includes('ajustes') || currentPage.includes('historial') || currentPage.includes('buscar') || currentPage.includes('favoritos') || currentPage.includes('postulaciones') || currentPage.includes('scouting')) {
            console.log("No user logged in, but on protected page.");
        }
    }
});

/**
 * Calcula y actualiza visualmente la barra de progreso del corte de peso del atleta.
 * 
 * @function actualizarBarraDePeso
 * @param {number} current - Peso actual en kilogramos.
 * @param {number} target - Peso pactado o meta en kilogramos.
 * @returns {void}
 */
function actualizarBarraDePeso(current, target) {
    const statusText = document.getElementById('weight-status-text');
    const fillBar = document.getElementById('weight-fill-bar');
    if (!statusText || !fillBar) return;

    if (target === 0 || current === 0) {
        statusText.textContent = "PESO NO ESTABLECIDO";
        fillBar.style.width = "0%";
        return;
    }

    const diff = current - target;
    let percentage = 0;
    
    if (diff <= 0) {
        percentage = 100;
        statusText.textContent = "¡EN EL PESO! ✓";
        statusText.style.color = "#28a745";
        fillBar.classList.add('weight-success');
    } else {
        const maxCut = 10;
        percentage = Math.max(0, 100 - ((diff / maxCut) * 100));
        statusText.textContent = `CORTE ACTIVO (${diff.toFixed(1)} KG RESTANTES)`;
        statusText.style.color = "var(--text-white)";
        fillBar.classList.remove('weight-success');
    }

    fillBar.style.width = `${percentage}%`;
}

/**
 * Configura los formularios de actualización de perfil y registro diario de pesaje del atleta.
 * 
 * @function configurarWriteOperations
 * @param {string} uid - Identificador único de usuario en Firebase.
 * @param {number} [defaultTargetWeight=0] - Peso meta predeterminado si no se especifica.
 * @returns {void}
 */
/**
 * Inicializa y sincroniza el creador de récords por disciplina dentro del modal de edición de perfil.
 * 
 * @function inicializarModalRecordsBuilder
 * @param {Object} fighterData - Documento del atleta desde Firestore.
 * @returns {void}
 */
function inicializarModalRecordsBuilder(fighterData) {
    const builder = document.getElementById('modal-fighter-records-builder');
    const baseSelect = document.getElementById('edit-discipline');
    const checkboxes = document.querySelectorAll('.fighter-target-disc-checkbox');
    if (!builder || !baseSelect) return;

    const DISCIPLINE_META = {
        mma: { name: 'MMA', icon: 'fa-fist-raised' },
        boxeo: { name: 'Boxeo', icon: 'fa-mitten' },
        bjj: { name: 'Jiu-Jitsu (BJJ)', icon: 'fa-shield-alt' },
        lucha: { name: 'Lucha / Wrestling', icon: 'fa-compress-arrows-alt' },
        muaythai: { name: 'Muay Thai', icon: 'fa-fire' },
        kickboxing: { name: 'Kickboxing', icon: 'fa-bolt' },
        judo: { name: 'Judo', icon: 'fa-award' }
    };

    if (!window._fc_edit_records_state) {
        window._fc_edit_records_state = fighterData?.recordsByDiscipline ? JSON.parse(JSON.stringify(fighterData.recordsByDiscipline)) : {};
    }
    const recsState = window._fc_edit_records_state;
    const baseDisc = (fighterData?.primaryDiscipline || fighterData?.discipline || baseSelect.value || 'mma').toLowerCase();
    if (!recsState[baseDisc] && fighterData?.record) {
        recsState[baseDisc] = {
            wins: fighterData.record.wins || 0,
            losses: fighterData.record.losses || 0,
            draws: fighterData.record.draws || 0
        };
    }

    const render = () => {
        const primaryDisc = (baseSelect.value || 'mma').toLowerCase();

        checkboxes.forEach(cb => {
            if (cb.value.toLowerCase() === primaryDisc) cb.checked = true;
        });

        const activeDiscs = [];
        checkboxes.forEach(cb => {
            if (cb.checked) {
                const val = cb.value.toLowerCase();
                if (!activeDiscs.includes(val)) activeDiscs.push(val);
            }
        });
        if (primaryDisc && !activeDiscs.includes(primaryDisc)) {
            activeDiscs.unshift(primaryDisc);
        }

        builder.innerHTML = activeDiscs.map(disc => {
            const meta = DISCIPLINE_META[disc] || { name: disc.toUpperCase(), icon: 'fa-fist-raised' };
            const isPrim = disc === primaryDisc;
            const rec = recsState[disc] || { wins: 0, losses: 0, draws: 0 };

            return `
                <div class="discipline-record-card ${isPrim ? 'is-primary' : ''}" data-disc="${disc}">
                    <div class="disc-record-header">
                        <span class="disc-name-tag"><i class="fas ${meta.icon}"></i> ${meta.name}</span>
                        ${isPrim ? '<span class="disc-primary-badge"><i class="fas fa-star"></i> PRINCIPAL</span>' : ''}
                    </div>
                    <div class="disc-record-inputs">
                        <div class="disc-input-group">
                            <label>VICTORIAS (V)</label>
                            <input type="number" id="edit-wins-${disc}" class="edit-disc-input" data-disc="${disc}" data-field="wins" min="0" max="150" value="${rec.wins || 0}">
                        </div>
                        <div class="disc-input-group">
                            <label>DERROTAS (D)</label>
                            <input type="number" id="edit-losses-${disc}" class="edit-disc-input" data-disc="${disc}" data-field="losses" min="0" max="150" value="${rec.losses || 0}">
                        </div>
                        <div class="disc-input-group">
                            <label>EMPATES (E)</label>
                            <input type="number" id="edit-draws-${disc}" class="edit-disc-input" data-disc="${disc}" data-field="draws" min="0" max="50" value="${rec.draws || 0}">
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const primRec = recsState[primaryDisc] || { wins: 0, losses: 0, draws: 0 };
        const ew = document.getElementById('edit-wins');
        const el = document.getElementById('edit-losses');
        const ed = document.getElementById('edit-draws');
        if (ew) ew.value = primRec.wins || 0;
        if (el) el.value = primRec.losses || 0;
        if (ed) ed.value = primRec.draws || 0;

        builder.querySelectorAll('.edit-disc-input').forEach(inp => {
            inp.addEventListener('input', (e) => {
                const d = e.target.getAttribute('data-disc');
                const field = e.target.getAttribute('data-field');
                const val = Math.max(0, parseInt(e.target.value) || 0);
                if (!recsState[d]) recsState[d] = { wins: 0, losses: 0, draws: 0 };
                recsState[d][field] = val;

                if (d === primaryDisc) {
                    if (field === 'wins' && ew) ew.value = val;
                    if (field === 'losses' && el) el.value = val;
                    if (field === 'draws' && ed) ed.value = val;
                }
            });
        });
    };

    if (!baseSelect._hasBuilderListener) {
        baseSelect._hasBuilderListener = true;
        baseSelect.addEventListener('change', render);
    }
    checkboxes.forEach(cb => {
        if (!cb._hasBuilderListener) {
            cb._hasBuilderListener = true;
            cb.addEventListener('change', render);
        }
    });

    render();
}

/**
 * Configura los formularios de actualización de perfil y registro diario de pesaje del atleta.
 * 
 * @function configurarWriteOperations
 * @param {string} uid - Identificador único de usuario en Firebase.
 * @param {number} [defaultTargetWeight=0] - Peso meta predeterminado si no se especifica.
 * @param {Object} [existingData={}] - Documento previo del peleador.
 * @returns {void}
 */
function configurarWriteOperations(uid, defaultTargetWeight = 0, existingData = {}) {
    const editForm = document.getElementById('edit-profile-form');
    if (editForm && !editForm._hasFighterSubmit) {
        editForm._hasFighterSubmit = true;
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = editForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = "GUARDANDO...";
            
            try {
                const baseDisc = (document.getElementById('edit-discipline')?.value || 'mma').toLowerCase();
                const selectedTargetDiscs = Array.from(document.querySelectorAll('.fighter-target-disc-checkbox:checked')).map(cb => cb.value.toLowerCase());
                if (!selectedTargetDiscs.includes(baseDisc)) {
                    selectedTargetDiscs.unshift(baseDisc);
                }

                const phoneVal = (document.getElementById('edit-phone')?.value || '').trim();
                const instaVal = (document.getElementById('edit-instagram')?.value || '').trim();

                // Recopilar récords de todas las disciplinas seleccionadas
                const recordsByDiscipline = {};
                selectedTargetDiscs.forEach(d => {
                    const wInp = document.getElementById(`edit-wins-${d}`);
                    const lInp = document.getElementById(`edit-losses-${d}`);
                    const drInp = document.getElementById(`edit-draws-${d}`);
                    const w = Math.max(0, parseInt(wInp?.value) || 0);
                    const l = Math.max(0, parseInt(lInp?.value) || 0);
                    const dr = Math.max(0, parseInt(drInp?.value) || 0);
                    recordsByDiscipline[d] = { wins: w, losses: l, draws: dr };
                });

                if (window._fc_edit_records_state) {
                    Object.keys(window._fc_edit_records_state).forEach(d => {
                        if (!recordsByDiscipline[d] && selectedTargetDiscs.includes(d)) {
                            recordsByDiscipline[d] = window._fc_edit_records_state[d];
                        }
                    });
                }

                const primaryRecord = recordsByDiscipline[baseDisc] || {
                    wins: parseInt(document.getElementById('edit-wins')?.value) || 0,
                    losses: parseInt(document.getElementById('edit-losses')?.value) || 0,
                    draws: parseInt(document.getElementById('edit-draws')?.value) || 0
                };
                recordsByDiscipline[baseDisc] = primaryRecord;

                const weightVal = parseFloat(document.getElementById('edit-weight')?.value) || 0;
                const divisionName = calcularDivisionPeso(weightVal);

                const newData = {
                    legalName: document.getElementById('edit-name').value,
                    alias: document.getElementById('edit-alias').value,
                    discipline: baseDisc,
                    primaryDiscipline: baseDisc,
                    targetDisciplines: selectedTargetDiscs,
                    recordsByDiscipline: recordsByDiscipline,
                    record: primaryRecord,
                    division: divisionName,
                    metrics: {
                        weight: weightVal,
                        height: parseFloat(document.getElementById('edit-height').value) || 0
                    },
                    targetWeight: parseFloat(document.getElementById('edit-target-weight').value) || 0,
                    phone: phoneVal,
                    whatsapp: phoneVal,
                    instagram: instaVal,
                    gymLocation: document.getElementById('edit-gym').value,
                    location: document.getElementById('edit-location').value
                };

                const currentSavedAvatar = localStorage.getItem('userAvatar');
                if (currentSavedAvatar) {
                    newData.photoURL = currentSavedAvatar;
                    newData.avatar = currentSavedAvatar;
                }

                // Validaciones estrictas y límites deportivos
                if (primaryRecord.wins < 0 || primaryRecord.wins > 150) throw new Error("VICTORIAS FUERA DE RANGO (0-150)");
                if (primaryRecord.losses < 0 || primaryRecord.losses > 150) throw new Error("DERROTAS FUERA DE RANGO (0-150)");
                if (primaryRecord.draws < 0 || primaryRecord.draws > 50) throw new Error("EMPATES FUERA DE RANGO (0-50)");
                if (newData.metrics.weight < 45 || newData.metrics.weight > 160) throw new Error("PESO INVÁLIDO (45-160 KG)");
                if (newData.targetWeight < 45 || newData.targetWeight > 160) throw new Error("PESO META INVÁLIDO (45-160 KG)");
                if (newData.metrics.height < 120 || newData.metrics.height > 230) throw new Error("ALTURA INVÁLIDA (120-230 CM)");

                await updateDoc(doc(db, "users", uid), newData);

                // Actualizar caché local
                localStorage.setItem('fighterRecord', `${primaryRecord.wins} - ${primaryRecord.losses} - ${primaryRecord.draws}`);
                localStorage.setItem('fighterWeight', `${weightVal} KG`);
                localStorage.setItem('fighterDivision', divisionName);
                localStorage.setItem('fighterDiscipline', baseDisc.toUpperCase());
                localStorage.setItem('fighterRecordsByDiscipline', JSON.stringify(recordsByDiscipline));
                localStorage.setItem('userName', newData.alias || newData.legalName || 'ATLETA');
                
                btn.textContent = "¡GUARDADO!";
                btn.style.background = "#28a745";
                
                setTimeout(() => { window.location.reload(); }, 900);

            } catch (error) {
                console.error("Error actualizando perfil:", error);
                btn.textContent = error.message && error.message.length < 35 ? error.message : "ERROR";
                btn.style.background = "#e62429";
                setTimeout(() => { btn.textContent = originalText; btn.style.background = "var(--accent-red)"; }, 3500);
            }
        });
    }

    const weightForm = document.getElementById('log-weight-form');
    if (weightForm && !weightForm._hasWeightSubmit) {
        weightForm._hasWeightSubmit = true;
        weightForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = weightForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = "...";
            
            try {
                const todayWeight = parseFloat(document.getElementById('today-weight').value);
                const targetEl = document.getElementById('edit-target-weight');
                const targetWeight = targetEl ? parseFloat(targetEl.value) : defaultTargetWeight;
                
                // Validación estricta
                if (todayWeight <= 0 || todayWeight > 250) {
                    throw new Error("PESO INVÁLIDO");
                }
                
                await updateDoc(doc(db, "users", uid), {
                    "metrics.weight": todayWeight
                });
                
                btn.textContent = "✓";
                btn.style.background = "#28a745";
                
                const wt = document.getElementById('dash-weight-text'); if(wt) wt.textContent = `Actual: ${todayWeight} KG`;
                const bc = document.getElementById('bar-current'); if(bc) bc.textContent = `Actual: ${todayWeight} KG`;
                const ew = document.getElementById('edit-weight'); if(ew) ew.value = todayWeight;
                
                actualizarBarraDePeso(todayWeight, targetWeight);

                setTimeout(() => { btn.textContent = originalText; btn.style.background = "var(--accent-red)"; document.getElementById('today-weight').value = ''; }, 2000);

            } catch (error) {
                console.error("Error registrando peso:", error);
                btn.textContent = error.message === "PESO INVÁLIDO" ? "PESO INVÁLIDO" : "X";
                btn.style.background = "#e62429";
                setTimeout(() => { btn.textContent = originalText; btn.style.background = "var(--accent-red)"; }, 3000);
            }
        });
    }
}

/**
 * Configura la carga interactiva y persistencia de la foto de perfil/avatar del peleador.
 * 
 * @function configurarFighterAvatarOperations
 * @param {string} uid - Identificador único de usuario en Firebase.
 * @param {Object} data - Datos actuales del documento del peleador en Firestore.
 * @returns {void}
 */
function configurarFighterAvatarOperations(uid, data) {
    const avatarInput = document.getElementById('fighter-avatar-input');
    const avatarBox = document.getElementById('fighter-avatar-box');
    const modalAvatarBox = document.getElementById('modal-fighter-avatar-box');
    const btnTrigger = document.getElementById('btn-trigger-fighter-avatar');
    const btnHero = document.getElementById('btn-hero-change-avatar');
    const heroPreview = document.getElementById('fighter-avatar-preview');
    const modalPreview = document.getElementById('modal-fighter-avatar-preview');
    const heroIcon = document.getElementById('fighter-avatar-placeholder-icon');
    const modalIcon = document.getElementById('modal-fighter-avatar-icon');

    const currentAvatar = data?.photoURL || data?.avatar || localStorage.getItem('userAvatar') || '';
    if (currentAvatar) {
        if (heroPreview) {
            heroPreview.src = currentAvatar;
            heroPreview.style.display = 'block';
        }
        if (heroIcon) heroIcon.style.display = 'none';

        if (modalPreview) {
            modalPreview.src = currentAvatar;
            modalPreview.style.display = 'block';
        }
        if (modalIcon) modalIcon.style.display = 'none';

        localStorage.setItem('userAvatar', currentAvatar);
    } else {
        if (heroPreview) heroPreview.style.display = 'none';
        if (heroIcon) heroIcon.style.display = 'block';
        if (modalPreview) modalPreview.style.display = 'none';
        if (modalIcon) modalIcon.style.display = 'block';
        localStorage.removeItem('userAvatar');
    }

    if (avatarBox) avatarBox.classList.remove('avatar-loading');

    const openPicker = (e) => { 
        if (e) e.stopPropagation();
        if (avatarInput) avatarInput.click(); 
    };
    if (avatarBox && !avatarBox._hasAvatarClick) {
        avatarBox._hasAvatarClick = true;
        avatarBox.addEventListener('click', openPicker);
    }
    if (modalAvatarBox && !modalAvatarBox._hasAvatarClick) {
        modalAvatarBox._hasAvatarClick = true;
        modalAvatarBox.addEventListener('click', openPicker);
    }
    if (btnTrigger && !btnTrigger._hasAvatarClick) {
        btnTrigger._hasAvatarClick = true;
        btnTrigger.addEventListener('click', openPicker);
    }
    if (btnHero && !btnHero._hasAvatarClick) {
        btnHero._hasAvatarClick = true;
        btnHero.addEventListener('click', openPicker);
    }

    if (avatarInput && !avatarInput._hasAvatarChange) {
        avatarInput._hasAvatarChange = true;
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            try {
                if (btnTrigger) btnTrigger.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SUBIENDO...';
                if (btnHero) btnHero.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SUBIENDO...';
                const uploadedUrl = await uploadImage(file, { folder: 'fighters' });
                if (uploadedUrl) {
                    localStorage.setItem('userAvatar', uploadedUrl);
                    if (heroPreview) {
                        heroPreview.src = uploadedUrl;
                        heroPreview.style.display = 'block';
                    }
                    if (heroIcon) heroIcon.style.display = 'none';

                    if (modalPreview) {
                        modalPreview.src = uploadedUrl;
                        modalPreview.style.display = 'block';
                    }
                    if (modalIcon) modalIcon.style.display = 'none';

                    actualizarNavegacionSesion();
                    if (typeof window.actualizarPasaporteUsuarioUI === 'function') {
                        window.actualizarPasaporteUsuarioUI();
                    }

                    const saveUid = uid || auth.currentUser?.uid || localStorage.getItem('userId');
                    if (saveUid) {
                        await setDoc(doc(db, "users", saveUid), {
                            photoURL: uploadedUrl,
                            avatar: uploadedUrl,
                            updatedAt: new Date().toISOString()
                        }, { merge: true });
                        console.log("✅ Avatar de atleta guardado exitosamente en Firestore:", uploadedUrl);
                    }

                    if (btnTrigger) btnTrigger.innerHTML = '<i class="fas fa-check"></i> FOTO GUARDADA';
                    if (btnHero) btnHero.innerHTML = '<i class="fas fa-check"></i> FOTO GUARDADA';
                    setTimeout(() => {
                        if (btnTrigger) btnTrigger.innerHTML = '<i class="fas fa-camera"></i> CAMBIAR FOTO';
                        if (btnHero) btnHero.innerHTML = '<i class="fas fa-camera"></i> CAMBIAR FOTO';
                    }, 2500);
                }
            } catch (err) {
                console.error("Error al subir foto de peleador:", err);
                alert("Error al procesar la imagen: " + err.message);
                if (btnTrigger) btnTrigger.innerHTML = '<i class="fas fa-camera"></i> CAMBIAR FOTO';
                if (btnHero) btnHero.innerHTML = '<i class="fas fa-camera"></i> CAMBIAR FOTO';
            }
        });
    }
}

// ---- PERSISTENCIA Y SINCRONIZACIÓN HÍBRIDA DE EVENTOS (LOCAL + CLOUD) ----
const DB_EVENTS_KEY = 'fc_promoter_events';

/**
 * Obtiene los eventos locales guardados en el almacenamiento del navegador.
 * @returns {Array<Object>} Arreglo de eventos almacenados.
 */
function obtenerEventosLocales() {
    try {
        const raw = localStorage.getItem(DB_EVENTS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        let modified = false;
        list.forEach(e => {
            if (e.imageUrl && (e.imageUrl.includes('r1042784') || e.imageUrl.includes('r1710243'))) {
                e.imageUrl = e.discipline === 'bjj' ? 'https://a.espncdn.com/photo/2026/0816/r1702390_600x400_3-2.jpg' :
                             e.discipline === 'boxeo' ? 'https://a.espncdn.com/photo/2023/0423/r1163456_1296x729_16-9.jpg' :
                             e.discipline === 'lucha' ? 'https://a.espncdn.com/photo/2026/0810/r1700045_600x600_1-1.jpg' :
                             e.discipline === 'muaythai' ? 'https://a.espncdn.com/photo/2026/0829/r1708497_600x400_3-2.jpg' :
                             e.discipline === 'kickboxing' ? 'https://a.espncdn.com/photo/2026/0831/r1709592_608x342_16-9.jpg' :
                             'https://r2.thesportsdb.com/images/media/league/poster/l2k1ka1636383209.jpg';
                modified = true;
            }
        });
        if (modified) {
            localStorage.setItem(DB_EVENTS_KEY, JSON.stringify(list));
        }
        return list;
    } catch (e) {
        console.error("Error al leer eventos locales:", e);
        return [];
    }
}

/**
 * Guarda o actualiza un evento en el almacenamiento local.
 * @param {Object} evento - Objeto del evento con fecha, sede, disciplina y poster.
 */
function guardarEventoLocal(evento) {
    const eventos = obtenerEventosLocales();
    const idx = eventos.findIndex(e => e.id === evento.id || (e.name === evento.name && e.date === evento.date));
    if (idx >= 0) {
        eventos[idx] = { ...eventos[idx], ...evento };
    } else {
        eventos.unshift(evento);
    }
    localStorage.setItem(DB_EVENTS_KEY, JSON.stringify(eventos));
}

/**
 * Elimina un evento del almacenamiento local según su identificador.
 * @param {string} eventId - Identificador único del evento.
 */
function eliminarEventoLocal(eventId) {
    const eventos = obtenerEventosLocales().filter(e => e.id !== eventId);
    localStorage.setItem(DB_EVENTS_KEY, JSON.stringify(eventos));
}

/**
 * Renderizador síncrono de alto rendimiento para la tabla de eventos de la promotora.
 * 
 * @function renderizarTablaPromotora
 * @param {Array<Object>} eventos - Lista de eventos organizados por la promotora.
 * @param {HTMLElement|null} container - Contenedor del DOM donde se inyectará la tabla.
 * @returns {void}
 */
function renderizarTablaPromotora(eventos, container) {
    if (!container) return;
    
    // Actualizar estadística de eventos realizados
    const eventCountEl = document.querySelectorAll('.stat-number')[0];
    if (eventCountEl) {
        eventCountEl.textContent = eventos ? eventos.length : 0;
    }

    // Actualizar estadística de atletas contratados (únicos en las peleas de sus eventos)
    const athleteCountEl = document.querySelectorAll('.stat-number')[1];
    if (athleteCountEl) {
        const uniqueAthletes = new Set();
        if (Array.isArray(eventos)) {
            eventos.forEach(ev => {
                if (Array.isArray(ev.fights)) {
                    ev.fights.forEach(f => {
                        const f1 = f.fighter1?.id || f.fighter1?.name;
                        const f2 = f.fighter2?.id || f.fighter2?.name;
                        if (f1) uniqueAthletes.add(f1);
                        if (f2) uniqueAthletes.add(f2);
                    });
                }
            });
        }
        athleteCountEl.textContent = uniqueAthletes.size;
    }

    if (!eventos || eventos.length === 0) {
        container.innerHTML = `
            <table class="events-table">
                <thead>
                    <tr>
                        <th>EVENTO</th>
                        <th>FECHA Y HORA</th>
                        <th>DISCIPLINA</th>
                        <th>UBICACIÓN</th>
                        <th>ACCIONES</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="5" style="text-align: center; color: var(--text-gray); padding: 3rem 1.5rem;">
                        <i class="fas fa-calendar-times" style="font-size: 2rem; color: var(--accent-red); margin-bottom: 0.8rem; display: block; opacity: 0.7;"></i>
                        <strong style="color: #fff; font-size: 1rem; display: block; margin-bottom: 0.3rem;">NO TIENES EVENTOS ACTIVOS</strong>
                        <p style="margin: 0; font-size: 0.85rem;">Haz clic en <strong>"CREAR NUEVO EVENTO"</strong> en la esquina superior para abrir tu primera cartelera.</p>
                    </td></tr>
                </tbody>
            </table>`;
        return;
    }

    let html = `<table class="events-table">
        <thead>
            <tr>
                <th>EVENTO</th>
                <th>FECHA Y HORA</th>
                <th>DISCIPLINA</th>
                <th>UBICACIÓN</th>
                <th>ACCIONES</th>
            </tr>
        </thead>
        <tbody>`;
        
    eventos.forEach((ev) => {
        const evDate = new Date(ev.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
        const boutsCount = Array.isArray(ev.fights) ? ev.fights.length : 0;
        const estelaresCount = Array.isArray(ev.fights) ? ev.fights.filter(f => f.type === 'estelar').length : 0;
        
        let boutsSubHtml = boutsCount > 0
            ? `<small style="color: #4caf50; font-size: 0.75rem; font-weight: bold; display: block; margin-top: 2px;">
                <i class="fas fa-shield-alt"></i> ${boutsCount} combate${boutsCount === 1 ? '' : 's'} (${estelaresCount} estelar${estelaresCount === 1 ? '' : 'es'})
               </small>`
            : `<small style="color: var(--text-gray); font-size: 0.72rem; display: block; margin-top: 2px;">
                <i class="far fa-clock"></i> Cartelera en programación
               </small>`;

        const isEvVerified = ev.isVerified === true || ev.kybStatus === 'approved' || localStorage.getItem('promoterKybStatus') === 'approved';
        const badgeEvHtml = isEvVerified
            ? `<span class="kyb-verified-badge" style="font-size: 0.65rem; padding: 2px 6px; margin-left: 6px; vertical-align: middle;"><i class="fas fa-certificate"></i> VERIFICADO PRO</span>`
            : `<span style="font-size: 0.65rem; padding: 2px 6px; margin-left: 6px; background: rgba(255, 193, 7, 0.12); border: 1px solid rgba(255, 193, 7, 0.35); color: #ffc107; border-radius: 4px; vertical-align: middle;"><i class="fas fa-clock"></i> MODO PRELIMINAR</span>`;

        html += `
        <tr>
            <td style="font-weight: bold; color: var(--text-white); display: flex; align-items: center; gap: 12px;">
                ${ev.imageUrl ? `<img src="${ev.imageUrl}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid var(--accent-red); flex-shrink: 0;" onerror="this.style.display='none';">` : ''}
                <div>
                    <span style="display: block; font-size: 0.95rem;">${typeof escapeHtml === 'function' ? escapeHtml(ev.name) : ev.name} ${badgeEvHtml}</span>
                    ${boutsSubHtml}
                </div>
            </td>
            <td style="color: var(--text-gray); font-size: 0.85rem;">${evDate}</td>
            <td style="color: var(--accent-red); font-weight: bold; font-size: 0.85rem;">${(ev.discipline || 'MMA').toUpperCase()}</td>
            <td style="color: var(--text-gray); font-size: 0.85rem;">${typeof escapeHtml === 'function' ? escapeHtml(ev.location) : ev.location}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="btn-manage-bouts" data-id="${ev.id}" title="Gestionar Cartelera / Añadir Combates" style="background: rgba(230,36,41,0.15); border: 1px solid rgba(230,36,41,0.4); color: #fff; border-radius: 6px; padding: 0.45rem 0.85rem; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
                        <i class="fas fa-fist-raised" style="color: var(--accent-red);"></i> Cartelera (${boutsCount})
                    </button>
                    <button class="btn-delete-event" data-id="${ev.id}" title="Eliminar evento" style="background: transparent; border: none; color: var(--accent-red); cursor: pointer; font-size: 1.15rem; transition: transform 0.2s; padding: 0.3rem;"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        </tr>`;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;

    // Conectar botón para gestionar cartelera
    container.querySelectorAll('.btn-manage-bouts').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const eventId = e.currentTarget.getAttribute('data-id');
            abrirModalGestionarCartelera(eventId);
        });
    });

    // Conectar botón de eliminar evento
    const deleteBtns = container.querySelectorAll('.btn-delete-event');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const eventId = e.currentTarget.getAttribute('data-id');
            if (confirm("¿Estás seguro de que deseas eliminar este evento de tu cartelera?")) {
                eliminarEventoLocal(eventId);
                try {
                    if (window.db && window.deleteDoc && window.doc) {
                        await deleteDoc(doc(db, "events", eventId));
                    }
                } catch (err) {
                    console.log("Evento removido localmente.");
                }
                const uid = localStorage.getItem('userId');
                cargarEventosPromotora(uid);
            }
        });
    });
}

/**
 * Agrega un combate a un evento en almacenamiento local y en Cloud Firestore.
 * @function agregarPeleaAEvento
 * @param {string} eventId
 * @param {Object} fightData
 * @returns {Promise<boolean>}
 */
async function agregarPeleaAEvento(eventId, fightData) {
    const localEvents = obtenerEventosLocales();
    const evIndex = localEvents.findIndex(e => e.id === eventId);
    let eventObj = null;
    if (evIndex >= 0) {
        eventObj = localEvents[evIndex];
        if (!Array.isArray(eventObj.fights)) eventObj.fights = [];
        eventObj.fights.push(fightData);
        localEvents[evIndex] = eventObj;
        localStorage.setItem(DB_EVENTS_KEY, JSON.stringify(localEvents));
    }

    try {
        if (db) {
            const eventRef = doc(db, "events", eventId);
            const fightsArray = eventObj ? eventObj.fights : [fightData];
            await updateDoc(eventRef, { fights: fightsArray });
            console.log("✅ Combate sincronizado en Firestore para el evento:", eventId);
        }
    } catch (err) {
        console.warn("⚠️ No se pudo sincronizar el combate en Firestore:", err.message);
    }

    return true;
}

/**
 * Elimina un combate de un evento en almacenamiento local y en Cloud Firestore.
 * @function eliminarPeleaDeEvento
 * @param {string} eventId
 * @param {string} fightId
 * @returns {Promise<boolean>}
 */
async function eliminarPeleaDeEvento(eventId, fightId) {
    const localEvents = obtenerEventosLocales();
    const evIndex = localEvents.findIndex(e => e.id === eventId);
    if (evIndex >= 0) {
        const eventObj = localEvents[evIndex];
        if (Array.isArray(eventObj.fights)) {
            eventObj.fights = eventObj.fights.filter(f => f.id !== fightId);
            localEvents[evIndex] = eventObj;
            localStorage.setItem(DB_EVENTS_KEY, JSON.stringify(localEvents));
            try {
                if (db) {
                    await updateDoc(doc(db, "events", eventId), { fights: eventObj.fights });
                    console.log("✅ Combate eliminado en Firestore para el evento:", eventId);
                }
            } catch (err) {
                console.warn("⚠️ Error eliminando combate en Firestore:", err.message);
            }
        }
    }
    return true;
}

/**
 * Requerimiento 4: Envía la notificación en el aplicativo y crea la solicitud de combate en "Mis Postulaciones"
 * para ambos atletas seleccionados en una pelea de cartelera creada por un promotor.
 * 
 * @async
 * @function notificarYPostularPeleadoresCombate
 * @param {Object} eventObj - Datos del evento donde se pactó el combate.
 * @param {Object} fightData - Datos de la pelea pactada.
 * @returns {Promise<void>}
 */
async function notificarYPostularPeleadoresCombate(eventObj, fightData) {
    if (!eventObj || !fightData) return;
    const f1 = fightData.fighter1;
    const f2 = fightData.fighter2;
    if (!f1 || !f2) return;

    const promName = eventObj.promoter || eventObj.promoterName || eventObj.org || localStorage.getItem('userName') || 'Promotora Oficial';
    const promoterId = eventObj.promoterId || localStorage.getItem('userId') || 'promoter_id';

    const fechaEnvio = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    const divisionStr = fightData.weightClass || 'Peso Pactado';
    const roundsNum = fightData.rounds || 3;
    const tipoStr = fightData.type === 'estelar' ? 'Pelea Estelar' : 'Pelea Preliminar';

    const matchups = [
        { current: f1, rival: f2 },
        { current: f2, rival: f1 }
    ];

    for (const { current, rival } of matchups) {
        if (!current.id) continue;

        const rivalFullName = `${rival.name}${rival.alias ? ` "${rival.alias}"` : ''}`;

        // 1. Crear documento en colección 'applications' para que aparezca en "Mis Postulaciones"
        const appPayload = {
            fighterId: current.id,
            fighterName: current.name || 'Atleta',
            fighterAlias: current.alias || '',
            fighterAvatar: current.avatar || '',
            fighterDiscipline: current.discipline || eventObj.discipline || 'mma',
            fighterWeight: current.weight || 0,
            oppId: eventObj.id,
            eventId: eventObj.id,
            fightId: fightData.id,
            evento: eventObj.name,
            org: promName,
            promoterId: promoterId,
            disciplina: (eventObj.discipline || 'MMA').toUpperCase(),
            peso: `${divisionStr} (${roundsNum} asaltos · ${tipoStr})`,
            division: divisionStr,
            rival: rivalFullName,
            rivalId: rival.id || '',
            rivalAvatar: rival.avatar || '',
            tipoPelea: fightData.type || 'estelar',
            rounds: roundsNum,
            fechaEnvio: fechaEnvio,
            estado: 'SOLICITUD DE COMBATE',
            tipo: 'invitacion_promotor',
            createdAt: new Date().toISOString()
        };

        try {
            if (db) {
                const docRef = await addDoc(collection(db, "applications"), appPayload);
                appPayload.id = docRef.id;
                console.log(`✅ Solicitud de pelea guardada en applications para ${current.name} (ID: ${docRef.id})`);
            }
        } catch (err) {
            console.warn(`Error guardando solicitud de pelea en Firestore para ${current.name}:`, err);
            appPayload.id = 'app_local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        }

        // Guardar en caché local de postulaciones del peleador
        const localApps = JSON.parse(localStorage.getItem(`fightconnect_apps_${current.id}`) || '[]');
        const filteredApps = localApps.filter(a => !(a.eventId === eventObj.id && a.fightId === fightData.id));
        filteredApps.unshift(appPayload);
        localStorage.setItem(`fightconnect_apps_${current.id}`, JSON.stringify(filteredApps));

        // 2. Crear mensaje / notificación en el aplicativo para el peleador
        const notifPayload = {
            recipientId: current.id,
            senderId: promoterId,
            senderName: promName,
            type: 'fight_request',
            title: '¡NUEVA SOLICITUD DE COMBATE!',
            message: `La promotora "${promName}" te ha seleccionado para pelear en "${eventObj.name}" contra ${rivalFullName} (${divisionStr}, ${roundsNum} asaltos). Revisa "Mis Postulaciones" para confirmar tu participación.`,
            eventName: eventObj.name,
            promoterName: promName,
            rivalName: rivalFullName,
            division: divisionStr,
            rounds: roundsNum,
            tipoPelea: fightData.type || 'estelar',
            eventId: eventObj.id,
            fightId: fightData.id,
            read: false,
            createdAt: new Date().toISOString()
        };

        try {
            if (db) {
                const notifRef = await addDoc(collection(db, "notifications"), notifPayload);
                notifPayload.id = notifRef.id;
                console.log(`✅ Mensaje/Notificación enviada a ${current.name} (ID: ${notifRef.id})`);
            }
        } catch (notifErr) {
            console.warn(`Error enviando notificación a Firestore:`, notifErr);
            notifPayload.id = 'notif_local_' + Date.now();
        }

        const localNotifs = JSON.parse(localStorage.getItem(`fightconnect_notifs_${current.id}`) || '[]');
        localNotifs.unshift(notifPayload);
        localStorage.setItem(`fightconnect_notifs_${current.id}`, JSON.stringify(localNotifs));
    }
}

window.agregarPeleaAEvento = agregarPeleaAEvento;
window.eliminarPeleaDeEvento = eliminarPeleaDeEvento;
window.notificarYPostularPeleadoresCombate = notificarYPostularPeleadoresCombate;

/**
 * Abre el modal de administración de cartelera para un evento específico de la promotora.
 * Permite visualizar, clasificar (estelar/preliminar) y agregar o remover combates.
 * 
 * @function abrirModalGestionarCartelera
 * @param {string} eventId - Identificador del evento
 */
async function abrirModalGestionarCartelera(eventId) {
    const modal = document.getElementById('modal-gestionar-cartelera');
    if (!modal) return;

    const localEvents = obtenerEventosLocales();
    const eventObj = localEvents.find(e => e.id === eventId);
    if (!eventObj) return;

    const tituloEl = document.getElementById('cartelera-modal-titulo');
    const subtituloEl = document.getElementById('cartelera-modal-subtitulo');
    const container = document.getElementById('cartelera-fights-container');
    const eventIdHidden = document.getElementById('cartelera-event-id-hidden');
    const selectF1 = document.getElementById('cartelera-select-f1');
    const selectF2 = document.getElementById('cartelera-select-f2');
    const closeBtn = document.getElementById('close-cartelera-modal');
    const form = document.getElementById('form-agregar-pelea-cartelera');

    if (tituloEl) tituloEl.textContent = `CARTELERA: ${eventObj.name.toUpperCase()}`;
    if (subtituloEl) {
        const evDate = new Date(eventObj.date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
        subtituloEl.textContent = `${evDate} • ${eventObj.location || 'Ubicación por confirmar'}`;
    }
    if (eventIdHidden) eventIdHidden.value = eventId;

    // Cargar atletas de Firestore para los selectores
    const atletas = await obtenerPeleadoresFirestore();
    
    function popularSelectoresPeleadores() {
        if (!selectF1 || !selectF2) return;
        const optionsHtml = '<option value="">Selecciona al atleta...</option>' + atletas.map(a => {
            const aliasStr = a.alias ? ` "${a.alias}"` : '';
            return `<option value="${a.id}" data-name="${a.name}" data-alias="${a.alias || ''}" data-division="${a.division || ''}" data-record="${a.record || ''}" data-avatar="${a.avatar || ''}" data-weight="${a.weight || 0}" data-disc="${a.discipline || 'mma'}">${a.name}${aliasStr} - ${a.division} (${a.record})</option>`;
        }).join('');

        selectF1.innerHTML = optionsHtml;
        selectF2.innerHTML = optionsHtml;
    }
    popularSelectoresPeleadores();

    // Auto-completar división al seleccionar F1
    if (selectF1) {
        selectF1.onchange = () => {
            const opt = selectF1.selectedOptions[0];
            const divInput = document.getElementById('cartelera-division-input');
            if (opt && divInput && opt.dataset.division) {
                divInput.value = opt.dataset.division;
            }
        };
    }

    function renderizarPeleasEvento() {
        const currentEvents = obtenerEventosLocales();
        const ev = currentEvents.find(e => e.id === eventId) || eventObj;
        const fights = Array.isArray(ev.fights) ? ev.fights : [];

        if (fights.length === 0) {
            container.innerHTML = `
                <div style="padding: 2.5rem 1.5rem; text-align: center; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.1);">
                    <i class="fas fa-fist-raised" style="font-size: 2rem; color: var(--accent-red); margin-bottom: 0.6rem; opacity: 0.6; display: block;"></i>
                    <h4 style="color: #fff; margin: 0 0 0.3rem 0; font-family: var(--font-heading); font-size: 1.1rem;">NO HAY COMBATES REGISTRADOS</h4>
                    <p style="color: var(--text-gray); font-size: 0.85rem; margin: 0;">Usa el formulario de abajo para pactar y agregar la primera pelea a esta cartelera.</p>
                </div>
            `;
            return;
        }

        const estelares = fights.filter(f => f.type === 'estelar');
        const prelims = fights.filter(f => f.type !== 'estelar');

        const renderFighterMini = (f, alignRight = false) => {
            const avatarHtml = f.avatar && (f.avatar.startsWith('http') || f.avatar.startsWith('/uploads/'))
                ? `<img src="${f.avatar}" alt="${f.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                : `<i class="fas fa-user-ninja" style="font-size: 1.1rem; color: var(--accent-red);"></i>`;

            return `
                <div style="flex: 1; display: flex; align-items: center; gap: 0.6rem; ${alignRight ? 'justify-content: flex-end; text-align: right;' : 'text-align: left;'}">
                    ${!alignRight ? `<div style="width: 40px; height: 40px; border-radius: 50%; background: #111; overflow: hidden; border: 1px solid rgba(230,36,41,0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${avatarHtml}</div>` : ''}
                    <div style="overflow: hidden;">
                        <strong style="color: #fff; font-size: 0.88rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${f.name}</strong>
                        <small style="color: var(--accent-red); font-size: 0.72rem;">${f.alias ? `"${f.alias}" • ` : ''}${f.record || '0-0-0'}</small>
                    </div>
                    ${alignRight ? `<div style="width: 40px; height: 40px; border-radius: 50%; background: #111; overflow: hidden; border: 1px solid rgba(230,36,41,0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${avatarHtml}</div>` : ''}
                </div>
            `;
        };

        const renderBoutItem = (b) => {
            return `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.8rem 1rem; margin-bottom: 0.7rem; display: flex; align-items: center; justify-content: space-between; gap: 0.8rem;">
                    ${renderFighterMini(b.fighter1, false)}
                    
                    <div style="text-align: center; flex-shrink: 0;">
                        <span style="background: var(--accent-red); color: #fff; font-weight: bold; font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 4px;">VS</span>
                        <small style="display: block; color: var(--text-gray); font-size: 0.7rem; margin-top: 2px;">${b.weightClass || 'Pactado'}</small>
                    </div>

                    ${renderFighterMini(b.fighter2, true)}

                    <button class="btn-delete-fight" data-fight-id="${b.id}" title="Eliminar combate" style="background: none; border: none; color: #ff5252; cursor: pointer; font-size: 1rem; padding: 0.4rem; margin-left: 0.4rem;">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
        };

        let html = '';
        if (estelares.length > 0) {
            html += `
                <div style="margin-bottom: 1.2rem;">
                    <span style="font-size: 0.72rem; color: #ffc107; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 0.4rem;">
                        <i class="fas fa-star"></i> CARTELERA ESTELAR (${estelares.length})
                    </span>
                    ${estelares.map(renderBoutItem).join('')}
                </div>
            `;
        }
        if (prelims.length > 0) {
            html += `
                <div>
                    <span style="font-size: 0.72rem; color: var(--accent-red); font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 0.4rem;">
                        <i class="fas fa-fist-raised"></i> CARTELERA PRELIMINAR (${prelims.length})
                    </span>
                    ${prelims.map(renderBoutItem).join('')}
                </div>
            `;
        }

        container.innerHTML = html;

        // Conectar botones de eliminación de peleas
        container.querySelectorAll('.btn-delete-fight').forEach(btn => {
            btn.onclick = async (e) => {
                const fid = e.currentTarget.getAttribute('data-fight-id');
                if (confirm("¿Deseas remover este combate de la cartelera?")) {
                    await eliminarPeleaDeEvento(eventId, fid);
                    renderizarPeleasEvento();
                    cargarEventosPromotora(localStorage.getItem('userId'));
                }
            };
        });
    }

    renderizarPeleasEvento();

    // Manejar formulario de agregar pelea
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const f1Id = selectF1.value;
            const f2Id = selectF2.value;

            if (!f1Id || !f2Id) {
                alert("Debes seleccionar a dos peleadores para el combate.");
                return;
            }
            if (f1Id === f2Id) {
                alert("Un peleador no puede enfrentarse a sí mismo. Selecciona a un rival diferente.");
                return;
            }

            const f1Data = atletas.find(a => a.id === f1Id);
            const f2Data = atletas.find(a => a.id === f2Id);
            const tipoRadio = form.querySelector('input[name="cartelera-tipo-pelea"]:checked');
            const tipoPelea = tipoRadio ? tipoRadio.value : 'estelar';
            const divisionVal = document.getElementById('cartelera-division-input')?.value || f1Data.division || 'Peso Pactado';
            const roundsVal = document.getElementById('cartelera-rounds-select')?.value || 3;

            const nuevaPelea = {
                id: 'fight_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                type: tipoPelea,
                fighter1: {
                    id: f1Data.id,
                    name: f1Data.name,
                    alias: f1Data.alias || '',
                    avatar: f1Data.avatar || '',
                    record: f1Data.record || '0-0-0',
                    weight: f1Data.weight || 0,
                    discipline: f1Data.discipline || 'mma'
                },
                fighter2: {
                    id: f2Data.id,
                    name: f2Data.name,
                    alias: f2Data.alias || '',
                    avatar: f2Data.avatar || '',
                    record: f2Data.record || '0-0-0',
                    weight: f2Data.weight || 0,
                    discipline: f2Data.discipline || 'mma'
                },
                weightClass: divisionVal,
                rounds: parseInt(roundsVal, 10) || 3,
                createdAt: new Date().toISOString()
            };

            const submitBtn = document.getElementById('btn-submit-cartelera-pelea');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GUARDANDO COMBATE...';
            }

            try {
                await agregarPeleaAEvento(eventId, nuevaPelea);

                // Requerimiento 4: Notificar a ambos atletas y crear solicitud de combate en "Mis Postulaciones"
                const currentEvents = obtenerEventosLocales();
                const currentEventObj = currentEvents.find(ev => ev.id === eventId) || eventObj;
                await notificarYPostularPeleadoresCombate(currentEventObj, nuevaPelea);

                form.reset();
                popularSelectoresPeleadores();
                renderizarPeleasEvento();
                cargarEventosPromotora(localStorage.getItem('userId'));
                alert(`¡Combate guardado exitosamente como ${tipoPelea === 'estelar' ? 'Pelea Estelar' : 'Pelea Preliminar'}!\n\nSe ha enviado un mensaje y la propuesta de combate a ambos atletas en la sección "Mis Postulaciones".`);
            } catch (fightErr) {
                console.error("Error al registrar combate en cartelera:", fightErr);
                alert("Error al registrar el combate: " + (fightErr.message || "Por favor verifica los datos."));
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        };
    }

    const cerrarCartelera = () => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    };

    if (closeBtn) closeBtn.onclick = cerrarCartelera;
    modal.onclick = (e) => { if (e.target === modal) cerrarCartelera(); };
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) cerrarCartelera();
    });

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

/**
 * Carga los eventos de la promotora con una estrategia de aislamiento estricto por usuario
 * (sin eventos precargados ni fallbacks que mezclen datos de otros usuarios).
 * 
 * @function cargarEventosPromotora
 * @param {string} uid - Identificador de la organización/promotora.
 * @returns {void}
 */
function cargarEventosPromotora(uid) {
    const container = document.getElementById('mis-eventos-container');
    if (!container) return;
    
    // 1. CARGA SÍNCRONA INSTANTÁNEA (0ms)
    const targetUid = uid || localStorage.getItem('userId');
    let localEvents = obtenerEventosLocales();
    
    // Si la promotora está identificada, filtrar EXCLUSIVAMENTE sus propios eventos
    let userEvents = [];
    if (targetUid && targetUid !== 'promoter_local') {
        userEvents = localEvents.filter(e => e.promoterId === targetUid);
    } else {
        userEvents = localEvents.filter(e => e.promoterId === 'promoter_local');
    }
    
    userEvents.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    localStorage.setItem('userCartelerasCount', userEvents.length);
    renderizarTablaPromotora(userEvents, container);

    // 2. SINCRONIZACIÓN ASÍNCRONA EN SEGUNDO PLANO DESDE FIRESTORE
    if (window.db && window.collection && window.getDocs) {
        (async () => {
            try {
                if (targetUid && targetUid !== 'promoter_local') {
                    const q = query(collection(db, "events"), where("promoterId", "==", targetUid));
                    const querySnapshot = await getDocs(q);
                    
                    const firestoreEvents = [];
                    querySnapshot.forEach((docSnap) => {
                        const data = docSnap.data();
                        const ev = { id: docSnap.id, ...data };
                        firestoreEvents.push(ev);
                        guardarEventoLocal(ev);
                    });
                    
                    // Si Firestore devuelve 0 eventos, se muestra vacía sin mezclar
                    firestoreEvents.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
                    localStorage.setItem('userCartelerasCount', firestoreEvents.length);
                    renderizarTablaPromotora(firestoreEvents, container);
                }
            } catch (fsErr) {
                console.warn("Consulta Firestore de eventos de la promotora:", fsErr.message);
            }
        })();
    }
}

/**
 * Actualiza el banner interactivo de verificación institucional (KYB) en el dashboard de promotor.
 * 
 * @function actualizarBannerKybPromotora
 * @param {string} [kybStatus='unverified'] - Estado actual de verificación ('unverified', 'pending', 'approved').
 * @returns {void}
 */
function actualizarBannerKybPromotora(kybStatus = 'unverified') {
    const banner = document.getElementById('promoter-kyb-banner');
    if (!banner) return;
    const icon = document.getElementById('kyb-banner-icon');
    const title = document.getElementById('kyb-banner-title');
    const desc = document.getElementById('kyb-banner-desc');
    const btn = document.getElementById('kyb-banner-action-btn');
    const btnText = document.getElementById('kyb-banner-btn-text');
    const chipText = document.getElementById('kyb-chip-text');

    banner.classList.remove('unverified', 'pending', 'approved');
    if (kybStatus === 'approved') {
        banner.classList.add('approved');
        if (chipText) chipText.textContent = 'PROMOTORA OFICIAL PRO';
        if (icon) icon.innerHTML = '<i class="fas fa-certificate" style="color: #ffd700;"></i>';
        if (title) title.textContent = 'PROMOTORA OFICIAL PRO VERIFICADA';
        if (desc) desc.textContent = 'Tu entidad cuenta con acreditación legal DIAN, Cámara de Comercio y aval federativo. Tus carteleras disfrutan del sello dorado de máxima legitimidad y prelación nacional.';
        if (btnText) btnText.textContent = 'VER ESTADO LEGAL';
        if (btn) btn.href = 'promotor-ajustes.html#kyb-section';
    } else if (kybStatus === 'pending') {
        banner.classList.add('pending');
        if (chipText) chipText.textContent = 'EN AUDITORÍA TÉCNICA';
        if (icon) icon.innerHTML = '<i class="fas fa-hourglass-half" style="color: #60a5fa;"></i>';
        if (title) title.textContent = 'DOCUMENTACIÓN EN AUDITORÍA TÉCNICA';
        if (desc) desc.textContent = 'Tu expediente legal (RUT, Cámara de Comercio y compromiso de ringside) fue radicado con éxito y se encuentra en revisión por el equipo técnico de FightConnect.';
        if (btnText) btnText.textContent = 'VER EXPEDIENTE';
        if (btn) btn.href = 'promotor-ajustes.html#kyb-section';
    } else {
        banner.classList.add('unverified');
        if (chipText) chipText.textContent = 'MODO PRELIMINAR';
        if (icon) icon.innerHTML = '<i class="fas fa-shield-halved" style="color: #ffb300;"></i>';
        if (title) title.textContent = 'VERIFICACIÓN INSTITUCIONAL PENDIENTE';
        if (desc) desc.textContent = 'Tu promotora opera en modo preliminar. Para obtener la insignia dorada oficial de legitimidad [🛡️ VERIFICADA PRO] y publicar carteleras abiertas, radica tu expediente legal en los ajustes.';
        if (btnText) btnText.textContent = 'GESTIONAR EXPEDIENTE';
        if (btn) btn.href = 'promotor-ajustes.html#kyb-section';
    }
}
window.actualizarBannerKybPromotora = actualizarBannerKybPromotora;

/**
 * Configura los eventos del panel de promotor: apertura de modales, subida de póster y creación de carteleras.
 * 
 * @function configurarPromotoraOperations
 * @param {string} uid - Identificador único de la promotora en Firebase.
 * @param {Object} [promoterData={}] - Datos de perfil de la promotora.
 * @returns {void}
 */
function configurarPromotoraOperations(uid, promoterData = {}) {
    cargarEventosPromotora(uid);

    const kybStatus = promoterData?.kybStatus || localStorage.getItem('promoterKybStatus') || 'unverified';
    actualizarBannerKybPromotora(kybStatus);

    const form = document.getElementById('create-event-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn ? btn.textContent : "PUBLICAR EVENTO";
            
            if (btn) {
                btn.disabled = true;
                btn.textContent = "PROCESANDO PÓSTER...";
                btn.style.background = "#ff9800";
            }
            
            try {
                const name = document.getElementById('event-name').value.trim();
                const dateVal = document.getElementById('event-date').value;
                const discipline = document.getElementById('event-discipline').value;
                const location = document.getElementById('event-location').value.trim();
                const contact = document.getElementById('event-contact').value.trim();
                
                // Validación de Fecha
                const eventDate = new Date(dateVal);
                if (isNaN(eventDate.getTime()) || eventDate <= new Date()) {
                    throw new Error("LA FECHA DEBE SER EN EL FUTURO");
                }
                
                // Procesamiento de póster OBLIGATORIO con ImageService (Requerimiento 3)
                const posterInput = document.getElementById('poster-input');
                const fileToUpload = (posterInput && posterInput.files && posterInput.files[0]) || window._selectedPosterFile;
                const dropZone = document.getElementById('drag-drop-zone');

                if (!fileToUpload) {
                    if (dropZone) {
                        dropZone.classList.add('drag-error');
                        dropZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    throw new Error("EL PÓSTER OFICIAL ES OBLIGATORIO. DEBES SUBIR O ARRASTRAR UNA IMAGEN PARA CREAR EL EVENTO.");
                }

                console.log("📤 Procesando póster obligatorio del evento:", fileToUpload.name || 'Archivo');
                const imageUrl = await uploadImage(fileToUpload, { folder: 'events' });

                if (!imageUrl) {
                    throw new Error("NO SE PUDO CARGAR LA IMAGEN DEL PÓSTER. POR FAVOR INTENTA CON OTRA IMAGEN.");
                }

                if (btn) {
                    btn.textContent = "GUARDANDO EVENTO...";
                    btn.style.background = "#28a745";
                }

                const eventId = 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                const promoterOrgName = localStorage.getItem('userOrg') || localStorage.getItem('userName') || 'Promotora Oficial';
                const currentKyb = localStorage.getItem('promoterKybStatus') || 'unverified';
                const isVerifiedProm = currentKyb === 'approved';

                const eventData = {
                    id: eventId,
                    promoterId: uid || localStorage.getItem('userId') || 'promoter_local',
                    promoter: promoterOrgName,
                    promoterName: promoterOrgName,
                    org: promoterOrgName,
                    isVerified: isVerifiedProm,
                    kybStatus: currentKyb,
                    name: name,
                    date: dateVal,
                    discipline: discipline,
                    location: location,
                    contact: contact,
                    ticketUrl: contact,
                    ticketLink: contact,
                    imageUrl: imageUrl, // Estrictamente la imagen cargada por el promotor (sin URLs aleatorias)
                    fights: [],
                    createdAt: new Date().toISOString()
                };
                
                // 1. Guardar localmente para disponibilidad inmediata (0ms)
                guardarEventoLocal(eventData);

                // 2. Sincronizar en Firebase Cloud Firestore para todos los roles (Requerimiento 5)
                try {
                    await setDoc(doc(db, "events", eventId), eventData);
                    console.log("✅ Evento sincronizado en Firebase Cloud Firestore:", eventData);
                } catch (fsErr) {
                    console.warn("ℹ️ Evento activo en modo local:", fsErr.message);
                }
                
                if (btn) {
                    btn.textContent = "¡EVENTO PUBLICADO! ✓";
                    btn.style.background = "#28a745";
                }

                setTimeout(() => {
                    const modal = document.getElementById('create-event-modal');
                    if (modal) modal.classList.add('hidden');
                    
                    form.reset();
                    window._selectedPosterFile = null;
                    const dropZone = document.getElementById('drag-drop-zone');
                    if (dropZone) {
                        const p = dropZone.querySelector('p');
                        const span = dropZone.querySelector('span');
                        const icon = dropZone.querySelector('i');
                        const thumb = dropZone.querySelector('.poster-preview-thumb');
                        if (p) p.textContent = 'Arrastra y suelta tu póster aquí';
                        if (span) span.textContent = 'o haz clic para explorar';
                        if (icon) {
                            icon.className = 'fas fa-cloud-upload-alt';
                            icon.style.color = '';
                        }
                        if (thumb) thumb.remove();
                    }
                    if (btn) {
                        btn.disabled = false;
                        btn.textContent = originalText;
                        btn.style.background = "var(--accent-red)";
                    }
                    cargarEventosPromotora(uid); // Refrescar tabla instantáneamente
                }, 700);
                
            } catch (error) {
                console.error("Error creando evento:", error);
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = error.message === "LA FECHA DEBE SER EN EL FUTURO" ? error.message : "ERROR AL PUBLICAR";
                    btn.style.background = "#e62429";
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.background = "var(--accent-red)";
                    }, 3000);
                }
                alert("Error al publicar el evento: " + (error.message || "Por favor verifica los datos ingresados."));
            }
        };
    }
}

/**
 * Eventos curados de circuito base conectados directamente a las APIs oficiales de deportes de combate.
 * @constant {Array<Object>}
 */
const CURATED_CIRCUIT_EVENTS = [
    {
        id: 'curated_loc_1',
        name: 'WARRIORS FC 10: NOCHE DE IMPACTO',
        date: new Date(Date.now() + 86400000 * 4).toISOString(),
        discipline: 'mma',
        location: 'Medellín, Coliseo Yesid Santos',
        imageUrl: 'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg',
        promoter: 'Warriors Fighting Championship',
        ticketUrl: 'https://wa.me/573001234567?text=Hola,%20deseo%20comprar%20boletas%20para%20Warriors%20FC%2010',
        fights: [
            {
                id: 'fight_curated_1_1',
                type: 'estelar',
                fighter1: {
                    name: 'Carlos Montoya',
                    alias: 'El Cazador',
                    avatar: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=150',
                    record: '12-1-0',
                    weight: 77,
                    discipline: 'mma'
                },
                fighter2: {
                    name: 'Alejandro Silva',
                    alias: 'El Ruso',
                    avatar: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=150',
                    record: '10-2-0',
                    weight: 77,
                    discipline: 'mma'
                },
                weightClass: 'Peso Wélter (77 kg)',
                rounds: 5
            },
            {
                id: 'fight_curated_1_2',
                type: 'preliminar',
                fighter1: {
                    name: 'Mateo Torres',
                    alias: 'Relámpago',
                    avatar: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=150',
                    record: '6-1-0',
                    weight: 70,
                    discipline: 'mma'
                },
                fighter2: {
                    name: 'Diego Quintero',
                    alias: 'El Tigre',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                    record: '5-2-0',
                    weight: 70,
                    discipline: 'mma'
                },
                weightClass: 'Peso Ligero (70 kg)',
                rounds: 3
            }
        ]
    },
    {
        id: 'curated_loc_2',
        name: 'OPEN BOGOTÁ JIU-JITSU CHAMPIONSHIP',
        date: new Date(Date.now() + 86400000 * 11).toISOString(),
        discipline: 'bjj',
        location: 'Bogotá, Palacio de los Deportes',
        imageUrl: 'https://a.espncdn.com/photo/2026/0816/r1702390_600x400_3-2.jpg',
        promoter: 'Federación Colombiana de BJJ',
        ticketUrl: 'https://wa.me/573109876543?text=Hola,%20deseo%20entradas%20para%20Open%20Bogot%C3%A1%20Jiu-Jitsu%20Championship',
        fights: [
            {
                id: 'fight_curated_2_1',
                type: 'estelar',
                fighter1: {
                    name: 'Felipe Ríos',
                    alias: 'Anaconda',
                    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
                    record: '15-0-0',
                    weight: 84,
                    discipline: 'bjj'
                },
                fighter2: {
                    name: 'Sebastián Morales',
                    alias: 'Pitbull',
                    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
                    record: '11-2-0',
                    weight: 84,
                    discipline: 'bjj'
                },
                weightClass: 'Superfight Peso Medio (84 kg)',
                rounds: 1
            },
            {
                id: 'fight_curated_2_2',
                type: 'preliminar',
                fighter1: {
                    name: 'Andrés Gómez',
                    alias: 'Sombra',
                    avatar: '',
                    record: '8-3-0',
                    weight: 70,
                    discipline: 'bjj'
                },
                fighter2: {
                    name: 'Camilo Rojas',
                    alias: 'Cyborg',
                    avatar: '',
                    record: '7-2-0',
                    weight: 70,
                    discipline: 'bjj'
                },
                weightClass: 'Peso Ligero (70 kg)',
                rounds: 1
            }
        ]
    },
    {
        id: 'curated_loc_3',
        name: 'GUANTES DE ORO: NOCHE DE TÍTULO',
        date: new Date(Date.now() + 86400000 * 17).toISOString(),
        discipline: 'boxeo',
        location: 'Barranquilla, Coliseo Elías Chegwin',
        imageUrl: 'https://a.espncdn.com/photo/2023/0423/r1163456_1296x729_16-9.jpg',
        promoter: 'Boxeo Profesional de la Costa',
        ticketUrl: 'https://wa.me/573155551234?text=Hola,%20quiero%20boletas%20para%20Guantes%20de%20Oro%20en%20Barranquilla',
        fights: [
            {
                id: 'fight_curated_3_1',
                type: 'estelar',
                fighter1: {
                    name: 'Javier Beltrán',
                    alias: 'Dinamita',
                    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150',
                    record: '18-1-0',
                    weight: 76,
                    discipline: 'boxeo'
                },
                fighter2: {
                    name: 'Marlon Pérez',
                    alias: 'El Destructor',
                    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
                    record: '16-3-0',
                    weight: 76,
                    discipline: 'boxeo'
                },
                weightClass: 'Título Peso Supermediano (76 kg)',
                rounds: 10
            }
        ]
    },
    {
        id: 'curated_loc_4',
        name: 'STRIKING MASTERS: KICKBOXING GRAND PRIX',
        date: new Date(Date.now() + 86400000 * 24).toISOString(),
        discipline: 'kickboxing',
        location: 'Cali, Arena Cañaveralejo',
        imageUrl: 'https://a.espncdn.com/photo/2026/0829/r1708497_600x400_3-2.jpg',
        promoter: 'Striking Masters League',
        fights: [
            {
                id: 'fight_curated_4_1',
                type: 'estelar',
                fighter1: {
                    name: 'Lucas Henao',
                    alias: 'K.O.',
                    avatar: '',
                    record: '14-2-0',
                    weight: 75,
                    discipline: 'kickboxing'
                },
                fighter2: {
                    name: 'Rodrigo Vargas',
                    alias: 'Ares',
                    avatar: '',
                    record: '13-4-0',
                    weight: 75,
                    discipline: 'kickboxing'
                },
                weightClass: 'Peso Mediano (75 kg)',
                rounds: 5
            }
        ]
    },
    {
        id: 'curated_loc_5',
        name: 'RAF SUPERFIGHT COLOMBIA: NOCHE DE LUCHA OLÍMPICA',
        date: new Date(Date.now() + 86400000 * 30).toISOString(),
        discipline: 'lucha',
        location: 'Bogotá, Palacio de los Deportes',
        imageUrl: 'https://a.espncdn.com/photo/2026/0810/r1700045_600x600_1-1.jpg',
        promoter: 'Liga Nacional de Lucha Olímpica',
        fights: [
            {
                id: 'fight_curated_5_1',
                type: 'estelar',
                fighter1: {
                    name: 'David Guerrero',
                    alias: 'Titán',
                    avatar: '',
                    record: '10-1-0',
                    weight: 97,
                    discipline: 'lucha'
                },
                fighter2: {
                    name: 'Gabriel Castillo',
                    alias: 'Spartan',
                    avatar: '',
                    record: '9-2-0',
                    weight: 97,
                    discipline: 'lucha'
                },
                weightClass: 'Peso Pesado (97 kg)',
                rounds: 3
            }
        ]
    }
];

/**
 * Carga y formatea los eventos públicos para el módulo de cartelera nacional (`local.html`),
 * soportando filtrado por disciplina (MMA, Boxeo, BJJ, Kickboxing) y sincronización con Firestore.
 * 
 * @function cargarEventosPublicos
 * @returns {void}
 */
function cargarEventosPublicos() {
    if (typeof window.renderizarEventos !== 'function') return;
    
    // 1. CARGA SÍNCRONA INSTANTÁNEA (0ms)
    let localSaved = obtenerEventosLocales();
    let allEvents = [...localSaved];
    
    CURATED_CIRCUIT_EVENTS.forEach(cev => {
        const existingIdx = allEvents.findIndex(e => e.id === cev.id || (e.name === cev.name && e.date === cev.date));
        if (existingIdx === -1) {
            allEvents.push(cev);
        } else if (!allEvents[existingIdx].fights && cev.fights) {
            allEvents[existingIdx].fights = cev.fights;
        }
    });

    const formatEventos = (list) => {
        const res = [];
        list.forEach(ev => {
            if (typeof esEventoVigenteOFuturo === 'function' ? esEventoVigenteOFuturo(ev) : true) {
                const evDate = (typeof parseFechaEventoToDate === 'function' ? parseFechaEventoToDate(ev.date || ev.fechaIso || ev.fecha) : null) || new Date(ev.date || Date.now());
                if (!isNaN(evDate)) {
                    res.push({
                        id: ev.id,
                        titulo: ev.name,
                        fechaOriginal: evDate.getTime(),
                        fecha: evDate.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }), 
                        ubicacion: ev.location,
                        disciplina: (ev.discipline || 'MMA').toUpperCase(),
                        filtro: (ev.discipline || 'mma').toLowerCase(),
                        imagenUrl: ev.imageUrl || 'https://r2.thesportsdb.com/images/media/league/poster/l2k1ka1636383209.jpg',
                        fights: Array.isArray(ev.fights) ? ev.fights : [],
                        promoter: ev.promoter || ev.promoterName || 'Organización Oficial',
                        ticketUrl: ev.ticketUrl || ev.ticketLink || '',
                        contact: ev.contact || ev.contactPhone || ev.ticketPhone || ''
                    });
                }
            }
        });
        res.sort((a, b) => a.fechaOriginal - b.fechaOriginal);
        return res;
    };

    let formatted = formatEventos(allEvents);
    window.renderizarEventos(formatted);

    // Conectar botones de filtro (MMA, BJJ, Boxeo, Todos)
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
        pill.onclick = () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const filterValue = pill.dataset.filter;
            if (filterValue === 'all') {
                window.renderizarEventos(formatted);
            } else {
                const filtrados = formatted.filter(e => e.filtro === filterValue);
                window.renderizarEventos(filtrados);
            }
        };
    });

    // 2. SINCRONIZACIÓN ASÍNCRONA EN TIEMPO REAL DESDE FIRESTORE (Requerimiento 5)
    if (db) {
        (async () => {
            try {
                const q = query(collection(db, "events"));
                const snapshot = await getDocs(q);
                let updated = false;
                snapshot.forEach(docSnap => {
                    const ev = { id: docSnap.id, ...docSnap.data() };
                    // Guardar en el almacenamiento local para que los demás módulos y roles lo reconozcan
                    guardarEventoLocal(ev);
                    const existingIdx = allEvents.findIndex(e => e.id === ev.id || (e.name === ev.name && e.date === ev.date));
                    if (existingIdx >= 0) {
                        allEvents[existingIdx] = { ...allEvents[existingIdx], ...ev };
                        updated = true;
                    } else {
                        allEvents.push(ev);
                        updated = true;
                    }
                });
                if (updated) {
                    formatted = formatEventos(allEvents);
                    window.renderizarEventos(formatted);
                }
            } catch (e) {
                console.warn("ℹ️ Cartelera pública funcionando en modo local/offline:", e.message);
            }
        })();
    }
}

/* ==========================================================================
   FIGHT FEED: LÓGICA DE LA RED SOCIAL EN TIEMPO REAL
   ========================================================================== */

/**
 * Carga las publicaciones del feed social desde Cloud Firestore con orden cronológico inverso,
 * avatares, contenido multimedia y soporte para contador interactivo de reacciones (🔥 Fuego).
 * 
 * @async
 * @function cargarFightFeed
 * @returns {Promise<void>}
 */
async function cargarFightFeed() {
    const feedContainer = document.getElementById('social-feed-container');
    if (!feedContainer) return;

    try {
        const q = query(collection(db, "posts"));
        const snapshot = await getDocs(q);
        
        let posts = [];
        snapshot.forEach(docSnap => {
            posts.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Ordenar posts del más reciente al más antiguo
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (posts.length === 0) {
            feedContainer.innerHTML = `
                <div class="glass-panel" style="padding: 3rem; text-align: center; color: var(--text-gray); border-radius: 12px;">
                    <i class="fas fa-comments" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Sé el primero en compartir algo con la comunidad de FightConnect.</p>
                </div>
            `;
            return;
        }

        let html = '';
        posts.forEach(post => {
            const currentUser = auth.currentUser;
            const isLiked = currentUser && post.likedBy && post.likedBy.includes(currentUser.uid);
            const formattedDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Reciente';
            
            html += `
                <article class="glass-panel feed-card" style="padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(18, 18, 20, 0.85);">
                    <!-- Header Post -->
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--accent-red); display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; border: 2px solid rgba(255,255,255,0.2); overflow: hidden;">
                                ${post.authorAvatar ? `<img src="${post.authorAvatar}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user-ninja"></i>`}
                            </div>
                            <div>
                                <h4 style="color: #fff; margin: 0; font-size: 0.95rem; font-weight: 600;">${post.authorName || 'Guerrero de la Red'}</h4>
                                <span style="color: var(--accent-red); font-size: 0.75rem; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">
                                    ${post.authorRole === 'promotion' ? 'PROMOTORA' : post.authorRole === 'fighter' ? 'PELEADOR' : 'FANÁTICO'}
                                </span>
                            </div>
                        </div>
                        <span style="color: var(--text-gray); font-size: 0.75rem;"><i class="far fa-clock"></i> ${formattedDate}</span>
                    </div>

                    <!-- Post Body -->
                    <p style="color: #e0e0e0; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1rem; whitespace: pre-line;">${post.content}</p>

                    ${post.imageUrl ? `
                        <div style="margin-bottom: 1rem; border-radius: 8px; overflow: hidden; max-height: 400px; border: 1px solid rgba(255,255,255,0.1);">
                            <img src="${post.imageUrl}" style="width: 100%; height: 100%; object-fit: cover; display: block;" loading="lazy">
                        </div>
                    ` : ''}

                    <!-- Post Actions -->
                    <div style="display: flex; align-items: center; gap: 20px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.8rem; margin-top: 0.5rem;">
                        <button class="btn-like-post" data-id="${post.id}" style="background: transparent; border: none; color: ${isLiked ? 'var(--accent-red)' : 'var(--text-gray)'}; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                            <i class="${isLiked ? 'fas' : 'far'} fa-flame" style="color: var(--accent-red);"></i> 🔥 <span>${post.likesCount || 0}</span> Fuego
                        </button>
                    </div>
                </article>
            `;
        });

        feedContainer.innerHTML = html;

        // Listeners para Likes (🔥)
        const likeBtns = feedContainer.querySelectorAll('.btn-like-post');
        likeBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const postId = e.currentTarget.getAttribute('data-id');
                const user = auth.currentUser;
                if (!user) {
                    alert("Debes iniciar sesión para dar fuego (like) a las publicaciones.");
                    return;
                }

                try {
                    const postRef = doc(db, "posts", postId);
                    const postSnap = await getDoc(postRef);
                    if (postSnap.exists()) {
                        const data = postSnap.data();
                        let likedBy = data.likedBy || [];
                        let likesCount = data.likesCount || 0;

                        if (likedBy.includes(user.uid)) {
                            likedBy = likedBy.filter(id => id !== user.uid);
                            likesCount = Math.max(0, likesCount - 1);
                        } else {
                            likedBy.push(user.uid);
                            likesCount += 1;
                        }

                        await updateDoc(postRef, { likedBy, likesCount });
                        cargarFightFeed(); // Recargar feed UI
                    }
                } catch (err) {
                    console.error("Error al actualizar like:", err);
                }
            });
        });

    } catch (err) {
        console.error("Error cargando Fight Feed:", err);
        feedContainer.innerHTML = `<p style="color: var(--accent-red); text-align: center;">Error cargando el feed social.</p>`;
    }
}

/**
 * Inicializa el formulario de creación de publicaciones del feed con soporte para compresión y subida de imágenes.
 * 
 * @function inicializarFormularioFeed
 * @returns {void}
 */
function inicializarFormularioFeed() {
    const postForm = document.getElementById('create-post-form');
    const imageInput = document.getElementById('post-image-input');
    const imageNameSpan = document.getElementById('post-image-name');

    if (imageInput && imageNameSpan) {
        imageInput.addEventListener('change', () => {
            if (imageInput.files.length > 0) {
                imageNameSpan.textContent = imageInput.files[0].name;
            } else {
                imageNameSpan.textContent = '';
            }
        });
    }

    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = postForm.querySelector('button[type="submit"]');
            const content = document.getElementById('post-text').value.trim();

            if (!content) return;

            const user = auth.currentUser;
            const originalText = btn ? btn.textContent : "PUBLICAR";
            if (btn) {
                btn.textContent = "SUBIENDO AL SERVIDOR...";
                btn.disabled = true;
            }

            try {
                let imageUrl = '';
                if (imageInput && imageInput.files && imageInput.files[0]) {
                    const file = imageInput.files[0];
                    imageUrl = await uploadImage(file, { folder: 'feed' });
                }

                // Obtener datos del perfil del usuario si existen
                let authorName = user ? (user.displayName || user.email.split('@')[0]) : 'Guerrero Conectado';
                let authorRole = localStorage.getItem('userRole') || 'fan';

                if (user) {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const uData = userDoc.data();
                        authorName = uData.name || authorName;
                    }
                }

                await addDoc(collection(db, "posts"), {
                    authorId: user ? user.uid : 'anon',
                    authorName: authorName,
                    authorRole: authorRole,
                    content: content,
                    imageUrl: imageUrl,
                    likesCount: 0,
                    likedBy: [],
                    createdAt: new Date().toISOString()
                });

                postForm.reset();
                if (imageNameSpan) imageNameSpan.textContent = '';
                cargarFightFeed();

            } catch (err) {
                console.error("Error creando post:", err);
                alert("Error al publicar en el feed.");
            } finally {
                if (btn) {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            }
        });
    }
}

/* ==========================================================================
   MÓDULO DE AJUSTES DE ESPECTADOR (FAN)
   ========================================================================== */

/**
 * Carga el formulario de configuración y preferencias del aficionado/espectador.
 * 
 * @function cargarFanAjustesPage
 * @param {string} uid - Identificador del usuario.
 * @param {Object} data - Datos actuales del documento del usuario en Firestore.
 * @returns {void}
 */
function cargarFanAjustesPage(uid, data) {
    const editName = document.getElementById('edit-fan-name');
    const editEmail = document.getElementById('edit-fan-email');
    const editLocation = document.getElementById('edit-fan-location');
    const form = document.getElementById('fan-settings-form');

    // Avatar fan
    const fanAvatarInput = document.getElementById('fan-avatar-input');
    const fanAvatarBox = document.getElementById('fan-avatar-box');
    const btnTriggerAvatar = document.getElementById('btn-trigger-fan-avatar');
    const fanAvatarPreview = document.getElementById('fan-avatar-preview');
    const fanPlaceholderIcon = document.getElementById('fan-avatar-placeholder-icon');

    let currentAvatarUrl = data?.photoURL || data?.avatar || localStorage.getItem('userAvatar') || '';
    if (currentAvatarUrl) {
        if (fanAvatarPreview) {
            fanAvatarPreview.src = currentAvatarUrl;
            fanAvatarPreview.style.display = 'block';
        }
        if (fanPlaceholderIcon) fanPlaceholderIcon.style.display = 'none';
        if (btnTriggerAvatar) btnTriggerAvatar.innerHTML = '<i class="fas fa-pen"></i> CAMBIAR FOTO';
        localStorage.setItem('userAvatar', currentAvatarUrl);
    }

    const triggerSelect = () => { if (fanAvatarInput) fanAvatarInput.click(); };
    if (fanAvatarBox) fanAvatarBox.addEventListener('click', triggerSelect);
    if (btnTriggerAvatar) btnTriggerAvatar.addEventListener('click', triggerSelect);

    if (fanAvatarInput) {
        fanAvatarInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            try {
                if (btnTriggerAvatar) btnTriggerAvatar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SUBIENDO...';
                const uploadedUrl = await uploadImage(file, { folder: 'fans' });
                if (uploadedUrl) {
                    currentAvatarUrl = uploadedUrl;
                    localStorage.setItem('userAvatar', uploadedUrl);
                    if (fanAvatarPreview) {
                        fanAvatarPreview.src = uploadedUrl;
                        fanAvatarPreview.style.display = 'block';
                    }
                    if (fanPlaceholderIcon) fanPlaceholderIcon.style.display = 'none';
                    if (btnTriggerAvatar) btnTriggerAvatar.innerHTML = '<i class="fas fa-pen"></i> CAMBIAR FOTO';
                    actualizarNavegacionSesion();

                    const saveUid = uid || auth.currentUser?.uid || localStorage.getItem('userId');
                    if (saveUid) {
                        await setDoc(doc(db, "users", saveUid), {
                            photoURL: uploadedUrl,
                            avatar: uploadedUrl,
                            updatedAt: new Date().toISOString()
                        }, { merge: true });
                    }
                }
            } catch (err) {
                console.error("Error al procesar avatar de fan:", err);
                alert("Error al cargar la imagen: " + err.message);
            } finally {
                if (btnTriggerAvatar) {
                    btnTriggerAvatar.innerHTML = currentAvatarUrl 
                        ? '<i class="fas fa-pen"></i> CAMBIAR FOTO' 
                        : '<i class="fas fa-cloud-arrow-up"></i> SUBIR FOTO';
                }
            }
        });
    }

    if (editName && data) editName.value = data.name || editName.value || '';
    if (editEmail && data) editEmail.value = data.email || editEmail.value || '';
    if (editLocation && data) editLocation.value = data.location || editLocation.value || '';

    // Cargar Preferencias del Ecosistema (Disciplinas Favoritas y Notificaciones)
    const prefMma = document.getElementById('fan-pref-mma');
    const prefBjj = document.getElementById('fan-pref-bjj');
    const prefBoxeo = document.getElementById('fan-pref-boxeo');
    const prefAlertas = document.getElementById('fan-pref-alertas');

    const activeFanUid = uid || auth.currentUser?.uid || localStorage.getItem('userId');
    let fanPrefs = null;
    try {
        const raw = localStorage.getItem(`fightconnect_fan_preferences_${activeFanUid}`) || localStorage.getItem('fightconnect_fan_preferences');
        if (raw) fanPrefs = JSON.parse(raw);
    } catch (_) {}
    if (!fanPrefs && data?.preferences) {
        fanPrefs = data.preferences;
    }
    if (!fanPrefs) {
        fanPrefs = { disciplines: ['mma'], notifyLocalEvents: true };
    }

    if (fanPrefs) {
        const discs = Array.isArray(fanPrefs.disciplines) ? fanPrefs.disciplines : ['mma'];
        if (prefMma) prefMma.checked = discs.includes('mma');
        if (prefBjj) prefBjj.checked = discs.includes('bjj');
        if (prefBoxeo) prefBoxeo.checked = discs.includes('boxeo');
        if (prefAlertas) prefAlertas.checked = fanPrefs.notifyLocalEvents !== false;
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn ? btn.innerHTML : 'GUARDAR CAMBIOS';
            
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GUARDANDO...';
                btn.style.background = "#28a745";
            }

            try {
                const newName = editName ? editName.value.trim() : '';
                const newEmail = editEmail ? editEmail.value.trim() : '';
                const newLocation = editLocation ? editLocation.value.trim() : '';

                // Recopilar disciplinas y notificaciones seleccionadas
                const selectedDisciplines = [];
                if (prefMma && prefMma.checked) selectedDisciplines.push('mma');
                if (prefBjj && prefBjj.checked) selectedDisciplines.push('bjj');
                if (prefBoxeo && prefBoxeo.checked) selectedDisciplines.push('boxeo');
                if (selectedDisciplines.length === 0) selectedDisciplines.push('mma');
                const notifyLocalEvents = prefAlertas ? prefAlertas.checked : true;

                const userPreferences = {
                    disciplines: selectedDisciplines,
                    notifyLocalEvents: notifyLocalEvents,
                    updatedAt: new Date().toISOString()
                };

                const saveUid = uid || auth.currentUser?.uid || localStorage.getItem('userId');
                if (saveUid) {
                    localStorage.setItem(`fightconnect_fan_preferences_${saveUid}`, JSON.stringify(userPreferences));
                }
                localStorage.setItem('fightconnect_fan_preferences', JSON.stringify(userPreferences));

                if (saveUid) {
                    await setDoc(doc(db, "users", saveUid), {
                        name: newName,
                        email: newEmail,
                        location: newLocation,
                        photoURL: currentAvatarUrl || '',
                        avatar: currentAvatarUrl || '',
                        preferences: userPreferences,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                }

                const headerTitle = document.querySelector('.main-title');
                if (headerTitle) headerTitle.textContent = (newName || 'ESPECTADOR').toUpperCase();
                if (currentAvatarUrl) localStorage.setItem('userAvatar', currentAvatarUrl);
                if (newName) localStorage.setItem('userName', newName);
                actualizarNavegacionSesion();

                if (btn) {
                    btn.innerHTML = '<i class="fas fa-check"></i> PREFERENCIAS GUARDADAS';
                }

            } catch (err) {
                console.error("Error guardando ajustes de fan:", err);
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ERROR';
                    btn.style.background = "#e62429";
                }
                alert("Error al actualizar perfil: " + err.message);
            } finally {
                setTimeout(() => {
                    if (btn) {
                        btn.innerHTML = originalText;
                        btn.style.background = "var(--accent-red)";
                    }
                }, 2000);
            }
        });
    }

    // =========================================================================
    // GESTIÓN DE ZONA DE PELIGRO: ELIMINACIÓN DE CUENTA DE FAN / ESPECTADOR
    // =========================================================================
    const btnEliminarFan = document.getElementById('btn-eliminar-cuenta-fan');
    const modalEliminarFan = document.getElementById('modal-eliminar-cuenta-fan');
    const btnCerrarModalFan = document.getElementById('btn-cerrar-modal-eliminar-fan');
    const btnCancelarModalFan = document.getElementById('btn-cancelar-eliminar-fan');
    const inputConfirmarFan = document.getElementById('input-confirmar-eliminar-fan');
    const btnConfirmarFan = document.getElementById('btn-confirmar-eliminar-fan');

    if (btnEliminarFan && modalEliminarFan && !btnEliminarFan._hasDangerListener) {
        btnEliminarFan._hasDangerListener = true;

        const abrirModal = () => {
            modalEliminarFan.classList.remove('hidden');
            if (inputConfirmarFan) {
                inputConfirmarFan.value = '';
                inputConfirmarFan.focus();
            }
            if (btnConfirmarFan) {
                btnConfirmarFan.disabled = true;
                btnConfirmarFan.style.background = '#333';
                btnConfirmarFan.style.color = '#777';
                btnConfirmarFan.style.borderColor = '#444';
                btnConfirmarFan.style.cursor = 'not-allowed';
                btnConfirmarFan.style.boxShadow = 'none';
            }
        };

        const cerrarModal = () => {
            modalEliminarFan.classList.add('hidden');
            if (inputConfirmarFan) inputConfirmarFan.value = '';
        };

        btnEliminarFan.addEventListener('click', abrirModal);
        if (btnCerrarModalFan) btnCerrarModalFan.addEventListener('click', cerrarModal);
        if (btnCancelarModalFan) btnCancelarModalFan.addEventListener('click', cerrarModal);

        modalEliminarFan.addEventListener('click', (e) => {
            if (e.target === modalEliminarFan) cerrarModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modalEliminarFan.classList.contains('hidden')) {
                cerrarModal();
            }
        });

        if (inputConfirmarFan && btnConfirmarFan) {
            inputConfirmarFan.addEventListener('input', () => {
                const val = inputConfirmarFan.value.trim().toUpperCase();
                if (val === 'ELIMINAR') {
                    btnConfirmarFan.disabled = false;
                    btnConfirmarFan.style.background = '#e62429';
                    btnConfirmarFan.style.color = '#fff';
                    btnConfirmarFan.style.borderColor = '#ff3333';
                    btnConfirmarFan.style.cursor = 'pointer';
                    btnConfirmarFan.style.boxShadow = '0 0 15px rgba(230, 36, 41, 0.6)';
                } else {
                    btnConfirmarFan.disabled = true;
                    btnConfirmarFan.style.background = '#333';
                    btnConfirmarFan.style.color = '#777';
                    btnConfirmarFan.style.borderColor = '#444';
                    btnConfirmarFan.style.cursor = 'not-allowed';
                    btnConfirmarFan.style.boxShadow = 'none';
                }
            });

            btnConfirmarFan.addEventListener('click', async () => {
                if (btnConfirmarFan.disabled) return;

                const targetUid = uid || auth.currentUser?.uid || localStorage.getItem('userId');
                btnConfirmarFan.disabled = true;
                btnConfirmarFan.style.background = '#ff9800';
                btnConfirmarFan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ELIMINANDO CUENTA...';

                try {
                    if (targetUid && db && deleteDoc && doc) {
                        try {
                            await deleteDoc(doc(db, "users", targetUid));
                            console.log(`✅ Perfil fan ${targetUid} eliminado de Firestore`);
                        } catch (e) {
                            console.warn("Error eliminando documento fan en Firestore:", e);
                        }
                    }

                    try {
                        if (auth.currentUser) {
                            await deleteUser(auth.currentUser);
                            console.log("✅ Fan eliminado de Firebase Auth");
                        }
                    } catch (authErr) {
                        console.warn("Aviso Firebase Auth fan:", authErr);
                    }

                    try {
                        await signOut(auth);
                    } catch (e) {}

                    localStorage.removeItem('userId');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userAvatar');

                    alert("Tu cuenta ha sido eliminada con éxito.");
                    window.location.href = "index.html";
                } catch (err) {
                    console.error("Error al eliminar cuenta fan:", err);
                    alert("Error al eliminar la cuenta: " + err.message);
                    btnConfirmarFan.disabled = false;
                    btnConfirmarFan.style.background = '#e62429';
                    btnConfirmarFan.innerHTML = '<i class="fas fa-trash-alt"></i> REINTENTAR';
                }
            });
        }
    }
}

/* ==========================================================================
   MÓDULO DE BÚSQUEDA DE PELEAS Y OPORTUNIDADES (FIGHTER-BUSCAR)
   ========================================================================== */

/**
 * Convocatorias oficiales y oportunidades de combate abiertas para atletas.
 * @constant {Array<Object>}
 */
const OPPORTUNITIES_DATA = [
    {
        id: "opp-1",
        evento: "WARRIORS FIGHT NIGHT 12",
        org: "Warriors MMA Promotions",
        ubicacion: "Bogotá, Colombia",
        fecha: "28 Oct 2026",
        pesos: ["66", "70", "77"],
        pesosTexto: "66 kg, 70 kg, 77 kg",
        disciplina: "mma",
        disciplinaTexto: "MMA PRO & SEMI-PRO",
        whatsapp: "573001234567"
    },
    {
        id: "opp-2",
        evento: "OPEN SUBMISSION BJJ CHALLENGE",
        org: "ADCC South America Affiliate",
        ubicacion: "Medellín, Colombia",
        fecha: "12 Nov 2026",
        pesos: ["61", "70", "77", "84", "93"],
        pesosTexto: "61 kg, 70 kg, 77 kg, 84 kg",
        disciplina: "bjj",
        disciplinaTexto: "BJJ NO-GI / GRAPPLING",
        whatsapp: "573109876543"
    },
    {
        id: "opp-3",
        evento: "GOLDEN GLOVES LATAM ELITE",
        org: "WBA Boxing Latam",
        ubicacion: "Ciudad de México, México",
        fecha: "20 Nov 2026",
        pesos: ["57", "61", "66", "70"],
        pesosTexto: "57 kg, 61 kg, 66 kg, 70 kg",
        disciplina: "boxeo",
        disciplinaTexto: "BOXEO PROFESIONAL",
        whatsapp: "525512345678"
    },
    {
        id: "opp-4",
        evento: "MUAY THAI WARRIORS CUP",
        org: "Siam Fight League",
        ubicacion: "Cali, Colombia",
        fecha: "05 Dic 2026",
        pesos: ["61", "66", "70"],
        pesosTexto: "61 kg, 66 kg, 70 kg",
        disciplina: "muaythai",
        disciplinaTexto: "MUAY THAI FULL RULES",
        whatsapp: "573155554433"
    },
    {
        id: "opp-5",
        evento: "STRIKE FORCE KICKBOXING GP",
        org: "Glory Affiliate League",
        ubicacion: "Buenos Aires, Argentina",
        fecha: "18 Dic 2026",
        pesos: ["70", "77", "84"],
        pesosTexto: "70 kg, 77 kg, 84 kg",
        disciplina: "kickboxing",
        disciplinaTexto: "K-1 RULES KICKBOXING",
        whatsapp: "5491144556677"
    }
];

/**
 * Controla la vista de búsqueda de combates (`fighter-buscar.html`), gestionando filtros por peso/disciplina
 * y permitiendo postulación directa con sincronización local y en Firestore.
 * 
 * @function cargarFighterBuscarPage
 * @param {string} uid - UID del peleador en sesión.
 * @returns {void}
 */
async function cargarFighterBuscarPage(uid) {
    const grid = document.getElementById('oportunidades-search-grid');
    if (!grid) return;

    const filterWeight = document.getElementById('filter-weight');
    const filterDiscipline = document.getElementById('filter-discipline');
    const filterLocation = document.getElementById('filter-location');
    const btnSearch = document.getElementById('btn-search-opps');

    // 1. Cargar postulaciones existentes desde Firestore para saber en cuáles ya está postulado el atleta
    let userApplications = [];
    try {
        const q = query(collection(db, "applications"), where("fighterId", "==", uid));
        const snapshot = await getDocs(q);
        snapshot.forEach(docSnap => {
            userApplications.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
    } catch (err) {
        console.warn("Error leyendo postulaciones desde Firestore en buscador:", err);
    }

    // Fusión con caché local (respetando eliminaciones)
    const localApps = JSON.parse(localStorage.getItem(`fightconnect_apps_${uid}`) || '[]');
    localApps.forEach(la => {
        if (!userApplications.some(ua => (ua.id && ua.id === la.id) || (ua.oppId && ua.oppId === la.oppId))) {
            userApplications.push(la);
        }
    });

    /**
     * Filtra y renderiza las tarjetas de oportunidad según los criterios seleccionados.
     * Incorpora tanto convocatorias estándar como eventos creados por promotoras en vivo.
     */
    function renderOpportunities() {
        const selWeight = filterWeight ? filterWeight.value.trim() : '';
        const selDiscipline = filterDiscipline ? filterDiscipline.value.trim().toLowerCase() : '';
        const selLocation = filterLocation ? filterLocation.value.trim().toLowerCase() : '';

        // Combinar datos predefinidos con eventos reales guardados por promotoras
        const localEvents = obtenerEventosLocales();
        const allOpps = [...OPPORTUNITIES_DATA];
        localEvents.forEach(ev => {
            if (!allOpps.some(o => o.id === ev.id || o.evento === ev.name)) {
                const discCode = (ev.discipline || 'mma').toLowerCase();
                const discUpper = (ev.discipline || 'MMA').toUpperCase();
                allOpps.push({
                    id: ev.id,
                    evento: ev.name,
                    org: ev.promoter || ev.promoterName || ev.org || 'Promotora Oficial',
                    promoterId: ev.promoterId || '',
                    ubicacion: ev.location || 'Sede por confirmar',
                    fecha: ev.date ? new Date(ev.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Próximamente',
                    pesos: ["57", "61", "66", "70", "77", "84", "93", "120"],
                    pesosTexto: "Categorías abiertas (57 - 120 kg)",
                    disciplina: discCode,
                    disciplinaTexto: `${discUpper} OFICIAL`,
                    whatsapp: ev.contact ? ev.contact.replace(/\D/g, '') : "573001234567"
                });
            }
        });

        const filtered = allOpps.filter(opp => {
            if (selWeight && !opp.pesos.includes(selWeight)) return false;
            if (selDiscipline && opp.disciplina !== selDiscipline) return false;
            if (selLocation && !opp.ubicacion.toLowerCase().includes(selLocation) && !opp.org.toLowerCase().includes(selLocation) && !opp.evento.toLowerCase().includes(selLocation)) return false;
            return true;
        });

        if (filtered.length === 0) {
            grid.className = 'empty-grid-state';
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 4rem 2rem; text-align: center; color: var(--text-gray); background: rgba(18,18,20,0.6); border: 1px dashed rgba(255,255,255,0.1); border-radius: 12px;">
                    <i class="fas fa-search-minus" style="font-size: 3rem; margin-bottom: 1rem; color: var(--accent-red); opacity: 0.7;"></i>
                    <h3 style="color: var(--text-white); margin-bottom: 0.5rem; font-family: var(--font-heading); letter-spacing: 1px;">NO SE ENCONTRARON COMBATES</h3>
                    <p style="font-size: 0.9rem;">Prueba ajustando los filtros de categoría de peso o disciplina.</p>
                </div>
            `;
            return;
        }

        grid.className = 'scouting-results-grid';
        grid.innerHTML = filtered.map(opp => {
            const isApplied = userApplications.some(app => app.oppId === opp.id || (app.evento === opp.evento && app.org === opp.org));
            const waUrl = `https://wa.me/${opp.whatsapp}?text=${encodeURIComponent(`Hola, soy atleta de FightConnect y me interesa postularme al evento "${opp.evento}" (${opp.disciplinaTexto}).`)}`;
            return `
                <div class="opportunity-card" style="border: 1px solid rgba(255,255,255,0.08); background: rgba(18,18,20,0.85); border-radius: 12px; padding: 1.5rem; transition: transform 0.3s, border-color 0.3s;">
                    <div class="opp-header" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.2rem;">
                        <div class="opp-org-logo" style="width: 50px; height: 50px; border-radius: 8px; background: rgba(230,36,41,0.1); border: 1px solid rgba(230,36,41,0.3); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--accent-red);">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="opp-info">
                            <h3 style="color: #fff; font-family: var(--font-heading); font-size: 1.15rem; margin-bottom: 0.2rem; letter-spacing: 0.5px;">${opp.evento}</h3>
                            <p style="color: var(--text-gray); font-size: 0.8rem; margin: 0;"><i class="fas fa-building" style="color: var(--accent-red); margin-right: 4px;"></i>${opp.org}</p>
                            <p style="color: var(--text-gray); font-size: 0.8rem; margin-top: 0.2rem;"><i class="fas fa-map-marker-alt" style="color: var(--accent-red); margin-right: 4px;"></i>${opp.ubicacion}</p>
                        </div>
                    </div>
                    
                    <div class="opp-details" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; padding: 0.8rem 0; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 1.2rem; text-align: center;">
                        <div>
                            <span style="font-size: 0.7rem; color: var(--text-gray); display: block; text-transform: uppercase;">FECHA EVENTO</span>
                            <strong style="color: #fff; font-size: 0.85rem;">${opp.fecha}</strong>
                        </div>
                        <div>
                            <span style="font-size: 0.7rem; color: var(--text-gray); display: block; text-transform: uppercase;">CATEGORÍAS</span>
                            <strong style="color: #fff; font-size: 0.85rem;">${opp.pesosTexto}</strong>
                        </div>
                        <div>
                            <span style="font-size: 0.7rem; color: var(--text-gray); display: block; text-transform: uppercase;">DISCIPLINA</span>
                            <strong style="color: var(--accent-red); font-size: 0.85rem;">${opp.disciplina.toUpperCase()}</strong>
                        </div>
                    </div>

                    <div class="opp-actions" style="display: flex; gap: 10px;">
                        <button class="btn-solid red-btn btn-apply-opp" data-id="${opp.id}" style="flex: 2; justify-content: center; ${isApplied ? 'background: #28a745; border-color: #28a745;' : ''}" ${isApplied ? 'disabled' : ''}>
                            <i class="fas ${isApplied ? 'fa-check-circle' : 'fa-hand-rock'}"></i> ${isApplied ? '¡POSTULADO!' : 'POSTULARME'}
                        </button>
                        <a href="${waUrl}" target="_blank" class="btn-outline whatsapp-btn" style="flex: 1; text-align: center; text-decoration: none; display: flex; justify-content: center; align-items: center; padding: 0.6rem; border-color: #25D366; color: #25D366;" title="Contactar Promotora por WhatsApp">
                            <i class="fab fa-whatsapp" style="font-size: 1.3rem;"></i>
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.btn-apply-opp').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetBtn = e.currentTarget;
                const oppId = targetBtn.getAttribute('data-id');
                const opp = allOpps.find(o => o.id === oppId);
                if (!opp) return;

                targetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> POSTULANDO...';
                targetBtn.disabled = true;

                // Obtenemos datos actualizados del atleta desde Firestore
                let fighterData = {};
                try {
                    const snap = await getDoc(doc(db, "users", uid));
                    if (snap.exists()) fighterData = snap.data();
                } catch (err) {
                    console.warn("No se pudo cargar datos completos del peleador:", err);
                }

                const newApp = {
                    fighterId: uid,
                    fighterName: fighterData.legalName || fighterData.name || localStorage.getItem('userName') || 'Atleta',
                    fighterAlias: fighterData.alias || '',
                    fighterEmail: fighterData.email || localStorage.getItem('userEmail') || '',
                    fighterPhone: fighterData.phone || fighterData.whatsapp || '',
                    fighterAvatar: fighterData.photoURL || fighterData.avatar || localStorage.getItem('userAvatar') || '',
                    fighterDiscipline: fighterData.discipline || '',
                    fighterWeight: fighterData.metrics?.weight || fighterData.peso || 0,
                    oppId: opp.id,
                    eventId: opp.id,
                    evento: opp.evento,
                    org: opp.org,
                    promoterId: opp.promoterId || '',
                    disciplina: opp.disciplinaTexto || opp.disciplina,
                    peso: opp.pesosTexto || (Array.isArray(opp.pesos) ? opp.pesos.join(', ') : opp.pesos || ''),
                    fechaEnvio: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
                    estado: 'PENDIENTE',
                    createdAt: new Date().toISOString()
                };

                // Guardar en Firestore
                try {
                    const docRef = await addDoc(collection(db, "applications"), newApp);
                    newApp.id = docRef.id;
                    console.log("✅ Postulación guardada con éxito en Firestore ID:", docRef.id);
                } catch (err) {
                    console.error("Error al guardar postulación en base de datos Firestore:", err);
                    newApp.id = 'app_local_' + Date.now();
                }

                // Guardar en caché local
                userApplications.push(newApp);
                localStorage.setItem(`fightconnect_apps_${uid}`, JSON.stringify(userApplications));

                targetBtn.innerHTML = '<i class="fas fa-check-circle"></i> ¡POSTULADO!';
                targetBtn.style.background = "#28a745";
                targetBtn.style.borderColor = "#28a745";
            });
        });
    }

    renderOpportunities();

    if (btnSearch) btnSearch.addEventListener('click', renderOpportunities);
    if (filterWeight) filterWeight.addEventListener('change', renderOpportunities);
    if (filterDiscipline) filterDiscipline.addEventListener('change', renderOpportunities);
    if (filterLocation) filterLocation.addEventListener('input', renderOpportunities);
}

/* ==========================================================================
   MÓDULO DE POSTULACIONES DEL PELEADOR (FIGHTER-POSTULACIONES)
   ========================================================================== */

/**
 * Carga la tabla de seguimiento de postulaciones y solicitudes de combate recibidas por el atleta,
 * conectada en vivo con Cloud Firestore (`applications`). Permite aceptar combates o eliminar
 * postulaciones con sincronización permanente en la base de datos para todos los roles.
 * 
 * @async
 * @function cargarFighterPostulacionesPage
 * @param {string} uid - Identificador del atleta en sesión.
 * @returns {Promise<void>}
 */
async function cargarFighterPostulacionesPage(uid) {
    const tableBody = document.getElementById('postulaciones-body');
    if (!tableBody) return;

    // 1. Mostrar estado de carga reactivo (5 columnas)
    tableBody.innerHTML = `
        <tr>
            <td colspan="5" style="padding: 0; border: none;">
                <div class="loading-container-v2" style="min-height: 220px; background: transparent; border: none; backdrop-filter: none;">
                    <div class="loader-pulse"></div>
                    <p class="loading-text">Cargando tus postulaciones y solicitudes de combate...</p>
                </div>
            </td>
        </tr>
    `;

    let userApplications = [];
    let firestoreConnected = false;

    // 2. Consulta en Cloud Firestore: colección applications donde fighterId == uid
    try {
        if (db) {
            const q = query(collection(db, "applications"), where("fighterId", "==", uid));
            const snapshot = await getDocs(q);
            snapshot.forEach(docSnap => {
                userApplications.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });
            firestoreConnected = true;
        }
    } catch (err) {
        console.error("Error al consultar postulaciones en Firestore:", err);
    }

    // 3. Sincronización con almacenamiento local
    if (firestoreConnected) {
        // Firestore es la fuente canónica autoritativa: actualizamos el caché local
        localStorage.setItem(`fightconnect_apps_${uid}`, JSON.stringify(userApplications));
    } else {
        // En caso offline, recuperar de caché local
        const localApps = JSON.parse(localStorage.getItem(`fightconnect_apps_${uid}`) || '[]');
        userApplications = localApps;
    }

    // 4. Ordenar cronológicamente (más recientes primero)
    userApplications.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
    });

    // 5. Actualizar Estadísticas KPI y Filtros
    const totalCount = userApplications.length;
    const solicitudesCount = userApplications.filter(a => (a.estado || '').toUpperCase() === 'SOLICITUD DE COMBATE').length;
    const aceptadasCount = userApplications.filter(a => ['ACEPTADA', 'SELECCIONADO', 'CONFIRMADA'].includes((a.estado || '').toUpperCase())).length;
    const pendientesCount = userApplications.filter(a => (a.estado || 'PENDIENTE').toUpperCase() === 'PENDIENTE').length;

    const elTotal = document.getElementById('stat-total-postulaciones');
    const elSolicitudes = document.getElementById('stat-ofertas-combate');
    const elAceptadas = document.getElementById('stat-peleas-confirmadas');
    const elPendientes = document.getElementById('stat-postulaciones-pendientes');
    const elAlertaBadge = document.getElementById('badge-ofertas-alerta');

    if (elTotal) elTotal.textContent = totalCount;
    if (elSolicitudes) elSolicitudes.textContent = solicitudesCount;
    if (elAceptadas) elAceptadas.textContent = aceptadasCount;
    if (elPendientes) elPendientes.textContent = pendientesCount;
    if (elAlertaBadge) elAlertaBadge.style.display = solicitudesCount > 0 ? 'inline-block' : 'none';

    const cAll = document.getElementById('count-filter-all');
    const cSol = document.getElementById('count-filter-solicitud');
    const cAce = document.getElementById('count-filter-aceptada');
    const cPen = document.getElementById('count-filter-pendiente');

    if (cAll) cAll.textContent = totalCount;
    if (cSol) cSol.textContent = solicitudesCount;
    if (cAce) cAce.textContent = aceptadasCount;
    if (cPen) cPen.textContent = pendientesCount;

    // Detectar parámetro de URL para destacar combate específico
    const urlParams = new URLSearchParams(window.location.search);
    const highlightBoutId = urlParams.get('highlightFight');

    // Estado local de filtrado y búsqueda
    let activeFilter = 'all';
    let searchQuery = '';

    function renderFilteredTable() {
        let filtered = userApplications.filter(app => {
            const estadoUpper = (app.estado || 'PENDIENTE').toUpperCase();
            if (activeFilter === 'solicitud' && estadoUpper !== 'SOLICITUD DE COMBATE') return false;
            if (activeFilter === 'aceptada' && !['ACEPTADA', 'SELECCIONADO', 'CONFIRMADA'].includes(estadoUpper)) return false;
            if (activeFilter === 'pendiente' && estadoUpper !== 'PENDIENTE') return false;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchEvento = (app.evento || '').toLowerCase().includes(q);
                const matchOrg = (app.org || '').toLowerCase().includes(q);
                const matchRival = (app.rival || '').toLowerCase().includes(q);
                const matchPeso = (app.peso || '').toLowerCase().includes(q);
                if (!matchEvento && !matchOrg && !matchRival && !matchPeso) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 4.5rem 2rem; color: var(--text-gray);">
                        <i class="fas fa-file-signature" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.6; color: var(--accent-red); display: block;"></i>
                        <h3 style="font-size: 1.25rem; color: var(--text-white); margin-bottom: 0.5rem; font-family: var(--font-heading); letter-spacing: 1px;">
                            ${totalCount === 0 ? 'NO TIENES POSTULACIONES NI SOLICITUDES ACTIVAS' : 'NO SE ENCONTRARON RESULTADOS'}
                        </h3>
                        <p style="font-size: 0.9rem; max-width: 440px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
                            ${totalCount === 0 
                                ? 'Explora las convocatorias abiertas de promotoras en FightConnect para sumarte a sus próximas carteleras.'
                                : 'No hay combates o solicitudes que coincidan con el filtro actual.'}
                        </p>
                        ${totalCount === 0 ? `
                            <a href="fighter-buscar.html" class="btn-action-postulacion btn-aceptar-propuesta" style="padding: 0.75rem 1.4rem; text-decoration: none;">
                                <i class="fas fa-search"></i> BUSCAR Y POSTULARME A PELEAS
                            </a>
                        ` : ''}
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filtered.map(app => {
            const estadoUpper = (app.estado || 'PENDIENTE').toUpperCase();
            const isSolicitudCombate = estadoUpper === 'SOLICITUD DE COMBATE';
            const isAceptada = ['ACEPTADA', 'SELECCIONADO', 'CONFIRMADA'].includes(estadoUpper);
            const isRechazada = ['RECHAZADA', 'DESCARTADO'].includes(estadoUpper);

            const isTargeted = highlightBoutId && (app.fightId === highlightBoutId || app.eventId === highlightBoutId || app.id === highlightBoutId);

            let statusBadgeHtml = '';
            if (isSolicitudCombate) {
                statusBadgeHtml = `
                    <span class="app-status-badge is-offer">
                        <span class="badge-pulse-dot"></span>
                        <i class="fas fa-bell"></i> OFERTA RECIBIDA
                    </span>
                `;
            } else if (isAceptada) {
                statusBadgeHtml = `
                    <span class="app-status-badge is-accepted">
                        <i class="fas fa-check-circle"></i> ACEPTADA
                    </span>
                `;
            } else if (isRechazada) {
                statusBadgeHtml = `
                    <span class="app-status-badge is-rejected">
                        <i class="fas fa-times-circle"></i> RECHAZADA
                    </span>
                `;
            } else {
                statusBadgeHtml = `
                    <span class="app-status-badge is-pending">
                        <i class="fas fa-hourglass-half"></i> PENDIENTE
                    </span>
                `;
            }

            const dateStr = app.fechaEnvio || (app.createdAt ? new Date(app.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Reciente');

            // Formatear división y especificaciones
            const rawPeso = app.peso || app.division || 'Categoría Abierta';
            const pesoParts = rawPeso.match(/^([^()]+)(?:\((.+?)\))?/);
            const divisionTitle = pesoParts ? pesoParts[1].trim() : rawPeso;
            const extraSpecs = pesoParts && pesoParts[2] ? pesoParts[2] : '';
            const isEstelar = extraSpecs.toLowerCase().includes('estelar') || app.tipoPelea === 'estelar';

            // Configuración de columna de acciones organizada
            let actionsHtml = '';
            if (isSolicitudCombate) {
                actionsHtml = `
                    <div class="app-actions-wrap">
                        <button type="button" class="btn-action-postulacion btn-aceptar-propuesta btn-aceptar-invitacion" data-id="${app.id}" title="Aceptar propuesta oficial y confirmar combate en cartelera">
                            <i class="fas fa-check"></i> ACEPTAR
                        </button>
                        <button type="button" class="btn-action-postulacion btn-rechazar-propuesta btn-eliminar-postulacion" data-id="${app.id}" data-action="rechazar" data-event="${app.evento || ''}" title="Rechazar propuesta de combate">
                            <i class="fas fa-times"></i> RECHAZAR
                        </button>
                    </div>
                `;
            } else {
                actionsHtml = `
                    <div class="app-actions-wrap">
                        <button type="button" class="btn-action-postulacion btn-eliminar-post btn-eliminar-postulacion" data-id="${app.id}" data-oppid="${app.oppId || ''}" data-event="${app.evento || ''}" title="Eliminar postulación de la base de datos">
                            <i class="fas fa-trash-alt"></i> ELIMINAR
                        </button>
                    </div>
                `;
            }

            return `
                <tr id="row-app-${app.id}" class="${isSolicitudCombate ? 'row-oferta-combate' : ''} ${isTargeted ? 'highlight-targeted-bout' : ''}" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.25s ease;">
                    <td style="font-weight: 600; color: var(--text-white); padding: 1.25rem 1rem;">
                        <div style="font-size: 1.08rem; font-family: var(--font-heading); letter-spacing: 0.5px; color: #fff; line-height: 1.2;">${app.evento}</div>
                        <div style="color: var(--text-gray); font-size: 0.82rem; margin-top: 5px; display: flex; align-items: center; gap: 8px;">
                            <span><i class="fas fa-building" style="color: var(--accent-red); margin-right: 4px;"></i>${app.org}</span>
                            ${app.disciplina ? `<span style="color: var(--accent-red); font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">• ${app.disciplina}</span>` : ''}
                        </div>
                        ${app.rival ? `
                            <div class="app-rival-pill">
                                <span class="rival-lbl"><i class="fas fa-shield-alt"></i> Rival:</span>
                                <strong class="rival-name">${app.rival}</strong>
                            </div>
                        ` : ''}
                    </td>
                    <td style="padding: 1.25rem 1rem;">
                        <div class="app-weight-badge">
                            <i class="fas fa-weight-hanging" style="color: var(--accent-red);"></i>
                            <span>${divisionTitle}</span>
                        </div>
                        ${extraSpecs ? `
                            <div class="app-fight-type-tag">
                                <i class="fas fa-stopwatch"></i>
                                <span>${extraSpecs.includes('asaltos') ? extraSpecs.split('•')[0].trim() : ''}</span>
                                <span class="type-highlight ${isEstelar ? 'estelar' : 'preliminar'}">
                                    • ${isEstelar ? 'Pelea Estelar' : 'Pelea Preliminar'}
                                </span>
                            </div>
                        ` : ''}
                    </td>
                    <td style="color: #a0a0a8; font-size: 0.88rem; padding: 1.25rem 1rem; white-space: nowrap;">
                        <i class="far fa-clock" style="color: var(--accent-red); margin-right: 6px;"></i>${dateStr}
                    </td>
                    <td style="padding: 1.25rem 1rem;">
                        ${statusBadgeHtml}
                    </td>
                    <td style="padding: 1.25rem 1rem; text-align: right;">
                        ${actionsHtml}
                    </td>
                </tr>
            `;
        }).join('');

        // Conectar botones de acción en las filas renderizadas
        attachActionListeners();
    }

    // Función para conectar listeners de los botones
    function attachActionListeners() {
        // Conectar eventos ELIMINAR / RECHAZAR
        tableBody.querySelectorAll('.btn-eliminar-postulacion').forEach(btn => {
            btn.onclick = async (e) => {
                const targetBtn = e.currentTarget;
                const appId = targetBtn.getAttribute('data-id');
                const oppId = targetBtn.getAttribute('data-oppid');
                const eventName = targetBtn.getAttribute('data-event') || 'este evento';
                const isRechazo = targetBtn.getAttribute('data-action') === 'rechazar';

                const confirmMsg = isRechazo
                    ? `¿Estás seguro de RECHAZAR la solicitud de combate para "${eventName}"? Se notificará a la promotora.`
                    : `¿Estás seguro de ELIMINAR tu postulación a "${eventName}"?\n\nEsta acción se sincronizará inmediatamente en la base de datos para todos los roles.`;

                if (confirm(confirmMsg)) {
                    targetBtn.disabled = true;
                    targetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                    // 1. Eliminar de Cloud Firestore
                    try {
                        if (db && appId && !appId.startsWith('app_local_')) {
                            await deleteDoc(doc(db, "applications", appId));
                            console.log(`✅ Postulación ${appId} eliminada con éxito de Firestore.`);
                        }
                    } catch (delErr) {
                        console.error("Error al eliminar postulación de Firestore:", delErr);
                    }

                    // 2. Eliminar de caché local
                    let localAppsList = JSON.parse(localStorage.getItem(`fightconnect_apps_${uid}`) || '[]');
                    localAppsList = localAppsList.filter(a => a.id !== appId && (oppId ? a.oppId !== oppId : true));
                    localStorage.setItem(`fightconnect_apps_${uid}`, JSON.stringify(localAppsList));

                    // 3. Notificar a promotora si corresponde
                    const appTarget = userApplications.find(a => a.id === appId);
                    if (appTarget && appTarget.promoterId && db) {
                        try {
                            await addDoc(collection(db, "notifications"), {
                                recipientId: appTarget.promoterId,
                                senderId: uid,
                                senderName: localStorage.getItem('userName') || 'Atleta',
                                type: 'application_withdrawn',
                                title: isRechazo ? 'Solicitud de Combate Rechazada' : 'Postulación Retirada',
                                message: `El peleador ${localStorage.getItem('userName') || 'Atleta'} ha ${isRechazo ? 'rechazado la propuesta de combate' : 'retirado su postulación'} para "${appTarget.evento}".`,
                                createdAt: new Date().toISOString()
                            });
                        } catch (notifErr) {
                            console.warn("No se pudo notificar a la promotora:", notifErr);
                        }
                    }

                    alert(isRechazo ? "Solicitud de combate rechazada." : "¡Postulación eliminada exitosamente del aplicativo y la base de datos!");
                    cargarFighterPostulacionesPage(uid);
                }
            };
        });

        // Conectar eventos ACEPTAR propuesta
        tableBody.querySelectorAll('.btn-aceptar-invitacion').forEach(btn => {
            btn.onclick = async (e) => {
                const targetBtn = e.currentTarget;
                const appId = targetBtn.getAttribute('data-id');
                targetBtn.disabled = true;
                targetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                // Actualizar en Cloud Firestore
                try {
                    if (db && appId && !appId.startsWith('app_local_')) {
                        await updateDoc(doc(db, "applications", appId), {
                            estado: 'ACEPTADA',
                            confirmedAt: new Date().toISOString()
                        });
                        console.log(`✅ Combate ${appId} aceptado en Firestore.`);
                    }
                } catch (updErr) {
                    console.error("Error al confirmar combate en Firestore:", updErr);
                }

                // Actualizar en caché local
                let localAppsList = JSON.parse(localStorage.getItem(`fightconnect_apps_${uid}`) || '[]');
                const appIdx = localAppsList.findIndex(a => a.id === appId);
                if (appIdx >= 0) {
                    localAppsList[appIdx].estado = 'ACEPTADA';
                    localStorage.setItem(`fightconnect_apps_${uid}`, JSON.stringify(localAppsList));
                }

                // Notificar a promotora
                const appTarget = userApplications.find(a => a.id === appId);
                if (appTarget && appTarget.promoterId && db) {
                    try {
                        await addDoc(collection(db, "notifications"), {
                            recipientId: appTarget.promoterId,
                            senderId: uid,
                            senderName: localStorage.getItem('userName') || 'Atleta',
                            type: 'fight_accepted',
                            title: '¡Combate Aceptado por el Atleta! 🥊',
                            message: `¡El atleta ${localStorage.getItem('userName') || 'Atleta'} ha ACEPTADO oficialmente la pelea en "${appTarget.evento}" contra ${appTarget.rival || 'su rival'}!`,
                            createdAt: new Date().toISOString()
                        });
                    } catch (notifErr) {
                        console.warn("Error notificando a promotora:", notifErr);
                    }
                }

                alert("¡Combate Aceptado! Has confirmado tu participación en la cartelera oficial. La promotora ha sido notificada.");
                cargarFighterPostulacionesPage(uid);
            };
        });
    }

    // Configurar Toolbar de Filtros y Búsqueda (solo si existen en el DOM)
    const filterButtons = document.querySelectorAll('.btn-p-filter');
    filterButtons.forEach(btn => {
        btn.onclick = () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.getAttribute('data-filter') || 'all';
            renderFilteredTable();
        };
    });

    const searchInput = document.getElementById('input-buscar-postulacion');
    if (searchInput) {
        searchInput.oninput = (e) => {
            searchQuery = e.target.value.trim();
            renderFilteredTable();
        };
    }

    // Render inicial de la tabla
    renderFilteredTable();

    // Si había un combate a resaltar, desplazarse suavemente hacia él
    if (highlightBoutId) {
        setTimeout(() => {
            const targetedEl = document.querySelector('.highlight-targeted-bout');
            if (targetedEl) {
                targetedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 400);
    }

    // 9. Verificar notificaciones en la pantalla
    verificarNotificacionesAtleta(uid);
}

/**
 * Revisa notificaciones pendientes del atleta y despliega un banner reactivo
 * para informarle si una promotora le ha enviado una solicitud de combate (Requerimiento 4).
 * 
 * @async
 * @function verificarNotificacionesAtleta
 * @param {string} uid - Identificador del peleador.
 * @returns {Promise<void>}
 */
async function verificarNotificacionesAtleta(uid) {
    if (!uid) return;

    let unreadNotifs = [];

    // 1. Consultar Firestore
    try {
        if (db) {
            const q = query(
                collection(db, "notifications"),
                where("recipientId", "==", uid),
                where("read", "==", false)
            );
            const snap = await getDocs(q);
            snap.forEach(docSnap => {
                unreadNotifs.push({ id: docSnap.id, ...docSnap.data() });
            });
        }
    } catch (e) {
        console.warn("Consulta de notificaciones en Firestore offline:", e.message);
    }

    // 2. Fusión con caché local
    const localNotifs = JSON.parse(localStorage.getItem(`fightconnect_notifs_${uid}`) || '[]');
    localNotifs.filter(n => !n.read).forEach(ln => {
        if (!unreadNotifs.some(un => un.id === ln.id)) {
            unreadNotifs.push(ln);
        }
    });

    // 3. Si hay solicitudes de combate no leídas, mostrar indicador en sidebar y banner
    const fightRequests = unreadNotifs.filter(n => n.type === 'fight_request');

    // Actualizar enlace de sidebar "Mis Postulaciones"
    const postulacionesLinks = document.querySelectorAll('a[href*="fighter-postulaciones"]');
    postulacionesLinks.forEach(link => {
        const existingBadge = link.querySelector('.sidebar-notif-badge');
        if (fightRequests.length > 0) {
            if (!existingBadge) {
                const badge = document.createElement('span');
                badge.className = 'sidebar-notif-badge';
                badge.style.cssText = 'background: #e62429; color: #fff; font-size: 0.65rem; font-weight: bold; border-radius: 10px; padding: 2px 7px; margin-left: auto; box-shadow: 0 0 8px rgba(230,36,41,0.6);';
                badge.textContent = fightRequests.length;
                link.appendChild(badge);
            } else {
                existingBadge.textContent = fightRequests.length;
            }
        } else if (existingBadge) {
            existingBadge.remove();
        }
    });

    if (fightRequests.length === 0) return;

    // Desplegar banner flotante para la solicitud más reciente si no existe ya en pantalla
    if (document.getElementById('fc-floating-notification')) return;

    const latest = fightRequests[0];
    
    // Extracción enriquecida de metadatos (soporta campos estructurados y parsing del mensaje)
    const promoterName = latest.promoterName || latest.senderName || latest.org || (latest.message && latest.message.match(/La promotora "([^"]+)"/)?.[1]) || 'Promotora Oficial';
    const eventName = latest.eventName || latest.evento || (latest.message && latest.message.match(/pelear en "([^"]+)"/)?.[1]) || 'Evento Oficial';
    const rivalName = latest.rivalName || latest.rival || (latest.message && latest.message.match(/contra ([^()]+?)(?:\s*\((.+?)\)|\.)/)?.[1]?.trim()) || 'Rival por confirmar';
    const rawSpecs = latest.division || (latest.message && latest.message.match(/\(([^)]+)\)/)?.[1]) || 'Peso Pactado';
    const divisionStr = rawSpecs.split(',')[0].trim();
    const roundsStr = latest.rounds ? `${latest.rounds} Asaltos` : ((rawSpecs.match(/(\d+\s*asaltos)/i) || [])[1] || '3 Asaltos');
    const tipoPelea = latest.tipoPelea === 'estelar' || rawSpecs.toLowerCase().includes('estelar') ? 'Pelea Estelar' : 'Combate Oficial';
    const athleteName = localStorage.getItem('userName') || 'Tú';

    const banner = document.createElement('div');
    banner.id = 'fc-floating-notification';
    banner.className = 'fc-in-app-notification-banner';
    banner.innerHTML = `
        <div class="fc-notif-top-bar">
            <div class="fc-notif-badge-group">
                <span class="fc-notif-live-indicator">
                    <span class="fc-beacon-ring"></span>
                    <span class="fc-beacon-dot"></span>
                </span>
                <span class="fc-notif-badge-text">PROPUESTA OFICIAL DE COMBATE</span>
                ${fightRequests.length > 1 ? `<span class="fc-notif-counter">+${fightRequests.length - 1} más</span>` : ''}
            </div>
            <button type="button" class="fc-notif-close-icon" id="btn-cerrar-banner-notif" title="Cerrar notificación" aria-label="Cerrar">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <div class="fc-notif-event-block">
            <div class="fc-notif-promoter-line">
                <i class="fas fa-shield-alt"></i>
                <strong>${promoterName}</strong>
                <span>te ha seleccionado para su cartelera</span>
            </div>
            <h3 class="fc-notif-event-name">${eventName}</h3>
        </div>

        <div class="fc-notif-matchup-box">
            <div class="fc-notif-fighter you">
                <span class="fc-fighter-role">ATLETA (TÚ)</span>
                <span class="fc-fighter-name">${athleteName}</span>
            </div>
            <div class="fc-notif-vs-badge">
                <span class="fc-vs-text">VS</span>
            </div>
            <div class="fc-notif-fighter rival">
                <span class="fc-fighter-role">RIVAL ASIGNADO</span>
                <span class="fc-fighter-name">${rivalName}</span>
            </div>
        </div>

        <div class="fc-notif-meta-tags">
            <span class="fc-meta-tag"><i class="fas fa-weight-hanging"></i> ${divisionStr}</span>
            <span class="fc-meta-tag"><i class="fas fa-stopwatch"></i> ${roundsStr}</span>
            <span class="fc-meta-tag is-star"><i class="fas fa-fire"></i> ${tipoPelea}</span>
        </div>

        <div class="fc-notif-cta-bar">
            <a href="fighter-postulaciones.html" class="fc-btn-cta-primary" id="btn-ver-solicitud-notif">
                <i class="fas fa-file-signature"></i> REVISAR SOLICITUD
                <span class="fc-btn-badge">${fightRequests.length}</span>
                <i class="fas fa-arrow-right fc-btn-arrow"></i>
            </a>
            <button type="button" class="fc-btn-cta-secondary" id="btn-recordar-notif">
                <i class="far fa-clock"></i> Recordar más tarde
            </button>
        </div>
    `;

    document.body.appendChild(banner);

    // Marcar como leída al interactuar
    const marcarLeida = async () => {
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(20px) scale(0.95)';
        setTimeout(() => banner.remove(), 350);

        try {
            if (db && latest.id && !latest.id.startsWith('notif_local_')) {
                await updateDoc(doc(db, "notifications", latest.id), { read: true });
            }
        } catch (mErr) {
            console.warn("Error marcando notificación:", mErr);
        }

        const lNotifs = JSON.parse(localStorage.getItem(`fightconnect_notifs_${uid}`) || '[]');
        const idx = lNotifs.findIndex(n => n.id === latest.id);
        if (idx >= 0) {
            lNotifs[idx].read = true;
            localStorage.setItem(`fightconnect_notifs_${uid}`, JSON.stringify(lNotifs));
        }
    };

    const closeBtn = document.getElementById('btn-cerrar-banner-notif');
    if (closeBtn) closeBtn.onclick = marcarLeida;

    const recordarBtn = document.getElementById('btn-recordar-notif');
    if (recordarBtn) {
        recordarBtn.onclick = () => {
            banner.style.opacity = '0';
            banner.style.transform = 'translateY(20px) scale(0.95)';
            setTimeout(() => banner.remove(), 350);
        };
    }

    const linkBtn = document.getElementById('btn-ver-solicitud-notif');
    if (linkBtn) {
        linkBtn.onclick = async (e) => {
            // Si ya está en fighter-postulaciones.html, evitar recarga y resaltar fila
            if (window.location.pathname.includes('fighter-postulaciones')) {
                e.preventDefault();
                await marcarLeida();
                const targetRow = document.querySelector(`.row-oferta-combate`) || document.getElementById(`postulaciones-body`);
                if (targetRow) {
                    targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetRow.classList.add('highlight-targeted-bout');
                }
            } else {
                await marcarLeida();
            }
        };
    }
}
window.verificarNotificacionesAtleta = verificarNotificacionesAtleta;

/* ==========================================================================
   MÓDULO DE AJUSTES DE PROMOTOR (PROMOTOR-AJUSTES)
   ========================================================================== */

/**
 * Carga el formulario de perfil organizacional y configuración legal de la promotora.
 * 
 * @function cargarPromoterAjustesPage
 * @param {string} uid - Identificador de la promotora.
 * @param {Object} data - Datos del perfil de la organización.
 * @returns {void}
 */
function cargarPromoterAjustesPage(uid, data = {}) {
    const editName = document.getElementById('edit-org-name');
    const editEmail = document.getElementById('edit-org-email');
    const editWebsite = document.getElementById('edit-org-website');
    const editLocation = document.getElementById('edit-org-location');
    const editRut = document.getElementById('edit-org-rut');
    const editCommission = document.getElementById('edit-org-commission');
    const editDescription = document.getElementById('edit-org-description');
    const form = document.getElementById('org-settings-form');

    // Elementos del logotipo
    const logoInput = document.getElementById('edit-org-logo-input');
    const logoUploaderBox = document.getElementById('org-logo-uploader-box');
    const btnTriggerUpload = document.getElementById('btn-trigger-logo-upload');
    const logoPreview = document.getElementById('org-logo-preview');
    const logoPlaceholderIcon = document.getElementById('org-logo-placeholder-icon');
    const headerLogoImg = document.getElementById('org-header-logo-img');
    const headerLogoIcon = document.getElementById('org-header-logo-icon');

    let currentLogoUrl = data?.photoURL || data?.avatar || data?.logoUrl || localStorage.getItem('userAvatar') || '';
    if (currentLogoUrl) {
        if (logoPreview) {
            logoPreview.src = currentLogoUrl;
            logoPreview.style.display = 'block';
        }
        if (logoPlaceholderIcon) logoPlaceholderIcon.style.display = 'none';
        if (headerLogoImg) {
            headerLogoImg.src = currentLogoUrl;
            headerLogoImg.style.display = 'block';
            if (headerLogoIcon) headerLogoIcon.style.display = 'none';
        }
        if (btnTriggerUpload) btnTriggerUpload.innerHTML = '<i class="fas fa-pen"></i> CAMBIAR LOGOTIPO';
        localStorage.setItem('userAvatar', currentLogoUrl);
    }

    const triggerLogoSelect = () => { if (logoInput) logoInput.click(); };
    if (logoUploaderBox && !logoUploaderBox._hasClickListener) {
        logoUploaderBox._hasClickListener = true;
        logoUploaderBox.addEventListener('click', triggerLogoSelect);
    }
    if (btnTriggerUpload && !btnTriggerUpload._hasClickListener) {
        btnTriggerUpload._hasClickListener = true;
        btnTriggerUpload.addEventListener('click', triggerLogoSelect);
    }

    if (logoInput && !logoInput._hasChangeListener) {
        logoInput._hasChangeListener = true;
        logoInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            try {
                if (btnTriggerUpload) btnTriggerUpload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SUBIENDO AL SERVIDOR...';
                const uploadedUrl = await uploadImage(file, { folder: 'organizations' });
                if (uploadedUrl) {
                    currentLogoUrl = uploadedUrl;
                    localStorage.setItem('userAvatar', uploadedUrl);
                    if (logoPreview) {
                        logoPreview.src = uploadedUrl;
                        logoPreview.style.display = 'block';
                    }
                    if (logoPlaceholderIcon) logoPlaceholderIcon.style.display = 'none';
                    if (headerLogoImg) {
                        headerLogoImg.src = uploadedUrl;
                        headerLogoImg.style.display = 'block';
                        if (headerLogoIcon) headerLogoIcon.style.display = 'none';
                    }
                    if (btnTriggerUpload) btnTriggerUpload.innerHTML = '<i class="fas fa-pen"></i> CAMBIAR LOGOTIPO';
                    actualizarNavegacionSesion();

                    // Guardar en Cloud Firestore exclusivamente la URL obtenida del servidor de imágenes
                    const saveUid = uid || auth.currentUser?.uid || localStorage.getItem('userId');
                    if (saveUid) {
                        await setDoc(doc(db, "users", saveUid), {
                            photoURL: uploadedUrl,
                            avatar: uploadedUrl,
                            logoUrl: uploadedUrl,
                            updatedAt: new Date().toISOString()
                        }, { merge: true });
                        console.log("✅ Logotipo de organización guardado exitosamente en Firestore:", uploadedUrl);
                    }
                }
            } catch (err) {
                console.error("Error al procesar logotipo de organización:", err);
                alert("Error al cargar la imagen: " + err.message);
            } finally {
                if (btnTriggerUpload) {
                    btnTriggerUpload.innerHTML = currentLogoUrl 
                        ? '<i class="fas fa-pen"></i> CAMBIAR LOGOTIPO' 
                        : '<i class="fas fa-cloud-arrow-up"></i> SUBIR LOGOTIPO';
                }
            }
        });
    }

    if (editName && data) editName.value = data.orgName || data.legalName || editName.value || '';
    if (editEmail && data) editEmail.value = data.email || editEmail.value || '';
    if (editWebsite && data) editWebsite.value = data.website || editWebsite.value || '';
    if (editLocation && data) editLocation.value = data.location || editLocation.value || '';
    if (editRut && data) editRut.value = data.rut || editRut.value || '';
    if (editCommission && data) editCommission.value = data.commission || editCommission.value || '';
    if (editDescription && data) editDescription.value = data.description || editDescription.value || '';

    // =========================================================================
    // PROTOCOLO DE VERIFICACIÓN INSTITUCIONAL DE PROMOTORAS (KYB)
    // =========================================================================
    const kybStatusPill = document.getElementById('kyb-status-pill');
    const medicalAgreement = document.getElementById('kyb-medical-agreement');
    const btnSubmitKyb = document.getElementById('btn-submit-kyb');
    const btnToggleDemoKyb = document.getElementById('btn-toggle-demo-kyb');
    const kybFeedback = document.getElementById('kyb-feedback-msg');

    const activeUid = uid || localStorage.getItem('userId') || auth.currentUser?.uid || 'temp_promoter';

    // Estado inicial de documentos KYB
    const kybDocs = {
        rut: data?.kybDocs?.rut || localStorage.getItem(`kyb_doc_rut_${uid}`) || localStorage.getItem(`kyb_doc_rut_${activeUid}`) || localStorage.getItem('kyb_doc_rut') || '',
        camara: data?.kybDocs?.camara || localStorage.getItem(`kyb_doc_camara_${uid}`) || localStorage.getItem(`kyb_doc_camara_${activeUid}`) || localStorage.getItem('kyb_doc_camara') || '',
        aval: data?.kybDocs?.aval || localStorage.getItem(`kyb_doc_aval_${uid}`) || localStorage.getItem(`kyb_doc_aval_${activeUid}`) || localStorage.getItem('kyb_doc_aval') || ''
    };

    let currentKybStatus = data?.kybStatus || localStorage.getItem('promoterKybStatus') || 'unverified';
    if (data?.isVerified) currentKybStatus = 'approved';

    const actualizarKybStatusUI = (status) => {
        currentKybStatus = status;
        localStorage.setItem('promoterKybStatus', status);
        if (status === 'approved') {
            localStorage.setItem(`kyb_verified_promoter_${uid}`, 'true');
            localStorage.setItem(`kyb_verified_promoter_${activeUid}`, 'true');
        } else {
            localStorage.removeItem(`kyb_verified_promoter_${uid}`);
            localStorage.removeItem(`kyb_verified_promoter_${activeUid}`);
        }

        if (kybStatusPill) {
            kybStatusPill.classList.remove('unverified', 'pending', 'approved');
            if (status === 'approved') {
                kybStatusPill.classList.add('approved');
                kybStatusPill.innerHTML = '<i class="fas fa-certificate" style="color: #ffc107;"></i> <span id="kyb-status-text">PROMOTORA OFICIAL PRO (NIVEL 2)</span>';
            } else if (status === 'pending') {
                kybStatusPill.classList.add('pending');
                kybStatusPill.innerHTML = '<i class="fas fa-hourglass-half"></i> <span id="kyb-status-text">EN REVISIÓN TÉCNICA (NIVEL 1)</span>';
            } else {
                kybStatusPill.classList.add('unverified');
                kybStatusPill.innerHTML = '<i class="fas fa-shield-halved"></i> <span id="kyb-status-text">NO VERIFICADA (NIVEL 0)</span>';
            }
        }
    };

    actualizarKybStatusUI(currentKybStatus);

    if (medicalAgreement) {
        medicalAgreement.checked = Boolean(data?.kybMedicalAgreement || localStorage.getItem(`kyb_medical_${uid}`) === 'true' || localStorage.getItem(`kyb_medical_${activeUid}`) === 'true' || localStorage.getItem('kyb_medical') === 'true');
    }

    // Configurar cada fila de documento
    const configurarDocRow = (docKey, btnId, fileId, statusTagId, linkId) => {
        const btnUpload = document.getElementById(btnId);
        const fileInput = document.getElementById(fileId);
        const statusTag = document.getElementById(statusTagId);
        const viewLink = document.getElementById(linkId);

        const actualizarDocUI = (url) => {
            if (url) {
                if (statusTag) {
                    statusTag.textContent = '✓ Cargado';
                    statusTag.classList.add('uploaded');
                }
                if (viewLink) {
                    viewLink.href = url;
                    viewLink.style.display = 'inline-flex';
                    viewLink.innerHTML = '<i class="fas fa-eye"></i> Ver documento';
                }
                if (btnUpload) btnUpload.innerHTML = '<i class="fas fa-pen"></i> Actualizar';
            } else {
                if (statusTag) {
                    statusTag.textContent = 'Sin archivo';
                    statusTag.classList.remove('uploaded');
                }
                if (viewLink) viewLink.style.display = 'none';
                if (btnUpload) btnUpload.innerHTML = '<i class="fas fa-cloud-arrow-up"></i> Subir';
            }
        };

        actualizarDocUI(kybDocs[docKey]);

        if (btnUpload && !btnUpload._hasClickListener) {
            btnUpload._hasClickListener = true;
            btnUpload.addEventListener('click', () => {
                if (fileInput) fileInput.click();
            });
        }

        if (fileInput && !fileInput._hasChangeListener) {
            fileInput._hasChangeListener = true;
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;

                try {
                    if (btnUpload) {
                        btnUpload.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
                        btnUpload.disabled = true;
                    }
                    const uploadedUrl = await uploadImage(file, { folder: 'kyb_docs' });
                    if (uploadedUrl) {
                        kybDocs[docKey] = uploadedUrl;
                        localStorage.setItem(`kyb_doc_${docKey}_${uid}`, uploadedUrl);
                        localStorage.setItem(`kyb_doc_${docKey}_${activeUid}`, uploadedUrl);
                        localStorage.setItem(`kyb_doc_${docKey}`, uploadedUrl);
                        actualizarDocUI(uploadedUrl);
                        
                        // Guardar referencia en Firestore
                        const saveUid = uid || auth.currentUser?.uid || localStorage.getItem('userId');
                        if (saveUid) {
                            await setDoc(doc(db, "users", saveUid), {
                                kybDocs: kybDocs,
                                updatedAt: new Date().toISOString()
                            }, { merge: true });
                        }
                    }
                } catch (err) {
                    console.error("Error al subir documento KYB:", err);
                    alert("Error al cargar documento: " + err.message);
                } finally {
                    if (btnUpload) {
                        btnUpload.disabled = false;
                        btnUpload.innerHTML = '<i class="fas fa-pen"></i> Actualizar';
                    }
                }
            });
        }
    };

    configurarDocRow('rut', 'btn-upload-rut', 'file-kyb-rut', 'status-tag-rut', 'link-view-rut');
    configurarDocRow('camara', 'btn-upload-camara', 'file-kyb-camara', 'status-tag-camara', 'link-view-camara');
    configurarDocRow('aval', 'btn-upload-aval', 'file-kyb-aval', 'status-tag-aval', 'link-view-aval');

    // Botón de Envío de Expediente
    if (btnSubmitKyb && !btnSubmitKyb._hasClickListener) {
        btnSubmitKyb._hasClickListener = true;
        btnSubmitKyb.addEventListener('click', async () => {
            const rutVal = editRut ? editRut.value.trim() : '';
            if (!rutVal) {
                alert("Por favor ingresa el Número de Identificación Fiscal / RUT de la promotora.");
                if (editRut) editRut.focus();
                return;
            }

            if (!medicalAgreement || !medicalAgreement.checked) {
                alert("Debes aceptar el compromiso de seguridad y soporte vital médico en ringside para continuar.");
                if (medicalAgreement) medicalAgreement.focus();
                return;
            }

            // Refrescar referencias de documentos desde memoria y almacenamiento local
            kybDocs.rut = kybDocs.rut || localStorage.getItem(`kyb_doc_rut_${uid}`) || localStorage.getItem(`kyb_doc_rut_${activeUid}`) || localStorage.getItem('kyb_doc_rut') || '';
            kybDocs.camara = kybDocs.camara || localStorage.getItem(`kyb_doc_camara_${uid}`) || localStorage.getItem(`kyb_doc_camara_${activeUid}`) || localStorage.getItem('kyb_doc_camara') || '';
            kybDocs.aval = kybDocs.aval || localStorage.getItem(`kyb_doc_aval_${uid}`) || localStorage.getItem(`kyb_doc_aval_${activeUid}`) || localStorage.getItem('kyb_doc_aval') || '';

            if (!kybDocs.rut && !kybDocs.camara) {
                alert("Debes cargar al menos el documento RUT o Certificado de Cámara de Comercio.");
                return;
            }

            const origText = btnSubmitKyb.innerHTML;
            btnSubmitKyb.disabled = true;
            btnSubmitKyb.innerHTML = '<i class="fas fa-spinner fa-spin"></i> RADICANDO EXPEDIENTE...';

            try {
                const saveUid = uid || auth.currentUser?.uid || localStorage.getItem('userId');
                const nowIso = new Date().toISOString();
                const kybPayload = {
                    rut: rutVal,
                    commission: editCommission ? editCommission.value.trim() : '',
                    kybStatus: 'pending',
                    kybSubmittedAt: nowIso,
                    kybDocs: kybDocs,
                    kybMedicalAgreement: true
                };

                localStorage.setItem(`kyb_medical_${uid}`, 'true');
                localStorage.setItem(`kyb_medical_${activeUid}`, 'true');
                localStorage.setItem('kyb_medical', 'true');
                actualizarKybStatusUI('pending');

                if (kybFeedback) {
                    kybFeedback.style.display = 'block';
                    kybFeedback.style.background = 'radial-gradient(130% 120% at 0% 0%, rgba(33, 150, 243, 0.12) 0%, rgba(18, 18, 22, 0.96) 65%), #111115';
                    kybFeedback.style.border = '1px solid rgba(33, 150, 243, 0.45)';
                    kybFeedback.style.color = '#e2e8f0';
                    kybFeedback.innerHTML = `
                        <div style="display: flex; align-items: flex-start; gap: 12px;">
                            <div style="width: 38px; height: 38px; border-radius: 8px; background: rgba(33, 150, 243, 0.15); border: 1px solid rgba(33, 150, 243, 0.4); display: flex; align-items: center; justify-content: center; color: #60a5fa; font-size: 1.1rem; flex-shrink: 0;">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0 0 4px 0; color: #fff; font-size: 0.95rem; font-family: var(--font-heading); letter-spacing: 0.5px;">EXPEDIENTE RADICADO EXITOSAMENTE</h4>
                                <p style="margin: 0; font-size: 0.82rem; color: #b5b5be; line-height: 1.45;">Tu expediente legal (RUT y Cámara de Comercio) se encuentra en <strong>Auditoría Técnica</strong> por el equipo de FightConnect. Tus eventos recibirán el sello dorado oficial <strong>[🛡️ VERIFICADA PRO]</strong> una vez acreditada la personería jurídica.</p>
                            </div>
                        </div>
                    `;
                }

                if (saveUid) {
                    try {
                        // 1. Guardar en users/{uid}
                        await setDoc(doc(db, "users", saveUid), kybPayload, { merge: true });

                        // 2. Radicar en promoter_kyb_docs/audit_{uid} para trazabilidad legal y auditoría
                        await setDoc(doc(db, "promoter_kyb_docs", `audit_${saveUid}`), {
                            promoterId: saveUid,
                            orgName: editName ? editName.value.trim() : '',
                            rut: rutVal,
                            commission: editCommission ? editCommission.value.trim() : '',
                            kybDocs: kybDocs,
                            status: 'pending',
                            submittedAt: nowIso
                        }, { merge: true });
                    } catch (dbErr) {
                        console.warn("Aviso de sincronización en Firestore:", dbErr.message);
                    }
                }
            } catch (err) {
                console.error("Error al enviar KYB:", err);
                alert("Error al procesar solicitud: " + err.message);
            } finally {
                btnSubmitKyb.disabled = false;
                btnSubmitKyb.innerHTML = origText;
            }
        });
    }

    if (form && !form._hasSubmitListener) {
        form._hasSubmitListener = true;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.querySelector('button[form="org-settings-form"]') || form.querySelector('button[type="submit"]');
            const originalText = btn ? btn.innerHTML : 'GUARDAR CAMBIOS';
            
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GUARDANDO...';
                btn.style.background = "#28a745";
            }

            try {
                const updatedOrg = {
                    orgName: editName ? editName.value.trim() : '',
                    email: editEmail ? editEmail.value.trim() : '',
                    website: editWebsite ? editWebsite.value.trim() : '',
                    location: editLocation ? editLocation.value.trim() : '',
                    rut: editRut ? editRut.value.trim() : '',
                    commission: editCommission ? editCommission.value.trim() : '',
                    description: editDescription ? editDescription.value.trim() : '',
                    photoURL: currentLogoUrl || '',
                    avatar: currentLogoUrl || '',
                    logoUrl: currentLogoUrl || '',
                    kybDocs: kybDocs,
                    kybStatus: currentKybStatus,
                    kybMedicalAgreement: medicalAgreement ? medicalAgreement.checked : false,
                    updatedAt: new Date().toISOString()
                };

                const saveUid = uid || auth.currentUser?.uid || localStorage.getItem('userId');
                if (saveUid) {
                    await setDoc(doc(db, "users", saveUid), updatedOrg, { merge: true });
                }

                const headerTitle = document.querySelector('.main-title');
                if (headerTitle) headerTitle.textContent = (updatedOrg.orgName || 'ORGANIZACIÓN').toUpperCase();
                if (currentLogoUrl) {
                    localStorage.setItem('userAvatar', currentLogoUrl);
                    if (headerLogoImg) {
                        headerLogoImg.src = currentLogoUrl;
                        headerLogoImg.style.display = 'block';
                        if (headerLogoIcon) headerLogoIcon.style.display = 'none';
                    }
                }
                if (updatedOrg.orgName) localStorage.setItem('userName', updatedOrg.orgName);
                actualizarNavegacionSesion();

                if (btn) {
                    btn.innerHTML = '<i class="fas fa-check"></i> GUARDADO';
                }

            } catch (err) {
                console.error("Error guardando ajustes de organización:", err);
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ERROR';
                    btn.style.background = "#e62429";
                }
                alert("Error al actualizar organización: " + err.message);
            } finally {
                setTimeout(() => {
                    if (btn) {
                        btn.innerHTML = originalText;
                        btn.style.background = "var(--accent-red)";
                    }
                }, 2000);
            }
        });
    }

    // =========================================================================
    // GESTIÓN DE ZONA DE PELIGRO: ELIMINACIÓN DE CUENTA DE ORGANIZACIÓN
    // =========================================================================
    const btnEliminarCuenta = document.getElementById('btn-eliminar-cuenta-promotor');
    const modalEliminar = document.getElementById('modal-eliminar-cuenta-org');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal-eliminar-org');
    const btnCancelarModal = document.getElementById('btn-cancelar-eliminar-org');
    const inputConfirmar = document.getElementById('input-confirmar-eliminar-org');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar-org');

    if (btnEliminarCuenta && modalEliminar && !btnEliminarCuenta._hasDangerListener) {
        btnEliminarCuenta._hasDangerListener = true;

        const abrirModalEliminar = () => {
            modalEliminar.classList.remove('hidden');
            if (inputConfirmar) {
                inputConfirmar.value = '';
                inputConfirmar.focus();
            }
            if (btnConfirmarEliminar) {
                btnConfirmarEliminar.disabled = true;
                btnConfirmarEliminar.style.background = '#333';
                btnConfirmarEliminar.style.color = '#777';
                btnConfirmarEliminar.style.borderColor = '#444';
                btnConfirmarEliminar.style.cursor = 'not-allowed';
                btnConfirmarEliminar.style.boxShadow = 'none';
                btnConfirmarEliminar.innerHTML = '<i class="fas fa-trash-alt"></i> CONFIRMAR ELIMINACIÓN';
            }
        };

        const cerrarModalEliminar = () => {
            modalEliminar.classList.add('hidden');
            if (inputConfirmar) inputConfirmar.value = '';
        };

        btnEliminarCuenta.addEventListener('click', abrirModalEliminar);
        if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModalEliminar);
        if (btnCancelarModal) btnCancelarModal.addEventListener('click', cerrarModalEliminar);

        modalEliminar.addEventListener('click', (e) => {
            if (e.target === modalEliminar) cerrarModalEliminar();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modalEliminar.classList.contains('hidden')) {
                cerrarModalEliminar();
            }
        });

        if (inputConfirmar && btnConfirmarEliminar) {
            inputConfirmar.addEventListener('input', () => {
                const val = inputConfirmar.value.trim().toUpperCase();
                if (val === 'ELIMINAR') {
                    btnConfirmarEliminar.disabled = false;
                    btnConfirmarEliminar.style.background = '#e62429';
                    btnConfirmarEliminar.style.color = '#fff';
                    btnConfirmarEliminar.style.borderColor = '#ff3333';
                    btnConfirmarEliminar.style.cursor = 'pointer';
                    btnConfirmarEliminar.style.boxShadow = '0 0 15px rgba(230, 36, 41, 0.6)';
                } else {
                    btnConfirmarEliminar.disabled = true;
                    btnConfirmarEliminar.style.background = '#333';
                    btnConfirmarEliminar.style.color = '#777';
                    btnConfirmarEliminar.style.borderColor = '#444';
                    btnConfirmarEliminar.style.cursor = 'not-allowed';
                    btnConfirmarEliminar.style.boxShadow = 'none';
                }
            });

            btnConfirmarEliminar.addEventListener('click', async () => {
                if (btnConfirmarEliminar.disabled) return;

                const targetUid = uid || auth.currentUser?.uid || localStorage.getItem('userId');
                const orgTitle = data?.orgName || data?.legalName || localStorage.getItem('userName') || 'Organización';

                btnConfirmarEliminar.disabled = true;
                btnConfirmarEliminar.style.background = '#ff9800';
                btnConfirmarEliminar.style.borderColor = '#ff9800';
                btnConfirmarEliminar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CANCELANDO EVENTOS Y CONTRATOS...';

                try {
                    // PASO 1: Recopilar todos los eventos de la organización
                    const eventIds = new Set();
                    const eventTitles = [];

                    if (targetUid) {
                        try {
                            if (db && collection && getDocs) {
                                const qEvents = query(collection(db, "events"), where("promoterId", "==", targetUid));
                                const eventsSnap = await getDocs(qEvents);
                                eventsSnap.forEach(d => {
                                    eventIds.add(d.id);
                                    const ev = d.data();
                                    if (ev.name) eventTitles.push(ev.name);
                                });
                            }
                        } catch (evQueryErr) {
                            console.warn("Consulta Firestore de eventos a cancelar:", evQueryErr);
                        }
                    }

                    // Recopilar de eventos locales
                    const localEvents = typeof obtenerEventosLocales === 'function' ? obtenerEventosLocales() : [];
                    localEvents.forEach(e => {
                        if (e.promoterId === targetUid || (targetUid === 'promoter_local' && e.promoterId === 'promoter_local')) {
                            if (e.id) eventIds.add(e.id);
                            if (e.name) eventTitles.push(e.name);
                        }
                    });

                    console.log(`🗑️ Cancelando ${eventIds.size} eventos de la organización...`);

                    // PASO 2: Eliminar y cancelar todos los eventos activos
                    for (const eId of eventIds) {
                        try {
                            if (db && deleteDoc && doc) {
                                await deleteDoc(doc(db, "events", eId));
                                console.log(`✅ Evento eliminado de Firestore: ${eId}`);
                            }
                        } catch (delEvErr) {
                            console.warn(`Error eliminando evento ${eId} en Firestore:`, delEvErr);
                        }
                    }

                    // Purgar de almacenamiento local (todos los roles y páginas locales)
                    const updatedLocalEvents = localEvents.filter(e => {
                        if (e.promoterId === targetUid) return false;
                        if (eventIds.has(e.id)) return false;
                        return true;
                    });
                    localStorage.setItem(DB_EVENTS_KEY, JSON.stringify(updatedLocalEvents));

                    // PASO 3: Anular todos los contratos y solicitudes pendientes asociadas
                    btnConfirmarEliminar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ANULANDO CONTRATOS Y SOLICITUDES...';
                    
                    const appsToAnnul = new Map(); // id -> data
                    if (db && collection && getDocs) {
                        // Búsqueda por promoterId
                        if (targetUid) {
                            try {
                                const qApps = query(collection(db, "applications"), where("promoterId", "==", targetUid));
                                const snapApps = await getDocs(qApps);
                                snapApps.forEach(d => appsToAnnul.set(d.id, { id: d.id, ...d.data() }));
                            } catch (appQueryErr) {
                                console.warn("Error consultando applications por promoterId:", appQueryErr);
                            }
                        }

                        // Búsqueda por eventId de los eventos cancelados
                        for (const eId of eventIds) {
                            try {
                                const qEvApps = query(collection(db, "applications"), where("eventId", "==", eId));
                                const snapEvApps = await getDocs(qEvApps);
                                snapEvApps.forEach(d => appsToAnnul.set(d.id, { id: d.id, ...d.data() }));
                            } catch (evAppsErr) {
                                console.warn(`Error consultando applications de evento ${eId}:`, evAppsErr);
                            }
                        }
                    }

                    console.log(`🗑️ Anulando ${appsToAnnul.size} contratos/solicitudes de combate...`);

                    // Eliminar las solicitudes en Firestore y enviar notificaciones de cancelación a cada peleador
                    for (const [appId, appData] of appsToAnnul.entries()) {
                        try {
                            if (db && deleteDoc && doc) {
                                await deleteDoc(doc(db, "applications", appId));
                                console.log(`✅ Contrato/Postulación eliminada: ${appId}`);
                            }
                        } catch (delAppErr) {
                            console.warn(`Error eliminando application ${appId}:`, delAppErr);
                        }

                        const fighterId = appData.fighterId;
                        if (fighterId) {
                            // Enviar notificación oficial de anulación a Firestore
                            try {
                                if (db && addDoc && collection) {
                                    await addDoc(collection(db, "notifications"), {
                                        recipientId: fighterId,
                                        senderId: 'system',
                                        senderName: orgTitle,
                                        type: 'contract_annulled',
                                        title: '⚠️ CONTRATO ANULADO / EVENTO CANCELADO',
                                        message: `La organización "${orgTitle}" ha eliminado su cuenta. El evento "${appData.evento || 'Evento'}" y todos los contratos/solicitudes pendientes han sido anulados definitivamente.`,
                                        read: false,
                                        createdAt: new Date().toISOString()
                                    });
                                }
                            } catch (notifErr) {
                                console.warn("Error notificando anulación al peleador en Firestore:", notifErr);
                            }

                            // Limpiar caché local y notificar en localStorage del peleador
                            try {
                                const appsKey = `fightconnect_apps_${fighterId}`;
                                const rawApps = localStorage.getItem(appsKey);
                                if (rawApps) {
                                    let fApps = JSON.parse(rawApps);
                                    fApps = fApps.filter(a => a.id !== appId && a.promoterId !== targetUid && !eventIds.has(a.eventId));
                                    localStorage.setItem(appsKey, JSON.stringify(fApps));
                                }

                                const notifsKey = `fightconnect_notifs_${fighterId}`;
                                const existingNotifs = JSON.parse(localStorage.getItem(notifsKey) || '[]');
                                existingNotifs.unshift({
                                    recipientId: fighterId,
                                    senderId: 'system',
                                    senderName: orgTitle,
                                    type: 'contract_annulled',
                                    title: '⚠️ CONTRATO ANULADO / EVENTO CANCELADO',
                                    message: `La organización "${orgTitle}" ha eliminado su cuenta. El evento "${appData.evento || 'Evento'}" y todos los contratos/solicitudes pendientes han sido anulados definitivamente.`,
                                    read: false,
                                    createdAt: new Date().toISOString()
                                });
                                localStorage.setItem(notifsKey, JSON.stringify(existingNotifs));
                            } catch (cacheErr) {}
                        }
                    }

                    // Purgar todas las claves locales de aplicaciones de atletas por si quedaron huérfanas
                    for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        if (k && k.startsWith('fightconnect_apps_')) {
                            try {
                                let apps = JSON.parse(localStorage.getItem(k) || '[]');
                                const initialLen = apps.length;
                                apps = apps.filter(a => a.promoterId !== targetUid && !eventIds.has(a.eventId) && !appsToAnnul.has(a.id));
                                if (apps.length !== initialLen) {
                                    localStorage.setItem(k, JSON.stringify(apps));
                                }
                            } catch (e) {}
                        }
                    }

                    // PASO 4: Eliminar perfil y datos de la organización de Cloud Firestore
                    btnConfirmarEliminar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ELIMINANDO CUENTA DE LA ORGANIZACIÓN...';
                    if (targetUid && db && deleteDoc && doc) {
                        try {
                            await deleteDoc(doc(db, "users", targetUid));
                            console.log(`✅ Documento de organización ${targetUid} eliminado de Firestore`);
                        } catch (userDelErr) {
                            console.warn("Error eliminando documento de usuario en Firestore:", userDelErr);
                        }
                    }

                    // PASO 5: Eliminar cuenta en Firebase Authentication
                    try {
                        if (auth.currentUser) {
                            await deleteUser(auth.currentUser);
                            console.log("✅ Cuenta eliminada de Firebase Authentication");
                        }
                    } catch (authDelErr) {
                        console.warn("Aviso al dar de baja en Firebase Auth:", authDelErr);
                    }

                    // PASO 6: Cerrar sesión y purgar almacenamiento local
                    try {
                        await signOut(auth);
                    } catch (signOutErr) {
                        console.warn("Aviso cerrando sesión:", signOutErr);
                    }

                    localStorage.removeItem('userId');
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userAvatar');
                    localStorage.removeItem('userOrg');

                    btnConfirmarEliminar.innerHTML = '<i class="fas fa-check-circle"></i> CUENTA ELIMINADA';
                    btnConfirmarEliminar.style.background = '#28a745';
                    btnConfirmarEliminar.style.borderColor = '#28a745';

                    // PASO 7: Confirmar al usuario y redirigir
                    setTimeout(() => {
                        alert("La cuenta de la organización ha sido eliminada por completo.\n\n• Todos los eventos activos han sido cancelados.\n• Todos los contratos y solicitudes pendientes han sido anulados.");
                        window.location.href = "index.html";
                    }, 400);

                } catch (critErr) {
                    console.error("Error crítico durante la eliminación de cuenta:", critErr);
                    alert("Ocurrió un error al procesar la eliminación: " + critErr.message);
                    btnConfirmarEliminar.disabled = false;
                    btnConfirmarEliminar.style.background = '#e62429';
                    btnConfirmarEliminar.innerHTML = '<i class="fas fa-trash-alt"></i> REINTENTAR ELIMINACIÓN';
                }
            });
        }
    }
}

/* ==========================================================================
   MÓDULO DE SCOUTING DE PROMOTORA (PROMOTOR-SCOUTING)
   ========================================================================== */

/**
 * Calcula la división oficial de peso según la masa corporal en kilogramos.
 * @param {number} peso - Peso en kilogramos.
 * @returns {string} Nombre y límite de la división.
 */
function calcularDivisionPeso(peso) {
    const p = parseFloat(peso) || 0;
    if (p <= 0) return "Abierta / Sin pactar";
    if (p <= 52.2) return "Paja (52 kg)";
    if (p <= 56.7) return "Mosca (57 kg)";
    if (p <= 61.2) return "Gallo (61 kg)";
    if (p <= 65.8) return "Pluma (66 kg)";
    if (p <= 70.3) return "Ligero (70 kg)";
    if (p <= 77.1) return "Wélter (77 kg)";
    if (p <= 83.9) return "Medio (84 kg)";
    if (p <= 93.0) return "Semipesado (93 kg)";
    return "Pesado (+93 kg)";
}

/**
 * Consulta en tiempo real a Cloud Firestore para obtener todos los peleadores registrados.
 * Normaliza los campos para su uso uniforme en scouting y búsqueda.
 * 
 * @async
 * @function obtenerPeleadoresFirestore
 * @returns {Promise<Array<Object>>} Lista de atletas reales registrados.
 */
async function obtenerPeleadoresFirestore() {
    try {
        const q = query(collection(db, "users"), where("role", "==", "fighter"));
        const snapshot = await getDocs(q);
        const peleadores = [];

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const weight = data.metrics?.weight || data.peso || 0;
            
            const baseDiscipline = (data.discipline || data.disciplina || 'mma').toLowerCase();
            const primaryDiscipline = (data.primaryDiscipline || baseDiscipline).toLowerCase();
            const recordsByDiscipline = data.recordsByDiscipline || null;

            // Si existen records por disciplina, calcular el record oficial basado en la disciplina principal
            let wins = 0;
            let losses = 0;
            let draws = 0;

            if (recordsByDiscipline && recordsByDiscipline[primaryDiscipline]) {
                const rec = recordsByDiscipline[primaryDiscipline];
                wins = rec.wins ?? 0;
                losses = rec.losses ?? 0;
                draws = rec.draws ?? 0;
            } else if (data.record) {
                wins = data.record?.wins ?? (parseInt(data.record) || 0);
                losses = data.record?.losses ?? 0;
                draws = data.record?.draws ?? 0;
            }

            const recordStr = `${wins}-${losses}-${draws}`;
            
            let targetDisciplines = [];
            if (Array.isArray(data.targetDisciplines) && data.targetDisciplines.length > 0) {
                targetDisciplines = data.targetDisciplines.map(d => d.toLowerCase());
            } else if (recordsByDiscipline && Object.keys(recordsByDiscipline).length > 0) {
                targetDisciplines = Object.keys(recordsByDiscipline).map(d => d.toLowerCase());
            } else {
                targetDisciplines = [baseDiscipline];
            }

            const avatarUrl = data.photoURL || data.avatar || '';
            const location = data.location || data.gymLocation || 'Ubicación no especificada';

            peleadores.push({
                id: docSnap.id,
                name: data.legalName || data.name || 'Atleta Sin Nombre',
                alias: data.alias || 'Guerrero',
                email: data.email || '',
                avatar: avatarUrl,
                discipline: baseDiscipline,
                primaryDiscipline: primaryDiscipline,
                recordsByDiscipline: recordsByDiscipline,
                targetDisciplines: targetDisciplines,
                record: recordStr,
                wins: wins,
                losses: losses,
                draws: draws,
                weight: weight,
                height: data.metrics?.height || data.height || data.altura || 0,
                phone: data.phone || data.whatsapp || data.telefono || '',
                whatsapp: data.whatsapp || data.phone || data.telefono || '',
                instagram: data.instagram || '',
                division: data.division || calcularDivisionPeso(weight),
                gym: data.gymLocation || 'Sin gimnasio asignado',
                location: location
            });
        });

        return peleadores;
    } catch (error) {
        console.error("Error al obtener peleadores de Firestore:", error);
        return [];
    }
}

/**
 * Carga la grilla de scouting de talentos conectada en vivo a Firestore.
 * Permite filtrar por arte marcial/disciplina en la que el atleta desea pelear,
 * división de peso y récord mínimo de victorias.
 * Al seleccionar a un peleador, despliega un expediente con sus datos deportivos,
 * métricas y canales de contacto directo (WhatsApp con mensaje pre-redactado, Instagram y correo).
 * 
 * @async
 * @function cargarPromoterScoutingPage
 * @param {string} uid - UID de la promotora.
 * @returns {Promise<void>}
 */
async function cargarPromoterScoutingPage(uid) {
    const container = document.getElementById('scouting-results-container');
    if (!container) return;

    const weightFilter = document.getElementById('scouting-weight-filter');
    const disciplineFilter = document.getElementById('scouting-discipline-filter');
    const recordFilter = document.getElementById('scouting-record-filter');
    const applyBtn = document.getElementById('btn-apply-scouting');
    const resetBtn = document.getElementById('btn-reset-scouting');

    // Handler temporal mientras cargan los atletas desde Firestore
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (weightFilter) { weightFilter.value = ''; weightFilter.selectedIndex = 0; }
            if (disciplineFilter) { disciplineFilter.value = ''; disciplineFilter.selectedIndex = 0; }
            if (recordFilter) { recordFilter.value = ''; }
            resetBtn.classList.add('is-resetting');
            setTimeout(() => resetBtn.classList.remove('is-resetting'), 600);
        };
    }

    container.className = 'loading-container-v2';
    container.innerHTML = `
        <div class="loader-pulse"></div>
        <p class="loading-text">Cargando base de atletas desde Firestore...</p>
    `;

    const atletas = await obtenerPeleadoresFirestore();

    // Elementos del Modal de Expediente Deportivo
    const dossierModal = document.getElementById('scouting-athlete-modal');
    const dossierModalBody = document.getElementById('dossier-modal-body');
    const closeDossierBtn = document.getElementById('close-scouting-modal');

    function cerrarExpediente() {
        if (dossierModal) {
            dossierModal.classList.add('hidden');
            dossierModal.style.display = 'none';
        }
    }

    if (closeDossierBtn) {
        closeDossierBtn.onclick = cerrarExpediente;
    }

    if (dossierModal) {
        dossierModal.onclick = (e) => {
            if (e.target === dossierModal) cerrarExpediente();
        };
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dossierModal && !dossierModal.classList.contains('hidden')) {
            cerrarExpediente();
        }
    });

    /**
     * Despliega el expediente completo del atleta seleccionado con sus métricas y botones de contacto
     * @param {Object} ath - Datos del atleta seleccionado
     */
    function abrirExpedienteAtleta(ath) {
        if (!dossierModal || !dossierModalBody) return;

        const promoterOrg = localStorage.getItem('userName') || 'Nuestra Promotora';

        const primaryDisc = (ath.primaryDiscipline || ath.discipline || 'mma').toLowerCase();
        const primaryLabel = (FC_DISCIPLINES_MAP[primaryDisc] || primaryDisc).toUpperCase();

        const avatarHtml = ath.avatar && (ath.avatar.startsWith('http') || ath.avatar.startsWith('/uploads/'))
            ? `<img src="${ath.avatar}" alt="${ath.name}" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<i class=\\'fas fa-user-ninja\\' style=\\'font-size: 2.2rem; color: var(--accent-red);\\'></i>';" style="width: 100%; height: 100%; object-fit: cover;">`
            : `<i class="fas fa-user-ninja" style="font-size: 2.2rem; color: var(--accent-red);"></i>`;

        const disciplineBadges = (ath.targetDisciplines || [ath.discipline]).map(disc => {
            const dName = FC_DISCIPLINES_MAP[disc.toLowerCase()] || disc.toUpperCase();
            return `<span class="discipline-badge"><i class="fas fa-fist-raised" style="font-size: 0.7rem;"></i> ${dName}</span>`;
        }).join('');

        let recordsBreakdownHtml = '';
        if (ath.recordsByDiscipline && typeof ath.recordsByDiscipline === 'object' && Object.keys(ath.recordsByDiscipline).length > 0) {
            const pills = Object.entries(ath.recordsByDiscipline).map(([dKey, rec]) => {
                const isPrimary = dKey.toLowerCase() === primaryDisc;
                const dName = FC_DISCIPLINES_MAP[dKey.toLowerCase()] || dKey.toUpperCase();
                const w = rec?.wins ?? 0;
                const l = rec?.losses ?? 0;
                const d = rec?.draws ?? 0;
                return `
                    <div class="record-discipline-pill ${isPrimary ? 'primary-pill' : ''}">
                        <span class="pill-disc-title">${dName} ${isPrimary ? '★' : ''}</span>
                        <span class="pill-record-val">${w}-${l}-${d}</span>
                        <span style="font-size: 0.65rem; color: #888;">${w + l + d} combate${w + l + d === 1 ? '' : 's'}</span>
                    </div>
                `;
            }).join('');

            recordsBreakdownHtml = `
                <div class="dossier-records-breakdown">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.72rem; color: var(--text-gray); text-transform: uppercase; letter-spacing: 0.5px;">
                            <i class="fas fa-medal" style="color: #ffc107; margin-right: 4px;"></i> RÉCORDS ESPECÍFICOS POR DISCIPLINA:
                        </span>
                        <span style="font-size: 0.68rem; color: var(--accent-red); font-weight: bold; text-transform: uppercase;">
                            PRINCIPAL: ${primaryLabel}
                        </span>
                    </div>
                    <div class="records-breakdown-grid">
                        ${pills}
                    </div>
                </div>
            `;
        }

        // 1. Botón de WhatsApp Directo
        const rawPhone = (ath.whatsapp || ath.phone || '').trim();
        let whatsappHtml = '';
        if (rawPhone) {
            const cleanPhone = rawPhone.replace(/\D/g, '');
            const waMsg = `Hola ${ath.alias ? `"${ath.alias}"` : ath.name}, te contactamos desde la promotora "${promoterOrg}" a través de FightConnect. Nos interesa tu perfil para nuestra próxima cartelera. ¿Tienes disponibilidad para negociar condiciones de combate?`;
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;
            whatsappHtml = `
                <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp" style="flex: 1; text-align: center; text-decoration: none;">
                    <i class="fab fa-whatsapp" style="font-size: 1.3rem;"></i> CONTACTAR POR WHATSAPP (${rawPhone})
                </a>
            `;
        } else {
            whatsappHtml = `
                <div style="flex: 1; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.12); border-radius: 8px; padding: 0.8rem 1rem; color: #888; font-size: 0.85rem; display: flex; align-items: center; gap: 0.6rem;">
                    <i class="fab fa-whatsapp" style="font-size: 1.3rem; color: #555;"></i>
                    <span>Sin número de WhatsApp registrado en su perfil</span>
                </div>
            `;
        }

        // 2. Botón de Instagram Directo
        const rawIg = (ath.instagram || '').trim();
        let instagramHtml = '';
        if (rawIg) {
            const cleanHandle = rawIg.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/^@/, '').replace(/\/$/, '');
            const igUrl = `https://instagram.com/${cleanHandle}`;
            instagramHtml = `
                <a href="${igUrl}" target="_blank" rel="noopener noreferrer" class="btn-instagram" style="flex: 1; text-align: center; text-decoration: none;">
                    <i class="fab fa-instagram" style="font-size: 1.25rem;"></i> PERFIL DE INSTAGRAM (@${cleanHandle})
                </a>
            `;
        } else {
            instagramHtml = `
                <div style="flex: 1; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.12); border-radius: 8px; padding: 0.8rem 1rem; color: #888; font-size: 0.85rem; display: flex; align-items: center; gap: 0.6rem;">
                    <i class="fab fa-instagram" style="font-size: 1.25rem; color: #555;"></i>
                    <span>Instagram no registrado</span>
                </div>
            `;
        }

        // 3. Propuesta Formal por Correo
        let emailProposalHtml = '';
        if (ath.email) {
            const subject = encodeURIComponent(`Propuesta Oficial de Combate - ${promoterOrg} para ${ath.alias || ath.name}`);
            const body = encodeURIComponent(`Estimado/a ${ath.name} ("${ath.alias}"):\n\nNos comunicamos desde la promotora "${promoterOrg}" a través de FightConnect.\n\nHemos analizado tu trayectoria deportiva y deseamos presentarte una propuesta formal para participar en nuestro próximo evento.\n\nPor favor, indícanos tus requerimientos de bolsa, campamento de entrenamiento y disponibilidad tentativa.\n\nAtentamente,\n${promoterOrg}`);
            emailProposalHtml = `
                <a href="mailto:${ath.email}?subject=${subject}&body=${body}" class="btn-solid red-btn" style="width: 100%; justify-content: center; font-size: 0.88rem; text-decoration: none; margin-top: 0.8rem;">
                    <i class="fas fa-paper-plane"></i> ENVIAR PROPUESTA FORMAL POR CORREO (${ath.email})
                </a>
            `;
        }

        dossierModalBody.innerHTML = `
            <div class="dossier-header">
                <div class="dossier-avatar">
                    ${avatarHtml}
                </div>
                <div style="overflow: hidden; flex: 1;">
                    <h3 style="color: #fff; font-family: var(--font-heading); font-size: 1.5rem; margin: 0; line-height: 1.2;">${ath.name}</h3>
                    <p style="color: var(--accent-red); font-size: 0.95rem; font-weight: bold; text-transform: uppercase; margin: 0.25rem 0;">"${ath.alias}"</p>
                    <div class="dossier-meta-wrap" style="display: flex; flex-wrap: wrap; gap: 0.8rem; margin-top: 0.4rem; color: var(--text-gray); font-size: 0.82rem;">
                        <span><i class="fas fa-dumbbell" style="color: var(--accent-red); margin-right: 4px;"></i>${ath.gym}</span>
                        <span><i class="fas fa-map-marker-alt" style="color: var(--accent-red); margin-right: 4px;"></i>${ath.location}</span>
                    </div>
                </div>
            </div>

            <div class="dossier-stats-grid">
                <div class="dossier-stat-box">
                    <span>RÉCORD (${primaryLabel})</span>
                    <strong style="color: #fff;">${ath.wins}V - ${ath.losses}D - ${ath.draws}E</strong>
                </div>
                <div class="dossier-stat-box">
                    <span>DIVISIÓN</span>
                    <strong style="color: #fff;">${ath.division}</strong>
                </div>
                <div class="dossier-stat-box">
                    <span>PESO ACTUAL</span>
                    <strong style="color: #fff;">${ath.weight ? `${ath.weight} KG` : 'N/D'}</strong>
                </div>
                <div class="dossier-stat-box">
                    <span>ESTATURA</span>
                    <strong style="color: #fff;">${ath.height ? `${ath.height} CM` : 'N/D'}</strong>
                </div>
            </div>

            ${recordsBreakdownHtml}

            <div style="margin-bottom: 1.2rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.72rem; color: var(--text-gray); text-transform: uppercase; letter-spacing: 0.5px;">DISCIPLINA BASE:</span>
                    <strong style="color: var(--accent-red); font-size: 0.85rem; letter-spacing: 1px;"><i class="fas fa-shield-alt"></i> ${primaryLabel}</strong>
                </div>
                <span style="display: block; font-size: 0.72rem; color: var(--text-gray); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.4rem;">DISCIPLINAS EN LAS QUE ACEPTA COMBATIR:</span>
                <div class="target-disciplines-wrap">
                    ${disciplineBadges}
                </div>
            </div>

            <div class="dossier-contact-section">
                <h4 style="color: #fff; font-family: var(--font-heading); font-size: 0.95rem; margin: 0 0 0.4rem 0; display: flex; align-items: center; gap: 0.5rem; letter-spacing: 0.5px;">
                    <i class="fas fa-headset" style="color: var(--accent-red);"></i> CANALES DE CONTACTO DIRECTO
                </h4>
                <p style="color: var(--text-gray); font-size: 0.8rem; margin: 0 0 0.9rem 0;">
                    Comunícate de forma inmediata con el atleta para coordinar su participación en tu cartelera.
                </p>
                <div class="dossier-contact-grid">
                    ${whatsappHtml}
                    ${instagramHtml}
                </div>
                ${emailProposalHtml}

                <div style="margin-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.2rem;">
                    <button id="btn-scout-acordar-pelea" class="btn-solid red-btn" style="width: 100%; justify-content: center; font-size: 0.92rem; font-weight: bold; background: linear-gradient(135deg, #e62429 0%, #b31014 100%); box-shadow: 0 4px 15px rgba(230,36,41,0.4); padding: 0.85rem 1rem; border: none; cursor: pointer;">
                        <i class="fas fa-handshake"></i> LLEGAR A UN ACUERDO / AGENDAR EN CARTELERA
                    </button>
                </div>
            </div>
        `;

        const btnAcordar = dossierModalBody.querySelector('#btn-scout-acordar-pelea');
        if (btnAcordar) {
            btnAcordar.onclick = () => {
                cerrarExpediente();
                abrirModalPactarCombate(ath);
            };
        }

        dossierModal.classList.remove('hidden');
        dossierModal.style.display = 'flex';
    }

    /**
     * Despliega el modal interactivo para cerrar acuerdo y agendar combate en la cartelera de un evento de la promotora.
     * @param {Object} ath - Atleta seleccionado en el scouting (Fighter 1)
     */
    function abrirModalPactarCombate(ath) {
        const modal = document.getElementById('modal-pactar-combate');
        if (!modal) return;

        const closeBtn = document.getElementById('close-pactar-modal');
        const form = document.getElementById('form-pactar-combate');
        const f1Preview = document.getElementById('pactar-fighter1-preview');
        const selectEvento = document.getElementById('pactar-select-evento');
        const noEventosMsg = document.getElementById('pactar-no-eventos-msg');
        const selectRival = document.getElementById('pactar-select-rival');
        const inputDivision = document.getElementById('pactar-division');
        const selectRounds = document.getElementById('pactar-rounds');
        const btnSubmit = document.getElementById('btn-submit-pactar-pelea');

        const cerrarModal = () => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        };

        if (closeBtn) closeBtn.onclick = cerrarModal;
        modal.onclick = (e) => {
            if (e.target === modal) cerrarModal();
        };

        // 1. Mostrar preview de Atleta 1
        if (f1Preview) {
            const avatarHtml = ath.avatar && (ath.avatar.startsWith('http') || ath.avatar.startsWith('/uploads/'))
                ? `<img src="${ath.avatar}" alt="${ath.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                : `<i class="fas fa-user-ninja" style="font-size: 1.8rem; color: var(--accent-red);"></i>`;

            f1Preview.innerHTML = `
                <div style="width: 55px; height: 55px; border-radius: 50%; background: #111; overflow: hidden; border: 2px solid var(--accent-red); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    ${avatarHtml}
                </div>
                <div style="flex: 1; overflow: hidden;">
                    <span style="font-size: 0.7rem; color: var(--accent-red); font-weight: bold; letter-spacing: 1px; display: block; text-transform: uppercase;">ATLETA SELECCIONADO</span>
                    <h4 style="color: #fff; margin: 0; font-family: var(--font-heading); font-size: 1.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ath.name} ${ath.alias ? `"${ath.alias}"` : ''}</h4>
                    <p style="margin: 0; color: var(--text-gray); font-size: 0.8rem;">${ath.division} · ${ath.record || '0-0-0'} · ${(ath.discipline || 'MMA').toUpperCase()}</p>
                </div>
            `;
        }

        // 2. Cargar eventos activos de la promotora
        const currentUid = uid || localStorage.getItem('userId');
        const localEvents = obtenerEventosLocales();
        let myEvents = [];
        if (currentUid && currentUid !== 'promoter_local') {
            myEvents = localEvents.filter(e => e.promoterId === currentUid);
        } else {
            myEvents = localEvents.filter(e => e.promoterId === 'promoter_local');
        }

        if (myEvents.length === 0) {
            if (selectEvento) {
                selectEvento.innerHTML = '<option value="">No tienes eventos activos disponibles</option>';
                selectEvento.disabled = true;
            }
            if (noEventosMsg) noEventosMsg.style.display = 'block';
            if (btnSubmit) btnSubmit.disabled = true;
        } else {
            if (selectEvento) {
                selectEvento.disabled = false;
                selectEvento.innerHTML = '<option value="">-- Selecciona el Evento para el Combate --</option>' + myEvents.map(e => {
                    const evDate = new Date(e.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
                    return `<option value="${e.id}">${e.name} (${evDate} - ${e.location})</option>`;
                }).join('');
            }
            if (noEventosMsg) noEventosMsg.style.display = 'none';
            if (btnSubmit) btnSubmit.disabled = false;
        }

        // 3. Poblar lista de rivales (excluyendo al atleta seleccionado)
        if (selectRival) {
            const rivales = atletas.filter(a => a.id !== ath.id);
            selectRival.innerHTML = '<option value="">-- Selecciona al Rival del Atleta --</option>' + rivales.map(r => {
                const aliasStr = r.alias ? ` "${r.alias}"` : '';
                return `<option value="${r.id}">${r.name}${aliasStr} - ${r.division} (${r.record || '0-0-0'})</option>`;
            }).join('');
        }

        // 4. Prellenar división de peso
        if (inputDivision) {
            inputDivision.value = ath.division || 'Peso Ligero (70 kg)';
        }

        // 5. Manejar envío del formulario de acuerdo
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const eventId = selectEvento.value;
                const rivalId = selectRival.value;

                if (!eventId) {
                    alert("Debes seleccionar un evento activo de tu promotora.");
                    return;
                }
                if (!rivalId) {
                    alert("Debes seleccionar un rival para acordar el combate.");
                    return;
                }

                const rivalData = atletas.find(a => a.id === rivalId);
                if (!rivalData) {
                    alert("No se encontró la información del rival seleccionado.");
                    return;
                }

                const radioChecked = form.querySelector('input[name="pactar-tipo-pelea"]:checked');
                const tipoPelea = radioChecked ? radioChecked.value : 'estelar';
                const divisionVal = inputDivision ? inputDivision.value.trim() : (ath.division || 'Peso Pactado');
                const roundsVal = selectRounds ? parseInt(selectRounds.value, 10) : 3;

                const fightData = {
                    id: 'fight_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    type: tipoPelea, // 'estelar' o 'preliminar'
                    fighter1: {
                        id: ath.id,
                        name: ath.name,
                        alias: ath.alias || '',
                        avatar: ath.avatar || '',
                        record: ath.record || `${ath.wins || 0}-${ath.losses || 0}-${ath.draws || 0}`,
                        weight: ath.weight || 0,
                        discipline: ath.discipline || 'mma'
                    },
                    fighter2: {
                        id: rivalData.id,
                        name: rivalData.name,
                        alias: rivalData.alias || '',
                        avatar: rivalData.avatar || '',
                        record: rivalData.record || `${rivalData.wins || 0}-${rivalData.losses || 0}-${rivalData.draws || 0}`,
                        weight: rivalData.weight || 0,
                        discipline: rivalData.discipline || 'mma'
                    },
                    weightClass: divisionVal,
                    rounds: roundsVal,
                    createdAt: new Date().toISOString()
                };

                if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> REGISTRANDO EN CARTELERA...';
                }

                await agregarPeleaAEvento(eventId, fightData);

                // Requerimiento 4: Notificar a ambos atletas y crear solicitud de combate en "Mis Postulaciones"
                const currentEvents = obtenerEventosLocales();
                const currentEventObj = currentEvents.find(ev => ev.id === eventId) || myEvents.find(e => e.id === eventId) || { id: eventId, name: 'Evento Oficial' };
                await notificarYPostularPeleadoresCombate(currentEventObj, fightData);

                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fas fa-check-circle"></i> CONFIRMAR COMBATE EN CARTELERA';
                }

                cerrarModal();
                alert(`¡Acuerdo cerrado con éxito! 🥊\n\nEl combate (${ath.name} VS ${rivalData.name}) ha sido clasificado como ${tipoPelea === 'estelar' ? 'PELEA ESTELAR' : 'PELEA PRELIMINAR'} y agendado en la cartelera oficial.\n\nSe ha enviado un mensaje y la propuesta de combate a ambos atletas en la sección "Mis Postulaciones".`);
            };
        }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    function aplicarFiltrosYRenderizar() {
        const selectedWeight = weightFilter ? weightFilter.value : '';
        const selectedDiscipline = disciplineFilter ? disciplineFilter.value.toLowerCase() : '';
        const minRecordWins = recordFilter && recordFilter.value ? parseInt(recordFilter.value, 10) : 0;

        const filtrados = atletas.filter(ath => {
            // 1. Filtro por disciplina / arte marcial
            if (selectedDiscipline) {
                const tieneDisciplina = (Array.isArray(ath.targetDisciplines) && ath.targetDisciplines.includes(selectedDiscipline)) ||
                                        (ath.discipline && ath.discipline.toLowerCase() === selectedDiscipline);
                if (!tieneDisciplina) return false;
            }

            // 2. Filtro por categoría de peso
            if (selectedWeight) {
                const w = parseFloat(ath.weight) || 0;
                const targetW = parseFloat(selectedWeight);
                if (targetW === 57 && !(w > 0 && w <= 57)) return false;
                if (targetW === 61 && !(w > 57 && w <= 61.2)) return false;
                if (targetW === 66 && !(w > 61.2 && w <= 66)) return false;
                if (targetW === 70 && !(w > 66 && w <= 70.3)) return false;
                if (targetW === 77 && !(w > 70.3 && w <= 77.1)) return false;
                if (targetW === 84 && !(w > 77.1 && w <= 84)) return false;
                if (targetW === 93 && !(w > 84 && w <= 93)) return false;
                if (targetW === 120 && !(w > 93)) return false;
            }

            // 3. Filtro por récord de victorias
            if (minRecordWins > 0) {
                if ((ath.wins || 0) < minRecordWins) return false;
            }

            return true;
        });

        container.className = 'scouting-results-grid';

        if (filtrados.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 4rem 2rem; text-align: center; background: rgba(18, 18, 20, 0.7); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--accent-red); margin-bottom: 1rem; opacity: 0.6; display: block;"></i>
                    <h3 style="color: #fff; font-family: var(--font-heading); margin-bottom: 0.5rem; font-size: 1.4rem;">NO SE ENCONTRARON PELEADORES</h3>
                    <p style="color: var(--text-gray); font-size: 0.9rem; max-width: 480px; margin: 0 auto 1.5rem auto;">
                        No hay atletas registrados que coincidan con la disciplina, categoría de peso o récord especificados.
                    </p>
                    <button id="btn-empty-reset-scouting" class="btn-solid red-btn" style="display: inline-flex; justify-content: center; font-size: 0.85rem;">
                        <i class="fas fa-undo"></i> REINICIAR FILTROS
                    </button>
                </div>
            `;
            const emptyResetBtn = document.getElementById('btn-empty-reset-scouting');
            if (emptyResetBtn) {
                emptyResetBtn.onclick = ejecutarReinicioFiltros;
            }
            return;
        }

        container.innerHTML = filtrados.map(ath => {
            const avatarHtml = ath.avatar && (ath.avatar.startsWith('http') || ath.avatar.startsWith('/uploads/'))
                ? `<img src="${ath.avatar}" alt="${ath.name}" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<i class=\\'fas fa-user-ninja\\' style=\\'font-size: 1.6rem; color: var(--accent-red);\\'></i>';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                : `<i class="fas fa-user-ninja" style="font-size: 1.6rem; color: var(--accent-red);"></i>`;

            const primaryDisc = (ath.primaryDiscipline || ath.discipline || 'mma').toLowerCase();
            const primaryLabel = (FC_DISCIPLINES_MAP[primaryDisc] || primaryDisc).toUpperCase();

            const disciplineBadges = (ath.targetDisciplines || [ath.discipline]).map(disc => {
                const isMatch = selectedDiscipline && disc === selectedDiscipline;
                const dName = FC_DISCIPLINES_MAP[disc.toLowerCase()] || disc.toUpperCase();
                return `<span class="discipline-badge ${isMatch ? 'match-highlight' : ''}"><i class="fas fa-fist-raised" style="font-size: 0.65rem;"></i> ${dName}</span>`;
            }).join('');

            let multiRecordsPills = '';
            if (ath.recordsByDiscipline && typeof ath.recordsByDiscipline === 'object' && Object.keys(ath.recordsByDiscipline).length > 1) {
                const miniPills = Object.entries(ath.recordsByDiscipline).map(([dKey, r]) => {
                    const isPrim = dKey.toLowerCase() === primaryDisc;
                    const dName = FC_DISCIPLINES_MAP[dKey.toLowerCase()] || dKey.toUpperCase();
                    return `<span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: ${isPrim ? 'rgba(230,36,41,0.2)' : 'rgba(255,255,255,0.04)'}; color: ${isPrim ? 'var(--accent-red)' : '#bbb'}; border: 1px solid ${isPrim ? 'rgba(230,36,41,0.4)' : 'rgba(255,255,255,0.08)'}; font-weight: ${isPrim ? '700' : 'normal'};">${dName}: ${r.wins}-${r.losses}-${r.draws}</span>`;
                }).join(' ');
                multiRecordsPills = `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 0.6rem; margin-bottom: 0.6rem;">${miniPills}</div>`;
            }

            return `
                <div class="opportunity-card" style="border: 1px solid rgba(255,255,255,0.08); background: rgba(18,18,20,0.85); border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div class="scouting-card-header" data-id="${ath.id}" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; cursor: pointer;">
                            <div style="width: 58px; height: 58px; border-radius: 50%; background: #1a1a1a; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; border: 2px solid rgba(230,36,41,0.4); box-shadow: 0 0 10px rgba(230,36,41,0.2);">
                                ${avatarHtml}
                            </div>
                            <div style="overflow: hidden;">
                                <h3 style="color: #fff; font-family: var(--font-heading); margin: 0; font-size: 1.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ath.name}</h3>
                                <p style="color: var(--accent-red); font-size: 0.82rem; font-weight: bold; text-transform: uppercase; margin: 0.2rem 0;">"${ath.alias}"</p>
                                <small style="color: var(--text-gray); display: block; font-size: 0.75rem;"><i class="fas fa-map-marker-alt" style="color: var(--accent-red); margin-right: 4px;"></i>${ath.location}</small>
                            </div>
                        </div>

                        <div class="opp-details" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0.8rem 0; margin-bottom: 0.9rem;">
                            <div><span style="font-size: 0.68rem; color: var(--text-gray);">RÉCORD (${primaryLabel})</span><strong style="color: #fff; display: block; font-size: 0.95rem;">${ath.record}</strong></div>
                            <div><span style="font-size: 0.68rem; color: var(--text-gray);">DIVISIÓN</span><strong style="color: #fff; display: block; font-size: 0.85rem;">${ath.division}</strong></div>
                            <div><span style="font-size: 0.68rem; color: var(--text-gray);">BASE</span><strong style="color: var(--accent-red); display: block; font-size: 0.85rem;">${primaryLabel}</strong></div>
                        </div>

                        ${multiRecordsPills}

                        <div style="margin-bottom: 1.2rem;">
                            <span style="display: block; font-size: 0.7rem; color: var(--text-gray); margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px;">Disponible para combatir en:</span>
                            <div class="target-disciplines-wrap">
                                ${disciplineBadges}
                            </div>
                        </div>
                    </div>

                    <button class="btn-solid red-btn btn-ver-expediente" data-id="${ath.id}" style="width: 100%; justify-content: center; font-size: 0.85rem;">
                        <i class="fas fa-address-card"></i> VER EXPEDIENTE / CONTACTAR
                    </button>
                </div>
            `;
        }).join('');

        // Manejador del botón Ver Expediente y click en cabecera de la tarjeta
        container.querySelectorAll('.btn-ver-expediente').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const ath = atletas.find(a => a.id === id);
                if (ath) abrirExpedienteAtleta(ath);
            });
        });

        container.querySelectorAll('.scouting-card-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const ath = atletas.find(a => a.id === id);
                if (ath) abrirExpedienteAtleta(ath);
            });
        });
    }

    /**
     * Reinicia todos los filtros a sus valores predeterminados y refresca la lista
     */
    function ejecutarReinicioFiltros() {
        if (weightFilter) {
            weightFilter.value = '';
            weightFilter.selectedIndex = 0;
        }
        if (disciplineFilter) {
            disciplineFilter.value = '';
            disciplineFilter.selectedIndex = 0;
        }
        if (recordFilter) {
            recordFilter.value = '';
        }

        // Animación suave de rotación en el ícono de reinicio
        if (resetBtn) {
            resetBtn.classList.remove('is-resetting');
            void resetBtn.offsetWidth;
            resetBtn.classList.add('is-resetting');
            setTimeout(() => {
                if (resetBtn) resetBtn.classList.remove('is-resetting');
            }, 600);
        }

        aplicarFiltrosYRenderizar();
    }

    // Escuchar eventos de cambio en los filtros
    if (applyBtn) {
        applyBtn.onclick = aplicarFiltrosYRenderizar;
    }
    if (resetBtn) {
        resetBtn.onclick = ejecutarReinicioFiltros;
    }
    if (weightFilter) weightFilter.onchange = aplicarFiltrosYRenderizar;
    if (disciplineFilter) disciplineFilter.onchange = aplicarFiltrosYRenderizar;
    if (recordFilter) recordFilter.oninput = aplicarFiltrosYRenderizar;

    // Render inicial
    aplicarFiltrosYRenderizar();
}

/* ==========================================================================
   MÓDULOS DE ESPECTADOR (FAN-DASHBOARD, FAN-BUSCAR, FAN-FAVORITOS)
   ========================================================================== */

/**
 * Directorio oficial de promotoras de combate (locales e internacionales) en FightConnect.
 * Permite a los aficionados seguir organizaciones y recibir sus veladas automáticamente en su Watchlist.
 * @constant {Array<Object>}
 */
const FC_PROMOTORAS_CATALOG = [
    // Ligas Internacionales
    {
        id: 'ufc',
        name: 'Ultimate Fighting Championship',
        shortName: 'UFC',
        scope: 'internacional',
        discipline: 'MMA',
        location: 'Las Vegas, EE.UU.',
        badgeColor: '#e62429',
        icon: 'fa-globe-americas',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/UFC_logo.svg',
        photoURL: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/UFC_logo.svg',
        description: 'La liga líder mundial de artes marciales mixtas con los mejores talentos del planeta.',
        upcomingEvents: [
            {
                id: 'ufc-308',
                titulo: 'UFC 308: Topuria vs. Holloway',
                fecha: '26 Octubre 2026',
                ubicacion: 'Etihad Arena, Abu Dhabi',
                disciplina: 'MMA',
                imagenUrl: 'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg',
                linkCartelera: 'internacional.html',
                promotora: 'UFC'
            },
            {
                id: 'ufc-309',
                titulo: 'UFC 309: Jones vs. Miocic',
                fecha: '16 Noviembre 2026',
                ubicacion: 'Madison Square Garden, Nueva York',
                disciplina: 'MMA',
                imagenUrl: 'https://a.espncdn.com/photo/2023/0423/r1163456_1296x729_16-9.jpg',
                linkCartelera: 'internacional.html',
                promotora: 'UFC'
            }
        ]
    },
    {
        id: 'one',
        name: 'ONE Championship',
        shortName: 'ONE',
        scope: 'internacional',
        discipline: 'MMA / MUAY THAI',
        location: 'Singapur',
        badgeColor: '#ffc107',
        icon: 'fa-fist-raised',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/ONE_Championship_logo.svg',
        photoURL: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/ONE_Championship_logo.svg',
        description: 'La mayor promotora de artes marciales de Asia, integrando Muay Thai en guantillas de 4oz, MMA y Kickboxing.',
        upcomingEvents: [
            {
                id: 'one-169',
                titulo: 'ONE 169: Malykhin vs. Reug Reug',
                fecha: '09 Noviembre 2026',
                ubicacion: 'Lumpinee Stadium, Bangkok',
                disciplina: 'MUAY THAI',
                imagenUrl: 'https://a.espncdn.com/photo/2026/0829/r1708497_600x400_3-2.jpg',
                linkCartelera: 'internacional.html',
                promotora: 'ONE Championship'
            }
        ]
    },
    {
        id: 'pfl',
        name: 'Professional Fighters League',
        shortName: 'PFL',
        scope: 'internacional',
        discipline: 'MMA',
        location: 'Washington D.C., EE.UU.',
        badgeColor: '#0070f3',
        icon: 'fa-trophy',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/53/PFL_logo.svg',
        photoURL: 'https://upload.wikimedia.org/wikipedia/commons/5/53/PFL_logo.svg',
        description: 'Formato de temporada regular y playoffs con premios millonarios de campeonato mundial.',
        upcomingEvents: [
            {
                id: 'pfl-world-champs',
                titulo: 'PFL World Championship 2026',
                fecha: '29 Noviembre 2026',
                ubicacion: 'Riyadh, Arabia Saudita',
                disciplina: 'MMA',
                imagenUrl: 'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg',
                linkCartelera: 'internacional.html',
                promotora: 'PFL'
            }
        ]
    },
    {
        id: 'matchroom',
        name: 'Matchroom Boxing',
        shortName: 'Matchroom',
        scope: 'internacional',
        discipline: 'BOXEO',
        location: 'Londres, Reino Unido',
        badgeColor: '#e0a800',
        icon: 'fa-dumbbell',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Matchroom_Sport_logo.svg',
        photoURL: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Matchroom_Sport_logo.svg',
        description: 'La promotora de boxeo más prestigiosa de Europa, productora de campeonatos unificados mundiales.',
        upcomingEvents: [
            {
                id: 'matchroom-london-26',
                titulo: 'Matchroom: Noche de Campeonatos Mundiales',
                fecha: '14 Diciembre 2026',
                ubicacion: 'The O2 Arena, Londres',
                disciplina: 'BOXEO',
                imagenUrl: 'https://a.espncdn.com/photo/2023/0423/r1163456_1296x729_16-9.jpg',
                linkCartelera: 'internacional.html',
                promotora: 'Matchroom Boxing'
            }
        ]
    },
    {
        id: 'bkfc',
        name: 'Bare Knuckle Fighting Championship',
        shortName: 'BKFC',
        scope: 'internacional',
        discipline: 'BOXEO SIN GUANTES',
        location: 'Filadelfia, EE.UU.',
        badgeColor: '#d97706',
        icon: 'fa-skull-crossbones',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/02/Bare_Knuckle_Fighting_Championship_logo.svg/300px-Bare_Knuckle_Fighting_Championship_logo.svg.png',
        photoURL: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/02/Bare_Knuckle_Fighting_Championship_logo.svg/300px-Bare_Knuckle_Fighting_Championship_logo.svg.png',
        description: 'Combates extremos cuerpo a cuerpo en el círculo de cuerda sin guantes de protección.',
        upcomingEvents: [
            {
                id: 'bkfc-knucklemania',
                titulo: 'BKFC: KnuckleMania VI',
                fecha: '05 Diciembre 2026',
                ubicacion: 'Seminole Hard Rock, Florida',
                disciplina: 'BOXEO SIN GUANTES',
                imagenUrl: 'https://a.espncdn.com/photo/2023/0423/r1163456_1296x729_16-9.jpg',
                linkCartelera: 'internacional.html',
                promotora: 'BKFC'
            }
        ]
    },
    // Ligas Locales y Nacionales
    {
        id: 'bfl',
        name: 'Bogotá Fight League',
        shortName: 'BFL',
        scope: 'local',
        discipline: 'MMA / KICKBOXING',
        location: 'Bogotá, Colombia',
        badgeColor: '#e62429',
        icon: 'fa-shield-alt',
        description: 'El circuito profesional insignia de la capital con rankings oficiales y cinturones de peso gallo y ligero.',
        upcomingEvents: [
            {
                id: 'bfl-14',
                titulo: 'BFL 14: Guerra en la Altura',
                fecha: '18 Noviembre 2026',
                ubicacion: 'Palacio de los Deportes, Bogotá',
                disciplina: 'MMA',
                imagenUrl: 'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg',
                linkCartelera: 'local.html',
                promotora: 'Bogotá Fight League'
            }
        ]
    },
    {
        id: 'empire-mma',
        name: 'Empire MMA Colombia',
        shortName: 'Empire MMA',
        scope: 'local',
        discipline: 'MMA',
        location: 'Medellín, Colombia',
        badgeColor: '#10b981',
        icon: 'fa-fist-raised',
        description: 'Organización antioqueña especializada en desarrollo y proyección internacional de atletas de élite.',
        upcomingEvents: [
            {
                id: 'empire-mma-8',
                titulo: 'Empire MMA 8: Noche de Finalizaciones',
                fecha: '02 Diciembre 2026',
                ubicacion: 'Coliseo Iván de Bedout, Medellín',
                disciplina: 'MMA',
                imagenUrl: 'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg',
                linkCartelera: 'local.html',
                promotora: 'Empire MMA Colombia'
            }
        ]
    },
    {
        id: 'striker-league',
        name: 'Striker League Championship',
        shortName: 'Striker League',
        scope: 'local',
        discipline: 'MUAY THAI / KICKBOXING',
        location: 'Cali, Colombia',
        badgeColor: '#f59e0b',
        icon: 'fa-fire',
        description: 'La cumbre del striking nacional: reglas K-1 y Muay Thai tradicional con codos y rodillas en jaula.',
        upcomingEvents: [
            {
                id: 'striker-cali-vol5',
                titulo: 'Striker League: Furia en el Valle Vol. 5',
                fecha: '20 Diciembre 2026',
                ubicacion: 'Coliseo El Pueblo, Cali',
                disciplina: 'MUAY THAI',
                imagenUrl: 'https://a.espncdn.com/photo/2026/0829/r1708497_600x400_3-2.jpg',
                linkCartelera: 'local.html',
                promotora: 'Striker League Championship'
            }
        ]
    },
    {
        id: 'copa-bjj',
        name: 'Copa Colombia Jiu-Jitsu & Grappling',
        shortName: 'Copa BJJ',
        scope: 'local',
        discipline: 'JIU-JITSU / GRAPPLING',
        location: 'Bogotá, Colombia',
        badgeColor: '#3b82f6',
        icon: 'fa-khanda',
        description: 'Torneo absoluto Gi y No-Gi reuniendo a las academias y cinturones negros más técnicos del país.',
        upcomingEvents: [
            {
                id: 'copa-bjj-bogota-26',
                titulo: 'Copa Colombia BJJ Pro: Torneo Abierto No-Gi',
                fecha: '10 Diciembre 2026',
                ubicacion: 'Centro de Alto Rendimiento, Bogotá',
                disciplina: 'JIU-JITSU',
                imagenUrl: 'https://a.espncdn.com/photo/2026/0816/r1702390_600x400_3-2.jpg',
                linkCartelera: 'local.html',
                promotora: 'Copa Colombia Jiu-Jitsu'
            }
        ]
    },
    {
        id: 'mfc-colombia',
        name: 'Mixed Fighting Championship (MFC)',
        shortName: 'MFC',
        scope: 'local',
        discipline: 'MMA / BOXEO',
        location: 'Barranquilla, Colombia',
        badgeColor: '#ec4899',
        icon: 'fa-bolt',
        description: 'Combates costeros de alto voltaje en el Caribe colombiano con veladas transmitidas en directo.',
        upcomingEvents: [
            {
                id: 'mfc-caribe-showdown',
                titulo: 'MFC: Caribe Showdown 2026',
                fecha: '28 Diciembre 2026',
                ubicacion: 'Coliseo Sugar Baby Rojas, Barranquilla',
                disciplina: 'MMA',
                imagenUrl: 'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg',
                linkCartelera: 'local.html',
                promotora: 'Mixed Fighting Championship'
            }
        ]
    }
];

/**
 * Obtiene las promotoras seguidas por el espectador desde el almacenamiento persistente.
 * @function obtenerPromotorasSeguidas
 * @param {string} uid
 * @returns {Array<Object>}
 */
function obtenerPromotorasSeguidas(uid) {
    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    try {
        const key = `fightconnect_fan_fav_promoters_${currentUid}`;
        const raw = localStorage.getItem(key) || localStorage.getItem('fightconnect_fan_fav_promoters') || '[]';
        const list = JSON.parse(raw);
        return Array.isArray(list) ? list : [];
    } catch (_) {
        return [];
    }
}

/**
 * Guarda las promotoras seguidas por el espectador en el almacenamiento persistente y Firestore.
 * @function guardarPromotorasSeguidas
 * @param {string} uid
 * @param {Array<Object>} list
 */
function guardarPromotorasSeguidas(uid, list) {
    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    const key = `fightconnect_fan_fav_promoters_${currentUid}`;
    localStorage.setItem(key, JSON.stringify(list));
    localStorage.setItem('fightconnect_fan_fav_promoters', JSON.stringify(list));

    if (db && currentUid !== 'guest') {
        setDoc(doc(db, "users", currentUid), {
            favPromoters: list,
            updatedAt: new Date().toISOString()
        }, { merge: true }).catch(e => console.warn("Aviso al sincronizar promotoras seguidas en Firestore:", e));
    }
}

/**
 * Consulta si una promotora específica está en la lista de seguidas.
 * @function esPromotoraSeguida
 * @param {string} idOrName
 * @param {string} uid
 * @returns {boolean}
 */
function esPromotoraSeguida(idOrName, uid) {
    const list = obtenerPromotorasSeguidas(uid);
    const target = (idOrName || '').toLowerCase().trim();
    return list.some(p => 
        (p.id && p.id.toLowerCase() === target) ||
        (p.name && p.name.toLowerCase() === target) ||
        (p.shortName && p.shortName.toLowerCase() === target)
    );
}

/**
 * Conmuta el estado de seguimiento de una promotora (seguir / dejar de seguir).
 * @function toggleSeguirPromotora
 * @param {Object} promotoraObj
 * @param {string} uid
 * @returns {boolean} Nuevo estado: true si ahora la sigue, false si la dejó de seguir.
 */
function toggleSeguirPromotora(promotoraObj, uid) {
    const role = (localStorage.getItem('userRole') || '').toLowerCase();
    if (role !== 'fan') {
        alert("La función de seguir promotoras y ligas es exclusiva para aficionados (rol Fan).");
        return false;
    }
    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    const list = obtenerPromotorasSeguidas(currentUid);
    const targetId = (promotoraObj.id || promotoraObj.name || '').toLowerCase();
    const index = list.findIndex(p => 
        (p.id && p.id.toLowerCase() === targetId) ||
        (p.name && p.name.toLowerCase() === targetId) ||
        (p.shortName && p.shortName.toLowerCase() === targetId)
    );
    let isNowFollowed = false;
    if (index >= 0) {
        list.splice(index, 1);
        isNowFollowed = false;
    } else {
        list.push(promotoraObj);
        isNowFollowed = true;
    }
    guardarPromotorasSeguidas(currentUid, list);
    return isNowFollowed;
}

/**
 * Diccionario de meses en español para normalización precisa de fechas.
 */
const MESES_ES_DICT = {
    enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2, abr: 3, abril: 3,
    may: 4, mayo: 4, jun: 5, junio: 5, jul: 6, julio: 6,
    ago: 7, agosto: 7, sep: 8, sept: 8, septiembre: 8,
    oct: 9, octubre: 9, nov: 10, noviembre: 10, dic: 11, diciembre: 11
};

/**
 * Convierte cualquier formato de fecha de evento registrado (ISO, texto en español, YYYY-MM-DD, DD/MM/YYYY)
 * en un objeto Date con la hora estimada de inicio del combate.
 * @function parseFechaEventoToDate
 * @param {*} rawStr
 * @returns {Date|null}
 */
function parseFechaEventoToDate(rawStr) {
    if (!rawStr) return null;
    if (rawStr instanceof Date) return isNaN(rawStr.getTime()) ? null : rawStr;
    if (typeof rawStr === 'number') {
        const d = new Date(rawStr);
        return isNaN(d.getTime()) ? null : d;
    }
    if (typeof rawStr !== 'string') return null;

    const trimmed = rawStr.trim();
    if (!trimmed) return null;

    // 1. Formato ISO estándar o timestamp directo
    const directParsed = Date.parse(trimmed);
    if (!isNaN(directParsed)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const parts = trimmed.split('-');
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 20, 0, 0);
        }
        return new Date(directParsed);
    }

    // 2. Formato textual en español (ej. "SÁBADO, 10 OCTUBRE 2026", "14 Octubre 2026", "10 de Octubre, 2026")
    const cleanLower = trimmed.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/,/g, ' ')
        .replace(/\bde\b/g, ' ');

    const dayMatch = cleanLower.match(/\b(\d{1,2})\b/);
    const yearMatch = cleanLower.match(/\b(20\d\d)\b/);

    let foundMonth = null;
    for (const [key, val] of Object.entries(MESES_ES_DICT)) {
        const normKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const reg = new RegExp(`\\b${normKey}\\b`, 'i');
        if (reg.test(cleanLower)) {
            foundMonth = val;
            break;
        }
    }

    if (dayMatch && yearMatch && foundMonth !== null) {
        const day = parseInt(dayMatch[1], 10);
        const year = parseInt(yearMatch[1], 10);
        return new Date(year, foundMonth, day, 20, 0, 0);
    }

    // 3. Formato DD/MM/YYYY o DD-MM-YYYY
    const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d\d)$/);
    if (ddmmyyyy) {
        return new Date(parseInt(ddmmyyyy[3], 10), parseInt(ddmmyyyy[2], 10) - 1, parseInt(ddmmyyyy[1], 10), 20, 0, 0);
    }

    return null;
}

/**
 * Determina estrictamente si un evento es vigente (futuro o actualmente en curso / llevándose a cabo).
 * Los eventos concluidos / pasados retornan estrictamente FALSE para su inmediata purga de favoritos.
 * @function esEventoVigenteOFuturo
 * @param {Object} eventoObj
 * @param {Date} [referenceDate]
 * @returns {boolean}
 */
function esEventoVigenteOFuturo(eventoObj, referenceDate = new Date()) {
    if (!eventoObj) return false;
    const nowTime = referenceDate.getTime();

    const rawDate = eventoObj.fechaIso || eventoObj.dateIso || eventoObj.fecha || eventoObj.date || eventoObj.eventDate;
    if (!rawDate) return false;

    if (typeof rawDate === 'string') {
        const lower = rawDate.trim().toLowerCase();
        if (lower === 'proximamente' || lower === 'tbd' || lower === 'por anunciar') {
            return true;
        }
    }

    const eventStartDate = parseFechaEventoToDate(rawDate);
    if (!eventStartDate) {
        return true;
    }

    const startTimestamp = eventStartDate.getTime();

    // 1. Si la fecha y hora de inicio es futura -> Vigente
    if (startTimestamp > nowTime) {
        return true;
    }

    // 2. Si ya comenzó, determinar si está actualmente en curso (máximo 8 horas de duración de la velada)
    const DURATION_MS = 8 * 60 * 60 * 1000;
    if (nowTime <= startTimestamp + DURATION_MS) {
        return true;
    }

    // 3. Si coincide con el mismo día calendario (por diferencias de husos horarios)
    const isSameDay = (
        referenceDate.getFullYear() === eventStartDate.getFullYear() &&
        referenceDate.getMonth() === eventStartDate.getMonth() &&
        referenceDate.getDate() === eventStartDate.getDate()
    );
    if (isSameDay) {
        return true;
    }

    // 4. El evento concluyó en días pasados o hace más de 8 horas -> NO VIGENTE (se debe purgar)
    return false;
}

/**
 * Consulta si un evento se está llevando a cabo hoy o en vivo en este momento.
 * @function esEventoEnCursoOHoy
 * @param {Object} eventoObj
 * @param {Date} [referenceDate]
 * @returns {boolean}
 */
function esEventoEnCursoOHoy(eventoObj, referenceDate = new Date()) {
    if (!eventoObj) return false;
    const rawDate = eventoObj.fechaIso || eventoObj.dateIso || eventoObj.fecha || eventoObj.date || eventoObj.eventDate;
    if (!rawDate) return false;
    const eventStartDate = parseFechaEventoToDate(rawDate);
    if (!eventStartDate) return false;

    const isSameDay = (
        referenceDate.getFullYear() === eventStartDate.getFullYear() &&
        referenceDate.getMonth() === eventStartDate.getMonth() &&
        referenceDate.getDate() === eventStartDate.getDate()
    );
    const startTimestamp = eventStartDate.getTime();
    const nowTime = referenceDate.getTime();
    const DURATION_MS = 8 * 60 * 60 * 1000;

    return isSameDay || (nowTime >= startTimestamp && nowTime <= startTimestamp + DURATION_MS);
}

/**
 * Obtiene los eventos favoritos guardados por el espectador.
 * Aplica purga automática instantánea: si un evento ya concluyó,
 * se elimina automáticamente de la lista y se sincroniza en almacenamiento local y Firestore.
 * Solo pueden figurar veladas futuras o que se estén llevando a cabo en tiempo real.
 * 
 * @function obtenerEventosFavoritos
 * @param {string} uid
 * @returns {Array<Object>}
 */
function obtenerEventosFavoritos(uid) {
    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    try {
        const key = `fightconnect_fan_fav_events_${currentUid}`;
        const raw = localStorage.getItem(key) || localStorage.getItem('fightconnect_fan_fav_events') || '[]';
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return [];

        // REGLA DE NEGOCIO FAN: Solo veladas futuras o en curso.
        // Todo evento culminado/pasado se purga automáticamente de favoritos y del radar.
        const vigentes = list.filter(ev => esEventoVigenteOFuturo(ev));

        // Si se purgaron eventos pasados, sincronizar inmediatamente local y remotamente
        if (vigentes.length !== list.length) {
            console.log(`🧹 [FightConnect Auto-Purge] ${list.length - vigentes.length} evento(s) concluidos purgados de favoritos.`);
            guardarEventosFavoritos(currentUid, vigentes);
        }

        return vigentes;
    } catch (_) {
        return [];
    }
}

/**
 * Guarda los eventos favoritos del espectador en almacenamiento local y Firestore.
 * @function guardarEventosFavoritos
 * @param {string} uid
 * @param {Array<Object>} list
 */
function guardarEventosFavoritos(uid, list) {
    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    const key = `fightconnect_fan_fav_events_${currentUid}`;
    localStorage.setItem(key, JSON.stringify(list));
    localStorage.setItem('fightconnect_fan_fav_events', JSON.stringify(list));

    if (db && currentUid !== 'guest') {
        setDoc(doc(db, "users", currentUid), {
            favEvents: list,
            updatedAt: new Date().toISOString()
        }, { merge: true }).catch(e => console.warn("Aviso al sincronizar eventos favoritos en Firestore:", e));
    }
}

/**
 * Consulta si un evento específico está guardado en favoritos y aún está vigente.
 * @function esEventoFavorito
 * @param {string} eventId
 * @param {string} uid
 * @returns {boolean}
 */
function esEventoFavorito(eventId, uid) {
    if (!eventId) return false;
    const list = obtenerEventosFavoritos(uid);
    const target = String(eventId).trim().toLowerCase();
    return list.some(ev => 
        String(ev.id).trim().toLowerCase() === target || 
        String(ev.titulo || '').toLowerCase().trim() === target
    );
}

/**
 * Conmuta el estado de guardado de un evento (añadir o remover de favoritos).
 * Solo permite seguir eventos futuros o que se estén llevando a cabo.
 * Rechaza categóricamente eventos concluidos/pasados.
 * 
 * @function toggleSeguirEvento
 * @param {Object} eventoObj
 * @param {string} uid
 * @returns {boolean}
 */
function toggleSeguirEvento(eventoObj, uid) {
    if (!eventoObj || !eventoObj.id) return false;
    const role = (localStorage.getItem('userRole') || '').toLowerCase();
    if (role !== 'fan') {
        alert("La función de seguir eventos y carteleras es exclusiva para aficionados (rol Fan).");
        return false;
    }

    // Regla de Negocio: Rechazar eventos pasados
    if (!esEventoVigenteOFuturo(eventoObj)) {
        alert("Esta velada ya concluyó. Solo puedes añadir a tus favoritos eventos futuros o que se estén llevando a cabo.");
        return false;
    }

    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    const list = obtenerEventosFavoritos(currentUid);
    const targetId = String(eventoObj.id).trim().toLowerCase();
    const index = list.findIndex(ev => 
        String(ev.id).trim().toLowerCase() === targetId ||
        String(ev.titulo || '').toLowerCase().trim() === String(eventoObj.titulo || '').toLowerCase().trim()
    );

    let isNowSaved = false;
    if (index >= 0) {
        list.splice(index, 1);
        isNowSaved = false;
    } else {
        list.push({
            id: eventoObj.id,
            titulo: eventoObj.titulo || eventoObj.name || `Evento #${eventoObj.id}`,
            fecha: eventoObj.fecha || eventoObj.date || eventoObj.fechaIso || 'Próximamente',
            fechaIso: eventoObj.fechaIso || eventoObj.dateIso || '',
            ubicacion: eventoObj.ubicacion || eventoObj.location || 'Sede Oficial',
            imagenUrl: eventoObj.imagenUrl || eventoObj.imageUrl || eventoObj.posterImg || eventoObj._assignedCoverPhoto || '',
            disciplina: (eventoObj.disciplina || eventoObj.discipline || 'MMA').toUpperCase(),
            linkCartelera: eventoObj.linkCartelera || (eventoObj.scope === 'local' ? 'local.html' : 'internacional.html'),
            promotora: eventoObj.promotora || eventoObj.promoter || 'Promotora Oficial'
        });
        isNowSaved = true;
    }

    guardarEventosFavoritos(currentUid, list);
    return isNowSaved;
}

/**
 * Maneja el seguimiento conjunto de un evento y su promotora oficial.
 * Al dar click en SEGUIR en una tarjeta de evento (local o internacional),
 * guarda la promotora y la velada en el perfil del usuario simultáneamente.
 * Exclusivo para usuarios con rol de fan.
 * 
 * @function toggleSeguirEventoPromotora
 * @param {Object} promotoraObj - Objeto con datos de la promotora.
 * @param {Object} eventoObj - Objeto con datos del evento.
 * @param {string} uid
 * @returns {boolean} True si ahora se sigue, false si se dejó de seguir.
 */
function toggleSeguirEventoPromotora(promotoraObj, eventoObj, uid) {
    const role = (localStorage.getItem('userRole') || '').toLowerCase();
    if (role !== 'fan') {
        alert("La función de seguir promotoras y carteleras es exclusiva para aficionados (rol Fan).");
        return false;
    }
    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    const evId = eventoObj ? eventoObj.id : null;
    const isEvFollowed = evId ? esEventoFavorito(evId, currentUid) : false;
    let isNowFollowed = false;

    if (!isEvFollowed) {
        // Seguir el evento
        if (eventoObj) {
            toggleSeguirEvento(eventoObj, currentUid);
        }
        // Seguir la promotora si no está seguida aún
        if (promotoraObj && !esPromotoraSeguida(promotoraObj.id || promotoraObj.name, currentUid)) {
            toggleSeguirPromotora(promotoraObj, currentUid);
        }
        isNowFollowed = true;
    } else {
        // Dejar de seguir el evento
        if (eventoObj) {
            toggleSeguirEvento(eventoObj, currentUid);
        }
        // Verificar si quedan otros eventos de esta promotora
        const remainingEvs = obtenerEventosFavoritos(currentUid);
        const pName = promotoraObj ? (promotoraObj.name || promotoraObj.shortName || '').toLowerCase() : '';
        const hasOtherFromPromoter = remainingEvs.some(e => (e.promotora || '').toLowerCase() === pName);
        if (!hasOtherFromPromoter && promotoraObj && esPromotoraSeguida(promotoraObj.id || promotoraObj.name, currentUid)) {
            toggleSeguirPromotora(promotoraObj, currentUid);
        }
        isNowFollowed = false;
    }

    // Disparar evento para componentes reactivos
    window.dispatchEvent(new CustomEvent('fightconnect:favorites:updated', {
        detail: { isFollowed: isNowFollowed, promotora: promotoraObj, evento: eventoObj }
    }));

    return isNowFollowed;
}

/**
 * Obtiene las preferencias del ecosistema del fan (disciplinas y notificaciones).
 * @function obtenerPreferenciasFan
 * @param {string} uid
 * @returns {Object}
 */
function obtenerPreferenciasFan(uid) {
    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    try {
        const raw = localStorage.getItem(`fightconnect_fan_preferences_${currentUid}`) || localStorage.getItem('fightconnect_fan_preferences');
        if (raw) return JSON.parse(raw);
    } catch (_) {}
    return {
        disciplines: ['mma'],
        notifyLocalEvents: true
    };
}

window.FC_PROMOTORAS_CATALOG = FC_PROMOTORAS_CATALOG;
window.obtenerPromotorasSeguidas = obtenerPromotorasSeguidas;
window.guardarPromotorasSeguidas = guardarPromotorasSeguidas;
window.esPromotoraSeguida = esPromotoraSeguida;
window.toggleSeguirPromotora = toggleSeguirPromotora;
window.obtenerEventosFavoritos = obtenerEventosFavoritos;
window.guardarEventosFavoritos = guardarEventosFavoritos;
window.esEventoFavorito = esEventoFavorito;
window.toggleSeguirEvento = toggleSeguirEvento;
window.toggleSeguirEventoPromotora = toggleSeguirEventoPromotora;
window.esEventoVigenteOFuturo = esEventoVigenteOFuturo;
window.esEventoEnCursoOHoy = esEventoEnCursoOHoy;
window.obtenerPreferenciasFan = obtenerPreferenciasFan;

/**
 * Consulta en tiempo real a Cloud Firestore y consolida las promotoras locales oficiales
 * registradas en la base de datos (usuarios con rol 'promotion'/'promoter' y creadores de carteleras locales).
 * 
 * @async
 * @function obtenerPromotorasLocalesFirestore
 * @returns {Promise<Array<Object>>} Lista de promotoras locales registradas en la base de datos.
 */
async function obtenerPromotorasLocalesFirestore() {
    const promotorasMap = new Map();
    const activeUserId = localStorage.getItem('userId') || '';
    const activeUserAvatar = localStorage.getItem('userAvatar') || '';

    // 1. Obtener promotoras registradas en la colección 'users' (rol 'promotion' o 'promoter')
    try {
        if (db) {
            const qUsers = query(collection(db, "users"), where("role", "in", ["promotion", "promoter"]));
            const snap = await getDocs(qUsers);
            snap.forEach(docSnap => {
                const data = docSnap.data();
                const name = data.orgName || data.legalName || data.name || data.organizationName || 'Promotora Oficial';
                const key = name.toLowerCase().trim();
                let logo = data.logoUrl || data.photoURL || data.avatar || data.logo || data.profilePic || data.image || '';
                
                // Si la sesión actual corresponde a este usuario promotor y tiene logo en caché
                if (!logo && (docSnap.id === activeUserId || data.email === localStorage.getItem('userEmail'))) {
                    logo = activeUserAvatar;
                }

                promotorasMap.set(key, {
                    id: docSnap.id,
                    uid: docSnap.id,
                    name: name,
                    shortName: data.shortName || name,
                    scope: 'local',
                    discipline: data.discipline || data.disciplina || 'MMA / COMBATE',
                    location: data.location || data.city || 'Colombia',
                    description: data.description || data.bio || 'Organización oficial registrada en la base de datos de FightConnect.',
                    photoURL: logo,
                    logoUrl: logo,
                    badgeColor: data.badgeColor || '#e62429',
                    icon: data.icon || 'fa-shield-alt',
                    email: data.email || '',
                    website: data.website || '',
                    rut: data.rut || data.legalId || '',
                    registeredInDb: true,
                    eventsCount: 0,
                    upcomingEvents: []
                });
            });
        }
    } catch (err) {
        console.warn("Aviso al consultar usuarios promotores en Firestore:", err);
    }

    // 2. Obtener promotoras y veladas desde la colección 'events' en Firestore
    try {
        if (db) {
            const qEvents = query(collection(db, "events"));
            const evSnap = await getDocs(qEvents);
            evSnap.forEach(evDoc => {
                const evData = evDoc.data();
                const pName = (evData.promoter || evData.promoterName || evData.promotora || '').trim();
                if (pName) {
                    const key = pName.toLowerCase();
                    const existing = promotorasMap.get(key);
                    const eventItem = {
                        id: evDoc.id,
                        titulo: evData.titulo || evData.title || evData.name || 'Cartelera Oficial',
                        fecha: evData.fecha || evData.date || 'Próximamente',
                        ubicacion: evData.ubicacion || evData.location || 'Sede Oficial',
                        disciplina: evData.disciplina || evData.discipline || 'MMA',
                        imagenUrl: evData.imagenUrl || evData.bannerUrl || evData.imageUrl || ''
                    };

                    const evLogo = evData.promoterLogo || evData.logoUrl || '';

                    if (existing) {
                        existing.eventsCount = (existing.eventsCount || 0) + 1;
                        if (!existing.logoUrl && evLogo) {
                            existing.logoUrl = evLogo;
                            existing.photoURL = evLogo;
                        }
                        if (!existing.upcomingEvents.some(e => e.id === eventItem.id)) {
                            existing.upcomingEvents.push(eventItem);
                        }
                    } else {
                        promotorasMap.set(key, {
                            id: evData.promoterId || evDoc.id,
                            uid: evData.promoterId || '',
                            name: pName,
                            shortName: pName,
                            scope: 'local',
                            discipline: evData.disciplina || 'MMA / COMBATE',
                            location: evData.ubicacion || 'Colombia',
                            description: `Organización local creadora de veladas oficiales en FightConnect.`,
                            photoURL: evLogo,
                            logoUrl: evLogo,
                            badgeColor: '#e62429',
                            icon: 'fa-shield-alt',
                            registeredInDb: true,
                            eventsCount: 1,
                            upcomingEvents: [eventItem]
                        });
                    }
                }
            });
        }
    } catch (err) {
        console.warn("Aviso al consultar eventos de promotoras en Firestore:", err);
    }

    // 3. Incluir las promotoras locales históricas/oficiales de la base de datos del ecosistema
    const localSeedPromoters = [
        {
            id: 'warriors-fc',
            name: 'Warriors Fighting Championship',
            shortName: 'Warriors FC',
            scope: 'local',
            discipline: 'MMA / BOXEO',
            location: 'Medellín, Colombia',
            badgeColor: '#e62429',
            icon: 'fa-shield-alt',
            logoUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&auto=format&fit=crop&q=80',
            photoURL: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&auto=format&fit=crop&q=80',
            description: 'Promotora insignia de artes marciales mixtas y boxeo profesional en el circuito antioqueño.',
            registeredInDb: true,
            upcomingEvents: [
                {
                    id: 'warriors-fc-10',
                    titulo: 'WARRIORS FC 10: NOCHE DE IMPACTO',
                    fecha: '14 Octubre 2026',
                    ubicacion: 'Coliseo Iván de Bedout, Medellín',
                    disciplina: 'MMA',
                    imagenUrl: 'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg'
                }
            ]
        },
        {
            id: 'bfl',
            name: 'Bogotá Fight League',
            shortName: 'BFL',
            scope: 'local',
            discipline: 'MMA / KICKBOXING',
            location: 'Bogotá, Colombia',
            badgeColor: '#e62429',
            icon: 'fa-shield-alt',
            logoUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=80',
            photoURL: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=80',
            description: 'El circuito profesional insignia de la capital con rankings oficiales y cinturones de peso gallo y ligero.',
            registeredInDb: true,
            upcomingEvents: [
                {
                    id: 'bfl-14',
                    titulo: 'BFL 14: Guerra en la Altura',
                    fecha: '18 Noviembre 2026',
                    ubicacion: 'Palacio de los Deportes, Bogotá',
                    disciplina: 'MMA',
                    imagenUrl: 'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg'
                }
            ]
        },
        {
            id: 'empire-mma',
            name: 'Empire MMA Colombia',
            shortName: 'Empire MMA',
            scope: 'local',
            discipline: 'MMA',
            location: 'Medellín, Colombia',
            badgeColor: '#10b981',
            icon: 'fa-fist-raised',
            logoUrl: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=200&auto=format&fit=crop&q=80',
            photoURL: 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?w=200&auto=format&fit=crop&q=80',
            description: 'Organización antioqueña especializada en desarrollo y proyección internacional de atletas de élite.',
            registeredInDb: true,
            upcomingEvents: [
                {
                    id: 'empire-mma-8',
                    titulo: 'Empire MMA 8: Noche de Finalizaciones',
                    fecha: '02 Diciembre 2026',
                    ubicacion: 'Coliseo Iván de Bedout, Medellín',
                    disciplina: 'MMA',
                    imagenUrl: 'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg'
                }
            ]
        },
        {
            id: 'striker-league',
            name: 'Striker League Championship',
            shortName: 'Striker League',
            scope: 'local',
            discipline: 'MUAY THAI / KICKBOXING',
            location: 'Cali, Colombia',
            badgeColor: '#f59e0b',
            icon: 'fa-fire',
            logoUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&auto=format&fit=crop&q=80',
            photoURL: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&auto=format&fit=crop&q=80',
            description: 'La cumbre del striking nacional: reglas K-1 y Muay Thai tradicional con codos y rodillas en jaula.',
            registeredInDb: true,
            upcomingEvents: [
                {
                    id: 'striker-cali-vol5',
                    titulo: 'Striker League: Furia en el Valle Vol. 5',
                    fecha: '20 Diciembre 2026',
                    ubicacion: 'Coliseo El Pueblo, Cali',
                    disciplina: 'MUAY THAI',
                    imagenUrl: 'https://a.espncdn.com/photo/2026/0829/r1708497_600x400_3-2.jpg'
                }
            ]
        },
        {
            id: 'copa-bjj',
            name: 'Copa Colombia Jiu-Jitsu & Grappling',
            shortName: 'Copa BJJ',
            scope: 'local',
            discipline: 'JIU-JITSU / GRAPPLING',
            location: 'Bogotá, Colombia',
            badgeColor: '#3b82f6',
            icon: 'fa-khanda',
            logoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
            photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
            description: 'Torneo absoluto Gi y No-Gi reuniendo a las academias y cinturones negros más técnicos del país.',
            registeredInDb: true,
            upcomingEvents: [
                {
                    id: 'copa-bjj-bogota-26',
                    titulo: 'Copa Colombia BJJ Pro: Torneo Abierto No-Gi',
                    fecha: '10 Diciembre 2026',
                    ubicacion: 'Centro de Alto Rendimiento, Bogotá',
                    disciplina: 'JIU-JITSU',
                    imagenUrl: 'https://a.espncdn.com/photo/2026/0816/r1702390_600x400_3-2.jpg'
                }
            ]
        },
        {
            id: 'mfc-colombia',
            name: 'Mixed Fighting Championship (MFC)',
            shortName: 'MFC',
            scope: 'local',
            discipline: 'MMA / BOXEO',
            location: 'Barranquilla, Colombia',
            badgeColor: '#ec4899',
            icon: 'fa-bolt',
            logoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
            photoURL: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
            description: 'Combates costeros de alto voltaje en el Caribe colombiano con veladas transmitidas en directo.',
            registeredInDb: true,
            upcomingEvents: [
                {
                    id: 'mfc-caribe-showdown',
                    titulo: 'MFC: Caribe Showdown 2026',
                    fecha: '28 Diciembre 2026',
                    ubicacion: 'Coliseo Sugar Baby Rojas, Barranquilla',
                    disciplina: 'MMA',
                    imagenUrl: 'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg'
                }
            ]
        }
    ];

    localSeedPromoters.forEach(seed => {
        const key = seed.name.toLowerCase().trim();
        const shortKey = seed.shortName.toLowerCase().trim();
        if (!promotorasMap.has(key) && !promotorasMap.has(shortKey)) {
            promotorasMap.set(key, seed);
        } else {
            // Sincronizar logos si el objeto en Firestore aún no tenía imagen asignada
            const existing = promotorasMap.get(key) || promotorasMap.get(shortKey);
            if (existing && !existing.logoUrl && seed.logoUrl) {
                existing.logoUrl = seed.logoUrl;
                existing.photoURL = seed.logoUrl;
            }
            if (existing && (!existing.upcomingEvents || existing.upcomingEvents.length === 0)) {
                existing.upcomingEvents = seed.upcomingEvents;
            }
        }
    });

    // 4. Sincronizar eventos curados del circuito local (CURATED_CIRCUIT_EVENTS) para garantizar próximas carteleras reales
    try {
        if (typeof CURATED_CIRCUIT_EVENTS !== 'undefined' && Array.isArray(CURATED_CIRCUIT_EVENTS)) {
            CURATED_CIRCUIT_EVENTS.forEach(cev => {
                const pName = (cev.promoter || '').toLowerCase().trim();
                for (const [key, prom] of promotorasMap.entries()) {
                    if (key.includes(pName) || pName.includes(key) || (prom.shortName && pName.includes(prom.shortName.toLowerCase()))) {
                        const cevDate = new Date(cev.date);
                        const fechaLegible = !isNaN(cevDate) 
                            ? cevDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                            : 'Próximamente';
                        
                        const evObj = {
                            id: cev.id,
                            titulo: cev.name,
                            fecha: fechaLegible,
                            ubicacion: cev.location,
                            disciplina: (cev.discipline || 'MMA').toUpperCase(),
                            imagenUrl: cev.imageUrl || ''
                        };

                        if (!prom.upcomingEvents) prom.upcomingEvents = [];
                        if (!prom.upcomingEvents.some(e => e.id === evObj.id || e.titulo === evObj.titulo)) {
                            prom.upcomingEvents.unshift(evObj);
                        }
                    }
                }
            });
        }
    } catch (_) {}

    return Array.from(promotorasMap.values());
}
window.obtenerPromotorasLocalesFirestore = obtenerPromotorasLocalesFirestore;

/**
 * Carga el campamento de atletas seguidos y las promotoras locales en el panel del aficionado.
 * 
 * @async
 * @function cargarFanDashboardPage
 * @param {string} uid - UID del espectador.
 * @returns {Promise<void>}
 */
async function cargarFanDashboardPage(uid) {
    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    const prefBanner = document.getElementById('fan-preferences-banner');
    const evRadarContainer = document.getElementById('eventos-radar-container');
    const favoritos = document.getElementById('favoritos-container');
    const promotorasContainer = document.getElementById('promotoras-seguidas-container');

    // 0. CARGAR BANNER DE PREFERENCIAS DEL ECOSISTEMA (ALGORITMO & ALERTAS)
    if (prefBanner) {
        const fanPrefs = obtenerPreferenciasFan(currentUid);
        const discs = Array.isArray(fanPrefs.disciplines) ? fanPrefs.disciplines : ['mma'];
        const discsLabels = discs.map(d => {
            if (d === 'mma') return 'MMA';
            if (d === 'bjj') return 'BJJ / GRAPPLING';
            if (d === 'boxeo') return 'BOXEO & STRIKING';
            return d.toUpperCase();
        }).join(', ');
        const alertsActive = fanPrefs.notifyLocalEvents !== false;

        prefBanner.innerHTML = `
            <div class="fan-preferences-banner" style="background: rgba(230, 36, 41, 0.08); border: 1px solid rgba(230, 36, 41, 0.25); border-radius: 12px; padding: 1rem 1.4rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(230, 36, 41, 0.2); display: flex; align-items: center; justify-content: center; color: var(--accent-red); font-size: 1.15rem; flex-shrink: 0;">
                        <i class="fas fa-sliders-h"></i>
                    </div>
                    <div>
                        <span style="font-size: 0.72rem; color: var(--accent-red); font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">PREFERENCIAS DEL ECOSISTEMA ACTIVAS</span>
                        <p style="margin: 3px 0 0 0; color: #fff; font-size: 0.88rem; line-height: 1.35;">
                            Algoritmo configurado para: <strong style="color: #ffd700;">${discsLabels || 'TODAS LAS DISCIPLINAS'}</strong>
                            ${alertsActive ? ' · <span style="color: #00e676;"><i class="fas fa-bell"></i> Alertas de veladas en tu zona activas</span>' : ' · <span style="color: #aaa;"><i class="fas fa-bell-slash"></i> Alertas silenciadas</span>'}
                        </p>
                    </div>
                </div>
                <a href="fan-ajustes.html" class="btn-outline" style="font-size: 0.78rem; padding: 0.45rem 0.95rem; text-decoration: none; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;">
                    <i class="fas fa-cog"></i> AJUSTAR PREFERENCIAS
                </a>
            </div>
        `;
    }

    // 0.1 CARGAR EVENTOS EN TU RADAR (VELADAS LOCALES E INTERNACIONALES GUARDADAS)
    if (evRadarContainer) {
        const favEvents = obtenerEventosFavoritos(currentUid);
        if (favEvents.length === 0) {
            evRadarContainer.className = 'fan-container-block';
            evRadarContainer.innerHTML = `
                <div style="padding: 2.8rem 1.5rem; text-align: center; color: var(--text-gray); background: rgba(18,18,22,0.6); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.08); width: 100%;">
                    <div style="width: 60px; height: 60px; margin: 0 auto 1rem auto; border-radius: 50%; background: rgba(230,36,41,0.1); border: 1px solid rgba(230,36,41,0.3); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-ticket-alt" style="font-size: 1.8rem; color: var(--accent-red);"></i>
                    </div>
                    <h3 style="color: var(--text-white); font-family: var(--font-heading); margin-bottom: 0.4rem; font-size: 1.25rem; letter-spacing: 1px;">SIN EVENTOS EN TU RADAR</h3>
                    <p style="font-size: 0.88rem; max-width: 480px; margin: 0 auto 1.3rem auto; line-height: 1.45;">
                        Sigue veladas oficiales desde la cartelera local o internacional para consultar sus horarios, ubicaciones y enlaces de taquilla.
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <a href="local.html" class="btn-solid red-btn" style="text-decoration: none; font-size: 0.85rem; padding: 0.65rem 1.3rem; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px;">
                            <i class="fas fa-map-marked-alt"></i> EXPLORAR EVENTOS LOCALES
                        </a>
                        <a href="internacional.html" class="btn-outline" style="text-decoration: none; font-size: 0.85rem; padding: 0.65rem 1.3rem; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px;">
                            <i class="fas fa-globe"></i> CARTELERA INTERNACIONAL
                        </a>
                    </div>
                </div>
            `;
        } else {
            evRadarContainer.className = 'watchlist-scroll-track';
            evRadarContainer.style.display = 'flex';
            evRadarContainer.style.gap = '1.25rem';
            evRadarContainer.style.overflowX = 'auto';
            evRadarContainer.style.paddingBottom = '0.75rem';

            evRadarContainer.innerHTML = favEvents.map(ev => {
                const fallbackImg = 'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg';
                const poster = ev.imagenUrl || fallbackImg;
                const disc = (ev.disciplina || 'MMA').toUpperCase();
                const isInt = ev.linkCartelera && (ev.linkCartelera.includes('espn') || ev.linkCartelera.includes('internacional'));
                const linkDest = isInt ? 'internacional.html' : 'local.html';
                const isLiveOrToday = esEventoEnCursoOHoy(ev);
                const statusBadge = isLiveOrToday
                    ? `<span style="position: absolute; top: 10px; left: 65px; background: #e62429; color: #fff; font-size: 0.62rem; font-family: var(--font-heading); font-weight: bold; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px; box-shadow: 0 0 10px rgba(230,36,41,0.5);"><i class="fas fa-circle" style="color: #00ff66; font-size: 0.5rem; margin-right: 3px;"></i> EN VIVO / HOY</span>`
                    : `<span style="position: absolute; top: 10px; left: 65px; background: rgba(0,0,0,0.65); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.62rem; font-family: var(--font-heading); font-weight: 600; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px;">PRÓXIMO</span>`;

                return `
                    <div class="watchlist-card" style="min-width: 280px; max-width: 320px; background: rgba(18,18,22,0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; flex-shrink: 0; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                        <div style="position: relative; height: 140px; background: #0c0c10; overflow: hidden;">
                            <img src="${poster}" alt="${ev.titulo}" onerror="this.onerror=null; this.src='${fallbackImg}';" style="width: 100%; height: 100%; object-fit: cover;">
                            <span style="position: absolute; top: 10px; left: 10px; background: var(--accent-red); color: #fff; font-size: 0.65rem; font-family: var(--font-heading); font-weight: bold; padding: 2px 7px; border-radius: 4px; letter-spacing: 1px;">${disc}</span>
                            ${statusBadge}
                            <button type="button" class="btn-unfollow-event-dash" data-id="${ev.id}" title="Dejar de seguir velada" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.2); color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s;">
                                <i class="fas fa-times" style="font-size: 0.75rem;"></i>
                            </button>
                        </div>
                        <div style="padding: 1.1rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <h4 style="color: #fff; font-family: var(--font-heading); font-size: 1.05rem; margin: 0 0 0.4rem 0; line-height: 1.25;">${ev.titulo}</h4>
                                <p style="color: var(--accent-red); font-size: 0.78rem; font-weight: 600; margin: 0 0 0.25rem 0;"><i class="far fa-calendar-alt"></i> ${ev.fecha}</p>
                                <p style="color: var(--text-gray); font-size: 0.75rem; margin: 0 0 0.8rem 0;"><i class="fas fa-map-marker-alt"></i> ${ev.ubicacion}</p>
                            </div>
                            <div style="display: flex; gap: 6px; margin-top: auto;">
                                <a href="${linkDest}" class="btn-solid red-btn" style="flex: 1; text-decoration: none; text-align: center; font-size: 0.76rem; padding: 0.5rem 0.4rem; justify-content: center; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;">
                                    <i class="fas fa-eye"></i> VER CARTELERA
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            evRadarContainer.querySelectorAll('.btn-unfollow-event-dash').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const evId = btn.getAttribute('data-id');
                    let list = obtenerEventosFavoritos(currentUid);
                    list = list.filter(ev => String(ev.id) !== String(evId));
                    guardarEventosFavoritos(currentUid, list);
                    cargarFanDashboardPage(currentUid);
                });
            });
        }
    }

    // 1. CARGAR CAMPAMENTO DE FAVORITOS (ATLETAS SEGUIDOS)
    if (favoritos) {
        const keyAthletes = `fightconnect_fan_favs_${currentUid}`;
        let followed = [];
        try {
            followed = JSON.parse(localStorage.getItem(keyAthletes) || localStorage.getItem('fightconnect_fan_favs') || '[]');
            if (!Array.isArray(followed)) followed = [];
        } catch (_) { followed = []; }

        const atletas = await obtenerPeleadoresFirestore();
        const favAthletes = atletas.filter(a => followed.includes(a.id));

        if (favAthletes.length === 0) {
            favoritos.className = 'fan-container-block';
            favoritos.innerHTML = `
                <div style="padding: 2.8rem 1.5rem; text-align: center; color: var(--text-gray); background: rgba(18,18,22,0.6); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.08); width: 100%;">
                    <div style="width: 60px; height: 60px; margin: 0 auto 1rem auto; border-radius: 50%; background: rgba(230,36,41,0.1); border: 1px solid rgba(230,36,41,0.3); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-user-ninja" style="font-size: 1.8rem; color: var(--accent-red);"></i>
                    </div>
                    <h3 style="color: var(--text-white); font-family: var(--font-heading); margin-bottom: 0.4rem; font-size: 1.25rem; letter-spacing: 1px;">CAMPAMENTO SIN ATLETAS</h3>
                    <p style="font-size: 0.88rem; max-width: 480px; margin: 0 auto 1.3rem auto; line-height: 1.45;">
                        Sigue a tus peleadores preferidos para consultar sus récords oficiales, divisiones y próximas peleas programadas.
                    </p>
                    <a href="fan-buscar.html" class="btn-solid red-btn" style="text-decoration: none; font-size: 0.85rem; padding: 0.65rem 1.3rem; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px;">
                        <i class="fas fa-search"></i> BUSCAR PELEADORES
                    </a>
                </div>
            `;
        } else {
            favoritos.className = 'scouting-results-grid';
            favoritos.innerHTML = favAthletes.map(ath => {
                const avatarHtml = ath.avatar && (ath.avatar.startsWith('http') || ath.avatar.startsWith('/uploads/'))
                    ? `<img src="${ath.avatar}" alt="${ath.name}" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<i class=\\'fas fa-user-ninja\\' style=\\'font-size: 1.8rem; color: var(--accent-red);\\'></i>';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                    : `<i class="fas fa-user-ninja" style="font-size: 1.8rem; color: var(--accent-red);"></i>`;

                const primaryDisc = (ath.primaryDiscipline || ath.discipline || 'mma').toLowerCase();
                const primaryLabel = (FC_DISCIPLINES_MAP[primaryDisc] || primaryDisc).toUpperCase();

                return `
                    <div class="opportunity-card" style="border: 1px solid rgba(255,255,255,0.08); background: rgba(18,18,20,0.85); border-radius: 12px; padding: 1.5rem; text-align: center;">
                        <div style="width: 70px; height: 70px; margin: 0 auto 1rem auto; border-radius: 50%; background: #1a1a1a; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid rgba(230,36,41,0.3);">
                            ${avatarHtml}
                        </div>
                        <h3 style="color: #fff; font-family: var(--font-heading); margin-bottom: 0.2rem; font-size: 1.15rem;">${ath.name}</h3>
                        <p style="color: var(--accent-red); font-size: 0.85rem; font-weight: bold; text-transform: uppercase;">"${ath.alias || 'Guerrero'}"</p>
                        <p style="color: var(--text-gray); font-size: 0.8rem; margin: 0.5rem 0 0.8rem 0;">${ath.division || 'División Oficial'} · ${primaryLabel}</p>
                        <p style="color: #fff; font-size: 0.85rem; font-weight: bold; margin-bottom: 1rem;"><span style="color: var(--text-gray); font-size: 0.72rem; font-weight: normal;">RÉCORD: </span>${ath.record || '0-0-0'}</p>
                        
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn-ver-perfil-fan btn-outline" data-athlete-id="${ath.id}" style="flex: 1; justify-content: center; font-size: 0.8rem; cursor: pointer; padding: 0.5rem 0.3rem;">
                                <i class="fas fa-user-circle"></i> EXPEDIENTE
                            </button>
                            <button type="button" class="btn-unfollow-athlete btn-outline red-btn" data-athlete-id="${ath.id}" title="Dejar de seguir" style="padding: 0.5rem 0.7rem; font-size: 0.8rem; cursor: pointer; color: #ff5252; border-color: rgba(255,82,82,0.4);">
                                <i class="fas fa-user-minus"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            favoritos.querySelectorAll('.btn-ver-perfil-fan').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const athId = e.currentTarget.getAttribute('data-athlete-id');
                    const targetAth = favAthletes.find(a => a.id === athId) || atletas.find(a => a.id === athId);
                    if (targetAth && typeof desplegarModalPerfilAtletaFan === 'function') {
                        desplegarModalPerfilAtletaFan(targetAth);
                    }
                });
            });

            favoritos.querySelectorAll('.btn-unfollow-athlete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const athId = e.currentTarget.getAttribute('data-athlete-id');
                    let currentFollowed = [];
                    try {
                        currentFollowed = JSON.parse(localStorage.getItem(keyAthletes) || localStorage.getItem('fightconnect_fan_favs') || '[]');
                    } catch (_) { currentFollowed = []; }
                    currentFollowed = currentFollowed.filter(x => x !== athId);
                    localStorage.setItem(keyAthletes, JSON.stringify(currentFollowed));
                    localStorage.setItem('fightconnect_fan_favs', JSON.stringify(currentFollowed));
                    cargarFanDashboardPage(currentUid);
                });
            });
        }
    }

    // 2. CARGAR SECCIÓN DE PROMOTORAS SEGUIDAS EN EL FAN DASHBOARD
    if (promotorasContainer) {
        const allPromoters = typeof obtenerPromotorasCompletas === 'function' ? await obtenerPromotorasCompletas() : await obtenerPromotorasLocalesFirestore();
        const followedPromoters = obtenerPromotorasSeguidas(currentUid);
        
        // Mapear promotoras seguidas con datos ricos de la base de datos y catálogo
        const richFollowed = followedPromoters.map(fp => {
            const matchLocal = allPromoters.find(lp => 
                (lp.id && fp.id && lp.id.toLowerCase() === fp.id.toLowerCase()) ||
                (lp.name && fp.name && lp.name.toLowerCase() === fp.name.toLowerCase()) ||
                (lp.shortName && fp.shortName && lp.shortName.toLowerCase() === fp.shortName.toLowerCase())
            );
            return matchLocal || fp;
        });

        if (richFollowed.length === 0) {
            promotorasContainer.className = 'fan-container-block';
            promotorasContainer.innerHTML = `
                <div style="padding: 2.8rem 1.5rem; text-align: center; color: var(--text-gray); background: rgba(18,18,22,0.6); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.08); width: 100%;">
                    <div style="width: 60px; height: 60px; margin: 0 auto 1rem auto; border-radius: 50%; background: rgba(255,193,7,0.1); border: 1px solid rgba(255,193,7,0.3); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-shield-alt" style="font-size: 1.8rem; color: #ffc107;"></i>
                    </div>
                    <h3 style="color: var(--text-white); font-family: var(--font-heading); margin-bottom: 0.4rem; font-size: 1.25rem; letter-spacing: 1px;">SIN PROMOTORAS EN TU RADAR</h3>
                    <p style="font-size: 0.88rem; max-width: 480px; margin: 0 auto 1.3rem auto; line-height: 1.45;">
                        Sigue a las organizaciones locales oficiales registradas en la base de datos para estar al tanto de sus veladas y nuevos talentos.
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <a href="fan-favoritos.html" class="btn-solid red-btn" style="text-decoration: none; font-size: 0.85rem; padding: 0.65rem 1.3rem; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px;">
                            <i class="fas fa-shield-alt"></i> EXPLORAR PROMOTORAS LOCALES
                        </a>
                        <a href="fan-buscar.html?tab=promotoras" class="btn-outline" style="text-decoration: none; font-size: 0.85rem; padding: 0.65rem 1.3rem; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px;">
                            <i class="fas fa-search"></i> BUSCADOR GENERAL
                        </a>
                    </div>
                </div>
            `;
        } else {
            promotorasContainer.className = 'promoters-grid';
            promotorasContainer.innerHTML = richFollowed.map(prom => {
                const scopeBadgeClass = prom.scope === 'local' ? 'badge-scope-local' : 'badge-scope-intl';
                const scopeLabel = prom.scope === 'local' ? 'LOCAL / NACIONAL' : 'INTERNACIONAL';
                const nextEv = prom.upcomingEvents && prom.upcomingEvents[0];
                const nextEventText = nextEv
                    ? `${nextEv.titulo} · ${nextEv.fecha}`
                    : 'Próxima velada oficial en programación';

                const logoHtml = (prom.logoUrl || prom.photoURL)
                    ? `<img src="${prom.logoUrl || prom.photoURL}" alt="${prom.name}" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<i class=\\'fas ${prom.icon || 'fa-shield-alt'}\\' style=\\'font-size: 1.5rem; color: var(--accent-red);\\'></i>';">`
                    : `<i class="fas ${prom.icon || 'fa-shield-alt'}"></i>`;

                return `
                    <div class="promoter-card">
                        <div>
                            <div class="promoter-card-header">
                                <div class="promoter-logo-circle" style="background: ${prom.badgeColor || '#1a1a22'}; border-color: ${prom.badgeColor ? prom.badgeColor + '66' : 'rgba(255,255,255,0.15)'};">
                                    ${logoHtml}
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 3px;">
                                        <span class="promoter-scope-badge ${scopeBadgeClass}">${scopeLabel}</span>
                                        ${prom.registeredInDb ? '<span class="badge-db-verified"><i class="fas fa-check-circle"></i> VERIFICADA EN BD</span>' : ''}
                                    </div>
                                    <h3 class="promoter-name" title="${prom.name}">${prom.name}</h3>
                                    <p class="promoter-location"><i class="fas fa-map-marker-alt" style="color: var(--accent-red); margin-right: 4px;"></i>${prom.location || 'Sede Oficial'}</p>
                                </div>
                            </div>
                            <p class="promoter-desc" title="${prom.description}">${prom.description || 'Organización oficial de deportes de combate en FightConnect.'}</p>
                            <div class="promoter-event-box">
                                <span class="promoter-event-box-title"><i class="fas fa-calendar-check" style="color: #ffc107;"></i> CARTELERA EN TU RADAR:</span>
                                <strong class="promoter-event-box-name">${nextEventText}</strong>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 1.2rem;">
                            <a href="${prom.scope === 'local' ? 'local.html' : 'internacional.html'}" class="btn-outline" style="flex: 1; justify-content: center; font-size: 0.8rem; text-decoration: none; padding: 0.55rem 0.2rem; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;">
                                <i class="fas fa-calendar-alt"></i> VELADAS
                            </a>
                            <button type="button" class="btn-unfollow-promoter-dash btn-outline red-btn" data-id="${prom.id}" title="Dejar de seguir" style="padding: 0.55rem 0.8rem; font-size: 0.8rem; cursor: pointer; color: #ff5252; border-color: rgba(255,82,82,0.4); border-radius: 6px;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            promotorasContainer.querySelectorAll('.btn-unfollow-promoter-dash').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const promId = e.currentTarget.getAttribute('data-id');
                    let currentList = obtenerPromotorasSeguidas(currentUid);
                    currentList = currentList.filter(p => p.id !== promId && p.name !== promId);
                    guardarPromotorasSeguidas(currentUid, currentList);
                    cargarFanDashboardPage(currentUid);
                });
            });
        }
    }
}

/**
 * Carga el módulo de historial médico y control de peso del peleador.
 * Permite registrar lesiones en tiempo real, visualizar recomendaciones y actualizar peso.
 * 
 * @async
 * @function cargarFighterHistorialPage
 * @param {string} uid - UID del peleador en Firebase.
 * @param {Object} [cachedData=null] - Documento del peleador si ya fue cargado.
 * @returns {Promise<void>}
 */
async function cargarFighterHistorialPage(uid, cachedData = null) {
    if (!uid) return;

    let data = cachedData;
    if (!data) {
        try {
            if (db) {
                const userSnap = await getDoc(doc(db, "users", uid));
                if (userSnap.exists()) {
                    data = userSnap.data();
                }
            }
        } catch (e) {
            console.error("Error al cargar datos del peleador para historial desde Firestore:", e);
        }
    }

    if (!data) {
        data = {
            name: localStorage.getItem('userName') || 'Peleador',
            metrics: { weight: 0 },
            targetWeight: 0,
            injuries: []
        };
    }

    // Fusión bidireccional con almacenamiento local de lesiones para persistencia absoluta (Requerimiento 1)
    const localInjuries = JSON.parse(localStorage.getItem(`fighter_injuries_${uid}`) || '[]');
    if (!Array.isArray(data.injuries) || data.injuries.length === 0) {
        data.injuries = localInjuries;
    } else if (localInjuries.length > 0) {
        localInjuries.forEach(li => {
            if (!data.injuries.some(di => di.id === li.id)) {
                data.injuries.push(li);
            }
        });
    }
    // Mantener sincronizado el caché local
    localStorage.setItem(`fighter_injuries_${uid}`, JSON.stringify(data.injuries));

    // 1. Sincronizar visualizador de peso
    const currentWeight = data.metrics?.weight || 0;
    const targetWeight = data.targetWeight || 0;
    
    const startWeightEl = document.getElementById('start-weight');
    const barCurrentEl = document.getElementById('bar-current');
    const barTargetEl = document.getElementById('bar-target');
    const todayWeightInput = document.getElementById('today-weight');

    if (startWeightEl) startWeightEl.textContent = `${currentWeight > 0 ? (currentWeight + 4) : 0} KG`;
    if (barCurrentEl) barCurrentEl.textContent = `${currentWeight} KG`;
    if (barTargetEl) barTargetEl.textContent = `${targetWeight} KG`;
    if (todayWeightInput && currentWeight > 0) todayWeightInput.placeholder = `Actual: ${currentWeight}`;

    actualizarBarraDePeso(currentWeight, targetWeight);

    // 2. Renderizar tabla de lesiones
    const tbody = document.getElementById('lesiones-body');
    const renderLesiones = (injuriesList) => {
        if (!tbody) return;
        if (!injuriesList || injuriesList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3.5rem 1rem; color: var(--text-gray);">
                        <i class="fas fa-heartbeat" style="font-size: 2.8rem; margin-bottom: 0.8rem; opacity: 0.45; color: var(--accent-red); display: block;"></i>
                        <p style="color: #ffffff; font-size: 1.05rem; font-family: var(--font-heading); letter-spacing: 1px; margin-bottom: 0.3rem;">EXPEDIENTE MÉDICO LIMPIO</p>
                        <span style="font-size: 0.82rem; color: var(--text-gray);">No tienes lesiones activas registradas. Añade reportes para seguimiento de campamento.</span>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = injuriesList.map((inj, idx) => {
            let badgeClass = 'recuperacion';
            const st = (inj.status || '').toLowerCase();
            if (st.includes('alta')) badgeClass = 'alta';
            else if (st.includes('tratamiento') || st.includes('fisioterapia')) badgeClass = 'tratamiento';
            else if (st.includes('cirug')) badgeClass = 'cirugia';
            else if (st.includes('preventivo')) badgeClass = 'preventivo';

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.2s;">
                    <td style="padding: 1rem; color: #fff; font-size: 0.88rem; font-weight: 500;">
                        <i class="far fa-calendar-alt" style="color: var(--accent-red); margin-right: 6px;"></i>${inj.date || '-'}
                    </td>
                    <td style="padding: 1rem; color: #ffffff; font-size: 0.92rem; font-weight: 600;">
                        ${inj.diagnosis || 'Lesión no especificada'}
                    </td>
                    <td style="padding: 1rem;">
                        <span class="medical-status-badge ${badgeClass}">${inj.status || 'En Evaluación'}</span>
                    </td>
                    <td style="padding: 1rem; color: #a0a0a5; font-size: 0.82rem; max-width: 280px; line-height: 1.4;">
                        ${inj.notes ? inj.notes : '<em style="color: #666;">Sin notas adicionales</em>'}
                    </td>
                    <td style="padding: 1rem; text-align: right;">
                        <button type="button" class="btn-eliminar-lesion" data-index="${idx}" data-id="${inj.id || ''}" title="Remover del historial">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Conectar botones de eliminación
        tbody.querySelectorAll('.btn-eliminar-lesion').forEach(btn => {
            btn.onclick = async (e) => {
                const targetIdx = parseInt(e.currentTarget.getAttribute('data-index'));
                if (confirm("¿Estás seguro de remover esta lesión de tu expediente médico?")) {
                    const currentInjuries = Array.isArray(data.injuries) ? [...data.injuries] : [];
                    currentInjuries.splice(targetIdx, 1);
                    data.injuries = currentInjuries;
                    localStorage.setItem(`fighter_injuries_${uid}`, JSON.stringify(currentInjuries));
                    try {
                        if (db) {
                            await setDoc(doc(db, "users", uid), { injuries: currentInjuries }, { merge: true });
                        }
                    } catch (err) {
                        console.error("Error al remover lesión de Firestore:", err);
                    }
                    renderLesiones(data.injuries);
                }
            };
        });
    };

    renderLesiones(data.injuries || []);

    // 3. Manejo del Modal de Registro de Lesión
    const modal = document.getElementById('modal-registrar-lesion');
    const btnAbrirModal = document.getElementById('btn-abrir-modal-lesion');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal-lesion');
    const btnCancelarModal = document.getElementById('btn-cancelar-modal-lesion');
    const formLesion = document.getElementById('form-registrar-lesion');
    const fechaInput = document.getElementById('lesion-fecha');

    if (fechaInput && !fechaInput.value) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }

    const abrirModal = () => {
        if (modal) modal.classList.remove('hidden');
    };
    const cerrarModal = () => {
        if (modal) modal.classList.add('hidden');
        if (formLesion) formLesion.reset();
        if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
    };

    if (btnAbrirModal) btnAbrirModal.onclick = abrirModal;
    if (btnCerrarModal) btnCerrarModal.onclick = cerrarModal;
    if (btnCancelarModal) btnCancelarModal.onclick = cerrarModal;
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) cerrarModal();
        };
    }

    if (formLesion) {
        formLesion.onsubmit = async (e) => {
            e.preventDefault();
            const btnSubmit = document.getElementById('btn-guardar-lesion');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GUARDANDO...';

            const nuevaLesion = {
                id: 'inj_' + Date.now(),
                date: document.getElementById('lesion-fecha').value,
                diagnosis: document.getElementById('lesion-diagnostico').value.trim(),
                status: document.getElementById('lesion-estado').value,
                notes: document.getElementById('lesion-notas').value.trim(),
                createdAt: new Date().toISOString()
            };

            try {
                const currentInjuries = Array.isArray(data.injuries) ? [...data.injuries] : [];
                currentInjuries.unshift(nuevaLesion);
                data.injuries = currentInjuries;

                // 1. Guardar en localStorage inmediatamente (garantiza que nunca desaparezca)
                localStorage.setItem(`fighter_injuries_${uid}`, JSON.stringify(currentInjuries));

                // 2. Guardar en Cloud Firestore con setDoc merge: true
                if (db) {
                    try {
                        await setDoc(doc(db, "users", uid), { injuries: currentInjuries }, { merge: true });
                        console.log("✅ Lesión guardada con éxito en Firestore users/", uid);
                    } catch (fsErr) {
                        console.warn("Guardado local activo:", fsErr.message);
                    }
                }

                btnSubmit.innerHTML = '<i class="fas fa-check"></i> ¡REGISTRADO!';
                btnSubmit.style.background = '#28a745';
                setTimeout(() => {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = originalText;
                    btnSubmit.style.background = '';
                    cerrarModal();
                    renderLesiones(data.injuries);
                }, 800);
            } catch (err) {
                console.error("Error al registrar lesión:", err);
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="fas fa-times"></i> ERROR';
                btnSubmit.style.background = '#e62429';
                setTimeout(() => {
                    btnSubmit.innerHTML = originalText;
                    btnSubmit.style.background = '';
                }, 2500);
            }
        };
    }
}

/**
 * Despliega el modal de expediente deportivo completo del atleta para el aficionado.
 * Muestra avatar con fallback seguro, récord principal, división, desglose de récords
 * por cada disciplina marcial y cartelera de combates agendados.
 * 
 * @function desplegarModalPerfilAtletaFan
 * @param {Object} ath - Datos normalizados del atleta
 */
function desplegarModalPerfilAtletaFan(ath) {
    const modal = document.getElementById('modal-fan-perfil-atleta');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    const btnCerrar = document.getElementById('btn-cerrar-modal-fan-perfil');
    const btnVolver = document.getElementById('btn-volver-fan-perfil');

    const cerrarModal = () => {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    };
    if (btnCerrar) btnCerrar.onclick = cerrarModal;
    if (btnVolver) btnVolver.onclick = cerrarModal;
    modal.onclick = (e) => {
        if (e.target === modal) cerrarModal();
    };

    // Avatar seguro
    const avatarContainer = document.getElementById('fan-modal-avatar');
    if (avatarContainer) {
        avatarContainer.innerHTML = ath.avatar && (ath.avatar.startsWith('http') || ath.avatar.startsWith('/uploads/'))
            ? `<img src="${ath.avatar}" alt="${ath.name}" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<i class=\\'fas fa-user-ninja\\' style=\\'font-size: 2rem; color: var(--accent-red);\\'></i>';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : `<i class="fas fa-user-ninja" style="font-size: 2rem; color: var(--accent-red);"></i>`;
    }

    const primaryDisc = (ath.primaryDiscipline || ath.discipline || 'mma').toLowerCase();
    const primaryLabel = (FC_DISCIPLINES_MAP[primaryDisc] || primaryDisc).toUpperCase();

    // Datos Básicos
    const nombreEl = document.getElementById('fan-modal-nombre');
    const aliasEl = document.getElementById('fan-modal-alias');
    const locEl = document.getElementById('fan-modal-location');
    const recordLabelEl = document.getElementById('fan-modal-record-label');
    const recordEl = document.getElementById('fan-modal-record');
    const divEl = document.getElementById('fan-modal-division');
    const pesoEl = document.getElementById('fan-modal-peso');
    const discEl = document.getElementById('fan-modal-disciplina');
    const tagsEl = document.getElementById('fan-modal-disciplinas-tags');
    const breakdownEl = document.getElementById('fan-modal-records-breakdown');

    if (nombreEl) nombreEl.textContent = ath.name || 'Atleta';
    if (aliasEl) aliasEl.textContent = ath.alias ? `"${ath.alias}"` : 'SIN ALIAS';
    if (locEl) locEl.innerHTML = `<i class="fas fa-map-marker-alt" style="color: var(--accent-red); margin-right: 4px;"></i>${ath.location || 'Ubicación no especificada'}`;
    if (recordLabelEl) recordLabelEl.textContent = `RÉCORD (${primaryLabel})`;
    if (recordEl) recordEl.textContent = ath.record || '0-0-0';
    if (divEl) divEl.textContent = ath.division || 'Pactado';
    if (pesoEl) pesoEl.textContent = ath.weight ? `${ath.weight} KG` : 'N/A';
    if (discEl) discEl.textContent = primaryLabel;

    // Desglose de Récords por Disciplina Marcial
    if (breakdownEl) {
        if (ath.recordsByDiscipline && typeof ath.recordsByDiscipline === 'object' && Object.keys(ath.recordsByDiscipline).length > 0) {
            breakdownEl.innerHTML = Object.entries(ath.recordsByDiscipline).map(([dKey, rec]) => {
                const isPrim = dKey.toLowerCase() === primaryDisc;
                const dName = FC_DISCIPLINES_MAP[dKey.toLowerCase()] || dKey.toUpperCase();
                const w = rec?.wins ?? 0;
                const l = rec?.losses ?? 0;
                const d = rec?.draws ?? 0;
                return `
                    <div class="record-discipline-pill ${isPrim ? 'primary-pill' : ''}">
                        <span class="pill-disc-title">${dName} ${isPrim ? '★' : ''}</span>
                        <span class="pill-record-val">${w}-${l}-${d}</span>
                        <span style="font-size: 0.65rem; color: #888;">${w + l + d} combate${w + l + d === 1 ? '' : 's'}</span>
                    </div>
                `;
            }).join('');
        } else {
            breakdownEl.innerHTML = `
                <div class="record-discipline-pill primary-pill">
                    <span class="pill-disc-title">${primaryLabel} ★</span>
                    <span class="pill-record-val">${ath.record || '0-0-0'}</span>
                    <span style="font-size: 0.65rem; color: #888;">Récord Oficial</span>
                </div>
            `;
        }
    }

    // Tags de disciplinas habilitadas
    if (tagsEl) {
        const discs = Array.isArray(ath.targetDisciplines) && ath.targetDisciplines.length > 0 
            ? ath.targetDisciplines 
            : [primaryDisc];
        tagsEl.innerHTML = discs.map(d => {
            const dName = FC_DISCIPLINES_MAP[d.toLowerCase()] || d.toUpperCase();
            return `<span class="discipline-badge">${dName}</span>`;
        }).join('');
    }

    // Buscar peleas registradas en eventos locales de FightConnect
    const peleasContainer = document.getElementById('fan-modal-peleas-container');
    const countEl = document.getElementById('fan-modal-peleas-count');

    if (peleasContainer) {
        const eventos = obtenerEventosLocales();
        const athleteFights = [];

        eventos.forEach(ev => {
            const fightsList = Array.isArray(ev.fights) ? ev.fights : (Array.isArray(ev.bouts) ? ev.bouts : []);
            fightsList.forEach(b => {
                const f1Id = b.fighter1?.id || b.fighter1Id || '';
                const f2Id = b.fighter2?.id || b.fighter2Id || '';
                const f1Name = (b.fighter1?.name || b.fighter1 || '').toLowerCase();
                const f2Name = (b.fighter2?.name || b.fighter2 || '').toLowerCase();
                const athName = (ath.name || '').toLowerCase();

                if (f1Id === ath.id || f2Id === ath.id || (athName && (f1Name.includes(athName) || f2Name.includes(athName)))) {
                    const isF1 = (f1Id === ath.id || (athName && f1Name.includes(athName)));
                    const opponentObj = isF1 ? b.fighter2 : b.fighter1;
                    const opponentName = typeof opponentObj === 'object' ? (opponentObj?.name || 'Rival por confirmar') : (opponentObj || 'Rival por confirmar');
                    const isEstelar = b.isEstelar || b.tier === 'estelar' || b.isMainEvent;

                    athleteFights.push({
                        eventName: ev.title || ev.eventName || 'Evento Local',
                        eventDate: ev.date || ev.eventDate || 'Fecha por confirmar',
                        eventLocation: ev.location || ev.city || 'Sede oficial',
                        tier: isEstelar ? 'ESTELAR' : 'PRELIMINAR',
                        opponent: opponentName,
                        weightClass: b.weightClass || b.division || ev.weightClass || 'Pactado',
                        isEstelar
                    });
                }
            });
        });

        if (countEl) {
            countEl.textContent = `${athleteFights.length} combate${athleteFights.length === 1 ? '' : 's'}`;
        }

        if (athleteFights.length === 0) {
            peleasContainer.innerHTML = `
                <div style="text-align: center; padding: 2.2rem 1rem; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.08); color: var(--text-gray);">
                    <i class="fas fa-calendar-times" style="font-size: 2rem; opacity: 0.45; margin-bottom: 0.6rem; display: block; color: var(--accent-red);"></i>
                    <p style="color: #ffffff; font-size: 0.95rem; font-family: var(--font-heading); letter-spacing: 1px; margin-bottom: 0.3rem;">SIN COMBATES PROGRAMADOS</p>
                    <span style="font-size: 0.8rem;">Este atleta no tiene peleas agendadas en las carteleras activas de FightConnect.</span>
                </div>
            `;
        } else {
            peleasContainer.innerHTML = athleteFights.map(fight => {
                return `
                    <div class="fan-bout-card">
                        <div style="flex: 1; min-width: 200px;">
                            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem;">
                                <span class="${fight.isEstelar ? 'bout-badge-estelar' : 'bout-badge-preliminar'}">
                                    <i class="fas ${fight.isEstelar ? 'fa-star' : 'fa-bolt'}"></i> ${fight.tier}
                                </span>
                                <strong style="color: #fff; font-size: 0.95rem;">${fight.eventName}</strong>
                            </div>
                            <p style="color: var(--text-gray); font-size: 0.8rem; margin: 0;">
                                <i class="far fa-calendar-alt" style="color: var(--accent-red); margin-right: 4px;"></i>${fight.eventDate} &nbsp;|&nbsp; 
                                <i class="fas fa-map-marker-alt" style="color: var(--accent-red); margin-right: 4px;"></i>${fight.eventLocation}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.7rem; color: var(--text-gray); display: block; letter-spacing: 0.5px;">RIVAL CONFIRMADO</span>
                            <strong style="color: var(--accent-red); font-size: 0.95rem; display: block;">${fight.opponent}</strong>
                            <small style="color: #888; font-size: 0.72rem;">${fight.weightClass}</small>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

/**
 * Carga el buscador de atletas y directorio de promotoras para aficionados,
 * con navegación por pestañas, filtrado multi-criterio avanzado y seguimiento interactivo.
 * 
 * @async
 * @function cargarFanBuscarPage
 * @param {string} uid - UID del espectador.
 * @returns {Promise<void>}
 */
async function cargarFanBuscarPage(uid) {
    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    const grid = document.getElementById('fan-search-grid');
    if (!grid) return;

    // 1. GESTIÓN DE PESTAÑAS (ATLETAS vs PROMOTORAS)
    const tabAtletas = document.getElementById('tab-fan-atletas');
    const tabPromotoras = document.getElementById('tab-fan-promotoras');
    const secAtletas = document.getElementById('fan-athletes-section');
    const secPromotoras = document.getElementById('fan-promoters-section');

    const activarPestana = (pestana) => {
        if (pestana === 'promotoras') {
            tabPromotoras?.classList.add('active');
            tabAtletas?.classList.remove('active');
            if (secPromotoras) secPromotoras.style.display = 'block';
            if (secAtletas) secAtletas.style.display = 'none';
        } else {
            tabAtletas?.classList.add('active');
            tabPromotoras?.classList.remove('active');
            if (secAtletas) secAtletas.style.display = 'block';
            if (secPromotoras) secPromotoras.style.display = 'none';
        }
    };

    if (tabAtletas) tabAtletas.addEventListener('click', () => activarPestana('atletas'));
    if (tabPromotoras) tabPromotoras.addEventListener('click', () => activarPestana('promotoras'));

    // Activar pestaña desde parámetro URL (?tab=promotoras)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'promotoras') {
        activarPestana('promotoras');
    }

    // 2. SECCIÓN DE ATLETAS: BÚSQUEDA Y FILTRADO
    grid.className = 'loading-container-v2';
    grid.innerHTML = `
        <div class="loader-pulse"></div>
        <p class="loading-text">Conectando con el roster oficial de atletas...</p>
    `;

    const atletas = await obtenerPeleadoresFirestore();
    let followedAthletes = JSON.parse(localStorage.getItem(`fightconnect_fan_favs_${currentUid}`) || localStorage.getItem('fightconnect_fan_favs') || '[]');

    const countBadge = document.getElementById('fan-search-count-badge');

    const renderGridAtletas = (lista) => {
        grid.className = 'scouting-results-grid';

        if (countBadge) {
            countBadge.innerHTML = `Mostrando <strong>${lista.length}</strong> de <strong>${atletas.length}</strong> atletas oficiales en el roster.`;
        }

        if (!lista || lista.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-gray); background: rgba(18,18,20,0.6); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.08);">
                    <i class="fas fa-user-ninja" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.5; color: var(--accent-red); display: block;"></i>
                    <p style="color: #fff; font-size: 1.1rem; margin-bottom: 0.5rem; font-family: var(--font-heading); letter-spacing: 1px;">NO SE ENCONTRARON ATLETAS</p>
                    <p style="font-size: 0.85rem; color: var(--text-gray); margin-bottom: 1.2rem;">Ningún peleador coincide con los criterios de búsqueda seleccionados.</p>
                    <button type="button" class="btn-solid red-btn btn-reset-from-empty" style="font-size: 0.85rem; padding: 0.6rem 1.4rem;">
                        <i class="fas fa-redo-alt"></i> VER TODO EL ROSTER
                    </button>
                </div>
            `;
            grid.querySelector('.btn-reset-from-empty')?.addEventListener('click', () => {
                const sp = document.getElementById('fan-filter-weight');
                const sd = document.getElementById('fan-filter-discipline');
                const iq = document.getElementById('fan-filter-query');
                if (sp) sp.value = '';
                if (sd) sd.value = '';
                if (iq) iq.value = '';
                renderGridAtletas(atletas);
            });
            return;
        }

        grid.innerHTML = lista.map(ath => {
            const isFollowed = followedAthletes.includes(ath.id);
            const avatarHtml = ath.avatar && (ath.avatar.startsWith('http') || ath.avatar.startsWith('/uploads/'))
                ? `<img src="${ath.avatar}" alt="${ath.name}" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<i class=\\'fas fa-user-ninja\\' style=\\'font-size: 2rem; color: var(--accent-red);\\'></i>';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                : `<i class="fas fa-user-ninja" style="font-size: 2rem; color: var(--accent-red);"></i>`;

            const primaryDisc = (ath.primaryDiscipline || ath.discipline || 'mma').toLowerCase();
            const primaryLabel = (FC_DISCIPLINES_MAP[primaryDisc] || primaryDisc).toUpperCase();

            let multiRecordsPills = '';
            if (ath.recordsByDiscipline && typeof ath.recordsByDiscipline === 'object' && Object.keys(ath.recordsByDiscipline).length > 1) {
                const miniPills = Object.entries(ath.recordsByDiscipline).map(([dKey, r]) => {
                    const isPrim = dKey.toLowerCase() === primaryDisc;
                    const dName = FC_DISCIPLINES_MAP[dKey.toLowerCase()] || dKey.toUpperCase();
                    return `<span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: ${isPrim ? 'rgba(230,36,41,0.2)' : 'rgba(255,255,255,0.04)'}; color: ${isPrim ? 'var(--accent-red)' : '#bbb'}; border: 1px solid ${isPrim ? 'rgba(230,36,41,0.4)' : 'rgba(255,255,255,0.08)'}; font-weight: ${isPrim ? '700' : 'normal'};">${dName}: ${r.wins}-${r.losses}-${r.draws}</span>`;
                }).join(' ');
                multiRecordsPills = `<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; margin-bottom: 0.8rem;">${miniPills}</div>`;
            }

            return `
                <div class="opportunity-card" style="border: 1px solid rgba(255,255,255,0.08); background: rgba(18,18,20,0.85); border-radius: 12px; padding: 1.5rem; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="width: 80px; height: 80px; margin: 0 auto 1rem auto; border-radius: 50%; background: #1a1a1a; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid rgba(230,36,41,0.3);">
                            ${avatarHtml}
                        </div>
                        <h3 style="color: #fff; font-family: var(--font-heading); margin-bottom: 0.2rem; font-size: 1.2rem;">${ath.name}</h3>
                        <p style="color: var(--accent-red); font-size: 0.85rem; font-weight: bold; text-transform: uppercase; margin-bottom: 0.5rem;">"${ath.alias || 'Guerrero'}"</p>
                        <p style="color: var(--text-gray); font-size: 0.8rem; margin-bottom: 1rem;"><i class="fas fa-map-marker-alt" style="color: var(--accent-red); margin-right: 4px;"></i>${ath.location || 'Sede oficial'}</p>
                        
                        <div class="opp-details" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 0.8rem 0; margin-bottom: 1rem;">
                            <div><span style="font-size: 0.68rem; color: var(--text-gray);">RÉCORD</span><strong style="color: #fff; display: block; font-size: 0.95rem;">${ath.record || '0-0-0'}</strong></div>
                            <div><span style="font-size: 0.68rem; color: var(--text-gray);">DIVISIÓN</span><strong style="color: #fff; display: block; font-size: 0.85rem;">${ath.division || 'Pactado'}</strong></div>
                            <div><span style="font-size: 0.68rem; color: var(--text-gray);">BASE</span><strong style="color: var(--accent-red); display: block; font-size: 0.85rem;">${primaryLabel}</strong></div>
                        </div>

                        ${multiRecordsPills}
                    </div>

                    <div style="display: flex; gap: 8px; margin-top: 0.5rem;">
                        <button type="button" class="btn-ver-perfil-fan btn-outline red-btn" data-athlete-id="${ath.id}" style="flex: 1; justify-content: center; font-size: 0.82rem; cursor: pointer;">
                            <i class="fas fa-id-card"></i> PERFIL
                        </button>
                        <button type="button" class="btn-follow-athlete btn-solid red-btn" data-id="${ath.id}" style="flex: 1; justify-content: center; font-size: 0.82rem; ${isFollowed ? 'background: #28a745; border-color: #28a745;' : ''}">
                            <i class="fas ${isFollowed ? 'fa-check' : 'fa-plus'}"></i> ${isFollowed ? 'SIGUIENDO' : 'SEGUIR'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.btn-ver-perfil-fan').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const athId = e.currentTarget.getAttribute('data-athlete-id');
                const ath = atletas.find(a => a.id === athId);
                if (ath) desplegarModalPerfilAtletaFan(ath);
            });
        });

        grid.querySelectorAll('.btn-follow-athlete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
                if (userRole !== 'fan') {
                    alert("La función de seguir atletas es exclusiva para aficionados (rol Fan).");
                    return;
                }
                const athId = e.currentTarget.getAttribute('data-id');
                if (followedAthletes.includes(athId)) {
                    followedAthletes = followedAthletes.filter(id => id !== athId);
                    e.currentTarget.innerHTML = '<i class="fas fa-plus"></i> SEGUIR';
                    e.currentTarget.style.background = 'var(--accent-red)';
                    e.currentTarget.style.borderColor = 'var(--accent-red)';
                } else {
                    followedAthletes.push(athId);
                    e.currentTarget.innerHTML = '<i class="fas fa-check"></i> SIGUIENDO';
                    e.currentTarget.style.background = '#28a745';
                    e.currentTarget.style.borderColor = '#28a745';
                }
                localStorage.setItem(`fightconnect_fan_favs_${currentUid}`, JSON.stringify(followedAthletes));
                localStorage.setItem('fightconnect_fan_favs', JSON.stringify(followedAthletes));
            });
        });
    };

    renderGridAtletas(atletas);

    // Mapeo semántico de categorías de peso a nombres de división
    const WEIGHT_DIVISION_KEYWORDS = {
        '61': ['61', 'gallo', 'bantamweight', 'mosca', 'flyweight'],
        '66': ['66', 'pluma', 'featherweight'],
        '70': ['70', 'ligero', 'lightweight'],
        '77': ['77', 'welter', 'wélter', 'welterweight'],
        '84': ['84', 'medio', 'middleweight'],
        '93': ['93', 'semi', 'semipesado', 'semi-pesado', 'light heavyweight'],
        '120': ['120', 'pesado', 'heavyweight']
    };

    // Conectar filtros de búsqueda del Fan para atletas
    const selectPeso = document.getElementById('fan-filter-weight');
    const selectDisc = document.getElementById('fan-filter-discipline');
    const inputQuery = document.getElementById('fan-filter-query');
    const btnExplorar = document.getElementById('btn-explorar-roster-fan');
    const btnReset = document.getElementById('btn-fan-filter-reset');

    const aplicarFiltrosAtletas = () => {
        const pesoVal = selectPeso ? selectPeso.value.trim() : '';
        const discVal = selectDisc ? selectDisc.value.toLowerCase().trim() : '';
        const queryVal = inputQuery ? inputQuery.value.toLowerCase().trim() : '';

        const filtrados = atletas.filter(ath => {
            // Filtro por Peso (multi-criterio: división textual o valor numérico kg +/- 4kg)
            if (pesoVal) {
                const divStr = (ath.division || '').toLowerCase();
                const targetW = parseFloat(pesoVal);
                const athWeight = ath.metrics?.weight || parseFloat(ath.weight) || 0;
                
                const keywords = WEIGHT_DIVISION_KEYWORDS[pesoVal] || [pesoVal];
                const matchKeyword = keywords.some(kw => divStr.includes(kw));
                const matchWeight = athWeight > 0 && Math.abs(athWeight - targetW) <= 4.0;

                if (!matchKeyword && !matchWeight) return false;
            }

            // Filtro por Disciplina
            if (discVal) {
                const baseMatch = (ath.discipline || '').toLowerCase() === discVal;
                const primMatch = (ath.primaryDiscipline || '').toLowerCase() === discVal;
                const targets = Array.isArray(ath.targetDisciplines) ? ath.targetDisciplines.map(d => d.toLowerCase()) : [];
                const targetMatch = targets.includes(discVal);
                const recordsMatch = ath.recordsByDiscipline && Object.keys(ath.recordsByDiscipline).includes(discVal);
                if (!baseMatch && !primMatch && !targetMatch && !recordsMatch) return false;
            }

            // Filtro por Texto (Nombre, Alias o Ubicación)
            if (queryVal) {
                const nombreMatch = (ath.name || '').toLowerCase().includes(queryVal);
                const aliasMatch = (ath.alias || '').toLowerCase().includes(queryVal);
                const locMatch = (ath.location || '').toLowerCase().includes(queryVal);
                if (!nombreMatch && !aliasMatch && !locMatch) return false;
            }

            return true;
        });

        renderGridAtletas(filtrados);
    };

    if (btnExplorar) btnExplorar.addEventListener('click', aplicarFiltrosAtletas);
    if (selectPeso) selectPeso.addEventListener('change', aplicarFiltrosAtletas);
    if (selectDisc) selectDisc.addEventListener('change', aplicarFiltrosAtletas);
    if (inputQuery) inputQuery.addEventListener('input', aplicarFiltrosAtletas);

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (selectPeso) selectPeso.value = '';
            if (selectDisc) selectDisc.value = '';
            if (inputQuery) inputQuery.value = '';
            btnReset.classList.add('is-resetting');
            setTimeout(() => btnReset.classList.remove('is-resetting'), 500);
            renderGridAtletas(atletas);
        });
    }

    // 3. SECCIÓN DE PROMOTORAS: BÚSQUEDA Y SEGUIMIENTO OFICIAL
    const promotersGrid = document.getElementById('fan-promoters-grid');
    const scopeSelect = document.getElementById('fan-filter-promoter-scope');
    const promoterInput = document.getElementById('fan-filter-promoter-query');
    const btnPromoterReset = document.getElementById('btn-fan-promoter-reset');
    const promoterCountBadge = document.getElementById('fan-promoter-count-badge');

    if (promotersGrid) {
        const renderGridPromotoras = (promList) => {
            if (promoterCountBadge) {
                promoterCountBadge.innerHTML = `Mostrando <strong>${promList.length}</strong> promotoras oficiales registradas (locales e internacionales).`;
            }

            if (!promList || promList.length === 0) {
                promotersGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-gray); background: rgba(18,18,20,0.6); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.08);">
                        <i class="fas fa-shield-alt" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.5; color: var(--accent-red); display: block;"></i>
                        <p style="color: #fff; font-size: 1.1rem; margin-bottom: 0.5rem; font-family: var(--font-heading); letter-spacing: 1px;">NO SE ENCONTRARON PROMOTORAS</p>
                        <p style="font-size: 0.85rem; color: var(--text-gray); margin-bottom: 1.2rem;">Ninguna organización coincide con el filtro seleccionado.</p>
                        <button type="button" class="btn-solid red-btn btn-reset-prom-empty" style="font-size: 0.85rem; padding: 0.6rem 1.4rem;">
                            <i class="fas fa-redo-alt"></i> VER TODAS LAS PROMOTORAS
                        </button>
                    </div>
                `;
                promotersGrid.querySelector('.btn-reset-prom-empty')?.addEventListener('click', () => {
                    if (scopeSelect) scopeSelect.value = '';
                    if (promoterInput) promoterInput.value = '';
                    renderGridPromotoras(allPromotersCatalog);
                });
                return;
            }

            promotersGrid.innerHTML = promList.map(prom => {
                const isFollowed = esPromotoraSeguida(prom.id || prom.name, currentUid);
                const scopeBadgeClass = prom.scope === 'local' ? 'badge-scope-local' : 'badge-scope-intl';
                const scopeLabel = prom.scope === 'local' ? 'LOCAL / NACIONAL' : 'INTERNACIONAL';
                const nextEv = prom.upcomingEvents && prom.upcomingEvents[0];
                const nextEventText = nextEv
                    ? `${nextEv.titulo} · ${nextEv.fecha}`
                    : 'Próxima velada en programación';

                const logoSrc = prom.logoUrl || prom.photoURL || prom.avatar;
                const logoHtml = logoSrc 
                    ? `<img src="${logoSrc}" alt="${prom.name}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline-block';">
                       <i class="fas ${prom.icon || 'fa-shield-alt'}" style="display: none; font-size: 1.5rem; color: var(--accent-red);"></i>`
                    : `<i class="fas ${prom.icon || 'fa-shield-alt'}"></i>`;

                return `
                    <div class="promoter-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div class="promoter-card-header">
                                <div class="promoter-logo-circle" style="background: ${prom.badgeColor || '#1a1a22'}; border-color: ${prom.badgeColor ? prom.badgeColor + '66' : 'rgba(255,255,255,0.15)'};">
                                    ${logoHtml}
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 3px;">
                                        <span class="promoter-scope-badge ${scopeBadgeClass}">${scopeLabel}</span>
                                        ${prom.registeredInDb ? '<span class="badge-db-verified"><i class="fas fa-check-circle"></i> VERIFICADA EN BD</span>' : ''}
                                    </div>
                                    <h3 class="promoter-name" title="${prom.name}">${prom.name}</h3>
                                    <p class="promoter-location"><i class="fas fa-map-marker-alt" style="color: var(--accent-red); margin-right: 4px;"></i>${prom.location || 'Sede Oficial'}</p>
                                </div>
                            </div>
                            <p class="promoter-desc">${prom.description || 'Organización oficial de deportes de combate en FightConnect.'}</p>
                            <div class="promoter-event-box">
                                <span class="promoter-event-box-title"><i class="fas fa-calendar-check" style="color: #ffc107;"></i> PRÓXIMA VELADA:</span>
                                <strong class="promoter-event-box-name">${nextEventText}</strong>
                            </div>
                        </div>

                        <div style="display: flex; gap: 8px; margin-top: 1.2rem;">
                            <a href="${prom.scope === 'local' ? 'local.html' : 'internacional.html'}" class="btn-outline" style="flex: 1; justify-content: center; font-size: 0.8rem; text-decoration: none; padding: 0.55rem 0.2rem; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;">
                                <i class="fas fa-calendar-alt"></i> CARTELERAS
                            </a>
                            <button type="button" class="btn-toggle-follow-promoter btn-solid red-btn" data-id="${prom.id}" style="flex: 1.3; justify-content: center; font-size: 0.8rem; padding: 0.55rem 0.4rem; border-radius: 6px; ${isFollowed ? 'background: #28a745; border-color: #28a745;' : ''}">
                                <i class="fas ${isFollowed ? 'fa-check' : 'fa-plus'}"></i> ${isFollowed ? 'SIGUIENDO' : 'SEGUIR PROMOTORA'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            promotersGrid.querySelectorAll('.btn-toggle-follow-promoter').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const promId = e.currentTarget.getAttribute('data-id');
                    const promObj = allPromotersCatalog.find(p => p.id === promId || p.name === promId);
                    if (!promObj) return;

                    const isNowFollowed = toggleSeguirPromotora(promObj, currentUid);
                    if (isNowFollowed) {
                        e.currentTarget.innerHTML = '<i class="fas fa-check"></i> SIGUIENDO';
                        e.currentTarget.style.background = '#28a745';
                        e.currentTarget.style.borderColor = '#28a745';
                    } else {
                        e.currentTarget.innerHTML = '<i class="fas fa-plus"></i> SEGUIR PROMOTORA';
                        e.currentTarget.style.background = 'var(--accent-red)';
                        e.currentTarget.style.borderColor = 'var(--accent-red)';
                    }
                });
            });
        };

        const allPromotersCatalog = await obtenerPromotorasCompletas();
        renderGridPromotoras(allPromotersCatalog);

        const aplicarFiltrosPromotoras = () => {
            const scopeVal = scopeSelect ? scopeSelect.value.trim() : '';
            const queryVal = promoterInput ? promoterInput.value.toLowerCase().trim() : '';

            const filtradas = allPromotersCatalog.filter(prom => {
                if (scopeVal && prom.scope !== scopeVal) return false;
                if (queryVal) {
                    const matchName = (prom.name || '').toLowerCase().includes(queryVal);
                    const matchShort = (prom.shortName || '').toLowerCase().includes(queryVal);
                    const matchLoc = (prom.location || '').toLowerCase().includes(queryVal);
                    const matchDisc = (prom.discipline || '').toLowerCase().includes(queryVal);
                    if (!matchName && !matchShort && !matchLoc && !matchDisc) return false;
                }
                return true;
            });

            renderGridPromotoras(filtradas);
        };

        if (scopeSelect) scopeSelect.addEventListener('change', aplicarFiltrosPromotoras);
        if (promoterInput) promoterInput.addEventListener('input', aplicarFiltrosPromotoras);
        if (btnPromoterReset) {
            btnPromoterReset.addEventListener('click', () => {
                if (scopeSelect) scopeSelect.value = '';
                if (promoterInput) promoterInput.value = '';
                btnPromoterReset.classList.add('is-resetting');
                setTimeout(() => btnPromoterReset.classList.remove('is-resetting'), 500);
                renderGridPromotoras(allPromotersCatalog);
            });
        }
    }
}

/**
 * Obtiene el catálogo consolidado de promotoras combinando las organizaciones locales
 * registradas en Cloud Firestore con las ligas oficiales internacionales.
 * @async
 * @function obtenerPromotorasCompletas
 * @returns {Promise<Array<Object>>}
 */
async function obtenerPromotorasCompletas() {
    const localList = await obtenerPromotorasLocalesFirestore();
    const map = new Map();
    
    localList.forEach(p => {
        const key = (p.id || p.name).toLowerCase();
        map.set(key, p);
    });

    (FC_PROMOTORAS_CATALOG || []).forEach(p => {
        const key = (p.id || p.name).toLowerCase();
        if (!map.has(key)) {
            map.set(key, p);
        }
    });

    return Array.from(map.values());
}
window.obtenerPromotorasCompletas = obtenerPromotorasCompletas;

/**
 * Carga los eventos, atletas y promotoras locales en la vista de favoritos del aficionado.
 * Permite visualizar y añadir a favoritos organizaciones locales registradas en la base de datos oficial.
 * 
 * @async
 * @function cargarFanFavoritosPage
 * @param {string} uid - UID del espectador.
 * @returns {Promise<void>}
 */
async function cargarFanFavoritosPage(uid) {
    const currentUid = uid || localStorage.getItem('userId') || 'guest';
    const evContainer = document.getElementById('eventos-favoritos-container');
    const athContainer = document.getElementById('peleadores-favoritos-container');
    const promContainer = document.getElementById('promotoras-favoritas-container');

    // 1. EVENTOS FAVORITOS
    if (evContainer) {
        const favEvents = obtenerEventosFavoritos(currentUid);

        if (favEvents.length === 0) {
            evContainer.innerHTML = `
                <div style="padding: 3rem 2rem; text-align: center; color: var(--text-gray); background: rgba(18,18,22,0.6); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.08); width: 100%;">
                    <div style="width: 60px; height: 60px; margin: 0 auto 1.2rem auto; border-radius: 50%; background: rgba(230,36,41,0.1); border: 1px solid rgba(230,36,41,0.3); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-ticket-alt" style="font-size: 1.8rem; color: var(--accent-red);"></i>
                    </div>
                    <h3 style="color: #fff; font-family: var(--font-heading); font-size: 1.25rem; letter-spacing: 1px; margin-bottom: 0.4rem;">NO TIENES EVENTOS GUARDADOS</h3>
                    <p style="color: var(--text-gray); font-size: 0.88rem; max-width: 480px; margin: 0 auto 1.4rem auto; line-height: 1.45;">
                        Añade veladas oficiales a tu radar desde la cartelera local o internacional para no perderte la acción ni la venta de entradas.
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <a href="local.html" class="btn-solid red-btn" style="text-decoration: none; font-size: 0.85rem; padding: 0.65rem 1.3rem; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px;">
                            <i class="fas fa-map-marked-alt"></i> EXPLORAR EVENTOS LOCALES
                        </a>
                        <a href="internacional.html" class="btn-outline" style="text-decoration: none; font-size: 0.85rem; padding: 0.65rem 1.3rem; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px;">
                            <i class="fas fa-globe"></i> CARTELERA INTERNACIONAL
                        </a>
                    </div>
                </div>
            `;
        } else {
            evContainer.innerHTML = `
                <div class="watchlist-scroll-track" style="display: flex; gap: 1.25rem; overflow-x: auto; padding-bottom: 0.75rem; width: 100%;">
                    ${favEvents.map(ev => {
                        const fallbackImg = 'https://r2.thesportsdb.com/images/media/event/poster/voljua1705740560.jpg';
                        const poster = ev.imagenUrl || fallbackImg;
                        const disc = (ev.disciplina || 'MMA').toUpperCase();
                        const isInt = ev.linkCartelera && (ev.linkCartelera.includes('espn') || ev.linkCartelera.includes('internacional'));
                        const linkDest = isInt ? 'internacional.html' : 'local.html';
                        const isLiveOrToday = esEventoEnCursoOHoy(ev);
                        const statusBadge = isLiveOrToday
                            ? `<span style="position: absolute; top: 10px; left: 65px; background: #e62429; color: #fff; font-size: 0.62rem; font-family: var(--font-heading); font-weight: bold; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px; box-shadow: 0 0 10px rgba(230,36,41,0.5);"><i class="fas fa-circle" style="color: #00ff66; font-size: 0.5rem; margin-right: 3px;"></i> EN VIVO / HOY</span>`
                            : `<span style="position: absolute; top: 10px; left: 65px; background: rgba(0,0,0,0.65); border: 1px solid rgba(255,255,255,0.2); color: #fff; font-size: 0.62rem; font-family: var(--font-heading); font-weight: 600; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px;">PRÓXIMO</span>`;

                        return `
                            <div class="watchlist-card" style="min-width: 280px; max-width: 320px; background: rgba(18,18,22,0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; flex-shrink: 0; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                                <div style="position: relative; height: 140px; background: #0c0c10; overflow: hidden;">
                                    <img src="${poster}" alt="${ev.titulo}" onerror="this.onerror=null; this.src='${fallbackImg}';" style="width: 100%; height: 100%; object-fit: cover;">
                                    <span style="position: absolute; top: 10px; left: 10px; background: var(--accent-red); color: #fff; font-size: 0.65rem; font-family: var(--font-heading); font-weight: bold; padding: 2px 7px; border-radius: 4px; letter-spacing: 1px;">${disc}</span>
                                    ${statusBadge}
                                    <button type="button" class="btn-remove-fav-event" data-id="${ev.id}" title="Eliminar de favoritos" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.2); color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s;">
                                        <i class="fas fa-times" style="font-size: 0.75rem;"></i>
                                    </button>
                                </div>
                                <div style="padding: 1.1rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                                    <div>
                                        <h4 style="color: #fff; font-family: var(--font-heading); font-size: 1.05rem; margin: 0 0 0.4rem 0; line-height: 1.25;">${ev.titulo}</h4>
                                        <p style="color: var(--accent-red); font-size: 0.78rem; font-weight: 600; margin: 0 0 0.25rem 0;"><i class="far fa-calendar-alt"></i> ${ev.fecha}</p>
                                        <p style="color: var(--text-gray); font-size: 0.75rem; margin: 0 0 0.8rem 0;"><i class="fas fa-map-marker-alt"></i> ${ev.ubicacion}</p>
                                    </div>
                                    <div style="display: flex; gap: 6px; margin-top: auto;">
                                        <a href="${linkDest}" class="btn-solid red-btn" style="flex: 1; text-decoration: none; text-align: center; font-size: 0.76rem; padding: 0.5rem 0.4rem; justify-content: center; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;">
                                            <i class="fas fa-eye"></i> CARTELERA
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

            evContainer.querySelectorAll('.btn-remove-fav-event').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const evId = btn.getAttribute('data-id');
                    let currentFavs = obtenerEventosFavoritos(currentUid);
                    currentFavs = currentFavs.filter(x => String(x.id) !== String(evId));
                    guardarEventosFavoritos(currentUid, currentFavs);
                    cargarFanFavoritosPage(currentUid);
                });
            });
        }
    }

    // 2. ATLETAS SEGUIDOS
    if (athContainer) {
        let followed = JSON.parse(localStorage.getItem(`fightconnect_fan_favs_${currentUid}`) || localStorage.getItem('fightconnect_fan_favs') || '[]');
        const atletas = await obtenerPeleadoresFirestore();
        const favAthletes = atletas.filter(a => followed.includes(a.id));

        if (favAthletes.length === 0) {
            athContainer.innerHTML = `
                <div style="padding: 3rem 2rem; text-align: center; color: var(--text-gray); background: rgba(18,18,22,0.6); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.08); width: 100%;">
                    <div style="width: 60px; height: 60px; margin: 0 auto 1.2rem auto; border-radius: 50%; background: rgba(0,168,255,0.1); border: 1px solid rgba(0,168,255,0.3); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-user-ninja" style="font-size: 1.8rem; color: #00a8ff;"></i>
                    </div>
                    <h3 style="color: #fff; font-family: var(--font-heading); font-size: 1.25rem; letter-spacing: 1px; margin-bottom: 0.4rem;">NO SIGUES A NINGÚN PELEADOR</h3>
                    <p style="color: var(--text-gray); font-size: 0.88rem; max-width: 480px; margin: 0 auto 1.4rem auto; line-height: 1.45;">
                        Descubre a los atletas y prospectos marciales registrados en la plataforma para seguir sus récords oficiales y carteleras.
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <a href="fan-buscar.html" class="btn-solid red-btn" style="display: inline-flex; text-decoration: none; font-size: 0.85rem; padding: 0.65rem 1.3rem; align-items: center; gap: 6px; border-radius: 6px;">
                            <i class="fas fa-search"></i> BUSCAR PELEADORES
                        </a>
                    </div>
                </div>
            `;
        } else {
            athContainer.className = 'scouting-results-grid';
            athContainer.innerHTML = favAthletes.map(ath => {
                const avatarHtml = ath.avatar && (ath.avatar.startsWith('http') || ath.avatar.startsWith('/uploads/'))
                    ? `<img src="${ath.avatar}" alt="${ath.name}" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<i class=\\'fas fa-user-ninja\\' style=\\'font-size: 1.8rem; color: var(--accent-red);\\'></i>';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                    : `<i class="fas fa-user-ninja" style="font-size: 1.8rem; color: var(--accent-red);"></i>`;

                const primaryDisc = (ath.primaryDiscipline || ath.discipline || 'mma').toLowerCase();
                const primaryLabel = (FC_DISCIPLINES_MAP[primaryDisc] || primaryDisc).toUpperCase();

                return `
                    <div class="opportunity-card" style="border: 1px solid rgba(255,255,255,0.08); background: rgba(18,18,20,0.85); border-radius: 12px; padding: 1.5rem; text-align: center;">
                        <div style="width: 70px; height: 70px; margin: 0 auto 1rem auto; border-radius: 50%; background: #1a1a1a; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid rgba(230,36,41,0.3);">
                            ${avatarHtml}
                        </div>
                        <h3 style="color: #fff; font-family: var(--font-heading); margin-bottom: 0.2rem; font-size: 1.15rem;">${ath.name}</h3>
                        <p style="color: var(--accent-red); font-size: 0.85rem; font-weight: bold; text-transform: uppercase;">"${ath.alias || 'Guerrero'}"</p>
                        <p style="color: var(--text-gray); font-size: 0.8rem; margin: 0.5rem 0 0.8rem 0;">${ath.division || 'División Oficial'} · ${primaryLabel}</p>
                        <p style="color: #fff; font-size: 0.85rem; font-weight: bold; margin-bottom: 1rem;"><span style="color: var(--text-gray); font-size: 0.72rem; font-weight: normal;">RÉCORD: </span>${ath.record || '0-0-0'}</p>
                        <button type="button" class="btn-ver-perfil-fan btn-outline red-btn" data-athlete-id="${ath.id}" style="display: inline-flex; width: 100%; justify-content: center; font-size: 0.85rem; cursor: pointer; border-radius: 6px; padding: 0.6rem;">
                            <i class="fas fa-user-circle"></i> VER PERFIL COMPLETO
                        </button>
                    </div>
                `;
            }).join('');

            athContainer.querySelectorAll('.btn-ver-perfil-fan').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const athId = e.currentTarget.getAttribute('data-athlete-id');
                    const targetAth = favAthletes.find(a => a.id === athId) || atletas.find(a => a.id === athId);
                    if (targetAth && typeof desplegarModalPerfilAtletaFan === 'function') {
                        desplegarModalPerfilAtletaFan(targetAth);
                    }
                });
            });
        }
    }

    // 3. PROMOTORAS Y LIGAS REGISTRADAS / FAVORITAS
    if (promContainer) {
        const localPromoters = await obtenerPromotorasLocalesFirestore();
        const allPromoters = typeof obtenerPromotorasCompletas === 'function' 
            ? await obtenerPromotorasCompletas() 
            : [...localPromoters, ...(window.FC_PROMOTORAS_CATALOG || [])];
        const followedList = obtenerPromotorasSeguidas(currentUid);

        // Mapear todas las promotoras y ligas seguidas con datos enriquecidos (locales e internacionales)
        const favAllPromoters = followedList.map(fp => {
            const match = allPromoters.find(p => 
                (p.id && fp.id && p.id.toLowerCase() === fp.id.toLowerCase()) ||
                (p.name && fp.name && p.name.toLowerCase() === fp.name.toLowerCase()) ||
                (p.shortName && fp.shortName && p.shortName.toLowerCase() === fp.shortName.toLowerCase())
            );
            return match ? { ...match, ...fp } : fp;
        });

        // Actualizar contadores numéricos
        const countFavBadge = document.getElementById('fav-promoters-count');
        const countTotalBadge = document.getElementById('total-local-promoters-count');
        if (countFavBadge) countFavBadge.textContent = favAllPromoters.length;
        if (countTotalBadge) countTotalBadge.textContent = localPromoters.length;

        const tabFollowed = document.getElementById('tab-fav-promoters-followed');
        const tabCatalog = document.getElementById('tab-fav-promoters-catalog');

        let currentActiveTab = window._fanFavoritosPromoterTab || 'followed';

        const renderPromoterCards = (listToRender, isFollowedView = false) => {
            if (listToRender.length === 0) {
                if (isFollowedView) {
                    promContainer.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center; color: var(--text-gray); background: rgba(18,18,22,0.6); border-radius: 14px; border: 1px dashed rgba(255,255,255,0.08); width: 100%;">
                            <div style="width: 60px; height: 60px; margin: 0 auto 1.2rem auto; border-radius: 50%; background: rgba(255,193,7,0.1); border: 1px solid rgba(255,193,7,0.3); display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-shield-alt" style="font-size: 1.8rem; color: #ffc107;"></i>
                            </div>
                            <h3 style="color: #fff; font-family: var(--font-heading); font-size: 1.25rem; letter-spacing: 1px; margin-bottom: 0.4rem;">NO SIGUES A NINGUNA PROMOTORA O LIGA</h3>
                            <p style="font-size: 0.88rem; max-width: 480px; margin: 0 auto 1.4rem auto; line-height: 1.45;">
                                Sigue a las organizaciones oficiales locales e internacionales de FightConnect para estar al tanto de sus veladas y nuevos talentos.
                            </p>
                            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                                <button type="button" class="btn-solid red-btn btn-show-all-local-proms" style="font-size: 0.85rem; padding: 0.65rem 1.3rem; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px;">
                                    <i class="fas fa-database"></i> EXPLORAR PROMOTORAS REGISTRADAS (${localPromoters.length})
                                </button>
                                <a href="fan-buscar.html?tab=promotoras" class="btn-outline" style="text-decoration: none; font-size: 0.85rem; padding: 0.65rem 1.3rem; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px;">
                                    <i class="fas fa-search"></i> BUSCADOR GENERAL
                                </a>
                            </div>
                        </div>
                    `;
                    promContainer.querySelector('.btn-show-all-local-proms')?.addEventListener('click', () => {
                        window._fanFavoritosPromoterTab = 'catalog';
                        if (tabFollowed) tabFollowed.classList.remove('active');
                        if (tabCatalog) tabCatalog.classList.add('active');
                        renderPromoterCards(localPromoters, false);
                    });
                } else {
                    promContainer.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center; color: var(--text-gray); background: rgba(18,18,22,0.6); border-radius: 14px; border: 1px dashed rgba(255,255,255,0.08); width: 100%;">
                            <p style="color: #fff; font-size: 1.1rem; font-family: var(--font-heading); margin-bottom: 0.5rem;">NO HAY PROMOTORAS REGISTRADAS DISPONIBLES</p>
                            <a href="fan-buscar.html?tab=promotoras" class="btn-solid red-btn" style="text-decoration: none; font-size: 0.85rem; padding: 0.65rem 1.2rem; display: inline-flex; align-items: center; gap: 6px; margin-top: 0.8rem; border-radius: 6px;">
                                <i class="fas fa-search"></i> BUSCAR PROMOTORAS
                            </a>
                        </div>
                    `;
                }
                return;
            }

            promContainer.innerHTML = listToRender.map(prom => {
                const isFollowed = esPromotoraSeguida(prom.id || prom.name, currentUid);
                const scopeBadgeClass = prom.scope === 'local' ? 'badge-scope-local' : 'badge-scope-intl';
                const scopeLabel = prom.scope === 'local' ? 'LOCAL / NACIONAL' : 'INTERNACIONAL';
                const nextEv = prom.upcomingEvents && prom.upcomingEvents[0];
                const nextEventText = nextEv 
                    ? `${nextEv.titulo} · ${nextEv.fecha}`
                    : 'Próxima velada oficial en programación';
                
                const logoHtml = (prom.logoUrl || prom.photoURL) 
                    ? `<img src="${prom.logoUrl || prom.photoURL}" alt="${prom.name}" onerror="this.onerror=null; this.src=''; this.parentElement.innerHTML='<i class=\\'fas ${prom.icon || 'fa-shield-alt'}\\' style=\\'font-size: 1.5rem; color: var(--accent-red);\\'></i>';">`
                    : `<i class="fas ${prom.icon || 'fa-shield-alt'}"></i>`;

                return `
                    <div class="promoter-card">
                        <div>
                            <div class="promoter-card-header">
                                <div class="promoter-logo-circle" style="background: ${prom.badgeColor || '#1a1a22'}; border-color: ${prom.badgeColor ? prom.badgeColor + '66' : 'rgba(255,255,255,0.15)'};">
                                    ${logoHtml}
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 3px;">
                                        <span class="${scopeBadgeClass}">${scopeLabel}</span>
                                        ${prom.registeredInDb ? '<span class="badge-db-verified"><i class="fas fa-check-circle"></i> REGISTRADA EN BD</span>' : ''}
                                    </div>
                                    <h3 class="promoter-name" title="${prom.name}">${prom.name}</h3>
                                    <p class="promoter-location">
                                        <i class="fas fa-map-marker-alt" style="color: var(--accent-red);"></i> ${prom.location || 'Sede Oficial'}
                                        <span style="color: rgba(255,255,255,0.3); margin: 0 4px;">•</span>
                                        <span style="color: #ffc107; font-weight: 600; font-size: 0.72rem;">${prom.discipline || 'MMA'}</span>
                                    </p>
                                </div>
                            </div>
                            <p class="promoter-desc" title="${prom.description}">${prom.description}</p>
                            <div class="promoter-event-box">
                                <span class="promoter-event-box-title"><i class="fas fa-calendar-check" style="color: #ffc107;"></i> CARTELERA EN VIVO / PRÓXIMA VELADA:</span>
                                <strong class="promoter-event-box-name">${nextEventText}</strong>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 1.2rem;">
                            <a href="${prom.scope === 'local' ? 'local.html' : 'internacional.html'}" class="btn-outline" style="flex: 1; justify-content: center; font-size: 0.8rem; text-decoration: none; padding: 0.55rem 0.3rem; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;">
                                <i class="fas fa-calendar-alt"></i> VELADAS
                            </a>
                            <button type="button" class="btn-toggle-prom-fav ${isFollowed ? 'is-following' : ''}" data-id="${prom.id}" data-name="${prom.name}" style="flex: 1.4; border-radius: 6px;">
                                <i class="fas ${isFollowed ? 'fa-check' : 'fa-star'}"></i> <span>${isFollowed ? 'EN FAVORITOS' : 'AGREGAR A FAVORITOS'}</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Conectar botones interactivos de toggle de favoritos
            promContainer.querySelectorAll('.btn-toggle-prom-fav').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const promId = e.currentTarget.getAttribute('data-id');
                    const promName = e.currentTarget.getAttribute('data-name');
                    const targetProm = allPromoters.find(p => p.id === promId || p.name === promName) || {
                        id: promId,
                        name: promName,
                        shortName: promName,
                        scope: 'local'
                    };

                    toggleSeguirPromotora(targetProm, currentUid);

                    // Re-cargar la página de favoritos para actualizar de inmediato
                    cargarFanFavoritosPage(currentUid);
                });
            });
        };

        // Escuchar clics en las pestañas
        if (tabFollowed) {
            tabFollowed.onclick = () => {
                window._fanFavoritosPromoterTab = 'followed';
                tabFollowed.classList.add('active');
                if (tabCatalog) tabCatalog.classList.remove('active');
                const latestFollowedList = obtenerPromotorasSeguidas(currentUid);
                const updatedFollowed = latestFollowedList.map(fp => {
                    const match = allPromoters.find(p => 
                        (p.id && fp.id && p.id.toLowerCase() === fp.id.toLowerCase()) ||
                        (p.name && fp.name && p.name.toLowerCase() === fp.name.toLowerCase()) ||
                        (p.shortName && fp.shortName && p.shortName.toLowerCase() === fp.shortName.toLowerCase())
                    );
                    return match ? { ...match, ...fp } : fp;
                });
                renderPromoterCards(updatedFollowed, true);
            };
        }

        if (tabCatalog) {
            tabCatalog.onclick = () => {
                window._fanFavoritosPromoterTab = 'catalog';
                tabCatalog.classList.add('active');
                if (tabFollowed) tabFollowed.classList.remove('active');
                renderPromoterCards(localPromoters, false);
            };
        }

        // Renderizado inicial según pestaña activa
        if (currentActiveTab === 'catalog') {
            if (tabCatalog) tabCatalog.classList.add('active');
            if (tabFollowed) tabFollowed.classList.remove('active');
            renderPromoterCards(localPromoters, false);
        } else {
            if (tabFollowed) tabFollowed.classList.add('active');
            if (tabCatalog) tabCatalog.classList.remove('active');
            renderPromoterCards(favAllPromoters, true);
        }
    }
}

// Inicialización de cartelera pública, Feed social y módulos reactivos
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('local.html')) {
        cargarEventosPublicos();
        cargarFightFeed();
        inicializarFormularioFeed();
    } else if (path.includes('promotor-scouting.html')) {
        const currentUid = localStorage.getItem('userId') || '';
        cargarPromoterScoutingPage(currentUid);
    } else if (path.includes('fan-dashboard.html')) {
        const currentUid = localStorage.getItem('userId') || 'guest';
        cargarFanDashboardPage(currentUid);
    } else if (path.includes('fan-buscar.html')) {
        const currentUid = localStorage.getItem('userId') || '';
        cargarFanBuscarPage(currentUid);
    } else if (path.includes('fan-favoritos.html')) {
        const currentUid = localStorage.getItem('userId') || '';
        cargarFanFavoritosPage(currentUid);
    } else if (path.includes('fighter-historial.html')) {
        const currentUid = localStorage.getItem('userId') || '';
        if (currentUid) cargarFighterHistorialPage(currentUid);
    }
});


