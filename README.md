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
   Crea un archivo llamado `.env.local` en la raíz del proyecto y agrega tus claves reales (ver `.env.example`):

   ```env
   # Frontend (Vite las expone en el bundle del cliente — solo van acá claves públicas)
   VITE_FIREBASE_API_KEY=tu-api-key
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu-proyecto
   VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcde

   # Server-side (usadas solo por api/upload.ts — SIN prefijo VITE_ para que
   # nunca se empaqueten en el bundle del frontend ni queden visibles al cliente)
   AWS_ACCESS_KEY_ID=tu-aws-key
   AWS_SECRET_ACCESS_KEY=tu-aws-secret
   AWS_REGION=sa-east-1
   AWS_S3_BUCKET_NAME=tu-bucket-name
   ```

   En Vercel (producción), estas mismas variables se cargan en *Project Settings → Environment Variables* del dashboard, nunca en un archivo committeado.

4. **Desplegar las reglas de seguridad de Firestore:**

   Las reglas viven en [`firestore.rules`](firestore.rules) (protegen `products` y `orders` por rol, ver sección de Seguridad más abajo). Para aplicarlas al proyecto real:

   ```bash
   npm install -g firebase-tools   # si no lo tenés instalado
   firebase login
   firebase deploy --only firestore:rules
   ```

5. **Levantar el entorno de desarrollo:**

   ```bash
   npm run dev
   ```

   *La aplicación estará corriendo en `http://localhost:3000`.*

6. **Ejecutar Pruebas (Vitest):**

   ```bash
   npm run test
   ```

## 🔒 Seguridad y Reglas de Firestore

- Las credenciales de AWS **nunca** viven en el frontend: `api/upload.ts` (Vercel Serverless Function) es el único lugar que las usa, generando una *presigned URL* de S3 para que el navegador suba el archivo directamente sin exponer claves.
- `firestore.rules` define el acceso por rol:
  - `users/{uid}`: cada usuario lee/crea su propio perfil; el rol se fija en `customer` al alta y sólo se puede promover a `admin` manualmente desde la consola de Firebase (nunca desde el cliente).
  - `products/{id}`: lectura pública; sólo `admin` puede crear/editar/borrar, salvo el descuento de `stock` durante el checkout, que cualquier usuario autenticado puede hacer (y sólo puede *bajar* el valor, nunca subirlo ni tocar otro campo).
  - `orders/{id}`: cada cliente sólo lee/crea sus propias órdenes; sólo `admin` puede listarlas todas y cambiar su `status`.

## 🤖 Bitácora de Uso de Inteligencia Artificial

Usé IA (Gemini/Antigravity, y luego Claude para la auditoría de seguridad) como asistente durante el desarrollo. Estas son las entradas clave con mi propia reflexión sobre lo que aprendí y por qué decidí lo que decidí:

1. **Prompt: "te voy a pasar imagenes de un proyecto integrador para que vayas viendo que hay que hacer"**
   - *Aprendizaje:* Partir de las diapositivas de la consigna en vez de arrancar a codear directo me obligó a mapear primero los requerimientos funcionales (Auth, S3, Firestore) antes de tocar código, lo que evitó tener que rehacer la arquitectura a mitad de camino.
   - *Decisión:* Armé un plan de implementación por fases (setup → auth → catálogo → carrito → checkout → admin) antes de escribir el primer componente.

2. **Prompt: "valores de pruebas y despues los remplazo"**
   - *Aprendizaje:* Trabajar con variables de entorno dummy me permitió avanzar la UI sin depender de que el backend (Firebase/AWS) ya estuviera configurado, pero también fue la raíz de un problema real: terminé con credenciales de AWS reales pegadas directamente en `.env.local` y en `vercel.json` con prefijo `VITE_`, lo que las exponía en el bundle del frontend. Lo corregí sacándolas del build y separando claramente qué variables son públicas (Firebase, con prefijo `VITE_`) de cuáles son server-only (AWS, sin prefijo, sólo para `api/upload.ts`).
   - *Decisión:* De acá en adelante, ninguna credencial sensible va en un archivo del repo, ni siquiera gitignoreado; las de AWS sólo viven como variable de entorno del lado del servidor.

3. **Prompt: "fase tres y al final probamos todo"**
   - *Aprendizaje:* Implementar `api/upload.ts` como Vercel Function para generar presigned URLs tiene sentido justamente para no tener que exponer las credenciales de AWS en el navegador. Sin embargo, en el `AdminDashboard` terminé llamando al SDK de AWS directamente desde el cliente en vez de usar esa función — es decir, escribí la solución correcta pero no la usé donde importaba. Aprendí a revisar que el flujo completo (frontend → función serverless → S3) esté conectado de punta a punta, no sólo que cada pieza exista por separado.
   - *Decisión:* Reescribí el flujo de subida de imágenes en `AdminDashboard` para que pase siempre por `api/upload.ts`.

4. **Prompt: "ese localhost ya esta ocupado pone en otro"**
   - *Aprendizaje:* Un detalle chico (puerto ocupado) pero que enseña a no dejar puertos "mágicos" sin documentar.
   - *Decisión:* Forcé el puerto 3000 en `vite.config.ts` y lo dejé documentado en el README para que cualquiera que clone el repo sepa dónde va a correr.

5. **Prompt: "esta en blanco la pagina"**
   - *Aprendizaje:* Un error de compilación estricto de Vite/Rolldown (`[MISSING_EXPORT] "User"`) me mostró que con `verbatimModuleSyntax` activado, los tipos tienen que importarse con `import type`, no como imports normales — si no, el build falla en producción aunque en dev no se note.
   - *Decisión:* Separé imports de tipos (`import type`) de imports de valores en los archivos que mezclaban ambos.

6. **Prompt: "haz los extracredits"**
   - *Aprendizaje:* Agregar analytics con `recharts` y paginación con `startAfter` de Firestore me hizo entender la diferencia entre paginar por offset (ineficiente, relee todo) y paginar por cursor (sólo lee lo nuevo) — quedó claro por qué la guía insiste en el segundo enfoque.
   - *Decisión:* Extendí el tipo `Product` con `rating`/`reviewsCount` y el dashboard admin con métricas de ventas en vez de dejarlo como una tabla simple.

7. **Prompt: auditoría de seguridad y de la guía del PI5 completa**
   - *Aprendizaje:* No había ningún archivo de reglas de Firestore en el repo — sin eso, la protección por rol dependía únicamente de la UI (`ProtectedRoute`), lo cual no protege nada si alguien llama a Firestore directamente desde la consola del navegador. También el test suite existente nunca corrió realmente (faltaba el entorno `jsdom` en la config de Vitest y el script `test` en `package.json`).
   - *Decisión:* Escribí `firestore.rules` con reglas por colección y rol, agregué `firebase.json`/`.firebaserc` para poder desplegarlas con `firebase deploy --only firestore:rules`, arreglé la configuración de Vitest, y sumé tests de `AuthContext`, `ProtectedRoute` y del reducer del carrito.
