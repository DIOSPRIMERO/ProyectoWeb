import { ROLES, nombreRol, puede } from "../auth/roles.js";

// barra de navegacion superior con el selector de rol
function Header({ vista, onNavegar, rol, onCambiarRol }) {
  // arma la clase de cada enlace, marcando el activo
  const claseEnlace = (nombre) => {
    if (nombre === vista) {
      return "nav-link active";
    }
    return "nav-link";
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark marca-nav">
      <div className="container">
        <span className="navbar-brand fw-bold">
          <span className="marca-cuadro">UC</span> Produccion Academica
        </span>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <ul className="navbar-nav flex-row gap-2 me-3">
            <li className="nav-item">
              <button className={claseEnlace("dashboard")} onClick={() => onNavegar("dashboard")}>Inicio</button>
            </li>
            <li className="nav-item">
              <button className={claseEnlace("producciones")} onClick={() => onNavegar("producciones")}>Produccion academica</button>
            </li>
            {puede(rol, "mantenimientos") && (
              <li className="nav-item">
                <button className={claseEnlace("mantenimientos")} onClick={() => onNavegar("mantenimientos")}>Mantenimientos</button>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-person-badge text-white"></i>
            <select className="form-select form-select-sm selector-rol" value={rol} onChange={(e) => onCambiarRol(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;
