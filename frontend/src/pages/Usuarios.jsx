// Mantenimiento de usuarios y asignacion de roles.
// Tambien muestra la matriz de permisos, para documentar el RBAC.
import { useCallback, useEffect, useState } from "react";
import { apiAuth, apiUsuarios } from "../api/api";
import { useSesion } from "../SesionContexto";
import { NOMBRE_ROL } from "../permisos";
import Cargando from "../components/Cargando";
import Mensaje from "../components/Mensaje";
import Modal from "../components/Modal";
import Paginacion from "../components/Paginacion";

const ROLES = ["admin", "coordinador", "docente", "estudiante"];

const VACIO = { nombre: "", correo: "", contrasena: "", rol: "estudiante", activo: true };

function Usuarios() {
  const { usuario: sesion } = useSesion();

  const [usuarios, setUsuarios] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [pagina, setPagina] = useState(1);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);
  const [datos, setDatos] = useState(VACIO);
  const [errorModal, setErrorModal] = useState("");

  const [verMatriz, setVerMatriz] = useState(false);
  const [matriz, setMatriz] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await apiUsuarios.listar({ busqueda, rol: filtroRol, pagina });
      setUsuarios(respuesta.datos);
      setPaginacion(respuesta.paginacion);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [busqueda, filtroRol, pagina]);

  useEffect(() => {
    const temporizador = setTimeout(cargar, 300);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  // La matriz se pide al backend: son los mismos permisos que usa
  // para proteger los endpoints.
  function abrirMatriz() {
    setVerMatriz(true);
    if (!matriz) {
      apiAuth.matrizPermisos().then((r) => setMatriz(r.matriz)).catch(() => {});
    }
  }

  function abrirModal(usuario) {
    setEnEdicion(usuario);
    setErrorModal("");

    if (usuario) {
      setDatos({
        nombre: usuario.nombre,
        correo: usuario.correo,
        contrasena: "",
        rol: usuario.rol,
        activo: usuario.activo === 1,
      });
    } else {
      setDatos(VACIO);
    }

    setModalAbierto(true);
  }

  async function guardar() {
    if (datos.nombre.trim().length < 3) {
      setErrorModal("El nombre debe tener al menos 3 caracteres");
      return;
    }
    if (!datos.correo.includes("@")) {
      setErrorModal("El correo no es valido");
      return;
    }
    // Al crear la contrasena es obligatoria; al modificar es opcional
    if (!enEdicion && datos.contrasena.length < 8) {
      setErrorModal("La contrasena debe tener al menos 8 caracteres");
      return;
    }

    try {
      const cuerpo = {
        nombre: datos.nombre.trim(),
        correo: datos.correo.trim(),
        rol: datos.rol,
        activo: datos.activo,
      };

      if (datos.contrasena) {
        cuerpo.contrasena = datos.contrasena;
      }

      if (enEdicion) {
        await apiUsuarios.actualizar(enEdicion.id, cuerpo);
        setAviso("Usuario modificado.");
      } else {
        await apiUsuarios.crear(cuerpo);
        setAviso("Usuario creado.");
      }

      setModalAbierto(false);
      cargar();
    } catch (e) {
      setErrorModal(e.message);
    }
  }

  async function desactivar(usuario) {
    try {
      await apiUsuarios.desactivar(usuario.id);
      setAviso(usuario.nombre + " fue desactivado.");
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  // Lista de todos los permisos que existen, para las filas de la matriz
  const todosLosPermisos = matriz
    ? [...new Set(Object.values(matriz).flat())].sort()
    : [];

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">Usuarios y roles</h1>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={abrirMatriz}>
            <i className="bi bi-shield-check me-1"></i>
            Matriz de permisos
          </button>
          <button className="btn btn-primary" onClick={() => abrirModal(null)}>
            <i className="bi bi-person-plus me-1"></i>
            Nuevo usuario
          </button>
        </div>
      </div>

      <Mensaje tipo="success" texto={aviso} onCerrar={() => setAviso("")} />
      <Mensaje tipo="danger" texto={error} onCerrar={() => setError("")} />

      <div className="card">
        <div className="card-header bg-white">
          <div className="row g-2">
            <div className="col-12 col-md">
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Buscar por nombre o correo..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
              />
            </div>
            <div className="col-12 col-md-auto">
              <select
                className="form-select form-select-sm"
                value={filtroRol}
                onChange={(e) => {
                  setFiltroRol(e.target.value);
                  setPagina(1);
                }}
              >
                <option value="">Todos los roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{NOMBRE_ROL[r]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {cargando ? (
            <Cargando />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th className="d-none d-md-table-cell">Correo</th>
                    <th>Rol</th>
                    <th className="text-center">Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td>
                        {u.nombre}
                        {u.id === sesion.id && (
                          <span className="badge text-bg-light ms-2">Usted</span>
                        )}
                      </td>
                      <td className="d-none d-md-table-cell small text-secondary">{u.correo}</td>
                      <td>
                        <span className="badge text-bg-primary">{NOMBRE_ROL[u.rol]}</span>
                      </td>
                      <td className="text-center">
                        <span className={"badge " + (u.activo === 1 ? "text-bg-success" : "text-bg-secondary")}>
                          {u.activo === 1 ? "activo" : "inactivo"}
                        </span>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => abrirModal(u)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        {u.activo === 1 && u.id !== sesion.id && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Desactivar"
                            onClick={() => desactivar(u)}
                          >
                            <i className="bi bi-person-slash"></i>
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
            <Paginacion paginacion={paginacion} onCambiar={setPagina} />
          </div>
        )}
      </div>

      {/* Formulario de usuario */}
      <Modal
        titulo={enEdicion ? "Modificar usuario" : "Nuevo usuario"}
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        pie={
          <>
            <button className="btn btn-outline-secondary" onClick={() => setModalAbierto(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={guardar}>
              Guardar
            </button>
          </>
        }
      >
        <Mensaje tipo="danger" texto={errorModal} />

        <div className="mb-3">
          <label htmlFor="u-nombre" className="form-label">
            Nombre completo <span className="text-danger">*</span>
          </label>
          <input
            id="u-nombre"
            type="text"
            className="form-control"
            value={datos.nombre}
            onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="u-correo" className="form-label">
            Correo <span className="text-danger">*</span>
          </label>
          <input
            id="u-correo"
            type="email"
            className="form-control"
            value={datos.correo}
            onChange={(e) => setDatos({ ...datos, correo: e.target.value })}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="u-clave" className="form-label">
            Contrasena {!enEdicion && <span className="text-danger">*</span>}
          </label>
          <input
            id="u-clave"
            type="password"
            className="form-control"
            value={datos.contrasena}
            onChange={(e) => setDatos({ ...datos, contrasena: e.target.value })}
          />
          <div className="form-text">
            {enEdicion
              ? "Dejela vacia para no cambiar la contrasena."
              : "Al menos 8 caracteres."}
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-sm-6">
            <label htmlFor="u-rol" className="form-label">Rol</label>
            <select
              id="u-rol"
              className="form-select"
              value={datos.rol}
              onChange={(e) => setDatos({ ...datos, rol: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{NOMBRE_ROL[r]}</option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6">
            <label htmlFor="u-activo" className="form-label">Estado</label>
            <select
              id="u-activo"
              className="form-select"
              value={datos.activo ? "1" : "0"}
              onChange={(e) => setDatos({ ...datos, activo: e.target.value === "1" })}
            >
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Matriz de permisos */}
      <Modal
        titulo="Matriz de permisos por rol"
        abierto={verMatriz}
        onCerrar={() => setVerMatriz(false)}
        tamano="xl"
      >
        <p className="text-secondary small">
          Estos son los permisos que el backend usa para proteger cada endpoint.
        </p>

        {!matriz ? (
          <Cargando />
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Permiso</th>
                  {ROLES.map((r) => (
                    <th key={r} className="text-center small">{NOMBRE_ROL[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todosLosPermisos.map((permiso) => (
                  <tr key={permiso}>
                    <td className="small"><code>{permiso}</code></td>
                    {ROLES.map((rol) => (
                      <td key={rol} className="text-center">
                        {matriz[rol].includes(permiso) ? (
                          <i className="bi bi-check-circle-fill text-success"></i>
                        ) : (
                          <i className="bi bi-dash text-secondary"></i>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Usuarios;
