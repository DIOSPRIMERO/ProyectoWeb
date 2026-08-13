// Rutas de la aplicacion. Cada ruta privada indica el permiso que
// necesita; el backend revisa lo mismo por su cuenta.
import { Navigate, Route, Routes } from "react-router-dom";
import { useSesion } from "./SesionContexto";
import { puede } from "./permisos";
import Header from "./components/Header";
import Footer from "./components/Footer";
import RutaPrivada from "./components/RutaPrivada";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Producciones from "./pages/Producciones";
import Detalle from "./pages/Detalle";
import Catalogos from "./pages/Catalogos";
import Usuarios from "./pages/Usuarios";
import Importar from "./pages/Importar";

function App() {
  const { usuario } = useSesion();

  // El estudiante no tiene dashboard, asi que su inicio es el listado
  const inicio = puede(usuario, "dashboard.ver")
    ? <Dashboard />
    : <Navigate to="/producciones" replace />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="*"
        element={
          <div className="d-flex flex-column min-vh-100">
            <Header />

            <main className="flex-grow-1 bg-light">
              <Routes>
                <Route path="/" element={<RutaPrivada>{inicio}</RutaPrivada>} />

                <Route
                  path="/producciones"
                  element={
                    <RutaPrivada permiso="produccion.consultar">
                      <Producciones />
                    </RutaPrivada>
                  }
                />

                <Route
                  path="/producciones/:id"
                  element={
                    <RutaPrivada permiso="produccion.consultar">
                      <Detalle />
                    </RutaPrivada>
                  }
                />

                <Route
                  path="/importar"
                  element={
                    <RutaPrivada permiso="externa.importar">
                      <Importar />
                    </RutaPrivada>
                  }
                />

                <Route
                  path="/catalogos"
                  element={
                    <RutaPrivada permiso="catalogos.gestionar">
                      <Catalogos />
                    </RutaPrivada>
                  }
                />

                <Route
                  path="/usuarios"
                  element={
                    <RutaPrivada permiso="usuarios.gestionar">
                      <Usuarios />
                    </RutaPrivada>
                  }
                />

                <Route
                  path="*"
                  element={
                    <div className="container py-5 text-center">
                      <h1 className="h4">Pagina no encontrada</h1>
                      <a className="btn btn-primary mt-3" href="/">Volver al inicio</a>
                    </div>
                  }
                />
              </Routes>
            </main>

            <Footer />
          </div>
        }
      />
    </Routes>
  );
}

export default App;
