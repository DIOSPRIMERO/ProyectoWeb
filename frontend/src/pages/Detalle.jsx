// Ficha de detalle de una produccion, con descarga y previsualizacion
// del documento PDF.
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiCatalogos, apiDocumentos, apiProducciones } from "../api/api";
import { useSesion } from "../SesionContexto";
import { puede, puedeEditar } from "../permisos";
import Cargando from "../components/Cargando";
import Mensaje from "../components/Mensaje";
import Estado from "../components/Estado";
import FormularioProduccion from "../components/FormularioProduccion";

// Pasa los bytes a KB o MB
function formatearTamano(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function Detalle() {
  const { id } = useParams();
  const { usuario } = useSesion();

  const [produccion, setProduccion] = useState(null);
  const [catalogos, setCatalogos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [verPdf, setVerPdf] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setProduccion(await apiProducciones.obtener(id));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    apiCatalogos.todos().then(setCatalogos).catch(() => {});
  }, []);

  if (cargando) return <Cargando />;

  if (error || !produccion) {
    return (
      <div className="container py-4">
        <Mensaje tipo="danger" texto={error || "Produccion no encontrada"} />
        <Link to="/producciones" className="btn btn-outline-secondary">
          Volver al listado
        </Link>
      </div>
    );
  }

  // Los datos de clasificacion, para no repetir el mismo bloque
  const clasificacion = [
    ["Tipo de produccion", produccion.tipo],
    ["Categoria", produccion.categoria],
    ["Area de conocimiento", produccion.area],
    ["Tipo de investigacion", produccion.tipo_investigacion],
    ["Carrera", produccion.carrera],
    ["Linea de investigacion", produccion.linea],
  ];

  return (
    <div className="container py-4">
      <nav className="mb-3">
        <Link to="/producciones" className="text-decoration-none small">
          <i className="bi bi-arrow-left me-1"></i>
          Volver al listado
        </Link>
      </nav>

      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
          <div className="d-flex gap-2 mb-2">
            <Estado estado={produccion.estado} />
            <span className="badge text-bg-light">{produccion.anio}</span>
          </div>
          <h1 className="h3 mb-2">{produccion.titulo}</h1>
          <p className="text-secondary mb-0">
            <i className="bi bi-people me-1"></i>
            {produccion.autores.join(", ")}
          </p>
        </div>

        {puedeEditar(usuario, produccion.usuario_id) && (
          <button className="btn btn-outline-primary" onClick={() => setFormularioAbierto(true)}>
            <i className="bi bi-pencil me-1"></i>
            Modificar
          </button>
        )}
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card mb-4">
            <div className="card-body">
              <h2 className="h6">Resumen</h2>
              <p className="mb-0 text-secondary">
                {produccion.resumen || "Esta produccion no tiene resumen."}
              </p>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h2 className="h6 mb-3">Clasificacion academica</h2>
              <div className="row small">
                {clasificacion.map(([etiqueta, valor]) => (
                  <div className="col-12 col-sm-6 mb-3" key={etiqueta}>
                    <span className="text-secondary d-block">{etiqueta}</span>
                    <strong>{valor || "-"}</strong>
                  </div>
                ))}

                {produccion.doi && (
                  <div className="col-12">
                    <span className="text-secondary d-block">DOI</span>
                    <a
                      href={"https://doi.org/" + produccion.doi}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {produccion.doi}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Previsualizacion del PDF */}
          {produccion.documento_id && puede(usuario, "documento.descargar") && (
            <div className="card">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h2 className="h6 mb-0">Previsualizacion del documento</h2>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setVerPdf(!verPdf)}
                >
                  {verPdf ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {verPdf && (
                <div className="card-body">
                  <iframe
                    title="Documento PDF"
                    src={apiDocumentos.urlVista(produccion.id)}
                    style={{ width: "100%", height: "500px", border: "1px solid #dee2e6" }}
                  ></iframe>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="col-12 col-lg-4">
          {/* Documento */}
          <div className="card mb-4">
            <div className="card-body">
              <h2 className="h6 mb-3">Documento digital</h2>

              {produccion.documento_id ? (
                <>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-file-earmark-pdf-fill text-danger fs-3"></i>
                    <div>
                      <p className="mb-0 small">{produccion.nombre_original}</p>
                      <p className="mb-0 text-secondary" style={{ fontSize: "0.78rem" }}>
                        {formatearTamano(produccion.tamano_bytes)}
                      </p>
                    </div>
                  </div>

                  {puede(usuario, "documento.descargar") && (
                    <a
                      className="btn btn-primary w-100"
                      href={apiDocumentos.urlDescarga(produccion.id)}
                    >
                      <i className="bi bi-download me-1"></i>
                      Descargar PDF
                    </a>
                  )}
                </>
              ) : (
                <p className="text-secondary small mb-0">
                  Esta produccion no tiene documento adjunto.
                </p>
              )}
            </div>
          </div>

          {/* Tecnologias */}
          <div className="card mb-4">
            <div className="card-body">
              <h2 className="h6 mb-3">Tecnologias</h2>
              {produccion.tecnologias.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {produccion.tecnologias.map((t) => (
                    <span className="badge text-bg-secondary" key={t.id}>
                      {t.nombre}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-secondary small mb-0">Sin tecnologias registradas.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body small">
              <h2 className="h6 mb-3">Datos del registro</h2>
              <p className="mb-1 text-secondary">
                Registrado por: <strong>{produccion.registrado_por}</strong>
              </p>
              <p className="mb-0 text-secondary">Fecha: {produccion.creado_en}</p>
              {produccion.palabras_clave && (
                <p className="mb-0 mt-2 text-secondary">
                  Palabras clave: {produccion.palabras_clave}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <FormularioProduccion
        abierto={formularioAbierto}
        produccion={produccion}
        catalogos={catalogos}
        onCerrar={() => setFormularioAbierto(false)}
        onGuardado={cargar}
      />
    </div>
  );
}

export default Detalle;
