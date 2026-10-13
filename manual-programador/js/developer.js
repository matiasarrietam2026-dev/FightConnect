/**
 * FIGHTCONNECT · MOTOR INTERACTIVO DEL MANUAL DE PROGRAMADOR
 * Funcionalidades: Copia de código, Buscador en tiempo real, Lightbox HD, ScrollSpy y Atajos de Teclado
 */

document.addEventListener('DOMContentLoaded', () => {
    initCodeCopy();
    initDevSearch();
    initDevLightbox();
    initDevScrollSpy();
    initDevKeyboardShortcuts();
});

// 1. Copiado de Código con Feedback Visual
function initCodeCopy() {
    const copyBtns = document.querySelectorAll('.btn-copy-code');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const codeWindow = btn.closest('.code-window');
            if (!codeWindow) return;
            const codeEl = codeWindow.querySelector('pre code');
            if (!codeEl) return;

            try {
                await navigator.clipboard.writeText(codeEl.innerText);
                const originalHtml = btn.innerHTML;
                btn.classList.add('copied');
                btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = originalHtml;
                }, 2000);
            } catch (err) {
                console.error('Error al copiar al portapapeles:', err);
            }
        });
    });
}

// 2. Buscador Técnico en Tiempo Real
function initDevSearch() {
    const searchInput = document.getElementById('dev-search-input');
    const sections = document.querySelectorAll('.dev-section');
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

// 3. Lightbox HD para Capturas Técnicas
let devActiveImageIndex = 0;
let devAllImages = [];

function initDevLightbox() {
    const modal = document.getElementById('dev-lightbox-modal');
    const modalImg = document.getElementById('dev-lb-img');
    const modalCaption = document.getElementById('dev-lb-caption');
    const clickableScreenshots = document.querySelectorAll('.dev-screen-img-box');

    devAllImages = Array.from(clickableScreenshots).map(el => {
        const img = el.querySelector('img');
        const caption = el.getAttribute('data-caption') || img?.alt || 'Captura de Vista FightConnect';
        return {
            src: img ? img.src : '',
            caption: caption
        };
    });

    clickableScreenshots.forEach((el, index) => {
        el.addEventListener('click', () => {
            openDevLightbox(index);
        });
    });

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeDevLightbox();
        });
    }
}

function openDevLightbox(index) {
    const modal = document.getElementById('dev-lightbox-modal');
    const modalImg = document.getElementById('dev-lb-img');
    const modalCaption = document.getElementById('dev-lb-caption');
    if (!modal || !devAllImages[index]) return;

    devActiveImageIndex = index;
    modalImg.src = devAllImages[index].src;
    modalCaption.textContent = devAllImages[index].caption;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
}

window.closeDevLightbox = function() {
    const modal = document.getElementById('dev-lightbox-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 200);
};

// 4. ScrollSpy para Tabla de Contenidos y Navegación Lateral
function initDevScrollSpy() {
    const sections = document.querySelectorAll('.dev-section[id]');
    const navLinks = document.querySelectorAll('.dev-nav-list a, .dev-toc-list a');

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
    }, { threshold: 0.15 });

    sections.forEach(s => observer.observe(s));
}

// 5. Atajos de Teclado (ESC, Flechas, Ctrl+K)
function initDevKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('dev-lightbox-modal');
        const isModalOpen = modal && modal.classList.contains('active');

        if (e.key === 'Escape' && isModalOpen) {
            closeDevLightbox();
        }

        if (isModalOpen) {
            if (e.key === 'ArrowRight' && devActiveImageIndex < devAllImages.length - 1) {
                openDevLightbox(devActiveImageIndex + 1);
            }
            if (e.key === 'ArrowLeft' && devActiveImageIndex > 0) {
                openDevLightbox(devActiveImageIndex - 1);
            }
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('dev-search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });
}
