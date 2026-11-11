/* =========================================================
   Whiplash — Gestión de artistas (admin y cuentas de artista)
   Alta, edición y baja de artistas con su imagen en el
   bucket "artistas". Lo usa pages/admin-artistas.html; el
   trabajo con Supabase lo hace catalogo-admin.js. Una cuenta
   de artista solo puede editar o borrar su propio perfil.
   ========================================================= */

import { eliminarFila, guardarFila, obtenerFilas } from "./catalogo-admin.js";
import { pedirTabla } from "./supabase.js";

// "3:24", "12:05": minutos y segundos.
export const FORMATO_DURACION = /^\d{1,2}:[0-5]\d$/;

const ARTISTAS = {
  tabla: "artistas",
  bucket: "artistas",
  mensajes: {
    // productos.artista_id no tiene on delete cascade: un artista
    // con productos no se puede borrar (la página ya lo avisa antes).
    23503: "No se puede eliminar: el artista tiene productos. Eliminalos o reasignalos primero.",
  },
};

export function obtenerArtistasAdmin() {
  return obtenerFilas(ARTISTAS.tabla);
}

// Perfil de la cuenta de artista (artistas.user_id), o null si
// no tiene (por ejemplo, porque el admin lo eliminó).
export async function obtenerMiArtista(usuario) {
  const [artista] = await pedirTabla(`artistas?select=*&user_id=eq.${usuario.id}`);
  return artista ?? null;
}

// `artista` sin id = alta; con id = edición. Ver guardarFila().
// `tracks`: [{ titulo, duracion }], en el orden en que se muestran.
export async function guardarArtista({ id, nombre, genero, bio, tracks }, imagen) {
  const { fila, error } = await guardarFila(
    ARTISTAS,
    { id, nombre: nombre.trim(), genero, bio: bio.trim() || null, tracks },
    imagen,
  );
  return { artista: fila, error };
}

// Sus seguidores se borran con él (on delete cascade en seguidos).
export function eliminarArtista(artista) {
  return eliminarFila(ARTISTAS, artista);
}
