// Pruebas del servicio de OpenAlex.
// Se simula fetch para no depender de internet ni de la API real.
import { afterEach, describe, expect, it, vi } from "vitest";
const openalex = require("../src/services/openalexService");

// Respuesta de ejemplo de OpenAlex, con el resumen como indice invertido
const RESPUESTA = {
  results: [
    {
      display_name: "Microservicios en banca digital",
      publication_year: 2023,
      doi: "https://doi.org/10.1000/abc",
      abstract_inverted_index: { Un: [0], estudio: [1], sobre: [2], microservicios: [3] },
      authorships: [{ author: { display_name: "Karla Solano" } }],
      concepts: [{ display_name: "Software architecture" }],
      primary_location: { source: { display_name: "Revista de Ingenieria" } },
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("rearmarResumen", () => {
  it("convierte el indice invertido en texto legible", () => {
    const indice = { Hola: [0], mundo: [1] };
    expect(openalex.rearmarResumen(indice)).toBe("Hola mundo");
  });

  it("devuelve null si no hay resumen", () => {
    expect(openalex.rearmarResumen(null)).toBe(null);
    expect(openalex.rearmarResumen(undefined)).toBe(null);
  });
});

describe("normalizar", () => {
  it("deja los datos en el formato del proyecto", () => {
    const obra = openalex.normalizar(RESPUESTA.results[0]);

    expect(obra.titulo).toBe("Microservicios en banca digital");
    expect(obra.anio).toBe(2023);
    // el DOI se guarda sin la parte de la URL
    expect(obra.doi).toBe("10.1000/abc");
    expect(obra.resumen).toBe("Un estudio sobre microservicios");
    expect(obra.autores).toEqual(["Karla Solano"]);
    expect(obra.revista).toBe("Revista de Ingenieria");
  });

  it("no falla cuando faltan campos", () => {
    const obra = openalex.normalizar({});

    expect(obra.titulo).toBe("Sin titulo");
    expect(obra.anio).toBe(null);
    expect(obra.autores).toEqual([]);
  });
});

describe("buscar", () => {
  it("devuelve los resultados ya normalizados", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => RESPUESTA,
    }));

    const resultados = await openalex.buscar("microservicios", 5);

    expect(resultados).toHaveLength(1);
    expect(resultados[0].titulo).toBe("Microservicios en banca digital");
  });

  it("avisa cuando OpenAlex responde con error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    }));

    await expect(openalex.buscar("algo", 5)).rejects.toThrow("503");
  });

  it("devuelve lista vacia si no hay resultados", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    }));

    await expect(openalex.buscar("nada", 5)).resolves.toEqual([]);
  });
});
