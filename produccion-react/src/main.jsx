import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { inicializar } from "./data/almacen.js";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./estilos.css";

// cargamos los datos iniciales al localStorage antes de dibujar la app
inicializar();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
