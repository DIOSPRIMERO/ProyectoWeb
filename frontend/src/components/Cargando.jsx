// Indicador de carga
function Cargando({ mensaje = "Cargando..." }) {
  return (
    <div className="text-center py-5 text-secondary">
      <div className="spinner-border text-primary mb-3" role="status">
        <span className="visually-hidden">{mensaje}</span>
      </div>
      <p className="mb-0 small">{mensaje}</p>
    </div>
  );
}

export default Cargando;
