import { nombrePorId } from "../data/almacen.js";
import BadgeEstado from "./BadgeEstado.jsx";

// tabla que lista las producciones academicas
function TablaProducciones({ lista, puedeEditar, puedeEliminar, onVer, onEditar, onEliminar }) {
  // si no hay resultados mostramos un aviso
  if (lista.length === 0) {
    return <div className="alert alert-warning">No se encontraron producciones.</div>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>Titulo</th>
            <th>Tipo</th>
            <th>Area</th>
            <th>Autor</th>
            <th>Ano</th>
            <th>Estado</th>
            <th className="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => (
            <tr key={p.id}>
              <td className="fw-semibold">{p.titulo}</td>
              <td>{nombrePorId("tipos", p.tipo)}</td>
              <td>{nombrePorId("areas", p.area)}</td>
              <td>{p.autor}</td>
              <td>{p.anio}</td>
              <td><BadgeEstado estado={p.estado} /></td>
              <td className="text-end text-nowrap">
                <button className="btn btn-sm btn-outline-primary" onClick={() => onVer(p.id)}>
                  <i className="bi bi-eye"></i>
                </button>{" "}
                {puedeEditar && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => onEditar(p)}>
                    <i className="bi bi-pencil"></i>
                  </button>
                )}{" "}
                {puedeEliminar && (
                  <button className="btn btn-sm btn-outline-danger" onClick={() => onEliminar(p.id)}>
                    <i className="bi bi-trash"></i>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TablaProducciones;
