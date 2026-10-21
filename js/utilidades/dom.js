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

