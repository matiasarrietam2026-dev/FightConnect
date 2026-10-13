/**
 * @fileoverview Controlador de Vistas de Autenticación, Registro y Selección de Roles.
 * 
 * Este módulo orquesta la experiencia de usuario en la pantalla de bienvenida / login:
 * 1. Transiciones visuales con animaciones de opacidad y desplazamiento entre:
 *    - Estado 1: Formulario de Inicio de Sesión (Login).
 *    - Estado 2 (Paso 1): Selección de Perfil / Rol (Peleador, Promotora, Aficionado).
 *    - Estado 2 (Paso 2): Formulario Dinámico de Registro especializado por disciplina.
 * 2. Inyección dinámica de plantillas HTML personalizadas según el tipo de usuario.
 * 3. Efectos visuales avanzados de inclinación 3D (Tilt Effect) basados en las coordenadas del cursor.
 * 
 * @module auth
 * @author FightConnect Development Team
 * @version 1.0.0
 */

function initAuth() {
    // ========================================================================
    // 1. SELECTORES DE CONTENEDORES Y ENLACES DE NAVEGACIÓN
    // ========================================================================
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const roleSelection = document.getElementById('role-selection');
    const registrationForm = document.getElementById('registration-form');
    
    // Enlaces de conmutación entre estados
    const linkToRegister = document.getElementById('link-to-register');
    const linksToLogin = document.querySelectorAll('.link-to-login');
    const linkBackRoles = document.getElementById('link-back-roles');

    // ========================================================================
    // 2. GESTIÓN DE TRANSICIONES ENTRE LOGIN Y REGISTRO
    // ========================================================================
    
    /**
     * Transición del estado de Login (Estado 1) hacia Registro (Estado 2).
     * Aplica desvanecimiento en CSS y reinicia el flujo al Paso 1 (Selección de rol).
     */
    if (linkToRegister) {
        linkToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.classList.remove('active');
            
            setTimeout(() => {
                loginSection.style.display = 'none';
                registerSection.style.display = 'block';
                
                // Forzar reflow del navegador para reiniciar la animación CSS de entrada
                void registerSection.offsetWidth;
                registerSection.classList.add('active');
                
                // Asegurar que el registro inicie en el Paso 1 (Selector de rol)
                registrationForm.style.display = 'none';
                registrationForm.classList.remove('active');
                roleSelection.style.display = 'block';
                roleSelection.classList.add('active');
                
            }, 300); // Duración sincronizada con la transición CSS (300ms)
        });
    }

    /**
     * Transición para volver desde el Registro hacia la pantalla de Login.
     */
    linksToLogin.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            registerSection.classList.remove('active');
            
            setTimeout(() => {
                registerSection.style.display = 'none';
                loginSection.style.display = 'block';
                
                // Forzar reflow para reiniciar la animación
                void loginSection.offsetWidth;
                loginSection.classList.add('active');
            }, 300);
        });
    });

    /**
     * Navegación hacia atrás dentro del Registro: de formulario de datos (Paso 2) a selector de roles (Paso 1).
     */
    if (linkBackRoles) {
        linkBackRoles.addEventListener('click', (e) => {
            e.preventDefault();
            registrationForm.classList.remove('active');
            
            setTimeout(() => {
                registrationForm.style.display = 'none';
                roleSelection.style.display = 'block';
                
                void roleSelection.offsetWidth;
                roleSelection.classList.add('active');
            }, 300);
        });
    }

    // ========================================================================
    // 3. PLANTILLAS HTML DINÁMICAS POR ROL DE USUARIO
    // ========================================================================
    const cards = document.querySelectorAll('.role-card');
    const dynamicForm = document.getElementById('dynamic-form');
    const formMainTitle = document.getElementById('form-main-title');

    /**
     * Diccionario de plantillas de formularios inyectados según el rol seleccionado.
     * Cada rol requiere campos específicos para su modelo de datos en Firestore.
     * 
     * @constant {Object.<string, string>}
     */
    const forms = {
        /** Formulario para atletas: incluye identidad, disciplina base y récord (V-D-E) */
        fighter: `
            <div class="form-section">
                <div class="section-column">
                    <h3 class="section-title">01. IDENTIDAD PROFESIONAL</h3>
                    <div class="form-group">
                        <label>NOMBRE LEGAL</label>
                        <input type="text" id="nombre-legal" placeholder="NOMBRE Y APELLIDOS" required>
                    </div>
                    <div class="form-group">
                        <label>ALIAS DE COMBATE</label>
                        <input type="text" id="alias-combate" placeholder='"EL DEPREDADOR"'>
                    </div>
                    <div class="form-group">
                        <label>DISCIPLINA BASE PRINCIPAL</label>
                        <select id="disciplina-base" required>
                            <option value="">SELECCIONE...</option>
                            <option value="mma" selected>MMA</option>
                            <option value="boxeo">BOXEO</option>
                            <option value="bjj">JIU-JITSU (BJJ)</option>
                            <option value="lucha">LUCHA / WRESTLING</option>
                            <option value="muaythai">MUAY THAI</option>
                            <option value="kickboxing">KICKBOXING</option>
                            <option value="judo">JUDO</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>ARTES MARCIALES EN LAS QUE HAS PELEADO / COMPITES</label>
                        <p style="color: var(--text-gray); font-size: 0.72rem; margin: 0.2rem 0 0.4rem 0;">Selecciona todas las artes marciales para ingresar tus récords y aparecer en el radar de promotoras:</p>
                        <div class="discipline-selection-grid">
                            <div class="discipline-chip-item">
                                <input type="checkbox" id="reg-disc-mma" class="reg-fighter-target-disc" value="mma" checked>
                                <label for="reg-disc-mma"><i class="fas fa-fist-raised"></i> MMA</label>
                            </div>
                            <div class="discipline-chip-item">
                                <input type="checkbox" id="reg-disc-boxeo" class="reg-fighter-target-disc" value="boxeo">
                                <label for="reg-disc-boxeo"><i class="fas fa-mitten"></i> BOXEO</label>
                            </div>
                            <div class="discipline-chip-item">
                                <input type="checkbox" id="reg-disc-bjj" class="reg-fighter-target-disc" value="bjj">
                                <label for="reg-disc-bjj"><i class="fas fa-shield-alt"></i> JIU-JITSU</label>
                            </div>
                            <div class="discipline-chip-item">
                                <input type="checkbox" id="reg-disc-lucha" class="reg-fighter-target-disc" value="lucha">
                                <label for="reg-disc-lucha"><i class="fas fa-compress-arrows-alt"></i> LUCHA</label>
                            </div>
                            <div class="discipline-chip-item">
                                <input type="checkbox" id="reg-disc-muaythai" class="reg-fighter-target-disc" value="muaythai">
                                <label for="reg-disc-muaythai"><i class="fas fa-fire"></i> MUAY THAI</label>
                            </div>
                            <div class="discipline-chip-item">
                                <input type="checkbox" id="reg-disc-kickboxing" class="reg-fighter-target-disc" value="kickboxing">
                                <label for="reg-disc-kickboxing"><i class="fas fa-bolt"></i> KICKBOXING</label>
                            </div>
                            <div class="discipline-chip-item">
                                <input type="checkbox" id="reg-disc-judo" class="reg-fighter-target-disc" value="judo">
                                <label for="reg-disc-judo"><i class="fas fa-award"></i> JUDO</label>
                            </div>
                        </div>
                    </div>
                    <h3 class="section-title" style="margin-top:2rem;">CREDENCIALES</h3>
                    <div class="form-group">
                        <label>CORREO ELECTRÓNICO</label>
                        <input type="email" id="fighter-email" placeholder="ATLETA@RED.COM" required>
                    </div>
                    <div class="form-group">
                        <label>CONTRASEÑA</label>
                        <input type="password" id="fighter-password" placeholder="••••••••" required>
                    </div>
                </div>
                
                <div class="section-column">
                    <h3 class="section-title">02. RÉCORDS POR DISCIPLINA & MÉTRICAS</h3>
                    <p style="color: var(--text-gray); font-size: 0.72rem; margin: -0.4rem 0 0.8rem 0;">Ingresa tu récord oficial (Victorias - Derrotas - Empates) para cada arte marcial seleccionada:</p>
                    
                    <div id="reg-records-container" class="discipline-records-builder">
                        <!-- Generado dinámicamente con los récords de cada disciplina -->
                    </div>

                    <!-- Inputs ocultos sincronizados para máxima retrocompatibilidad -->
                    <input type="hidden" id="victorias" value="0">
                    <input type="hidden" id="derrotas" value="0">
                    <input type="hidden" id="empates" value="0">

                    <div class="form-row">
                        <div class="form-group">
                            <label>PESO ACTUAL (KG)</label>
                            <input type="number" id="peso-actual" step="0.1" min="45" max="160" placeholder="Ej. 70.0" required>
                        </div>
                        <div class="form-group">
                            <label>ALTURA (CM)</label>
                            <input type="number" id="altura" min="120" max="230" placeholder="Ej. 175" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>GIMNASIO</label>
                            <input type="text" id="gimnasio" placeholder="EJ. ATT" required>
                        </div>
                        <div class="form-group">
                            <label>CIUDAD, PAÍS</label>
                            <input type="text" id="localidad" placeholder="BOGOTÁ, COL" required>
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-actions" style="margin-top: 2rem;">
                <button type="submit" class="btn-submit-form" id="btn-submit-fighter" style="width: 100%;">ENVIAR CREDENCIALES</button>
            </div>
        `,
        /** Formulario para promotoras y organizaciones: datos de empresa y registro legal */
        promotion: `
            <div class="form-section">
                <div class="section-column">
                    <h3 class="section-title">01. DATOS DE LA ORGANIZACIÓN</h3>
                    <div class="form-group">
                        <label>NOMBRE DE LA ORGANIZACIÓN</label>
                        <input type="text" id="promo-name" placeholder="PROMOTORA LLC" required>
                    </div>
                    <div class="form-group">
                        <label>CIUDAD BASE</label>
                        <input type="text" id="promo-city" placeholder="EJ. BOGOTÁ" required>
                    </div>
                    <div class="form-group">
                        <label>NÚMERO DE REGISTRO LEGAL / NIT</label>
                        <input type="text" id="promo-id" placeholder="XX-XXXXXXX" required>
                    </div>
                </div>
                <div class="section-column">
                    <h3 class="section-title">CREDENCIALES DE ACCESO</h3>
                    <div class="form-group">
                        <label>CORREO ELECTRÓNICO</label>
                        <input type="email" id="promo-email" placeholder="ADMIN@PROMOTORA.COM" required>
                    </div>
                    <div class="form-group">
                        <label>CONTRASEÑA</label>
                        <input type="password" id="promo-password" placeholder="••••••••" required>
                    </div>
                </div>
            </div>
            <div class="form-actions" style="margin-top: 2rem;">
                <button type="submit" class="btn-submit-form" id="btn-submit-promo" style="width: 100%;">ENVIAR CREDENCIALES</button>
            </div>
        `,
        /** Formulario simplificado para aficionados y espectadores */
        fan: `
            <div class="form-section">
                <div class="section-column">
                    <h3 class="section-title">CREDENCIALES DE ACCESO</h3>
                    <div class="form-group">
                        <label>NOMBRE</label>
                        <input type="text" id="fan-name" placeholder="TU NOMBRE" required>
                    </div>
                    <div class="form-group">
                        <label>CORREO ELECTRÓNICO</label>
                        <input type="email" id="fan-email" placeholder="USUARIO@RED.COM" required>
                    </div>
                    <div class="form-group">
                        <label>CONTRASEÑA</label>
                        <input type="password" id="fan-password" placeholder="••••••••" required>
                    </div>
                </div>
            </div>
            <div class="form-actions" style="margin-top: 2rem;">
                <button type="submit" class="btn-submit-form" id="btn-submit-fan" style="width: 100%;">ENVIAR CREDENCIALES</button>
            </div>
        `
    };

    /**
     * Títulos descriptivos para el encabezado del formulario dinámico.
     * @constant {Object.<string, string>}
     */
    const titles = {
        fighter: "APLICACIÓN DE PELEADOR",
        promotion: "REGISTRO DE PROMOTORA",
        fan: "ACCESO DE ESPECTADOR"
    };

    // ========================================================================
    // 4. EFECTOS INTERACTIVOS 3D Y SELECCIÓN DE ROLES
    // ========================================================================
    cards.forEach(card => {
        /**
         * Efecto 3D Tilt: Calcula el ángulo de inclinación según la posición relativa del cursor.
         */
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Ángulos de rotación proporcionales a la distancia del centro (-5deg a +5deg)
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        // Restablece la orientación original con una transición suave al salir el cursor
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.transition = 'transform 0.5s ease';
        });

        // Remueve la transición al entrar para evitar retrasos en el seguimiento del mouse
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'none';
        });

        /**
         * Manejador de selección de rol:
         * 1. Almacena el rol seleccionado en `window.selectedRole`.
         * 2. Inyecta la plantilla HTML correspondiente en `#dynamic-form`.
         * 3. Transiciona la vista del selector de roles al formulario de datos.
         */
        card.addEventListener('click', () => {
            const role = card.dataset.role;
            window.selectedRole = role; // Variable global consumida por app.js al registrar en Firebase
            
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            if (formMainTitle) formMainTitle.textContent = titles[role];
            if (dynamicForm) {
                dynamicForm.innerHTML = forms[role];
                if (role === 'fighter') {
                    initFighterRegistrationRecords();
                }
            }

            // Transición animada del Paso 1 al Paso 2
            if (roleSelection && registrationForm) {
                roleSelection.classList.remove('active');
                setTimeout(() => {
                    roleSelection.style.display = 'none';
                    registrationForm.style.display = 'block';
                    
                    void registrationForm.offsetWidth;
                    registrationForm.classList.add('active');
                    
                    if (role === 'fighter') {
                        initFighterRegistrationRecords();
                    }

                    // Ajuste de diseño de columna única para el rol de aficionado
                    const formSection = document.querySelector('#dynamic-form .form-section');
                    if (role === 'fan' && formSection) {
                        formSection.style.gridTemplateColumns = '1fr';
                        formSection.style.maxWidth = '400px';
                        formSection.style.margin = '0 auto';
                    }
                }, 300);
            }
        });
    });

    /**
     * Metadatos e inicializador de récords dinámicos por arte marcial para el registro de atletas.
     */
    const DISCIPLINE_META = {
        mma: { name: 'MMA', icon: 'fa-fist-raised' },
        boxeo: { name: 'Boxeo', icon: 'fa-mitten' },
        bjj: { name: 'Jiu-Jitsu (BJJ)', icon: 'fa-shield-alt' },
        lucha: { name: 'Lucha / Wrestling', icon: 'fa-compress-arrows-alt' },
        muaythai: { name: 'Muay Thai', icon: 'fa-fire' },
        kickboxing: { name: 'Kickboxing', icon: 'fa-bolt' },
        judo: { name: 'Judo', icon: 'fa-award' }
    };

    function initFighterRegistrationRecords() {
        const baseDiscSelect = document.getElementById('disciplina-base');
        const recordsContainer = document.getElementById('reg-records-container');
        const checkboxes = document.querySelectorAll('.reg-fighter-target-disc');
        if (!baseDiscSelect || !recordsContainer) return;

        if (!window._fc_fighter_reg_records) {
            window._fc_fighter_reg_records = {
                mma: { wins: 0, losses: 0, draws: 0 }
            };
        }
        const recordsState = window._fc_fighter_reg_records;

        const render = () => {
            const primaryDisc = (baseDiscSelect.value || 'mma').toLowerCase();

            // Asegurar que la disciplina base principal esté marcada en los chips
            checkboxes.forEach(cb => {
                if (cb.value.toLowerCase() === primaryDisc) {
                    cb.checked = true;
                }
            });

            // Extraer todas las artes marciales seleccionadas
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

            recordsContainer.innerHTML = activeDiscs.map(disc => {
                const meta = DISCIPLINE_META[disc] || { name: disc.toUpperCase(), icon: 'fa-fist-raised' };
                const isPrimary = disc === primaryDisc;
                const rec = recordsState[disc] || { wins: 0, losses: 0, draws: 0 };

                return `
                    <div class="discipline-record-card ${isPrimary ? 'is-primary' : ''}" data-disc="${disc}">
                        <div class="disc-record-header">
                            <span class="disc-name-tag">
                                <i class="fas ${meta.icon}"></i> ${meta.name}
                            </span>
                            ${isPrimary ? '<span class="disc-primary-badge"><i class="fas fa-star"></i> PRINCIPAL</span>' : ''}
                        </div>
                        <div class="disc-record-inputs">
                            <div class="disc-input-group">
                                <label>VICTORIAS (V)</label>
                                <input type="number" id="reg-wins-${disc}" class="reg-disc-input" data-disc="${disc}" data-field="wins" min="0" max="150" value="${rec.wins}">
                            </div>
                            <div class="disc-input-group">
                                <label>DERROTAS (D)</label>
                                <input type="number" id="reg-losses-${disc}" class="reg-disc-input" data-disc="${disc}" data-field="losses" min="0" max="150" value="${rec.losses}">
                            </div>
                            <div class="disc-input-group">
                                <label>EMPATES (E)</label>
                                <input type="number" id="reg-draws-${disc}" class="reg-disc-input" data-disc="${disc}" data-field="draws" min="0" max="50" value="${rec.draws}">
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Sincronizar inputs ocultos de respaldo para el récord principal
            const primaryRec = recordsState[primaryDisc] || { wins: 0, losses: 0, draws: 0 };
            const wHidden = document.getElementById('victorias');
            const lHidden = document.getElementById('derrotas');
            const dHidden = document.getElementById('empates');
            if (wHidden) wHidden.value = primaryRec.wins;
            if (lHidden) lHidden.value = primaryRec.losses;
            if (dHidden) dHidden.value = primaryRec.draws;

            // Escuchar cambios en los inputs numéricos y mantener el estado
            recordsContainer.querySelectorAll('.reg-disc-input').forEach(inp => {
                inp.addEventListener('input', (e) => {
                    const d = e.target.getAttribute('data-disc');
                    const field = e.target.getAttribute('data-field');
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    if (!recordsState[d]) recordsState[d] = { wins: 0, losses: 0, draws: 0 };
                    recordsState[d][field] = val;

                    if (d === primaryDisc) {
                        if (field === 'wins' && wHidden) wHidden.value = val;
                        if (field === 'losses' && lHidden) lHidden.value = val;
                        if (field === 'draws' && dHidden) dHidden.value = val;
                    }
                });
            });
        };

        baseDiscSelect.addEventListener('change', render);
        checkboxes.forEach(cb => cb.addEventListener('change', render));
        render();
    }
    window.initFighterRegistrationRecords = initFighterRegistrationRecords;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
window._fcInitAuth = initAuth;
