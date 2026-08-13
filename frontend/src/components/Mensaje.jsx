// Alerta de Bootstrap para avisos y errores
function Mensaje({ tipo = "info", texto, onCerrar }) {
  if (!texto) return null;

  const iconos = {
    success: "bi-check-circle",
    danger: "bi-exclamation-triangle",
    warning: "bi-exclamation-triangle",
    info: "bi-info-circle",
  };

  return (
    <div className={"alert alert-" + tipo + (onCerrar ? " alert-dismissible" : "")} role="alert">
      <i className={"bi " + iconos[tipo] + " me-2"}></i>
      {texto}
      {onCerrar && <button type="button" className="btn-close" onClick={onCerrar}></button>}
    </div>
  );
}

export default Mensaje;
