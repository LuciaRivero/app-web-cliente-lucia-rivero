/* =========================================================
   Whiplash — <site-header current="merch">
   Encabezado común: menú mobile, logo, buscador, accesos
   de cuenta y navegación principal.
   - current: id del link activo (ver navigation.js).
   Con sesión abierta, el link de la cuenta se reemplaza por el
   menú de usuario (menu-usuario.js) y aparecen los links marcados
   con soloConSesion; se actualiza cada vez que la sesión cambia.
   Se arma en light DOM para que apliquen los estilos de
   css/layout/encabezado.css sin cambios.
   ========================================================= */

import { rutaDesdeRaiz } from "../servicios/datos.js";
import { CAMBIO_SESION, usuarioActual } from "../servicios/sesion.js";
import { crearElemento } from "../utilidades/dom.js";
import { crearMenuUsuario } from "./menu-usuario.js";
import { ACCOUNT_NAV, HOME, MAIN_NAV } from "./navigation.js";

const icono = (nombre) => rutaDesdeRaiz(`assets/img/iconos/icono-${nombre}.svg`);

function crearLista(links, actual, crearContenido) {
  return crearElemento(
    "ul",
    {},
    ...links.map((link) => {
      const enlace = crearElemento("a", { atributos: { href: rutaDesdeRaiz(link.ruta) } });
      crearContenido(enlace, link);
      if (link.id === actual) enlace.setAttribute("aria-current", "page");
      const item = crearElemento("li", {}, enlace);
      if (link.soloConSesion) item.dataset.soloConSesion = "";
      return item;
    }),
  );
}

class SiteHeader extends HTMLElement {
  connectedCallback() {
    if (this.childElementCount) return;
    const actual = this.getAttribute("current");

    // Estructura fija: no lleva datos externos, por eso se puede usar innerHTML.
    this.innerHTML = `
      <header class="encabezado-sitio">
        <div class="encabezado-superior">
          <button class="boton-menu" type="button" aria-label="Abrir menú"
            aria-expanded="false" aria-controls="menu-principal">
            <img class="icono-menu" src="${icono("menu")}" alt="" />
          </button>

          <a class="logo" href="${rutaDesdeRaiz(HOME.ruta)}">
            <img src="${rutaDesdeRaiz("assets/img/logo.svg")}" alt="Whiplash - logo" />
            <span>Whi<span class="p-acento">p</span>lash</span>
          </a>

          <form class="buscador" action="${rutaDesdeRaiz("pages/explorar.html")}" method="get" role="search">
            <label class="sr-only" for="busqueda">Buscar artistas, tracks o géneros</label>
            <input type="search" id="busqueda" name="q"
              placeholder="Buscar artistas, tracks o géneros..." />
            <button type="submit">Buscar</button>
          </form>

          <button class="boton-buscar" type="button" aria-label="Buscar">
            <img class="icono-buscar" src="${icono("buscar")}" alt="" />
          </button>

          <nav class="nav-cuenta" aria-label="Acciones de cuenta"></nav>
        </div>

        <nav class="nav-principal" id="menu-principal" aria-label="Categorías"></nav>
      </header>
    `;

    this.querySelector(".nav-cuenta").append(
      crearLista(ACCOUNT_NAV, actual, (enlace, link) => {
        enlace.className = link.clase;
        enlace.setAttribute("aria-label", link.texto);
        enlace.append(
          crearElemento("img", {
            clase: `icono-${link.icono}`,
            atributos: { src: icono(link.icono), alt: "" },
          }),
        );
      }),
    );
    this.enlaceCuenta = this.querySelector(".ir-cuenta");
    this.itemCuenta = this.enlaceCuenta.parentElement;

    this.querySelector(".nav-principal").append(
      crearLista(MAIN_NAV, actual, (enlace, link) => {
        enlace.textContent = link.texto;
      }),
    );

    this.actualizarSesion(actual);
    window.addEventListener(CAMBIO_SESION, () => this.actualizarSesion(actual));
  }

  // Alterna entre el link a Mi cuenta (sin sesión) y el menú de
  // usuario, y muestra u oculta los links que piden sesión.
  actualizarSesion(actual) {
    const usuario = usuarioActual();
    this.itemCuenta.replaceChildren(
      usuario ? crearMenuUsuario(usuario, { actual: actual === "cuenta" }) : this.enlaceCuenta,
    );
    for (const item of this.querySelectorAll("[data-solo-con-sesion]")) {
      item.hidden = !usuario;
    }
  }
}

customElements.define("site-header", SiteHeader);
