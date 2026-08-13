// Barra de navegacion. Los enlaces se muestran segun los permisos
// del rol que inicio sesion.
import { Link, NavLink } from "react-router-dom";
import { useSesion } from "../SesionContexto";
import { NOMBRE_ROL, puede } from "../permisos";

function Header() {
  const { usuario, cerrarSesion } = useSesion();

  const enlaces = [
    { a: "/", texto: "Dashboard", icono: "bi-speedometer2", permiso: "dashboard.ver" },
    { a: "/producciones", texto: "Produccion", icono: "bi-journal-text", permiso: "produccion.consultar" },
    { a: "/importar", texto: "Importar", icono: "bi-cloud-download", permiso: "externa.importar" },
    { a: "/catalogos", texto: "Mantenimientos", icono: "bi-sliders", permiso: "catalogos.gestionar" },
    { a: "/usuarios", texto: "Usuarios", icono: "bi-people", permiso: "usuarios.gestionar" },
  ];

  const visibles = enlaces.filter((e) => puede(usuario, e.permiso));

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <i className="bi bi-mortarboard-fill"></i>
          Produccion Academica
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#menu"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="menu">
          <ul className="navbar-nav me-auto">
            {visibles.map((e) => (
              <li className="nav-item" key={e.a}>
                <NavLink className="nav-link" to={e.a} end={e.a === "/"}>
                  <i className={"bi " + e.icono + " me-1"}></i>
                  {e.texto}
                </NavLink>
              </li>
            ))}
          </ul>

          {usuario && (
            <div className="d-flex align-items-center gap-3">
              <span className="text-white small">
                {usuario.nombre}
                <span className="badge text-bg-primary ms-2">{NOMBRE_ROL[usuario.rol]}</span>
              </span>
              <button className="btn btn-sm btn-outline-light" onClick={cerrarSesion}>
                <i className="bi bi-box-arrow-right me-1"></i>
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Header;
