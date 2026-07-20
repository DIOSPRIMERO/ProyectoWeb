// datos iniciales del sistema (se cargan al localStorage la primera vez)
export const SEED = {
  usuarios: [
    { id: 1, nombre: "Adriana Vargas", correo: "avargas@ucenfotec.ac.cr", rol: "administrador", estado: "activo" },
    { id: 2, nombre: "Marco Jimenez", correo: "mjimenez@ucenfotec.ac.cr", rol: "docente", estado: "activo" },
    { id: 3, nombre: "Karla Solano", correo: "ksolano@ucenfotec.ac.cr", rol: "investigador", estado: "activo" },
    { id: 4, nombre: "Diego Rojas", correo: "drojas@ucenfotec.ac.cr", rol: "lector", estado: "inactivo" }
  ],
  tipos: [
    { id: 1, nombre: "Tesis", descripcion: "Trabajo de grado de posgrado" },
    { id: 2, nombre: "Articulo cientifico", descripcion: "Publicacion arbitrada" },
    { id: 3, nombre: "Proyecto de investigacion", descripcion: "Proyecto formal institucional" },
    { id: 4, nombre: "Trabajo final de graduacion", descripcion: "TFG de bachillerato o licenciatura" },
    { id: 5, nombre: "Ponencia", descripcion: "Presentacion en congreso" }
  ],
  categorias: [
    { id: 1, nombre: "Pregrado" },
    { id: 2, nombre: "Posgrado" },
    { id: 3, nombre: "Investigacion aplicada" },
    { id: 4, nombre: "Divulgacion" }
  ],
  areas: [
    { id: 1, nombre: "Ingenieria del software" },
    { id: 2, nombre: "Ciberseguridad" },
    { id: 3, nombre: "Inteligencia artificial" },
    { id: 4, nombre: "Ciencia de datos" },
    { id: 5, nombre: "Redes y telecomunicaciones" }
  ],
  tecnologias: [
    { id: 1, nombre: "Java" },
    { id: 2, nombre: "Spring Boot" },
    { id: 3, nombre: "Python" },
    { id: 4, nombre: "React" },
    { id: 5, nombre: "SQL Server" },
    { id: 6, nombre: "Docker" },
    { id: 7, nombre: "TensorFlow" },
    { id: 8, nombre: "Node.js" }
  ],
  investigaciones: [
    { id: 1, nombre: "Exploratoria" },
    { id: 2, nombre: "Descriptiva" },
    { id: 3, nombre: "Correlacional" },
    { id: 4, nombre: "Aplicada" }
  ],
  carreras: [
    { id: 1, nombre: "Ingenieria del Software (Bachillerato)", codigo: "BISOFT" },
    { id: 2, nombre: "Tecnico en Desarrollo de Software", codigo: "SOFTN" },
    { id: 3, nombre: "Maestria en Ciberseguridad", codigo: "MCIBER" },
    { id: 4, nombre: "Maestria en Tecnologia de Datos", codigo: "MDATOS" }
  ],
  lineas: [
    { id: 1, nombre: "Desarrollo de software seguro", area: 2 },
    { id: 2, nombre: "Aprendizaje automatico", area: 3 },
    { id: 3, nombre: "Arquitectura de software", area: 1 },
    { id: 4, nombre: "Computacion en la nube", area: 5 },
    { id: 5, nombre: "Analitica de datos", area: 4 }
  ],
  producciones: [
    { id: 1, titulo: "Microservicios con Spring Boot para banca digital", tipo: 1, categoria: 2, area: 1, investigacion: 4, carrera: 1, linea: 3, tecnologias: [1, 2, 6], autor: "Karla Solano", anio: 2025, resumen: "Estudio sobre la migracion de un monolito bancario hacia microservicios con tolerancia a fallos.", documento: "tesis-microservicios.pdf", estado: "publicado", fecha: "2025-03-14" },
    { id: 2, titulo: "Deteccion de intrusos con redes neuronales", tipo: 2, categoria: 3, area: 2, investigacion: 4, carrera: 3, linea: 1, tecnologias: [3, 7], autor: "Marco Jimenez", anio: 2025, resumen: "Modelo de deteccion de anomalias en trafico de red usando aprendizaje profundo.", documento: "articulo-ids.pdf", estado: "publicado", fecha: "2025-05-02" },
    { id: 3, titulo: "Plataforma de analitica para retail", tipo: 3, categoria: 3, area: 4, investigacion: 2, carrera: 4, linea: 5, tecnologias: [3, 5], autor: "Adriana Vargas", anio: 2024, resumen: "Tablero de indicadores para decisiones de inventario basado en datos historicos.", documento: "proyecto-retail.pdf", estado: "publicado", fecha: "2024-11-20" },
    { id: 4, titulo: "App movil para gestion de citas medicas", tipo: 4, categoria: 1, area: 1, investigacion: 4, carrera: 2, linea: 3, tecnologias: [4, 8], autor: "Diego Rojas", anio: 2025, resumen: "Prototipo de aplicacion para agendar y administrar citas en clinicas privadas.", documento: "tfg-citas.pdf", estado: "borrador", fecha: "2025-06-01" },
    { id: 5, titulo: "Clasificador de imagenes medicas", tipo: 2, categoria: 3, area: 3, investigacion: 4, carrera: 4, linea: 2, tecnologias: [3, 7], autor: "Karla Solano", anio: 2024, resumen: "Comparativa de modelos de vision por computadora para apoyo diagnostico.", documento: "articulo-vision.pdf", estado: "publicado", fecha: "2024-09-10" },
    { id: 6, titulo: "Orquestacion de contenedores en la nube", tipo: 3, categoria: 3, area: 5, investigacion: 2, carrera: 1, linea: 4, tecnologias: [6, 8], autor: "Marco Jimenez", anio: 2025, resumen: "Guia practica de despliegue continuo con contenedores en ambientes productivos.", documento: "proyecto-nube.pdf", estado: "publicado", fecha: "2025-02-18" },
    { id: 7, titulo: "Seguridad en APIs REST con tokens", tipo: 4, categoria: 1, area: 2, investigacion: 1, carrera: 1, linea: 1, tecnologias: [1, 2], autor: "Diego Rojas", anio: 2024, resumen: "Implementacion de autenticacion basada en JWT para servicios institucionales.", documento: "tfg-apis.pdf", estado: "publicado", fecha: "2024-12-05" },
    { id: 8, titulo: "Pipeline de datos para sensores IoT", tipo: 3, categoria: 3, area: 4, investigacion: 2, carrera: 4, linea: 5, tecnologias: [3, 8], autor: "Adriana Vargas", anio: 2025, resumen: "Ingesta y procesamiento de datos de sensores en tiempo casi real.", documento: "proyecto-iot.pdf", estado: "borrador", fecha: "2025-04-22" },
    { id: 9, titulo: "Patrones de diseno en sistemas legados", tipo: 1, categoria: 2, area: 1, investigacion: 1, carrera: 1, linea: 3, tecnologias: [1, 5], autor: "Karla Solano", anio: 2023, resumen: "Refactorizacion de sistemas heredados aplicando patrones GoF.", documento: "tesis-patrones.pdf", estado: "publicado", fecha: "2023-10-30" },
    { id: 10, titulo: "Pruebas automatizadas en CI/CD", tipo: 5, categoria: 4, area: 1, investigacion: 2, carrera: 2, linea: 3, tecnologias: [6, 8], autor: "Marco Jimenez", anio: 2025, resumen: "Ponencia sobre integracion de pruebas en flujos de entrega continua.", documento: "ponencia-cicd.pdf", estado: "publicado", fecha: "2025-05-28" },
    { id: 11, titulo: "Cifrado homomorfico aplicado a salud", tipo: 2, categoria: 3, area: 2, investigacion: 4, carrera: 3, linea: 1, tecnologias: [3], autor: "Adriana Vargas", anio: 2024, resumen: "Procesamiento de datos sensibles sin descifrarlos en entornos clinicos.", documento: "articulo-cifrado.pdf", estado: "publicado", fecha: "2024-08-15" },
    { id: 12, titulo: "Recomendador de cursos con filtrado colaborativo", tipo: 4, categoria: 1, area: 3, investigacion: 3, carrera: 1, linea: 2, tecnologias: [3, 5], autor: "Diego Rojas", anio: 2025, resumen: "Sistema de recomendacion academica basado en historial de estudiantes.", documento: "tfg-recomendador.pdf", estado: "borrador", fecha: "2025-06-10" }
  ]
};
