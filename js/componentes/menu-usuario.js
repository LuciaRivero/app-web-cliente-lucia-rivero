/* =========================================================
   Whiplash — Menú de usuario del encabezado
   Con sesión abierta, el acceso a la cuenta de <site-header>
   es un avatar que despliega nombre, email, Mi perfil, Ayuda
   y Cerrar sesión. Sigue el patrón "disclosure": un botón con
   aria-expanded que muestra u oculta un panel de enlaces.
   Se cierra con Escape, con un clic afuera o cuando el foco
   sale del menú.
   ========================================================= */

import { rutaDesdeRaiz } from "../servicios/datos.js";
import { cerrarSesion } from "../servicios/sesion.js";
import { crearElemento } from "../utilidades/dom.js";

const ICONOS = rutaDesdeRaiz("assets/img/iconos/iconos.svg");
const SVG_NS = "http://www.w3.org/2000/svg";
const ID_PANEL = "menu-usuario-panel";

const OPCIONES = [
  { texto: "Mi perfil", ruta: "pages/cuenta.html", icono: "perfil" },
  { texto: "Ayuda", ruta: "pages/ayuda.html", icono: "ayuda" },
];

// "Ana Torres" → "AT", "Ana" → "A"
export function iniciales(nombre) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}

// El ícono va con createElementNS: los <svg> y <use> creados
// con createElement no se dibujan.
function crearIcono(id) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "icono-menu-usuario");
  svg.setAttribute("aria-hidden", "true");
  const uso = document.createElementNS(SVG_NS, "use");
  uso.setAttribute("href", `${ICONOS}#${id}`);
  svg.append(uso);
  return svg;
}

// La imagen del usuario si tiene una; si no, sus iniciales.
// Es decorativa: el nombre ya está en el texto que la acompaña.
function crearAvatar(usuario, clase = "") {
  const avatar = crearElemento("span", {
    clase: `avatar ${clase}`.trim(),
    atributos: { "aria-hidden": "true" },
  });
  if (usuario.imagen) {
    avatar.append(crearElemento("img", { atributos: { src: usuario.imagen, alt: "" } }));
  } else {
    avatar.textContent = iniciales(usuario.nombre);
  }
  return avatar;
}

export function crearMenuUsuario(usuario, { actual = false } = {}) {
  const boton = crearElemento(
    "button",
    {
      clase: "boton-usuario",
      atributos: {
        type: "button",
        "aria-expanded": "false",
        "aria-controls": ID_PANEL,
        "aria-label": `Menú de ${usuario.nombre}`,
      },
    },
    crearAvatar(usuario),
  );

  const perfil = crearElemento(
    "div",
    { clase: "menu-usuario-perfil" },
    crearAvatar(usuario, "avatar-grande"),
    crearElemento(
      "div",
      { clase: "menu-usuario-datos" },
      crearElemento("p", { clase: "menu-usuario-nombre", texto: usuario.nombre }),
      crearElemento("p", { clase: "menu-usuario-email", texto: usuario.email }),
    ),
  );

  const opciones = crearElemento(
    "ul",
    { clase: "menu-usuario-opciones" },
    ...OPCIONES.map(({ texto, ruta, icono }) => {
      const enlace = crearElemento(
        "a",
        { clase: "menu-usuario-opcion", atributos: { href: rutaDesdeRaiz(ruta) } },
        crearIcono(icono),
        crearElemento("span", { texto }),
      );
      // Mi perfil se marca en la página Mi cuenta.
      if (actual && ruta === "pages/cuenta.html") enlace.setAttribute("aria-current", "page");
      return crearElemento("li", {}, enlace);
    }),
  );

  const salir = crearElemento(
    "button",
    { clase: "menu-usuario-opcion menu-usuario-salir", atributos: { type: "button" } },
    crearIcono("salir"),
    crearElemento("span", { texto: "Cerrar sesión" }),
  );

  const panel = crearElemento(
    "div",
    { clase: "menu-usuario-panel", atributos: { id: ID_PANEL, hidden: "" } },
    perfil,
    opciones,
    salir,
  );

  const menu = crearElemento("div", { clase: "menu-usuario" }, boton, panel);

  // El listener del documento solo existe con el menú abierto,
  // así no se acumulan cuando el encabezado vuelve a dibujarlo.
  function clicAfuera(evento) {
    if (!menu.contains(evento.target)) cerrar();
  }

  function abrir() {
    panel.hidden = false;
    boton.setAttribute("aria-expanded", "true");
    document.addEventListener("click", clicAfuera);
  }

  function cerrar({ devolverFoco = false } = {}) {
    if (panel.hidden) return;
    panel.hidden = true;
    boton.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", clicAfuera);
    if (devolverFoco) boton.focus();
  }

  boton.addEventListener("click", () => {
    if (panel.hidden) abrir();
    else cerrar();
  });

  menu.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !panel.hidden) {
      evento.stopPropagation();
      cerrar({ devolverFoco: true });
    }
  });

  menu.addEventListener("focusout", (evento) => {
    if (evento.relatedTarget && !menu.contains(evento.relatedTarget)) cerrar();
  });

  // Igual que el ingreso, cerrar sesión termina en la home.
  salir.addEventListener("click", () => {
    cerrar();
    cerrarSesion();
    location.href = rutaDesdeRaiz("index.html");
  });

  return menu;
}
