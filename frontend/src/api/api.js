// Servicio centralizado de acceso al API.
// Todas las llamadas del frontend pasan por aqui, para no repetir
// el token ni el manejo de errores en cada pantalla.

const LLAVE_TOKEN = "token";

export function guardarToken(token) {
  localStorage.setItem(LLAVE_TOKEN, token);
}

export function leerToken() {
  return localStorage.getItem(LLAVE_TOKEN);
}

export function borrarToken() {
  localStorage.removeItem(LLAVE_TOKEN);
}

// Hace la peticion y devuelve el JSON. Si algo falla, lanza un Error
// con el mensaje que envio el backend.
async function peticion(ruta, opciones = {}) {
  const cabeceras = {};
  const token = leerToken();

  if (token) {
    cabeceras.Authorization = "Bearer " + token;
  }

  let cuerpo;
  if (opciones.formulario) {
    // FormData: el navegador pone el Content-Type con el limite correcto
    cuerpo = opciones.formulario;
  } else if (opciones.datos !== undefined) {
    cabeceras["Content-Type"] = "application/json";
    cuerpo = JSON.stringify(opciones.datos);
  }

  let respuesta;
  try {
    respuesta = await fetch("/api" + ruta, {
      method: opciones.metodo || "GET",
      headers: cabeceras,
      body: cuerpo,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revise que el backend este corriendo.");
  }

  // 204 no trae contenido
  if (respuesta.status === 204) {
    return null;
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.error || "Error " + respuesta.status);
  }

  return datos;
}

// Convierte un objeto en query string, ignorando los valores vacios
function comoQuery(objeto) {
  const parametros = new URLSearchParams();

  for (const clave in objeto) {
    const valor = objeto[clave];
    if (valor !== undefined && valor !== null && valor !== "") {
      parametros.set(clave, valor);
    }
  }

  const texto = parametros.toString();
  return texto ? "?" + texto : "";
}

// ------------------------------------------------------------
// Sesion
// ------------------------------------------------------------
export const apiAuth = {
  // Paso 1: valida la contrasena y envia el codigo por correo
  login: (correo, contrasena) =>
    peticion("/auth/login", { metodo: "POST", datos: { correo, contrasena } }),

  // Paso 2: valida el codigo y entrega el token
  verificar: (correo, codigo) =>
    peticion("/auth/verificar", { metodo: "POST", datos: { correo, codigo } }),

  registro: (nombre, correo, contrasena) =>
    peticion("/auth/registro", { metodo: "POST", datos: { nombre, correo, contrasena } }),

  perfil: () => peticion("/auth/perfil"),

  matrizPermisos: () => peticion("/auth/matriz-permisos"),
};

// ------------------------------------------------------------
// Produccion academica
// ------------------------------------------------------------
export const apiProducciones = {
  listar: (filtros) => peticion("/producciones" + comoQuery(filtros)),

  obtener: (id) => peticion("/producciones/" + id),

  crear: (datos) => peticion("/producciones", { metodo: "POST", datos }),

  actualizar: (id, datos) => peticion("/producciones/" + id, { metodo: "PUT", datos }),

  eliminar: (id) => peticion("/producciones/" + id, { metodo: "DELETE" }),

  anios: () => peticion("/producciones/anios"),
};

// ------------------------------------------------------------
// Documentos
// ------------------------------------------------------------
export const apiDocumentos = {
  subir: (produccionId, archivo) => {
    const formulario = new FormData();
    formulario.append("documento", archivo);
    return peticion("/documentos/" + produccionId, { metodo: "POST", formulario });
  },

  eliminar: (produccionId) => peticion("/documentos/" + produccionId, { metodo: "DELETE" }),

  // URL directa para descargar o mostrar el PDF.
  // El token va en la direccion porque un enlace o un <iframe>
  // no puede enviar la cabecera Authorization.
  urlDescarga: (produccionId) => "/api/documentos/" + produccionId + "?token=" + leerToken(),

  urlVista: (produccionId) => "/api/documentos/" + produccionId + "/ver?token=" + leerToken(),
};

// ------------------------------------------------------------
// Catalogos
// ------------------------------------------------------------
export const apiCatalogos = {
  todos: () => peticion("/catalogos"),

  lista: () => peticion("/catalogos/lista"),

  listar: (nombre, parametros) => peticion("/catalogos/" + nombre + comoQuery(parametros)),

  crear: (nombre, datos) => peticion("/catalogos/" + nombre, { metodo: "POST", datos }),

  actualizar: (nombre, id, datos) =>
    peticion("/catalogos/" + nombre + "/" + id, { metodo: "PUT", datos }),

  eliminar: (nombre, id) => peticion("/catalogos/" + nombre + "/" + id, { metodo: "DELETE" }),
};

// ------------------------------------------------------------
// Usuarios
// ------------------------------------------------------------
export const apiUsuarios = {
  listar: (parametros) => peticion("/usuarios" + comoQuery(parametros)),

  crear: (datos) => peticion("/usuarios", { metodo: "POST", datos }),

  actualizar: (id, datos) => peticion("/usuarios/" + id, { metodo: "PUT", datos }),

  desactivar: (id) => peticion("/usuarios/" + id, { metodo: "DELETE" }),
};

// ------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------
export const apiDashboard = {
  indicadores: () => peticion("/dashboard"),
};

// ------------------------------------------------------------
// API externa (OpenAlex)
// ------------------------------------------------------------
export const apiExterna = {
  buscar: (termino) => peticion("/externa/buscar" + comoQuery({ termino })),

  importar: (datos) => peticion("/externa/importar", { metodo: "POST", datos }),
};
