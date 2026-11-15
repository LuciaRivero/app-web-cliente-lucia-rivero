/* =========================================================
   Whiplash — <site-header current="merch">
   Encabezado común: menú mobile, logo, buscador, accesos
   de cuenta y navegación principal.
   - current: id del link activo (ver navigation.js).
   Con sesión abierta, el link de la cuenta se reemplaza por el
   menú de usuario (menu-usuario.js) y aparecen los links marcados
   con signedInOnly; se actualiza cada vez que la sesión cambia.
   El ícono del carrito lleva un contador con las unidades que
   hay en el carrito, que se actualiza cuando el carrito cambia.
   En mobile, .nav-principal es un panel lateral (ver menu.js)
   con botón de cierre y un link extra al Carrito.
   Se arma en light DOM para que apliquen los estilos de
   css/layout/encabezado.css sin cambios.
   ========================================================= */

import { countUnits, onCartChange } from "../servicios/carrito.js";
import { getRootPath } from "../servicios/datos.js";
import { SESSION_CHANGE, getCurrentUser } from "../servicios/sesion.js";
import { createElement } from "../utilidades/dom.js";
import { createUserMenu } from "./menu-usuario.js";
import { ACCOUNT_NAV, HOME, MAIN_NAV } from "./navigation.js";

const getIconUrl = (name) => getRootPath(`assets/img/iconos/icono-${name}.svg`);

function createList(links, current, fillLink) {
  return createElement(
    "ul",
    {},
    ...links.map((link) => {
      const anchor = createElement("a", { attributes: { href: getRootPath(link.path) } });
      fillLink(anchor, link);
      if (link.id === current) anchor.setAttribute("aria-current", "page");
      const item = createElement("li", {}, anchor);
      if (link.signedInOnly) item.dataset.soloConSesion = "";
      return item;
    }),
  );
}

class SiteHeader extends HTMLElement {
  connectedCallback() {
    if (this.childElementCount) return;
    const current = this.getAttribute("current");

    // Estructura fija: no lleva datos externos, por eso se puede usar innerHTML.
    this.innerHTML = `
      <header class="encabezado-sitio">
        <div class="encabezado-superior">
          <button class="boton-menu" type="button" aria-label="Abrir menú"
            aria-expanded="false" aria-controls="menu-principal">
            <img class="icono-menu" src="${getIconUrl("menu")}" alt="" />
          </button>

          <a class="logo" href="${getRootPath(HOME.path)}">
            <img src="${getRootPath("assets/img/logo.svg")}" alt="Whiplash - logo" />
            <span>Whi<span class="p-acento">p</span>lash</span>
          </a>

          <form class="buscador" action="${getRootPath("pages/explorar.html")}" method="get" role="search">
            <label class="sr-only" for="busqueda">Buscar artistas, tracks o géneros</label>
            <input type="search" id="busqueda" name="q"
              placeholder="Buscar artistas, tracks o géneros..." />
            <button type="submit">Buscar</button>
          </form>

          <button class="boton-buscar" type="button" aria-label="Buscar">
            <img class="icono-buscar" src="${getIconUrl("buscar")}" alt="" />
          </button>

          <nav class="nav-cuenta" aria-label="Acciones de cuenta"></nav>
        </div>

        <nav class="nav-principal" id="menu-principal" aria-label="Categorías">
          <button class="cerrar-menu" type="button" aria-label="Cerrar menú">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </nav>
        <div class="menu-fondo"></div>
      </header>
    `;

    this.querySelector(".nav-cuenta").append(
      createList(ACCOUNT_NAV, current, (anchor, link) => {
        anchor.className = link.className;
        anchor.setAttribute("aria-label", link.text);
        anchor.append(
          createElement("img", {
            className: `icono-${link.icon}`,
            attributes: { src: getIconUrl(link.icon), alt: "" },
          }),
        );
      }),
    );
    this.accountLink = this.querySelector(".ir-cuenta");
    this.accountItem = this.accountLink.parentElement;
    this.cartLink = this.querySelector(".ir-carrito");
    // Decorativo: la cantidad la lee el lector de pantalla del aria-label.
    this.cartCounter = createElement("span", {
      className: "contador-carrito",
      attributes: { "aria-hidden": "true" },
    });
    this.cartLink.append(this.cartCounter);

    const mainList = createList(MAIN_NAV, current, (anchor, link) => {
      anchor.textContent = link.text;
    });
    // Solo en el panel mobile: el Carrito con su contador.
    const cart = ACCOUNT_NAV.find((link) => link.id === "carrito");
    this.menuCounter = createElement("span", {
      className: "contador-menu",
      attributes: { "aria-hidden": "true" },
    });
    this.menuCartLink = createElement(
      "a",
      { attributes: { href: getRootPath(cart.path) } },
      cart.text,
      this.menuCounter,
    );
    if (current === cart.id) this.menuCartLink.setAttribute("aria-current", "page");
    mainList.append(createElement("li", { className: "solo-mobile" }, this.menuCartLink));
    this.querySelector(".nav-principal").append(mainList);

    this.updateSession(current);
    window.addEventListener(SESSION_CHANGE, () => this.updateSession(current));
    this.updateCart();
    onCartChange(() => this.updateCart());
  }

  // Muestra las unidades del carrito sobre el ícono y en el link
  // del panel mobile (ocultas si está vacío) y hace un "salto" en
  // el ícono cuando la cantidad sube.
  updateCart() {
    const units = countUnits();
    const previous = Number(this.cartCounter.dataset.unidades ?? units);
    this.cartCounter.dataset.unidades = units;
    const text = units > 99 ? "99+" : String(units);
    const label = units
      ? `Carrito, ${units} ${units === 1 ? "producto" : "productos"}`
      : "Carrito vacío";
    for (const [link, counter] of [
      [this.cartLink, this.cartCounter],
      [this.menuCartLink, this.menuCounter],
    ]) {
      counter.textContent = text;
      counter.hidden = units === 0;
      link.setAttribute("aria-label", label);
    }
    if (units > previous) {
      this.cartCounter.classList.remove("contador-salto");
      // Fuerza un reflow para que la animación arranque de nuevo.
      void this.cartCounter.offsetWidth;
      this.cartCounter.classList.add("contador-salto");
    }
  }

  // Alterna entre el link a Mi cuenta (sin sesión) y el menú de
  // usuario, y muestra u oculta los links que piden sesión.
  updateSession(current) {
    const user = getCurrentUser();
    this.accountItem.replaceChildren(
      user ? createUserMenu(user, { current }) : this.accountLink,
    );
    for (const item of this.querySelectorAll("[data-solo-con-sesion]")) {
      item.hidden = !user;
    }
  }
}

customElements.define("site-header", SiteHeader);
