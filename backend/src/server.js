// Punto de entrada del backend.
// dotenv va en la primera linea: database.js lee process.env cuando
// se carga, asi que si dotenv se ejecutara despues las variables
// llegarian como undefined.
require("dotenv").config();

const app = require("./app");
const { probarConexion } = require("./config/database");

const puerto = process.env.PORT || 4000;

async function iniciarServidor() {
  try {
    // El servidor no escucha hasta comprobar que MySQL responde.
    await probarConexion();
    console.log("Conectado a MySQL: " + (process.env.DB_DATABASE || "produccion_academica"));

    app.listen(puerto, function () {
      console.log("API ejecutandose en http://localhost:" + puerto + "/api");
    });
  } catch (error) {
    console.error("No se pudo conectar a MySQL: " + error.message);
    console.error("Revise que el contenedor de Docker este corriendo (docker ps)");
    process.exit(1);
  }
}

iniciarServidor();
