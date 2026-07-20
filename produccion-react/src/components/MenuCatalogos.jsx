import { CATALOGOS } from "../data/catalogos.js";

// menu lateral con la lista de catalogos de mantenimiento
function MenuCatalogos({ actual, onSeleccionar }) {
  // sacamos los nombres de los catalogos del objeto de configuracion
  const claves = Object.keys(CATALOGOS);

  return (
    <div className="list-group">
      {claves.map((key) => (
        <button
          key={key}
          className={key === actual ? "list-group-item list-group-item-action active" : "list-group-item list-group-item-action"}
          onClick={() => onSeleccionar(key)}
        >
          {CATALOGOS[key].titulo}
        </button>
      ))}
    </div>
  );
}

export default MenuCatalogos;
