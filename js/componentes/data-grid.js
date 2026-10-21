/* =========================================================
   Whiplash — Base de las grillas que se llenan con datos
   <artist-grid>, <product-grid> y <genre-chips> heredan de
   acá: cada una define qué clase CSS usa, de dónde saca los
   datos y cómo arma cada tarjeta.
   - limit: cantidad máxima de tarjetas (opcional).
   Mientras llegan los datos muestra el disco de carga, y las
   tarjetas entran escalonadas (ver css/componentes/cargando.css).
   ========================================================= */

import { crearCargando, crearElemento } from "../utilidades/dom.js";

export class DataGrid extends HTMLElement {
  // A completar por cada grilla.
  get claseCss() {
    return "";
  }
  async cargar() {
    return [];
  }
  crearTarjeta() {}

  // true usa la versión en línea del indicador de carga.
  get cargandoChico() {
    return false;
  }

  connectedCallback() {
    this.classList.add(this.claseCss);
    if (!this.childElementCount) this.cargarInicial();
  }

  async cargarInicial() {
    const pedido = this.mostrarCargando();
    let items;
    try {
      items = await this.cargar();
    } catch (error) {
      console.error(error);
      if (pedido === this.ultimoPedido) {
        this.removeAttribute("aria-busy");
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

  // Muestra el indicador de carga y devuelve la marca del pedido
  // actual, para descartar respuestas que lleguen tarde.
  mostrarCargando(texto) {
    this.ultimoPedido = Symbol();
    this.setAttribute("aria-busy", "true");
    this.replaceChildren(crearCargando(texto, { chico: this.cargandoChico }));
    return this.ultimoPedido;
  }

  // Reemplaza el contenido por las tarjetas de `items`. --orden
  // escalona la animación de entrada de cada una.
  mostrar(items) {
    this.ultimoPedido = Symbol();
    this.removeAttribute("aria-busy");
    this.replaceChildren(
      ...items.map((item, indice) => {
        const tarjeta = this.crearTarjeta(item);
        tarjeta.style.setProperty("--orden", indice);
        return tarjeta;
      }),
    );
  }
}
