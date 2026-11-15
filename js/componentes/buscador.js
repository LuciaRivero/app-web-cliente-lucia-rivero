/* =========================================================
   Whiplash — Buscador del encabezado
   - Mientras se escribe muestra resultados en un desplegable.
   - Al enviar (Enter o botón) lleva a Explorar con ?q=...
   - En mobile, .boton-buscar muestra y oculta el formulario.
   ========================================================= */

import { search, getRootPath } from "../servicios/datos.js";
import { createSearchResult, formatPrice, getArtistUrl } from "./tarjetas.js";
import { createElement, getSearchQuery, getResultsText } from "../utilidades/dom.js";

const MAX_PER_GROUP = 4;
const DELAY_MS = 200;

export function initSearch() {
  const header = document.querySelector(".encabezado-sitio");
  const form = document.querySelector(".buscador");
  if (!header || !form) return;

  const input = form.querySelector('input[type="search"]');
  const exploreUrl = getRootPath("pages/explorar.html");

  const panel = createElement("div", {
    className: "buscador-resultados",
    attributes: { id: "buscador-resultados" },
  });
  panel.hidden = true;
  form.append(panel);
  input.setAttribute("aria-controls", panel.id);
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("autocomplete", "off");

  // Lector de pantalla: anuncia cuántos resultados hay.
  const announcement = createElement("p", { className: "sr-only", attributes: { "aria-live": "polite" } });
  form.append(announcement);

  // Si se está en Explorar con ?q=, el campo arranca con esa búsqueda.
  const currentQuery = getSearchQuery();
  if (currentQuery) input.value = currentQuery;

  function open() {
    panel.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function close() {
    panel.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }

  function getSearchUrl(term) {
    return `${exploreUrl}?q=${encodeURIComponent(term)}`;
  }

  function createGroup(title, elements) {
    return createElement(
      "div",
      { className: "grupo-resultados" },
      createElement("p", { className: "titulo-grupo", text: title }),
      ...elements,
    );
  }

  function showNotice(text) {
    panel.replaceChildren(createElement("p", { className: "sin-resultados", text }));
    open();
  }

  function render(term, { artists, products }) {
    const total = artists.length + products.length;

    if (total === 0) {
      showNotice(`No encontramos nada para “${term}”.`);
      announcement.textContent = "Sin resultados";
      return;
    }

    panel.replaceChildren();

    if (artists.length) {
      const rows = artists.slice(0, MAX_PER_GROUP).map((artist) =>
        createSearchResult({
          href: getArtistUrl(artist.id),
          image: artist.imagen,
          type: "artista",
          title: artist.nombre,
          detail: artist.genero,
        }),
      );
      panel.append(createGroup("Artistas", rows));
    }

    if (products.length) {
      const rows = products.slice(0, MAX_PER_GROUP).map((product) =>
        createSearchResult({
          href: getArtistUrl(product.artista_id),
          image: product.imagen,
          type: product.tipo,
          title: product.titulo,
          detail: [product.artist?.nombre, formatPrice(product.precio)]
            .filter(Boolean)
            .join(" · "),
        }),
      );
      panel.append(createGroup("Merch", rows));
    }

    panel.append(
      createElement("a", {
        className: "ver-todos",
        text: total === 1 ? "Ver 1 resultado" : `Ver los ${total} resultados`,
        attributes: { href: getSearchUrl(term) },
      }),
    );

    announcement.textContent = getResultsText(total);
    open();
  }

  // Cada búsqueda lleva un número; si llega la respuesta de una
  // búsqueda vieja (el usuario siguió escribiendo) se descarta.
  let lastSearch = 0;
  let timer;

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const term = input.value.trim();

    if (!term) {
      lastSearch++;
      close();
      return;
    }

    timer = setTimeout(async () => {
      const searchId = ++lastSearch;
      try {
        const results = await search(term);
        if (searchId === lastSearch) render(term, results);
      } catch (error) {
        console.error(error);
        if (searchId === lastSearch) showNotice("No pudimos buscar en este momento.");
      }
    }, DELAY_MS);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const term = input.value.trim();
    if (term) location.href = getSearchUrl(term);
  });

  // Teclado: flechas para moverse entre resultados, Escape para cerrar.
  form.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      input.focus();
      return;
    }

    if (panel.hidden || !["ArrowDown", "ArrowUp"].includes(event.key)) return;

    const links = [...panel.querySelectorAll("a")];
    if (!links.length) return;
    event.preventDefault();

    const current = links.indexOf(document.activeElement);
    if (event.key === "ArrowDown") {
      links[(current + 1) % links.length].focus();
    } else if (current <= 0) {
      input.focus();
    } else {
      links[current - 1].focus();
    }
  });

  input.addEventListener("focus", () => {
    if (input.value.trim() && panel.childElementCount) open();
  });

  // Se cierra cuando el foco o el clic salen del buscador.
  form.addEventListener("focusout", (event) => {
    if (!form.contains(event.relatedTarget)) close();
  });

  document.addEventListener("click", (event) => {
    if (!form.contains(event.target)) close();
  });

  // Mobile: la lupa abre y cierra el formulario.
  const searchButton = document.querySelector(".boton-buscar");
  if (searchButton) {
    searchButton.setAttribute("aria-expanded", "false");
    searchButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = header.classList.toggle("buscador-abierto");
      searchButton.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) input.focus();
    });
  }
}
