//Lee el id que viene en la direccion, por ejemplo detalle.html?id=3
function obtenerId() {
  const parametros = new URLSearchParams(location.search);
  return Number(parametros.get("id"));
}

//descarga del documento mostrando un mensaje
function descargarSimulado(p) {
  alert("Descarga simulada del documento: " + p.documento +
    "\n\nEn la version final del sistema este boton descargara el archivo real desde el servidor.");
}

//Dibuja el detalle de una produccion
function pintarDetalle() {
  const id = obtenerId();

  //Buscamos la produccion que tenga ese id
  const lista = tabla("producciones");
  let p = null;
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].id === id) {
      p = lista[i];
    }
  }

  const cont = document.getElementById("detalle");
  if (!p) {
    cont.innerHTML = `<div class="alert alert-warning">No se encontro la produccion solicitada.</div>`;
    return;
  }

  //Armamos las etiquetas de tecnologias
  let tecs = "";
  for (let i = 0; i < p.tecnologias.length; i++) {
    const nombreTec = nombrePorId("tecnologias", p.tecnologias[i]);
    tecs += `<span class="badge text-bg-light border me-1">${nombreTec}</span>`;
  }
  if (tecs === "") {
    tecs = "Sin tecnologias asociadas.";
  }

  //color de la etiqueta segun el estado
  let clase = "badge-estado-borrador";
  if (p.estado === "publicado") {
    clase = "badge-estado-publicado";
  }

  //Si no hay resumen mostramos un texto por defecto
  let resumen = p.resumen;
  if (!resumen) {
    resumen = "Sin resumen registrado.";
  }

  cont.innerHTML = `
    <div class="card tarjeta">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <h1 class="texto-marca mb-1">${p.titulo}</h1>
          <span class="badge ${clase} fs-6">${p.estado}</span>
        </div>
        <p class="text-muted mb-4">${p.autor} - ${p.anio} - registrado el ${p.fecha}</p>

        <div class="row g-3 mb-4">
          ${dato("Tipo de produccion", nombrePorId("tipos", p.tipo))}
          ${dato("Categoria", nombrePorId("categorias", p.categoria))}
          ${dato("Area de conocimiento", nombrePorId("areas", p.area))}
          ${dato("Tipo de investigacion", nombrePorId("investigaciones", p.investigacion))}
          ${dato("Carrera", nombrePorId("carreras", p.carrera))}
          ${dato("Linea de investigacion", nombrePorId("lineas", p.linea))}
        </div>

        <h5 class="texto-marca">Resumen</h5>
        <p>${resumen}</p>

        <h5 class="texto-marca">Tecnologias</h5>
        <p>${tecs}</p>

        <h5 class="texto-marca">Documento</h5>
        <div class="zona-doc p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span><i class="bi bi-file-earmark-pdf texto-marca fs-4"></i> ${p.documento}</span>
          <button class="btn btn-marca" id="btn-descargar"><i class="bi bi-download"></i> Descargar documento</button>
        </div>
      </div>
    </div>`;

  document.getElementById("btn-descargar").addEventListener("click", function () {
    descargarSimulado(p);
  });
}

//Arma un bloque de "etiqueta + valor" para la cuadricula de datos
function dato(etiqueta, valor) {
  return `
    <div class="col-md-4">
      <div class="small text-uppercase text-muted">${etiqueta}</div>
      <div class="fw-semibold">${valor}</div>
    </div>`;
}

pintarDetalle();
