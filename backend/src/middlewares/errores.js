// Manejo central de errores. Traduce los errores conocidos
// a codigos HTTP con un mensaje entendible.
const multer = require("multer");
const { MAX_MB } = require("./subida");

function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: "Ruta no encontrada: " + req.method + " " + req.originalUrl });
}

function manejarErrores(error, req, res, next) {
  // Errores de Multer (archivo muy grande, etc.)
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "El archivo supera los " + MAX_MB + " MB" });
    }
    return res.status(400).json({ error: "Error al subir el archivo" });
  }

  // El fileFilter de Multer lanza un Error normal
  if (error && error.message === "Solo se permiten archivos PDF") {
    return res.status(400).json({ error: error.message });
  }

  // Errores de MySQL que tienen una traduccion util para el usuario
  if (error && error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ error: "Ese registro ya existe" });
  }
  if (error && error.code === "ER_ROW_IS_REFERENCED_2") {
    return res.status(409).json({ error: "No se puede eliminar: el registro esta en uso" });
  }

  console.error("Error no controlado:", error);
  res.status(500).json({ error: "Error interno del servidor" });
}

module.exports = { rutaNoEncontrada, manejarErrores };
