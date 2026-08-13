// Controles de paginacion. Los datos llegan ya paginados del servidor;
// aqui solo se muestran los botones y se avisa que pagina se pidio.
function Paginacion({ paginacion, onCambiar }) {
  if (!paginacion) return null;

  const { pagina, totalPaginas, total, porPagina } = paginacion;

  if (totalPaginas <= 1) {
    return (
      <p className="text-secondary small mb-0">
        {total} {total === 1 ? "registro" : "registros"}
      </p>
    );
  }

  // Se muestran como maximo 5 numeros alrededor de la pagina actual
  const numeros = [];
  const desde = Math.max(1, pagina - 2);
  const hasta = Math.min(totalPaginas, pagina + 2);
  for (let i = desde; i <= hasta; i++) {
    numeros.push(i);
  }

  const primero = (pagina - 1) * porPagina + 1;
  const ultimo = Math.min(pagina * porPagina, total);

  return (
    <nav className="d-flex flex-wrap justify-content-between align-items-center gap-2">
      <p className="text-secondary small mb-0">
        Mostrando {primero}-{ultimo} de {total}
      </p>

      <ul className="pagination pagination-sm mb-0">
        <li className={"page-item" + (pagina === 1 ? " disabled" : "")}>
          <button className="page-link" onClick={() => onCambiar(pagina - 1)} aria-label="Anterior">
            <i className="bi bi-chevron-left"></i>
          </button>
        </li>

        {numeros.map((n) => (
          <li key={n} className={"page-item" + (n === pagina ? " active" : "")}>
            <button className="page-link" onClick={() => onCambiar(n)}>
              {n}
            </button>
          </li>
        ))}

        <li className={"page-item" + (pagina === totalPaginas ? " disabled" : "")}>
          <button
            className="page-link"
            onClick={() => onCambiar(pagina + 1)}
            aria-label="Siguiente"
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Paginacion;
