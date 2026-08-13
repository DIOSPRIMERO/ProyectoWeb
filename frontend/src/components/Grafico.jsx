// Grafico de barras sencillo, hecho con las barras de progreso de
// Bootstrap. No se usa una libreria de graficos porque las series
// son simples y esto es suficiente.
function Grafico({ titulo, datos, color = "primary" }) {
  // El valor mas alto define el 100% del ancho
  const maximo = datos.length > 0 ? Math.max(...datos.map((d) => d.total)) : 1;

  return (
    <div className="card h-100">
      <div className="card-header bg-white">
        <h6 className="mb-0">{titulo}</h6>
      </div>
      <div className="card-body">
        {datos.length === 0 && <p className="text-secondary small mb-0">Sin datos.</p>}

        {datos.map((d) => (
          <div className="mb-3" key={d.etiqueta}>
            <div className="d-flex justify-content-between small mb-1">
              <span className="text-truncate me-2">{d.etiqueta}</span>
              <strong>{d.total}</strong>
            </div>
            <div className="progress" style={{ height: "8px" }}>
              <div
                className={"progress-bar bg-" + color}
                style={{ width: (d.total / maximo) * 100 + "%" }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Grafico;
