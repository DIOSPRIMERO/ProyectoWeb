//cuantas producciones tienen un estado 
function contarPorEstado(lista, estado) {
  let total = 0;
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].estado === estado) {
      total++;
    }
  }
  return total;
}

//cuantas producciones pertenecen a un area
function contarPorArea(lista, areaId) {
  let total = 0;
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].area === areaId) {
      total++;
    }
  }
  return total;
}

//Dibuja las 4 tarjetas de indicadores del dashboard
function pintarIndicadores() {
  const prod = tabla("producciones");
  const publicadas = contarPorEstado(prod, "publicado");
  const borradores = contarPorEstado(prod, "borrador");

  const tarjetas = [
    { etiqueta: "Producciones", valor: prod.length, icono: "bi-journal-text" },
    { etiqueta: "Publicadas", valor: publicadas, icono: "bi-check-circle" },
    { etiqueta: "Borradores", valor: borradores, icono: "bi-pencil-square" },
    { etiqueta: "Areas activas", valor: tabla("areas").length, icono: "bi-diagram-3" }
  ];

  let html = "";
  for (let i = 0; i < tarjetas.length; i++) {
    const t = tarjetas[i];
    html += `
    <div class="col-6 col-lg-3">
      <div class="card tarjeta-stat h-100">
        <div class="card-body d-flex align-items-center gap-3">
          <i class="bi ${t.icono} fs-2 texto-marca"></i>
          <div>
            <div class="numero">${t.valor}</div>
            <div class="etiqueta">${t.etiqueta}</div>
          </div>
        </div>
      </div>
    </div>`;
  }
  document.getElementById("indicadores").innerHTML = html;
}

//Dibuja una barra por cada area mostrando cuantas producciones tiene
function pintarGraficoAreas() {
  const prod = tabla("producciones");
  const areas = tabla("areas");
  let total = prod.length;
  if (total === 0) {
    total = 1;
  }

  let html = "";
  for (let i = 0; i < areas.length; i++) {
    const a = areas[i];
    const cantidad = contarPorArea(prod, a.id);
    const porcentaje = Math.round((cantidad / total) * 100);
    html += `
      <div class="mb-3">
        <div class="d-flex justify-content-between small mb-1">
          <span>${a.nombre}</span><span class="fw-bold">${cantidad}</span>
        </div>
        <div class="bg-light rounded">
          <div class="barra-area" style="width:${porcentaje}%"></div>
        </div>
      </div>`;
  }
  document.getElementById("grafico-areas").innerHTML = html;
}

//Compara dos producciones por fecha, de la mas nueva a la mas vieja.
//Las fechas son textos tipo "2025-03-14", asi que se pueden comparar directo.
function compararPorFechaDesc(a, b) {
  if (a.fecha < b.fecha) {
    return 1;
  }
  if (a.fecha > b.fecha) {
    return -1;
  }
  return 0;
}

//Muestra las 5 producciones mas recientes
function pintarRecientes() {

  const copia = tabla("producciones").slice();
  copia.sort(compararPorFechaDesc);

  //Tomamos solo las primeras 5
  const recientes = copia.slice(0, 5);

  let html = "";
  for (let i = 0; i < recientes.length; i++) {
    const p = recientes[i];
    html += `
    <li class="list-group-item px-0">
      <a class="text-decoration-none fw-semibold texto-marca" href="detalle.html?id=${p.id}">${p.titulo}</a>
      <div class="small text-muted">${p.autor} - ${p.fecha}</div>
    </li>`;
  }
  document.getElementById("recientes").innerHTML = html;
}

pintarIndicadores();
pintarGraficoAreas();
pintarRecientes();
