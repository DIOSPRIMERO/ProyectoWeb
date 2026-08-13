// Rutas de autenticacion, con verificacion en dos pasos (2FA).
//
// Ciclo del login:
//   1. POST /login          -> valida correo y contrasena
//   2. el backend genera un codigo de 6 digitos y lo envia por correo
//   3. POST /verificar      -> valida el codigo y entrega el token
const express = require("express");
const bcrypt = require("bcryptjs");
const { consultarUna, ejecutar } = require("../config/database");
const { firmarToken, autenticar } = require("../middlewares/auth");
const { permisosDe, PERMISOS_POR_ROL } = require("../permisos");
const { enviarCodigoVerificacion } = require("../services/correoService");

const router = express.Router();

// Minutos que dura el codigo antes de vencer
const MINUTOS_VIGENCIA = 10;
// Intentos permitidos antes de invalidar el codigo
const MAX_INTENTOS = 3;

// Genera un codigo de 6 digitos como texto (con ceros a la izquierda).
function generarCodigo() {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
}

// Datos del usuario que se devuelven al frontend (sin la contrasena).
function datosPublicos(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    permisos: permisosDe(usuario.rol),
  };
}

// ------------------------------------------------------------
// POST /api/auth/login  -> paso 1 del 2FA
// ------------------------------------------------------------
router.post("/login", async function (req, res, next) {
  try {
    const correo = String(req.body.correo || "").trim().toLowerCase();
    const contrasena = String(req.body.contrasena || "");

    if (!correo || !contrasena) {
      return res.status(400).json({ error: "El correo y la contrasena son obligatorios" });
    }

    const usuario = await consultarUna(
      "SELECT id, nombre, correo, contrasena_hash, rol, activo FROM usuarios WHERE correo = ?",
      [correo]
    );

    // Se responde el mismo mensaje exista o no el correo, para no
    // revelar cuales cuentas estan registradas.
    if (!usuario) {
      return res.status(401).json({ error: "Correo o contrasena incorrectos" });
    }
    if (usuario.activo !== 1) {
      return res.status(401).json({ error: "La cuenta esta desactivada" });
    }

    const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!coincide) {
      return res.status(401).json({ error: "Correo o contrasena incorrectos" });
    }

    // Se invalidan los codigos anteriores de este usuario
    await ejecutar("UPDATE codigos_verificacion SET usado = 1 WHERE usuario_id = ?", [usuario.id]);

    const codigo = generarCodigo();
    await ejecutar(
      "INSERT INTO codigos_verificacion (usuario_id, codigo, expira_en) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))",
      [usuario.id, codigo, MINUTOS_VIGENCIA]
    );

    await enviarCodigoVerificacion(usuario.correo, codigo);

    // Todavia NO se entrega el token: falta verificar el codigo.
    res.json({
      requiereVerificacion: true,
      correo: usuario.correo,
      mensaje: "Se envio un codigo de verificacion a su correo",
    });
  } catch (error) {
    next(error);
  }
});

// ------------------------------------------------------------
// POST /api/auth/verificar  -> paso 2 del 2FA
// ------------------------------------------------------------
router.post("/verificar", async function (req, res, next) {
  try {
    const correo = String(req.body.correo || "").trim().toLowerCase();
    const codigo = String(req.body.codigo || "").trim();

    if (!correo || !codigo) {
      return res.status(400).json({ error: "El correo y el codigo son obligatorios" });
    }

    const usuario = await consultarUna(
      "SELECT id, nombre, correo, rol FROM usuarios WHERE correo = ?",
      [correo]
    );
    if (!usuario) {
      return res.status(401).json({ error: "Codigo invalido" });
    }

    const registro = await consultarUna(
      `SELECT id, codigo, intentos, expira_en
         FROM codigos_verificacion
        WHERE usuario_id = ? AND usado = 0
        ORDER BY id DESC LIMIT 1`,
      [usuario.id]
    );

    if (!registro) {
      return res.status(401).json({ error: "No hay un codigo pendiente. Inicie sesion de nuevo" });
    }

    // Vigencia: se compara en la base para no depender del reloj del servidor
    const vencido = await consultarUna(
      "SELECT (expira_en < NOW()) AS vencido FROM codigos_verificacion WHERE id = ?",
      [registro.id]
    );
    if (vencido && Number(vencido.vencido) === 1) {
      await ejecutar("UPDATE codigos_verificacion SET usado = 1 WHERE id = ?", [registro.id]);
      return res.status(401).json({ error: "El codigo vencio. Inicie sesion de nuevo" });
    }

    if (registro.intentos >= MAX_INTENTOS) {
      await ejecutar("UPDATE codigos_verificacion SET usado = 1 WHERE id = ?", [registro.id]);
      return res.status(401).json({ error: "Demasiados intentos. Inicie sesion de nuevo" });
    }

    if (registro.codigo !== codigo) {
      await ejecutar("UPDATE codigos_verificacion SET intentos = intentos + 1 WHERE id = ?", [registro.id]);
      const restantes = MAX_INTENTOS - (registro.intentos + 1);
      return res.status(401).json({
        error: "Codigo incorrecto. Intentos restantes: " + Math.max(restantes, 0),
      });
    }

    // Codigo correcto: se marca como usado y se entrega el token
    await ejecutar("UPDATE codigos_verificacion SET usado = 1 WHERE id = ?", [registro.id]);

    res.json({ token: firmarToken(usuario), usuario: datosPublicos(usuario) });
  } catch (error) {
    next(error);
  }
});

// ------------------------------------------------------------
// POST /api/auth/registro
// Las cuentas nuevas siempre se crean con el rol de menor privilegio.
// ------------------------------------------------------------
router.post("/registro", async function (req, res, next) {
  try {
    const nombre = String(req.body.nombre || "").trim();
    const correo = String(req.body.correo || "").trim().toLowerCase();
    const contrasena = String(req.body.contrasena || "");

    if (nombre.length < 3) {
      return res.status(400).json({ error: "El nombre debe tener al menos 3 caracteres" });
    }
    if (!correo.includes("@")) {
      return res.status(400).json({ error: "El correo no es valido" });
    }
    if (contrasena.length < 8) {
      return res.status(400).json({ error: "La contrasena debe tener al menos 8 caracteres" });
    }

    const existente = await consultarUna("SELECT id FROM usuarios WHERE correo = ?", [correo]);
    if (existente) {
      return res.status(409).json({ error: "Ese correo ya esta registrado" });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const resultado = await ejecutar(
      "INSERT INTO usuarios (nombre, correo, contrasena_hash, rol) VALUES (?, ?, ?, 'estudiante')",
      [nombre, correo, hash]
    );

    const usuario = { id: resultado.insertId, nombre: nombre, correo: correo, rol: "estudiante" };
    res.status(201).json({ token: firmarToken(usuario), usuario: datosPublicos(usuario) });
  } catch (error) {
    next(error);
  }
});

// ------------------------------------------------------------
// GET /api/auth/perfil
// El frontend lo usa para saber quien esta conectado y con que permisos.
// ------------------------------------------------------------
router.get("/perfil", autenticar, function (req, res) {
  res.json({ usuario: req.usuario });
});

// ------------------------------------------------------------
// GET /api/auth/matriz-permisos
// Devuelve la matriz completa, para documentar el RBAC en la interfaz.
// ------------------------------------------------------------
router.get("/matriz-permisos", autenticar, function (req, res) {
  res.json({ matriz: PERMISOS_POR_ROL });
});

module.exports = router;
