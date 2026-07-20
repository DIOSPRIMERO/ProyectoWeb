//roles disponibles en el sistema
export const ROLES = [
  { id: "administrador", nombre: "Administrador" },
  { id: "docente", nombre: "Docente" },
  { id: "investigador", nombre: "Investigador" },
  { id: "lector", nombre: "Lector" }
];

//que acciones puede hacer cada rol
export const PERMISOS = {
  administrador: ["ver", "crear", "editar", "eliminar", "mantenimientos"],
  docente: ["ver", "crear", "editar"],
  investigador: ["ver", "crear"],
  lector: ["ver"]
};

//revisa si un rol tiene permiso para una accion
export const puede = (rol, accion) => {
  const permisos = PERMISOS[rol] || [];
  return permisos.includes(accion);
};

//devuelve el nombre visible de un rol
export const nombreRol = (id) => {
  const encontrado = ROLES.find((r) => r.id === id);
  if (encontrado) {
    return encontrado.nombre;
  }
  return id;
};
