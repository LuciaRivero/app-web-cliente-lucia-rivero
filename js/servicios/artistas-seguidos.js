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
   registrarse (completarSeguirPendiente).
   ========================================================= */

import { CAMBIO_SESION, obtenerToken } from "./sesion.js";
import { pedirTabla } from "./supabase.js";

const CLAVE_PENDIENTE = "whiplash-seguir-pendiente";

let cache = null;

// Al ingresar o cerrar sesión cambia de quién es la lista.
window.addEventListener(CAMBIO_SESION, () => {
  cache = null;
});

export function leerSeguidos() {
  cache ??= (async () => {
    const token = await obtenerToken();
    if (!token) return [];
    const filas = await pedirTabla("seguidos?select=artista_id&order=creado_en", { token });
    return filas.map((fila) => fila.artista_id);
  })().catch((error) => {
    cache = null;
    throw error;
  });
  return cache;
}

export async function estaSiguiendo(id) {
  return (await leerSeguidos()).includes(id);
}

async function seguir(id) {
  const token = await obtenerToken();
  if (!token) throw new Error("Sin sesión");
  await pedirTabla("seguidos", {
    metodo: "POST",
    cuerpo: { artista_id: id },
    token,
    // Si ya lo seguía, no es un error.
    prefer: "resolution=ignore-duplicates,return=minimal",
  });
  const ids = await leerSeguidos();
  if (!ids.includes(id)) cache = Promise.resolve([...ids, id]);
}

export async function dejarDeSeguir(id) {
  const token = await obtenerToken();
  if (!token) throw new Error("Sin sesión");
  await pedirTabla(`seguidos?artista_id=eq.${id}`, { metodo: "DELETE", token });
  const ids = await leerSeguidos();
  cache = Promise.resolve(ids.filter((actual) => actual !== id));
}

// Devuelve si quedó siguiendo al artista.
export async function alternarSeguir(id) {
  if (await estaSiguiendo(id)) {
    await dejarDeSeguir(id);
    return false;
  }
  await seguir(id);
  return true;
}

// sessionStorage puede fallar igual que localStorage: en ese caso
// el ingreso sigue funcionando, solo que sin el artista pendiente.
export function guardarSeguirPendiente(id) {
  try {
    sessionStorage.setItem(CLAVE_PENDIENTE, String(id));
  } catch (error) {
    console.error("No se pudo guardar el artista pendiente", error);
  }
}

// Sigue al artista pendiente (si hay uno) con la sesión recién
// abierta y devuelve si lo hizo, para llevar a Mis artistas.
export async function completarSeguirPendiente() {
  let id;
  try {
    id = Number(sessionStorage.getItem(CLAVE_PENDIENTE));
    sessionStorage.removeItem(CLAVE_PENDIENTE);
  } catch {
    return false;
  }
  if (!id) return false;
  try {
    await seguir(id);
    return true;
  } catch (error) {
    console.error("No se pudo seguir al artista pendiente", error);
    return false;
  }
}
