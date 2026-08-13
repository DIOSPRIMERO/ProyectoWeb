// Consulta e importacion desde OpenAlex (API externa de produccion academica).
const express = require("express");
const { consultarUna, ejecutar } = require("../config/database");
const { autenticar, requierePermiso } = require("../middlewares/auth");
const openalex = require("../services/openalexService");

const router = express.Router();

router.use(autenticar, requierePermiso("externa.importar"));

// ------------------------------------------------------------
// GET /api/externa/buscar?termino=microservicios
// ------------------------------------------------------------
router.get("/buscar", async function (req, res, next) {
  try {
    const termino = String(req.query.termino || "").trim();

    if (termino.length < 3) {
      return res.status(400).json({ error: "Escriba al menos 3 caracteres" });
    }

    const cantidad = Math.min(20, Math.max(1, Number(req.query.cantidad) || 10));
    const resultados = await openalex.buscar(termino, cantidad);

    res.json({ termino: termino, total: resultados.length, datos: resultados });
  } catch (error) {
    // Si OpenAlex falla, se avisa con 502 en lugar de un error 500 generico
    console.error("Error consultando OpenAlex:", error.message);
    res.status(502).json({ error: "No fue posible consultar OpenAlex en este momento" });
  }
});

// ------------------------------------------------------------
// POST /api/externa/importar
// Convierte un resultado de OpenAlex en una produccion del sistema.
// ------------------------------------------------------------
router.post("/importar", async function (req, res, next) {
  try {
    const titulo = String(req.body.titulo || "").trim();
    const anio = Number(req.body.anio);
    const tipoId = Number(req.body.tipoId);

    if (titulo.length < 5) {
      return res.status(400).json({ error: "El titulo del registro externo no es valido" });
    }
    if (!anio) {
      return res.status(400).json({ error: "El registro externo no trae anio; registrelo a mano" });
    }
    if (!tipoId) {
      return res.status(400).json({ error: "Debe indicar el tipo de produccion" });
    }

    // No se importa dos veces el mismo DOI
    const doi = req.body.doi ? String(req.body.doi).trim() : null;
    if (doi) {
      const existente = await consultarUna("SELECT id FROM producciones WHERE doi = ?", [doi]);
      if (existente) {
        return res.status(409).json({
          error: "Ese DOI ya fue importado (produccion numero " + existente.id + ")",
        });
      }
    }

    // Lo importado entra como "revision": necesita que alguien lo valide
    const resultado = await ejecutar(
      `INSERT INTO producciones
        (titulo, resumen, palabras_clave, anio, estado, doi, tipo_id, area_id, carrera_id, usuario_id)
       VALUES (?, ?, ?, ?, 'revision', ?, ?, ?, ?, ?)`,
      [
        titulo.slice(0, 255),
        req.body.resumen || null,
        Array.isArray(req.body.palabrasClave) ? req.body.palabrasClave.join(", ") : null,
        anio,
        doi,
        tipoId,
        req.body.areaId || null,
        req.body.carreraId || null,
        req.usuario.id,
      ]
    );

    // Autores que vienen de OpenAlex
    const autores = Array.isArray(req.body.autores) ? req.body.autores : [];
    for (const nombre of autores.slice(0, 10)) {
      if (typeof nombre === "string" && nombre.trim().length >= 3) {
        await ejecutar("INSERT INTO produccion_autor (produccion_id, nombre) VALUES (?, ?)", [
          resultado.insertId,
          nombre.trim(),
        ]);
      }
    }

    res.status(201).json({ id: resultado.insertId, mensaje: "Registro importado en estado revision" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
