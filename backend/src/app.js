// Configuracion de Express. El orden de los middleware importa:
// cors y express.json van ANTES de las rutas, y el manejador de
// errores va SIEMPRE al final.
const express = require("express");
const cors = require("cors");

const { rutaNoEncontrada, manejarErrores } = require("./middlewares/errores");

const app = express();

// 1. CORS: permite que el frontend (otro puerto) llame al API
app.use(cors());

// 2. Lectura del cuerpo JSON. Sin esto req.body llega vacio.
app.use(express.json());

// 3. Endpoint de salud, sin autenticacion.
app.get("/api/salud", function (req, res) {
  res.json({ estado: "ok", fecha: new Date().toISOString() });
});

// 4. Rutas del sistema
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/producciones", require("./routes/producciones.routes"));
app.use("/api/documentos", require("./routes/documentos.routes"));
app.use("/api/catalogos", require("./routes/catalogos.routes"));
app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/externa", require("./routes/externa.routes"));

// 5. Ruta inexistente
app.use(rutaNoEncontrada);

// 6. Manejador de errores: siempre el ultimo
app.use(manejarErrores);

module.exports = app;
