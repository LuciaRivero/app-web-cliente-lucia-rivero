/* =========================================================
   Whiplash — Página Explorar
   - La grilla de artistas muestra los primeros 6 y "Cargar
     más" suma de a 6 hasta mostrar todos.
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

// "Mostrando 6 de 14 artistas" / "Mostrando 3 artistas"
function textoMostrando(cantidad, total) {
  return total > cantidad
    ? `Mostrando ${cantidad} de ${total} artistas`
    : `Mostrando ${cantidad} ${cantidad === 1 ? "artista" : "artistas"}`;
}

// Listado general: la grilla arranca con `limit` artistas y "Cargar
// más" suma otros tantos por vez. Con un género elegido se ven todos
// los de ese género y "Cargar más" se oculta; "Todos" vuelve a lo que
// ya se había cargado.
function iniciarListado() {
  const info = document.querySelector(".info-resultados");
  const grillaArtistas = document.querySelector(".explorar-resultados artist-grid");
  const botonMas = document.querySelector(".boton-inferior");
  const paso = Number(grillaArtistas.getAttribute("limit"));
  let visibles = paso;
  let artistas = null;

  function actualizar() {
    const cantidad = Math.min(visibles, artistas.length);
    info.textContent = textoMostrando(cantidad, artistas.length);
    botonMas.hidden = cantidad >= artistas.length;
  }

  // Es el mismo pedido que hace la grilla (datos.js lo guarda).
  obtenerArtistas()
    .then((lista) => {
      artistas = lista;
      actualizar();
    })
    .catch((error) => {
      console.error(error);
      info.textContent = "No pudimos cargar los artistas. Probá de nuevo en un rato.";
    });

  botonMas.addEventListener("click", () => {
    const nuevas = grillaArtistas.agregar(artistas.slice(visibles, visibles + paso));
    visibles += nuevas.length;
    actualizar();
    // El foco pasa a la primera tarjeta nueva para seguir desde ahí
    // (si el botón se ocultó, el foco no se pierde).
    nuevas[0]?.querySelector("a")?.focus();
  });

  document.addEventListener("genre-change", ({ detail }) => {
    if (!artistas) return;
    if (!detail.genre) {
      grillaArtistas.mostrar(artistas.slice(0, visibles));
      actualizar();
      return;
    }
    const lista = artistas.filter((artista) => artista.genero === detail.genre);
    grillaArtistas.mostrar(lista);
    info.textContent = textoMostrando(lista.length, lista.length);
    botonMas.hidden = true;
  });
}

// Con ?q= la página muestra una búsqueda en lugar del listado general.
if (leerConsulta()) mostrarBusqueda();
else iniciarListado();
