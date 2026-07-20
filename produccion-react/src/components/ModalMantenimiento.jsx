import { useState, useEffect } from "react";
import Modal from "./Modal.jsx";
import { obtenerTabla } from "../data/almacen.js";

// modal para crear o editar un registro de cualquier catalogo
function ModalMantenimiento({ config, registro, visible, onGuardar, onCerrar }) {
  // estado con los valores del formulario (un objeto con cada campo)
  const [valores, setValores] = useState({});

  // cuando cambia el registro o se abre el modal, llenamos el formulario
  useEffect(() => {
    const inicial = {};
    config.campos.forEach((campo) => {
      if (registro) {
        inicial[campo.key] = registro[campo.key];
      } else if (campo.tipo === "select") {
        inicial[campo.key] = campo.opciones[0].valor;
      } else if (campo.tipo === "selectTabla") {
        const lista = obtenerTabla(campo.tabla);
        inicial[campo.key] = lista[0].id;
      } else {
        inicial[campo.key] = "";
      }
    });
    setValores(inicial);
  }, [registro, visible, config]);

  // actualiza un campo del formulario
  const cambiar = (key, valor) => {
    setValores({ ...valores, [key]: valor });
  };

  // valida los campos obligatorios y el correo antes de guardar
  const guardar = () => {
    for (let i = 0; i < config.campos.length; i++) {
      const campo = config.campos[i];
      if (campo.req) {
        const valor = String(valores[campo.key] || "").trim();
        if (valor === "") {
          alert("El campo " + campo.label + " es obligatorio.");
          return;
        }
      }
    }

    // si el catalogo tiene correo revisamos un formato basico
    if (valores.correo !== undefined) {
      if (!valores.correo.includes("@") || !valores.correo.includes(".")) {
        alert("El correo debe tener un formato valido (ejemplo: nombre@dominio.com)");
        return;
      }
    }

    onGuardar(valores);
  };

  return (
    <Modal
      titulo={registro ? "Editar registro" : "Nuevo registro"}
      visible={visible}
      onCerrar={onCerrar}
      onGuardar={guardar}
    >
      {config.campos.map((campo) => (
        <div className="mb-3" key={campo.key}>
          <label className="form-label">{campo.label}</label>
          {campo.tipo === "select" && (
            <select className="form-select" value={valores[campo.key] || ""} onChange={(e) => cambiar(campo.key, e.target.value)}>
              {campo.opciones.map((o) => (
                <option key={o.valor} value={o.valor}>{o.texto}</option>
              ))}
            </select>
          )}
          {campo.tipo === "selectTabla" && (
            <select className="form-select" value={valores[campo.key] || ""} onChange={(e) => cambiar(campo.key, Number(e.target.value))}>
              {obtenerTabla(campo.tabla).map((item) => (
                <option key={item.id} value={item.id}>{item.nombre}</option>
              ))}
            </select>
          )}
          {campo.tipo !== "select" && campo.tipo !== "selectTabla" && (
            <input
              type={campo.tipo}
              className="form-control"
              value={valores[campo.key] || ""}
              onChange={(e) => cambiar(campo.key, e.target.value)}
            />
          )}
        </div>
      ))}
    </Modal>
  );
}

export default ModalMantenimiento;
