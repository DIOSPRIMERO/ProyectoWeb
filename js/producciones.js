const POR_PAGINA = 5;
let pagina = 1;
let modalProd;

//Llena los <select> de los filtros con sus opciones
function llenarFiltros() {
  document.getElementById("filtro-tipo").innerHTML =
    `<option value="">Todos</option>` + opcionesSelect("tipos", null);
  document.getElementById("filtro-area").innerHTML =
    `<option value="">Todas</option>` + opcionesSelect("areas", null);
  document.getElementById("filtro-carrera").innerHTML =
    `<option value="">Todas</option>` + opcionesSelect("carreras", null);
}

//Devuelve solo las producciones que cumplen con la busqueda y los filtros
function filtrar() {
  const texto = document.getElementById("buscar").value.toLowerCase().trim();
  const tipo = document.getElementById("filtro-tipo").value;
  const area = document.getElementById("filtro-area").value;
  const carrera = document.getElementById("filtro-carrera").value;

  const todas = tabla("producciones");
  const resultado = [];

  for (let i = 0; i < todas.length; i++) {
    const p = todas[i];

    //Revisamos si el texto buscado aparece en el titulo o en el autor
    let coincideTexto = true;
    if (texto !== "") {
      const enTitulo = p.titulo.toLowerCase().includes(texto);
      const enAutor = p.autor.toLowerCase().includes(texto);
      coincideTexto = enTitulo || enAutor;
    }

    //Revisamos el filtro de tipo
    let coincideTipo = true;
    if (tipo !== "") {
      coincideTipo = p.tipo === Number(tipo);
    }

    //Revisamos el filtro de area
    let coincideArea = true;
    if (area !== "") {
      coincideArea = p.area === Number(area);
    }

    //Revisamos el filtro de carrera
    let coincideCarrera = true;
    if (carrera !== "") {
      coincideCarrera = p.carrera === Number(carrera);
    }

    //Si cumple con todo, lo agregamos al resultado
    if (coincideTexto && coincideTipo && coincideArea && coincideCarrera) {
      resultado.push(p);
    }
  }
  return resultado;
}

//Devuelve la etiqueta de color segun el estado de la produccion
function badgeEstado(estado) {
  let clase = "badge-estado-borrador";
  if (estado === "publicado") {
    clase = "badge-estado-publicado";
  }
  return `<span class="badge ${clase}">${estado}</span>`;
}

//Arma los botones de accion (ver, editar, eliminar) segun el rol
function acciones(p) {
  let html = `<a class="btn btn-sm btn-outline-primary" href="detalle.html?id=${p.id}" title="Ver"><i class="bi bi-eye"></i></a>`;
  if (puede("editar")) {
    html += ` <button class="btn btn-sm btn-outline-secondary" onclick="editar(${p.id})" title="Editar"><i class="bi bi-pencil"></i></button>`;
  }
  if (puede("eliminar")) {
    html += ` <button class="btn btn-sm btn-outline-danger" onclick="eliminar(${p.id})" title="Eliminar"><i class="bi bi-trash"></i></button>`;
  }
  return html;
}

//Dibuja la tabla de producciones con su paginacion
function pintarTabla() {
  const lista = filtrar();

  let totalPaginas = Math.ceil(lista.length / POR_PAGINA);
  if (totalPaginas < 1) {
    totalPaginas = 1;
  }
  if (pagina > totalPaginas) {
    pagina = totalPaginas;
  }

  const visibles = paginar(lista, pagina, POR_PAGINA);

  //Mostramos u ocultamos el mensaje de "sin resultados"
  if (lista.length === 0) {
    document.getElementById("sin-resultados").classList.remove("d-none");
  } else {
    document.getElementById("sin-resultados").classList.add("d-none");
  }

  //Armamos una fila por cada produccion de esta pagina
  let html = "";
  for (let i = 0; i < visibles.length; i++) {
    const p = visibles[i];
    html += `
    <tr>
      <td class="fw-semibold">${p.titulo}</td>
      <td>${nombrePorId("tipos", p.tipo)}</td>
      <td>${nombrePorId("areas", p.area)}</td>
      <td>${p.autor}</td>
      <td>${p.anio}</td>
      <td>${badgeEstado(p.estado)}</td>
      <td class="text-end text-nowrap">${acciones(p)}</td>
    </tr>`;
  }
  document.getElementById("cuerpo-tabla").innerHTML = html;

  //Dibujamos la paginacion y le decimos que hacer al cambiar de pagina
  renderPaginacion(document.getElementById("paginacion"), lista.length, pagina, POR_PAGINA, function (nuevaPagina) {
    pagina = nuevaPagina;
    pintarTabla();
  });
}

//Llena los select y los checkboxes de tecnologias del formulario
function llenarSelectsModal(p) {
  //Valores que vienen seleccionados (solo si estamos editando)
  let tipoSel = null;
  let catSel = null;
  let areaSel = null;
  let invSel = null;
  let carrSel = null;
  let lineaSel = null;
  let tecs = [];
  if (p) {
    tipoSel = p.tipo;
    catSel = p.categoria;
    areaSel = p.area;
    invSel = p.investigacion;
    carrSel = p.carrera;
    lineaSel = p.linea;
    tecs = p.tecnologias;
  }

  document.getElementById("f-tipo").innerHTML = opcionesSelect("tipos", tipoSel);
  document.getElementById("f-categoria").innerHTML = opcionesSelect("categorias", catSel);
  document.getElementById("f-area").innerHTML = opcionesSelect("areas", areaSel);
  document.getElementById("f-investigacion").innerHTML = opcionesSelect("investigaciones", invSel);
  document.getElementById("f-carrera").innerHTML = opcionesSelect("carreras", carrSel);
  document.getElementById("f-linea").innerHTML = opcionesSelect("lineas", lineaSel);

  //Armamos una casilla (checkbox) por cada tecnologia
  const listaTec = tabla("tecnologias");
  let html = "";
  for (let i = 0; i < listaTec.length; i++) {
    const t = listaTec[i];
    let marcado = "";
    if (tecs.includes(t.id)) {
      marcado = "checked";
    }
    html += `
    <div class="form-check">
      <input class="form-check-input" type="checkbox" value="${t.id}" id="tec${t.id}" ${marcado}>
      <label class="form-check-label" for="tec${t.id}">${t.nombre}</label>
    </div>`;
  }
  document.getElementById("f-tecnologias").innerHTML = html;
}

//Abre el formulario en modo "nuevo" o "editar"
function abrirModal(p) {
  //valores por defecto (cuando es una produccion nueva)
  let idProd = "";
  let titulo = "";
  let autor = "";
  let anio = "";
  let estado = "publicado";
  let resumen = "";
  let docActual = "";

  //Si estamos editando, usamos los valores de la produccion
  if (p) {
    document.getElementById("titulo-modal").textContent = "Editar produccion";
    idProd = p.id;
    titulo = p.titulo;
    autor = p.autor;
    anio = p.anio;
    estado = p.estado;
    resumen = p.resumen;
    if (p.documento) {
      docActual = "Documento actual: " + p.documento;
    }
  } else {
    document.getElementById("titulo-modal").textContent = "Nueva produccion";
  }

  document.getElementById("f-id").value = idProd;
  document.getElementById("f-titulo").value = titulo;
  document.getElementById("f-autor").value = autor;
  document.getElementById("f-anio").value = anio;
  document.getElementById("f-estado").value = estado;
  document.getElementById("f-resumen").value = resumen;
  document.getElementById("f-documento").value = "";
  document.getElementById("doc-actual").textContent = docActual;
  llenarSelectsModal(p);
  modalProd.show();
}

//Busca la produccion y abre el formulario para editarla
function editar(id) {
  const lista = tabla("producciones");
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].id === id) {
      abrirModal(lista[i]);
      return;
    }
  }
}

//Elimina una produccion (despues de confirmar)
function eliminar(id) {
  if (!confirm("Seguro que deseas eliminar esta produccion?")) {
    return;
  }
  const lista = tabla("producciones");
  const nuevaLista = [];
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].id !== id) {
      nuevaLista.push(lista[i]);
    }
  }
  guardarTabla("producciones", nuevaLista);
  aviso("Produccion eliminada.", "ok");
  pintarTabla();
}

//Revisa que el formulario este bien antes de guardar
function validarFormulario() {
  //Tomamos los valores que escribio el usuario en el formulario
  const titulo = document.getElementById("f-titulo").value.trim();
  const autor = document.getElementById("f-autor").value.trim();
  const anio = document.getElementById("f-anio").value;
  const archivo = document.getElementById("f-documento").files[0];

  //El titulo no puede quedar vacio
  if (titulo === "") {
    alert("El titulo es obligatorio.");
    return false;
  }

  //El titulo debe tener al menos 5 letras
  if (titulo.length < 5) {
    alert("El titulo debe tener al menos 5 caracteres.");
    return false;
  }

  //El autor no puede quedar vacio
  if (autor === "") {
    alert("El autor es obligatorio.");
    return false;
  }

  //El ano es obligatorio
  if (anio === "") {
    alert("El ano es obligatorio.");
    return false;
  }

  //El ano tiene que ser un numero
  if (isNaN(anio)) {
    alert("El ano debe ser un numero.");
    return false;
  }

  //El ano tiene que estar entre 1990 y 2026
  if (anio < 1990 || anio > 2026) {
    alert("El ano debe estar entre 1990 y 2026.");
    return false;
  }

  //Si el usuario eligio un archivo, debe ser un PDF
  if (archivo && archivo.type !== "application/pdf") {
    alert("El documento debe ser un archivo PDF.");
    return false;
  }

  //Si paso todas las revisiones, el formulario es valido
  return true;
}

//Guarda la produccion (la crea o la actualiza)
function guardar() {
  if (!validarFormulario()) {
    return;
  }

  const id = document.getElementById("f-id").value;
  const archivo = document.getElementById("f-documento").files[0];

  //Juntamos las tecnologias que quedaron marcadas
  const tecnologias = [];
  const checks = document.querySelectorAll("#f-tecnologias input:checked");
  for (let i = 0; i < checks.length; i++) {
    tecnologias.push(Number(checks[i].value));
  }

  //Armamos el objeto con todos los datos del formulario
  const datos = {
    titulo: document.getElementById("f-titulo").value.trim(),
    tipo: Number(document.getElementById("f-tipo").value),
    categoria: Number(document.getElementById("f-categoria").value),
    area: Number(document.getElementById("f-area").value),
    investigacion: Number(document.getElementById("f-investigacion").value),
    carrera: Number(document.getElementById("f-carrera").value),
    linea: Number(document.getElementById("f-linea").value),
    tecnologias: tecnologias,
    autor: document.getElementById("f-autor").value.trim(),
    anio: Number(document.getElementById("f-anio").value),
    estado: document.getElementById("f-estado").value,
    resumen: document.getElementById("f-resumen").value.trim()
  };

  const lista = tabla("producciones");
  if (id) {
    //Editar: buscamos la produccion y la reemplazamos
    for (let i = 0; i < lista.length; i++) {
      if (lista[i].id === Number(id)) {
        datos.id = lista[i].id;
        datos.fecha = lista[i].fecha;
        if (archivo) {
          datos.documento = archivo.name;
        } else {
          datos.documento = lista[i].documento;
        }
        lista[i] = datos;
      }
    }
    aviso("Produccion actualizada.", "ok");
  } else {
    //Crear: le damos id, documento y la fecha de hoy
    datos.id = nuevoId("producciones");
    if (archivo) {
      datos.documento = archivo.name;
    } else {
      datos.documento = "documento-sin-archivo.pdf";
    }
    datos.fecha = new Date().toISOString().slice(0, 10);
    lista.push(datos);
    aviso("Produccion registrada.", "ok");
  }
  guardarTabla("producciones", lista);
  modalProd.hide();
  pintarTabla();
}

//Cuando la pagina termina de cargar, preparamos todo
document.addEventListener("DOMContentLoaded", function () {
  modalProd = new bootstrap.Modal(document.getElementById("modal-produccion"));
  llenarFiltros();
  pintarTabla();

  //Si el rol no puede crear, escondemos el boton de nueva produccion
  if (!puede("crear")) {
    document.getElementById("btn-nuevo").classList.add("d-none");
  }
  document.getElementById("btn-nuevo").addEventListener("click", function () {
    abrirModal(null);
  });
  document.getElementById("btn-guardar").addEventListener("click", guardar);

  //Cada vez que cambia un filtro, volvemos a la pagina 1 y repintamos
  const filtros = ["buscar", "filtro-tipo", "filtro-area", "filtro-carrera"];
  for (let i = 0; i < filtros.length; i++) {
    document.getElementById(filtros[i]).addEventListener("input", function () {
      pagina = 1;
      pintarTabla();
    });
  }

  //El boton Limpiar borra la busqueda y los filtros
  document.getElementById("btn-limpiar").addEventListener("click", function () {
    document.getElementById("buscar").value = "";
    document.getElementById("filtro-tipo").value = "";
    document.getElementById("filtro-area").value = "";
    document.getElementById("filtro-carrera").value = "";
    pagina = 1;
    pintarTabla();
  });
});
