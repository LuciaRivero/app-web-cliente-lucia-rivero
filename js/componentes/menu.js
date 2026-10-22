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

export function iniciarMenu() {
  const encabezado = document.querySelector(".encabezado-sitio");
  const boton = encabezado?.querySelector(".boton-menu");
  const menu = encabezado?.querySelector(".nav-principal");
  if (!boton || !menu) return;
  const cerrarMenu = menu.querySelector(".cerrar-menu");
  const fondo = encabezado.querySelector(".menu-fondo");

  const estaAbierto = () => encabezado.classList.contains("menu-abierto");

  // Botón de cierre y links visibles (Mis artistas se oculta sin sesión).
  const enfocables = () =>
    [...menu.querySelectorAll("button, a[href]")].filter((elemento) => !elemento.closest("[hidden]"));

  function abrir() {
    encabezado.classList.add("menu-abierto");
    document.body.classList.add("menu-lateral-abierto");
    boton.setAttribute("aria-expanded", "true");
    boton.setAttribute("aria-label", "Cerrar menú");
    menu.querySelector("li:not([hidden]) a")?.focus();
  }

  function cerrar({ devolverFoco = false } = {}) {
    if (!estaAbierto()) return;
    encabezado.classList.remove("menu-abierto");
    document.body.classList.remove("menu-lateral-abierto");
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-label", "Abrir menú");
    if (devolverFoco) boton.focus();
  }

  boton.addEventListener("click", (evento) => {
    evento.stopPropagation();
    if (estaAbierto()) cerrar();
    else abrir();
  });

  cerrarMenu?.addEventListener("click", () => cerrar({ devolverFoco: true }));
  fondo?.addEventListener("click", () => cerrar({ devolverFoco: true }));

  document.addEventListener("keydown", (evento) => {
    if (!estaAbierto()) return;
    if (evento.key === "Escape") {
      cerrar({ devolverFoco: true });
      return;
    }
    // Foco atrapado: del último elemento vuelve al primero y al revés.
    if (evento.key === "Tab" && !DESKTOP.matches) {
      const elementos = enfocables();
      const primero = elementos[0];
      const ultimo = elementos.at(-1);
      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      } else if (!menu.contains(document.activeElement)) {
        evento.preventDefault();
        primero.focus();
      }
    }
  });

  document.addEventListener("click", (evento) => {
    if (!encabezado.contains(evento.target)) cerrar();
  });

  DESKTOP.addEventListener("change", (evento) => {
    if (evento.matches) cerrar();
  });
}
