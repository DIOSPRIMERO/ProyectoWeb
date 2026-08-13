// Formulario para registrar y modificar produccion academica.
import { useEffect, useState } from "react";
import { apiDocumentos, apiProducciones } from "../api/api";
import Modal from "./Modal";
import Mensaje from "./Mensaje";

// Formulario en blanco
const VACIO = {
  titulo: "",
  resumen: "",
  palabrasClave: "",
  anio: new Date().getFullYear(),
  estado: "borrador",
  doi: "",
  tipoId: "",
  categoriaId: "",
  areaId: "",
  tipoInvestigacionId: "",
  carreraId: "",
  lineaId: "",
};

function FormularioProduccion({ abierto, produccion, catalogos, onCerrar, onGuardado }) {
  const [datos, setDatos] = useState(VACIO);
  const [autores, setAutores] = useState([""]);
  const [tecnologias, setTecnologias] = useState([]);
  const [archivo, setArchivo] = useState(null);

  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const esEdicion = Boolean(produccion);

  // Al abrir el modal se cargan los datos de la produccion a editar,
  // o se limpia el formulario si es un registro nuevo.
  useEffect(() => {
    if (!abierto) return;

    setError("");
    setArchivo(null);

    if (produccion) {
      setDatos({
        titulo: produccion.titulo || "",
        resumen: produccion.resumen || "",
        palabrasClave: produccion.palabras_clave || "",
        anio: produccion.anio,
        estado: produccion.estado,
        doi: produccion.doi || "",
        tipoId: produccion.tipo_id || "",
        categoriaId: produccion.categoria_id || "",
        areaId: produccion.area_id || "",
        tipoInvestigacionId: produccion.tipo_investigacion_id || "",
        carreraId: produccion.carrera_id || "",
        lineaId: produccion.linea_id || "",
      });
      setAutores(produccion.autores && produccion.autores.length > 0 ? produccion.autores : [""]);
      setTecnologias(produccion.tecnologias ? produccion.tecnologias.map((t) => t.id) : []);
    } else {
      setDatos(VACIO);
      setAutores([""]);
      setTecnologias([]);
    }
  }, [abierto, produccion]);

  function cambiar(campo, valor) {
    setDatos({ ...datos, [campo]: valor });
  }

  function cambiarAutor(indice, valor) {
    const copia = [...autores];
    copia[indice] = valor;
    setAutores(copia);
  }

  function quitarAutor(indice) {
    setAutores(autores.filter((_, i) => i !== indice));
  }

  // Marca o desmarca una tecnologia
  function alternarTecnologia(id) {
    if (tecnologias.includes(id)) {
      setTecnologias(tecnologias.filter((t) => t !== id));
    } else {
      setTecnologias([...tecnologias, id]);
    }
  }

  // Revisa los datos antes de enviarlos. El backend valida de nuevo,
  // pero avisar aqui es mas rapido para el usuario.
  function validar() {
    if (datos.titulo.trim().length < 5) {
      return "El titulo debe tener al menos 5 caracteres";
    }
    if (!datos.tipoId) {
      return "Seleccione el tipo de produccion";
    }

    const anioMaximo = new Date().getFullYear() + 1;
    if (datos.anio < 1950 || datos.anio > anioMaximo) {
      return "El anio debe estar entre 1950 y " + anioMaximo;
    }

    const validos = autores.filter((a) => a.trim().length >= 3);
    if (validos.length === 0) {
      return "Registre al menos un autor";
    }

    // Validacion del PDF antes de subirlo
    if (archivo) {
      if (archivo.type !== "application/pdf") {
        return "El documento debe ser un archivo PDF";
      }
      if (archivo.size > 10 * 1024 * 1024) {
        return "El documento no puede pesar mas de 10 MB";
      }
    }

    return "";
  }

  async function guardar() {
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const cuerpo = {
        ...datos,
        titulo: datos.titulo.trim(),
        autores: autores.filter((a) => a.trim().length >= 3).map((a) => a.trim()),
        tecnologiasIds: tecnologias,
      };

      const guardada = esEdicion
        ? await apiProducciones.actualizar(produccion.id, cuerpo)
        : await apiProducciones.crear(cuerpo);

      // El PDF se sube despues, cuando ya existe el id de la produccion
      if (archivo) {
        await apiDocumentos.subir(guardada.id, archivo);
      }

      onGuardado();
      onCerrar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  // Los select de clasificacion. Se arman de una lista para no
  // repetir el mismo bloque seis veces.
  const selects = [
    { campo: "tipoId", etiqueta: "Tipo de produccion", opciones: "tipos-produccion", requerido: true },
    { campo: "categoriaId", etiqueta: "Categoria", opciones: "categorias" },
    { campo: "areaId", etiqueta: "Area de conocimiento", opciones: "areas" },
    { campo: "tipoInvestigacionId", etiqueta: "Tipo de investigacion", opciones: "tipos-investigacion" },
    { campo: "carreraId", etiqueta: "Carrera", opciones: "carreras" },
    { campo: "lineaId", etiqueta: "Linea de investigacion", opciones: "lineas" },
  ];

  return (
    <Modal
      titulo={esEdicion ? "Modificar produccion" : "Registrar produccion"}
      abierto={abierto}
      onCerrar={onCerrar}
      tamano="xl"
      pie={
        <>
          <button className="btn btn-outline-secondary" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
            {guardando && <span className="spinner-border spinner-border-sm me-2"></span>}
            Guardar
          </button>
        </>
      }
    >
      <Mensaje tipo="danger" texto={error} />

      <div className="row g-3">
        <div className="col-12">
          <label htmlFor="titulo" className="form-label">
            Titulo <span className="text-danger">*</span>
          </label>
          <input
            id="titulo"
            type="text"
            className="form-control"
            value={datos.titulo}
            onChange={(e) => cambiar("titulo", e.target.value)}
            maxLength="255"
          />
        </div>

        <div className="col-12">
          <label htmlFor="resumen" className="form-label">Resumen</label>
          <textarea
            id="resumen"
            className="form-control"
            rows="3"
            value={datos.resumen}
            onChange={(e) => cambiar("resumen", e.target.value)}
          />
        </div>

        <div className="col-12 col-md-6">
          <label htmlFor="palabras" className="form-label">Palabras clave</label>
          <input
            id="palabras"
            type="text"
            className="form-control"
            placeholder="separadas por coma"
            value={datos.palabrasClave}
            onChange={(e) => cambiar("palabrasClave", e.target.value)}
          />
        </div>

        <div className="col-6 col-md-3">
          <label htmlFor="anio" className="form-label">
            Anio <span className="text-danger">*</span>
          </label>
          <input
            id="anio"
            type="number"
            className="form-control"
            value={datos.anio}
            onChange={(e) => cambiar("anio", Number(e.target.value))}
          />
        </div>

        <div className="col-6 col-md-3">
          <label htmlFor="estado" className="form-label">Estado</label>
          <select
            id="estado"
            className="form-select"
            value={datos.estado}
            onChange={(e) => cambiar("estado", e.target.value)}
          >
            <option value="borrador">Borrador</option>
            <option value="revision">En revision</option>
            <option value="publicado">Publicado</option>
          </select>
        </div>

        {selects.map((s) => (
          <div className="col-12 col-md-4" key={s.campo}>
            <label htmlFor={s.campo} className="form-label">
              {s.etiqueta} {s.requerido && <span className="text-danger">*</span>}
            </label>
            <select
              id={s.campo}
              className="form-select"
              value={datos[s.campo]}
              onChange={(e) => cambiar(s.campo, e.target.value)}
            >
              <option value="">Seleccione...</option>
              {catalogos &&
                catalogos[s.opciones].map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
            </select>
          </div>
        ))}

        <div className="col-12 col-md-4">
          <label htmlFor="doi" className="form-label">DOI</label>
          <input
            id="doi"
            type="text"
            className="form-control"
            placeholder="10.1000/ejemplo"
            value={datos.doi}
            onChange={(e) => cambiar("doi", e.target.value)}
          />
        </div>

        {/* Autores: se pueden agregar y quitar */}
        <div className="col-12">
          <hr />
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label className="form-label mb-0">
              Autores <span className="text-danger">*</span>
            </label>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => setAutores([...autores, ""])}
            >
              <i className="bi bi-plus-lg me-1"></i>
              Agregar autor
            </button>
          </div>

          {autores.map((autor, indice) => (
            <div className="input-group mb-2" key={indice}>
              <input
                type="text"
                className="form-control"
                placeholder="Nombre completo del autor"
                value={autor}
                onChange={(e) => cambiarAutor(indice, e.target.value)}
              />
              {autores.length > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => quitarAutor(indice)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Tecnologias */}
        <div className="col-12">
          <hr />
          <label className="form-label">Tecnologias utilizadas</label>
          <div className="d-flex flex-wrap gap-3">
            {catalogos &&
              catalogos.tecnologias.map((t) => (
                <div className="form-check" key={t.id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={"tec" + t.id}
                    checked={tecnologias.includes(t.id)}
                    onChange={() => alternarTecnologia(t.id)}
                  />
                  <label className="form-check-label small" htmlFor={"tec" + t.id}>
                    {t.nombre}
                  </label>
                </div>
              ))}
          </div>
        </div>

        {/* Documento PDF */}
        <div className="col-12">
          <hr />
          <label htmlFor="documento" className="form-label">
            Documento PDF
            {esEdicion && produccion.documento_id && (
              <span className="badge text-bg-light ms-2">
                Actual: {produccion.nombre_original}
              </span>
            )}
          </label>
          <input
            id="documento"
            type="file"
            accept="application/pdf"
            className="form-control"
            onChange={(e) => setArchivo(e.target.files[0] || null)}
          />
          <div className="form-text">
            Solo PDF, hasta 10 MB. Si sube uno nuevo, reemplaza el anterior.
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default FormularioProduccion;
