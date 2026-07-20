// configuracion de cada catalogo de mantenimiento.
// cada uno describe su titulo y los campos que maneja.
export const CATALOGOS = {
  usuarios: {
    titulo: "Usuarios",
    campos: [
      { key: "nombre", label: "Nombre", tipo: "text", req: true },
      { key: "correo", label: "Correo", tipo: "email", req: true },
      { key: "rol", label: "Rol", tipo: "select", opciones: [
        { valor: "administrador", texto: "Administrador" },
        { valor: "docente", texto: "Docente" },
        { valor: "investigador", texto: "Investigador" },
        { valor: "lector", texto: "Lector" }
      ] },
      { key: "estado", label: "Estado", tipo: "select", opciones: [
        { valor: "activo", texto: "Activo" },
        { valor: "inactivo", texto: "Inactivo" }
      ] }
    ]
  },
  tipos: {
    titulo: "Tipos de produccion academica",
    campos: [
      { key: "nombre", label: "Nombre", tipo: "text", req: true },
      { key: "descripcion", label: "Descripcion", tipo: "text", req: false }
    ]
  },
  categorias: {
    titulo: "Categorias",
    campos: [{ key: "nombre", label: "Nombre", tipo: "text", req: true }]
  },
  areas: {
    titulo: "Areas de conocimiento",
    campos: [{ key: "nombre", label: "Nombre", tipo: "text", req: true }]
  },
  tecnologias: {
    titulo: "Tecnologias",
    campos: [{ key: "nombre", label: "Nombre", tipo: "text", req: true }]
  },
  investigaciones: {
    titulo: "Tipos de investigacion",
    campos: [{ key: "nombre", label: "Nombre", tipo: "text", req: true }]
  },
  carreras: {
    titulo: "Carreras",
    campos: [
      { key: "nombre", label: "Nombre", tipo: "text", req: true },
      { key: "codigo", label: "Codigo", tipo: "text", req: true }
    ]
  },
  lineas: {
    titulo: "Lineas de investigacion",
    campos: [
      { key: "nombre", label: "Nombre", tipo: "text", req: true },
      { key: "area", label: "Area", tipo: "selectTabla", tabla: "areas" }
    ]
  }
};
