# 🥊 FIGHT CONNECT · Plataforma Integral de Artes Marciales y Deportes de Combate

> **FightConnect** es un ecosistema digital multi-rol (MPA) diseñado para conectar a la comunidad de artes marciales: promotoras de eventos, peleadores profesionales/amateurs y fanáticos. Integra carteleras geográficas 3D, feed social en tiempo real (FightFeed) con predicciones Pick'em, cumplimiento médico KYB y motores de scouting de atletas.

---

## 🌟 Características Principales

### 1. 🏢 Ecosistema de Promotoras & KYB Médico
* **Verificación de Seguridad:** Validación de estándares de seguridad en veladas (médicos en lona, ambulancia UCI, seguros contra accidentes).
* **Gestión de Veladas:** Publicación de carteleras, gestión de combates y venta de taquilla.
* **Motor de Scouting:** Búsqueda y filtrado de peleadores por récord, disciplina, división de peso y ciudad.

### 2. 🥋 Panel del Atleta & Peleadores
* **Combat ID / Tale of the Tape:** Récord oficial (Victorias - Derrotas - Empates), alcance, guardia y gimnasio.
* **Buscador de Peleas:** Postulación a veladas oficiales y convocatorias de promotoras.
* **Historial Certificado:** Registro transparente de combates disputados.

### 3. 🎟️ Centro del Fanático
* **Radar y Cartelera Local:** Exploración de eventos cercanos con renderizado 3D procedural del octágono en **Three.js**.
* **Cartelera Mundial:** Conexión con APIs internacionales de MMA y deportes de combate con cuotas oficiales y respaldo visual sin tarjetas vacías.
* **Roster de Favoritos:** Seguimiento a peleadores y eventos favoritos.

### 4. ⚡ FightFeed · Red Social y Liga Fight IQ
* **Feed Comunitario en Vivo:** Sincronizado en tiempo real con **Cloud Firestore** (`onSnapshot`).
* **Encuestas Pick'em:** Pronósticos de esquina roja vs azul con contadores atómicos `increment()`.
* **Podio Mensual del Día 10:** Los días 10 de cada mes se consagra el podio oficial con los 10 mejores pronosticadores en predicciones, votos y participaciones comunitarias.

### 5. 📚 Documentación Integrada
* **[Manual Oficial de Usuario](./manual-usuario/index.html):** Guía interactiva por roles con exportación a PDF.
* **[Manual Técnico de Programador](./manual-programador/index.html):** Arquitectura MPA, diagramas de flujo, árboles de código y reglas de seguridad NoSQL.

---

## 🛠️ Stack Tecnológico

* **Frontend:** HTML5 Semántico, CSS3 Vanilla Glassmorphism / Dark Cyber Theme, JavaScript (ES6+ Modules).
* **Build Tool:** [Vite v8.x](https://vitejs.dev/) Multi-Page Application (MPA).
* **Base de Datos & Backend:** [Firebase v10 / Cloud Firestore](https://firebase.google.com/) con mutaciones atómicas y reglas de seguridad granulares.
* **Gráficos 3D:** [Three.js](https://threejs.org/) (Renderizado WebGL de octágonos en carteleras locales).
* **Audio FX:** Efectos de sonido temáticos de impacto y campana.

---

## 🚀 Instalación y Puesta en Marcha Local

### Prerrequisitos
* [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
* [Git](https://git-scm.com/)

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/matiasarrietam2026-dev/FightConnect.git
   cd FightConnect
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 👥 Roles del Sistema

| Rol | Portal Principal | Funcionalidades Clave |
| :--- | :--- | :--- |
| **Promotora** | `promotor-dashboard.html` | KYB Médico, Scouting, Gestión de Eventos |
| **Peleador** | `fighter-dashboard.html` | Postulaciones, Ficha Técnica, Récord |
| **Fanático** | `fan-dashboard.html` | FightFeed, Pick'ems, Favoritos, Carteleras |

---

## 📄 Licencia y Derechos
© 2026 **FightConnect**. Todos los derechos reservados. Proyecto desarrollado para Programación Técnica UPB 2026.
