/* =========================================================
   Whiplash — <artist-grid limit="4" order="recientes">
   Grilla de .tarjeta-artista armada desde la tabla artistas (Supabase).
   - order="recientes": los últimos artistas agregados primero (id
     más alto). Sin order, en el orden de la tabla.
   ========================================================= */

import { obtenerArtistas } from "../servicios/datos.js";
import { DataGrid } from "./data-grid.js";
import { crearTarjetaArtista } from "./tarjetas.js";

class ArtistGrid extends DataGrid {
  get claseCss() {
    return "grilla-artistas";
  }

  async cargar() {
    const artistas = await obtenerArtistas();
    // Se ordena una copia: la lista de datos.js la comparten todas las grillas.
    return this.getAttribute("order") === "recientes" ? [...artistas].sort((a, b) => b.id - a.id) : artistas;
  }

  crearTarjeta(artista) {
    return crearTarjetaArtista(artista);
  }
}

customElements.define("artist-grid", ArtistGrid);
