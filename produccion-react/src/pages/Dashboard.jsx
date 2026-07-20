import { useState, useEffect } from "react";
import { obtenerTabla } from "../data/almacen.js";
import TarjetaIndicador from "../components/TarjetaIndicador.jsx";

// pagina principal con los indicadores del sistema
function Dashboard({ onVerDetalle }) {
  const [producciones, setProducciones] = useState([]);
  const [areas, setAreas] = useState([]);

  // al abrir la pagina cargamos los datos del localStorage
  useEffect(() => {
    setProducciones(obtenerTabla("producciones"));
    setAreas(obtenerTabla("areas"));
  }, []);

  // cuenta cuantas producciones tienen cierto estado
  const contarPorEstado = (estado) => {
    return producciones.filter((p) => p.estado === estado).length;
  };

  // cuenta cuantas producciones hay en un area
  const contarPorArea = (areaId) => {
    return producciones.filter((p) => p.area === areaId).length;
  };

  // las 5 producciones mas recientes ordenadas por fecha
  const recientes = [...producciones]
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .slice(0, 5);

  // total para calcular los porcentajes de las barras
  let total = producciones.length;
  if (total === 0) {
    total = 1;
  }

  return (
    <div className="container my-4">
      <h1 className="texto-marca mb-3">Panel principal</h1>

      <div className="row g-3 mb-4">
        <TarjetaIndicador etiqueta="Producciones" valor={producciones.length} icono="bi-journal-text" />
        <TarjetaIndicador etiqueta="Publicadas" valor={contarPorEstado("publicado")} icono="bi-check-circle" />
        <TarjetaIndicador etiqueta="Borradores" valor={contarPorEstado("borrador")} icono="bi-pencil-square" />
        <TarjetaIndicador etiqueta="Areas activas" valor={areas.length} icono="bi-diagram-3" />
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card tarjeta h-100">
            <div className="card-body">
              <h5 className="texto-marca mb-3">Producciones por area</h5>
              {areas.map((a) => {
                const cantidad = contarPorArea(a.id);
                const porcentaje = Math.round((cantidad / total) * 100);
                return (
                  <div className="mb-3" key={a.id}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>{a.nombre}</span>
                      <span className="fw-bold">{cantidad}</span>
                    </div>
                    <div className="bg-light rounded">
                      <div className="barra-area" style={{ width: porcentaje + "%" }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card tarjeta h-100">
            <div className="card-body">
              <h5 className="texto-marca mb-3">Mas recientes</h5>
              <ul className="list-group list-group-flush">
                {recientes.map((p) => (
                  <li className="list-group-item px-0" key={p.id}>
                    <button className="btn btn-link p-0 text-decoration-none fw-semibold texto-marca" onClick={() => onVerDetalle(p.id)}>
                      {p.titulo}
                    </button>
                    <div className="small text-muted">{p.autor} - {p.fecha}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
