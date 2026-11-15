/* =========================================================
   Whiplash — Base de las grillas que se llenan con datos
   <artist-grid>, <product-grid> y <genre-chips> heredan de
   acá: cada una define qué clase CSS usa, de dónde saca los
   datos y cómo arma cada tarjeta.
   - limit: cantidad máxima de tarjetas (opcional).
   Mientras llegan los datos muestra el disco de carga, y las
   tarjetas entran escalonadas (ver css/componentes/cargando.css).
   ========================================================= */

import { createLoader, createElement } from "../utilidades/dom.js";

export class DataGrid extends HTMLElement {
  // A completar por cada grilla.
  get cssClass() {
    return "";
  }
  async load() {
    return [];
  }
  createCard() {}

  // true usa la versión en línea del indicador de carga.
  get hasSmallLoader() {
    return false;
  }

  connectedCallback() {
    this.classList.add(this.cssClass);
    if (!this.childElementCount) this.loadInitial();
  }

  async loadInitial() {
    const request = this.showLoading();
    let items;
    try {
      items = await this.load();
    } catch (error) {
      console.error(error);
      if (request === this.lastRequest) {
        this.removeAttribute("aria-busy");
        this.replaceChildren(createElement("p", { text: "No pudimos cargar este contenido." }));
      }
      return;
    }
    // Si mientras tanto alguien llamó a render() (por ejemplo, la
    // búsqueda de Explorar), esa lista gana y esta se descarta.
    if (request !== this.lastRequest) return;

    const limit = Number(this.getAttribute("limit")) || items.length;
    this.render(items.slice(0, limit));
  }

  // Muestra el indicador de carga y devuelve la marca del pedido
  // actual, para descartar respuestas que lleguen tarde.
  showLoading(text) {
    this.lastRequest = Symbol();
    this.setAttribute("aria-busy", "true");
    this.replaceChildren(createLoader(text, { small: this.hasSmallLoader }));
    return this.lastRequest;
  }

  // Reemplaza el contenido por las tarjetas de `items`. --orden
  // escalona la animación de entrada de cada una.
  render(items) {
    this.lastRequest = Symbol();
    this.removeAttribute("aria-busy");
    this.replaceChildren(...this.createCards(items));
  }

  // Suma las tarjetas de `items` al final sin redibujar las que ya
  // están (por ejemplo, "Cargar más" en Explorar). Devuelve las nuevas.
  appendItems(items) {
    const cards = this.createCards(items);
    this.append(...cards);
    return cards;
  }

  createCards(items) {
    return items.map((item, index) => {
      const card = this.createCard(item);
      card.style.setProperty("--orden", index);
      return card;
    });
  }
}
