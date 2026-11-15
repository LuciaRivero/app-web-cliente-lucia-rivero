/* =========================================================
   Whiplash — <genre-chips limit="4" filter>
   Chips de género armados desde la tabla generos (Supabase),
   solo con los géneros que tienen artistas.
   - Sin filter: cada chip es un enlace a Explorar con
     ?genero=<género>, que abre el listado con ese género elegido.
   - filter: botones "Todos" + un género por botón, con
     aria-pressed. Al elegir uno dispara el evento
     "genre-change" con detail.genre (null para "Todos").
   - selected: género elegido en los filtros (sin él, "Todos").
     La página lo fija si llega un género en la URL.
   - limit: cantidad máxima de géneros (opcional).
   ========================================================= */

import { getGenresWithArtists } from "../servicios/datos.js";
import { createElement } from "../utilidades/dom.js";
import { DataGrid } from "./data-grid.js";
import { getGenreUrl } from "./tarjetas.js";

class GenreChips extends DataGrid {
  static observedAttributes = ["selected"];

  get isFilter() {
    return this.hasAttribute("filter");
  }

  get cssClass() {
    return this.isFilter ? "grupo-filtros" : "generos-lista";
  }

  get hasSmallLoader() {
    return true;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.isFilter && !this.isListening) {
      this.isListening = true;
      this.addEventListener("click", (event) => this.selectGenre(event));
    }
  }

  attributeChangedCallback() {
    this.markSelected();
  }

  load() {
    return getGenresWithArtists();
  }

  createCard(genre) {
    if (this.isFilter) return this.createButton(genre.nombre, genre.nombre);

    return createElement("a", {
      className: "chip-genero",
      text: genre.nombre,
      attributes: { href: getGenreUrl(genre.nombre) },
    });
  }

  createButton(text, value) {
    const button = createElement("button", {
      className: "chip-genero",
      text,
      attributes: { type: "button", "aria-pressed": "false" },
    });
    button.dataset.genero = value;
    return button;
  }

  render(genres) {
    super.render(genres);
    if (!this.isFilter) return;

    this.prepend(this.createButton("Todos", ""));
    this.markSelected();
  }

  // aria-pressed en el chip de `selected`; si no hay ninguno con
  // ese género (o no hay selected), queda marcado "Todos".
  markSelected() {
    const buttons = [...this.querySelectorAll("button.chip-genero")];
    const value = this.getAttribute("selected") ?? "";
    const selected = buttons.find((button) => button.dataset.genero === value) ?? buttons[0];
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button === selected));
    }
  }

  selectGenre(event) {
    const selected = event.target.closest("button.chip-genero");
    if (!selected || selected.getAttribute("aria-pressed") === "true") return;

    if (selected.dataset.genero) this.setAttribute("selected", selected.dataset.genero);
    else this.removeAttribute("selected");
    this.dispatchEvent(
      new CustomEvent("genre-change", {
        bubbles: true,
        detail: { genre: selected.dataset.genero || null },
      }),
    );
  }
}

customElements.define("genre-chips", GenreChips);
