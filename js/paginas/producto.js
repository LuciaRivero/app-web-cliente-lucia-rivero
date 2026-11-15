/* =========================================================
   Whiplash — Perfil del artista
   Arma la página con el artista de ?id= (tabla artistas):
   portada, nombre, género, bio, tracks, merch, <title> y
   migas de pan. Sin ?id= muestra el artista 1; con un id que
   no existe, el aviso "Artista no encontrado".
   Conecta "Seguir" (ver setupFollowButton en tarjetas.js) y
   "Compartir": usa la Web Share API (el menú de compartir del
   sistema) y, donde no existe, copia el link al portapapeles.
   ========================================================= */

import { getArtists, getProducts } from "../servicios/datos.js";
import { showImage, setupFollowButton } from "../componentes/tarjetas.js";
import { createElement } from "../utilidades/dom.js";

const DEFAULT_ID = 1;

const profile = document.querySelector(".perfil-artista");
const notFound = document.querySelector(".artista-no-encontrado");
const followButton = profile.querySelector(".boton-seguir");
const shareButton = profile.querySelector(".boton-compartir");
const notice = profile.querySelector(".aviso-compartir");

function getArtistId() {
  const param = new URLSearchParams(location.search).get("id");
  return param === null ? DEFAULT_ID : Number(param);
}

function createTrack(track, index) {
  return createElement(
    "li",
    {},
    createElement(
      "button",
      { className: "track", attributes: { type: "button" } },
      createElement("span", { className: "track-num", text: index + 1 }),
      createElement(
        "span",
        { className: "track-info" },
        createElement("span", { className: "track-titulo", text: track.titulo }),
        createElement("span", { className: "track-duracion", text: track.duracion }),
      ),
    ),
  );
}

function renderArtist(artist, merchCount) {
  document.title = `${artist.nombre} | Whiplash`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", `Perfil del artista ${artist.nombre} en Whiplash - Música independiente y merch`);

  // <site-breadcrumbs> ya se armó con los textos provisorios del HTML.
  const genreCrumb = document.querySelector(".miga-genero");
  if (genreCrumb) genreCrumb.textContent = artist.genero;
  const currentCrumb = document.querySelector('.migas-de-pan [aria-current="page"]');
  if (currentCrumb) currentCrumb.textContent = artist.nombre;

  const cover = profile.querySelector(".portada-artista img");
  showImage(cover, artist.imagen, "artista");
  cover.alt = `Portada del artista ${artist.nombre}`;
  cover.hidden = false;

  profile.querySelector("#titulo-artista").textContent = artist.nombre;
  profile.querySelector(".genero-artista").textContent = artist.genero;
  profile.querySelector(".bio-artista").textContent = artist.bio ?? "";

  const tracks = artist.tracks ?? [];
  profile.querySelector(".tracks").hidden = !tracks.length;
  profile.querySelector(".lista-tracks").replaceChildren(...tracks.map(createTrack));

  // No todos los artistas tienen merch: en ese caso, un aviso.
  const merch = merchCount
    ? createElement("product-grid", { attributes: { artist: artist.id, "with-purchase": "" } })
    : createElement("p", { className: "sin-merch", text: "Este artista todavía no tiene merch a la venta." });
  profile.querySelector(".merch-artista").append(merch);

  setupFollowButton(followButton, artist);
  profile.removeAttribute("aria-busy");
}

function showNotFound() {
  document.title = "Artista no encontrado | Whiplash";
  const currentCrumb = document.querySelector('.migas-de-pan [aria-current="page"]');
  if (currentCrumb) currentCrumb.textContent = "Artista no encontrado";
  profile.hidden = true;
  notFound.hidden = false;
}

async function share() {
  const data = { title: document.title, url: location.href };
  notice.textContent = "";

  if (navigator.share) {
    try {
      await navigator.share(data);
    } catch (error) {
      // AbortError: el usuario cerró el menú sin compartir.
      if (error.name !== "AbortError") notice.textContent = "No pudimos compartir este perfil.";
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(data.url);
    notice.textContent = "Copiamos el link del perfil al portapapeles.";
  } catch {
    notice.textContent = "No pudimos copiar el link. Copialo desde la barra de direcciones.";
  }
}

shareButton.addEventListener("click", share);

try {
  const id = getArtistId();
  const [artists, products] = await Promise.all([getArtists(), getProducts()]);
  const artist = artists.find((current) => current.id === id);
  const merchCount = products.filter((product) => product.artista_id === id).length;
  if (artist) renderArtist(artist, merchCount);
  else showNotFound();
} catch (error) {
  console.error(error);
  showNotFound();
}
