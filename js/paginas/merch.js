/* =========================================================
   Whiplash — Página Merch
   - La grilla muestra los primeros productos (`limit`) y
     "Ver más merch" suma otros tantos por vez hasta mostrar todos.
   - Los chips de tipo (data-tipo) filtran la grilla: con un tipo
     elegido se ven todos sus productos; "Todos" vuelve a lo que
     ya se había cargado.
   ========================================================= */

import { obtenerProductosConArtista } from "../servicios/datos.js";

const info = document.querySelector(".info-resultados");
const grilla = document.querySelector(".catalogo-merch product-grid");
const chips = document.querySelector(".barra-filtros .grupo-filtros");
const botonMas = document.querySelector(".boton-inferior");
const paso = Number(grilla.getAttribute("limit"));
let visibles = paso;
let productos = null;
let tipo = "";

// Los tipos de la tabla en plural, para los mensajes.
const PLURALES = { Disco: "discos", Entrada: "entradas", Remera: "remeras" };

// "Mostrando 6 de 14 productos" / "Mostrando 1 producto"
function textoMostrando(cantidad, total) {
  return total > cantidad
    ? `Mostrando ${cantidad} de ${total} productos`
    : `Mostrando ${cantidad} ${cantidad === 1 ? "producto" : "productos"}`;
}

function actualizar() {
  if (!productos.length) {
    info.textContent = "Todavía no hay productos.";
    botonMas.hidden = true;
    return;
  }
  const cantidad = Math.min(visibles, productos.length);
  info.textContent = textoMostrando(cantidad, productos.length);
  botonMas.hidden = cantidad >= productos.length;
}

function mostrarTipo() {
  if (!tipo) {
    grilla.mostrar(productos.slice(0, visibles));
    actualizar();
    return;
  }
  const lista = productos.filter((producto) => producto.tipo === tipo);
  grilla.mostrar(lista);
  info.textContent = lista.length
    ? textoMostrando(lista.length, lista.length)
    : `Todavía no hay ${PLURALES[tipo] ?? "productos de este tipo"}.`;
  botonMas.hidden = true;
}

// Es el mismo pedido que hace la grilla (datos.js lo guarda). Si
// ya se eligió un tipo, esta lista reemplaza a la que arma la grilla.
obtenerProductosConArtista()
  .then((lista) => {
    productos = lista;
    if (tipo) mostrarTipo();
    else actualizar();
  })
  .catch((error) => {
    console.error(error);
    info.textContent = "No pudimos cargar los productos. Probá de nuevo en un rato.";
  });

botonMas.addEventListener("click", () => {
  const nuevas = grilla.agregar(productos.slice(visibles, visibles + paso));
  visibles += nuevas.length;
  actualizar();
  // El foco pasa al primer control habilitado del primer producto
  // nuevo (el "−" de cantidad arranca deshabilitado) para seguir
  // desde ahí
  // (si el botón se ocultó, el foco no se pierde).
  nuevas[0]?.querySelector("a, button:enabled, input:enabled")?.focus();
});

// Si los productos todavía no llegaron, el tipo queda guardado y
// se aplica cuando lleguen.
chips.addEventListener("click", (evento) => {
  const elegido = evento.target.closest("button.chip-genero");
  if (!elegido || elegido.getAttribute("aria-pressed") === "true") return;

  for (const boton of chips.querySelectorAll("button.chip-genero")) {
    boton.setAttribute("aria-pressed", String(boton === elegido));
  }
  tipo = elegido.dataset.tipo;
  if (productos) mostrarTipo();
});
