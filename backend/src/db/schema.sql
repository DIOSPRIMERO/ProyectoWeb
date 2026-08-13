-- ============================================================
-- Plataforma de Produccion Academica
-- Motor: MySQL 8
-- Script idempotente: se puede ejecutar varias veces sin error.
-- ============================================================

-- ------------------------------------------------------------
-- Usuarios
-- El rol se guarda como ENUM. Los permisos de cada rol estan
-- en src/permisos.js, no en la base de datos.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(120) NOT NULL,
  correo           VARCHAR(160) NOT NULL UNIQUE,
  contrasena_hash  VARCHAR(120) NOT NULL,
  rol              ENUM('admin', 'coordinador', 'docente', 'estudiante') NOT NULL DEFAULT 'estudiante',
  activo           TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Codigos de verificacion en dos pasos (2FA)
-- Se envian por correo con Resend y caducan a los 10 minutos.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS codigos_verificacion (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT          NOT NULL,
  codigo      VARCHAR(6)   NOT NULL,
  expira_en   DATETIME     NOT NULL,
  intentos    INT          NOT NULL DEFAULT 0,
  usado       TINYINT(1)   NOT NULL DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Catalogos (los 7 mantenimientos que pide la consigna)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_produccion (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categorias (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS areas_conocimiento (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tecnologias (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tipos_investigacion (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS carreras (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS lineas_investigacion (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- Produccion academica (tabla central)
-- usuario_id guarda quien registro el registro. Se necesita
-- para la regla "editar solo la produccion propia" del RBAC.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS producciones (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  titulo                VARCHAR(255) NOT NULL,
  resumen               TEXT         NULL,
  palabras_clave        VARCHAR(400) NULL,
  anio                  INT          NOT NULL,
  estado                ENUM('borrador', 'revision', 'publicado') NOT NULL DEFAULT 'borrador',
  doi                   VARCHAR(120) NULL,
  tipo_id               INT          NOT NULL,
  categoria_id          INT          NULL,
  area_id               INT          NULL,
  tipo_investigacion_id INT          NULL,
  carrera_id            INT          NULL,
  linea_id              INT          NULL,
  usuario_id            INT          NOT NULL,
  creado_en             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tipo_id)               REFERENCES tipos_produccion(id),
  FOREIGN KEY (categoria_id)          REFERENCES categorias(id)           ON DELETE SET NULL,
  FOREIGN KEY (area_id)               REFERENCES areas_conocimiento(id)   ON DELETE SET NULL,
  FOREIGN KEY (tipo_investigacion_id) REFERENCES tipos_investigacion(id)  ON DELETE SET NULL,
  FOREIGN KEY (carrera_id)            REFERENCES carreras(id)             ON DELETE SET NULL,
  FOREIGN KEY (linea_id)              REFERENCES lineas_investigacion(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id)            REFERENCES usuarios(id),
  INDEX idx_anio (anio),
  INDEX idx_titulo (titulo)
);

-- ------------------------------------------------------------
-- Autores de cada produccion (1 a N)
-- Van en tabla aparte porque la consigna pide buscar por autor.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produccion_autor (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  produccion_id INT          NOT NULL,
  nombre        VARCHAR(160) NOT NULL,
  FOREIGN KEY (produccion_id) REFERENCES producciones(id) ON DELETE CASCADE,
  INDEX idx_autor_nombre (nombre)
);

-- ------------------------------------------------------------
-- Tecnologias usadas en cada produccion (N a N)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produccion_tecnologia (
  produccion_id INT NOT NULL,
  tecnologia_id INT NOT NULL,
  PRIMARY KEY (produccion_id, tecnologia_id),
  FOREIGN KEY (produccion_id) REFERENCES producciones(id) ON DELETE CASCADE,
  FOREIGN KEY (tecnologia_id) REFERENCES tecnologias(id)  ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Documento PDF asociado (1 a 1)
-- produccion_id es UNIQUE: cada produccion tiene un solo PDF.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  produccion_id     INT          NOT NULL UNIQUE,
  nombre_original   VARCHAR(255) NOT NULL,
  nombre_guardado   VARCHAR(255) NOT NULL,
  tamano_bytes      INT          NOT NULL,
  creado_en         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produccion_id) REFERENCES producciones(id) ON DELETE CASCADE
);
