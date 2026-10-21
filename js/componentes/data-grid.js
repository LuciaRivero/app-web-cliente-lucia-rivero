/* =========================================================
   Whiplash — Base de las grillas que se llenan con datos
   <artist-grid> y <product-grid> heredan de acá: cada una
   define qué clase CSS usa, de dónde saca los datos y cómo
   arma cada tarjeta.
   - limit: cantidad máxima de tarjetas (opcional).
   ========================================================= */

import { crearElemento } from "../utilidades/dom.js";

export class DataGrid extends HTMLElement {
  // A completar por cada grilla.
  static claseCss = "";
  async cargar() {
    return [];
  }
  crearTarjeta() {}

  connectedCallback() {
    this.classList.add(this.constructor.claseCss);
    if (!this.childElementCount) this.cargarInicial();
  }

  async cargarInicial() {
    const pedido = (this.ultimoPedido = Symbol());
    let items;
    try {
      items = await this.cargar();
    } catch (error) {
      console.error(error);
      if (pedido === this.ultimoPedido) {
        this.replaceChildren(crearElemento("p", { texto: "No pudimos cargar este contenido." }));
      }
      return;
    }
    // Si mientras tanto alguien llamó a mostrar() (por ejemplo, la
    // búsqueda de Explorar), esa lista gana y esta se descarta.
    if (pedido !== this.ultimoPedido) return;

    const limite = Number(this.getAttribute("limit")) || items.length;
    this.mostrar(items.slice(0, limite));
  }

  // Reemplaza las tarjetas por las de `items`.
  mostrar(items) {
    this.ultimoPedido = Symbol();
    this.replaceChildren(...items.map((item) => this.crearTarjeta(item)));
  }
}
