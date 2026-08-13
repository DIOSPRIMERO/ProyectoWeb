

## 1. Modelo de datos (MER)

MySQL 8. El script completo está en `backend/src/db/schema.sql`.

```
                    usuarios
                    ├── id, nombre, correo, contrasena_hash
                    ├── rol (admin | coordinador | docente | estudiante)
                    └── activo
                         │
                         │ registra
                         ▼
  tipos_produccion ──▶ producciones ◀── codigos_verificacion (2FA)
  categorias ────────▶  │  │  │              (usuario_id)
  areas_conocimiento ─▶  │  │  │
  tipos_investigacion ▶  │  │  │
  carreras ──────────▶   │  │  │
  lineas_investigacion ▶ │  │  │
                         │  │  └──▶ documentos          (1 a 1)
                         │  └─────▶ produccion_autor    (1 a N)
                         └────────▶ produccion_tecnologia (N a N) ──▶ tecnologias
```

### Las 13 tablas

| Tabla | Para qué |
|---|---|
| `usuarios` | Cuentas del sistema, con su rol |
| `codigos_verificacion` | Códigos de 6 dígitos del inicio de sesión en dos pasos |
| `tipos_produccion` | Catálogo: tesis, artículo, ponencia... |
| `categorias` | Catálogo: pregrado, posgrado... |
| `areas_conocimiento` | Catálogo de áreas |
| `tecnologias` | Catálogo de tecnologías |
| `tipos_investigacion` | Catálogo: exploratoria, aplicada... |
| `carreras` | Catálogo de carreras |
| `lineas_investigacion` | Catálogo de líneas |
| `producciones` | Tabla central |
| `produccion_autor` | Autores de cada producción |
| `produccion_tecnologia` | Tecnologías de cada producción |
| `documentos` | El PDF adjunto |

### Por qué está diseñado así

**Los autores van en su propia tabla.** La consigna pide buscar por autor. Si los
autores estuvieran en una sola columna de texto (`"Karla Solano, Marco Jiménez"`),
buscar obligaría a comparar dentro de ese texto y no se podría indexar bien.
Con `produccion_autor` la búsqueda usa un índice sobre `nombre`.

**Las tecnologías van en una tabla de relación.** Una producción usa varias
tecnologías y una tecnología aparece en varias producciones: es una relación de
muchos a muchos, y eso se resuelve con una tabla intermedia.

**`producciones.usuario_id` guarda quién registró cada fila.** Sin ese dato no se
podría aplicar la regla "editar solo la producción propia" del RBAC.

**`documentos.produccion_id` es `UNIQUE`.** Cada producción tiene un solo PDF
vigente. Además de ser la regla del negocio, esto permite unir la tabla en el
listado sin que se dupliquen las filas.

**El borrado se comporta distinto según la tabla:**

- `produccion_autor`, `produccion_tecnologia` y `documentos` usan `ON DELETE CASCADE`: no tienen sentido sin su producción.
- Los catálogos usan `ON DELETE SET NULL`: borrar un área no debe borrar las producciones.
- `tipo_id` es obligatorio, así que MySQL impide borrar un tipo que esté en uso. El API responde `409` y explica que el registro está ocupado.
- Los usuarios **no se borran**, se marcan `activo = 0`. Son dueños de producciones y borrarlos dejaría esos registros sin responsable.

**El estado es un `ENUM`.** Los tres estados (`borrador`, `revision`,
`publicado`) son parte del flujo del sistema, no algo que el usuario administre,
así que se validan en el motor y no en una tabla de catálogo.

## 2. Control de acceso basado en roles (RBAC)

La consigna aclara que no basta con guardar el rol: cada rol debe tener permisos
diferenciados, aplicados en el backend y en el frontend.

### Matriz de permisos

| Permiso | Admin | Coordinador | Docente | Estudiante |
|---|:---:|:---:|:---:|:---:|
| `usuarios.gestionar` | Sí | — | — | — |
| `catalogos.gestionar` | Sí | Sí | — | — |
| `produccion.consultar` | Sí | Sí | Sí | Sí |
| `produccion.crear` | Sí | Sí | Sí | Sí |
| `produccion.editar.propia` | Sí | Sí | Sí | Sí |
| `produccion.editar.cualquiera` | Sí | Sí | — | — |
| `produccion.eliminar` | Sí | Sí | — | — |
| `documento.subir` | Sí | Sí | Sí | Sí |
| `documento.descargar` | Sí | Sí | Sí | Sí |
| `dashboard.ver` | Sí | Sí | Sí | — |
| `externa.importar` | Sí | Sí | Sí | — |

Esta matriz reproduce la de la consigna. Los tres permisos que la consigna no
listaba en su tabla se justifican así:

- **`documento.subir` y `documento.descargar`** se dan a los cuatro roles, porque cualquiera debe poder adjuntar el PDF de su propia producción y consultar los documentos.
- **`externa.importar`** no se da al estudiante: importar agrega registros al repositorio de la universidad a partir de fuentes externas, y eso es una tarea de revisión académica. Lo importado además entra en estado `revision`.

### Dónde se aplica

**En el backend** (`backend/src/permisos.js` y `backend/src/middlewares/auth.js`).
Cada ruta declara el permiso que necesita:

```js
router.delete("/:id", requierePermiso("produccion.eliminar"), ...)
```

El token JWT solo lleva el `id` y el `rol`. Los permisos se resuelven al momento
de atender la petición, y el usuario se relee de la base para que una cuenta
desactivada no siga entrando con un token viejo.

**La regla de propiedad** es aparte, porque el permiso solo no alcanza: hay que
saber de quién es el registro. La función `puedeEditar()` lo resuelve:

```js
if (tienePermiso(usuario.rol, "produccion.editar.cualquiera")) return true;
return tienePermiso(usuario.rol, "produccion.editar.propia") && usuario.id === duenoId;
```

**En el frontend** (`frontend/src/permisos.js`) se usan los mismos permisos para
ocultar menús y botones.

> Ocultar un botón **no** protege nada: cualquiera podría llamar al API
> directamente. La decisión de verdad la toma siempre el backend; el frontend
> solo evita mostrar acciones que van a fallar.

La pantalla **Usuarios → Matriz de permisos** muestra esta tabla leyéndola del
backend, así que refleja lo que el servidor realmente aplica.

### Comprobado con pruebas

| Caso | Resultado esperado |
|---|:---:|
| Estudiante consulta producciones | `200` |
| Estudiante entra al dashboard | `403` |
| Estudiante elimina una producción | `403` |
| Docente edita producción ajena | `403` |
| Docente edita su propia producción | `200` |
| Docente administra catálogos | `403` |
| Coordinador administra catálogos | `200` |
| Coordinador entra a usuarios | `403` |
| Petición sin token | `401` |
| Petición con token inválido | `401` |

## 3. Consulta con volumen de datos

La consigna pide que la consulta se piense para volumen. Se resolvió así:

**Paginación del lado del servidor.** El API recibe `pagina` y `porPagina`, y usa
`LIMIT` y `OFFSET`. Nunca se envían todos los registros al navegador. Se hace una
segunda consulta con `COUNT(*)` para saber el total y calcular las páginas.

**Búsqueda de texto.** La consigna permite *"full-text o, como mínimo, búsqueda
parcial sobre título, resumen y palabras clave"*. Se usó la búsqueda parcial con
`LIKE`, que es la opción mínima aceptada y la más simple de mantener.

**Ordenamiento.** Por año, título o fecha de registro. El nombre de la columna
no se puede poner con un `?` en un `ORDER BY`, así que se valida contra una lista
fija (`ORDENES` en `producciones.routes.js`). Si viniera directo del usuario,
sería una puerta de entrada a inyección SQL.

**Filtros combinados.** Todos los filtros se acumulan en un mismo `WHERE`, así
que buscar texto y filtrar por año y área es una sola consulta a la base.

**Autores y tecnologías sin consultas de más.** Se cargan con dos consultas para
toda la página de resultados, no una por cada producción.

Todas las consultas usan marcadores `?` con parámetros, nunca texto pegado.

## 4. APIs externas

**OpenAlex** (`backend/src/services/openalexService.js`). Catálogo público de
publicaciones científicas; no pide clave. Se consulta desde el backend y la
respuesta se normaliza a la estructura del proyecto, así el frontend no depende
del formato de OpenAlex. El detalle más incómodo es que OpenAlex entrega el
resumen como *índice invertido* (`{palabra: [posiciones]}`), que hay que rearmar
para volverlo texto legible.

**Resend** (`backend/src/services/correoService.js`). Envía el código de
verificación del inicio de sesión. Se autentica con una clave privada que vive
solo en el backend. Si la clave no está configurada, el código se imprime en la
consola y el sistema sigue funcionando.

## 5. Despliegue

El proyecto corre completo en local con Docker, que es lo necesario para
demostrarlo.

Si se quisiera publicar, según el laboratorio del curso serían tres piezas
separadas: el frontend como sitio estático (Vercel), el backend en Render, y la
base de datos en un servicio administrado. Render ofrece PostgreSQL gratis pero
no MySQL, así que MySQL habría que ponerlo en otro proveedor (Railway, Aiven o
Clever Cloud).

En ese caso habría que cambiar en el backend: `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD` y `JWT_SECRETO` (uno distinto al de desarrollo), y en el frontend
apuntar las llamadas al dominio del backend en lugar del proxy de Vite.

Un detalle importante: en los planes gratuitos el disco se borra en cada
redespliegue, así que los PDF subidos no sobrevivirían. Para producción real
habría que usar un servicio de almacenamiento externo, como menciona la consigna.
