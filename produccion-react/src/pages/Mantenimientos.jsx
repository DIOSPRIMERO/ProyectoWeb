import { useState, useEffect } from "react";
import { obtenerTabla, guardarTabla, nuevoId, reiniciar } from "../data/almacen.js";
import { puede } from "../auth/roles.js";
import { CATALOGOS } from "../data/catalogos.js";
import MenuCatalogos from "../components/MenuCatalogos.jsx";
import TablaMantenimiento from "../components/TablaMantenimiento.jsx";
import ModalMantenimiento from "../components/ModalMantenimiento.jsx";

// pagina de mantenimientos (los 8 catalogos)
function Mantenimientos({ rol }) {
  const [catalogo, setCatalogo] = useState("usuarios");
  const [filas, setFilas] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);

  const config = CATALOGOS[catalogo];

  // carga las filas cada vez que cambia el catalogo
  useEffect(() => {
    setFilas(obtenerTabla(catalogo));
  }, [catalogo]);

  // abre el modal para crear
  const nuevo = () => {
    setEnEdicion(null);
    setModalAbierto(true);
  };

  // abre el modal para editar
  const editar = (registro) => {
    setEnEdicion(registro);
    setModalAbierto(true);
  };

  // elimina un registro
  const eliminar = (id) => {
    if (!confirm("Eliminar este registro?")) {
      return;
    }
    const nueva = filas.filter((f) => f.id !== id);
    guardarTabla(catalogo, nueva);
    setFilas(nueva);
  };

  // guarda un registro (crea o edita)
  const guardar = (valores) => {
    let nueva;
    if (enEdicion) {
      nueva = filas.map((f) => {
        if (f.id === enEdicion.id) {
          return { ...valores, id: f.id };
        }
        return f;
      });
    } else {
      const creado = { ...valores, id: nuevoId(catalogo) };
      nueva = [...filas, creado];
    }
    guardarTabla(catalogo, nueva);
    setFilas(nueva);
    setModalAbierto(false);
  };

  // reinicia todos los datos simulados
  const reiniciarTodo = () => {
    if (confirm("Esto restablece todos los datos simulados. Continuar?")) {
      reiniciar();
      setFilas(obtenerTabla(catalogo));
    }
  };

  // si el rol no tiene permiso mostramos un aviso
  if (!puede(rol, "mantenimientos")) {
    return (
      <div className="container my-4">
        <div className="alert alert-danger">
          <i className="bi bi-lock"></i> No tienes permisos para acceder a los mantenimientos con el rol actual.
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h1 className="texto-marca mb-0">Mantenimientos</h1>
        <button className="btn btn-outline-secondary btn-sm" onClick={reiniciarTodo}>
          <i className="bi bi-arrow-counterclockwise"></i> Reiniciar datos
        </button>
      </div>

      <div className="row g-3">
        <div className="col-lg-3">
          <MenuCatalogos actual={catalogo} onSeleccionar={setCatalogo} />
        </div>

        <div className="col-lg-9">
          <div className="card tarjeta">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="texto-marca mb-0">{config.titulo}</h5>
                <button className="btn btn-marca btn-sm" onClick={nuevo}>
                  <i className="bi bi-plus-lg"></i> Nuevo
                </button>
              </div>
              <TablaMantenimiento config={config} filas={filas} onEditar={editar} onEliminar={eliminar} />
            </div>
          </div>
        </div>
      </div>

      <ModalMantenimiento
        config={config}
        registro={enEdicion}
        visible={modalAbierto}
        onGuardar={guardar}
        onCerrar={() => setModalAbierto(false)}
      />
    </div>
  );
}

export default Mantenimientos;
