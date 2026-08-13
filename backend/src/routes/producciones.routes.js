// Rutas de produccion academica: consulta, registro, edicion y borrado.
const express = require("express");
const { consultar, consultarUna, ejecutar } = require("../config/database");
const { autenticar, requierePermiso } = require("../middlewares/auth");
const { puedeEditar } = require("../permisos");

const router = express.Router();

// Todas las rutas de este archivo exigen sesion.
router.use(autenticar);

// Campos por los que se puede ordenar.
// Es una lista fija: el nombre de columna no se puede parametrizar en
// un ORDER BY, asi que si se aceptara el valor del usuario tal cual
// se abriria la puerta a inyeccion SQL.
const ORDENES = {
  anio: "p.anio",
  titulo: "p.titulo",
  creado_en: "p.creado_en",
};

// ------------------------------------------------------------
// Arma el WHERE de la consulta a partir de los filtros recibidos.
// Devuelve el texto y los parametros, siempre con marcadores ?
// para que las consultas queden parametrizadas.
// ------------------------------------------------------------
function armarFiltros(query) {
  const condiciones = [];
  const parametros = [];

  // Busqueda de texto sobre titulo, resumen y palabras clave.
  // La consigna permite busqueda parcial como minimo, asi que se usa LIKE.
  if (query.busqueda) {
    condiciones.push("(p.titulo LIKE ? OR p.resumen LIKE ? OR p.palabras_clave LIKE ?)");
    const patron = "%" + query.busqueda + "%";
    parametros.push(patron, patron, patron);
  }

  // Busqueda por autor: los autores estan en otra tabla, asi que se
  // consulta con EXISTS para no duplicar filas.
  if (query.autor) {
    condiciones.push(
      "EXISTS (SELECT 1 FROM produccion_autor a WHERE a.produccion_id = p.id AND a.nombre LIKE ?)"
    );
    parametros.push("%" + query.autor + "%");
  }

  if (query.palabraClave) {
    condiciones.push("p.palabras_clave LIKE ?");
    parametros.push("%" + query.palabraClave + "%");
  }

  // Busqueda por tecnologia (tabla N a N)
  if (query.tecnologia) {
    condiciones.push(
      "EXISTS (SELECT 1 FROM produccion_tecnologia t WHERE t.produccion_id = p.id AND t.tecnologia_id = ?)"
    );
    parametros.push(Number(query.tecnologia));
  }

  // Filtros por catalogo
  const filtros = [
    ["tipo", "p.tipo_id"],
    ["categoria", "p.categoria_id"],
    ["area", "p.area_id"],
    ["carrera", "p.carrera_id"],
    ["linea", "p.linea_id"],
    ["tipoInvestigacion", "p.tipo_investigacion_id"],
    ["anio", "p.anio"],
  ];

  for (const [clave, columna] of filtros) {
    if (query[clave]) {
      condiciones.push(columna + " = ?");
      parametros.push(Number(query[clave]));
    }
  }

  if (query.estado) {
    condiciones.push("p.estado = ?");
    parametros.push(query.estado);
  }

  const where = condiciones.length > 0 ? "WHERE " + condiciones.join(" AND ") : "";
  return { where: where, parametros: parametros };
}

// Consulta base con los nombres de los catalogos ya resueltos.
const SELECT_BASE = `
  SELECT p.id, p.titulo, p.resumen, p.palabras_clave, p.anio, p.estado, p.doi, p.creado_en,
         p.tipo_id, tp.nombre AS tipo,
         p.categoria_id, c.nombre AS categoria,
         p.area_id, ar.nombre AS area,
         p.tipo_investigacion_id, ti.nombre AS tipo_investigacion,
         p.carrera_id, ca.nombre AS carrera,
         p.linea_id, li.nombre AS linea,
         p.usuario_id, us.nombre AS registrado_por,
         d.id AS documento_id, d.nombre_original, d.tamano_bytes
    FROM producciones p
    JOIN tipos_produccion tp ON tp.id = p.tipo_id
    LEFT JOIN categorias c ON c.id = p.categoria_id
    LEFT JOIN areas_conocimiento ar ON ar.id = p.area_id
    LEFT JOIN tipos_investigacion ti ON ti.id = p.tipo_investigacion_id
    LEFT JOIN carreras ca ON ca.id = p.carrera_id
    LEFT JOIN lineas_investigacion li ON li.id = p.linea_id
    LEFT JOIN usuarios us ON us.id = p.usuario_id
    LEFT JOIN documentos d ON d.produccion_id = p.id
`;

// Agrega autores y tecnologias a una lista de producciones.
// Se hace en dos consultas para toda la lista, no una por registro.
async function agregarAutoresYTecnologias(producciones) {
  if (producciones.length === 0) return;

  const ids = producciones.map(function (p) { return p.id; });
  const marcadores = ids.map(function () { return "?"; }).join(",");

  const autores = await consultar(
    "SELECT produccion_id, nombre FROM produccion_autor WHERE produccion_id IN (" + marcadores + ") ORDER BY id",
    ids
  );

  const tecnologias = await consultar(
    `SELECT pt.produccion_id, t.id, t.nombre
       FROM produccion_tecnologia pt
       JOIN tecnologias t ON t.id = pt.tecnologia_id
      WHERE pt.produccion_id IN (` + marcadores + `) ORDER BY t.nombre`,
    ids
  );

  for (const p of producciones) {
    p.autores = autores
      .filter(function (a) { return a.produccion_id === p.id; })
      .map(function (a) { return a.nombre; });

    p.tecnologias = tecnologias
      .filter(function (t) { return t.produccion_id === p.id; })
      .map(function (t) { return { id: t.id, nombre: t.nombre }; });
  }
}

// ------------------------------------------------------------
// GET /api/producciones
// Busqueda, filtros, ordenamiento y paginacion, todo en el servidor.
// ------------------------------------------------------------
router.get("/", requierePermiso("produccion.consultar"), async function (req, res, next) {
  try {
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const porPagina = Math.min(50, Math.max(1, Number(req.query.porPagina) || 10));
    const desplazamiento = (pagina - 1) * porPagina;

    const orden = ORDENES[req.query.ordenarPor] || "p.creado_en";
    const direccion = req.query.direccion === "asc" ? "ASC" : "DESC";

    const { where, parametros } = armarFiltros(req.query);

    // Total de coincidencias, para calcular las paginas
    const fila = await consultarUna(
      "SELECT COUNT(*) AS total FROM producciones p " + where,
      parametros
    );
    const total = fila ? fila.total : 0;

    const datos = await consultar(
      SELECT_BASE + " " + where + " ORDER BY " + orden + " " + direccion + ", p.id DESC LIMIT ? OFFSET ?",
      parametros.concat([porPagina, desplazamiento])
    );

    await agregarAutoresYTecnologias(datos);

    res.json({
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
// GET /api/producciones/anios  -> para llenar el filtro de anio
// ------------------------------------------------------------
router.get("/anios", requierePermiso("produccion.consultar"), async function (req, res, next) {
  try {
    const filas = await consultar("SELECT DISTINCT anio FROM producciones ORDER BY anio DESC");
    res.json({ datos: filas.map(function (f) { return f.anio; }) });
  } catch (error) {
    next(error);
  }
});

// ------------------------------------------------------------
// GET /api/producciones/:id  -> ficha de detalle
// ------------------------------------------------------------
router.get("/:id", requierePermiso("produccion.consultar"), async function (req, res, next) {
  try {
    const filas = await consultar(SELECT_BASE + " WHERE p.id = ?", [Number(req.params.id)]);

    if (filas.length === 0) {
      return res.status(404).json({ error: "Produccion no encontrada" });
    }

    await agregarAutoresYTecnologias(filas);
    res.json(filas[0]);
  } catch (error) {
    next(error);
  }
});

// ------------------------------------------------------------
// Valida los datos que llegan del formulario.
// Devuelve un arreglo de mensajes; vacio significa que todo esta bien.
// ------------------------------------------------------------
function validarProduccion(cuerpo) {
  const errores = [];

  if (!cuerpo.titulo || String(cuerpo.titulo).trim().length < 5) {
    errores.push("El titulo debe tener al menos 5 caracteres");
  }

  const anio = Number(cuerpo.anio);
  const anioMaximo = new Date().getFullYear() + 1;
  if (!anio || anio < 1950 || anio > anioMaximo) {
    errores.push("El anio debe estar entre 1950 y " + anioMaximo);
  }

  if (!cuerpo.tipoId) {
    errores.push("Debe seleccionar el tipo de produccion");
  }

  const autores = Array.isArray(cuerpo.autores) ? cuerpo.autores : [];
  const validos = autores.filter(function (a) {
    return typeof a === "string" && a.trim().length >= 3;
  });
  if (validos.length === 0) {
    errores.push("Debe registrar al menos un autor");
  }

  if (cuerpo.estado && !["borrador", "revision", "publicado"].includes(cuerpo.estado)) {
    errores.push("El estado no es valido");
  }

  return errores;
}

// Guarda los autores de una produccion (borra los anteriores).
async function guardarAutores(produccionId, autores) {
  await ejecutar("DELETE FROM produccion_autor WHERE produccion_id = ?", [produccionId]);

  const limpios = (autores || []).filter(function (a) {
    return typeof a === "string" && a.trim().length >= 3;
  });

  for (const nombre of limpios) {
    await ejecutar("INSERT INTO produccion_autor (produccion_id, nombre) VALUES (?, ?)", [
      produccionId,
      nombre.trim(),
    ]);
  }
}

// Guarda las tecnologias de una produccion (borra las anteriores).
async function guardarTecnologias(produccionId, ids) {
  await ejecutar("DELETE FROM produccion_tecnologia WHERE produccion_id = ?", [produccionId]);

  const unicos = [...new Set((ids || []).map(Number).filter(Boolean))];
  for (const id of unicos) {
    await ejecutar(
      "INSERT INTO produccion_tecnologia (produccion_id, tecnologia_id) VALUES (?, ?)",
      [produccionId, id]
    );
  }
}

// Convierte "" o undefined en null, para los campos opcionales.
function oNull(valor) {
  if (valor === undefined || valor === null || valor === "") return null;
  return valor;
}

// ------------------------------------------------------------
// POST /api/producciones
// ------------------------------------------------------------
router.post("/", requierePermiso("produccion.crear"), async function (req, res, next) {
  try {
    const errores = validarProduccion(req.body);
    if (errores.length > 0) {
      return res.status(400).json({ error: errores[0], errores: errores });
    }

    const resultado = await ejecutar(
      `INSERT INTO producciones
        (titulo, resumen, palabras_clave, anio, estado, doi,
         tipo_id, categoria_id, area_id, tipo_investigacion_id, carrera_id, linea_id, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(req.body.titulo).trim(),
        oNull(req.body.resumen),
        oNull(req.body.palabrasClave),
        Number(req.body.anio),
        req.body.estado || "borrador",
        oNull(req.body.doi),
        Number(req.body.tipoId),
        oNull(req.body.categoriaId),
        oNull(req.body.areaId),
        oNull(req.body.tipoInvestigacionId),
        oNull(req.body.carreraId),
        oNull(req.body.lineaId),
        req.usuario.id,
      ]
    );

    await guardarAutores(resultado.insertId, req.body.autores);
    await guardarTecnologias(resultado.insertId, req.body.tecnologiasIds);

    const filas = await consultar(SELECT_BASE + " WHERE p.id = ?", [resultado.insertId]);
    await agregarAutoresYTecnologias(filas);

    res.status(201).json(filas[0]);
  } catch (error) {
    next(error);
  }
});

// ------------------------------------------------------------
// PUT /api/producciones/:id
// Ademas del permiso, se revisa quien registro la produccion:
// quien solo tiene "editar.propia" no puede tocar la de otro.
// ------------------------------------------------------------
router.put("/:id", async function (req, res, next) {
  try {
    const id = Number(req.params.id);

    const actual = await consultarUna("SELECT usuario_id FROM producciones WHERE id = ?", [id]);
    if (!actual) {
      return res.status(404).json({ error: "Produccion no encontrada" });
    }

    if (!puedeEditar(req.usuario, actual.usuario_id)) {
      return res.status(403).json({ error: "Solo puede editar las producciones que registro" });
    }

    const errores = validarProduccion(req.body);
    if (errores.length > 0) {
      return res.status(400).json({ error: errores[0], errores: errores });
    }

    await ejecutar(
      `UPDATE producciones SET
         titulo = ?, resumen = ?, palabras_clave = ?, anio = ?, estado = ?, doi = ?,
         tipo_id = ?, categoria_id = ?, area_id = ?, tipo_investigacion_id = ?,
         carrera_id = ?, linea_id = ?
       WHERE id = ?`,
      [
        String(req.body.titulo).trim(),
        oNull(req.body.resumen),
        oNull(req.body.palabrasClave),
        Number(req.body.anio),
        req.body.estado || "borrador",
        oNull(req.body.doi),
        Number(req.body.tipoId),
        oNull(req.body.categoriaId),
        oNull(req.body.areaId),
        oNull(req.body.tipoInvestigacionId),
        oNull(req.body.carreraId),
        oNull(req.body.lineaId),
        id,
      ]
    );

    await guardarAutores(id, req.body.autores);
    await guardarTecnologias(id, req.body.tecnologiasIds);

    const filas = await consultar(SELECT_BASE + " WHERE p.id = ?", [id]);
    await agregarAutoresYTecnologias(filas);

    res.json(filas[0]);
  } catch (error) {
    next(error);
  }
});

// ------------------------------------------------------------
// DELETE /api/producciones/:id
// Las tablas hijas tienen ON DELETE CASCADE.
// ------------------------------------------------------------
router.delete("/:id", requierePermiso("produccion.eliminar"), async function (req, res, next) {
  try {
    const resultado = await ejecutar("DELETE FROM producciones WHERE id = ?", [
      Number(req.params.id),
    ]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Produccion no encontrada" });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
