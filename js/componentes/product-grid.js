/* =========================================================
   Whiplash — <product-grid limit="5" artist="1" with-purchase>
   Grilla de .producto-merch armada desde la tabla productos (Supabase).
   - artist: muestra solo el merch de ese artista (id).
   - with-purchase: cada tarjeta trae el formulario para
     agregar al carrito en lugar del enlace "Ver producto".
   ========================================================= */

import { getProductsWithArtist } from "../servicios/datos.js";
import { DataGrid } from "./data-grid.js";
import { createMerchProduct } from "./tarjetas.js";

class ProductGrid extends DataGrid {
  get cssClass() {
    return "grilla-merch";
  }

  async load() {
    const products = await getProductsWithArtist();
    const artist = this.getAttribute("artist");
    return artist
      ? products.filter((product) => product.artista_id === Number(artist))
      : products;
  }

  createCard(product) {
    return createMerchProduct(product, { withPurchase: this.hasAttribute("with-purchase") });
  }
}

customElements.define("product-grid", ProductGrid);
