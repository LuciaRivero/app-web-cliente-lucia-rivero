/* =========================================================
   Whiplash — Menú lateral (mobile)
   .boton-menu abre .nav-principal como panel lateral agregando
   .menu-abierto al encabezado, y mantiene aria-expanded.
   Mientras está abierto, el foco no sale del panel (Tab da la
   vuelta) y la página no se desplaza. Se cierra con Escape,
   con el botón de cierre, tocando el fondo oscuro y al pasar
   a desktop, donde el menú siempre está visible.
   ========================================================= */

const DESKTOP = window.matchMedia("(min-width: 769px)");

export function initMenu() {
  const header = document.querySelector(".encabezado-sitio");
  const button = header?.querySelector(".boton-menu");
  const menu = header?.querySelector(".nav-principal");
  if (!button || !menu) return;
  const closeButton = menu.querySelector(".cerrar-menu");
  const backdrop = header.querySelector(".menu-fondo");

  const isOpen = () => header.classList.contains("menu-abierto");

  // Botón de cierre y links visibles (Mis artistas se oculta sin sesión).
  const getFocusable = () =>
    [...menu.querySelectorAll("button, a[href]")].filter((element) => !element.closest("[hidden]"));

  function open() {
    header.classList.add("menu-abierto");
    document.body.classList.add("menu-lateral-abierto");
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", "Cerrar menú");
    menu.querySelector("li:not([hidden]) a")?.focus();
  }

  function close({ returnFocus = false } = {}) {
    if (!isOpen()) return;
    header.classList.remove("menu-abierto");
    document.body.classList.remove("menu-lateral-abierto");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Abrir menú");
    if (returnFocus) button.focus();
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (isOpen()) close();
    else open();
  });

  closeButton?.addEventListener("click", () => close({ returnFocus: true }));
  backdrop?.addEventListener("click", () => close({ returnFocus: true }));

  document.addEventListener("keydown", (event) => {
    if (!isOpen()) return;
    if (event.key === "Escape") {
      close({ returnFocus: true });
      return;
    }
    // Foco atrapado: del último elemento vuelve al primero y al revés.
    if (event.key === "Tab" && !DESKTOP.matches) {
      const elements = getFocusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!menu.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) close();
  });

  DESKTOP.addEventListener("change", (event) => {
    if (event.matches) close();
  });
}
