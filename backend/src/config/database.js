// Pool de conexiones a MySQL.
// Se usa un pool y no conexiones sueltas porque el API atiende
// varias peticiones a la vez.
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "produccion_academica",
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true, // necesario para ejecutar schema.sql completo
  dateStrings: true,
});

// Devuelve directamente el arreglo de filas, para no repetir
// la desestructuracion [filas] en cada consulta.
async function consultar(sql, parametros = []) {
  const [filas] = await pool.query(sql, parametros);
  return filas;
}

// Igual que consultar, pero devuelve la primera fila o null.
async function consultarUna(sql, parametros = []) {
  const filas = await consultar(sql, parametros);
  return filas.length > 0 ? filas[0] : null;
}

// Para INSERT, UPDATE y DELETE. Devuelve insertId y affectedRows.
async function ejecutar(sql, parametros = []) {
  const [resultado] = await pool.query(sql, parametros);
  return resultado;
}

// Comprueba que la base responda antes de que el servidor escuche.
async function probarConexion() {
  const conexion = await pool.getConnection();
  await conexion.ping();
  conexion.release();
}

module.exports = { pool, consultar, consultarUna, ejecutar, probarConexion };
