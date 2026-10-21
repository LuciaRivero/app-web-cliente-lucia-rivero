/* =========================================================
   Whiplash — <genre-chips limit="4" filter>
   Chips de género armados desde generos.json.
   - Sin filter: cada chip es un enlace a Explorar con
     ?q=<género>, que muestra los resultados de ese género.
   - filter: botones "Todos" + un género por botón, con
     aria-pressed. Al elegir uno dispara el evento
     "genre-change" con detail.genre (null para "Todos").
   - limit: cantidad máxima de géneros (opcional).
   ========================================================= */

import { obtenerGeneros, rutaDesdeRaiz } from "../servicios/datos.js";
import { crearElemento } from "../utilidades/dom.js";
import { DataGrid } from "./data-grid.js";

const URL_EXPLORAR = rutaDesdeRaiz("pages/explorar.html");

class GenreChips extends DataGrid {
  get esFiltro() {
    return this.hasAttribute("filter");
  }

  get claseCss() {
    return this.esFiltro ? "grupo-filtros" : "generos-lista";
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.esFiltro && !this.escuchando) {
      this.escuchando = true;
      this.addEventListener("click", (evento) => this.elegir(evento));
    }
  }

  cargar() {
    return obtenerGeneros();
  }

  crearTarjeta(genero) {
    if (this.esFiltro) return this.crearBoton(genero.nombre, genero.nombre);

    return crearElemento("a", {
      clase: "chip-genero",
      texto: genero.nombre,
      atributos: { href: `${URL_EXPLORAR}?q=${encodeURIComponent(genero.nombre)}` },
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

    const todos = this.crearBoton("Todos", "");
    todos.setAttribute("aria-pressed", "true");
    this.prepend(todos);
  }

  elegir(evento) {
    const elegido = evento.target.closest("button.chip-genero");
    if (!elegido || elegido.getAttribute("aria-pressed") === "true") return;

    for (const boton of this.querySelectorAll("button.chip-genero")) {
      boton.setAttribute("aria-pressed", String(boton === elegido));
    }
    this.dispatchEvent(
      new CustomEvent("genre-change", {
        bubbles: true,
        detail: { genre: elegido.dataset.genero || null },
      }),
    );
  }
}

customElements.define("genre-chips", GenreChips);
