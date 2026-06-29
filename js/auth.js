
const ROLES = [
  { id: "administrador", nombre: "Administrador" },
  { id: "docente", nombre: "Docente" },
  { id: "investigador", nombre: "Investigador" },
  { id: "lector", nombre: "Lector" }
];

const PERMISOS = {
  administrador: ["ver", "crear", "editar", "eliminar", "mantenimientos"],
  docente: ["ver", "crear", "editar"],
  investigador: ["ver", "crear"],
  lector: ["ver"]
};


function rolActual() {
  return localStorage.getItem("pa_rol") || "administrador";
}

// Guarda el rol elegido
function cambiarRol(id) {
  localStorage.setItem("pa_rol", id);
  location.reload();
}

//Revisa si el rol actual tiene permiso para hacer una accion
function puede(accion) {
  const permisos = PERMISOS[rolActual()] || [];
  for (let i = 0; i < permisos.length; i++) {
    if (permisos[i] === accion) {
      return true;
    }
  }
  return false;
}

//Devuelve el nombre visible de un rol por id
function nombreRol(id) {
  for (let i = 0; i < ROLES.length; i++) {
    if (ROLES[i].id === id) {
      return ROLES[i].nombre;
    }
  }
  return id;
}
