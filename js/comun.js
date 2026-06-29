//Devuelve el nombre del archivo HTML que se esta viendo ahora
function paginaActual() {
  const ruta = location.pathname.split("/").pop();
  return ruta || "index.html";
}

//Arma la barra de navegacion de arriba
function renderNavbar() {
  const cont = document.getElementById("nav");
  if (!cont) return;
  const activa = paginaActual();

  const enlaces = [
    { href: "index.html", texto: "Inicio" },
    { href: "producciones.html", texto: "Produccion academica" },
    { href: "mantenimientos.html", texto: "Mantenimientos", permiso: "mantenimientos" }
  ];

  //hace los enlaces del menu, saltando los que el rol no puede ver
  let items = "";
  for (let i = 0; i < enlaces.length; i++) {
    const e = enlaces[i];
    if (e.permiso && !puede(e.permiso)) {
      continue;
    }
    let clase = "nav-link";
    if (e.href === activa) {
      clase = "nav-link active";
    }
    items += `<li class="nav-item"><a class="${clase}" href="${e.href}">${e.texto}</a></li>`;
  }

  //opciones para cambiar de rol
  let opcionesRol = "";
  for (let i = 0; i < ROLES.length; i++) {
    const r = ROLES[i];
    let sel = "";
    if (r.id === rolActual()) {
      sel = "active";
    }
    opcionesRol += `<li><a class="dropdown-item ${sel}" href="#" onclick="cambiarRol('${r.id}')">${r.nombre}</a></li>`;
  }

  cont.innerHTML = `
  <nav class="navbar navbar-expand-lg navbar-dark marca-nav">
    <div class="container">
      <a class="navbar-brand fw-bold" href="index.html">
        <span class="marca-cuadro">UC</span> Produccion Academica
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="menu">
        <ul class="navbar-nav me-auto">${items}</ul>
        <div class="dropdown">
          <button class="btn btn-rol dropdown-toggle" data-bs-toggle="dropdown">
            <i class="bi bi-person-badge"></i> ${nombreRol(rolActual())}
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><h6 class="dropdown-header">Cambiar rol</h6></li>
            ${opcionesRol}
          </ul>
        </div>
      </div>
    </div>
  </nav>`;
}

//pie de pagina
function renderFooter() {
  const cont = document.getElementById("pie");
  if (!cont) return;
  cont.innerHTML = `
  <footer class="pie text-center py-4 mt-5">
    <div class="container">
      <p class="mb-1 fw-bold">Universidad CENFOTEC</p>
      <p class="mb-0 small">Repositorio de Produccion Academica - Avance 1 - Programacion Web Avanzada</p>
    </div>
  </footer>`;
}

//Muestra un mensaje simple al usuario
function aviso(mensaje, tipo) {
  alert(mensaje);
}

//Devuelve solo los elementos que van en la pagina pedida
function paginar(lista, pagina, porPagina) {
  const inicio = (pagina - 1) * porPagina;
  return lista.slice(inicio, inicio + porPagina);
}

//Arma un boton de la paginacion (Anterior, numero o Siguiente)
function itemPaginacion(p, texto, deshabilitado, activo) {
  let clase = "page-item";
  if (deshabilitado) {
    clase += " disabled";
  }
  if (activo) {
    clase += " active";
  }
  return `<li class="${clase}"><a class="page-link" href="#" data-p="${p}">${texto}</a></li>`;
}

//Dibuja la barra de paginacion y le pone los clics
function renderPaginacion(contenedor, total, pagina, porPagina, alCambiar) {
  let paginas = Math.ceil(total / porPagina);
  if (paginas < 1) {
    paginas = 1;
  }

  let html = "";
  html += itemPaginacion(pagina - 1, "Anterior", pagina === 1, false);
  for (let p = 1; p <= paginas; p++) {
    html += itemPaginacion(p, p, false, p === pagina);
  }
  html += itemPaginacion(pagina + 1, "Siguiente", pagina === paginas, false);
  contenedor.innerHTML = `<ul class="pagination justify-content-center mb-0">${html}</ul>`;

  //Le pone el evento de clic a cada boton de pagina
  const botones = contenedor.querySelectorAll("a.page-link");
  for (let i = 0; i < botones.length; i++) {
    const boton = botones[i];
    boton.addEventListener("click", function (e) {
      e.preventDefault();
      const p = Number(boton.dataset.p);
      if (p >= 1 && p <= paginas) {
        alCambiar(p);
      }
    });
  }
}

//Arma las opciones de un <select> a partir de un catalogo
function opcionesSelect(nombreTabla, seleccionado) {
  const lista = tabla(nombreTabla);
  let html = "";
  for (let i = 0; i < lista.length; i++) {
    const o = lista[i];
    let sel = "";
    if (Number(seleccionado) === o.id) {
      sel = "selected";
    }
    html += `<option value="${o.id}" ${sel}>${o.nombre}</option>`;
  }
  return html;
}

// Cuando la pagina termina de cargar, dibujamos la barra y el pie
document.addEventListener("DOMContentLoaded", function () {
  renderNavbar();
  renderFooter();
});
