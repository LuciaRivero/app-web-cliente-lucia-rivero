/* =========================================================
   Whiplash — Utilidades para armar el DOM
   Ayudas chicas que se repetían en varios componentes.
   ========================================================= */

// Crea un elemento con clase, texto y atributos en una sola llamada.
// El texto va siempre por textContent para que nunca se interprete como HTML.
export function crearElemento(etiqueta, { clase, texto, atributos = {} } = {}, ...hijos) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  for (const [nombre, valor] of Object.entries(atributos)) {
    elemento.setAttribute(nombre, valor);
  }
  elemento.append(...hijos);
  return elemento;
}

// "1 resultado" / "3 resultados"
export function textoResultados(cantidad) {
  return `${cantidad} ${cantidad === 1 ? "resultado" : "resultados"}`;
}

// Término de búsqueda que viene en la URL (?q=...), sin espacios sobrantes.
export function leerConsulta() {
  return new URLSearchParams(location.search).get("q")?.trim() ?? "";
}

// Indicador de carga: un disco de vinilo que gira (estilos en
// css/componentes/cargando.css). `chico` es la versión en línea
// para lugares angostos, como la fila de chips de género.
export function crearCargando(texto = "Cargando…", { chico = false } = {}) {
  return crearElemento(
    "div",
    { clase: chico ? "cargando cargando-chico" : "cargando", atributos: { role: "status" } },
    crearElemento("span", { clase: "spinner-disco", atributos: { "aria-hidden": "true" } }),
    crearElemento("span", { texto }),
  );
}

// Muestra el resultado de un formulario en su <p class="mensaje-formulario">
// (con aria-live, así el lector de pantalla lo anuncia).
// `tipo` es "error" o "exito" y define el color.
export function mostrarMensaje(elemento, texto, tipo = "error") {
  elemento.dataset.tipo = tipo;
  elemento.textContent = texto;
}
