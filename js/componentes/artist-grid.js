/* =========================================================
   Whiplash — <artist-grid limit="4">
   Grilla de .tarjeta-artista armada desde la tabla artistas (Supabase).
   ========================================================= */

import { obtenerArtistas } from "../servicios/datos.js";
import { DataGrid } from "./data-grid.js";
import { crearTarjetaArtista } from "./tarjetas.js";

class ArtistGrid extends DataGrid {
  get claseCss() {
    return "grilla-artistas";
  }

  cargar() {
    return obtenerArtistas();
  }

  crearTarjeta(artista) {
    return crearTarjetaArtista(artista);
  }
}

customElements.define("artist-grid", ArtistGrid);
