// Mantenimientos de los 7 catalogos que pide la consigna.
//
// Los siete tienen la misma forma (id, nombre), asi que se usa una
// lista de tablas permitidas y un solo conjunto de rutas. La lista
// blanca es importante: el nombre de la tabla se pega al SQL y no
// puede venir directo del usuario.
const express = require("express");
const { consultar, consultarUna, ejecutar } = require("../config/database");
const { autenticar, requierePermiso } = require("../middlewares/auth");

const router = express.Router();

router.use(autenticar);

// Nombre en la URL -> nombre real de la tabla
const TABLAS = {
  "tipos-produccion": "tipos_produccion",
  categorias: "categorias",
  areas: "areas_conocimiento",
  tecnologias: "tecnologias",
  "tipos-investigacion": "tipos_investigacion",
  carreras: "carreras",
  lineas: "lineas_investigacion",
};

// Etiquetas para mostrar en la interfaz
const ETIQUETAS = {
  "tipos-produccion": "Tipos de produccion",
  categorias: "Categorias",
  areas: "Areas de conocimiento",
  tecnologias: "Tecnologias",
  "tipos-investigacion": "Tipos de investigacion",
  carreras: "Carreras",
  lineas: "Lineas de investigacion",
};

// ------------------------------------------------------------
// GET /api/catalogos  -> todos los catalogos de una sola vez.
// El frontend lo usa para llenar los select de los formularios.
// ------------------------------------------------------------
router.get("/", async function (req, res, next) {
  try {
    const resultado = {};

    for (const nombreUrl in TABLAS) {
      resultado[nombreUrl] = await consultar(
        "SELECT id, nombre FROM " + TABLAS[nombreUrl] + " ORDER BY nombre"
      );
    }

    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

// ------------------------------------------------------------
// GET /api/catalogos/lista  -> nombres y etiquetas, para el menu
// ------------------------------------------------------------
router.get("/lista", function (req, res) {
  const lista = Object.keys(TABLAS).map(function (nombreUrl) {
    return { nombre: nombreUrl, etiqueta: ETIQUETAS[nombreUrl] };
  });
  res.json({ datos: lista });
});

// ------------------------------------------------------------
// GET /api/catalogos/:nombre  -> un catalogo, con busqueda y paginacion
// ------------------------------------------------------------
router.get("/:nombre", requierePermiso("produccion.consultar"), async function (req, res, next) {
  try {
    const tabla = TABLAS[req.params.nombre];
    if (!tabla) {
      return res.status(404).json({ error: "Ese catalogo no existe" });
    }

    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const porPagina = 10;
    const desplazamiento = (pagina - 1) * porPagina;

    let where = "";
    const parametros = [];
    if (req.query.busqueda) {
      where = "WHERE nombre LIKE ?";
      parametros.push("%" + req.query.busqueda + "%");
    }

    const fila = await consultarUna(
      "SELECT COUNT(*) AS total FROM " + tabla + " " + where,
      parametros
    );
    const total = fila ? fila.total : 0;

    const datos = await consultar(
      "SELECT id, nombre FROM " + tabla + " " + where + " ORDER BY nombre LIMIT ? OFFSET ?",
      parametros.concat([porPagina, desplazamiento])
    );

    res.json({
      etiqueta: ETIQUETAS[req.params.nombre],
      datos: datos,
      paginacion: {
        pagina: pagina,
        porPagina: porPagina,
        total: total,
        totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ------------------------------------------------------------
// POST /api/catalogos/:nombre
// ------------------------------------------------------------
router.post("/:nombre", requierePermiso("catalogos.gestionar"), async function (req, res, next) {
  try {
    const tabla = TABLAS[req.params.nombre];
    if (!tabla) {
      return res.status(404).json({ error: "Ese catalogo no existe" });
    }

    const nombre = String(req.body.nombre || "").trim();
    if (nombre.length < 2) {
      return res.status(400).json({ error: "El nombre debe tener al menos 2 caracteres" });
    }

    const resultado = await ejecutar("INSERT INTO " + tabla + " (nombre) VALUES (?)", [nombre]);
    res.status(201).json({ id: resultado.insertId, nombre: nombre });
  } catch (error) {
    next(error);
  }
});

// ------------------------------------------------------------
// PUT /api/catalogos/:nombre/:id
// ------------------------------------------------------------
router.put("/:nombre/:id", requierePermiso("catalogos.gestionar"), async function (req, res, next) {
  try {
    const tabla = TABLAS[req.params.nombre];
    if (!tabla) {
      return res.status(404).json({ error: "Ese catalogo no existe" });
    }

    const nombre = String(req.body.nombre || "").trim();
    if (nombre.length < 2) {
      return res.status(400).json({ error: "El nombre debe tener al menos 2 caracteres" });
    }

    const resultado = await ejecutar("UPDATE " + tabla + " SET nombre = ? WHERE id = ?", [
      nombre,
      Number(req.params.id),
    ]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    res.json({ id: Number(req.params.id), nombre: nombre });
  } catch (error) {
    next(error);
  }
});

// ------------------------------------------------------------
// DELETE /api/catalogos/:nombre/:id
// Si el registro esta usado por una produccion, MySQL lo impide y
// el manejador de errores responde 409.
// ------------------------------------------------------------
router.delete("/:nombre/:id", requierePermiso("catalogos.gestionar"), async function (req, res, next) {
  try {
    const tabla = TABLAS[req.params.nombre];
    if (!tabla) {
      return res.status(404).json({ error: "Ese catalogo no existe" });
    }

    const resultado = await ejecutar("DELETE FROM " + tabla + " WHERE id = ?", [
      Number(req.params.id),
    ]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
