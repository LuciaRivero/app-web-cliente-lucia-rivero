/* =========================================================
   Whiplash — <artist-grid limit="4" order="recientes">
   Grilla de .tarjeta-artista armada desde la tabla artistas (Supabase).
   - order="recientes": los últimos artistas agregados primero (id
     más alto). Sin order, en el orden de la tabla.
   ========================================================= */

import { getArtists } from "../servicios/datos.js";
import { DataGrid } from "./data-grid.js";
import { createArtistCard } from "./tarjetas.js";

class ArtistGrid extends DataGrid {
  get cssClass() {
    return "grilla-artistas";
  }

  async load() {
    const artists = await getArtists();
    // Se ordena una copia: la lista de datos.js la comparten todas las grillas.
    return this.getAttribute("order") === "recientes" ? [...artists].sort((a, b) => b.id - a.id) : artists;
  }

  createCard(artist) {
    return createArtistCard(artist);
  }
}

customElements.define("artist-grid", ArtistGrid);
