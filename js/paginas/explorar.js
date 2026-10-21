/* =========================================================
   Whiplash — Página Explorar
   - Los chips de <genre-chips filter> filtran la grilla
     de artistas por género.
   - Si la URL trae ?q=..., reemplaza la grilla general por
     los artistas y el merch que coinciden con la búsqueda.
   ========================================================= */

import { buscar, obtenerArtistas } from "../servicios/datos.js";
import { crearProductoMerch } from "../componentes/tarjetas.js";
import { crearElemento, leerConsulta, textoResultados } from "../utilidades/dom.js";

async function mostrarBusqueda() {
  const termino = leerConsulta();
  if (!termino) return;

  const info = document.querySelector(".info-resultados");
  const seccion = document.querySelector(".explorar-resultados");
  const grillaArtistas = seccion.querySelector("artist-grid");

  document.title = `“${termino}” | Explorar | Whiplash`;
  // Los chips y "Cargar más" son del listado general, no de una búsqueda.
  document.querySelector(".barra-filtros")?.setAttribute("hidden", "");
  document.querySelector(".boton-inferior")?.setAttribute("hidden", "");

  // Mientras busca, la grilla muestra el disco de carga en lugar
  // del listado general.
  info.textContent = `Buscando “${termino}”…`;
  grillaArtistas.mostrarCargando("Buscando…");

  let resultados;
  try {
    resultados = await buscar(termino);
  } catch (error) {
    console.error(error);
    info.textContent = "No pudimos cargar los resultados. Probá de nuevo en un rato.";
    grillaArtistas.mostrar([]);
    return;
  }

  const { artistas, productos } = resultados;
  const total = artistas.length + productos.length;
  info.textContent =
    total === 0
      ? `No encontramos resultados para “${termino}”.`
      : `${textoResultados(total)} para “${termino}”`;

  grillaArtistas.mostrar(artistas);
  grillaArtistas.hidden = artistas.length === 0;

  if (productos.length) {
    seccion.append(
      crearElemento("h2", { clase: "titulo-resultados-merch", texto: "Merch" }),
      crearElemento(
        "div",
        { clase: "grilla-merch" },
        ...productos.map((producto, indice) => {
          const tarjeta = crearProductoMerch(producto);
          tarjeta.style.setProperty("--orden", indice);
          return tarjeta;
        }),
      ),
    );
  }
}

function iniciarFiltroGenero() {
  const info = document.querySelector(".info-resultados");
  const grillaArtistas = document.querySelector(".explorar-resultados artist-grid");

  document.addEventListener("genre-change", async ({ detail }) => {
    let artistas;
    try {
      artistas = await obtenerArtistas();
    } catch (error) {
      console.error(error);
      info.textContent = "No pudimos cargar los artistas. Probá de nuevo en un rato.";
      return;
    }

    // "Todos" vuelve al listado inicial, con el mismo límite que la grilla.
    const limite = Number(grillaArtistas.getAttribute("limit")) || artistas.length;
    const lista = detail.genre
      ? artistas.filter((artista) => artista.genero === detail.genre)
      : artistas.slice(0, limite);

    grillaArtistas.mostrar(lista);
    info.textContent = `Mostrando ${lista.length} ${lista.length === 1 ? "artista" : "artistas"}`;
  });
}

iniciarFiltroGenero();
mostrarBusqueda();
