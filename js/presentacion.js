/**
 * ==========================================================================
 * FIGHTCONNECT - MOTOR DE PRESENTACIÓN & CRONÓMETRO DE 10 MINUTOS
 * Sustentación de Anteproyecto de Grado - UPB 2026
 * Autor: Matías Arrieta Montoya | Asesor: Santiago Zapata Vélez
 * ==========================================================================
 */

class FightConnectPresentation {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 14;
        
        // Timer State (10 Minutes = 600 Seconds)
        this.totalSeconds = 600;
        this.remainingSeconds = 600;
        this.timerInterval = null;
        this.isTimerRunning = false;
        this.audioEnabled = true;
        
        // Pacing targets in seconds for each slide (Total 600s = 10 min)
        this.pacingTargets = [
            { slide: 0, time: 35, title: "Portada Oficial", label: "0:00 - 0:35" },
            { slide: 1, time: 75, title: "Contexto Medellín & Auge MMA", label: "0:35 - 1:15" },
            { slide: 2, time: 125, title: "Problemática & Déficit Institucional", label: "1:15 - 2:05" },
            { slide: 3, time: 175, title: "Estado del Arte & Competencia", label: "2:05 - 2:55" },
            { slide: 4, time: 220, title: "La Solución: Ecosistema Híbrido", label: "2:55 - 3:40" },
            { slide: 5, time: 270, title: "Perfiles de Usuario & Roles", label: "3:40 - 4:30" },
            { slide: 6, time: 330, title: "Innovación: Performance Hub (Salud)", label: "4:30 - 5:30" },
            { slide: 7, time: 385, title: "Arquitectura MVVM & Cloud BaaS", label: "5:30 - 6:25" },
            { slide: 8, time: 430, title: "Modelo de Datos Firestore NoSQL", label: "6:25 - 7:10" },
            { slide: 9, time: 475, title: "Marco Legal & Privacy by Design", label: "7:10 - 7:55" },
            { slide: 10, time: 515, title: "Metodología Ágil (11 Semanas)", label: "7:55 - 8:35" },
            { slide: 11, time: 550, title: "Plan de Pruebas & Mitigación", label: "8:35 - 9:10" },
            { slide: 12, time: 575, title: "Viabilidad Económica Serverless", label: "9:10 - 9:35" },
            { slide: 13, time: 600, title: "Conclusiones & Live Demo", label: "9:35 - 10:00" }
        ];

        // Speaker notes data
        this.speakerNotes = [
            {
                time: "0:00 - 0:35 (35s)",
                keyIdea: "Apertura contundente y saludo formal al jurado.",
                script: "Buenos días miembros del comité evaluador y profesor Santiago Zapata. Mi nombre es Matías Arrieta Montoya y presento ante ustedes FightConnect: un ecosistema híbrido compuesto por aplicación móvil Android y plataforma web, diseñado para la profesionalización y el posicionamiento estratégico del talento en Artes Marciales Mixtas en Medellín y el Valle de Aburrá.",
                juryQ: "¿Por qué un enfoque híbrido y no una sola tecnología? -> Porque el atleta entrena en el octágono y necesita registro móvil offline con Kotlin, mientras que las promotoras operan en escritorios gestionando carteleras masivas con React."
            },
            {
                time: "0:35 - 1:15 (40s)",
                keyIdea: "Medellín como epicentro y contraste institucional.",
                script: "Medellín se ha consolidado como la capital de las MMA en Colombia, albergando eventos con más de 2.000 asistentes por velada. Sin embargo, este crecimiento es espontáneo y carece de acompañamiento institucional formal. Las cifras del DANE y MinDeporte demuestran que apenas el 11.5% de los ciudadanos practica deporte formal diario, y el propio Ministerio reconoce una severa carencia de estadísticas confiables.",
                juryQ: "¿Qué fuentes respaldan este diagnóstico? -> Investigaciones periodísticas de El Colombiano e Infobae, y el reporte conjunto DANE-MinDeporte (2022)."
            },
            {
                time: "1:15 - 2:05 (50s)",
                keyIdea: "La brecha real: informalidad, récords perdidos y corte de peso ciego.",
                script: "Hoy en día, un peleador en Medellín acuerda peleas por mensajes de WhatsApp, sus récords se pierden en carteleras de papel y no cuenta con una hoja de vida deportiva auditable para captar patrocinadores privados. Pero lo más alarmante es el corte de peso: atletas bajando hasta 8 o 10 kilos en saunas sin monitoreo preventivo, arriesgando daño renal severo. Por eso formulamos nuestra pregunta de investigación: ¿Cómo optimizar la gestión de datos, el corte de peso y la visibilidad de estos atletas mediante un ecosistema en la nube?",
                juryQ: "¿Por qué enfocarse en el Valle de Aburrá? -> Porque concentra la mayor densidad de gimnasios de combate de Colombia y es viable validarlo empíricamente en 11 semanas."
            },
            {
                time: "2:05 - 2:55 (50s)",
                keyIdea: "Sherdog y Smoothcomp no resuelven la necesidad local.",
                script: "Analizamos el estado del arte internacional: Sherdog y Tapology operan como directorios globales pasivos para atletas consolidados en UFC o Bellator, pero presentan inconsistencias entre sí y no gestionan carteleras de promotoras locales. Smoothcomp maneja llaves de torneos puntuales, pero no la trayectoria longitudinal ni la salud del atleta. FightConnect llena este vacío: vincula al atleta local con promotoras de la ciudad, protege su salud con el Performance Hub y conecta al fanático con el circuito regional.",
                juryQ: "¿FightConnect compite con Sherdog? -> No, es complementario. FightConnect nutre la etapa formativa y semiprofesional local previa al salto internacional."
            },
            {
                time: "2:55 - 3:40 (45s)",
                keyIdea: "Presentación de la arquitectura dual del producto.",
                script: "La solución se materializa en una arquitectura desacoplada pero sincronizada en tiempo real. Tenemos una App Android nativa construida en Kotlin con patrón MVVM para el atleta en campo, y una Plataforma Web construida en React sobre Vite y Tailwind CSS para promotores y fanáticos. Ambas interactúan instantáneamente gracias a Firebase Cloud Firestore y Cloud Functions.",
                juryQ: "¿Qué ventaja da la sincronización en tiempo real? -> Cuando una promotora publica una pelea o un atleta actualiza su peso, el cambio se refleja en milisegundos en todas las pantallas sin refrescar la página."
            },
            {
                time: "3:40 - 4:30 (50s)",
                keyIdea: "Los 3 perfiles funcionales del sistema.",
                script: "El sistema segmenta la experiencia en 3 roles: El Peleador tiene su Hoja de Vida Deportiva oficial, postulación a carteleras y control de corte de peso. La Promotora accede a un panel de matchmaking filtrado por récord verificado y categoría oficial de peso. Y el Fanático cuenta con el Fight Feed social interactivo con reacciones marciales como 'Respect' y 'Oss!', además de calendario sincronizado y noticias con APIs externas.",
                juryQ: "¿Cómo se evita el spam en el feed? -> Mediante roles autenticados por Firebase Auth y validación de permisos en Firestore Security Rules."
            },
            {
                time: "4:30 - 5:30 (60s)",
                keyIdea: "El Performance Hub: Innovación respaldada por la ciencia médica.",
                script: "El corazón innovador de FightConnect es el Performance Hub. Respaldado por estudios de Lakicevic et al. (2021) y Doherty et al. (2024), aborda el grave problema de deshidratación aguda en combate. Nuestro algoritmo calcula la tasa de pérdida de masa corporal respecto al peso base y genera alertas preventivas semafóricas. El sistema funciona con persistencia offline: el peleador puede pesarse sin internet en el gimnasio y los datos se sincronizan al recuperar red.",
                juryQ: "¿Esto constituye un diagnóstico médico? -> No. En estricto apego al alcance y marco legal, son alertas preventivas e informativas, sin emitir diagnósticos clínicos."
            },
            {
                time: "5:30 - 6:25 (55s)",
                keyIdea: "Rigor en la arquitectura: MVVM y Cloud Functions.",
                script: "A nivel arquitectónico seguimos las recomendaciones oficiales de Google Android y los principios de Clean Architecture de Robert C. Martin. La app móvil implementa MVVM, separando la lógica de negocio de la UI para garantizar testabilidad. La web consume servicios desacoplados. La lógica sensible de negocio se traslada a Cloud Functions sobre Node.js, evitando cómputos pesados en el dispositivo del usuario.",
                juryQ: "¿Por qué Kotlin y no Flutter o React Native? -> Kotlin permite máximo rendimiento nativo, control granular del ciclo de vida del hardware y persistencia local óptima para el registro fisiológico."
            },
            {
                time: "6:25 - 7:10 (45s)",
                keyIdea: "Modelo de datos NoSQL escalable y reactivo.",
                script: "Diseñamos un modelo de datos documental en Cloud Firestore con 7 colecciones principales: usuarios, peleadores, performanceHub, promotoras, eventos, publicacionesFeed y noticias. Optimizamos las consultas utilizando subcolecciones para el historial de peso, evitando lecturas innecesarias y manteniendo los costos en la nube dentro del nivel gratuito.",
                juryQ: "¿Cómo manejan la concurrencia en postulaciones? -> A través de transacciones atómicas en Firestore que garantizan consistencia en la asignación de plazas."
            },
            {
                time: "7:10 - 7:55 (45s)",
                keyIdea: "Blindaje legal: Ley 1581, Habeas Data y Privacy by Design.",
                script: "El tratamiento de peso corporal y biometría involucra datos personales sensibles. Implementamos los 7 principios de Privacy by Design de Ann Cavoukian desde la primera línea de código: reglas de seguridad en Firestore que restringen la lectura de métricas de peso exclusivamente al atleta dueño del perfil y, de forma restringida, a la promotora de su evento. Cumplimos a cabalidad con la Ley Estatutaria 1581 de 2012 y la Ley 181 del deporte.",
                juryQ: "¿Qué pasa si un usuario pide borrar sus datos? -> Se implementa el protocolo de derecho al olvido y rectificación exigido por la Ley 1581."
            },
            {
                time: "7:55 - 8:35 (40s)",
                keyIdea: "Metodología ágil en 11 semanas intensivas.",
                script: "Adoptamos Scrum combinado con tableros Kanban, distribuyendo las 11 semanas en 6 bloques de trabajo iterativos. Desde la arquitectura en semanas 1 y 2, pasando por el core Android en semanas 3 a 5, la web en 6 y 7, el algoritmo de salud en 8 y 9, hasta la integración y pruebas de campo en semanas 10 y 11.",
                juryQ: "¿Cómo gestionó los roles de Scrum siendo proyecto individual? -> Se asumió el rol de desarrollador articulado con el asesor metodológico como Product Owner."
            },
            {
                time: "8:35 - 9:10 (35s)",
                keyIdea: "Garantía de calidad: Pirámide de pruebas y mitigación de riesgos.",
                script: "El aseguramiento de calidad contempla pruebas unitarias en ViewModels y Cloud Functions, pruebas de integración para la sincronización móvil-web, y pruebas de usabilidad con atletas y promotores voluntarios de Medellín. Mitigamos el riesgo de costos monitoreando cuotas de Firebase y priorizamos el MVP ante la restricción de las 11 semanas.",
                juryQ: "¿Cuál fue el mayor riesgo técnico? -> La sincronización offline de peso al reconectar, resuelta mediante el cache local indexado de Firestore."
            },
            {
                time: "9:10 - 9:35 (25s)",
                keyIdea: "Eficiencia financiera del modelo Serverless.",
                script: "Desde la perspectiva económica, la arquitectura Serverless reduce el costo operativo a cero durante la fase de desarrollo bajo el plan Spark de Firebase. Hacia el futuro, el escalamiento es lineal bajo demanda sin costos fijos de servidores inactivos, asegurando viabilidad financiera para la comunidad deportiva local.",
                juryQ: "¿Cómo se sostendría comercialmente a futuro? -> Modelo freemium: gratuito para atletas y cobro de visibilidad o ticketing a promotoras."
            },
            {
                time: "9:35 - 10:00 (25s)",
                keyIdea: "Cierre triunfal, impacto y apertura a preguntas.",
                script: "FightConnect no es solo un software: es el puente digital para que los peleadores de Medellín dejen de ser invisibles y compitan con seguridad. Quedo a su entera disposición para responder sus inquietudes y proceder a la demostración interactiva en vivo del sistema. ¡Muchas gracias!",
                juryQ: "Listo para demostración en vivo de los dashboards y módulos en el navegador."
            }
        ];

        this.init();
    }

    init() {
        this.cacheDOMElements();
        this.initBackgroundCanvas();
        this.bindEvents();
        this.updateSlideUI();
        this.updateTimerDisplay();
        this.buildOverviewGrid();
        this.initInteractiveWidgets();
    }

    cacheDOMElements() {
        this.slides = document.querySelectorAll('.slide');
        this.totalSlides = this.slides.length;
        this.progressBar = document.getElementById('pres-progress-fill');
        this.slideCounter = document.getElementById('slide-counter-num');
        this.dotsContainer = document.getElementById('slide-dots');

        // Timer elements
        this.timerDigits = document.getElementById('timer-digits');
        this.timerIcon = document.getElementById('timer-icon');
        this.btnTimerToggle = document.getElementById('btn-timer-toggle');
        this.btnTimerReset = document.getElementById('btn-timer-reset');
        this.btnTimerPlus = document.getElementById('btn-timer-plus');
        this.btnTimerMinus = document.getElementById('btn-timer-minus');
        this.pacingStatus = document.getElementById('pacing-status');

        // Nav elements
        this.btnPrev = document.getElementById('btn-prev-slide');
        this.btnNext = document.getElementById('btn-next-slide');
        
        // Tool buttons
        this.btnNotes = document.getElementById('btn-notes-toggle');
        this.notesPanel = document.getElementById('speaker-notes-panel');
        this.notesClose = document.getElementById('notes-close-btn');
        this.notesContentArea = document.getElementById('notes-content-area');
        
        this.btnOverview = document.getElementById('btn-overview-toggle');
        this.overviewModal = document.getElementById('overview-modal');
        this.overviewClose = document.getElementById('overview-close-btn');
        this.overviewGrid = document.getElementById('overview-grid');

        this.btnLaser = document.getElementById('btn-laser-toggle');
        this.laserPointer = document.getElementById('laser-pointer');
        this.btnFullscreen = document.getElementById('btn-fullscreen-toggle');
        this.btnAudio = document.getElementById('btn-audio-toggle');
        
        // Build dots
        this.buildDots();
    }

    buildDots() {
        if (!this.dotsContainer) return;
        this.dotsContainer.innerHTML = '';
        for (let i = 0; i < this.totalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = `slide-dot ${i === 0 ? 'active' : ''}`;
            dot.title = `Diapositiva ${i + 1}`;
            dot.addEventListener('click', () => this.goToSlide(i));
            this.dotsContainer.appendChild(dot);
        }
    }

    bindEvents() {
        // Slide Navigation
        if (this.btnPrev) this.btnPrev.addEventListener('click', () => this.prevSlide());
        if (this.btnNext) this.btnNext.addEventListener('click', () => this.nextSlide());

        // Timer buttons
        if (this.btnTimerToggle) this.btnTimerToggle.addEventListener('click', () => this.toggleTimer());
        if (this.btnTimerReset) this.btnTimerReset.addEventListener('click', () => this.resetTimer());
        if (this.btnTimerPlus) this.btnTimerPlus.addEventListener('click', () => this.adjustTimer(60));
        if (this.btnTimerMinus) this.btnTimerMinus.addEventListener('click', () => this.adjustTimer(-60));

        // Tools
        if (this.btnNotes) this.btnNotes.addEventListener('click', () => this.toggleSpeakerNotes());
        if (this.notesClose) this.notesClose.addEventListener('click', () => this.toggleSpeakerNotes(false));
        
        if (this.btnOverview) this.btnOverview.addEventListener('click', () => this.toggleOverview());
        if (this.overviewClose) this.overviewClose.addEventListener('click', () => this.toggleOverview(false));

        if (this.btnLaser) this.btnLaser.addEventListener('click', () => this.toggleLaser());
        if (this.btnFullscreen) this.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
        if (this.btnAudio) this.btnAudio.addEventListener('click', () => this.toggleAudio());

        // Keyboard navigation
        window.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Laser pointer movement
        window.addEventListener('mousemove', (e) => {
            if (this.laserPointer && this.laserPointer.classList.contains('active')) {
                this.laserPointer.style.left = `${e.clientX}px`;
                this.laserPointer.style.top = `${e.clientY}px`;
            }
        });

        // Touch Swipe gestures
        let touchStartX = 0;
        let touchEndX = 0;
        window.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        window.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) this.nextSlide();
            if (touchEndX - touchStartX > 50) this.prevSlide();
        }, { passive: true });

        // Fullscreen state listener to keep button in sync with Esc key or browser controls
        const updateFullscreenUI = () => {
            const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
            if (this.btnFullscreen) {
                this.btnFullscreen.innerHTML = isFull 
                    ? '<i class="fas fa-compress"></i> <span>Salir</span>' 
                    : '<i class="fas fa-expand"></i> <span>Pantalla Completa</span>';
                this.btnFullscreen.classList.toggle('active', isFull);
            }
        };

        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
            document.addEventListener(evt, updateFullscreenUI);
        });
    }

    handleKeyboard(e) {
        // Avoid interfering when user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case 'PageDown':
            case ' ':
            case 'Enter':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
            case 'Backspace':
                e.preventDefault();
                this.prevSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.totalSlides - 1);
                break;
            case 't':
            case 'T':
                this.toggleTimer();
                break;
            case 'r':
            case 'R':
                this.resetTimer();
                break;
            case 'n':
            case 'N':
                this.toggleSpeakerNotes();
                break;
            case 'o':
            case 'O':
                this.toggleOverview();
                break;
            case 'l':
            case 'L':
                this.toggleLaser();
                break;
            case 'f':
            case 'F':
                this.toggleFullscreen();
                break;
            case 'm':
            case 'M':
                this.toggleAudio();
                break;
            case 'Escape':
                if (this.overviewModal && this.overviewModal.classList.contains('open')) {
                    this.toggleOverview(false);
                } else if (this.notesPanel && this.notesPanel.classList.contains('open')) {
                    this.toggleSpeakerNotes(false);
                }
                break;
        }
    }

    goToSlide(index) {
        if (index < 0 || index >= this.totalSlides) return;

        this.currentSlide = index;

        this.slides.forEach((slide, idx) => {
            slide.classList.remove('active', 'prev');
            if (idx < this.currentSlide) {
                slide.classList.add('prev');
            } else if (idx === this.currentSlide) {
                slide.classList.add('active');
            }
        });

        this.updateSlideUI();
        this.playSlideTone();
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
        }
    }

    prevSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    updateSlideUI() {
        // Counter
        if (this.slideCounter) {
            this.slideCounter.textContent = `${this.currentSlide + 1} / ${this.totalSlides}`;
        }

        // Progress bar
        if (this.progressBar) {
            const percent = ((this.currentSlide + 1) / this.totalSlides) * 100;
            this.progressBar.style.width = `${percent}%`;
        }

        // Dots
        if (this.dotsContainer) {
            const dots = this.dotsContainer.querySelectorAll('.slide-dot');
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === this.currentSlide);
            });
        }

        // Prev/Next buttons state
        if (this.btnPrev) this.btnPrev.disabled = this.currentSlide === 0;
        if (this.btnNext) this.btnNext.disabled = this.currentSlide === this.totalSlides - 1;

        // Update speaker notes content
        this.renderSpeakerNotes();

        // Update pacing evaluation
        this.evaluatePacing();
    }

    // ==========================================
    // TIMER CONTROLLER (10 MIN DEFENSE PACER)
    // ==========================================
    toggleTimer() {
        if (this.isTimerRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.isTimerRunning) return;
        this.isTimerRunning = true;
        
        if (this.btnTimerToggle) {
            this.btnTimerToggle.innerHTML = '<i class="fas fa-pause"></i>';
            this.btnTimerToggle.classList.add('active');
            this.btnTimerToggle.title = "Pausar Cronómetro (T)";
        }

        if (this.timerIcon) {
            this.timerIcon.className = "fas fa-stopwatch fa-spin timer-icon";
        }

        // Sound cue at timer start
        this.playBoxingBell(1);

        this.timerInterval = setInterval(() => {
            if (this.remainingSeconds > 0) {
                this.remainingSeconds--;
                this.updateTimerDisplay();
                this.evaluatePacing();

                // Sound alerts at strategic milestones
                if (this.remainingSeconds === 180) { // 3:00 left
                    this.playWarningBeep();
                } else if (this.remainingSeconds === 60) { // 1:00 left
                    this.playWarningBeep(true);
                } else if (this.remainingSeconds === 0) { // Time's up!
                    this.timerFinished();
                }
            } else {
                this.pauseTimer();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        
        if (this.btnTimerToggle) {
            this.btnTimerToggle.innerHTML = '<i class="fas fa-play"></i>';
            this.btnTimerToggle.classList.remove('active');
            this.btnTimerToggle.title = "Iniciar Cronómetro (T)";
        }

        if (this.timerIcon) {
            this.timerIcon.className = "fas fa-stopwatch timer-icon";
        }
    }

    resetTimer() {
        this.pauseTimer();
        this.remainingSeconds = this.totalSeconds;
        this.updateTimerDisplay();
        this.evaluatePacing();
    }

    adjustTimer(seconds) {
        this.remainingSeconds = Math.max(0, this.remainingSeconds + seconds);
        this.updateTimerDisplay();
        this.evaluatePacing();
    }

    updateTimerDisplay() {
        const mins = Math.floor(this.remainingSeconds / 60);
        const secs = this.remainingSeconds % 60;
        const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        if (this.timerDigits) {
            this.timerDigits.textContent = formatted;
            
            // Visual grading
            this.timerDigits.classList.remove('warning', 'danger');
            if (this.remainingSeconds <= 60) {
                this.timerDigits.classList.add('danger');
            } else if (this.remainingSeconds <= 180) {
                this.timerDigits.classList.add('warning');
            }
        }
    }

    timerFinished() {
        this.pauseTimer();
        this.playBoxingBell(3); // 3 bells at round end!
        if (this.pacingStatus) {
            this.pacingStatus.textContent = "¡10 MIN CUMPLIDOS!";
            this.pacingStatus.className = "pacing-status hurry";
        }
    }

    evaluatePacing() {
        if (!this.pacingStatus) return;
        const elapsed = this.totalSeconds - this.remainingSeconds;
        const target = this.pacingTargets[this.currentSlide]?.time || 600;

        const diff = elapsed - target;

        if (diff > 40) {
            this.pacingStatus.textContent = "Acelerar ritmo (+40s)";
            this.pacingStatus.className = "pacing-status hurry";
        } else if (diff > 15) {
            this.pacingStatus.textContent = "Ligeramente atrasado";
            this.pacingStatus.className = "pacing-status behind";
        } else if (diff < -30) {
            this.pacingStatus.textContent = "Vas con buen margen";
            this.pacingStatus.className = "pacing-status on-track";
        } else {
            this.pacingStatus.textContent = "Ritmo óptimo (A tiempo)";
            this.pacingStatus.className = "pacing-status on-track";
        }
    }

    // ==========================================
    // SPEAKER NOTES DRAWER
    // ==========================================
    toggleSpeakerNotes(forceState) {
        if (!this.notesPanel) return;
        const isOpen = forceState !== undefined ? forceState : !this.notesPanel.classList.contains('open');
        this.notesPanel.classList.toggle('open', isOpen);
        if (this.btnNotes) this.btnNotes.classList.toggle('active', isOpen);
    }

    renderSpeakerNotes() {
        if (!this.notesContentArea) return;
        const note = this.speakerNotes[this.currentSlide];
        if (!note) return;

        const targetPacing = this.pacingTargets[this.currentSlide];

        this.notesContentArea.innerHTML = `
            <div class="notes-section">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem;">
                    <h4><i class="fas fa-bullseye"></i> Idea Clave</h4>
                    <span class="notes-time-target">${note.time}</span>
                </div>
                <p style="font-weight: 600; color: #fff;">${note.keyIdea}</p>
            </div>

            <div class="notes-section">
                <h4><i class="fas fa-comment-dots"></i> Guion Sugerido (Qué decir)</h4>
                <p style="font-style: italic; color: #d1d5db; background: rgba(0,0,0,0.3); padding: 0.8rem; border-radius: 6px; border-left: 3px solid var(--accent-red);">${note.script}</p>
            </div>

            <div class="notes-section">
                <h4><i class="fas fa-question-circle"></i> Pregunta Probable del Jurado & Argumento</h4>
                <p style="font-size: 0.85rem; color: #9ca3af; background: rgba(255,255,255,0.03); padding: 0.8rem; border-radius: 6px;">${note.juryQ}</p>
            </div>
        `;
    }

    // ==========================================
    // SLIDE OVERVIEW GRID ('O' KEY)
    // ==========================================
    toggleOverview(forceState) {
        if (!this.overviewModal) return;
        const isOpen = forceState !== undefined ? forceState : !this.overviewModal.classList.contains('open');
        this.overviewModal.classList.toggle('open', isOpen);
        if (this.btnOverview) this.btnOverview.classList.toggle('active', isOpen);
        if (isOpen) {
            this.buildOverviewGrid();
        }
    }

    buildOverviewGrid() {
        if (!this.overviewGrid) return;
        this.overviewGrid.innerHTML = '';

        this.pacingTargets.forEach((item, idx) => {
            const thumb = document.createElement('div');
            thumb.className = `overview-thumb ${idx === this.currentSlide ? 'active' : ''}`;
            thumb.innerHTML = `
                <span class="thumb-num">SLIDE ${String(idx + 1).padStart(2, '0')}</span>
                <h4 class="thumb-title">${item.title}</h4>
                <span class="thumb-time"><i class="far fa-clock"></i> ${item.label}</span>
            `;
            thumb.addEventListener('click', () => {
                this.goToSlide(idx);
                this.toggleOverview(false);
            });
            this.overviewGrid.appendChild(thumb);
        });
    }

    // ==========================================
    // LASER POINTER & FULLSCREEN & AUDIO
    // ==========================================
    toggleLaser() {
        if (!this.laserPointer) return;
        const isActive = this.laserPointer.classList.toggle('active');
        if (this.btnLaser) this.btnLaser.classList.toggle('active', isActive);
    }

    toggleFullscreen() {
        const doc = document;
        const isFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

        if (!isFullscreen) {
            const el = doc.documentElement;
            const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
            if (rfs) {
                rfs.call(el).catch(err => {
                    console.warn(`Pantalla completa no permitida: ${err.message}`);
                });
            }
        } else {
            const efs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (efs) {
                efs.call(doc).catch(err => {
                    console.warn(`Error al salir de pantalla completa: ${err.message}`);
                });
            }
        }
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        if (this.btnAudio) {
            this.btnAudio.innerHTML = this.audioEnabled 
                ? '<i class="fas fa-volume-up"></i>' 
                : '<i class="fas fa-volume-mute"></i>';
            this.btnAudio.title = this.audioEnabled ? "Silenciar audio (M)" : "Activar audio (M)";
        }
    }

    // ==========================================
    // SYNTHETIC AUDIO ENGINE (Web Audio API)
    // ==========================================
    getAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    playSlideTone() {
        if (!this.audioEnabled) return;
        try {
            const ctx = this.getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (e) {
            // Audio context policy
        }
    }

    playBoxingBell(repetitions = 1) {
        if (!this.audioEnabled) return;
        try {
            const ctx = this.getAudioContext();
            
            for (let i = 0; i < repetitions; i++) {
                setTimeout(() => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(1100, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.8);

                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start();
                    osc.stop(ctx.currentTime + 0.8);
                }, i * 350);
            }
        } catch (e) {
            // Audio context fallback
        }
    }

    playWarningBeep(urgent = false) {
        if (!this.audioEnabled) return;
        try {
            const ctx = this.getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(urgent ? 880 : 587.33, ctx.currentTime);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch (e) {
            // Audio policy
        }
    }

    // ==========================================
    // INTERACTIVE WIDGETS IN SLIDES
    // ==========================================
    initInteractiveWidgets() {
        // Widget 1: Live Weight Cut Simulator in Slide 7
        const sliderBase = document.getElementById('sim-base-weight');
        const sliderCurrent = document.getElementById('sim-current-weight');
        const labelBase = document.getElementById('sim-base-val');
        const labelCurrent = document.getElementById('sim-current-val');
        const labelLossPct = document.getElementById('sim-loss-pct');
        const alertBanner = document.getElementById('sim-alert-banner');
        const alertText = document.getElementById('sim-alert-desc');
        const alertIcon = document.getElementById('sim-alert-icon');

        const updateWeightSim = () => {
            if (!sliderBase || !sliderCurrent) return;
            const base = parseFloat(sliderBase.value);
            const curr = parseFloat(sliderCurrent.value);
            
            if (curr > base) {
                sliderCurrent.value = base;
            }
            const actualCurr = parseFloat(sliderCurrent.value);

            if (labelBase) labelBase.textContent = `${base} kg`;
            if (labelCurrent) labelCurrent.textContent = `${actualCurr} kg`;

            const diff = base - actualCurr;
            const pct = ((diff / base) * 100).toFixed(1);
            if (labelLossPct) labelLossPct.textContent = `-${pct}% (${diff.toFixed(1)} kg perdidos)`;

            if (alertBanner && alertText && alertIcon) {
                alertBanner.className = 'sim-alert-banner';
                if (pct < 5.0) {
                    alertBanner.classList.add('state-safe');
                    alertIcon.className = 'fas fa-check-circle';
                    alertText.innerHTML = `<strong>Rango Seguro (<5%):</strong> Deshidratación leve dentro de parámetros fisiológicos estándar. Sin riesgo agudo documentado.`;
                } else if (pct <= 8.0) {
                    alertBanner.classList.add('state-warning');
                    alertIcon.className = 'fas fa-exclamation-triangle';
                    alertText.innerHTML = `<strong>Precaución (5% - 8%):</strong> Riesgo moderado de fatiga psicomotora y merma de fuerza isométrica (Doherty et al., 2024).`;
                } else {
                    alertBanner.classList.add('state-danger');
                    alertIcon.className = 'fas fa-skull-crossbones';
                    alertText.innerHTML = `<strong>¡ALERTA CRÍTICA (>8%):</strong> Riesgo inminente de daño renal agudo, pico de creatinina sérica y deshidratación severa (Lakicevic et al., 2021).`;
                }
            }
        };

        if (sliderBase) sliderBase.addEventListener('input', updateWeightSim);
        if (sliderCurrent) sliderCurrent.addEventListener('input', updateWeightSim);
        updateWeightSim();

        // Widget 2: Matchmaking Filter Simulator in Slide 6
        const divisionFilter = document.getElementById('sim-match-division');
        const recordFilter = document.getElementById('sim-match-record');
        const fighterCards = document.querySelectorAll('.match-fighter-card');

        const applyMatchFilters = () => {
            if (!divisionFilter || !fighterCards.length) return;
            const selectedDiv = divisionFilter.value;
            const selectedRec = recordFilter ? recordFilter.value : 'all';

            fighterCards.forEach(card => {
                const cardDiv = card.getAttribute('data-division');
                const cardRecord = card.getAttribute('data-record');

                let matchDiv = (selectedDiv === 'all' || cardDiv === selectedDiv);
                let matchRec = true;
                if (selectedRec === 'positive') matchRec = cardRecord === 'pos';
                if (selectedRec === 'pro') matchRec = card.getAttribute('data-level') === 'pro';

                card.style.display = (matchDiv && matchRec) ? 'flex' : 'none';
            });
        };

        if (divisionFilter) divisionFilter.addEventListener('change', applyMatchFilters);
        if (recordFilter) recordFilter.addEventListener('change', applyMatchFilters);

        // Widget 3: Architecture Interactive Step Visualizer
        const archSteps = document.querySelectorAll('.arch-step-btn');
        const archNodes = document.querySelectorAll('.arch-node');

        if (archSteps.length) {
            archSteps.forEach(btn => {
                btn.addEventListener('click', () => {
                    archSteps.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const targetNodeId = btn.getAttribute('data-target-node');
                    archNodes.forEach(node => {
                        node.style.borderColor = 'var(--border-subtle)';
                        node.style.boxShadow = 'none';
                        if (node.id === targetNodeId) {
                            node.style.borderColor = 'var(--accent-red)';
                            node.style.boxShadow = '0 0 20px var(--accent-red-glow)';
                        }
                    });
                });
            });
        }
    }

    // ==========================================
    // BACKGROUND 3D OCTAGON CANVAS EFFECT
    // ==========================================
    initBackgroundCanvas() {
        const canvas = document.getElementById('presentation-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        // Generate glowing nodes
        const particleCount = 45;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 1,
                color: Math.random() > 0.8 ? '#e62429' : 'rgba(255,255,255,0.4)',
                isOcta: Math.random() > 0.85
            });
        }

        const drawOctagon = (x, y, radius, strokeColor) => {
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                const ox = x + radius * Math.cos(angle);
                const oy = y + radius * Math.sin(angle);
                if (i === 0) ctx.moveTo(ox, oy);
                else ctx.lineTo(ox, oy);
            }
            ctx.closePath();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        };

        let frame = 0;
        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw connective subtle grid lines
            for (let i = 0; i < particles.length; i++) {
                const p1 = particles[i];
                p1.x += p1.vx;
                p1.y += p1.vy;

                if (p1.x < 0 || p1.x > width) p1.vx *= -1;
                if (p1.y < 0 || p1.y > height) p1.vy *= -1;

                ctx.beginPath();
                ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
                ctx.fillStyle = p1.color;
                ctx.fill();

                if (p1.isOcta) {
                    drawOctagon(p1.x, p1.y, 14, 'rgba(230, 36, 41, 0.25)');
                }

                // Connect nearby particles
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(230, 36, 41, ${0.15 * (1 - dist / 130)})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }

            frame++;
            requestAnimationFrame(render);
        };

        render();
    }
}

// Auto-initialize when DOM is ready
function initPresentationApp() {
    if (!window.fightConnectPres) {
        const pres = new FightConnectPresentation();
        window.fightConnectPres = pres;
        window.presentacion = pres;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPresentationApp);
} else {
    initPresentationApp();
}
