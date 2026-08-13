// Dashboard con indicadores. A diferencia del avance 2, los numeros
// vienen de consultas reales a MySQL y no de datos simulados.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDashboard } from "../api/api";
import Cargando from "../components/Cargando";
import Mensaje from "../components/Mensaje";
import Grafico from "../components/Grafico";
import Estado from "../components/Estado";

function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    apiDashboard
      .indicadores()
      .then(setDatos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <Cargando mensaje="Calculando indicadores..." />;
  if (error) return <div className="container py-4"><Mensaje tipo="danger" texto={error} /></div>;
  if (!datos) return null;

  const tarjetas = [
    { titulo: "Producciones", valor: datos.totales.producciones, icono: "bi-journal-text", color: "primary" },
    { titulo: "Publicadas", valor: datos.totales.publicadas, icono: "bi-check-circle", color: "success" },
    { titulo: "En revision", valor: datos.totales.en_revision, icono: "bi-hourglass-split", color: "warning" },
    { titulo: "Documentos", valor: datos.totales.documentos, icono: "bi-file-earmark-pdf", color: "danger" },
  ];

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4">Panel de indicadores</h1>

      {/* Tarjetas con los totales */}
      <div className="row g-3 mb-4">
        {tarjetas.map((t) => (
          <div className="col-6 col-lg-3" key={t.titulo}>
            <div className="card h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <i className={"bi " + t.icono + " fs-2 text-" + t.color}></i>
                <div>
                  <p className="text-secondary small mb-0">{t.titulo}</p>
                  <p className="h4 mb-0">{t.valor}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graficos que pide la consigna */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-6">
          <Grafico titulo="Produccion por anio" datos={datos.porAnio} color="primary" />
        </div>
        <div className="col-12 col-lg-6">
          <Grafico titulo="Tecnologias mas utilizadas" datos={datos.tecnologias} color="info" />
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-4">
          <Grafico titulo="Por carrera" datos={datos.porCarrera} color="success" />
        </div>
        <div className="col-12 col-lg-4">
          <Grafico titulo="Por area de conocimiento" datos={datos.porArea} color="warning" />
        </div>
        <div className="col-12 col-lg-4">
          <Grafico titulo="Por linea de investigacion" datos={datos.porLinea} color="danger" />
        </div>
      </div>

      {/* Ultimos registros */}
      <div className="card">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Registros recientes</h6>
          <Link to="/producciones" className="btn btn-sm btn-link">Ver todas</Link>
        </div>
        <div className="list-group list-group-flush">
          {datos.recientes.map((r) => (
            <Link
              key={r.id}
              to={"/producciones/" + r.id}
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
            >
              <span className="text-truncate me-2">
                {r.titulo}
                <span className="text-secondary small d-block">{r.anio}</span>
              </span>
              <Estado estado={r.estado} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
