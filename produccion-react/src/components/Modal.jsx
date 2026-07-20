// ventana modal reutilizable. se muestra solo si cv es true.
function Modal({ titulo, visible, onCerrar, onGuardar, children }) {
  // si no esta visible no dibujamos nada
  if (!visible) {
    return null;
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title texto-marca">{titulo}</h5>
          <button className="btn-close" onClick={onCerrar}></button>
        </div>

        <div className="modal-body">
          {children}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-marca" onClick={onGuardar}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
