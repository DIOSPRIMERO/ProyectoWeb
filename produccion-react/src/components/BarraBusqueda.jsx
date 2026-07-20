//caja de busqueda reutilizable
function BarraBusqueda({ valor, onCambiar, placeholder }) {
  return (
    <div className="input-group">
      <span className="input-group-text"><i className="bi bi-search"></i></span>
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
      />
    </div>
  );
}

export default BarraBusqueda;
