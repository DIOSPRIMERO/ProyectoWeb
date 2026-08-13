// Listado de produccion academica con busqueda, filtros y paginacion.
// La busqueda y la paginacion las resuelve el servidor: aqui solo se
// envian los criterios y se muestra lo que devuelve.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiCatalogos, apiProducciones } from "../api/api";
import { useSesion } from "../SesionContexto";
import { puede, puedeEditar } from "../permisos";
import Cargando from "../components/Cargando";
import Mensaje from "../components/Mensaje";
import Estado from "../components/Estado";
import Modal from "../components/Modal";
import Paginacion from "../components/Paginacion";
import FormularioProduccion from "../components/FormularioProduccion";

// Criterios iniciales de la consulta
const FILTROS_INICIALES = {
  busqueda: "",
  autor: "",
  tipo: "",
  categoria: "",
  area: "",
  carrera: "",
  linea: "",
  tipoInvestigacion: "",
  tecnologia: "",
  anio: "",
  estado: "",
  ordenarPor: "creado_en",
  direccion: "desc",
  pagina: 1,
  porPagina: 10,
};

function Producciones() {
  const { usuario } = useSesion();

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [producciones, setProducciones] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [catalogos, setCatalogos] = useState(null);
  const [anios, setAnios] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [verFiltros, setVerFiltros] = useState(false);

  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);

  // Los catalogos y los anios se piden una sola vez
  useEffect(() => {
    apiCatalogos.todos().then(setCatalogos).catch(() => setError("No se pudieron cargar los catalogos"));
    apiProducciones.anios().then((r) => setAnios(r.datos)).catch(() => {});
  }, []);

  const cargar = useCallback(async (criterios) => {
    setCargando(true);
    setError("");

    try {
      const respuesta = await apiProducciones.listar(criterios);
      setProducciones(respuesta.datos);
      setPaginacion(respuesta.paginacion);
    } catch (e) {
      setError(e.message);
      setProducciones([]);
    } finally {
      setCargando(false);
    }
  }, []);

  // Se espera un momento antes de consultar, para no lanzar una
  // peticion por cada letra que se escribe en la busqueda.
  useEffect(() => {
    const temporizador = setTimeout(() => cargar(filtros), 350);
    return () => clearTimeout(temporizador);
  }, [filtros, cargar]);

  // Cualquier cambio de filtro vuelve a la pagina 1
  function cambiarFiltro(campo, valor) {
    setFiltros({ ...filtros, [campo]: valor, pagina: 1 });
  }

  async function eliminar() {
    try {
      await apiProducciones.eliminar(porEliminar.id);
      setAviso("Se elimino la produccion.");
      setPorEliminar(null);
      cargar(filtros);
    } catch (e) {
      setError(e.message);
      setPorEliminar(null);
    }
  }

  // Los select de filtro, armados de una lista
  const filtrosSelect = [
    { campo: "tipo", etiqueta: "Tipo", opciones: "tipos-produccion" },
    { campo: "categoria", etiqueta: "Categoria", opciones: "categorias" },
    { campo: "area", etiqueta: "Area", opciones: "areas" },
    { campo: "carrera", etiqueta: "Carrera", opciones: "carreras" },
    { campo: "linea", etiqueta: "Linea de investigacion", opciones: "lineas" },
    { campo: "tipoInvestigacion", etiqueta: "Tipo de investigacion", opciones: "tipos-investigacion" },
    { campo: "tecnologia", etiqueta: "Tecnologia", opciones: "tecnologias" },
  ];

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">Produccion academica</h1>

        {puede(usuario, "produccion.crear") && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setEnEdicion(null);
              setFormularioAbierto(true);
            }}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Registrar produccion
          </button>
        )}
      </div>

      <Mensaje tipo="success" texto={aviso} onCerrar={() => setAviso("")} />
      <Mensaje tipo="danger" texto={error} onCerrar={() => setError("")} />

      {/* Busqueda y filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-12 col-lg">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Buscar por titulo, resumen o palabras clave..."
                  value={filtros.busqueda}
                  onChange={(e) => cambiarFiltro("busqueda", e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-lg-auto">
              <select
                className="form-select"
                value={filtros.ordenarPor + ":" + filtros.direccion}
                onChange={(e) => {
                  const [ordenarPor, direccion] = e.target.value.split(":");
                  setFiltros({ ...filtros, ordenarPor, direccion, pagina: 1 });
                }}
              >
                <option value="creado_en:desc">Mas recientes</option>
                <option value="creado_en:asc">Mas antiguas</option>
                <option value="anio:desc">Anio (mayor a menor)</option>
                <option value="anio:asc">Anio (menor a mayor)</option>
                <option value="titulo:asc">Titulo (A-Z)</option>
                <option value="titulo:desc">Titulo (Z-A)</option>
              </select>
            </div>

            <div className="col-6 col-lg-auto">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setVerFiltros(!verFiltros)}
              >
                <i className="bi bi-funnel me-1"></i>
                Filtros
              </button>
            </div>
          </div>

          {verFiltros && (
            <div className="row g-3 mt-3 pt-3 border-top">
              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label small">Autor</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Nombre del autor"
                  value={filtros.autor}
                  onChange={(e) => cambiarFiltro("autor", e.target.value)}
                />
              </div>

              {filtrosSelect.map((f) => (
                <div className="col-12 col-md-6 col-lg-3" key={f.campo}>
                  <label className="form-label small">{f.etiqueta}</label>
                  <select
                    className="form-select form-select-sm"
                    value={filtros[f.campo]}
                    onChange={(e) => cambiarFiltro(f.campo, e.target.value)}
                  >
                    <option value="">Todas</option>
                    {catalogos &&
                      catalogos[f.opciones].map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              ))}

              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label small">Anio</label>
                <select
                  className="form-select form-select-sm"
                  value={filtros.anio}
                  onChange={(e) => cambiarFiltro("anio", e.target.value)}
                >
                  <option value="">Todos</option>
                  {anios.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-6 col-lg-3">
                <label className="form-label small">Estado</label>
                <select
                  className="form-select form-select-sm"
                  value={filtros.estado}
                  onChange={(e) => cambiarFiltro("estado", e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="publicado">Publicado</option>
                  <option value="revision">En revision</option>
                  <option value="borrador">Borrador</option>
                </select>
              </div>

              <div className="col-12 text-end">
                <button
                  className="btn btn-sm btn-link"
                  onClick={() => setFiltros(FILTROS_INICIALES)}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-body p-0">
          {cargando ? (
            <Cargando mensaje="Consultando..." />
          ) : producciones.length === 0 ? (
            <p className="text-center text-secondary py-5 mb-0">
              <i className="bi bi-inbox fs-3 d-block mb-2"></i>
              No se encontraron producciones con esos criterios.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Titulo</th>
                    <th className="d-none d-md-table-cell">Autores</th>
                    <th className="d-none d-lg-table-cell">Tipo</th>
                    <th className="text-center">Anio</th>
                    <th className="text-center">Estado</th>
                    <th className="text-center">PDF</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {producciones.map((p) => (
                    <tr key={p.id}>
                      <td style={{ maxWidth: "300px" }}>
                        <Link to={"/producciones/" + p.id} className="text-decoration-none">
                          {p.titulo}
                        </Link>
                      </td>
                      <td className="d-none d-md-table-cell small text-secondary">
                        {p.autores.join(", ")}
                      </td>
                      <td className="d-none d-lg-table-cell small">{p.tipo}</td>
                      <td className="text-center">{p.anio}</td>
                      <td className="text-center">
                        <Estado estado={p.estado} />
                      </td>
                      <td className="text-center">
                        {p.documento_id ? (
                          <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
                        ) : (
                          <i className="bi bi-dash text-secondary"></i>
                        )}
                      </td>
                      <td className="text-end text-nowrap">
                        <Link
                          to={"/producciones/" + p.id}
                          className="btn btn-sm btn-outline-secondary me-1"
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>

                        {puedeEditar(usuario, p.usuario_id) && (
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            title="Modificar"
                            onClick={() => {
                              setEnEdicion(p);
                              setFormularioAbierto(true);
                            }}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}

                        {puede(usuario, "produccion.eliminar") && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Eliminar"
                            onClick={() => setPorEliminar(p)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!cargando && paginacion && (
          <div className="card-footer bg-white">
            <Paginacion
              paginacion={paginacion}
              onCambiar={(pagina) => setFiltros({ ...filtros, pagina })}
            />
          </div>
        )}
      </div>

      <FormularioProduccion
        abierto={formularioAbierto}
        produccion={enEdicion}
        catalogos={catalogos}
        onCerrar={() => setFormularioAbierto(false)}
        onGuardado={() => {
          setAviso(enEdicion ? "Produccion modificada." : "Produccion registrada.");
          cargar(filtros);
        }}
      />

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
          Se eliminara <strong>{porEliminar && porEliminar.titulo}</strong> con sus autores,
          tecnologias y el documento adjunto. Esta accion no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}

export default Producciones;
