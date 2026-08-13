// Indicadores del dashboard, calculados con consultas reales
// sobre la base de datos (no datos simulados como en el avance 2).
const express = require("express");
const { consultar, consultarUna } = require("../config/database");
const { autenticar, requierePermiso } = require("../middlewares/auth");

const router = express.Router();

router.use(autenticar, requierePermiso("dashboard.ver"));

router.get("/", async function (req, res, next) {
  try {
    const totales = await consultarUna(`
      SELECT
        (SELECT COUNT(*) FROM producciones) AS producciones,
        (SELECT COUNT(*) FROM producciones WHERE estado = 'publicado') AS publicadas,
        (SELECT COUNT(*) FROM producciones WHERE estado = 'revision') AS en_revision,
        (SELECT COUNT(*) FROM producciones WHERE estado = 'borrador') AS borradores,
        (SELECT COUNT(*) FROM documentos) AS documentos,
        (SELECT COUNT(DISTINCT nombre) FROM produccion_autor) AS autores
    `);

    // Produccion por anio
    const porAnio = await consultar(`
      SELECT anio AS etiqueta, COUNT(*) AS total
        FROM producciones GROUP BY anio ORDER BY anio
    `);

    // Produccion por carrera
    const porCarrera = await consultar(`
      SELECT c.nombre AS etiqueta, COUNT(p.id) AS total
        FROM carreras c JOIN producciones p ON p.carrera_id = c.id
       GROUP BY c.id, c.nombre ORDER BY total DESC
    `);

    // Produccion por area de conocimiento
    const porArea = await consultar(`
      SELECT a.nombre AS etiqueta, COUNT(p.id) AS total
        FROM areas_conocimiento a JOIN producciones p ON p.area_id = a.id
       GROUP BY a.id, a.nombre ORDER BY total DESC
    `);

    // Produccion por linea de investigacion
    const porLinea = await consultar(`
      SELECT l.nombre AS etiqueta, COUNT(p.id) AS total
        FROM lineas_investigacion l JOIN producciones p ON p.linea_id = l.id
       GROUP BY l.id, l.nombre ORDER BY total DESC
    `);

    // Tecnologias mas utilizadas
    const tecnologias = await consultar(`
      SELECT t.nombre AS etiqueta, COUNT(pt.produccion_id) AS total
        FROM tecnologias t JOIN produccion_tecnologia pt ON pt.tecnologia_id = t.id
       GROUP BY t.id, t.nombre ORDER BY total DESC LIMIT 8
    `);

    // Ultimos registros, para el listado del dashboard
    const recientes = await consultar(`
      SELECT p.id, p.titulo, p.anio, p.estado
        FROM producciones p ORDER BY p.creado_en DESC LIMIT 5
    `);

    res.json({
      totales: totales,
      porAnio: porAnio,
      porCarrera: porCarrera,
      porArea: porArea,
      porLinea: porLinea,
      tecnologias: tecnologias,
      recientes: recientes,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
