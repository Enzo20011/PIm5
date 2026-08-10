# Patagonix Tech - E-commerce SPA

Proyecto Integrador Final (Módulo 5) para la creación de una Single Page Application (SPA) de comercio electrónico con un panel de administración, desarrollada con React, TypeScript y Firebase.

## 🚀 Tecnologías Utilizadas

- **Frontend:** React 18, TypeScript, Vite
- **Estilos:** TailwindCSS (v3) para un diseño premium, responsive y moderno.
- **Enrutamiento:** React Router DOM (v6)
- **Base de Datos & Auth:** Firebase (Auth con Google/Email, Firestore para Productos y Órdenes)
- **Almacenamiento de Imágenes:** Amazon S3 (AWS)
- **Serverless:** Vercel Serverless Functions (`api/upload.ts` para generación de Presigned URLs de S3)
- **Gráficos & Analytics:** Recharts
- **Testing:** Vitest y React Testing Library

## 📦 Funcionalidades Principales

### 1. Experiencia del Cliente (Customer)

- **Catálogo de Productos:** Visualización de productos con imágenes, precios, sistema de *rating/reviews*, filtros por categoría y búsqueda en tiempo real con optimización (Debounce).
- **Paginación Optimizada:** Botón "Cargar más" que utiliza cursores de Firestore (`startAfter`) para limitar las lecturas de base de datos.
- **Carrito de Compras:** Gestión del carrito mediante `useReducer` y Context API.
- **Checkout Simulado:** Flujo de compra que persiste una Orden de Compra en Firestore.
- **Historial de Órdenes:** Vista protegida donde el cliente puede revisar sus compras pasadas y su estado.

### 2. Panel de Administración (Admin)

- **Dashboard de Analytics (Extra Credit):** Gráficos interactivos de ventas e ingresos usando `Recharts`.
- **Gestión de Órdenes:** Listado de todas las órdenes del sistema con capacidad de cambiar el estado (Pendiente, Procesando, Enviado, etc).
- **CRUD de Productos:** Creación y eliminación de productos.
- **Subida Segura de Imágenes:** Integración con AWS S3 utilizando URLs prefirmadas para que el cliente (navegador) suba la imagen directamente a S3 sin exponer claves en el frontend.

## 🛠️ Instrucciones de Instalación y Ejecución Local

### Prerrequisitos

- Node.js (v18 o superior)
- Una cuenta en [Firebase](https://firebase.google.com/) con Firestore y Authentication (Google Provider) habilitados.
- Un bucket en [AWS S3](https://aws.amazon.com/s3/) con políticas de CORS configuradas.

### Pasos

1. **Clonar el repositorio y entrar a la carpeta:**

   ```bash
   git clone <tu-repo>
   cd PIm5
   ```

2. **Instalar dependencias:**

   ```bash
   npm install
   ```

3. **Configurar Variables de Entorno:**
   Crea un archivo llamado `.env.local` en la raíz del proyecto y agrega tus claves reales:

   ```env
   VITE_FIREBASE_API_KEY=tu-api-key
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu-proyecto
   VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcde

   AWS_ACCESS_KEY_ID=tu-aws-key
   AWS_SECRET_ACCESS_KEY=tu-aws-secret
   AWS_REGION=sa-east-1
   S3_BUCKET_NAME=tu-bucket-name
   ```

4. **Levantar el entorno de desarrollo:**

   ```bash
   npm run dev
   ```

   *La aplicación estará corriendo en `http://localhost:3000`.*

5. **Ejecutar Pruebas (Vitest):**

   ```bash
   npm run test
   ```

## 🤖 Log de Uso de Inteligencia Artificial (Prompt Log)

Durante el desarrollo de este proyecto integrador se utilizó asistencia de IA (Gemini/Antigravity) operando como *Pair Programmer* autónomo. A continuación se resumen los prompts clave y flujos de decisión:

1. **"te voy a pasar imagenes de un proyecto integrador para que vayas viendo que hay que hacer"**:
   - *Decisión IA:* Lectura comprensiva de múltiples diapositivas. Se generó un plan arquitectónico (`implementation_plan.md`) extrayendo requerimientos funcionales (Auth, S3, Firestore) y diseño (Premium SPA).
2. **"valores de pruebas y despues los remplazo"**:
   - *Decisión IA:* Configuración de variables de entorno *dummy* (`.env.local`) y un wrapper de Firebase que maneja de forma grácil los errores para permitir el desarrollo visual de la UI sin bloquearse por falta de backend.
3. **"fase tres y al final probamos todo"**:
   - *Decisión IA:* Implementación de Vercel Serverless Function (`api/upload.ts`) para presigned URLs, y CRUD de productos en Firestore. Generación asíncrona y estructurada de componentes.
4. **"ese localhost ya esta ocupado pone en otro"**:
   - *Resolución de IA:* Modificación dinámica de `vite.config.ts` para forzar el puerto 3000.
5. **"esta en blanco la pagina"**:
   - *Resolución de IA (Debugging Autónomo):* La IA ejecutó `npx vite build` en segundo plano, detectó un error de compilación estricto de Rolldown/Vite 8 relacionado a exportaciones de interfaces de TypeScript (`[MISSING_EXPORT] "User"`), y automáticamente refactorizó los imports a `import type`.
6. **"haz los extracredits"**:
   - *Decisión IA:* Se agregaron librerías (`recharts`) y se actualizó el `AdminDashboard` para soportar métricas. Se modificaron los hooks de Firestore para utilizar `startAfter` (Paginación nativa) y se extendió el tipo `Product` para soportar estrellas de *Rating*.
