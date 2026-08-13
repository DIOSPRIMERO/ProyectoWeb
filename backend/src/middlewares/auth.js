// Middlewares de autenticacion y autorizacion.
const jwt = require("jsonwebtoken");
const { consultarUna } = require("../config/database");
const { permisosDe, tienePermiso } = require("../permisos");

// Crea el token que el frontend guarda tras iniciar sesion.
function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.JWT_SECRETO,
    { expiresIn: "8h" }
  );
}

// Verifica el token y deja el usuario en req.usuario.
// El token se acepta por cabecera Authorization o por la query string,
// porque un <iframe> o un enlace de descarga no puede enviar cabeceras.
async function autenticar(req, res, next) {
  try {
    const cabecera = req.headers.authorization || "";
    let token = cabecera.startsWith("Bearer ") ? cabecera.slice(7) : "";
    if (!token && req.query.token) token = req.query.token;

    if (!token) {
      return res.status(401).json({ error: "Falta el token de acceso" });
    }

    let datos;
    try {
      datos = jwt.verify(token, process.env.JWT_SECRETO);
    } catch {
      return res.status(401).json({ error: "Token invalido o expirado" });
    }

    // Se relee el usuario de la base para que un usuario desactivado
    // no siga entrando con un token viejo.
    const usuario = await consultarUna(
      "SELECT id, nombre, correo, rol, activo FROM usuarios WHERE id = ?",
      [datos.id]
    );

    if (!usuario || usuario.activo !== 1) {
      return res.status(401).json({ error: "Usuario inactivo o inexistente" });
    }

    req.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      permisos: permisosDe(usuario.rol),
    };

    next();
  } catch (error) {
    next(error);
  }
}

// Protege una ruta exigiendo un permiso. Se usa despues de autenticar.
function requierePermiso(permiso) {
  return function (req, res, next) {
    if (!req.usuario) {
      return res.status(401).json({ error: "No autenticado" });
    }
    if (!tienePermiso(req.usuario.rol, permiso)) {
      return res.status(403).json({ error: "No tiene permiso para esta accion" });
    }
    next();
  };
}

module.exports = { firmarToken, autenticar, requierePermiso };
