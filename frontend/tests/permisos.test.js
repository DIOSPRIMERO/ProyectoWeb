// Pruebas de la logica de permisos del frontend.
import { describe, expect, it } from "vitest";
import { NOMBRE_ROL, puede, puedeEditar } from "../src/permisos";

// Arma un usuario de prueba
function usuario(id, rol, permisos) {
  return { id, rol, nombre: "Prueba", permisos };
}

describe("puede", () => {
  it("sin usuario no hay permisos", () => {
    expect(puede(null, "produccion.consultar")).toBe(false);
  });

  it("reconoce un permiso que si tiene", () => {
    const u = usuario(1, "docente", ["produccion.consultar"]);
    expect(puede(u, "produccion.consultar")).toBe(true);
  });

  it("niega un permiso que no tiene", () => {
    const u = usuario(1, "estudiante", ["produccion.consultar"]);
    expect(puede(u, "dashboard.ver")).toBe(false);
  });
});

describe("puedeEditar", () => {
  it("con editar.cualquiera puede con todas", () => {
    const u = usuario(1, "admin", ["produccion.editar.cualquiera"]);
    expect(puedeEditar(u, 99)).toBe(true);
  });

  it("con editar.propia solo con las suyas", () => {
    const u = usuario(7, "docente", ["produccion.editar.propia"]);
    expect(puedeEditar(u, 7)).toBe(true);
    expect(puedeEditar(u, 8)).toBe(false);
  });

  it("sin permisos de edicion no puede", () => {
    const u = usuario(7, "estudiante", ["produccion.consultar"]);
    expect(puedeEditar(u, 7)).toBe(false);
  });
});

describe("NOMBRE_ROL", () => {
  it("traduce los cuatro roles", () => {
    expect(NOMBRE_ROL.admin).toBe("Administrador");
    expect(NOMBRE_ROL.coordinador).toBe("Coordinador");
    expect(NOMBRE_ROL.estudiante).toBe("Estudiante");
  });
});
