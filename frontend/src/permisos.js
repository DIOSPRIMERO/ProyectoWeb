// Los mismos permisos que usa el backend.
// Aqui sirven para mostrar u ocultar menus y botones.
//
// Importante: esconder un boton no protege nada. La decision de
// verdad la toma el backend; esto solo mejora la experiencia.

export const NOMBRE_ROL = {
  admin: "Administrador",
  coordinador: "Coordinador",
  docente: "Docente / Investigador",
  estudiante: "Estudiante",
};

// Revisa si el usuario tiene un permiso.
export function puede(usuario, permiso) {
  if (!usuario || !usuario.permisos) return false;
  return usuario.permisos.includes(permiso);
}

// Misma regla que el backend: quien tiene "editar.cualquiera" puede
// con todas; quien solo tiene "editar.propia" con las suyas.
export function puedeEditar(usuario, duenoId) {
  if (!usuario) return false;
  if (puede(usuario, "produccion.editar.cualquiera")) return true;
  return puede(usuario, "produccion.editar.propia") && usuario.id === duenoId;
}
