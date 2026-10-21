/* =========================================================
   Whiplash — <product-grid limit="5" artist="1" with-purchase>
   Grilla de .producto-merch armada desde productos.json.
   - artist: muestra solo el merch de ese artista (id).
   - with-purchase: cada tarjeta trae el formulario para
     agregar al carrito en lugar del enlace "Ver producto".
   ========================================================= */

import { obtenerProductosConArtista } from "../servicios/datos.js";
import { DataGrid } from "./data-grid.js";
import { crearProductoMerch } from "./tarjetas.js";

class ProductGrid extends DataGrid {
  get claseCss() {
    return "grilla-merch";
  }

  async cargar() {
    const productos = await obtenerProductosConArtista();
    const artista = this.getAttribute("artist");
    return artista
      ? productos.filter((producto) => producto.artista_id === Number(artista))
      : productos;
  }

  crearTarjeta(producto) {
    return crearProductoMerch(producto, { conCompra: this.hasAttribute("with-purchase") });
  }
}

customElements.define("product-grid", ProductGrid);
