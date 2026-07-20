import { useState, useEffect } from "react";
import Modal from "./Modal.jsx";
import { obtenerTabla } from "../data/almacen.js";

// valores por defecto para una produccion nueva
const vacio = {
  titulo: "",
  autor: "",
  anio: "",
  estado: "publicado",
  resumen: "",
  tipo: 1,
  categoria: 1,
  area: 1,
  investigacion: 1,
  carrera: 1,
  linea: 1,
  tecnologias: []
};

// modal con el formulario para crear o editar una produccion
function ModalProduccion({ produccion, visible, onGuardar, onCerrar }) {
  const [datos, setDatos] = useState(vacio);
  const [archivo, setArchivo] = useState(null);

  // listas para los menus desplegables
  const tipos = obtenerTabla("tipos");
  const categorias = obtenerTabla("categorias");
  const areas = obtenerTabla("areas");
  const investigaciones = obtenerTabla("investigaciones");
  const carreras = obtenerTabla("carreras");
  const lineas = obtenerTabla("lineas");
  const tecnologias = obtenerTabla("tecnologias");

  // llena el formulario segun sea nuevo o edicion
  useEffect(() => {
    if (produccion) {
      setDatos({ ...produccion });
    } else {
      setDatos(vacio);
    }
    setArchivo(null);
  }, [produccion, visible]);

  // cambia un campo de texto o select
  const cambiar = (campo, valor) => {
    setDatos({ ...datos, [campo]: valor });
  };

  // marca o desmarca una tecnologia
  const cambiarTecnologia = (id) => {
    let nuevas;
    if (datos.tecnologias.includes(id)) {
      nuevas = datos.tecnologias.filter((t) => t !== id);
    } else {
      nuevas = [...datos.tecnologias, id];
    }
    setDatos({ ...datos, tecnologias: nuevas });
  };

  // valida el formulario antes de guardar
  const guardar = () => {
    const titulo = datos.titulo.trim();
    const autor = datos.autor.trim();

    if (titulo === "") {
      alert("El titulo es obligatorio.");
      return;
    }
    if (titulo.length < 5) {
      alert("El titulo debe tener al menos 5 caracteres.");
      return;
    }
    if (autor === "") {
      alert("El autor es obligatorio.");
      return;
    }
    if (datos.anio === "") {
      alert("El ano es obligatorio.");
      return;
    }
    if (isNaN(datos.anio)) {
      alert("El ano debe ser un numero.");
      return;
    }
    if (datos.anio < 1990 || datos.anio > 2026) {
      alert("El ano debe estar entre 1990 y 2026.");
      return;
    }
    if (archivo && archivo.type !== "application/pdf") {
      alert("El documento debe ser un archivo PDF.");
      return;
    }

    // arma el nombre del documento 
    let nombreArchivo = null;
    if (archivo) {
      nombreArchivo = archivo.name;
    }
    onGuardar(datos, nombreArchivo);
  };

  return (
    <Modal
      titulo={produccion ? "Editar produccion" : "Nueva produccion"}
      visible={visible}
      onCerrar={onCerrar}
      onGuardar={guardar}
    >
      <div className="mb-3">
        <label className="form-label">Titulo</label>
        <input type="text" className="form-control" value={datos.titulo} onChange={(e) => cambiar("titulo", e.target.value)} />
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Autor</label>
          <input type="text" className="form-control" value={datos.autor} onChange={(e) => cambiar("autor", e.target.value)} />
        </div>
        <div className="col-md-3 mb-3">
          <label className="form-label">Ano</label>
          <input type="number" className="form-control" value={datos.anio} onChange={(e) => cambiar("anio", e.target.value)} />
        </div>
        <div className="col-md-3 mb-3">
          <label className="form-label">Estado</label>
          <select className="form-select" value={datos.estado} onChange={(e) => cambiar("estado", e.target.value)}>
            <option value="publicado">publicado</option>
            <option value="borrador">borrador</option>
          </select>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Tipo</label>
          <select className="form-select" value={datos.tipo} onChange={(e) => cambiar("tipo", Number(e.target.value))}>
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Categoria</label>
          <select className="form-select" value={datos.categoria} onChange={(e) => cambiar("categoria", Number(e.target.value))}>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Area</label>
          <select className="form-select" value={datos.area} onChange={(e) => cambiar("area", Number(e.target.value))}>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Tipo de investigacion</label>
          <select className="form-select" value={datos.investigacion} onChange={(e) => cambiar("investigacion", Number(e.target.value))}>
            {investigaciones.map((i) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
          </select>
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Carrera</label>
          <select className="form-select" value={datos.carrera} onChange={(e) => cambiar("carrera", Number(e.target.value))}>
            {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Linea de investigacion</label>
          <select className="form-select" value={datos.linea} onChange={(e) => cambiar("linea", Number(e.target.value))}>
            {lineas.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Resumen</label>
        <textarea className="form-control" rows="2" value={datos.resumen} onChange={(e) => cambiar("resumen", e.target.value)}></textarea>
      </div>

      <div className="mb-3">
        <label className="form-label">Tecnologias</label>
        <div className="d-flex flex-wrap gap-3">
          {tecnologias.map((t) => (
            <div className="form-check" key={t.id}>
              <input
                className="form-check-input"
                type="checkbox"
                id={"tec" + t.id}
                checked={datos.tecnologias.includes(t.id)}
                onChange={() => cambiarTecnologia(t.id)}
              />
              <label className="form-check-label" htmlFor={"tec" + t.id}>{t.nombre}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-2">
        <label className="form-label">Documento (PDF simulado)</label>
        <input type="file" className="form-control" accept="application/pdf" onChange={(e) => setArchivo(e.target.files[0])} />
      </div>
    </Modal>
  );
}

export default ModalProduccion;
