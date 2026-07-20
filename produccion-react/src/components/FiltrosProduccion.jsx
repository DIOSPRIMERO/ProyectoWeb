//menus de filtro por tipo, area y carrera
function FiltrosProduccion({ filtros, onCambiar, tipos, areas, carreras }) {
  return (
    <div className="row g-2">
      <div className="col-md-4">
        <select className="form-select" value={filtros.tipo} onChange={(e) => onCambiar("tipo", e.target.value)}>
          <option value="">Todos los tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
      </div>
      <div className="col-md-4">
        <select className="form-select" value={filtros.area} onChange={(e) => onCambiar("area", e.target.value)}>
          <option value="">Todas las areas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </div>
      <div className="col-md-4">
        <select className="form-select" value={filtros.carrera} onChange={(e) => onCambiar("carrera", e.target.value)}>
          <option value="">Todas las carreras</option>
          {carreras.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default FiltrosProduccion;
