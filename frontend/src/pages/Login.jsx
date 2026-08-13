// Inicio de sesion en dos pasos:
//   paso 1: correo y contrasena
//   paso 2: codigo de 6 digitos que llega por correo (Resend)
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { apiAuth } from "../api/api";
import { useSesion } from "../SesionContexto";
import Mensaje from "../components/Mensaje";

// Cuentas que crea el script de datos de prueba.
// Las cuatro usan la misma contrasena para facilitar la revision.
const CLAVE = "Cenfotec2026!";

const CUENTAS = [
  { rol: "Administrador", correo: "admin@ucenfotec.ac.cr" },
  { rol: "Coordinador", correo: "coordinador@ucenfotec.ac.cr" },
  { rol: "Docente", correo: "docente@ucenfotec.ac.cr" },
  { rol: "Estudiante", correo: "estudiante@ucenfotec.ac.cr" },
];

function Login() {
  const { usuario, iniciarSesion } = useSesion();

  // "clave" = pidiendo correo y contrasena, "codigo" = pidiendo el codigo
  const [paso, setPaso] = useState("clave");
  const [modo, setModo] = useState("login"); // login o registro

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [codigo, setCodigo] = useState("");

  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Si ya hay sesion no tiene sentido mostrar el login
  if (usuario) {
    return <Navigate to="/" replace />;
  }

  async function enviarClave() {
    setError("");
    setEnviando(true);

    try {
      if (modo === "registro") {
        // El registro no usa 2FA: entra directo
        const respuesta = await apiAuth.registro(nombre, correo, contrasena);
        iniciarSesion(respuesta.token, respuesta.usuario);
        return;
      }

      await apiAuth.login(correo, contrasena);
      setPaso("codigo");
      setAviso("Le enviamos un codigo de 6 digitos a " + correo);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function enviarCodigo() {
    setError("");
    setEnviando(true);

    try {
      const respuesta = await apiAuth.verificar(correo, codigo);
      iniciarSesion(respuesta.token, respuesta.usuario);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  function volverAlInicio() {
    setPaso("clave");
    setCodigo("");
    setError("");
    setAviso("");
  }

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center g-4">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <i className="bi bi-mortarboard-fill text-primary fs-1"></i>
                  <h1 className="h4 mt-2 mb-0">Produccion Academica</h1>
                  <p className="text-secondary small mb-0">Universidad CENFOTEC</p>
                </div>

                <Mensaje tipo="danger" texto={error} />
                <Mensaje tipo="info" texto={aviso} />

                {/* PASO 2: el codigo del correo */}
                {paso === "codigo" ? (
                  <>
                    <div className="mb-3">
                      <label htmlFor="codigo" className="form-label">
                        Codigo de verificacion
                      </label>
                      <input
                        id="codigo"
                        type="text"
                        className="form-control form-control-lg text-center"
                        placeholder="000000"
                        maxLength="6"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && enviarCodigo()}
                      />
                      <div className="form-text">
                        El codigo vence en 10 minutos. Tiene 3 intentos.
                      </div>
                    </div>

                    <button
                      className="btn btn-primary w-100 mb-2"
                      onClick={enviarCodigo}
                      disabled={enviando || codigo.length !== 6}
                    >
                      {enviando && <span className="spinner-border spinner-border-sm me-2"></span>}
                      Verificar
                    </button>

                    <button className="btn btn-link w-100" onClick={volverAlInicio}>
                      Volver
                    </button>
                  </>
                ) : (
                  /* PASO 1: correo y contrasena */
                  <>
                    <div className="btn-group w-100 mb-4">
                      <button
                        className={"btn btn-sm " + (modo === "login" ? "btn-primary" : "btn-outline-primary")}
                        onClick={() => { setModo("login"); setError(""); }}
                      >
                        Iniciar sesion
                      </button>
                      <button
                        className={"btn btn-sm " + (modo === "registro" ? "btn-primary" : "btn-outline-primary")}
                        onClick={() => { setModo("registro"); setError(""); }}
                      >
                        Registrarse
                      </button>
                    </div>

                    {modo === "registro" && (
                      <div className="mb-3">
                        <label htmlFor="nombre" className="form-label">Nombre completo</label>
                        <input
                          id="nombre"
                          type="text"
                          className="form-control"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="mb-3">
                      <label htmlFor="correo" className="form-label">Correo</label>
                      <input
                        id="correo"
                        type="email"
                        className="form-control"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && enviarClave()}
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="contrasena" className="form-label">Contrasena</label>
                      <input
                        id="contrasena"
                        type="password"
                        className="form-control"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && enviarClave()}
                      />
                    </div>

                    <button
                      className="btn btn-primary w-100"
                      onClick={enviarClave}
                      disabled={enviando}
                    >
                      {enviando && <span className="spinner-border spinner-border-sm me-2"></span>}
                      {modo === "login" ? "Continuar" : "Crear cuenta"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Cuentas de prueba, para facilitar la revision */}
          {paso === "clave" && (
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card shadow-sm h-100">
                <div className="card-body p-4">
                  <h2 className="h6">Cuentas de prueba</h2>
                  <p className="text-secondary small">
                    Cada rol ve opciones distintas. Pulse una para llenar el formulario.
                    Las cuatro usan la contrasena <code>{CLAVE}</code>.
                  </p>

                  <div className="list-group list-group-flush">
                    {CUENTAS.map((c) => (
                      <button
                        key={c.correo}
                        className="list-group-item list-group-item-action px-0"
                        onClick={() => {
                          setModo("login");
                          setCorreo(c.correo);
                          setContrasena(CLAVE);
                          setError("");
                        }}
                      >
                        <strong className="d-block small">{c.rol}</strong>
                        <span className="text-secondary" style={{ fontSize: "0.78rem" }}>
                          {c.correo}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="alert alert-info small mt-3 mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
