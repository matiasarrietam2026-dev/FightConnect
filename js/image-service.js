/**
 * @fileoverview Servicio de Procesamiento, Compresión y Alojamiento de Imágenes para FightConnect.
 * 
 * Este módulo gestiona de forma limpia y eficiente el tratamiento de imágenes en la aplicación:
 * 1. Si la imagen ya es una URL web (HTTP/HTTPS o /uploads/), la retorna directamente sin reprocesar.
 * 2. Compresión en el cliente mediante HTML5 Canvas para optimizar rendimiento y memoria.
 * 3. Almacenamiento local mediante endpoint dedicado (/api/upload-image) o Firebase Storage.
 * 
 * @module image-service
 * @author FightConnect Development Team
 * @version 2.0.0
 */

// ============================================================================
// 1. UTILIDADES DE PROMESAS Y TIMEOUTS
// ============================================================================

import { validateUploadedFile } from './security-utils.js';

/**
 * Ejecuta una promesa asegurando que no exceda un tiempo máximo establecido.
 * @function withTimeout
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} [timeoutErrorMsg]
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms, timeoutErrorMsg = 'Operación excedió el tiempo límite') {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutErrorMsg)), ms))
    ]);
}

// ============================================================================
// 2. COMPRESIÓN Y TRANSFORMACIÓN DE IMÁGENES (CANVAS API)
// ============================================================================

/**
 * Redimensiona y comprime una imagen directamente en el navegador del usuario
 * utilizando un elemento <canvas> en memoria antes de su transferencia de red.
 * 
 * @async
 * @function compressImage
 * @param {File|Blob} file - Archivo binario o Blob de la imagen original.
 * @param {number} [maxWidth=1000] - Ancho máximo permitido en píxeles.
 * @param {number} [maxHeight=1000] - Alto máximo permitido en píxeles.
 * @param {number} [quality=0.85] - Nivel de calidad de compresión JPEG (entre 0.1 y 1.0).
 * @returns {Promise<Blob>} Blob comprimido en formato JPEG (o el archivo original en caso de error).
 */
export async function compressImage(file, maxWidth = 1000, maxHeight = 1000, quality = 0.85) {
    return new Promise((resolve) => {
        if (!file || !(file instanceof Blob)) {
            return resolve(file);
        }

        // Si el archivo es un documento PDF, no requiere compresión Canvas
        if (file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'))) {
            return resolve(file);
        }

        const timeout = setTimeout(() => {
            console.warn("⚠️ [ImageService] Compresión excedió tiempo, usando archivo original");
            resolve(file);
        }, 2000);

        try {
            const objectUrl = URL.createObjectURL(file);
            const img = new Image();
            
            img.onload = () => {
                clearTimeout(timeout);
                URL.revokeObjectURL(objectUrl);

                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width / height > maxWidth / maxHeight) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = Math.max(width, 1);
                canvas.height = Math.max(height, 1);

                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(file);

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob && blob.size > 0) {
                        resolve(blob);
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', quality);
            };

            img.onerror = () => {
                clearTimeout(timeout);
                URL.revokeObjectURL(objectUrl);
                resolve(file);
            };

            img.src = objectUrl;
        } catch (e) {
            clearTimeout(timeout);
            resolve(file);
        }
    });
}

/**
 * Convierte un archivo binario o Blob a una cadena codificada en Base64 (DataURL).
 * @function fileToDataUrl
 * @param {Blob|File|string} blob
 * @returns {Promise<string>}
 */
export function fileToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        if (typeof blob === 'string') return resolve(blob);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(blob);
    });
}

// ============================================================================
// 3. ALMACENAMIENTO DE ARCHIVOS
// ============================================================================

/**
 * Subida al Servidor de Imágenes Local (/api/upload-image).
 * @async
 * @function uploadToLocalServer
 * @param {Blob} imageBlob
 * @param {string} [folder='uploads']
 * @param {number} [timeoutMs=5000]
 * @returns {Promise<string>}
 */
async function uploadToLocalServer(imageBlob, folder = 'uploads', timeoutMs = 5000) {
    const base64Data = await fileToDataUrl(imageBlob);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data, folder: folder }),
            signal: controller.signal
        });
        clearTimeout(timer);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data && data.success && data.url) {
            return data.url;
        }
        throw new Error(data?.error || 'Respuesta inválida del servidor');
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

/**
 * Subida a Firebase Cloud Storage.
 * @async
 * @function uploadToFirebaseStorage
 * @param {Blob} blob
 * @param {string} [folder='events']
 * @param {number} [timeoutMs=3000]
 * @returns {Promise<string>}
 */
async function uploadToFirebaseStorage(blob, folder = 'events', timeoutMs = 3000) {
    if (!window.storage || !window.storageRef || !window.uploadBytes || !window.getDownloadURL) {
        throw new Error("Firebase Storage no disponible");
    }

    const uploadPromise = (async () => {
        const mimeType = blob.type || '';
        let ext = 'jpg';
        if (mimeType === 'application/pdf') ext = 'pdf';
        else if (mimeType === 'image/png') ext = 'png';
        else if (mimeType === 'image/webp') ext = 'webp';
        else if (mimeType === 'video/mp4') ext = 'mp4';
        else if (mimeType === 'video/webm') ext = 'webm';

        const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const fileRef = window.storageRef(window.storage, filename);
        const snapshot = await window.uploadBytes(fileRef, blob);
        return await window.getDownloadURL(snapshot.ref);
    })();

    return await withTimeout(uploadPromise, timeoutMs, "Timeout en Firebase Storage");
}

// ============================================================================
// 4. FUNCIÓN PRINCIPAL DE CARGA
// ============================================================================

/**
 * Procesa y sube una imagen devolviendo la URL accesible para la aplicación.
 * Si ya es una URL web existente (HTTP, HTTPS o /uploads/), la retorna de inmediato.
 * 
 * @async
 * @function uploadImage
 * @param {File|Blob|string} file - Archivo, Blob o URL web.
 * @param {Object} [options={}]
 * @returns {Promise<string>} URL de la imagen.
 */
export async function uploadImage(file, options = {}) {
    if (!file) {
        return options.defaultUrl || '';
    }

    // Si ya es un enlace web existente, retornarlo directamente con 100% de eficiencia
    if (typeof file === 'string' && (file.startsWith('http') || file.startsWith('/uploads/') || file.startsWith('data:'))) {
        return file;
    }

    const targetFolder = options.folder || 'uploads';

    try {
        if (file instanceof File) {
            const isVideoFile = file.type && file.type.startsWith('video/');
            const isPdfFile = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
            const isKybDoc = targetFolder === 'kyb_docs' || isPdfFile;

            let category = 'image';
            let allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            let maxSizeMB = 5;

            if (isVideoFile) {
                category = 'video';
                allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
                maxSizeMB = 25;
            } else if (isKybDoc) {
                category = isPdfFile ? 'pdf' : 'image';
                allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
                maxSizeMB = 15;
            }

            const validation = await validateUploadedFile(file, {
                maxSizeMB,
                category,
                allowedTypes
            });
            if (!validation.valid) {
                console.error("❌ [ImageService] Archivo rechazado por seguridad:", validation.error);
                alert(validation.error);
                throw new Error(validation.error);
            }
        }

        const isVideo = file.type && file.type.startsWith('video/');
        const isPdf = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
        const mediaBlob = (isVideo || isPdf) ? file : await compressImage(file, 1000, 1000, 0.85);

        // Intento 1: Servidor local dedicado
        try {
            const localUrl = await uploadToLocalServer(mediaBlob, targetFolder, 10000);
            if (localUrl) return localUrl;
        } catch (_) {}

        // Intento 2: Firebase Storage si está configurado
        try {
            if (window.storage && window.storageRef && window.uploadBytes && window.getDownloadURL) {
                const fbUrl = await uploadToFirebaseStorage(mediaBlob, targetFolder, 8000);
                if (fbUrl) return fbUrl;
            }
        } catch (_) {}

        // Fallback: Data URL en Base64
        return await fileToDataUrl(mediaBlob);
    } catch (err) {
        console.error("❌ [ImageService] Error procesando archivo multimedia:", err);
        throw err;
    }
}

// ============================================================================
// 5. EXPORTACIÓN GLOBAL EN WINDOW
// ============================================================================
if (typeof window !== 'undefined') {
    window.ImageService = {
        uploadImage,
        compressImage,
        fileToDataUrl
    };
    window.uploadImage = uploadImage;
}
