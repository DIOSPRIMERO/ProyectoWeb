// Guarda la sesion (usuario y permisos) y la comparte con toda la app.
import { createContext, useContext, useEffect, useState } from "react";
import { apiAuth, borrarToken, guardarToken, leerToken } from "./api/api";

const Contexto = createContext(null);

export function ProveedorSesion({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la aplicacion, si hay un token guardado se le pregunta
  // al backend quien es el usuario. Los permisos vienen del servidor,
  // nunca se calculan en el navegador.
  useEffect(() => {
    if (!leerToken()) {
      setCargando(false);
      return;
    }

    apiAuth
      .perfil()
      .then((respuesta) => setUsuario(respuesta.usuario))
      .catch(() => {
        borrarToken();
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, []);

  // Se llama despues de verificar el codigo del correo
  function iniciarSesion(token, datosUsuario) {
    guardarToken(token);
    setUsuario(datosUsuario);
  }

  function cerrarSesion() {
    borrarToken();
    setUsuario(null);
  }

  return (
    <Contexto.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </Contexto.Provider>
  );
}

export function useSesion() {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error("useSesion debe usarse dentro de ProveedorSesion");
  }
  return contexto;
}
