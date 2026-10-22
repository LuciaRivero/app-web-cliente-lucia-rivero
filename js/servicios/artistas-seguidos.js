/* =========================================================
   Whiplash — Artistas seguidos
   Ids de artistas.json que sigue el usuario con sesión, en el
   orden en que los siguió. Se guardan en su registro de
   usuario (ver leerDatoUsuario en sesion.js); sin sesión la
   lista está vacía y no se puede seguir a nadie.

   Si alguien toca "Seguir" sin sesión, el artista queda
   pendiente en sessionStorage y se sigue al ingresar o
   registrarse (completarSeguirPendiente).
   ========================================================= */

import { guardarDatoUsuario, leerDatoUsuario } from "./sesion.js";

const CLAVE = "seguidos";
const CLAVE_PENDIENTE = "whiplash-seguir-pendiente";

export function leerSeguidos() {
  const ids = leerDatoUsuario(CLAVE, []);
  return Array.isArray(ids) ? ids : [];
}

export function estaSiguiendo(id) {
  return leerSeguidos().includes(id);
}

// Devuelve si quedó siguiendo al artista.
export function alternarSeguir(id) {
  const ids = leerSeguidos();
  const siguiendo = !ids.includes(id);
  guardarDatoUsuario(CLAVE, siguiendo ? [...ids, id] : ids.filter((actual) => actual !== id));
  return siguiendo;
}

function seguir(id) {
  const ids = leerSeguidos();
  if (!ids.includes(id)) guardarDatoUsuario(CLAVE, [...ids, id]);
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
export function completarSeguirPendiente() {
  let id;
  try {
    id = Number(sessionStorage.getItem(CLAVE_PENDIENTE));
    sessionStorage.removeItem(CLAVE_PENDIENTE);
  } catch {
    return false;
  }
  if (!id) return false;
  seguir(id);
  return true;
}

export function dejarDeSeguir(id) {
  guardarDatoUsuario(CLAVE, leerSeguidos().filter((actual) => actual !== id));
}
