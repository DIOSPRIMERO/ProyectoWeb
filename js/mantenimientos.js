// Configuracion de cada catalogo que titulo tiene y que campos maneja.
// req: true  campo es obligatorio
const CATALOGOS = {
  usuarios: {
    titulo: "Usuarios",
    campos: [
      { key: "nombre", label: "Nombre", tipo: "text", req: true },
      { key: "correo", label: "Correo", tipo: "email", req: true },
      { key: "rol", label: "Rol", tipo: "select", opciones: [{ v: "administrador", t: "Administrador" }, { v: "docente", t: "Docente" }, { v: "investigador", t: "Investigador" }, { v: "lector", t: "Lector" }] },
      { key: "estado", label: "Estado", tipo: "select", opciones: [{ v: "activo", t: "Activo" }, { v: "inactivo", t: "Inactivo" }] }
    ]
  },
  tipos: {
    titulo: "Tipos de produccion academica",
    campos: [
      { key: "nombre", label: "Nombre", tipo: "text", req: true },
      { key: "descripcion", label: "Descripcion", tipo: "text", req: false }
    ]
  },
  categorias: { titulo: "Categorias", campos: [{ key: "nombre", label: "Nombre", tipo: "text", req: true }] },
  areas: { titulo: "Areas de conocimiento", campos: [{ key: "nombre", label: "Nombre", tipo: "text", req: true }] },
  tecnologias: { titulo: "Tecnologias", campos: [{ key: "nombre", label: "Nombre", tipo: "text", req: true }] },
  investigaciones: { titulo: "Tipos de investigacion", campos: [{ key: "nombre", label: "Nombre", tipo: "text", req: true }] },
  carreras: {
    titulo: "Carreras",
    campos: [
      { key: "nombre", label: "Nombre", tipo: "text", req: true },
      { key: "codigo", label: "Codigo", tipo: "text", req: true }
    ]
  },
  lineas: {
    titulo: "Lineas de investigacion",
    campos: [
      { key: "nombre", label: "Nombre", tipo: "text", req: true },
      { key: "area", label: "Area", tipo: "select", tabla: "areas" }
    ]
  }
};

let catalogoActual = "usuarios";
let modalMant;

//Devuelve el texto que se muestra en la tabla para un campo
function valorVisible(campo, fila) {
  const valor = fila[campo.key];

  //Si el campo apunta a otra tabla, mostramos el nombre de esa tabla
  if (campo.tabla) {
    return nombrePorId(campo.tabla, valor);
  }

  //Si el campo tiene una lista de opciones fijas, buscamos su texto
  if (campo.opciones) {
    for (let i = 0; i < campo.opciones.length; i++) {
      if (campo.opciones[i].v === valor) {
        return campo.opciones[i].t;
      }
    }
    return valor;
  }

  //Si no, mostramos el valor tal cual (o un guion si esta vacio)
  if (valor !== null && valor !== undefined && valor !== "") {
    return valor;
  }
  return "-";
}

//Dibuja el menu lateral con la lista de catalogos
function renderMenu() {
  const menu = document.getElementById("menu-catalogos");
  const claves = Object.keys(CATALOGOS);

  let html = "";
  for (let i = 0; i < claves.length; i++) {
    const key = claves[i];
    let clase = "list-group-item list-group-item-action";
    if (key === catalogoActual) {
      clase += " active";
    }
    html += `<a href="#" class="${clase}" data-cat="${key}">${CATALOGOS[key].titulo}</a>`;
  }
  menu.innerHTML = html;

  //Le ponemos el clic a cada enlace del menu
  const enlaces = menu.querySelectorAll("a");
  for (let i = 0; i < enlaces.length; i++) {
    const enlace = enlaces[i];
    enlace.addEventListener("click", function (e) {
      e.preventDefault();
      catalogoActual = enlace.dataset.cat;
      renderMenu();
      renderTablaCatalogo();
    });
  }
}

//Dibuja la tabla del catalogo que esta seleccionado
function renderTablaCatalogo() {
  const cfg = CATALOGOS[catalogoActual];
  document.getElementById("titulo-catalogo").textContent = cfg.titulo;

  //fila de encabezados
  let cabecera = "<tr>";
  for (let i = 0; i < cfg.campos.length; i++) {
    cabecera += `<th>${cfg.campos[i].label}</th>`;
  }
  cabecera += `<th class="text-end">Acciones</th></tr>`;
  document.getElementById("cabecera-mant").innerHTML = cabecera;

  //fila por cada registro del catalogo
  const filas = tabla(catalogoActual);
  let cuerpo = "";
  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    cuerpo += "<tr>";
    for (let j = 0; j < cfg.campos.length; j++) {
      cuerpo += `<td>${valorVisible(cfg.campos[j], fila)}</td>`;
    }
    cuerpo += `
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-secondary" onclick="editarMant(${fila.id})"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarMant(${fila.id})"><i class="bi bi-trash"></i></button>
      </td>`;
    cuerpo += "</tr>";
  }
  document.getElementById("cuerpo-mant").innerHTML = cuerpo;
}

//Arma los campos del formulario segun el catalogo seleccionado
function camposFormulario(fila) {
  const cfg = CATALOGOS[catalogoActual];
  let html = "";

  //Recorremos cada campo del catalogo y armamos su control
  for (let i = 0; i < cfg.campos.length; i++) {
    const c = cfg.campos[i];

    //El valor actual (si estamos editando) o vacio (si es nuevo)
    let valor = "";
    if (fila) {
      valor = fila[c.key];
    }

    let control = "";
    if (c.tipo === "select") {
      // Armamos las opciones del select
      let opciones = "";
      if (c.tabla) {
        opciones = opcionesSelect(c.tabla, valor);
      } else {
        for (let j = 0; j < c.opciones.length; j++) {
          const o = c.opciones[j];
          let seleccion = "";
          if (o.v === valor) {
            seleccion = "selected";
          }
          opciones += `<option value="${o.v}" ${seleccion}>${o.t}</option>`;
        }
      }
      control = `<select class="form-select" id="m-${c.key}">${opciones}</select>`;
    } else {
      //Si es un input de texto o correo
      let valorTexto = "";
      if (valor) {
        valorTexto = valor;
      }
      control = `<input type="${c.tipo}" class="form-control" id="m-${c.key}" value="${valorTexto}">`;
    }

    html += `
      <div class="mb-3">
        <label class="form-label">${c.label}</label>
        ${control}
      </div>`;
  }

  return html;
}

//Abre el formulario en modo "nuevo" o "editar"
function abrirModalMant(fila) {
  if (fila) {
    document.getElementById("titulo-modal-mant").textContent = "Editar registro";
    document.getElementById("m-id").value = fila.id;
  } else {
    document.getElementById("titulo-modal-mant").textContent = "Nuevo registro";
    document.getElementById("m-id").value = "";
  }
  document.getElementById("campos-mant").innerHTML = camposFormulario(fila);
  modalMant.show();
}

//Busca el registro y abre el formulario para editarlo
function editarMant(id) {
  const lista = tabla(catalogoActual);
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].id === id) {
      abrirModalMant(lista[i]);
      return;
    }
  }
}

//Elimina un registro (despues de confirmar)
function eliminarMant(id) {
  if (!confirm("Eliminar este registro?")) {
    return;
  }
  const lista = tabla(catalogoActual);
  const nuevaLista = [];
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].id !== id) {
      nuevaLista.push(lista[i]);
    }
  }
  guardarTabla(catalogoActual, nuevaLista);
  aviso("Registro eliminado.", "ok");
  renderTablaCatalogo();
}

//Guarda el registro (lo crea o lo actualiza)
function guardarMant() {
  const cfg = CATALOGOS[catalogoActual];

  //Revis uno por uno los campos obligatorios del catalogo
  for (let i = 0; i < cfg.campos.length; i++) {
    const campo = cfg.campos[i];
    if (campo.req) {
      const valor = document.getElementById("m-" + campo.key).value.trim();
      if (valor === "") {
        alert("El campo " + campo.label + " es obligatorio.");
        return;
      }
    }
  }

  //Si el catalogo tiene correo (Usuarios), revisamos un formato basico
  const correo = document.getElementById("m-correo");
  if (correo && (!correo.value.includes("@") || !correo.value.includes("."))) {
    alert("El correo debe tener un formato valido (ejemplo: nombre@dominio.com).");
    return;
  }

  //Tomamos el valor de cada campo del formulario
  const id = document.getElementById("m-id").value;
  const datos = {};
  for (let i = 0; i < cfg.campos.length; i++) {
    const c = cfg.campos[i];
    let v = document.getElementById("m-" + c.key).value;
    // Si es un select que apunta a otra tabla, guardamos el numero
    if (c.tipo === "select" && c.tabla) {
      v = Number(v);
    }
    datos[c.key] = v;
  }

  const lista = tabla(catalogoActual);
  if (id) {
    //Editar: buscamos el registro y lo reemplazamos
    for (let i = 0; i < lista.length; i++) {
      if (lista[i].id === Number(id)) {
        datos.id = lista[i].id;
        lista[i] = datos;
      }
    }
    aviso("Registro actualizado.", "ok");
  } else {
    // Crear: le damos un id nuevo y lo agregamos
    datos.id = nuevoId(catalogoActual);
    lista.push(datos);
    aviso("Registro creado.", "ok");
  }
  guardarTabla(catalogoActual, lista);
  modalMant.hide();
  renderTablaCatalogo();
}

//Cuando la pagina termina de cargar, preparamos todo
document.addEventListener("DOMContentLoaded", function () {
  //Si el rol no tiene permiso de mantenimientos, mostramos el aviso de bloqueo
  if (!puede("mantenimientos")) {
    document.getElementById("bloqueado").classList.remove("d-none");
    document.getElementById("contenido-mant").classList.add("d-none");
    return;
  }

  modalMant = new bootstrap.Modal(document.getElementById("modal-mant"));
  renderMenu();
  renderTablaCatalogo();

  document.getElementById("btn-nuevo-mant").addEventListener("click", function () {
    abrirModalMant(null);
  });
  document.getElementById("btn-guardar-mant").addEventListener("click", guardarMant);
  document.getElementById("btn-reiniciar").addEventListener("click", function () {
    if (confirm("Esto restablece todos los datos simulados. Continuar?")) {
      reiniciarDatos();
    }
  });
});
