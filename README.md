# Plataforma de Producción Académica

Proyecto final — Programación Web Avanzada (SOFT-12)
Universidad CENFOTEC · Docente: Álvaro Cordero Peña

**Autor:** _<!--Steven Mendez -->

Aplicación web para registrar, consultar y administrar la producción académica
de la universidad: tesis, investigaciones y artículos.

## Tecnologías

| Capa | Se usó |

| Frontend | React 18, Vite, Bootstrap 5, JavaScript |
| Backend | Node.js, Express, JavaScript (CommonJS) |
| Base de datos | MySQL 8 (en Docker) |
| Autenticación | JWT + verificación en dos pasos por correo |
| Pruebas | Vitest + Supertest |
| APIs externas | OpenAlex (producción académica) y Resend (correo) |
| CI | GitHub Actions |

## Cómo levantar el proyecto

Necesita **Docker Desktop** y **Node.js 20 o superior** (`node -v`).

### 1. Levantar MySQL con Docker

Docker sirve para correr MySQL sin instalarlo en la Mac. Es el mismo enfoque del
laboratorio del curso, solo que con MySQL en lugar de SQL Server:

```bash
docker run --name mysql-produccion \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=produccion_academica \
  -p 3306:3306 \
  -d mysql:8.0
```

Qué hace cada línea:

| Parte | Para qué |
|---|---|
| `--name mysql-produccion` | Le da un nombre fijo al contenedor, para poder reiniciarlo después |
| `MYSQL_ROOT_PASSWORD` | La contraseña del usuario `root` (debe coincidir con el `.env`) |
| `MYSQL_DATABASE` | Crea la base de datos vacía al arrancar |
| `-p 3306:3306` | Publica el puerto para que Node pueda conectarse |
| `-d` | Corre en segundo plano y devuelve la terminal |

La imagen `mysql:8.0` funciona igual en Mac con chip M1/M2/M3 y en Mac Intel,
así que no hace falta `--platform`.

Espere unos 30 segundos la primera vez y compruebe que arrancó:

```bash
docker ps
```

**En las sesiones siguientes no se repite `docker run`**, basta con:

```bash
docker start mysql-produccion
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:seed     # crea las tablas y carga datos de prueba
npm run dev         # queda escuchando en el puerto 4000
```

Debe leerse:

```
Conectado a MySQL: produccion_academica
API ejecutandose en http://localhost:4000/api
```

En el `.env`, cambie `JWT_SECRETO` por un valor propio:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Frontend

En **otra terminal**:

```bash
cd frontend
npm install
npm run dev         # http://localhost:5173
```

### 4. Entrar

Los cuatro usuarios usan **la misma contraseña**: `Cenfotec2026!`

| Rol | Correo |
|---|---|
| Administrador | `admin@ucenfotec.ac.cr` |
| Coordinador | `coordinador@ucenfotec.ac.cr` |
| Docente | `docente@ucenfotec.ac.cr` |
| Estudiante | `estudiante@ucenfotec.ac.cr` |

En la pantalla de inicio, al pulsar una de las cuentas de la lista se llena el
formulario automáticamente, así no hay que escribir nada.

El inicio de sesión pide un **código de 6 dígitos**. Si no configuró Resend, el
código aparece en la terminal donde corre `npm run dev` del backend:

```
=================================================
 RESEND_API_KEY no configurada.
 Codigo de verificacion para admin@ucenfotec.ac.cr: 974598
=================================================
```

> Para ver el control de acceso funcionando, entre como **estudiante**: no
> aparece el menú de dashboard, ni mantenimientos, ni los botones de eliminar.

## Configurar Resend (opcional)

El sistema funciona sin esto. Si quiere que el código llegue por correo de verdad:

1. Cree una cuenta gratuita en <https://resend.com>
2. En el panel, genere una **API Key**
3. Complete estas dos líneas en `backend/.env`:
   ```
   RESEND_API_KEY=re_su_clave_aqui
   CORREO_PRUEBAS=sucorreo@ucenfotec.ac.cr
   ```
4. Reinicie el backend

### Por qué existe `CORREO_PRUEBAS`

La cuenta gratuita de Resend, mientras se use el remitente de prueba
`onboarding@resend.dev`, **solo entrega correos a la dirección con la que se creó
la cuenta**. Cualquier otro destinatario es rechazado.

Como el sistema tiene cuatro usuarios con correos distintos, eso impediría probar
el inicio de sesión con los otros tres roles.

`CORREO_PRUEBAS` resuelve eso: cuando está configurada, **todos** los códigos se
envían a esa única bandeja, sin importar con qué cuenta se inició sesión. El
asunto del correo indica a qué cuenta corresponde cada código:

```
Asunto: Codigo de verificacion (coordinador@ucenfotec.ac.cr)
```

Así se puede entrar con los cuatro roles usando un solo correo real.

> En un sistema real esta variable se deja **vacía** y cada usuario recibe su
> propio correo. Es una ayuda para el entorno de pruebas, y está comentada como
> tal en `src/services/correoService.js`.

La clave de Resend vive **únicamente** en el backend, dentro de
`src/services/correoService.js`. El frontend nunca la conoce.

## Qué hace el sistema

**Producción académica.** Registrar, modificar, consultar y eliminar, con
clasificación por tipo, categoría, área, tipo de investigación, carrera y línea
de investigación. Varios autores y varias tecnologías por registro.

**Consulta.** Búsqueda por título, resumen, palabras clave, autor y tecnología.
Filtros por tipo, categoría, área, carrera, línea, año y estado, todos
combinables. Ordenamiento y paginación resueltos en el servidor.

**Documentos.** Carga del PDF de cada producción, con validación de tipo y
tamaño (10 MB), descarga y previsualización en la ficha de detalle.

**Control de acceso.** Cuatro roles con permisos distintos, aplicados en el
backend y en el frontend. Ver [docs/DOCUMENTACION.md](docs/DOCUMENTACION.md).

**Dashboard.** Indicadores por año, carrera, área, línea de investigación y
tecnologías más usadas, calculados con consultas reales a MySQL.

**Mantenimientos.** Los siete catálogos del sistema.

**API externa.** Búsqueda en OpenAlex e importación de publicaciones al
repositorio. Lo importado entra en estado "En revisión".

## Pruebas

```bash
cd backend  && npm test     # 55 pruebas
cd frontend && npm test     # 12 pruebas
```

El backend necesita MySQL corriendo y los datos cargados (`npm run db:seed`).

Linter:

```bash
npm run lint    # en cada carpeta
```

## Estructura

```
backend/
  src/
    server.js              punto de entrada
    app.js                 configuracion de Express
    permisos.js            matriz de permisos por rol (RBAC)
    config/database.js     pool de conexiones a MySQL
    db/schema.sql          las 13 tablas
    db/seed.js             datos de prueba
    middlewares/           auth, subida de archivos, errores
    routes/                un archivo por modulo
    services/              Resend y OpenAlex
  tests/

frontend/
  src/
    main.jsx               punto de entrada
    App.jsx                rutas
    SesionContexto.jsx     sesion y permisos
    permisos.js            los mismos permisos, para mostrar u ocultar
    api/api.js             todas las llamadas al backend
    components/
    pages/
  tests/
```

## Notas

- El modelo de datos y la justificación del RBAC están en [docs/DOCUMENTACION.md](docs/DOCUMENTACION.md)
- Cómo subir esto al repositorio: [INSTRUCCIONES.md](INSTRUCCIONES.md)
- Los archivos `.env` no se suben al repositorio; solo los `.env.example`
