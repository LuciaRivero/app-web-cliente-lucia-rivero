/* =========================================================
   Whiplash — Página Géneros
   - Arma una .tarjeta-genero por cada género de la tabla
     generos (Supabase) que tiene artistas, con su lista.
   - Los chips de <genre-chips filter> filtran las tarjetas
     en la misma página; "Todos" vuelve a mostrarlas todas.
   ========================================================= */

import { getArtists, getGenresWithArtists } from "../servicios/datos.js";
import { getArtistUrl, getGenreUrl } from "../componentes/tarjetas.js";
import { createLoader, createElement } from "../utilidades/dom.js";

const info = document.querySelector(".info-resultados");
const grid = document.querySelector(".grilla-generos");

// "Mostrando 1 género" / "Mostrando 11 géneros"
function getGenresText(count) {
  return `Mostrando ${count} ${count === 1 ? "género" : "géneros"}`;
}

// "Deathcore: 5 artistas"
function getGenreText(card) {
  const count = Number(card.dataset.artistas);
  return `${card.dataset.genero}: ${count} ${count === 1 ? "artista" : "artistas"}`;
}

function createGenreCard(genre, artists) {
  const card = createElement("article", { className: "tarjeta-genero" }, createElement("h3", { text: genre.nombre }));
  card.dataset.genero = genre.nombre;
  card.dataset.artistas = artists.length;

  card.append(
    createElement(
      "ul",
      {},
      ...artists.map((artist) =>
        createElement(
          "li",
          {},
          createElement("a", { text: artist.nombre, attributes: { href: getArtistUrl(artist.id) } }),
        ),
      ),
    ),
    createElement("a", {
      className: "boton",
      text: "Ver artistas",
      attributes: { href: getGenreUrl(genre.nombre), "aria-label": `Ver artistas de ${genre.nombre}` },
    }),
  );
  return card;
}

let cards = [];
let selected = null;

// Con un género elegido queda visible solo su tarjeta.
function filterCards() {
  const visible = cards.find((card) => card.dataset.genero === selected);
  for (const card of cards) {
    card.hidden = Boolean(selected) && card !== visible;
  }
  info.textContent = selected && visible ? getGenreText(visible) : getGenresText(cards.length);
}

// Si se elige un chip antes de que lleguen los artistas, el
// filtro se aplica cuando lleguen.
document.addEventListener("genre-change", ({ detail }) => {
  selected = detail.genre;
  if (cards.length) filterCards();
});

async function renderGenres() {
  const loader = createLoader("Cargando géneros…");
  grid.setAttribute("aria-busy", "true");
  grid.append(loader);

  let genres;
  let artists;
  try {
    [genres, artists] = await Promise.all([getGenresWithArtists(), getArtists()]);
  } catch (error) {
    console.error(error);
    info.textContent = "No pudimos cargar los géneros. Probá de nuevo en un rato.";
    return;
  } finally {
    loader.remove();
    grid.removeAttribute("aria-busy");
  }

  // --orden escalona la animación de entrada (css/componentes/cargando.css).
  cards = genres.map((genre, index) => {
    const card = createGenreCard(
      genre,
      artists.filter((artist) => artist.genero === genre.nombre),
    );
    card.style.setProperty("--orden", index);
    return card;
  });
  grid.append(...cards);
  filterCards();
}

renderGenres();
