// Crea las tablas y carga datos de prueba.
// Se ejecuta con: npm run db:seed
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool, consultar, ejecutar } = require("../config/database");

// Contrasena de los cuatro usuarios de prueba.
// Es la misma en todos para no tener que recordar cuatro claves
// distintas al revisar el sistema con cada rol.
const CLAVE_PRUEBAS = process.env.CLAVE_PRUEBAS || "Cenfotec2026!";

// Un usuario por rol. El correo debe ser distinto en cada uno porque
// la columna es UNIQUE: es lo que identifica a quien inicia sesion.
// Para recibir todos los codigos en una sola bandeja se usa la
// variable CORREO_PRUEBAS del archivo .env.
const USUARIOS = [
  { nombre: "Adriana Vargas (Admin)", correo: "admin@ucenfotec.ac.cr", rol: "admin" },
  { nombre: "Luis Mora (Coordinador)", correo: "coordinador@ucenfotec.ac.cr", rol: "coordinador" },
  { nombre: "Marco Jimenez (Docente)", correo: "docente@ucenfotec.ac.cr", rol: "docente" },
  { nombre: "Diego Rojas (Estudiante)", correo: "estudiante@ucenfotec.ac.cr", rol: "estudiante" },
];

const CATALOGOS = {
  tipos_produccion: ["Tesis", "Articulo cientifico", "Proyecto de investigacion", "Trabajo final de graduacion", "Ponencia"],
  categorias: ["Pregrado", "Posgrado", "Investigacion aplicada", "Divulgacion"],
  areas_conocimiento: ["Ingenieria del software", "Ciberseguridad", "Inteligencia artificial", "Ciencia de datos", "Redes"],
  tecnologias: ["Java", "Python", "React", "MySQL", "Docker", "Node.js", "TensorFlow", "Kubernetes"],
  tipos_investigacion: ["Exploratoria", "Descriptiva", "Correlacional", "Aplicada"],
  carreras: ["Ingenieria del Software", "Tecnico en Desarrollo de Software", "Maestria en Ciberseguridad", "Maestria en Datos"],
  lineas_investigacion: ["Desarrollo de software seguro", "Aprendizaje automatico", "Arquitectura de software", "Computacion en la nube", "Analitica de datos"],
};

// Piezas para armar titulos variados
const TEMAS = [
  "Microservicios", "Deteccion de intrusos", "Analitica predictiva", "Vision por computadora",
  "Seguridad en APIs REST", "Patrones de diseno", "Pruebas automatizadas",
  "Sistemas de recomendacion", "Procesamiento de lenguaje natural", "Arquitecturas serverless",
];

const DOMINIOS = [
  "banca digital", "salud publica", "educacion superior", "logistica", "gobierno digital",
];

const AUTORES = [
  "Karla Solano", "Marco Jimenez", "Adriana Vargas", "Diego Rojas",
  "Sofia Ramirez", "Andres Castro", "Laura Chinchilla",
];

// Ejecuta el script schema.sql
async function crearTablas() {
  const ruta = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(ruta, "utf8");
  await pool.query(sql);
}

async function cargarUsuarios() {
  for (const usuario of USUARIOS) {
    const hash = await bcrypt.hash(CLAVE_PRUEBAS, 10);

    // ON DUPLICATE KEY hace que el script se pueda repetir sin error
    await ejecutar(
      `INSERT INTO usuarios (nombre, correo, contrasena_hash, rol)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), contrasena_hash = VALUES(contrasena_hash), rol = VALUES(rol)`,
      [usuario.nombre, usuario.correo, hash, usuario.rol]
    );
  }
}

async function cargarCatalogos() {
  for (const tabla in CATALOGOS) {
    for (const nombre of CATALOGOS[tabla]) {
      await ejecutar(
        "INSERT INTO " + tabla + " (nombre) VALUES (?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)",
        [nombre]
      );
    }
  }
}

// Genera producciones para que la busqueda y la paginacion tengan
// datos suficientes con que probarse.
async function cargarProducciones(cantidad) {
  // Se borran las anteriores para no acumular en cada ejecucion
  await ejecutar("DELETE FROM producciones");

  const usuarios = await consultar("SELECT id FROM usuarios ORDER BY id");
  const estados = ["publicado", "publicado", "publicado", "revision", "borrador"];

  for (let i = 0; i < cantidad; i++) {
    // Los dos indices avanzan a ritmos distintos para que no se repita
    // la misma combinacion de tema y dominio.
    const tema = TEMAS[i % TEMAS.length];
    const vuelta = Math.floor(i / TEMAS.length);
    const dominio = DOMINIOS[(i + vuelta) % DOMINIOS.length];
    const titulo = tema + " aplicado a " + dominio;

    const resultado = await ejecutar(
      `INSERT INTO producciones
        (titulo, resumen, palabras_clave, anio, estado, doi,
         tipo_id, categoria_id, area_id, tipo_investigacion_id, carrera_id, linea_id, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo,
        "Estudio sobre " + tema.toLowerCase() + " y su aplicacion en " + dominio + ". " +
          "Se documenta el diseno, la implementacion y los resultados obtenidos.",
        tema.toLowerCase() + ", " + dominio,
        2021 + (i % 5),
        estados[i % estados.length],
        i % 4 === 0 ? "10.1000/cenfotec." + (1000 + i) : null,
        (i % 5) + 1,
        (i % 4) + 1,
        (i % 5) + 1,
        (i % 4) + 1,
        (i % 4) + 1,
        (i % 5) + 1,
        usuarios[i % usuarios.length].id,
      ]
    );

    // Dos autores por produccion
    await ejecutar("INSERT INTO produccion_autor (produccion_id, nombre) VALUES (?, ?), (?, ?)", [
      resultado.insertId,
      AUTORES[i % AUTORES.length],
      resultado.insertId,
      AUTORES[(i + 3) % AUTORES.length],
    ]);

    // Dos tecnologias por produccion
    const tec1 = (i % 8) + 1;
    const tec2 = ((i + 3) % 8) + 1;
    await ejecutar(
      "INSERT IGNORE INTO produccion_tecnologia (produccion_id, tecnologia_id) VALUES (?, ?), (?, ?)",
      [resultado.insertId, tec1, resultado.insertId, tec2]
    );
  }
}

async function principal() {
  console.log("Creando tablas...");
  await crearTablas();

  console.log("Cargando usuarios...");
  await cargarUsuarios();

  console.log("Cargando catalogos...");
  await cargarCatalogos();

  console.log("Cargando producciones de prueba...");
  await cargarProducciones(30);

  console.log("");
  console.log("Listo. Los cuatro usuarios usan la misma contrasena: " + CLAVE_PRUEBAS);
  console.log("");
  for (const u of USUARIOS) {
    console.log("  " + u.rol.padEnd(12) + u.correo);
  }

  if (process.env.CORREO_PRUEBAS) {
    console.log("");
    console.log("Los codigos de verificacion se enviaran a: " + process.env.CORREO_PRUEBAS);
  }
}

principal()
  .catch(function (error) {
    console.error("Error al cargar los datos:", error.message);
    process.exitCode = 1;
  })
  .finally(function () {
    pool.end();
  });
