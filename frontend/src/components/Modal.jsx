// Ventana modal controlada por React.
// Se dibuja a mano (sin el JavaScript de Bootstrap) para que abrir
// y cerrar dependa del estado del componente.
function Modal({ titulo, abierto, onCerrar, children, pie, tamano = "lg" }) {
  if (!abierto) return null;

  return (
    <>
      <div className="modal d-block" tabIndex="-1">
        <div className={"modal-dialog modal-" + tamano + " modal-dialog-centered modal-dialog-scrollable"}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{titulo}</h5>
              <button type="button" className="btn-close" onClick={onCerrar}></button>
            </div>
            <div className="modal-body">{children}</div>
            {pie && <div className="modal-footer">{pie}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" onClick={onCerrar}></div>
    </>
  );
}

export default Modal;
