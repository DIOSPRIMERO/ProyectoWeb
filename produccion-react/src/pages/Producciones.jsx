import { useState, useEffect } from "react";
import { obtenerTabla, guardarTabla, nuevoId } from "../data/almacen.js";
import { puede } from "../auth/roles.js";
import BarraBusqueda from "../components/BarraBusqueda.jsx";
import FiltrosProduccion from "../components/FiltrosProduccion.jsx";
import TablaProducciones from "../components/TablaProducciones.jsx";
import Paginacion from "../components/Paginacion.jsx";
import ModalProduccion from "../components/ModalProduccion.jsx";

const POR_PAGINA = 5;

// pagina de gestion de produccion academica
function Producciones({ rol, onVerDetalle }) {
  const [producciones, setProducciones] = useState([]);
  const [texto, setTexto] = useState("");
  const [filtros, setFiltros] = useState({ tipo: "", area: "", carrera: "" });
  const [pagina, setPagina] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);

  // permisos del rol actual
  const puedeCrear = puede(rol, "crear");
  const puedeEditar = puede(rol, "editar");
  const puedeEliminar = puede(rol, "eliminar");

  // carga los datos al abrir la pagina
  useEffect(() => {
    setProducciones(obtenerTabla("producciones"));
  }, []);

  // cambia un filtro y vuelve a la pagina 1
  const cambiarFiltro = (campo, valor) => {
    setFiltros({ ...filtros, [campo]: valor });
    setPagina(1);
  };

  // aplica busqueda y filtros sobre la lista
  const filtradas = producciones.filter((p) => {
    let coincideTexto = true;
    if (texto !== "") {
      const t = texto.toLowerCase();
      coincideTexto = p.titulo.toLowerCase().includes(t) || p.autor.toLowerCase().includes(t);
    }
    let coincideTipo = filtros.tipo === "" || p.tipo === Number(filtros.tipo);
    let coincideArea = filtros.area === "" || p.area === Number(filtros.area);
    let coincideCarrera = filtros.carrera === "" || p.carrera === Number(filtros.carrera);
    return coincideTexto && coincideTipo && coincideArea && coincideCarrera;
  });

  // calcula las paginas y corta la lista de la pagina actual
  let totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  if (totalPaginas < 1) {
    totalPaginas = 1;
  }
  // si la pagina actual quedo fuera de rango, usamos la ultima
  let paginaEfectiva = pagina;
  if (paginaEfectiva > totalPaginas) {
    paginaEfectiva = totalPaginas;
  }
  const inicio = (paginaEfectiva - 1) * POR_PAGINA;
  const visibles = filtradas.slice(inicio, inicio + POR_PAGINA);

  // abre el modal para crear
  const nuevo = () => {
    setEnEdicion(null);
    setModalAbierto(true);
  };

  // abre el modal para editar
  const editar = (produccion) => {
    setEnEdicion(produccion);
    setModalAbierto(true);
  };

  // elimina una produccion
  const eliminar = (id) => {
    if (!confirm("Seguro que deseas eliminar esta produccion?")) {
      return;
    }
    const nueva = producciones.filter((p) => p.id !== id);
    guardarTabla("producciones", nueva);
    setProducciones(nueva);
  };

  // guarda una produccion (crea o edita)
  const guardar = (datos, nombreArchivo) => {
    let nueva;
    if (enEdicion) {
      // editar: reemplazamos la produccion con el mismo id
      nueva = producciones.map((p) => {
        if (p.id === enEdicion.id) {
          const actualizada = { ...datos, id: p.id, fecha: p.fecha };
          actualizada.anio = Number(datos.anio);
          actualizada.documento = nombreArchivo ? nombreArchivo : p.documento;
          return actualizada;
        }
        return p;
      });
    } else {
      // crear: le damos id, fecha de hoy y documento
      const creada = { ...datos };
      creada.id = nuevoId("producciones");
      creada.anio = Number(datos.anio);
      creada.fecha = new Date().toISOString().slice(0, 10);
      creada.documento = nombreArchivo ? nombreArchivo : "documento-sin-archivo.pdf";
      nueva = [...producciones, creada];
    }
    guardarTabla("producciones", nueva);
    setProducciones(nueva);
    setModalAbierto(false);
  };

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h1 className="texto-marca mb-0">Produccion academica</h1>
        {puedeCrear && (
          <button className="btn btn-marca" onClick={nuevo}>
            <i className="bi bi-plus-lg"></i> Nueva produccion
          </button>
        )}
      </div>

      <div className="card tarjeta mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <BarraBusqueda
                valor={texto}
                onCambiar={(v) => { setTexto(v); setPagina(1); }}
                placeholder="Buscar por titulo o autor"
              />
            </div>
            <div className="col-md-8">
              <FiltrosProduccion
                filtros={filtros}
                onCambiar={cambiarFiltro}
                tipos={obtenerTabla("tipos")}
                areas={obtenerTabla("areas")}
                carreras={obtenerTabla("carreras")}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card tarjeta">
        <div className="card-body">
          <TablaProducciones
            lista={visibles}
            puedeEditar={puedeEditar}
            puedeEliminar={puedeEliminar}
            onVer={onVerDetalle}
            onEditar={editar}
            onEliminar={eliminar}
          />
          <div className="mt-3">
            <Paginacion paginaActual={paginaEfectiva} totalPaginas={totalPaginas} onCambiar={setPagina} />
          </div>
        </div>
      </div>

      <ModalProduccion
        produccion={enEdicion}
        visible={modalAbierto}
        onGuardar={guardar}
        onCerrar={() => setModalAbierto(false)}
      />
    </div>
  );
}

export default Producciones;
