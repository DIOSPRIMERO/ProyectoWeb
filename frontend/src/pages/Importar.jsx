// Busqueda en OpenAlex e importacion de resultados al sistema.
// OpenAlex es una API publica de produccion academica (no pide clave).
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiCatalogos, apiExterna } from "../api/api";
import Cargando from "../components/Cargando";
import Mensaje from "../components/Mensaje";
import Modal from "../components/Modal";

function Importar() {
  const navegar = useNavigate();

  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [buscoAlgo, setBuscoAlgo] = useState(false);
  const [error, setError] = useState("");

  const [catalogos, setCatalogos] = useState(null);
  const [elegido, setElegido] = useState(null);
  const [tipoId, setTipoId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [carreraId, setCarreraId] = useState("");
  const [errorModal, setErrorModal] = useState("");
  const [importando, setImportando] = useState(false);

  useEffect(() => {
    apiCatalogos.todos().then(setCatalogos).catch(() => {});
  }, []);

  async function buscar() {
    if (termino.trim().length < 3) {
      setError("Escriba al menos 3 caracteres");
      return;
    }

    setBuscando(true);
    setError("");

    try {
      const respuesta = await apiExterna.buscar(termino.trim());
      setResultados(respuesta.datos);
      setBuscoAlgo(true);
    } catch (e) {
      setError(e.message);
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }

  function abrirImportacion(resultado) {
    setElegido(resultado);
    setTipoId("");
    setAreaId("");
    setCarreraId("");
    setErrorModal("");
  }

  async function importar() {
    if (!tipoId) {
      setErrorModal("Seleccione el tipo de produccion");
      return;
    }
    if (!elegido.anio) {
      setErrorModal("Este registro no trae anio. Registrelo a mano desde el listado.");
      return;
    }

    setImportando(true);
    setErrorModal("");

    try {
      const creada = await apiExterna.importar({
        titulo: elegido.titulo,
        anio: elegido.anio,
        doi: elegido.doi,
        resumen: elegido.resumen,
        palabrasClave: elegido.palabrasClave,
        autores: elegido.autores,
        tipoId: Number(tipoId),
        areaId: areaId ? Number(areaId) : null,
        carreraId: carreraId ? Number(carreraId) : null,
      });

      setElegido(null);
      navegar("/producciones/" + creada.id);
    } catch (e) {
      setErrorModal(e.message);
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="container py-4">
      <h1 className="h3 mb-1">Importar desde OpenAlex</h1>
      <p className="text-secondary">
        Busque publicaciones en OpenAlex y agreguelas al repositorio de la universidad.
      </p>

      <Mensaje tipo="danger" texto={error} onCerrar={() => setError("")} />

      <div className="card mb-4">
        <div className="card-body">
          <div className="input-group">
            <input
              type="search"
              className="form-control"
              placeholder="Tema, titulo o autor. Ejemplo: microservices security"
              value={termino}
              onChange={(e) => setTermino(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
            <button className="btn btn-primary" onClick={buscar} disabled={buscando}>
              <i className="bi bi-search me-1"></i>
              Buscar
            </button>
          </div>
          <div className="form-text">
            La consulta la hace el backend y normaliza la respuesta antes de enviarla.
          </div>
        </div>
      </div>

      {buscando && <Cargando mensaje="Consultando OpenAlex..." />}

      {!buscando && buscoAlgo && resultados.length === 0 && (
        <p className="text-center text-secondary py-5">
          No se encontraron resultados. Pruebe con otras palabras.
        </p>
      )}

      {!buscando && resultados.length > 0 && (
        <>
          <p className="text-secondary small">{resultados.length} resultados</p>

          {resultados.map((r, indice) => (
            <div className="card mb-3" key={indice}>
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between gap-3">
                  <div style={{ minWidth: "250px", flex: 1 }}>
                    {r.anio && <span className="badge text-bg-light mb-2">{r.anio}</span>}
                    <h2 className="h6">{r.titulo}</h2>
                    <p className="text-secondary small mb-1">{r.autores.join(", ")}</p>
                    {r.revista && (
                      <p className="text-secondary small mb-1">
                        <i className="bi bi-journal me-1"></i>
                        {r.revista}
                      </p>
                    )}
                    {r.resumen && (
                      <p className="small text-secondary mb-1">
                        {r.resumen.slice(0, 220)}
                        {r.resumen.length > 220 && "..."}
                      </p>
                    )}
                    {r.doi && <span className="small text-secondary">DOI: {r.doi}</span>}
                  </div>

                  <button
                    className="btn btn-sm btn-outline-primary align-self-start text-nowrap"
                    onClick={() => abrirImportacion(r)}
                  >
                    <i className="bi bi-download me-1"></i>
                    Importar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      <Modal
        titulo="Importar al sistema"
        abierto={elegido !== null}
        onCerrar={() => setElegido(null)}
        pie={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setElegido(null)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={importar} disabled={importando}>
              {importando && <span className="spinner-border spinner-border-sm me-2"></span>}
              Importar
            </button>
          </>
        }
      >
        <Mensaje tipo="danger" texto={errorModal} />

        {elegido && (
          <>
            <p className="mb-1"><strong>{elegido.titulo}</strong></p>
            <p className="text-secondary small">
              {elegido.autores.length} autor(es) &middot; {elegido.anio || "sin anio"}
            </p>
            <hr />
            <p className="small text-secondary">
              El titulo, autores, resumen y DOI se toman de OpenAlex. Complete la
              clasificacion de la universidad. El registro entra como &quot;En revision&quot;.
            </p>

            <div className="mb-3">
              <label htmlFor="i-tipo" className="form-label">
                Tipo de produccion <span className="text-danger">*</span>
              </label>
              <select
                id="i-tipo"
                className="form-select"
                value={tipoId}
                onChange={(e) => setTipoId(e.target.value)}
              >
                <option value="">Seleccione...</option>
                {catalogos &&
                  catalogos["tipos-produccion"].map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
              </select>
            </div>

            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <label htmlFor="i-area" className="form-label">Area</label>
                <select
                  id="i-area"
                  className="form-select"
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {catalogos &&
                    catalogos.areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                </select>
              </div>

              <div className="col-12 col-sm-6">
                <label htmlFor="i-carrera" className="form-label">Carrera</label>
                <select
                  id="i-carrera"
                  className="form-select"
                  value={carreraId}
                  onChange={(e) => setCarreraId(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {catalogos &&
                    catalogos.carreras.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                </select>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default Importar;
