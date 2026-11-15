/* =========================================================
   Whiplash — Utilidades para armar el DOM
   Ayudas chicas que se repetían en varios componentes.
   ========================================================= */

// Crea un elemento con clase, texto y atributos en una sola llamada.
// El texto va siempre por textContent para que nunca se interprete como HTML.
export function createElement(tag, { className, text, attributes = {} } = {}, ...children) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  element.append(...children);
  return element;
}

// "1 resultado" / "3 resultados"
export function getResultsText(count) {
  return `${count} ${count === 1 ? "resultado" : "resultados"}`;
}

// Término de búsqueda que viene en la URL (?q=...), sin espacios sobrantes.
export function getSearchQuery() {
  return new URLSearchParams(location.search).get("q")?.trim() ?? "";
}

// Indicador de carga: un disco de vinilo que gira (estilos en
// css/componentes/cargando.css). `small` es la versión en línea
// para lugares angostos, como la fila de chips de género.
export function createLoader(text = "Cargando…", { small = false } = {}) {
  return createElement(
    "div",
    { className: small ? "cargando cargando-chico" : "cargando", attributes: { role: "status" } },
    createElement("span", { className: "spinner-disco", attributes: { "aria-hidden": "true" } }),
    createElement("span", { text }),
  );
}

// Muestra el resultado de un formulario en su <p class="mensaje-formulario">
// (con aria-live, así el lector de pantalla lo anuncia).
// `type` es "error" o "exito" y define el color.
export function showMessage(element, text, type = "error") {
  element.dataset.tipo = type;
  element.textContent = text;
}

// Aviso breve que aparece abajo de la pantalla y se va solo
// (estilos en css/componentes/toast.css). `type` es "exito" o
// "error". La región tiene role="status", así el lector de
// pantalla lo anuncia sin mover el foco.
const TOAST_DURATION = 4000;
let toastRegion = null;

export function showToast(text, type = "exito") {
  const toast = createElement("div", { className: "toast", text, attributes: { "data-tipo": type } });
  setTimeout(() => {
    toast.classList.add("toast-saliendo");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, TOAST_DURATION);

  if (toastRegion) {
    toastRegion.append(toast);
    return;
  }
  // La región se crea con el primer aviso. Algunos lectores de
  // pantalla no anuncian lo que llega junto con la región: el
  // texto se agrega un momento después.
  toastRegion = createElement("div", { className: "toasts", attributes: { role: "status" } });
  document.body.append(toastRegion);
  setTimeout(() => toastRegion.append(toast), 100);
}

// Mientras un formulario espera al servidor, su botón de envío
// queda deshabilitado (evita envíos dobles) y muestra `text`.
export async function withSubmitting(form, text, task) {
  const button = form.querySelector('[type="submit"]');
  const original = button.textContent;
  button.disabled = true;
  button.textContent = text;
  form.setAttribute("aria-busy", "true");
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.textContent = original;
    form.removeAttribute("aria-busy");
  }
}
