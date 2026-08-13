// Pruebas de la matriz de permisos (RBAC).
// No necesitan base de datos: solo revisan la logica de permisos.js
import { describe, expect, it } from "vitest";
const { permisosDe, tienePermiso, puedeEditar } = require("../src/permisos");

describe("matriz de permisos por rol", () => {
  it("el admin es el unico que gestiona usuarios", () => {
    expect(tienePermiso("admin", "usuarios.gestionar")).toBe(true);
    expect(tienePermiso("coordinador", "usuarios.gestionar")).toBe(false);
    expect(tienePermiso("docente", "usuarios.gestionar")).toBe(false);
    expect(tienePermiso("estudiante", "usuarios.gestionar")).toBe(false);
  });

  it("admin y coordinador gestionan catalogos", () => {
    expect(tienePermiso("admin", "catalogos.gestionar")).toBe(true);
    expect(tienePermiso("coordinador", "catalogos.gestionar")).toBe(true);
    expect(tienePermiso("docente", "catalogos.gestionar")).toBe(false);
  });

  it("el docente solo edita su propia produccion", () => {
    expect(tienePermiso("docente", "produccion.editar.propia")).toBe(true);
    expect(tienePermiso("docente", "produccion.editar.cualquiera")).toBe(false);
    expect(tienePermiso("docente", "produccion.eliminar")).toBe(false);
  });

  it("el estudiante no entra al dashboard", () => {
    expect(tienePermiso("estudiante", "dashboard.ver")).toBe(false);
    expect(tienePermiso("estudiante", "produccion.consultar")).toBe(true);
  });

  it("los cuatro roles pueden consultar y crear", () => {
    for (const rol of ["admin", "coordinador", "docente", "estudiante"]) {
      expect(tienePermiso(rol, "produccion.consultar")).toBe(true);
      expect(tienePermiso(rol, "produccion.crear")).toBe(true);
    }
  });

  it("un rol inventado no tiene ningun permiso", () => {
    expect(permisosDe("invitado")).toEqual([]);
    expect(tienePermiso("invitado", "produccion.consultar")).toBe(false);
  });
});

describe("puedeEditar", () => {
  const admin = { id: 1, rol: "admin" };
  const docente = { id: 7, rol: "docente" };

  it("el admin edita la produccion de cualquiera", () => {
    expect(puedeEditar(admin, 99)).toBe(true);
  });

  it("el docente edita la suya", () => {
    expect(puedeEditar(docente, 7)).toBe(true);
  });

  it("el docente NO edita la de otro", () => {
    expect(puedeEditar(docente, 8)).toBe(false);
  });

  it("sin usuario no se puede editar nada", () => {
    expect(puedeEditar(null, 7)).toBe(false);
  });
});
