// Etiqueta de color segun el estado de la produccion
function Estado({ estado }) {
  const estilos = {
    publicado: { clase: "text-bg-success", texto: "Publicado" },
    revision: { clase: "text-bg-warning", texto: "En revision" },
    borrador: { clase: "text-bg-secondary", texto: "Borrador" },
  };

  const estilo = estilos[estado] || { clase: "text-bg-light", texto: estado };

  return <span className={"badge " + estilo.clase}>{estilo.texto}</span>;
}

export default Estado;
