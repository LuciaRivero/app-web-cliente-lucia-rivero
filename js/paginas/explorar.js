/* =========================================================
   Whiplash — Página Explorar
   Si la URL trae ?q=..., reemplaza la grilla de ejemplo por
   los artistas y el merch que coinciden con la búsqueda.
   ========================================================= */

import { buscar } from "../servicios/datos.js";
import { crearProductoMerch, crearTarjetaArtista } from "../componentes/tarjetas.js";

async function mostrarBusqueda() {
  const termino = new URLSearchParams(location.search).get("q")?.trim();
  if (!termino) return;

  const info = document.querySelector(".info-resultados");
  const seccion = document.querySelector(".explorar-resultados");
  const grillaArtistas = seccion.querySelector(".grilla-artistas");
  const cargarMas = document.querySelector(".boton-inferior");

  document.title = `“${termino}” | Explorar | Whiplash`;
  // Los chips y "Cargar más" son del listado general, no de una búsqueda.
  document.querySelector(".barra-filtros")?.setAttribute("hidden", "");
  cargarMas?.setAttribute("hidden", "");

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
      : `${total} ${total === 1 ? "resultado" : "resultados"} para “${termino}”`;

  grillaArtistas.replaceChildren(...artistas.map(crearTarjetaArtista));
  grillaArtistas.hidden = artistas.length === 0;

  if (productos.length) {
    const titulo = document.createElement("h2");
    titulo.className = "titulo-resultados-merch";
    titulo.textContent = "Merch";

    const grillaMerch = document.createElement("div");
    grillaMerch.className = "grilla-merch";
    grillaMerch.append(...productos.map(crearProductoMerch));

    seccion.append(titulo, grillaMerch);
  }
}

mostrarBusqueda();
