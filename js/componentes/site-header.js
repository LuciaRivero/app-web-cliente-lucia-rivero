/* =========================================================
   Whiplash — <site-header current="merch">
   Encabezado común: menú mobile, logo, buscador, accesos
   de cuenta y navegación principal.
   - current: id del link activo (ver navigation.js).
   Con sesión abierta, el link de la cuenta se reemplaza por el
   menú de usuario (menu-usuario.js) y aparecen los links marcados
   con soloConSesion; se actualiza cada vez que la sesión cambia.
   El ícono del carrito lleva un contador con las unidades que
   hay en el carrito, que se actualiza cuando el carrito cambia.
   Se arma en light DOM para que apliquen los estilos de
   css/layout/encabezado.css sin cambios.
   ========================================================= */

import { contarUnidades, escucharCambiosCarrito } from "../servicios/carrito.js";
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
    this.enlaceCarrito = this.querySelector(".ir-carrito");
    // Decorativo: la cantidad la lee el lector de pantalla del aria-label.
    this.contadorCarrito = crearElemento("span", {
      clase: "contador-carrito",
      atributos: { "aria-hidden": "true" },
    });
    this.enlaceCarrito.append(this.contadorCarrito);

    this.querySelector(".nav-principal").append(
      crearLista(MAIN_NAV, actual, (enlace, link) => {
        enlace.textContent = link.texto;
      }),
    );

    this.actualizarSesion(actual);
    window.addEventListener(CAMBIO_SESION, () => this.actualizarSesion(actual));
    this.actualizarCarrito();
    escucharCambiosCarrito(() => this.actualizarCarrito());
  }

  // Muestra las unidades del carrito sobre el ícono (oculto si
  // está vacío) y hace un "salto" cuando la cantidad sube.
  actualizarCarrito() {
    const unidades = contarUnidades();
    const anterior = Number(this.contadorCarrito.dataset.unidades ?? unidades);
    this.contadorCarrito.dataset.unidades = unidades;
    this.contadorCarrito.textContent = unidades > 99 ? "99+" : String(unidades);
    this.contadorCarrito.hidden = unidades === 0;
    this.enlaceCarrito.setAttribute(
      "aria-label",
      unidades ? `Carrito, ${unidades} ${unidades === 1 ? "producto" : "productos"}` : "Carrito vacío",
    );
    if (unidades > anterior) {
      this.contadorCarrito.classList.remove("contador-salto");
      // Fuerza un reflow para que la animación arranque de nuevo.
      void this.contadorCarrito.offsetWidth;
      this.contadorCarrito.classList.add("contador-salto");
    }
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
