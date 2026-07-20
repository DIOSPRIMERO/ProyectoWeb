import { nombrePorId } from "../data/almacen.js";

// tabla que muestra los registros de un catalogo
function TablaMantenimiento({ config, filas, onEditar, onEliminar }) {
  // decide el texto a mostrar en una celda segun el tipo de campo
  const textoCelda = (campo, fila) => {
    const valor = fila[campo.key];
    // si el campo apunta a otra tabla mostramos el nombre
    if (campo.tipo === "selectTabla") {
      return nombrePorId(campo.tabla, valor);
    }
    // si tiene opciones fijas buscamos el texto de la opcion
    if (campo.opciones) {
      const op = campo.opciones.find((o) => o.valor === valor);
      if (op) {
        return op.texto;
      }
    }
    if (valor === "" || valor === undefined) {
      return "-";
    }
    return valor;
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            {config.campos.map((campo) => (
              <th key={campo.key}>{campo.label}</th>
            ))}
            <th className="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id}>
              {config.campos.map((campo) => (
                <td key={campo.key}>{textoCelda(campo, fila)}</td>
              ))}
              <td className="text-end text-nowrap">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => onEditar(fila)}>
                  <i className="bi bi-pencil"></i>
                </button>{" "}
                <button className="btn btn-sm btn-outline-danger" onClick={() => onEliminar(fila.id)}>
                  <i className="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TablaMantenimiento;
