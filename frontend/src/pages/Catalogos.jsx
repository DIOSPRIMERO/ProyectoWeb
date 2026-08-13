// Mantenimientos de los 7 catalogos. Una sola pantalla los atiende
// todos porque los siete tienen la misma forma (id y nombre).
import { useCallback, useEffect, useState } from "react";
import { apiCatalogos } from "../api/api";
import Cargando from "../components/Cargando";
import Mensaje from "../components/Mensaje";
import Modal from "../components/Modal";
import Paginacion from "../components/Paginacion";

const CATALOGOS = [
  { nombre: "tipos-produccion", etiqueta: "Tipos de produccion", icono: "bi-journals" },
  { nombre: "categorias", etiqueta: "Categorias", icono: "bi-tags" },
  { nombre: "areas", etiqueta: "Areas de conocimiento", icono: "bi-diagram-3" },
  { nombre: "tecnologias", etiqueta: "Tecnologias", icono: "bi-cpu" },
  { nombre: "tipos-investigacion", etiqueta: "Tipos de investigacion", icono: "bi-search" },
  { nombre: "carreras", etiqueta: "Carreras", icono: "bi-mortarboard" },
  { nombre: "lineas", etiqueta: "Lineas de investigacion", icono: "bi-signpost-split" },
];

function Catalogos() {
  const [activo, setActivo] = useState(CATALOGOS[0]);
  const [registros, setRegistros] = useState([]);
  const [paginacion, setPaginacion] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);
  const [nombre, setNombre] = useState("");
  const [errorModal, setErrorModal] = useState("");
  const [porEliminar, setPorEliminar] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const respuesta = await apiCatalogos.listar(activo.nombre, { busqueda, pagina });
      setRegistros(respuesta.datos);
      setPaginacion(respuesta.paginacion);
    } catch (e) {
      setError(e.message);
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  }, [activo, busqueda, pagina]);

  useEffect(() => {
    const temporizador = setTimeout(cargar, 300);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  function abrirModal(registro) {
    setEnEdicion(registro);
    setNombre(registro ? registro.nombre : "");
    setErrorModal("");
    setModalAbierto(true);
  }

  async function guardar() {
    if (nombre.trim().length < 2) {
      setErrorModal("El nombre debe tener al menos 2 caracteres");
      return;
    }

    try {
      if (enEdicion) {
        await apiCatalogos.actualizar(activo.nombre, enEdicion.id, { nombre: nombre.trim() });
        setAviso("Registro modificado.");
      } else {
        await apiCatalogos.crear(activo.nombre, { nombre: nombre.trim() });
        setAviso("Registro creado.");
      }

      setModalAbierto(false);
      cargar();
    } catch (e) {
      setErrorModal(e.message);
    }
  }

  async function eliminar() {
    try {
      await apiCatalogos.eliminar(activo.nombre, porEliminar.id);
      setAviso("Registro eliminado.");
      setPorEliminar(null);
      cargar();
    } catch (e) {
      // El backend responde 409 si el registro esta en uso
      setError(e.message);
      setPorEliminar(null);
    }
  }

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4">Mantenimientos</h1>

      <Mensaje tipo="success" texto={aviso} onCerrar={() => setAviso("")} />
      <Mensaje tipo="danger" texto={error} onCerrar={() => setError("")} />

      <div className="row g-4">
        {/* Menu de catalogos */}
        <div className="col-12 col-lg-3">
          <div className="list-group">
            {CATALOGOS.map((c) => (
              <button
                key={c.nombre}
                className={"list-group-item list-group-item-action" + (c.nombre === activo.nombre ? " active" : "")}
                onClick={() => {
                  setActivo(c);
                  setPagina(1);
                  setBusqueda("");
                }}
              >
                <i className={"bi " + c.icono + " me-2"}></i>
                <span className="small">{c.etiqueta}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabla del catalogo elegido */}
        <div className="col-12 col-lg-9">
          <div className="card">
            <div className="card-header bg-white d-flex flex-wrap gap-2 justify-content-between align-items-center">
              <h2 className="h6 mb-0">{activo.etiqueta}</h2>

              <div className="d-flex gap-2">
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPagina(1);
                  }}
                />
                <button className="btn btn-sm btn-primary text-nowrap" onClick={() => abrirModal(null)}>
                  <i className="bi bi-plus-lg me-1"></i>
                  Nuevo
                </button>
              </div>
            </div>

            <div className="card-body p-0">
              {cargando ? (
                <Cargando />
              ) : registros.length === 0 ? (
                <p className="text-center text-secondary py-5 mb-0">No hay registros.</p>
              ) : (
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Nombre</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((r) => (
                      <tr key={r.id}>
                        <td>{r.nombre}</td>
                        <td className="text-end text-nowrap">
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => abrirModal(r)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setPorEliminar(r)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {!cargando && paginacion && (
              <div className="card-footer bg-white">
                <Paginacion paginacion={paginacion} onCambiar={setPagina} />
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        titulo={(enEdicion ? "Modificar" : "Nuevo") + " registro"}
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        tamano="sm"
        pie={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setModalAbierto(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={guardar}>
              Guardar
            </button>
          </>
        }
      >
        <Mensaje tipo="danger" texto={errorModal} />

        <label htmlFor="nombre" className="form-label">
          Nombre <span className="text-danger">*</span>
        </label>
        <input
          id="nombre"
          type="text"
          className="form-control"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && guardar()}
        />
      </Modal>

      <Modal
        titulo="Confirmar eliminacion"
        abierto={porEliminar !== null}
        onCerrar={() => setPorEliminar(null)}
        tamano="sm"
        pie={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setPorEliminar(null)}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={eliminar}>
              Eliminar
            </button>
          </>
        }
      >
        <p className="mb-0">
          Se eliminara <strong>{porEliminar && porEliminar.nombre}</strong>. Si alguna produccion
          lo esta usando, el sistema no lo permitira.
        </p>
      </Modal>
    </div>
  );
}

export default Catalogos;
