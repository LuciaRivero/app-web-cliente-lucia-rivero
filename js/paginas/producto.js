/* =========================================================
   Whiplash — Perfil del artista
   Conecta "Seguir" (ver prepararBotonSeguir en tarjetas.js) y
   "Compartir": usa la Web Share API (el menú de compartir del
   sistema) y, donde no existe, copia el link al portapapeles.
   Por ahora la página es fija: el artista sale de data-artista.
   ========================================================= */

import { obtenerArtistas } from "../servicios/datos.js";
import { prepararBotonSeguir } from "../componentes/tarjetas.js";

const acciones = document.querySelector(".acciones-artista");
const botonSeguir = acciones.querySelector(".boton-seguir");
const botonCompartir = acciones.querySelector(".boton-compartir");
const aviso = document.querySelector(".aviso-compartir");

async function compartir() {
  const datos = { title: document.title, url: location.href };
  aviso.textContent = "";

  if (navigator.share) {
    try {
      await navigator.share(datos);
    } catch (error) {
      // AbortError: el usuario cerró el menú sin compartir.
      if (error.name !== "AbortError") aviso.textContent = "No pudimos compartir este perfil.";
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(datos.url);
    aviso.textContent = "Copiamos el link del perfil al portapapeles.";
  } catch {
    aviso.textContent = "No pudimos copiar el link. Copialo desde la barra de direcciones.";
  }
}

botonCompartir.addEventListener("click", compartir);

// "Seguir" necesita el nombre del artista para su aria-label.
try {
  const id = Number(acciones.dataset.artista);
  const artista = (await obtenerArtistas()).find((actual) => actual.id === id);
  if (artista) prepararBotonSeguir(botonSeguir, artista);
} catch (error) {
  console.error(error);
}
