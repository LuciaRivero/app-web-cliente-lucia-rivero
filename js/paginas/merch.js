/* =========================================================
   Whiplash — Página Merch
   - La grilla muestra los primeros productos (`limit`) y
     "Ver más merch" suma otros tantos por vez hasta mostrar todos.
   - Los chips de tipo (data-tipo) filtran la grilla: con un tipo
     elegido se ven todos sus productos; "Todos" vuelve a lo que
     ya se había cargado.
   ========================================================= */

import { getProductsWithArtist } from "../servicios/datos.js";

const info = document.querySelector(".info-resultados");
const grid = document.querySelector(".catalogo-merch product-grid");
const chips = document.querySelector(".barra-filtros .grupo-filtros");
const moreButton = document.querySelector(".boton-inferior");
const step = Number(grid.getAttribute("limit"));
let visibleCount = step;
let products = null;
let type = "";

// Los tipos de la tabla en plural, para los mensajes.
const PLURALS = { Disco: "discos", Entrada: "entradas", Remera: "remeras" };

// "Mostrando 6 de 14 productos" / "Mostrando 1 producto"
function getShowingText(count, total) {
  return total > count
    ? `Mostrando ${count} de ${total} productos`
    : `Mostrando ${count} ${count === 1 ? "producto" : "productos"}`;
}

function updateInfo() {
  if (!products.length) {
    info.textContent = "Todavía no hay productos.";
    moreButton.hidden = true;
    return;
  }
  const count = Math.min(visibleCount, products.length);
  info.textContent = getShowingText(count, products.length);
  moreButton.hidden = count >= products.length;
}

function renderType() {
  if (!type) {
    grid.render(products.slice(0, visibleCount));
    updateInfo();
    return;
  }
  const filtered = products.filter((product) => product.tipo === type);
  grid.render(filtered);
  info.textContent = filtered.length
    ? getShowingText(filtered.length, filtered.length)
    : `Todavía no hay ${PLURALS[type] ?? "productos de este tipo"}.`;
  moreButton.hidden = true;
}

// Es el mismo pedido que hace la grilla (datos.js lo guarda). Si
// ya se eligió un tipo, esta lista reemplaza a la que arma la grilla.
getProductsWithArtist()
  .then((list) => {
    products = list;
    if (type) renderType();
    else updateInfo();
  })
  .catch((error) => {
    console.error(error);
    info.textContent = "No pudimos cargar los productos. Probá de nuevo en un rato.";
  });

moreButton.addEventListener("click", () => {
  const added = grid.appendItems(products.slice(visibleCount, visibleCount + step));
  visibleCount += added.length;
  updateInfo();
  // El foco pasa al primer control habilitado del primer producto
  // nuevo (el "−" de cantidad arranca deshabilitado) para seguir
  // desde ahí
  // (si el botón se ocultó, el foco no se pierde).
  added[0]?.querySelector("a, button:enabled, input:enabled")?.focus();
});

// Si los productos todavía no llegaron, el tipo queda guardado y
// se aplica cuando lleguen.
chips.addEventListener("click", (event) => {
  const selected = event.target.closest("button.chip-genero");
  if (!selected || selected.getAttribute("aria-pressed") === "true") return;

  for (const button of chips.querySelectorAll("button.chip-genero")) {
    button.setAttribute("aria-pressed", String(button === selected));
  }
  type = selected.dataset.tipo;
  if (products) renderType();
});
