// ============================================================
// Control de acceso basado en roles (RBAC)
//
// La consigna aclara que no basta con guardar el rol: cada rol
// debe tener permisos diferenciados, aplicados en el backend
// (endpoints) y en el frontend (vistas y acciones).
//
// Aqui esta la matriz. El backend la usa para proteger las rutas
// y el frontend recibe la lista de permisos al iniciar sesion.
// ============================================================

const PERMISOS_POR_ROL = {
  admin: [
    "usuarios.gestionar",
    "catalogos.gestionar",
    "produccion.consultar",
    "produccion.crear",
    "produccion.editar.propia",
    "produccion.editar.cualquiera",
    "produccion.eliminar",
    "documento.subir",
    "documento.descargar",
    "dashboard.ver",
    "externa.importar",
  ],
  coordinador: [
    "catalogos.gestionar",
    "produccion.consultar",
    "produccion.crear",
    "produccion.editar.propia",
    "produccion.editar.cualquiera",
    "produccion.eliminar",
    "documento.subir",
    "documento.descargar",
    "dashboard.ver",
    "externa.importar",
  ],
  docente: [
    "produccion.consultar",
    "produccion.crear",
    "produccion.editar.propia",
    "documento.subir",
    "documento.descargar",
    "dashboard.ver",
    "externa.importar",
  ],
  estudiante: [
    "produccion.consultar",
    "produccion.crear",
    "produccion.editar.propia",
    "documento.subir",
    "documento.descargar",
  ],
};

// Devuelve los permisos de un rol. Si el rol no existe, no da ninguno.
function permisosDe(rol) {
  return PERMISOS_POR_ROL[rol] || [];
}

// Verifica si un rol tiene un permiso concreto.
function tienePermiso(rol, permiso) {
  return permisosDe(rol).includes(permiso);
}

// Decide si un usuario puede modificar una produccion.
// Quien tiene "editar.cualquiera" puede con todas; quien solo tiene
// "editar.propia" unicamente con las que registro el mismo.
function puedeEditar(usuario, duenoId) {
  if (!usuario) return false;
  if (tienePermiso(usuario.rol, "produccion.editar.cualquiera")) return true;
  return tienePermiso(usuario.rol, "produccion.editar.propia") && usuario.id === duenoId;
}

module.exports = { PERMISOS_POR_ROL, permisosDe, tienePermiso, puedeEditar };
