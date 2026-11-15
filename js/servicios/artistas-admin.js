/* =========================================================
   Whiplash — Gestión de artistas (admin y cuentas de artista)
   Alta, edición y baja de artistas con su imagen en el
   bucket "artistas". Lo usa pages/admin-artistas.html; el
   trabajo con Supabase lo hace catalogo-admin.js. Una cuenta
   de artista solo puede editar o borrar su propio perfil.
   ========================================================= */

import { deleteRow, saveRow, getRows } from "./catalogo-admin.js";
import { fetchTable } from "./supabase.js";

// "3:24", "12:05": minutos y segundos.
export const DURATION_FORMAT = /^\d{1,2}:[0-5]\d$/;

const ARTISTS = {
  table: "artistas",
  bucket: "artistas",
  messages: {
    // productos.artista_id no tiene on delete cascade: un artista
    // con productos no se puede borrar (la página ya lo avisa antes).
    23503: "No se puede eliminar: el artista tiene productos. Eliminalos o reasignalos primero.",
  },
};

export function getAdminArtists() {
  return getRows(ARTISTS.table);
}

// Perfil de la cuenta de artista (artistas.user_id), o null si
// no tiene (por ejemplo, porque el admin lo eliminó).
export async function getMyArtist(user) {
  const [artist] = await fetchTable(`artistas?select=*&user_id=eq.${user.id}`);
  return artist ?? null;
}

// `artist` sin id = alta; con id = edición. Ver saveRow().
// `tracks`: [{ titulo, duracion }], en el orden en que se muestran.
export async function saveArtist({ id, nombre, genero, bio, tracks }, image) {
  const { row, error } = await saveRow(
    ARTISTS,
    { id, nombre: nombre.trim(), genero, bio: bio.trim() || null, tracks },
    image,
  );
  return { artist: row, error };
}

// Sus seguidores se borran con él (on delete cascade en seguidos).
export function deleteArtist(artist) {
  return deleteRow(ARTISTS, artist);
}
