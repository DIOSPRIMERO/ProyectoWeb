// Mantenimiento de usuarios y asignacion de roles.
// Todo el archivo exige el permiso usuarios.gestionar (solo admin).
const express = require("express");
const bcrypt = require("bcryptjs");
const { consultar, consultarUna, ejecutar } = require("../config/database");
const { autenticar, requierePermiso } = require("../middlewares/auth");

const router = express.Router();

router.use(autenticar, requierePermiso("usuarios.gestionar"));

const ROLES = ["admin", "coordinador", "docente", "estudiante"];

// GET /api/usuarios
router.get("/", async function (req, res, next) {
  try {
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const porPagina = 10;
    const desplazamiento = (pagina - 1) * porPagina;

    const condiciones = [];
    const parametros = [];

    if (req.query.busqueda) {
      condiciones.push("(nombre LIKE ? OR correo LIKE ?)");
      parametros.push("%" + req.query.busqueda + "%", "%" + req.query.busqueda + "%");
    }
    if (req.query.rol) {
      condiciones.push("rol = ?");
      parametros.push(req.query.rol);
    }

    const where = condiciones.length > 0 ? "WHERE " + condiciones.join(" AND ") : "";

    const fila = await consultarUna("SELECT COUNT(*) AS total FROM usuarios " + where, parametros);
    const total = fila ? fila.total : 0;

    const datos = await consultar(
      "SELECT id, nombre, correo, rol, activo, creado_en FROM usuarios " +
        where + " ORDER BY nombre LIMIT ? OFFSET ?",
      parametros.concat([porPagina, desplazamiento])
    );

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

// POST /api/usuarios
router.post("/", async function (req, res, next) {
  try {
    const nombre = String(req.body.nombre || "").trim();
    const correo = String(req.body.correo || "").trim().toLowerCase();
    const contrasena = String(req.body.contrasena || "");
    const rol = req.body.rol;

    if (nombre.length < 3) {
      return res.status(400).json({ error: "El nombre debe tener al menos 3 caracteres" });
    }
    if (!correo.includes("@")) {
      return res.status(400).json({ error: "El correo no es valido" });
    }
    if (contrasena.length < 8) {
      return res.status(400).json({ error: "La contrasena debe tener al menos 8 caracteres" });
    }
    if (!ROLES.includes(rol)) {
      return res.status(400).json({ error: "El rol no es valido" });
    }

    const existente = await consultarUna("SELECT id FROM usuarios WHERE correo = ?", [correo]);
    if (existente) {
      return res.status(409).json({ error: "Ese correo ya esta registrado" });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const resultado = await ejecutar(
      "INSERT INTO usuarios (nombre, correo, contrasena_hash, rol) VALUES (?, ?, ?, ?)",
      [nombre, correo, hash, rol]
    );

    res.status(201).json({ id: resultado.insertId, nombre: nombre, correo: correo, rol: rol, activo: 1 });
  } catch (error) {
    next(error);
  }
});

// PUT /api/usuarios/:id
router.put("/:id", async function (req, res, next) {
  try {
    const id = Number(req.params.id);

    const usuario = await consultarUna("SELECT id FROM usuarios WHERE id = ?", [id]);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const nombre = String(req.body.nombre || "").trim();
    const correo = String(req.body.correo || "").trim().toLowerCase();
    const rol = req.body.rol;

    if (nombre.length < 3) {
      return res.status(400).json({ error: "El nombre debe tener al menos 3 caracteres" });
    }
    if (!correo.includes("@")) {
      return res.status(400).json({ error: "El correo no es valido" });
    }
    if (!ROLES.includes(rol)) {
      return res.status(400).json({ error: "El rol no es valido" });
    }

    const activo = req.body.activo === false || req.body.activo === 0 ? 0 : 1;

    await ejecutar(
      "UPDATE usuarios SET nombre = ?, correo = ?, rol = ?, activo = ? WHERE id = ?",
      [nombre, correo, rol, activo, id]
    );

    // La contrasena solo se cambia si viene en la peticion
    if (req.body.contrasena) {
      if (String(req.body.contrasena).length < 8) {
        return res.status(400).json({ error: "La contrasena debe tener al menos 8 caracteres" });
      }
      const hash = await bcrypt.hash(String(req.body.contrasena), 10);
      await ejecutar("UPDATE usuarios SET contrasena_hash = ? WHERE id = ?", [hash, id]);
    }

    res.json({ id: id, nombre: nombre, correo: correo, rol: rol, activo: activo });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/usuarios/:id
// Es una baja logica: el usuario registro producciones y borrarlo
// dejaria esos registros sin dueno.
router.delete("/:id", async function (req, res, next) {
  try {
    const id = Number(req.params.id);

    if (id === req.usuario.id) {
      return res.status(400).json({ error: "No puede desactivar su propia cuenta" });
    }

    const resultado = await ejecutar("UPDATE usuarios SET activo = 0 WHERE id = ?", [id]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ mensaje: "Usuario desactivado" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
