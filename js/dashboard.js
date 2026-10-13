/**
 * @fileoverview Controlador de Interfaz de Usuario para Dashboards en FightConnect.
 * 
 * Este módulo gestiona las interacciones de UI comunes en los paneles de control:
 * 1. Modales emergentes: Edición de perfil de usuario y creación de nuevos eventos de combate.
 * 2. Formularios interactivos: Registro y actualización de métricas corporales (peso de atletas).
 * 3. Componente Drag & Drop: Carga interactiva de pósters promocionales con soporte
 *    para arrastre de archivos desde el explorador y previsualización gráfica instantánea (FileReader).
 * 
 * @module dashboard
 * @author FightConnect Development Team
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========================================================================
    // 1. GESTIÓN DEL MODAL DE EDICIÓN DE PERFIL
    // ========================================================================
    const editBtn = document.querySelector('.edit-profile-btn');
    const editModal = document.getElementById('edit-profile-modal');
    const closeEditModal = document.getElementById('close-edit-modal');
    const editForm = document.getElementById('edit-profile-form');

    if (editBtn && editModal) {
        // Apertura del modal al pulsar el botón de editar perfil
        editBtn.addEventListener('click', () => {
            editModal.classList.remove('hidden');
        });
        
        // Cierre del modal mediante el botón de cierre (icono X)
        if (closeEditModal) {
            closeEditModal.addEventListener('click', () => {
                editModal.classList.add('hidden');
            });
        }

        // Cierre del modal al hacer clic en el fondo oscuro (backdrop/overlay)
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.classList.add('hidden');
            }
        });
    }

    // ========================================================================
    // 2. GESTIÓN DEL FORMULARIO DE REGISTRO DE PESO (ATLETAS)
    // ========================================================================
    const pesoForm = document.getElementById('peso-form');
    if (pesoForm) {
        pesoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btnSubmit = pesoForm.querySelector('button[type="submit"]');
            const originalText = btnSubmit.textContent;
            
            // Estado visual de carga durante el pesaje
            btnSubmit.textContent = "REGISTRANDO...";
            btnSubmit.style.background = "#28a745";
            
            setTimeout(() => {
                pesoForm.reset();
                btnSubmit.textContent = originalText;
                btnSubmit.style.background = "var(--accent-red)";
                console.log("Nuevo peso registrado en BD");
            }, 1500);
        });
    }

    // ========================================================================
    // 3. GESTIÓN DEL MODAL DE CREACIÓN DE EVENTOS (PROMOTORES)
    // ========================================================================
    const modal = document.getElementById('create-event-modal');
    const btnCreate = document.getElementById('btn-create-event');
    const btnClose = document.getElementById('close-modal');
    const form = document.getElementById('create-event-form');

    // 3.1. Apertura del modal
    if (btnCreate && modal) {
        btnCreate.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
    }

    // 3.2. Cierre mediante botón de cierre (X)
    if (btnClose && modal) {
        btnClose.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    // 3.3. Cierre al hacer clic fuera del contenedor del modal
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    // Nota: El procesamiento y guardado del formulario en Firestore es coordinado por app.js

    // ========================================================================
    // 4. ZONA INTERACTIVA DE DRAG & DROP PARA PÓSTERS DE EVENTOS
    // ========================================================================
    const dropZone = document.getElementById('drag-drop-zone');
    const fileInput = document.getElementById('poster-input');

    if (dropZone && fileInput) {
        // Redirigir el clic en el área interactiva hacia el input file nativo
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        // Eventos de arrastre sobre la zona (drag over)
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        // Evento al abandonar la zona de arrastre (drag leave)
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        // Evento al soltar el archivo en la zona (drop)
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                // Almacena la referencia en window para que el servicio de subida la consuma
                window._selectedPosterFile = file;
                try { 
                    fileInput.files = e.dataTransfer.files; 
                } catch (_) {
                    // Manejo silencioso en navegadores con restricciones en DataTransfer
                }
                updateDropZoneUI(file);
            }
        });

        // Evento al seleccionar archivo mediante el diálogo del explorador
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                window._selectedPosterFile = file;
                updateDropZoneUI(file);
            }
        });
    }

    /**
     * Actualiza visualmente el componente de carga con el estado del archivo seleccionado
     * y genera una previsualización miniatura si el archivo corresponde a una imagen válida.
     * 
     * @function updateDropZoneUI
     * @param {File} file - Objeto de archivo binario recibido desde el input o evento drag & drop.
     * @returns {void}
     */
    function updateDropZoneUI(file) {
        if (!dropZone || !file) return;
        dropZone.classList.remove('drag-error');
        const fileName = file.name || 'Póster seleccionado';
        const p = dropZone.querySelector('p');
        const span = dropZone.querySelector('span');
        const icon = dropZone.querySelector('i');

        // Modificación de textos e icono de confirmación
        if (p) p.textContent = `ARCHIVO LISTO: ${fileName}`;
        if (span) span.textContent = 'Haz clic para cambiar el póster';
        if (icon) {
            icon.className = 'fas fa-check-circle';
            icon.style.color = '#28a745';
        }

        // Generación asíncrona de miniatura visual usando FileReader API
        if (file.type && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                let preview = dropZone.querySelector('.poster-preview-thumb');
                if (!preview) {
                    preview = document.createElement('img');
                    preview.className = 'poster-preview-thumb';
                    preview.style.maxHeight = '90px';
                    preview.style.borderRadius = '6px';
                    preview.style.marginTop = '0.5rem';
                    preview.style.border = '1px solid rgba(40, 167, 69, 0.5)';
                    dropZone.appendChild(preview);
                }
                preview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
});
