import { useState, useEffect } from "react";
import { obtenerTabla, nombrePorId } from "../data/almacen.js";
import BadgeEstado from "../components/BadgeEstado.jsx";

// pagina de detalle de una produccion
function DetalleProduccion({ id, onVolver }) {
  const [produccion, setProduccion] = useState(null);

  // busca la produccion por su id al abrir la pagina
  useEffect(() => {
    const lista = obtenerTabla("producciones");
    const encontrada = lista.find((p) => p.id === Number(id));
    setProduccion(encontrada || null);
  }, [id]);

  // simula la descarga del documento
  const descargar = () => {
    alert("Descarga simulada del documento: " + produccion.documento +
      "\n\nEn la version final este boton descargara el archivo real desde el servidor.");
  };

  // arma un bloque de dato (etiqueta + valor)
  const Dato = ({ etiqueta, valor }) => (
    <div className="col-md-4">
      <div className="small text-uppercase text-muted">{etiqueta}</div>
      <div className="fw-semibold">{valor}</div>
    </div>
  );

  if (!produccion) {
    return (
      <div className="container my-4">
        <div className="alert alert-warning">No se encontro la produccion solicitada.</div>
        <button className="btn btn-secondary" onClick={onVolver}>Volver</button>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <button className="btn btn-link texto-marca mb-2 p-0" onClick={onVolver}>
        <i className="bi bi-arrow-left"></i> Volver al listado
      </button>

      <div className="card tarjeta">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <h1 className="texto-marca mb-1">{produccion.titulo}</h1>
            <BadgeEstado estado={produccion.estado} />
          </div>
          <p className="text-muted mb-4">{produccion.autor} - {produccion.anio} - registrado el {produccion.fecha}</p>

          <div className="row g-3 mb-4">
            <Dato etiqueta="Tipo de produccion" valor={nombrePorId("tipos", produccion.tipo)} />
            <Dato etiqueta="Categoria" valor={nombrePorId("categorias", produccion.categoria)} />
            <Dato etiqueta="Area de conocimiento" valor={nombrePorId("areas", produccion.area)} />
            <Dato etiqueta="Tipo de investigacion" valor={nombrePorId("investigaciones", produccion.investigacion)} />
            <Dato etiqueta="Carrera" valor={nombrePorId("carreras", produccion.carrera)} />
            <Dato etiqueta="Linea de investigacion" valor={nombrePorId("lineas", produccion.linea)} />
          </div>

          <h5 className="texto-marca">Resumen</h5>
          <p>{produccion.resumen || "Sin resumen registrado."}</p>

          <h5 className="texto-marca">Tecnologias</h5>
          <p>
            {produccion.tecnologias.map((idTec) => (
              <span className="badge text-bg-light border me-1" key={idTec}>
                {nombrePorId("tecnologias", idTec)}
              </span>
            ))}
          </p>

          <h5 className="texto-marca">Documento</h5>
          <div className="zona-doc p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span><i className="bi bi-file-earmark-pdf texto-marca fs-4"></i> {produccion.documento}</span>
            <button className="btn btn-marca" onClick={descargar}>
              <i className="bi bi-download"></i> Descargar documento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleProduccion;
