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

import { getRootPath } from "../servicios/datos.js";
import { createElement } from "../utilidades/dom.js";
import { HOME } from "./navigation.js";

class SiteBreadcrumbs extends HTMLElement {
  connectedCallback() {
    if (this.querySelector(".migas-de-pan")) return;

    const home = createElement("a", {
      text: HOME.text,
      attributes: { href: getRootPath(HOME.path) },
    });
    const steps = [home, ...this.children];

    const items = steps.map((step, index) => {
      const isLast = index === steps.length - 1;
      // La página actual va como texto plano, sin enlace.
      return isLast
        ? createElement("li", { text: step.textContent.trim(), attributes: { "aria-current": "page" } })
        : createElement("li", {}, step);
    });

    this.replaceChildren(
      createElement(
        "nav",
        { className: "migas-de-pan", attributes: { "aria-label": "Ruta de navegación" } },
        createElement("ol", {}, ...items),
      ),
    );
  }
}

customElements.define("site-breadcrumbs", SiteBreadcrumbs);
