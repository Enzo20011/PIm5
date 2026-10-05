# Patagonix Tech - E-commerce SPA

Proyecto Integrador Final (Módulo 5): una tienda online de ropa y calzado deportivo con panel de administración, hecha como Single Page Application con React, TypeScript, Firebase y AWS S3.

**URL de producción:** https://pim5-omega.vercel.app

## 🚀 Tecnologías Utilizadas

- **Frontend:** React 18, TypeScript, Vite
- **Estilos:** TailwindCSS (v3), mobile-first, con modo oscuro
- **Enrutamiento:** React Router DOM (v7)
- **Estado global:** Context API + `useReducer` (carrito y sesión)
- **Base de datos y Auth:** Firebase (Auth con Google, Firestore para usuarios, productos y órdenes)
- **Imágenes:** Amazon S3, subidas con URLs prefirmadas
- **Serverless:** Vercel Serverless Functions (`api/upload.ts`)
- **Gráficos:** Recharts (dashboard de ventas del admin)
- **Testing:** Vitest y React Testing Library

## 📦 Funcionalidades

### Cliente

- **Catálogo:** productos desde Firestore, filtro por categoría, búsqueda por nombre con debounce (consulta todo el catálogo, no solo lo ya cargado) y detalle de producto.
- **Paginación:** botón "Cargar más" con cursores de Firestore (`startAfter`) para no releer todo.
- **Carrito:** agregar, cambiar cantidad y eliminar productos, con total automático y tope por stock. Vive en un Context con `useReducer`.
- **Checkout:** revisión del carrito y confirmación. El pago es simulado; la orden se crea en Firestore con estado `pending` y el stock se descuenta en la misma transacción.
- **Mis compras:** historial de órdenes con su estado y el detalle de cada una (qué productos, cantidades y precios).
- **Login:** con Google. La sesión persiste al recargar y cada usuario tiene rol `customer` o `admin`.

### Administrador

- **Dashboard:** órdenes totales, ingresos (sin contar canceladas), promedio por orden y gráfico de ventas.
- **Productos:** crear, editar y eliminar, con subida de imagen a S3.
- **Órdenes:** ver todas, filtrar por estado, ver el detalle y cambiar el estado (`pending`, `processing`, `completed`, `cancelled`).
- Layout propio, distinto al de la tienda, y rutas protegidas por rol.

## 🗂️ Estructura del proyecto

```
api/                  Funciones serverless de Vercel (upload.ts + su test)
src/
  components/         Navbar, ProtectedRoute, OrderCard
  contexts/           AuthContext (sesión y rol), CartContext (carrito con useReducer)
  hooks/              useAuth, useDebounce, useDarkMode
  pages/              Home, ProductDetail, Checkout, Orders, Profile, Login, AdminDashboard
  services/           Todo el acceso a Firebase (auth, productos, órdenes)
  types/              Tipos compartidos (Product, Order, UserProfile, estados)
  test/               Setup de Vitest y wrapper de providers
firestore.rules       Reglas de seguridad de Firestore
```

Las páginas no llaman a Firebase directamente: pasan por `services/`. Eso permite mockear los servicios en los tests y cambiar el backend tocando un solo lugar.

## 🧠 Decisiones de arquitectura

- **Context API + `useReducer` y no Redux.** El estado global son dos cosas: la sesión y el carrito. El carrito tiene varias acciones (agregar, quitar, cambiar cantidad, vaciar) que se resuelven en una función pura, el reducer, fácil de testear sin montar nada. Para este tamaño, Redux era más código sin ganar nada.
- **El carrito vive solo en el Context.** La consigna pide persistirlo ahí. Por eso la navegación usa `<Link>` y no recargas de página: una recarga lo vaciaría.
- **S3 para las imágenes y no Firestore.** Firestore tiene un tope de 1 MB por documento y cobra por lectura; las imágenes en un bucket salen más baratas y se sirven directo por URL.
- **Presigned URLs.** El navegador sube la imagen directo a S3, sin pasar por nuestro servidor y sin ver nunca las credenciales de AWS (detalle abajo).
- **La orden se crea en una transacción de Firestore.** Se leen precio y stock de la base (no del carrito), se verifica que alcance el stock, se descuenta y se crea la orden en un solo paso. Si algo falla no queda una orden sin descontar stock ni al revés, y nadie puede comprar a un precio manipulado desde el navegador.
- **La seguridad real está en el servidor.** `ProtectedRoute` solo esconde pantallas; lo que protege los datos son las `firestore.rules` y la verificación de rol en `api/upload.ts`.

## ☁️ Flujo de subida de imágenes (presigned URLs)

1. En el panel admin se elige una imagen. El navegador valida tipo (JPG, PNG, WEBP o GIF) y tamaño (máx. 5 MB).
2. El navegador llama a `POST /api/upload` con el ID token de Firebase del usuario en el header `Authorization`.
3. La función serverless verifica el token con Firebase, confirma que el usuario tenga rol `admin` en Firestore y revisa tipo y tamaño. Si algo no cuadra responde 401, 403 o 400.
4. Si todo está bien, usa las credenciales de AWS (que viven solo en las variables de entorno de Vercel) para generar una URL prefirmada de `PutObject`, válida 60 segundos, y devuelve esa URL junto con la URL pública final.
5. El navegador hace un `PUT` de la imagen directo a esa URL de S3.
6. Se guarda en el producto (en Firestore) la URL pública.

Para que las imágenes se vean, el bucket necesita lectura pública sobre `products/*` y una política de CORS que permita `PUT` desde el dominio de la app.

## 🛠️ Instalación y ejecución local

### Prerrequisitos

- Node.js 18 o superior
- Un proyecto de [Firebase](https://firebase.google.com/) con Firestore y Authentication (proveedor Google) habilitados
- Un bucket de [AWS S3](https://aws.amazon.com/s3/) con CORS configurado y un usuario IAM con permiso `s3:PutObject` sobre `products/*`

### Pasos

1. **Clonar e instalar:**

   ```bash
   git clone https://github.com/Enzo20011/PIm5.git
   cd PIm5
   npm install
   ```

2. **Variables de entorno.** Copiá `.env.example` a `.env.local` y completalo:

   ```env
   # Frontend (Vite las expone en el bundle del cliente: solo van acá claves públicas)
   VITE_FIREBASE_API_KEY=tu-api-key
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu-proyecto
   VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcde

   # Solo servidor (api/upload.ts). Sin prefijo VITE_ para que nunca lleguen al navegador
   AWS_ACCESS_KEY_ID=tu-aws-key
   AWS_SECRET_ACCESS_KEY=tu-aws-secret
   AWS_REGION=sa-east-1
   AWS_S3_BUCKET_NAME=tu-bucket
   FIREBASE_API_KEY=el-mismo-valor-que-VITE_FIREBASE_API_KEY
   FIREBASE_PROJECT_ID=el-mismo-valor-que-VITE_FIREBASE_PROJECT_ID
   ```

   En Vercel estas mismas variables se cargan en *Project Settings → Environment Variables*. Nunca van en un archivo commiteado: `.env.local` está en `.gitignore`.

3. **Reglas e índices de Firestore:**

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore
   ```

4. **Primer administrador.** Nadie puede darse el rol `admin` desde la app. Iniciá sesión una vez con Google y después, en la consola de Firebase, cambiá el campo `role` de tu documento en `users/{tu-uid}` a `admin`.

5. **Desarrollo:**

   ```bash
   npm run dev
   ```

   La app corre en `http://localhost:3000`. Ojo: `api/upload.ts` solo funciona desplegado en Vercel o con `vercel dev`; con `npm run dev` la subida de imágenes no responde.

6. **Tests:**

   ```bash
   npm run test
   ```

## ✅ Tests

Vitest + React Testing Library, con Firebase y el SDK de AWS mockeados (los tests no tocan ningún servicio real):

- **Reducer y `useCart`** (con `renderHook`): agregar, quitar, cambiar cantidad, vaciar, topes de stock.
- **`AuthContext` y `ProtectedRoute`:** carga de sesión, logout, redirección por rol.
- **`orderService.placeOrder`:** total calculado con precios de Firestore, descuento de stock y que no se escriba nada si falta stock.
- **`api/upload`:** 401 sin token, 403 para no-admin, rechazo de archivos que no son imagen o pesan de más, y el caso feliz.
- **Integración:** flujo catálogo → carrito → checkout → orden (incluye búsqueda con debounce y que el carrito sobreviva a la navegación).
- **Panel admin:** filtro de órdenes por estado, cambio de estado y detalle.

`src/test/test-utils.tsx` tiene un `render` con todos los providers (Router, Auth y Cart) para testear componentes que dependen de varios contexts.

## 🚢 Deploy

El proyecto se despliega en Vercel conectado a este repositorio de GitHub: cada push a `master` dispara un deploy. [`vercel.json`](vercel.json) reescribe todas las rutas a `index.html` (excepto `/api/*`) para que la SPA no devuelva 404 al recargar una ruta como `/admin`. Hay que cargar las variables de entorno de arriba en el dashboard de Vercel antes del primer deploy; si falta alguna de `VITE_FIREBASE_*`, la app lo avisa con un error claro en la consola.

## 🔒 Seguridad

- Las credenciales de AWS nunca llegan al navegador: solo las usa `api/upload.ts`, que además exige un token de Firebase de un usuario `admin`, acepta solo imágenes de hasta 5 MB y firma URLs que vencen a los 60 segundos.
- `firestore.rules` define el acceso por rol:
  - `users/{uid}`: cada usuario lee y crea su propio perfil; el rol arranca en `customer` y solo se promueve a `admin` a mano desde la consola de Firebase.
  - `products/{id}`: lectura pública; solo `admin` crea, edita o borra, salvo el descuento de `stock` en el checkout, que cualquier usuario autenticado puede hacer pero solo hacia abajo y sin tocar otro campo.
  - `orders/{id}`: cada cliente lee y crea solo las suyas (siempre en `pending`); solo `admin` lista todas y cambia el `status`.
- Hay validación de rol en el frontend (`ProtectedRoute`) y en el servidor (reglas de Firestore y `api/upload.ts`).

## 🤖 Bitácora de Uso de Inteligencia Artificial

Usé Claude durante todo el proyecto, en distintas sesiones según la etapa en la que estaba. Dejo los momentos que más me sirvieron o donde la pifié yo, con el prompt tal cual lo escribí.

| # | Prompt | Qué pasó | Qué hice |
|---|--------|----------|----------|
| 1 | "te voy a pasar imagenes de un proyecto integrador para que vayas viendo que hay que hacer" | Antes de escribir código le pasé las diapositivas de la consigna. Así vi todo junto lo que pedían (Auth, S3, Firestore, tests) y no me enteré de nada a mitad de camino. | Armé un plan por fases: setup, auth, catálogo, carrito, checkout y admin. |
| 2 | "valores de pruebas y despues los remplazo" | Con variables de entorno de prueba pude avanzar con la UI sin tener Firebase ni AWS listos. Después me olvidé de limpiarlo y terminé con las credenciales reales de AWS en `.env.local` con prefijo `VITE_`, o sea visibles para el navegador. | Lo dejé así un tiempo para seguir probando y me anoté separar lo público (`VITE_`) de lo que es solo de servidor antes de entregar. |
| 3 | "fase tres y al final probamos todo" | Armamos `api/upload.ts`, la función de Vercel que genera la URL prefirmada de S3, para que las claves no pasen nunca por el navegador. | Dejé el endpoint listo para conectarlo al panel de admin en la sesión siguiente. |
| 4 | "che no me está sirviendo la función que hice, en AdminDashboard el upload sigue usando el SDK de AWS directo" | La función estaba bien, pero `AdminDashboard.tsx` seguía usando `S3Client` y `getSignedUrl` directo, con las claves en variables `VITE_*`. El problema del punto 2 no estaba resuelto, solo lo había movido de lugar. Me quedó claro que no alcanza con escribir bien la pieza de seguridad, hay que revisar que se use. | Reescribí `handleSaveProduct` para pedir la URL a `/api/upload` y subir con esa. Saqué `VITE_AWS_*` y `VITE_S3_BUCKET_NAME` de `.env.local` y `vercel.json` y las pasé a `AWS_*`, sin prefijo. |
| 5 | "ese localhost ya esta ocupado pone en otro" | El puerto estaba ocupado. Fue una pavada, pero no quería depender de un puerto cualquiera. | Fijé el 3000 en `vite.config.ts` y lo dejé escrito en el README. |
| 6 | "esta en blanco la pagina" | La página quedaba en blanco por un error de build de Vite (`[MISSING_EXPORT] "User"`). Con `verbatimModuleSyntax` activado los tipos se importan con `import type`; si no, rompe el build aunque en dev parezca andar. | Separé los `import type` de los imports de valores en los archivos donde estaban mezclados. |
| 7 | "haz los extracredits" | Sumé analytics con `recharts` y paginación con `startAfter`. Con la paginación entendí la diferencia: por offset Firestore relee todo, por cursor lee solo lo nuevo. | Agregué `rating` y `reviewsCount` al tipo `Product` y métricas de ventas al dashboard admin. |
| 8 | "che, nunca escribí las reglas de firestore, ¿tan grave es dejarlo como está?" | Sin `firestore.rules`, lo único que protegía por rol era `ProtectedRoute`, que es solo interfaz. Desde la consola del navegador cualquiera podía leer y escribir `products` y `orders` sin pasar por React. Proteger una ruta y proteger los datos no son lo mismo. | Escribí `firestore.rules` por colección y por rol, con una excepción para que el cliente pueda bajar el `stock` en el checkout y nada más. Agregué `firebase.json` y `.firebaserc` para desplegarlas con `firebase deploy --only firestore:rules`. |
| 9 | "quiero que el npm run test funcione de una vez, nunca lo probé en serio" | Tenía un test del reducer del carrito, pero `package.json` no tenía script `test` y `vite.config.ts` no configuraba `jsdom`. Ese test nunca había corrido. | Agregué las dos cosas y sumé tests de `AuthContext` (mockeando Firebase Auth) y de `ProtectedRoute`. |
| 10 | "el filtro por categoría en el home anda raro cuando ya cargué varias páginas de productos" | Filtraba en memoria sobre `products`, que solo tenía la página cargada. Si la categoría no estaba en esa página parecía que no había resultados, aunque en Firestore sí hubiera. | `getProducts` ahora recibe la categoría y usa `where('category', '==', ...)` en la query. Hizo falta un índice compuesto (`category` + `createdAt`). |
| 11 | "fijate todo el proyecto integrador si esta bien todo" | Le pedí una revisión completa contra la consigna y encontró cosas que yo no había visto. `vercel.json` estaba en el `.gitignore`, así que en producción recargar `/admin` daba 404. El carrito se vaciaba al entrar a un producto porque usaba `window.location`. `api/upload.ts` le firmaba URLs a cualquiera. Faltaban los botones de cantidad en el carrito, el filtro de órdenes por estado y el detalle de cada orden. Y mis estados de orden (`shipped`, `delivered`) no eran los de la consigna. | Lo corregí todo: `vercel.json` commiteado, `<Link>` en vez de `window.location`, `api/upload.ts` ahora exige token de admin, la orden se crea en una transacción que descuenta el stock, estados `pending/processing/completed/cancelled`, y sumé tests de integración, del endpoint y del panel admin. También bajé React a 18 como pide la consigna. |
