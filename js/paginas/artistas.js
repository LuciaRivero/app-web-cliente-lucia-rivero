/* =========================================================
   Whiplash — Página Mis artistas
   Solo con sesión: sin ella lleva a Mi cuenta para ingresar.
   Arma la lista con los artistas que sigue el usuario (en el
   orden en que los siguió) y maneja el botón "Quitar".
   ========================================================= */

import { unfollow, getFollowed } from "../servicios/artistas-seguidos.js";
import { createImage, getArtistUrl } from "../componentes/tarjetas.js";
import { getArtists, getRootPath } from "../servicios/datos.js";
import { getCurrentUser } from "../servicios/sesion.js";
import { createLoader, createElement } from "../utilidades/dom.js";

const list = document.querySelector(".lista-artistas");
const emptyState = document.querySelector(".artistas-vacio");
const notice = document.querySelector(".artistas-aviso");
const title = document.querySelector("#titulo-mis-artistas");

function showEmpty() {
  list.hidden = true;
  emptyState.hidden = false;
}

function createItem(artist) {
  const removeButton = createElement("button", {
    className: "quitar",
    text: "Quitar",
    attributes: { type: "button", "aria-label": `Quitar a ${artist.nombre} de mis artistas` },
  });

  const item = createElement(
    "li",
    { className: "artista-guardado" },
    createElement(
      "a",
      { className: "artista-guardado-enlace", attributes: { href: getArtistUrl(artist.id) } },
      createImage(artist.imagen, { className: "avatar", alt: `Avatar de ${artist.nombre}`, type: "artista" }),
      createElement("span", { className: "artista-guardado-nombre", text: artist.nombre }),
      createElement("span", { className: "artista-guardado-genero", text: artist.genero }),
    ),
    removeButton,
  );

  removeButton.addEventListener("click", async () => {
    removeButton.disabled = true;
    try {
      await unfollow(artist.id);
    } catch (error) {
      console.error(error);
      removeButton.disabled = false;
      notice.textContent = `No pudimos quitar a ${artist.nombre}. Probá de nuevo.`;
      return;
    }
    // El foco pasa al "Quitar" siguiente (o al anterior); si la
    // lista queda vacía, al título, para no perderse con el teclado.
    const sibling = item.nextElementSibling ?? item.previousElementSibling;
    item.remove();
    notice.textContent = `Quitaste a ${artist.nombre} de tus artistas.`;
    if (sibling) {
      sibling.querySelector(".quitar").focus();
    } else {
      showEmpty();
      title.focus();
    }
  });

  return item;
}

async function init() {
  list.replaceChildren(createElement("li", {}, createLoader("Cargando tus artistas…")));
  try {
    const [ids, artists] = await Promise.all([getFollowed(), getArtists()]);
    const byId = new Map(artists.map((artist) => [artist.id, artist]));
    const followed = ids.map((id) => byId.get(id)).filter(Boolean);
    if (!followed.length) {
      showEmpty();
      return;
    }
    list.replaceChildren(...followed.map(createItem));
  } catch (error) {
    console.error(error);
    list.replaceChildren(createElement("li", { text: "No pudimos cargar tus artistas." }));
  }
}

if (getCurrentUser()) init();
else location.replace(getRootPath("pages/cuenta.html"));
