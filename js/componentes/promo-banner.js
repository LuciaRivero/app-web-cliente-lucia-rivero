/* =========================================================
   Whiplash — <promo-banner>
   Banner de llamada a la acción (.promo).
     <promo-banner heading="..." text="..."
       href="merch.html" link-text="Ver merch"></promo-banner>
   - href: enlace relativo a la página, como cualquier <a>.
   ========================================================= */

import { createElement } from "../utilidades/dom.js";

let counter = 0;

class PromoBanner extends HTMLElement {
  connectedCallback() {
    if (this.childElementCount) return;

    const titleId = `titulo-promo-${++counter}`;

    this.append(
      createElement(
        "section",
        { className: "promo", attributes: { "aria-labelledby": titleId } },
        createElement("h2", { text: this.getAttribute("heading"), attributes: { id: titleId } }),
        createElement("p", { text: this.getAttribute("text") }),
        createElement("a", {
          className: "boton",
          text: this.getAttribute("link-text"),
          attributes: { href: this.getAttribute("href") },
        }),
      ),
    );
  }
}

customElements.define("promo-banner", PromoBanner);
