/**
 * FIGHTCONNECT · MOTOR INTERACTIVO DEL MANUAL DE USUARIO
 * Funcionalidades: Buscador en tiempo real, Lightbox HD, Filtros por Rol y Scrollspy
 */

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initRoleFilters();
    initLightbox();
    initScrollSpy();
    initKeyboardShortcuts();
});

// 1. Buscador en Tiempo Real
function initSearch() {
    const searchInput = document.getElementById('manual-search-box');
    const sections = document.querySelectorAll('.doc-section');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        sections.forEach(sec => {
            const text = sec.textContent.toLowerCase();
            if (!query || text.includes(query)) {
                sec.style.display = 'block';
            } else {
                sec.style.display = 'none';
            }
        });
    });
}

// 2. Filtros por Rol
function initRoleFilters() {
    const chips = document.querySelectorAll('.role-chip');
    const sections = document.querySelectorAll('.doc-section');

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const role = chip.getAttribute('data-role');
            sections.forEach(sec => {
                const secRole = sec.getAttribute('data-doc-role');
                if (role === 'all' || !secRole || secRole === role || secRole === 'public') {
                    sec.style.display = 'block';
                } else {
                    sec.style.display = 'none';
                }
            });
        });
    });
}

// 3. Lightbox HD con Galería
let currentImageIndex = 0;
let allImages = [];

function initLightbox() {
    const modal = document.getElementById('manual-lightbox-modal');
    const modalImg = document.getElementById('lightbox-active-img');
    const modalCaption = document.getElementById('lightbox-caption-text');
    const clickableScreenshots = document.querySelectorAll('.screenshot-display, .mobile-phone-frame');

    allImages = Array.from(clickableScreenshots).map(el => {
        const img = el.querySelector('img');
        const caption = el.getAttribute('data-caption') || img?.alt || 'Captura Oficial FightConnect';
        return {
            src: img ? img.src : '',
            caption: caption
        };
    });

    clickableScreenshots.forEach((el, index) => {
        el.addEventListener('click', () => {
            openLightboxIndex(index);
        });
    });

    // Cerrar al hacer clic fuera
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeLightboxModal();
        });
    }
}

function openLightboxIndex(index) {
    const modal = document.getElementById('manual-lightbox-modal');
    const modalImg = document.getElementById('lightbox-active-img');
    const modalCaption = document.getElementById('lightbox-caption-text');
    if (!modal || !allImages[index]) return;

    currentImageIndex = index;
    modalImg.src = allImages[index].src;
    modalCaption.textContent = allImages[index].caption;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
}

window.closeLightboxModal = function() {
    const modal = document.getElementById('manual-lightbox-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 200);
};

// 4. Atajos de Teclado (ESC, Flechas, Ctrl+K)
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('manual-lightbox-modal');
        const isModalOpen = modal && modal.classList.contains('active');

        // ESC para cerrar modal
        if (e.key === 'Escape' && isModalOpen) {
            closeLightboxModal();
        }

        // Flecha Derecha / Izquierda en Modal
        if (isModalOpen) {
            if (e.key === 'ArrowRight' && currentImageIndex < allImages.length - 1) {
                openLightboxIndex(currentImageIndex + 1);
            }
            if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
                openLightboxIndex(currentImageIndex - 1);
            }
        }

        // Ctrl + K o Cmd + K para enfocar buscador
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('manual-search-box');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });
}

// 5. ScrollSpy para Tabla de Contenidos y Navegación Lateral
function initScrollSpy() {
    const sections = document.querySelectorAll('.doc-section[id]');
    const navLinks = document.querySelectorAll('.nav-list a, .toc-list a');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, { threshold: 0.25 });

    sections.forEach(s => observer.observe(s));
}
