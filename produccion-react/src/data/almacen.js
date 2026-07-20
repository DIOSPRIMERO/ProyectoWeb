import { SEED } from "./seed.js";

// nombre se la llave donde guardamos todo en el navegador
const LLAVE = "produccion_academica";

// la primera vez copia los datos iniciales al localStorage
export const inicializar = () => {
  const guardado = localStorage.getItem(LLAVE);
  if (!guardado) {
    localStorage.setItem(LLAVE, JSON.stringify(SEED));
  }
};

// lee todo el objeto de datos desde el localStorage
const leerTodo = () => {
  const texto = localStorage.getItem(LLAVE);
  //  si todavia no hay datos los sembra
  if (!texto) {
    localStorage.setItem(LLAVE, JSON.stringify(SEED));
    return SEED;
  }
  return JSON.parse(texto);
};

// devuelve el arreglo de un catalogo por ejemplo "producciones
export const obtenerTabla = (nombre) => {
  const datos = leerTodo();
  return datos[nombre];
};

// reemplaza el arreglo de un catalogo y lo guarda en el localStorage
export const guardarTabla = (nombre, lista) => {
  const datos = leerTodo();
  datos[nombre] = lista;
  localStorage.setItem(LLAVE, JSON.stringify(datos));
};

// busca un registro por su id y devuelve su nombre o -si no existe
export const nombrePorId = (nombreTabla, id) => {
  const lista = obtenerTabla(nombreTabla);
  const encontrado = lista.find((item) => item.id === Number(id));
  if (encontrado) {
    return encontrado.nombre;
  }
  return "-";
};

// calcula el siguiente id (el mayor + 1)
export const nuevoId = (nombreTabla) => {
  const lista = obtenerTabla(nombreTabla);
  let max = 0;
  lista.forEach((item) => {
    if (item.id > max) {
      max = item.id;
    }
  });
  return max + 1;
};

// borra los datos guardados y vuelve a los iniciales
export const reiniciar = () => {
  localStorage.removeItem(LLAVE);
  inicializar();
};
