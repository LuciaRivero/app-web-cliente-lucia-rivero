/* =========================================================
   Whiplash — <site-breadcrumbs>
   Migas de pan. Los hijos son los pasos después de "Inicio",
   así la ruta se sigue leyendo en el HTML de cada página:

     <site-breadcrumbs>
       <a href="generos.html">Rock independiente</a>
       <span>Los Cráteres</span>
     </site-breadcrumbs>

   El último paso es la página actual (aria-current="page").
   ========================================================= */

import { rutaDesdeRaiz } from "../servicios/datos.js";
import { crearElemento } from "../utilidades/dom.js";
import { HOME } from "./navigation.js";

class SiteBreadcrumbs extends HTMLElement {
  connectedCallback() {
    if (this.querySelector(".migas-de-pan")) return;

    const inicio = crearElemento("a", {
      texto: HOME.texto,
      atributos: { href: rutaDesdeRaiz(HOME.ruta) },
    });
    const pasos = [inicio, ...this.children];

    const items = pasos.map((paso, indice) => {
      const ultimo = indice === pasos.length - 1;
      // La página actual va como texto plano, sin enlace.
      return ultimo
        ? crearElemento("li", { texto: paso.textContent.trim(), atributos: { "aria-current": "page" } })
        : crearElemento("li", {}, paso);
    });

    this.replaceChildren(
      crearElemento(
        "nav",
        { clase: "migas-de-pan", atributos: { "aria-label": "Ruta de navegación" } },
        crearElemento("ol", {}, ...items),
      ),
    );
  }
}

customElements.define("site-breadcrumbs", SiteBreadcrumbs);
