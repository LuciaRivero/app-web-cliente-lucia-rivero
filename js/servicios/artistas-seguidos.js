/* =========================================================
   Whiplash — Artistas seguidos
   Ids de artistas que sigue el usuario con sesión, en el
   orden en que los siguió. Se guardan en la tabla seguidos
   de Supabase (RLS: cada usuario ve solo los suyos); sin
   sesión la lista está vacía y no se puede seguir a nadie.
   La lista se pide una vez por página y queda en memoria,
   así los botones "Seguir" se pintan sin un pedido cada uno.

   Si alguien toca "Seguir" sin sesión, el artista queda
   pendiente en sessionStorage y se sigue al ingresar o
   registrarse (completePendingFollow).
   ========================================================= */

import { SESSION_CHANGE, getToken } from "./sesion.js";
import { fetchTable } from "./supabase.js";

const PENDING_KEY = "whiplash-seguir-pendiente";

let cache = null;

// Al ingresar o cerrar sesión cambia de quién es la lista.
window.addEventListener(SESSION_CHANGE, () => {
  cache = null;
});

export function getFollowed() {
  cache ??= (async () => {
    const token = await getToken();
    if (!token) return [];
    const rows = await fetchTable("seguidos?select=artista_id&order=creado_en", { token });
    return rows.map((row) => row.artista_id);
  })().catch((error) => {
    cache = null;
    throw error;
  });
  return cache;
}

export async function isFollowing(id) {
  return (await getFollowed()).includes(id);
}

async function follow(id) {
  const token = await getToken();
  if (!token) throw new Error("Sin sesión");
  await fetchTable("seguidos", {
    method: "POST",
    body: { artista_id: id },
    token,
    // Si ya lo seguía, no es un error.
    prefer: "resolution=ignore-duplicates,return=minimal",
  });
  const ids = await getFollowed();
  if (!ids.includes(id)) cache = Promise.resolve([...ids, id]);
}

export async function unfollow(id) {
  const token = await getToken();
  if (!token) throw new Error("Sin sesión");
  await fetchTable(`seguidos?artista_id=eq.${id}`, { method: "DELETE", token });
  const ids = await getFollowed();
  cache = Promise.resolve(ids.filter((current) => current !== id));
}

// Devuelve si quedó siguiendo al artista.
export async function toggleFollow(id) {
  if (await isFollowing(id)) {
    await unfollow(id);
    return false;
  }
  await follow(id);
  return true;
}

// sessionStorage puede fallar igual que localStorage: en ese caso
// el ingreso sigue funcionando, solo que sin el artista pendiente.
export function savePendingFollow(id) {
  try {
    sessionStorage.setItem(PENDING_KEY, String(id));
  } catch (error) {
    console.error("No se pudo guardar el artista pendiente", error);
  }
}

// Sigue al artista pendiente (si hay uno) con la sesión recién
// abierta y devuelve si lo hizo, para llevar a Mis artistas.
export async function completePendingFollow() {
  let id;
  try {
    id = Number(sessionStorage.getItem(PENDING_KEY));
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    return false;
  }
  if (!id) return false;
  try {
    await follow(id);
    return true;
  } catch (error) {
    console.error("No se pudo seguir al artista pendiente", error);
    return false;
  }
}
