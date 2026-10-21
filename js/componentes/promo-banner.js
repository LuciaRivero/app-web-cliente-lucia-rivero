/* =========================================================
   Whiplash — <promo-banner>
   Banner de llamada a la acción (.promo).
     <promo-banner heading="..." text="..."
       href="merch.html" link-text="Ver merch"></promo-banner>
   - href: enlace relativo a la página, como cualquier <a>.
   ========================================================= */

import { crearElemento } from "../utilidades/dom.js";

let contador = 0;

class PromoBanner extends HTMLElement {
  connectedCallback() {
    if (this.childElementCount) return;

    const idTitulo = `titulo-promo-${++contador}`;

    this.append(
      crearElemento(
        "section",
        { clase: "promo", atributos: { "aria-labelledby": idTitulo } },
        crearElemento("h2", { texto: this.getAttribute("heading"), atributos: { id: idTitulo } }),
        crearElemento("p", { texto: this.getAttribute("text") }),
        crearElemento("a", {
          clase: "boton",
          texto: this.getAttribute("link-text"),
          atributos: { href: this.getAttribute("href") },
        }),
      ),
    );
  }
}

customElements.define("promo-banner", PromoBanner);
