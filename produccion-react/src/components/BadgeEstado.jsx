//etiqueta de color segun el estado (publicado o borrador)
function BadgeEstado({ estado }) {
  let clase = "badge badge-estado-borrador";
  if (estado === "publicado") {
    clase = "badge badge-estado-publicado";
  }
  return <span className={clase}>{estado}</span>;
}

export default BadgeEstado;
