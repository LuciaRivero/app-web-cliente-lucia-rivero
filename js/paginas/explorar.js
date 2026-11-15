/* =========================================================
   Whiplash — Página Explorar
   - La grilla de artistas muestra los primeros 6 y "Cargar
     más" suma de a 6 hasta mostrar todos.
   - Los chips de <genre-chips filter> filtran la grilla
     de artistas por género. Con ?genero=... (los chips de la
     home y de Géneros) la página abre con ese género elegido.
   - Si la URL trae ?q=..., reemplaza la grilla general por
     los artistas y el merch que coinciden con la búsqueda.
   ========================================================= */

import { search, getArtists } from "../servicios/datos.js";
import { createMerchProduct } from "../componentes/tarjetas.js";
import { createElement, getSearchQuery, getResultsText } from "../utilidades/dom.js";

async function renderSearch() {
  const term = getSearchQuery();
  if (!term) return;

  const info = document.querySelector(".info-resultados");
  const section = document.querySelector(".explorar-resultados");
  const artistGrid = section.querySelector("artist-grid");

  document.title = `“${term}” | Explorar | Whiplash`;
  // Los chips y "Cargar más" son del listado general, no de una búsqueda.
  document.querySelector(".barra-filtros")?.setAttribute("hidden", "");
  document.querySelector(".boton-inferior")?.setAttribute("hidden", "");

  // Mientras busca, la grilla muestra el disco de carga en lugar
  // del listado general.
  info.textContent = `Buscando “${term}”…`;
  artistGrid.showLoading("Buscando…");

  let results;
  try {
    results = await search(term);
  } catch (error) {
    console.error(error);
    info.textContent = "No pudimos cargar los resultados. Probá de nuevo en un rato.";
    artistGrid.render([]);
    return;
  }

  const { artists, products } = results;
  const total = artists.length + products.length;
  info.textContent =
    total === 0
      ? `No encontramos resultados para “${term}”.`
      : `${getResultsText(total)} para “${term}”`;

  artistGrid.render(artists);
  artistGrid.hidden = artists.length === 0;

  if (products.length) {
    section.append(
      createElement("h2", { className: "titulo-resultados-merch", text: "Merch" }),
      createElement(
        "div",
        { className: "grilla-merch" },
        ...products.map((product, index) => {
          const card = createMerchProduct(product);
          card.style.setProperty("--orden", index);
          return card;
        }),
      ),
    );
  }
}

// "Mostrando 6 de 14 artistas" / "Mostrando 3 artistas"
function getShowingText(count, total) {
  return total > count
    ? `Mostrando ${count} de ${total} artistas`
    : `Mostrando ${count} ${count === 1 ? "artista" : "artistas"}`;
}

// El género elegido queda en la URL (?genero=...), así recargar o
// compartir la página mantiene el filtro.
function saveGenreInUrl(genre) {
  const url = new URL(location.href);
  if (genre) url.searchParams.set("genero", genre);
  else url.searchParams.delete("genero");
  history.replaceState(null, "", url);
}

// Listado general: la grilla arranca con `limit` artistas y "Cargar
// más" suma otros tantos por vez. Con un género elegido se ven todos
// los de ese género y "Cargar más" se oculta; "Todos" vuelve a lo que
// ya se había cargado.
function initListing() {
  const info = document.querySelector(".info-resultados");
  const artistGrid = document.querySelector(".explorar-resultados artist-grid");
  const chips = document.querySelector(".barra-filtros genre-chips");
  const moreButton = document.querySelector(".boton-inferior");
  const step = Number(artistGrid.getAttribute("limit"));
  let visibleCount = step;
  let artists = null;
  let genre = new URLSearchParams(location.search).get("genero")?.trim() || null;

  if (genre) chips.setAttribute("selected", genre);

  function updateInfo() {
    const count = Math.min(visibleCount, artists.length);
    info.textContent = getShowingText(count, artists.length);
    moreButton.hidden = count >= artists.length;
  }

  function renderGenre() {
    if (!genre) {
      artistGrid.render(artists.slice(0, visibleCount));
      updateInfo();
      return;
    }
    const filtered = artists.filter((artist) => artist.genero === genre);
    artistGrid.render(filtered);
    info.textContent = filtered.length
      ? getShowingText(filtered.length, filtered.length)
      : "Todavía no hay artistas de este género.";
    moreButton.hidden = true;
  }

  // Es el mismo pedido que hace la grilla (datos.js lo guarda). Si
  // llegó un género, esta lista reemplaza a la que arma la grilla.
  getArtists()
    .then((list) => {
      artists = list;
      if (genre) renderGenre();
      else updateInfo();
    })
    .catch((error) => {
      console.error(error);
      info.textContent = "No pudimos cargar los artistas. Probá de nuevo en un rato.";
    });

  moreButton.addEventListener("click", () => {
    const added = artistGrid.appendItems(artists.slice(visibleCount, visibleCount + step));
    visibleCount += added.length;
    updateInfo();
    // El foco pasa a la primera tarjeta nueva para seguir desde ahí
    // (si el botón se ocultó, el foco no se pierde).
    added[0]?.querySelector("a")?.focus();
  });

  // Si los artistas todavía no llegaron, el género queda guardado
  // y se aplica cuando lleguen.
  document.addEventListener("genre-change", ({ detail }) => {
    genre = detail.genre;
    saveGenreInUrl(genre);
    if (artists) renderGenre();
  });
}

// Con ?q= la página muestra una búsqueda en lugar del listado general.
if (getSearchQuery()) renderSearch();
else initListing();
