/**
 * @fileoverview Configuración e Inicialización de Firebase SDK para FightConnect.
 * 
 * Este módulo se encarga de:
 * 1. Importar los módulos oficiales de Firebase v10.9.0 desde la CDN oficial de Google.
 * 2. Inicializar la instancia principal de la aplicación Firebase (`app`).
 * 3. Configurar los servicios centrales en la nube:
 *    - Cloud Firestore (`db`): Base de datos NoSQL para usuarios, eventos, postulaciones y feed social.
 *    - Firebase Authentication (`auth`): Gestión de registro, inicio de sesión y persistencia de credenciales.
 *    - Firebase Storage (`storage`): Almacenamiento de archivos binarios y multimedia.
 *    - Google Analytics (`analytics`): Métricas de telemetría y uso de la plataforma.
 * 4. Integrar el servicio auxiliar de imágenes (`ImageService`).
 * 5. Exponer referencias controladas al objeto global `window` para compatibilidad
 *    entre módulos ES6 y scripts tradicionales de la aplicación.
 * 
 * @module firebase-config
 * @author FightConnect Development Team
 * @version 1.0.0
 */

// ============================================================================
// IMPORTACIÓN DE MÓDULOS MODULARES DE FIREBASE v10 (CDN OFICIAL)
// ============================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc, 
    getDocs, 
    onSnapshot, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

// Importación del servicio de procesamiento y subida de imágenes
import { uploadImage, compressImage, fileToDataUrl } from "./image-service.js";

// ============================================================================
// CONFIGURACIÓN DE CREDENCIALES DEL PROYECTO FIREBASE
// ============================================================================
/**
 * Objeto de configuración de Firebase para el entorno de producción de FightConnect.
 * Contiene identificadores de proyecto, llaves públicas de API y dominios autorizados.
 * 
 * @constant {Object}
 * @property {string} apiKey - Llave de autenticación pública para peticiones al backend de Google APIs.
 * @property {string} authDomain - Dominio para gestionar flujos de autenticación y redirecciones OAuth.
 * @property {string} projectId - Identificador único del proyecto en Google Cloud / Firebase.
 * @property {string} storageBucket - Bucket de Google Cloud Storage asignado al proyecto.
 * @property {string} messagingSenderId - ID numérico para mensajería en la nube (FCM).
 * @property {string} appId - Identificador único de la aplicación web registrada en Firebase.
 * @property {string} measurementId - ID de seguimiento de Google Analytics 4.
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
// INICIALIZACIÓN DE SERVICIOS
// ============================================================================
/** @constant {import("firebase/app").FirebaseApp} Instancia central de la app Firebase */
const app = initializeApp(firebaseConfig);

/** @constant {import("firebase/analytics").Analytics} Instancia de telemetría y métricas */
const analytics = getAnalytics(app);

/** @constant {import("firebase/firestore").Firestore} Instancia de Base de Datos Cloud Firestore */
const db = getFirestore(app);

/** @constant {import("firebase/auth").Auth} Instancia del servicio de Autenticación */
const auth = getAuth(app);

/** @constant {import("firebase/storage").FirebaseStorage} Instancia de Almacenamiento en la Nube */
const storage = getStorage(app);

// ============================================================================
// EXPOSICIÓN GLOBAL EN WINDOW (PUENTE DE INTEROPERABILIDAD)
// ============================================================================
/**
 * Se exponen las instancias y funciones auxiliares de Firebase en el objeto global `window`
 * para permitir que otros módulos y scripts de vista puedan consumirlos de forma directa
 * manteniendo un único punto de inicialización y evitando múltiples conexiones.
 */

// Instancias de servicios
window.db = db;
window.auth = auth;
window.storage = storage;

// Operaciones CRUD de Cloud Firestore
window.firebaseDoc = doc;
window.firebaseSetDoc = setDoc;
window.firebaseGetDoc = getDoc;
window.firebaseDeleteDoc = deleteDoc;
window.firebaseCollection = collection;
window.firebaseAddDoc = addDoc;
window.firebaseGetDocs = getDocs;
window.firebaseOnSnapshot = onSnapshot;
window.firebaseUpdateDoc = updateDoc;
window.firebaseQuery = query;
window.firebaseWhere = where;
window.firebaseOrderBy = orderBy;
window.firebaseServerTimestamp = serverTimestamp;

// Operaciones de Autenticación
window.createUser = createUserWithEmailAndPassword;
window.signInUser = signInWithEmailAndPassword;
window.signOutUser = signOut;
window.onAuthStateChanged = onAuthStateChanged;

// Operaciones de Storage
window.storageRef = ref;
window.uploadBytes = uploadBytes;
window.getDownloadURL = getDownloadURL;

// Métodos del servicio de procesamiento de imágenes
window.uploadImage = uploadImage;
window.ImageService = { uploadImage, compressImage, fileToDataUrl };

console.log("🔥 Sistema de Nube Iniciado (Firebase Cloud Firestore Conectado + Image Server Activo)");
