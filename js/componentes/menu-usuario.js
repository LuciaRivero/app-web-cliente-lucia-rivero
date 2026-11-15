/* =========================================================
   Whiplash — Menú de usuario del encabezado
   Con sesión abierta, el acceso a la cuenta de <site-header>
   es un avatar que despliega nombre, email, Mi perfil, Ayuda
   y Cerrar sesión. Los administradores ven además
   Administrar productos y Administrar artistas; las cuentas
   de artista, Mi perfil de artista y Mi merch.
   Sigue el patrón "disclosure": un botón con
   aria-expanded que muestra u oculta un panel de enlaces.
   Se cierra con Escape, con un clic afuera o cuando el foco
   sale del menú.
   ========================================================= */

import { getRootPath } from "../servicios/datos.js";
import { signOut } from "../servicios/sesion.js";
import { createElement } from "../utilidades/dom.js";

const ICONS = getRootPath("assets/img/iconos/iconos.svg");
const SVG_NS = "http://www.w3.org/2000/svg";
const PANEL_ID = "menu-usuario-panel";

// `id` es el valor de current de <site-header> que marca la opción
// con aria-current="page". `for` limita quién la ve: "admin" (admin
// global) o "artista" (cuenta de artista que no es admin). Las dos
// versiones usan las mismas páginas, filtradas según quién entra.
const OPTIONS = [
  { id: "cuenta", text: "Mi perfil", path: "pages/cuenta.html", icon: "perfil" },
  { id: "admin", text: "Administrar productos", path: "pages/admin.html", icon: "administrar", for: "admin" },
  {
    id: "admin-artistas",
    text: "Administrar artistas",
    path: "pages/admin-artistas.html",
    icon: "microfono",
    for: "admin",
  },
  {
    id: "admin-artistas",
    text: "Mi perfil de artista",
    path: "pages/admin-artistas.html",
    icon: "microfono",
    for: "artista",
  },
  { id: "admin", text: "Mi merch", path: "pages/admin.html", icon: "administrar", for: "artista" },
  { id: "ayuda", text: "Ayuda", path: "pages/ayuda.html", icon: "ayuda" },
];

function isVisibleFor(option, user) {
  if (option.for === "admin") return user.esAdmin;
  if (option.for === "artista") return user.esArtista && !user.esAdmin;
  return true;
}

// "Ana Torres" → "AT", "Ana" → "A"
export function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

// El ícono va con createElementNS: los <svg> y <use> creados
// con createElement no se dibujan.
function createIcon(id) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "icono-menu-usuario");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `${ICONS}#${id}`);
  svg.append(use);
  return svg;
}

// La imagen del usuario si tiene una; si no, sus iniciales.
// Es decorativa: el nombre ya está en el texto que la acompaña.
function createAvatar(user, className = "") {
  const avatar = createElement("span", {
    className: `avatar ${className}`.trim(),
    attributes: { "aria-hidden": "true" },
  });
  if (user.imagen) {
    avatar.append(createElement("img", { attributes: { src: user.imagen, alt: "" } }));
  } else {
    avatar.textContent = getInitials(user.nombre);
  }
  return avatar;
}

export function createUserMenu(user, { current = null } = {}) {
  const button = createElement(
    "button",
    {
      className: "boton-usuario",
      attributes: {
        type: "button",
        "aria-expanded": "false",
        "aria-controls": PANEL_ID,
        "aria-label": `Menú de ${user.nombre}`,
      },
    },
    createAvatar(user),
  );

  const profile = createElement(
    "div",
    { className: "menu-usuario-perfil" },
    createAvatar(user, "avatar-grande"),
    createElement(
      "div",
      { className: "menu-usuario-datos" },
      createElement("p", { className: "menu-usuario-nombre", text: user.nombre }),
      createElement("p", { className: "menu-usuario-email", text: user.email }),
    ),
  );

  const options = createElement(
    "ul",
    { className: "menu-usuario-opciones" },
    ...OPTIONS.filter((option) => isVisibleFor(option, user)).map(({ id, text, path, icon }) => {
      const link = createElement(
        "a",
        { className: "menu-usuario-opcion", attributes: { href: getRootPath(path) } },
        createIcon(icon),
        createElement("span", { text }),
      );
      if (id === current) link.setAttribute("aria-current", "page");
      return createElement("li", {}, link);
    }),
  );

  const signOutButton = createElement(
    "button",
    { className: "menu-usuario-opcion menu-usuario-salir", attributes: { type: "button" } },
    createIcon("salir"),
    createElement("span", { text: "Cerrar sesión" }),
  );

  const panel = createElement(
    "div",
    { className: "menu-usuario-panel", attributes: { id: PANEL_ID, hidden: "" } },
    profile,
    options,
    signOutButton,
  );

  const menu = createElement("div", { className: "menu-usuario" }, button, panel);

  // El listener del documento solo existe con el menú abierto,
  // así no se acumulan cuando el encabezado vuelve a dibujarlo.
  function closeOnOutsideClick(event) {
    if (!menu.contains(event.target)) close();
  }

  function open() {
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    document.addEventListener("click", closeOnOutsideClick);
  }

  function close({ returnFocus = false } = {}) {
    if (panel.hidden) return;
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", closeOnOutsideClick);
    if (returnFocus) button.focus();
  }

  button.addEventListener("click", () => {
    if (panel.hidden) open();
    else close();
  });

  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      event.stopPropagation();
      close({ returnFocus: true });
    }
  });

  menu.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !menu.contains(event.relatedTarget)) close();
  });

  // Igual que el ingreso, cerrar sesión termina en la home.
  signOutButton.addEventListener("click", () => {
    close();
    signOut();
    location.href = getRootPath("index.html");
  });

  return menu;
}
