/* =========================================================
   Whiplash — <site-footer>
   Pie común: links institucionales, datos de contacto
   y copyright con el año actual.
   ========================================================= */

import { getRootPath } from "../servicios/datos.js";
import { createElement } from "../utilidades/dom.js";
import { FOOTER_NAV } from "./navigation.js";

class SiteFooter extends HTMLElement {
  connectedCallback() {
    if (this.childElementCount) return;

    this.innerHTML = `
      <footer class="pie-sitio">
        <nav aria-label="Información de la plataforma"></nav>

        <address>
          Whiplash — Av. Ejemplo 123, Buenos Aires, Argentina<br />
          <a href="mailto:hola@whiplash.com">hola@whiplash.com</a><br />
          <a href="tel:+5401112345678">+54 11 1234-5678</a>
        </address>

        <p>&copy; ${new Date().getFullYear()} Whiplash. Todos los derechos reservados.</p>
      </footer>
    `;

    this.querySelector("nav").append(
      createElement(
        "ul",
        {},
        ...FOOTER_NAV.map((link) =>
          createElement(
            "li",
            {},
            createElement("a", { text: link.text, attributes: { href: getRootPath(link.path) } }),
          ),
        ),
      ),
    );
  }
}

customElements.define("site-footer", SiteFooter);
