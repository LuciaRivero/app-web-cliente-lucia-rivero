/* =========================================================
   Whiplash — Página Carrito
   Arma la lista con lo que se guardó desde "Agregar al
   carrito" y maneja los botones − / + / Eliminar.
   Cada cambio actualiza solo su fila y el resumen, para no
   perder el foco del teclado al volver a dibujar la lista.
   ========================================================= */

import {
  MAX_QUANTITY,
  MIN_QUANTITY,
  updateQuantity,
  cartReady,
  getItemKey,
  removeFromCart,
  getCart,
} from "../servicios/carrito.js";
import { getProductsWithArtist, getRootPath } from "../servicios/datos.js";
import { createImage, formatPrice } from "../componentes/tarjetas.js";
import { createLoader, createElement } from "../utilidades/dom.js";

const SHIPPING_COST = 2500;
const ICONS = getRootPath("assets/img/iconos/iconos.svg");
const SVG_NS = "http://www.w3.org/2000/svg";

const list = document.querySelector(".carrito-items");
const title = document.querySelector("#titulo-items");
const notice = document.querySelector(".carrito-aviso");
const payButton = document.querySelector(".boton-pagar");
const summary = {
  subtotal: document.querySelector('[data-resumen="subtotal"]'),
  shipping: document.querySelector('[data-resumen="envio"]'),
  total: document.querySelector('[data-resumen="total"]'),
};

// Productos del catálogo indexados por id, para buscar
// título, precio e imagen de cada ítem guardado.
let productsById = new Map();

// El ícono va con createElementNS: los <svg> y <use> creados
// con createElement no se dibujan.
function createDeleteIcon() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "icono-eliminar");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("aria-hidden", "true");
  for (const [id, className] of [["eliminar-tapa", "tapa-eliminar"], ["eliminar-cuerpo", ""]]) {
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", `${ICONS}#${id}`);
    if (className) use.setAttribute("class", className);
    svg.append(use);
  }
  return svg;
}

// Cruz que reemplaza al tacho en mobile (el CSS muestra uno u otro).
function createCrossIcon() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "icono-cruz");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", "M6 6l12 12M18 6L6 18");
  svg.append(path);
  return svg;
}

// "Vinilo · Los Cráteres" / "Entrada · Los Cráteres"
function getSubtitle(item, product) {
  return [item.opcion ?? product.tipo, product.artist?.nombre].filter(Boolean).join(" · ");
}

function getItemName(item, product) {
  return item.opcion ? `${product.titulo} (${item.opcion})` : product.titulo;
}

function createItem(item, product) {
  const key = getItemKey(item);
  const name = getItemName(item, product);

  const decrease = createElement("button", {
    text: "−",
    attributes: { type: "button", "aria-label": `Restar una unidad de ${name}` },
  });
  const increase = createElement("button", {
    text: "+",
    attributes: { type: "button", "aria-label": `Sumar una unidad de ${name}` },
  });
  const quantity = createElement("span", { text: item.cantidad });
  const price = createElement("span", { className: "item-precio" });
  const deleteButton = createElement(
    "button",
    {
      className: "boton-eliminar",
      attributes: { type: "button", "aria-label": `Eliminar ${name} del carrito` },
    },
    createDeleteIcon(),
    createCrossIcon(),
    createElement("span", { className: "texto-eliminar", text: "Eliminar", attributes: { "aria-hidden": "true" } }),
  );

  const row = createElement(
    "article",
    { className: "carrito-item", attributes: { "data-clave": key } },
    createImage(product.imagen, { className: "item-imagen", type: product.tipo }),
    createElement(
      "div",
      { className: "item-detalle" },
      createElement("h3", { className: "item-titulo", text: product.titulo }),
      createElement("p", { className: "item-subtitulo", text: getSubtitle(item, product) }),
    ),
    createElement(
      "div",
      { className: "item-controles" },
      createElement("div", { className: "selector-cantidad" }, decrease, quantity, increase),
      price,
      createElement("div", { className: "item-eliminar" }, deleteButton),
    ),
  );

  function updateRow(units) {
    quantity.textContent = units;
    price.textContent = formatPrice(product.precio * units);
    decrease.disabled = units <= MIN_QUANTITY;
    increase.disabled = units >= MAX_QUANTITY;
  }

  function changeQuantity(difference) {
    const items = updateQuantity(key, difference);
    const units = items.find((current) => getItemKey(current) === key)?.cantidad ?? MIN_QUANTITY;
    updateRow(units);
    updateSummary();
    notice.textContent = `${name}: ${units} ${units === 1 ? "unidad" : "unidades"}`;
    // Si el botón se deshabilitó (llegó al mínimo o al máximo),
    // el foco pasa al otro para no quedar en un botón muerto.
    const [pressed, other] = difference < 0 ? [decrease, increase] : [increase, decrease];
    if (pressed.disabled) other.focus();
  }

  decrease.addEventListener("click", () => changeQuantity(-1));
  increase.addEventListener("click", () => changeQuantity(1));
  deleteButton.addEventListener("click", () => {
    removeFromCart(key);
    // El foco pasa al Eliminar del ítem siguiente (o anterior);
    // si no queda ninguno, al título de la lista.
    const sibling = row.nextElementSibling ?? row.previousElementSibling;
    row.remove();
    updateSummary();
    notice.textContent = `${name} se eliminó del carrito`;
    if (sibling?.classList.contains("carrito-item")) {
      sibling.querySelector(".boton-eliminar").focus();
    } else {
      showEmpty();
      title.focus();
    }
  });

  updateRow(item.cantidad);
  return row;
}

function showEmpty() {
  list.replaceChildren(
    createElement(
      "div",
      { className: "carrito-vacio" },
      createElement("p", { text: "Tu carrito está vacío." }),
      createElement("a", {
        className: "boton boton-contorno",
        text: "Ver merch",
        attributes: { href: getRootPath("pages/merch.html") },
      }),
    ),
  );
}

// Ítems guardados cuyo producto existe (si uno se borra de
// el catálogo, deja de mostrarse en vez de romper la página).
function getValidItems() {
  return getCart().filter((item) => productsById.has(item.id));
}

function updateSummary() {
  const subtotal = getValidItems().reduce(
    (sum, item) => sum + productsById.get(item.id).precio * item.cantidad,
    0,
  );
  const shipping = subtotal > 0 ? SHIPPING_COST : 0;
  summary.subtotal.textContent = formatPrice(subtotal);
  summary.shipping.textContent = formatPrice(shipping);
  summary.total.textContent = formatPrice(subtotal + shipping);
  payButton.disabled = subtotal === 0;
}

async function initCart() {
  list.setAttribute("aria-busy", "true");
  list.replaceChildren(createLoader("Cargando tu carrito…"));
  try {
    // Con sesión, primero llega el carrito guardado en la cuenta.
    const [products] = await Promise.all([getProductsWithArtist(), cartReady]);
    productsById = new Map(products.map((product) => [product.id, product]));
  } catch (error) {
    console.error(error);
    list.replaceChildren(createElement("p", { text: "No pudimos cargar tu carrito." }));
    return;
  } finally {
    list.removeAttribute("aria-busy");
  }

  const items = getValidItems();
  if (items.length) {
    list.replaceChildren(...items.map((item) => createItem(item, productsById.get(item.id))));
  } else {
    showEmpty();
  }
  updateSummary();
}

initCart();
