// Protege las rutas que necesitan sesion y, si se indica, un permiso.
import { Navigate } from "react-router-dom";
import { useSesion } from "../SesionContexto";
import { puede } from "../permisos";
import Cargando from "./Cargando";

function RutaPrivada({ children, permiso }) {
  const { usuario, cargando } = useSesion();

  if (cargando) {
    return <Cargando mensaje="Verificando sesion..." />;
  }

  // Sin sesion se manda al login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Con sesion pero sin el permiso necesario
  if (permiso && !puede(usuario, permiso)) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          <h5>
            <i className="bi bi-shield-lock me-2"></i>
            Acceso restringido
          </h5>
          <p className="mb-0">
            Su rol no tiene permiso para ver esta seccion.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export default RutaPrivada;
