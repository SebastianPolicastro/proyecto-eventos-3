# Plataforma de Eventos e Inscripciones

API REST para gestionar eventos e inscripciones. Este proyecto corresponde a Backend II: la base arquitectónica (Pre-entrega 1), el registro seguro de usuarios (Pre-entrega 2) y la autenticación con JWT y cookies (Pre-entrega 3), organizado por capas y listo para escalar.

**Temática elegida:** plataforma de eventos e inscripciones (con control de cupos, roles y notificaciones en próximas entregas).

## Tecnologías

- Node.js (módulos ESM)
- Express
- MongoDB con Mongoose
- bcrypt (hash de contraseñas)
- jsonwebtoken (JWT)
- cookie-parser
- dotenv

## Instalación

```bash
git clone <https://github.com/SebastianPolicastro/proyecto-eventos-3>
cd <proyecto-eventos-3>
npm install
```

## Configuración de variables de entorno

Copiá el archivo de ejemplo y completá los valores:

```bash
cp .env.example .env
```

En Windows: `copy .env.example .env`.

| Variable         | Descripción                                             |
|------------------|---------------------------------------------------------|
| `PORT`           | Puerto donde corre el servidor (default 8080)           |
| `NODE_ENV`       | Entorno de ejecución (`development`, `production`)      |
| `MONGO_URL`      | URL de conexión a MongoDB (local o Atlas)               |
| `JWT_SECRET`     | Secreto con el que se firman los JWT                    |
| `JWT_EXPIRES_IN` | Duración del token (por ejemplo `1h`, `30m`, `7d`)      |

El archivo `.env` no se sube al repositorio.

## Cómo ejecutar

Hace falta tener MongoDB disponible (local o MongoDB Atlas) y las variables configuradas en el `.env`.

```bash
npm start      # producción
npm run dev    # desarrollo, con recarga automática
```

## Estructura de carpetas

```
proyecto-eventos/
├── src/
│   ├── app.js                       # configura Express (no levanta el server)
│   ├── server.js                    # conecta a MongoDB y levanta el servidor
│   ├── config/
│   │   ├── env.js                   # variables de entorno
│   │   └── db.js                    # conexión a MongoDB
│   ├── routes/
│   │   ├── health.router.js
│   │   ├── events.router.js
│   │   └── sessions.router.js
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   └── sessions.controller.js   # register, login, current, logout
│   ├── services/
│   │   ├── events.service.js
│   │   └── sessions.service.js      # validaciones, registro y login
│   ├── repositories/
│   │   ├── events.repository.js
│   │   └── users.repository.js
│   ├── dao/
│   │   ├── events.dao.js
│   │   └── users.dao.js
│   ├── models/
│   │   ├── User.js
│   │   └── Event.js
│   ├── middlewares/
│   │   └── auth.middleware.js       # lee la cookie, verifica el JWT y carga req.user
│   └── utils/
│       ├── hash.js                  # bcrypt (hash y comparación)
│       ├── jwt.js                   # firmar y verificar JWT
│       └── AppError.js              # error con código HTTP
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Flujo de una request: `routes → controllers → services → repositories → dao → models`.

## Rutas disponibles

| Método | Ruta                     | Descripción                                          | Auth |
|--------|--------------------------|------------------------------------------------------|------|
| GET    | `/api/health`            | Verifica que el servidor esté activo                 | No   |
| GET    | `/api/events`            | Lista de eventos (vacía por ahora)                   | No   |
| POST   | `/api/sessions/register` | Registro de usuarios                                 | No   |
| POST   | `/api/sessions/login`    | Login, guarda el JWT en la cookie `currentUser`      | No   |
| GET    | `/api/sessions/current`  | Devuelve el usuario autenticado                      | Sí   |
| POST   | `/api/sessions/logout`   | Cierra la sesión eliminando la cookie                | No   |

## Detalle de las rutas

### GET /api/health

Respuesta `200`:

```json
{ "status": "ok", "message": "Servidor activo" }
```

### GET /api/events

Respuesta `200` (lista vacía por ahora):

```json
{ "status": "success", "payload": [] }
```

### POST /api/sessions/register

Campos del body:

| Campo        | Obligatorio | Detalle |
|--------------|-------------|---------|
| `first_name` | Sí          | Texto no vacío |
| `last_name`  | Sí          | Texto no vacío |
| `email`      | Sí          | Formato válido. Se normaliza (sin espacios y en minúsculas) antes de guardar |
| `password`   | Sí          | Mínimo 8 caracteres. Se guarda hasheada con bcrypt |

El rol no se puede enviar desde el body: todos los usuarios registrados quedan con rol `user`. Los valores posibles del modelo son `user`, `organizer` y `admin`.

Request:

```json
{ "first_name": "Ana", "last_name": "Pérez", "email": "Ana@Mail.com ", "password": "Secreta123" }
```

Respuesta `201` (sin contraseña):

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a...",
    "first_name": "Ana",
    "last_name": "Pérez",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

Respuesta `400` (campos faltantes, email inválido o contraseña corta):

```json
{ "status": "error", "message": "Faltan campos obligatorios" }
```

Respuesta `409` (email ya registrado):

```json
{ "status": "error", "message": "El email ya está registrado" }
```

### POST /api/sessions/login

Campos del body: `email` y `password`, ambos obligatorios.

Request:

```json
{ "email": "ana@mail.com", "password": "Secreta123" }
```

Respuesta `200`. Además setea la cookie `currentUser` con el JWT (`httpOnly`, `sameSite: lax`, duración de 1 hora, y `secure` solo en producción):

```json
{ "status": "success", "message": "Login correcto" }
```

El JWT se firma con `JWT_SECRET`, vence según `JWT_EXPIRES_IN` y contiene solo `id`, `email` y `role`.

Respuesta `401` (el mensaje es el mismo si el email no existe o si la contraseña es incorrecta):

```json
{ "status": "error", "message": "Credenciales inválidas" }
```

Respuesta `400` (falta email o password):

```json
{ "status": "error", "message": "Faltan campos obligatorios" }
```

### GET /api/sessions/current

Requiere la cookie `currentUser`. El middleware `auth` verifica el JWT y guarda el payload en `req.user`.

Respuesta `200`:

```json
{ "status": "success", "payload": { "id": "665f2a...", "email": "ana@mail.com", "role": "user" } }
```

Respuesta `401` (sin cookie, o token inválido o expirado):

```json
{ "status": "error", "message": "No autenticado" }
```

### POST /api/sessions/logout

Elimina la cookie `currentUser`.

Respuesta `200`:

```json
{ "status": "success", "message": "Sesión cerrada" }
```

## Cómo probar

1. Tener MongoDB disponible y las variables configuradas en el `.env`.
2. Levantar el servidor con `npm start` (debe mostrar `Conectado a MongoDB`).
3. Usar Postman o Thunder Client, que guardan la cookie automáticamente entre requests.
4. Casos a verificar: registro exitoso, login, `/current` con 200, logout y `/current` con 401; login con email inexistente; login con contraseña incorrecta; `/current` sin cookie; `/current` con un token manipulado o vencido.