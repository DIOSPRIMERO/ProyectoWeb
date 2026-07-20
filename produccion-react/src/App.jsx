import { useState, useEffect } from "react";
import { inicializar } from "./data/almacen.js";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Producciones from "./pages/Producciones.jsx";
import DetalleProduccion from "./pages/DetalleProduccion.jsx";
import Mantenimientos from "./pages/Mantenimientos.jsx";

//controla la navegacion y el rol activo
function App() {
  const [vista, setVista] = useState("dashboard");
  const [detalleId, setDetalleId] = useState(null);
  const [rol, setRol] = useState("administrador");

  // al iniciar cargamos los datos y el rol guardado
  useEffect(() => {
    inicializar();
    const rolGuardado = localStorage.getItem("rol_actual");
    if (rolGuardado) {
      setRol(rolGuardado);
    }
  }, []);

  // cambia de pagina
  const navegar = (nuevaVista) => {
    setVista(nuevaVista);
  };

  // abre el detalle de una produccion
  const verDetalle = (id) => {
    setDetalleId(id);
    setVista("detalle");
  };

  // cambia el rol y lo guarda en el navegador
  const cambiarRol = (nuevoRol) => {
    setRol(nuevoRol);
    localStorage.setItem("rol_actual", nuevoRol);
    // si el rol nuevo no puede ver la vista actual, volvemos al inicio
    if (vista === "mantenimientos") {
      setVista("dashboard");
    }
  };

  // decide que pagina mostrar segun la vista
  const mostrarPagina = () => {
    if (vista === "producciones") {
      return <Producciones rol={rol} onVerDetalle={verDetalle} />;
    }
    if (vista === "detalle") {
      return <DetalleProduccion id={detalleId} onVolver={() => setVista("producciones")} />;
    }
    if (vista === "mantenimientos") {
      return <Mantenimientos rol={rol} />;
    }
    return <Dashboard onVerDetalle={verDetalle} />;
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header vista={vista} onNavegar={navegar} rol={rol} onCambiarRol={cambiarRol} />
      <main className="flex-grow-1">
        {mostrarPagina()}
      </main>
      <Footer />
    </div>
  );
}

export default App;
