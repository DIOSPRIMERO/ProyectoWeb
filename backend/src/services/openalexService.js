// ============================================================
// OpenAlex (API publica de produccion academica, sin clave)
//
// Se consulta desde el backend y se normaliza la respuesta a una
// estructura propia del proyecto, para que el frontend no dependa
// del formato de OpenAlex.
// ============================================================

// OpenAlex entrega el resumen como "indice invertido":
// { "palabra": [posiciones] }. Hay que rearmar el texto.
function rearmarResumen(indice) {
  if (!indice) return null;

  const palabras = [];
  for (const palabra in indice) {
    for (const posicion of indice[palabra]) {
      palabras[posicion] = palabra;
    }
  }

  const texto = palabras.filter(Boolean).join(" ").trim();
  return texto.length > 0 ? texto.slice(0, 3000) : null;
}

// Convierte un resultado de OpenAlex al formato que usa el proyecto.
function normalizar(obra) {
  return {
    titulo: obra.display_name || "Sin titulo",
    anio: obra.publication_year || null,
    doi: obra.doi ? String(obra.doi).replace("https://doi.org/", "") : null,
    resumen: rearmarResumen(obra.abstract_inverted_index),
    autores: (obra.authorships || []).slice(0, 10).map(function (a) {
      return (a.author && a.author.display_name) || "Autor desconocido";
    }),
    palabrasClave: (obra.concepts || []).slice(0, 5).map(function (c) {
      return c.display_name;
    }).filter(Boolean),
    revista:
      (obra.primary_location && obra.primary_location.source &&
        obra.primary_location.source.display_name) || null,
  };
}

async function buscar(termino, cantidad) {
  const parametros = new URLSearchParams({
    search: termino,
    per_page: String(cantidad || 10),
  });

  // OpenAlex no pide clave, solo un correo de contacto (opcional).
  if (process.env.OPENALEX_CORREO) {
    parametros.set("mailto", process.env.OPENALEX_CORREO);
  }

  const respuesta = await fetch("https://api.openalex.org/works?" + parametros);

  if (!respuesta.ok) {
    throw new Error("OpenAlex respondio con estado " + respuesta.status);
  }

  const datos = await respuesta.json();
  return (datos.results || []).map(normalizar);
}

module.exports = { buscar, normalizar, rearmarResumen };
