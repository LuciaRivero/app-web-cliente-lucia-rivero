/* =========================================================
   Whiplash — Menú hamburguesa (mobile)
   Abre y cierra .nav-principal desde .boton-menu agregando
   .menu-abierto al encabezado, y mantiene aria-expanded.
   Se cierra con Escape, con un clic afuera y al pasar a
   desktop, donde el menú siempre está visible.
   ========================================================= */

const DESKTOP = window.matchMedia("(min-width: 769px)");

export function iniciarMenu() {
  const encabezado = document.querySelector(".encabezado-sitio");
  const boton = encabezado?.querySelector(".boton-menu");
  const menu = encabezado?.querySelector(".nav-principal");
  if (!boton || !menu) return;

  const estaAbierto = () => encabezado.classList.contains("menu-abierto");

  function abrir() {
    encabezado.classList.add("menu-abierto");
    boton.setAttribute("aria-expanded", "true");
    boton.setAttribute("aria-label", "Cerrar menú");
    menu.querySelector("a")?.focus();
  }

  function cerrar({ devolverFoco = false } = {}) {
    if (!estaAbierto()) return;
    encabezado.classList.remove("menu-abierto");
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-label", "Abrir menú");
    if (devolverFoco) boton.focus();
  }

  boton.addEventListener("click", (evento) => {
    evento.stopPropagation();
    if (estaAbierto()) cerrar();
    else abrir();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && estaAbierto()) cerrar({ devolverFoco: true });
  });

  document.addEventListener("click", (evento) => {
    if (!encabezado.contains(evento.target)) cerrar();
  });

  DESKTOP.addEventListener("change", (evento) => {
    if (evento.matches) cerrar();
  });
}
