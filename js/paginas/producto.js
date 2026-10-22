/* =========================================================
   Whiplash — Perfil del artista
   Arma la página con el artista de ?id= (artistas.json):
   portada, nombre, género, bio, tracks, merch, <title> y
   migas de pan. Sin ?id= muestra el artista 1; con un id que
   no existe, el aviso "Artista no encontrado".
   Conecta "Seguir" (ver prepararBotonSeguir en tarjetas.js) y
   "Compartir": usa la Web Share API (el menú de compartir del
   sistema) y, donde no existe, copia el link al portapapeles.
   ========================================================= */

import { obtenerArtistas, obtenerProductos, rutaDesdeRaiz } from "../servicios/datos.js";
import { prepararBotonSeguir } from "../componentes/tarjetas.js";
import { crearElemento } from "../utilidades/dom.js";

const ID_POR_DEFECTO = 1;

const perfil = document.querySelector(".perfil-artista");
const noEncontrado = document.querySelector(".artista-no-encontrado");
const botonSeguir = perfil.querySelector(".boton-seguir");
const botonCompartir = perfil.querySelector(".boton-compartir");
const aviso = perfil.querySelector(".aviso-compartir");

function leerId() {
  const parametro = new URLSearchParams(location.search).get("id");
  return parametro === null ? ID_POR_DEFECTO : Number(parametro);
}

function crearTrack(track, indice) {
  return crearElemento(
    "li",
    {},
    crearElemento(
      "button",
      { clase: "track", atributos: { type: "button" } },
      crearElemento("span", { clase: "track-num", texto: indice + 1 }),
      crearElemento(
        "span",
        { clase: "track-info" },
        crearElemento("span", { clase: "track-titulo", texto: track.titulo }),
        crearElemento("span", { clase: "track-duracion", texto: track.duracion }),
      ),
    ),
  );
}

function mostrarArtista(artista, cantidadMerch) {
  document.title = `${artista.nombre} | Whiplash`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", `Perfil del artista ${artista.nombre} en Whiplash - Música independiente y merch`);

  // <site-breadcrumbs> ya se armó con los textos provisorios del HTML.
  const miga = document.querySelector(".miga-genero");
  if (miga) miga.textContent = artista.genero;
  const actual = document.querySelector('.migas-de-pan [aria-current="page"]');
  if (actual) actual.textContent = artista.nombre;

  const portada = perfil.querySelector(".portada-artista img");
  portada.src = rutaDesdeRaiz(artista.imagen);
  portada.alt = `Portada del artista ${artista.nombre}`;
  portada.hidden = false;

  perfil.querySelector("#titulo-artista").textContent = artista.nombre;
  perfil.querySelector(".genero-artista").textContent = artista.genero;
  perfil.querySelector(".bio-artista").textContent = artista.bio ?? "";

  const tracks = artista.tracks ?? [];
  perfil.querySelector(".tracks").hidden = !tracks.length;
  perfil.querySelector(".lista-tracks").replaceChildren(...tracks.map(crearTrack));

  // No todos los artistas tienen merch: en ese caso, un aviso.
  const merch = cantidadMerch
    ? crearElemento("product-grid", { atributos: { artist: artista.id, "with-purchase": "" } })
    : crearElemento("p", { clase: "sin-merch", texto: "Este artista todavía no tiene merch a la venta." });
  perfil.querySelector(".merch-artista").append(merch);

  prepararBotonSeguir(botonSeguir, artista);
  perfil.removeAttribute("aria-busy");
}

function mostrarNoEncontrado() {
  document.title = "Artista no encontrado | Whiplash";
  const actual = document.querySelector('.migas-de-pan [aria-current="page"]');
  if (actual) actual.textContent = "Artista no encontrado";
  perfil.hidden = true;
  noEncontrado.hidden = false;
}

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

try {
  const id = leerId();
  const [artistas, productos] = await Promise.all([obtenerArtistas(), obtenerProductos()]);
  const artista = artistas.find((actual) => actual.id === id);
  const cantidadMerch = productos.filter((producto) => producto.artista_id === id).length;
  if (artista) mostrarArtista(artista, cantidadMerch);
  else mostrarNoEncontrado();
} catch (error) {
  console.error(error);
  mostrarNoEncontrado();
}
