// controles de paginacion reutilizables
function Paginacion({ paginaActual, totalPaginas, onCambiar }) {
  // arma un arreglo con los numeros de pagina [1, 2, 3, ]
  const numeros = [];
  for (let i = 1; i <= totalPaginas; i++) {
    numeros.push(i);
  }

  return (
    <ul className="pagination justify-content-center mb-0">
      <li className={paginaActual === 1 ? "page-item disabled" : "page-item"}>
        <button className="page-link" onClick={() => onCambiar(paginaActual - 1)}>Anterior</button>
      </li>

      {numeros.map((n) => (
        <li key={n} className={n === paginaActual ? "page-item active" : "page-item"}>
          <button className="page-link" onClick={() => onCambiar(n)}>{n}</button>
        </li>
      ))}

      <li className={paginaActual === totalPaginas ? "page-item disabled" : "page-item"}>
        <button className="page-link" onClick={() => onCambiar(paginaActual + 1)}>Siguiente</button>
      </li>
    </ul>
  );
}

export default Paginacion;
