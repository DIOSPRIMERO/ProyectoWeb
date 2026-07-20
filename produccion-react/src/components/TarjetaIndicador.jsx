// tarjeta de un indicador del dashboard
function TarjetaIndicador({ etiqueta, valor, icono }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card tarjeta-stat h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <i className={"bi " + icono + " fs-2 texto-marca"}></i>
          <div>
            <div className="numero">{valor}</div>
            <div className="etiqueta">{etiqueta}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TarjetaIndicador;
