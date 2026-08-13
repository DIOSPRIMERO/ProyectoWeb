// Pruebas del componente de paginacion.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Paginacion from "../src/components/Paginacion";

describe("Paginacion", () => {
  it("con una sola pagina solo muestra el total", () => {
    render(
      <Paginacion
        paginacion={{ pagina: 1, totalPaginas: 1, total: 4, porPagina: 10 }}
        onCambiar={() => {}}
      />
    );

    expect(screen.getByText("4 registros")).toBeInTheDocument();
  });

  it("muestra el rango de registros visibles", () => {
    render(
      <Paginacion
        paginacion={{ pagina: 2, totalPaginas: 5, total: 47, porPagina: 10 }}
        onCambiar={() => {}}
      />
    );

    expect(screen.getByText("Mostrando 11-20 de 47")).toBeInTheDocument();
  });

  it("avisa que pagina se pidio al hacer clic", async () => {
    const onCambiar = vi.fn();

    render(
      <Paginacion
        paginacion={{ pagina: 1, totalPaginas: 5, total: 50, porPagina: 10 }}
        onCambiar={onCambiar}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onCambiar).toHaveBeenCalledWith(3);
  });

  it("desactiva el boton anterior en la primera pagina", () => {
    render(
      <Paginacion
        paginacion={{ pagina: 1, totalPaginas: 5, total: 50, porPagina: 10 }}
        onCambiar={() => {}}
      />
    );

    expect(screen.getByLabelText("Anterior").closest("li")).toHaveClass("disabled");
  });

  it("desactiva el boton siguiente en la ultima pagina", () => {
    render(
      <Paginacion
        paginacion={{ pagina: 5, totalPaginas: 5, total: 50, porPagina: 10 }}
        onCambiar={() => {}}
      />
    );

    expect(screen.getByLabelText("Siguiente").closest("li")).toHaveClass("disabled");
  });
});
