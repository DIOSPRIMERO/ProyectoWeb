// Pruebas de los endpoints con Supertest.
// Necesitan MySQL corriendo y los datos cargados con: npm run db:seed
import { afterAll, beforeAll, describe, expect, it } from "vitest";
require("dotenv").config();

const request = require("supertest");
const app = require("../src/app");
const { pool, consultarUna } = require("../src/config/database");
const { firmarToken } = require("../src/middlewares/auth");

// La contrasena que usa la semilla para los cuatro usuarios
const CLAVE = process.env.CLAVE_PRUEBAS || "Cenfotec2026!";

// Tokens de cada rol. Se firman directamente para no tener que pasar
// por el codigo de verificacion en cada prueba.
const tokens = {};

beforeAll(async () => {
  const roles = ["admin", "coordinador", "docente", "estudiante"];

  for (const rol of roles) {
    const usuario = await consultarUna("SELECT id, rol FROM usuarios WHERE rol = ? LIMIT 1", [rol]);
    if (!usuario) {
      throw new Error("Falta el usuario con rol " + rol + ". Ejecute: npm run db:seed");
    }
    tokens[rol] = firmarToken(usuario);
  }
});

// Al terminar se cierra el pool para que el proceso no quede colgado
afterAll(async () => {
  await pool.end();
});

// Atajo para enviar el token
function como(rol) {
  return { Authorization: "Bearer " + tokens[rol] };
}

// Cuerpo valido para crear una produccion
function nuevaProduccion(extra) {
  return Object.assign(
    {
      titulo: "Produccion de prueba " + Date.now(),
      resumen: "Resumen escrito por las pruebas automatizadas.",
      palabrasClave: "pruebas, vitest",
      anio: 2024,
      estado: "borrador",
      tipoId: 1,
      categoriaId: 1,
      areaId: 1,
      carreraId: 1,
      lineaId: 1,
      tipoInvestigacionId: 1,
      autores: ["Autor De Prueba"],
      tecnologiasIds: [1, 2],
    },
    extra || {}
  );
}

describe("GET /api/salud", () => {
  it("responde sin necesitar token", async () => {
    const r = await request(app).get("/api/salud");
    expect(r.status).toBe(200);
    expect(r.body.estado).toBe("ok");
  });
});

describe("Autenticacion", () => {
  it("el login pide el codigo de verificacion en lugar de dar el token", async () => {
    const r = await request(app)
      .post("/api/auth/login")
      .send({ correo: "admin@ucenfotec.ac.cr", contrasena: CLAVE });

    expect(r.status).toBe(200);
    expect(r.body.requiereVerificacion).toBe(true);
    // el token NO se entrega en este paso
    expect(r.body.token).toBeUndefined();
  });

  it("rechaza una contrasena incorrecta", async () => {
    const r = await request(app)
      .post("/api/auth/login")
      .send({ correo: "admin@ucenfotec.ac.cr", contrasena: "equivocada" });

    expect(r.status).toBe(401);
  });

  it("responde igual si el correo no existe (no revela cuentas)", async () => {
    const r = await request(app)
      .post("/api/auth/login")
      .send({ correo: "nadie@ucenfotec.ac.cr", contrasena: "Cualquiera1" });

    expect(r.status).toBe(401);
  });

  it("el codigo de verificacion incorrecto no da acceso", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ correo: "docente@ucenfotec.ac.cr", contrasena: CLAVE });

    const r = await request(app)
      .post("/api/auth/verificar")
      .send({ correo: "docente@ucenfotec.ac.cr", codigo: "000000" });

    // puede fallar por codigo incorrecto (401); nunca debe dar token
    expect(r.status).toBe(401);
    expect(r.body.token).toBeUndefined();
  });

  it("el codigo correcto entrega el token y los permisos", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ correo: "estudiante@ucenfotec.ac.cr", contrasena: CLAVE });

    // Se lee el codigo de la base, tal como lo recibiria el usuario por correo
    const usuario = await consultarUna("SELECT id FROM usuarios WHERE correo = ?", [
      "estudiante@ucenfotec.ac.cr",
    ]);
    const registro = await consultarUna(
      "SELECT codigo FROM codigos_verificacion WHERE usuario_id = ? AND usado = 0 ORDER BY id DESC LIMIT 1",
      [usuario.id]
    );

    const r = await request(app)
      .post("/api/auth/verificar")
      .send({ correo: "estudiante@ucenfotec.ac.cr", codigo: registro.codigo });

    expect(r.status).toBe(200);
    expect(typeof r.body.token).toBe("string");
    expect(r.body.usuario.rol).toBe("estudiante");
    expect(r.body.usuario.permisos).toContain("produccion.consultar");
    // la contrasena nunca sale en la respuesta
    expect(JSON.stringify(r.body)).not.toContain("hash");
  });

  it("el perfil devuelve el usuario conectado", async () => {
    const r = await request(app).get("/api/auth/perfil").set(como("docente"));

    expect(r.status).toBe(200);
    expect(r.body.usuario.rol).toBe("docente");
  });

  it("sin token no se puede consultar", async () => {
    const r = await request(app).get("/api/producciones");
    expect(r.status).toBe(401);
  });

  it("un token invalido se rechaza", async () => {
    const r = await request(app)
      .get("/api/producciones")
      .set({ Authorization: "Bearer token.falso.aqui" });

    expect(r.status).toBe(401);
  });
});

describe("Consulta de producciones", () => {
  it("devuelve datos y datos de paginacion", async () => {
    const r = await request(app).get("/api/producciones").set(como("admin"));

    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.datos)).toBe(true);
    expect(r.body.paginacion.total).toBeGreaterThan(0);
  });

  it("la pagina 2 trae registros distintos a la 1", async () => {
    const p1 = await request(app)
      .get("/api/producciones?pagina=1&porPagina=5&ordenarPor=titulo&direccion=asc")
      .set(como("admin"));
    const p2 = await request(app)
      .get("/api/producciones?pagina=2&porPagina=5&ordenarPor=titulo&direccion=asc")
      .set(como("admin"));

    const ids1 = p1.body.datos.map((d) => d.id);
    const ids2 = p2.body.datos.map((d) => d.id);

    expect(ids1).toHaveLength(5);
    expect(ids2).toHaveLength(5);
    expect(ids1.some((id) => ids2.includes(id))).toBe(false);
  });

  it("ordena por anio de forma ascendente", async () => {
    const r = await request(app)
      .get("/api/producciones?ordenarPor=anio&direccion=asc&porPagina=30")
      .set(como("admin"));

    const anios = r.body.datos.map((d) => d.anio);
    expect(anios).toEqual([...anios].sort((a, b) => a - b));
  });

  it("busca por texto en el titulo y el resumen", async () => {
    const r = await request(app)
      .get("/api/producciones?busqueda=microservicios")
      .set(como("admin"));

    expect(r.status).toBe(200);
    expect(r.body.paginacion.total).toBeGreaterThan(0);
  });

  it("busca por autor", async () => {
    const r = await request(app).get("/api/producciones?autor=Solano").set(como("admin"));

    expect(r.status).toBe(200);
    for (const p of r.body.datos) {
      expect(p.autores.some((a) => a.includes("Solano"))).toBe(true);
    }
  });

  it("combina filtro de anio y tipo en una sola consulta", async () => {
    const r = await request(app)
      .get("/api/producciones?anio=2023&tipo=1&porPagina=30")
      .set(como("admin"));

    expect(r.status).toBe(200);
    for (const p of r.body.datos) {
      expect(p.anio).toBe(2023);
      expect(p.tipo_id).toBe(1);
    }
  });

  it("filtra por tecnologia", async () => {
    const r = await request(app)
      .get("/api/producciones?tecnologia=1&porPagina=30")
      .set(como("admin"));

    expect(r.status).toBe(200);
    for (const p of r.body.datos) {
      expect(p.tecnologias.some((t) => t.id === 1)).toBe(true);
    }
  });

  it("no falla cuando la busqueda no encuentra nada", async () => {
    const r = await request(app)
      .get("/api/producciones?busqueda=zzzznoexistezzzz")
      .set(como("admin"));

    expect(r.status).toBe(200);
    expect(r.body.datos).toEqual([]);
    expect(r.body.paginacion.total).toBe(0);
  });

  it("devuelve 404 si el id no existe", async () => {
    const r = await request(app).get("/api/producciones/999999").set(como("admin"));
    expect(r.status).toBe(404);
  });
});

describe("Registro y edicion de producciones", () => {
  it("crea, consulta, edita y borra un registro", async () => {
    const creada = await request(app)
      .post("/api/producciones")
      .set(como("admin"))
      .send(nuevaProduccion());

    expect(creada.status).toBe(201);
    expect(creada.body.autores).toEqual(["Autor De Prueba"]);
    expect(creada.body.tecnologias).toHaveLength(2);

    const id = creada.body.id;

    const detalle = await request(app).get("/api/producciones/" + id).set(como("admin"));
    expect(detalle.status).toBe(200);

    const editada = await request(app)
      .put("/api/producciones/" + id)
      .set(como("admin"))
      .send(nuevaProduccion({ titulo: "Titulo corregido en la prueba", estado: "publicado" }));

    expect(editada.status).toBe(200);
    expect(editada.body.titulo).toBe("Titulo corregido en la prueba");
    expect(editada.body.estado).toBe("publicado");

    const borrada = await request(app).delete("/api/producciones/" + id).set(como("admin"));
    expect(borrada.status).toBe(204);

    const despues = await request(app).get("/api/producciones/" + id).set(como("admin"));
    expect(despues.status).toBe(404);
  });

  it("rechaza un titulo demasiado corto", async () => {
    const r = await request(app)
      .post("/api/producciones")
      .set(como("admin"))
      .send(nuevaProduccion({ titulo: "abc" }));

    expect(r.status).toBe(400);
  });

  it("rechaza un registro sin autores", async () => {
    const r = await request(app)
      .post("/api/producciones")
      .set(como("admin"))
      .send(nuevaProduccion({ autores: [] }));

    expect(r.status).toBe(400);
  });

  it("rechaza un anio fuera de rango", async () => {
    const r = await request(app)
      .post("/api/producciones")
      .set(como("admin"))
      .send(nuevaProduccion({ anio: 1800 }));

    expect(r.status).toBe(400);
  });
});

describe("Permisos por rol (RBAC)", () => {
  it("el estudiante puede consultar", async () => {
    const r = await request(app).get("/api/producciones").set(como("estudiante"));
    expect(r.status).toBe(200);
  });

  it("el estudiante NO entra al dashboard", async () => {
    const r = await request(app).get("/api/dashboard").set(como("estudiante"));
    expect(r.status).toBe(403);
  });

  it("el estudiante NO puede eliminar", async () => {
    const creada = await request(app)
      .post("/api/producciones")
      .set(como("admin"))
      .send(nuevaProduccion());

    const r = await request(app)
      .delete("/api/producciones/" + creada.body.id)
      .set(como("estudiante"));

    expect(r.status).toBe(403);

    await request(app).delete("/api/producciones/" + creada.body.id).set(como("admin"));
  });

  it("el docente NO puede editar la produccion de otro", async () => {
    const ajena = await request(app)
      .post("/api/producciones")
      .set(como("admin"))
      .send(nuevaProduccion());

    const r = await request(app)
      .put("/api/producciones/" + ajena.body.id)
      .set(como("docente"))
      .send(nuevaProduccion({ titulo: "Intento de edicion no permitida" }));

    expect(r.status).toBe(403);

    await request(app).delete("/api/producciones/" + ajena.body.id).set(como("admin"));
  });

  it("el docente SI puede editar la suya", async () => {
    const propia = await request(app)
      .post("/api/producciones")
      .set(como("docente"))
      .send(nuevaProduccion());

    expect(propia.status).toBe(201);

    const r = await request(app)
      .put("/api/producciones/" + propia.body.id)
      .set(como("docente"))
      .send(nuevaProduccion({ titulo: "Edicion valida de produccion propia" }));

    expect(r.status).toBe(200);

    await request(app).delete("/api/producciones/" + propia.body.id).set(como("admin"));
  });

  it("el docente NO administra catalogos, el coordinador SI", async () => {
    const negado = await request(app)
      .post("/api/catalogos/categorias")
      .set(como("docente"))
      .send({ nombre: "Categoria no permitida" });
    expect(negado.status).toBe(403);

    const nombre = "Categoria de prueba " + Date.now();
    const permitido = await request(app)
      .post("/api/catalogos/categorias")
      .set(como("coordinador"))
      .send({ nombre: nombre });
    expect(permitido.status).toBe(201);

    await request(app)
      .delete("/api/catalogos/categorias/" + permitido.body.id)
      .set(como("coordinador"));
  });

  it("solo el admin gestiona usuarios", async () => {
    const permitido = await request(app).get("/api/usuarios").set(como("admin"));
    expect(permitido.status).toBe(200);

    const negado = await request(app).get("/api/usuarios").set(como("coordinador"));
    expect(negado.status).toBe(403);
  });
});

describe("Mantenimientos de catalogos", () => {
  it("devuelve los siete catalogos de una sola vez", async () => {
    const r = await request(app).get("/api/catalogos").set(como("admin"));

    expect(r.status).toBe(200);
    expect(Object.keys(r.body)).toHaveLength(7);
    expect(r.body.tecnologias.length).toBeGreaterThan(0);
  });

  it("crea, edita y borra un registro", async () => {
    const nombre = "Tecnologia de prueba " + Date.now();

    const creada = await request(app)
      .post("/api/catalogos/tecnologias")
      .set(como("admin"))
      .send({ nombre: nombre });
    expect(creada.status).toBe(201);

    const editada = await request(app)
      .put("/api/catalogos/tecnologias/" + creada.body.id)
      .set(como("admin"))
      .send({ nombre: nombre + " editada" });
    expect(editada.status).toBe(200);

    const borrada = await request(app)
      .delete("/api/catalogos/tecnologias/" + creada.body.id)
      .set(como("admin"));
    expect(borrada.status).toBe(204);
  });

  it("no permite borrar un catalogo que esta en uso", async () => {
    // el tipo 1 lo usan las producciones cargadas por la semilla
    const r = await request(app).delete("/api/catalogos/tipos-produccion/1").set(como("admin"));
    expect(r.status).toBe(409);
  });

  it("rechaza un nombre muy corto", async () => {
    const r = await request(app)
      .post("/api/catalogos/areas")
      .set(como("admin"))
      .send({ nombre: "a" });

    expect(r.status).toBe(400);
  });

  it("devuelve 404 para un catalogo inexistente", async () => {
    const r = await request(app).get("/api/catalogos/inventado").set(como("admin"));
    expect(r.status).toBe(404);
  });
});

describe("Gestion documental", () => {
  // PDF minimo valido, suficiente para que Multer lo acepte
  const PDF = Buffer.from(
    "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
    "utf8"
  );

  it("sube, consulta, descarga y borra el PDF", async () => {
    const creada = await request(app)
      .post("/api/producciones")
      .set(como("admin"))
      .send(nuevaProduccion());
    const id = creada.body.id;

    const subida = await request(app)
      .post("/api/documentos/" + id)
      .set(como("admin"))
      .attach("documento", PDF, { filename: "tesis.pdf", contentType: "application/pdf" });

    expect(subida.status).toBe(201);
    expect(subida.body.nombre_original).toBe("tesis.pdf");

    // el detalle debe reportar el documento
    const detalle = await request(app).get("/api/producciones/" + id).set(como("admin"));
    expect(detalle.body.documento_id).not.toBe(null);

    const descarga = await request(app).get("/api/documentos/" + id).set(como("admin"));
    expect(descarga.status).toBe(200);
    expect(descarga.headers["content-disposition"]).toContain("attachment");

    const vista = await request(app).get("/api/documentos/" + id + "/ver").set(como("admin"));
    expect(vista.status).toBe(200);
    expect(vista.headers["content-disposition"]).toContain("inline");

    const borrado = await request(app).delete("/api/documentos/" + id).set(como("admin"));
    expect(borrado.status).toBe(204);

    await request(app).delete("/api/producciones/" + id).set(como("admin"));
  });

  it("rechaza un archivo que no es PDF", async () => {
    const creada = await request(app)
      .post("/api/producciones")
      .set(como("admin"))
      .send(nuevaProduccion());

    const r = await request(app)
      .post("/api/documentos/" + creada.body.id)
      .set(como("admin"))
      .attach("documento", Buffer.from("no soy pdf"), {
        filename: "notas.txt",
        contentType: "text/plain",
      });

    expect(r.status).toBe(400);
    expect(r.body.error).toContain("PDF");

    await request(app).delete("/api/producciones/" + creada.body.id).set(como("admin"));
  });

  it("devuelve 404 si la produccion no tiene documento", async () => {
    const creada = await request(app)
      .post("/api/producciones")
      .set(como("admin"))
      .send(nuevaProduccion());

    const r = await request(app).get("/api/documentos/" + creada.body.id).set(como("admin"));
    expect(r.status).toBe(404);

    await request(app).delete("/api/producciones/" + creada.body.id).set(como("admin"));
  });
});

describe("Dashboard", () => {
  it("devuelve indicadores calculados de la base de datos", async () => {
    const r = await request(app).get("/api/dashboard").set(como("admin"));

    expect(r.status).toBe(200);
    expect(r.body.totales.producciones).toBeGreaterThan(0);
    expect(r.body.porAnio.length).toBeGreaterThan(0);
    expect(r.body.porCarrera.length).toBeGreaterThan(0);
    expect(r.body.porArea.length).toBeGreaterThan(0);
    expect(r.body.porLinea.length).toBeGreaterThan(0);
    expect(r.body.tecnologias.length).toBeGreaterThan(0);
  });
});
