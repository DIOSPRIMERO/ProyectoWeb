// Rutas de gestion documental: subir, descargar, previsualizar y borrar el PDF.
const express = require("express");
const { consultarUna, ejecutar } = require("../config/database");
const { autenticar, requierePermiso } = require("../middlewares/auth");
const { subirPdf, rutaArchivo, borrarArchivo } = require("../middlewares/subida");
const { puedeEditar } = require("../permisos");

const router = express.Router();

router.use(autenticar);

// ------------------------------------------------------------
// POST /api/documentos/:produccionId  -> subir el PDF
// ------------------------------------------------------------
router.post(
  "/:produccionId",
  requierePermiso("documento.subir"),
  subirPdf,
  async function (req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Debe adjuntar un archivo en el campo 'documento'" });
      }

      const produccionId = Number(req.params.produccionId);

      const produccion = await consultarUna(
        "SELECT usuario_id FROM producciones WHERE id = ?",
        [produccionId]
      );
      if (!produccion) {
        borrarArchivo(req.file.filename);
        return res.status(404).json({ error: "Produccion no encontrada" });
      }

      // Solo el dueno (o quien puede editar cualquiera) adjunta el documento
      if (!puedeEditar(req.usuario, produccion.usuario_id)) {
        borrarArchivo(req.file.filename);
        return res.status(403).json({ error: "Solo puede subir documentos a sus producciones" });
      }

      // La relacion es 1 a 1: si ya habia un documento se reemplaza
      const anterior = await consultarUna(
        "SELECT nombre_guardado FROM documentos WHERE produccion_id = ?",
        [produccionId]
      );
      if (anterior) {
        await ejecutar("DELETE FROM documentos WHERE produccion_id = ?", [produccionId]);
        borrarArchivo(anterior.nombre_guardado);
      }

      const resultado = await ejecutar(
        `INSERT INTO documentos (produccion_id, nombre_original, nombre_guardado, tamano_bytes)
         VALUES (?, ?, ?, ?)`,
        [produccionId, req.file.originalname, req.file.filename, req.file.size]
      );

      res.status(201).json({
        id: resultado.insertId,
        nombre_original: req.file.originalname,
        tamano_bytes: req.file.size,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Busca el documento de una produccion o responde 404.
async function buscarDocumento(produccionId, res) {
  const documento = await consultarUna(
    "SELECT * FROM documentos WHERE produccion_id = ?",
    [produccionId]
  );

  if (!documento) {
    res.status(404).json({ error: "Esta produccion no tiene documento adjunto" });
    return null;
  }
  return documento;
}

// ------------------------------------------------------------
// GET /api/documentos/:produccionId  -> descargar
// ------------------------------------------------------------
router.get(
  "/:produccionId",
  requierePermiso("documento.descargar"),
  async function (req, res, next) {
    try {
      const documento = await buscarDocumento(Number(req.params.produccionId), res);
      if (!documento) return;

      res.download(rutaArchivo(documento.nombre_guardado), documento.nombre_original);
    } catch (error) {
      next(error);
    }
  }
);

// ------------------------------------------------------------
// GET /api/documentos/:produccionId/ver  -> previsualizar en el navegador
// ------------------------------------------------------------
router.get(
  "/:produccionId/ver",
  requierePermiso("documento.descargar"),
  async function (req, res, next) {
    try {
      const documento = await buscarDocumento(Number(req.params.produccionId), res);
      if (!documento) return;

      // inline le indica al navegador que lo muestre en lugar de descargarlo
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=documento.pdf");
      res.sendFile(rutaArchivo(documento.nombre_guardado));
    } catch (error) {
      next(error);
    }
  }
);

// ------------------------------------------------------------
// DELETE /api/documentos/:produccionId
// ------------------------------------------------------------
router.delete("/:produccionId", async function (req, res, next) {
  try {
    const produccionId = Number(req.params.produccionId);

    const produccion = await consultarUna(
      "SELECT usuario_id FROM producciones WHERE id = ?",
      [produccionId]
    );
    if (!produccion) {
      return res.status(404).json({ error: "Produccion no encontrada" });
    }
    if (!puedeEditar(req.usuario, produccion.usuario_id)) {
      return res.status(403).json({ error: "No puede borrar este documento" });
    }

    const documento = await buscarDocumento(produccionId, res);
    if (!documento) return;

    await ejecutar("DELETE FROM documentos WHERE id = ?", [documento.id]);
    borrarArchivo(documento.nombre_guardado);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
