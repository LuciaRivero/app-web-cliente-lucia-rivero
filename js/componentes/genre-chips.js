/* =========================================================
   Whiplash — <genre-chips limit="4" filter>
   Chips de género armados desde la tabla generos (Supabase).
   - Sin filter: cada chip es un enlace a Explorar con
     ?genero=<género>, que abre el listado con ese género elegido.
   - filter: botones "Todos" + un género por botón, con
     aria-pressed. Al elegir uno dispara el evento
     "genre-change" con detail.genre (null para "Todos").
   - selected: género elegido en los filtros (sin él, "Todos").
     La página lo fija si llega un género en la URL.
   - limit: cantidad máxima de géneros (opcional).
   ========================================================= */

import { obtenerGeneros } from "../servicios/datos.js";
import { crearElemento } from "../utilidades/dom.js";
import { DataGrid } from "./data-grid.js";
import { urlGenero } from "./tarjetas.js";

class GenreChips extends DataGrid {
  static observedAttributes = ["selected"];

  get esFiltro() {
    return this.hasAttribute("filter");
  }

  get claseCss() {
    return this.esFiltro ? "grupo-filtros" : "generos-lista";
  }

  get cargandoChico() {
    return true;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.esFiltro && !this.escuchando) {
      this.escuchando = true;
      this.addEventListener("click", (evento) => this.elegir(evento));
    }
  }

  attributeChangedCallback() {
    this.marcarElegido();
  }

  cargar() {
    return obtenerGeneros();
  }

  crearTarjeta(genero) {
    if (this.esFiltro) return this.crearBoton(genero.nombre, genero.nombre);

    return crearElemento("a", {
      clase: "chip-genero",
      texto: genero.nombre,
      atributos: { href: urlGenero(genero.nombre) },
    });
  }

  crearBoton(texto, valor) {
    const boton = crearElemento("button", {
      clase: "chip-genero",
      texto,
      atributos: { type: "button", "aria-pressed": "false" },
    });
    boton.dataset.genero = valor;
    return boton;
  }

  mostrar(generos) {
    super.mostrar(generos);
    if (!this.esFiltro) return;

    this.prepend(this.crearBoton("Todos", ""));
    this.marcarElegido();
  }

  // aria-pressed en el chip de `selected`; si no hay ninguno con
  // ese género (o no hay selected), queda marcado "Todos".
  marcarElegido() {
    const botones = [...this.querySelectorAll("button.chip-genero")];
    const valor = this.getAttribute("selected") ?? "";
    const elegido = botones.find((boton) => boton.dataset.genero === valor) ?? botones[0];
    for (const boton of botones) {
      boton.setAttribute("aria-pressed", String(boton === elegido));
    }
  }

  elegir(evento) {
    const elegido = evento.target.closest("button.chip-genero");
    if (!elegido || elegido.getAttribute("aria-pressed") === "true") return;

    if (elegido.dataset.genero) this.setAttribute("selected", elegido.dataset.genero);
    else this.removeAttribute("selected");
    this.dispatchEvent(
      new CustomEvent("genre-change", {
        bubbles: true,
        detail: { genre: elegido.dataset.genero || null },
      }),
    );
  }
}

customElements.define("genre-chips", GenreChips);
