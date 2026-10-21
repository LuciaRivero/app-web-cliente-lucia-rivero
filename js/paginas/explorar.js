/* =========================================================
   Whiplash — Página Explorar
   Si la URL trae ?q=..., reemplaza la grilla general por
   los artistas y el merch que coinciden con la búsqueda.
   ========================================================= */

import { buscar } from "../servicios/datos.js";
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

  let resultados;
  try {
    resultados = await buscar(termino);
  } catch (error) {
    console.error(error);
    info.textContent = "No pudimos cargar los resultados. Probá de nuevo en un rato.";
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
      crearElemento("div", { clase: "grilla-merch" }, ...productos.map((p) => crearProductoMerch(p))),
    );
  }
}

mostrarBusqueda();
