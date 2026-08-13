// Carga de archivos PDF con Multer.
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Carpeta donde se guardan los PDF. Se crea si no existe.
const carpeta = path.join(__dirname, "..", "..", "subidas");
if (!fs.existsSync(carpeta)) {
  fs.mkdirSync(carpeta, { recursive: true });
}

const almacenamiento = multer.diskStorage({
  destination: function (req, archivo, cb) {
    cb(null, carpeta);
  },
  filename: function (req, archivo, cb) {
    // Nombre unico para que dos archivos con el mismo nombre no choquen.
    const unico = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unico + ".pdf");
  },
});

const MAX_MB = Number(process.env.SUBIDA_MAX_MB) || 10;

// Solo PDF y con limite de tamano, como pide la consigna.
const subirPdf = multer({
  storage: almacenamiento,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: function (req, archivo, cb) {
    const esPdf =
      archivo.mimetype === "application/pdf" &&
      path.extname(archivo.originalname).toLowerCase() === ".pdf";

    if (!esPdf) {
      return cb(new Error("Solo se permiten archivos PDF"));
    }
    cb(null, true);
  },
}).single("documento");

function rutaArchivo(nombreGuardado) {
  return path.join(carpeta, nombreGuardado);
}

// Borra el archivo del disco. No falla si ya no existe.
function borrarArchivo(nombreGuardado) {
  fs.promises.unlink(rutaArchivo(nombreGuardado)).catch(function () {});
}

module.exports = { subirPdf, rutaArchivo, borrarArchivo, MAX_MB };
