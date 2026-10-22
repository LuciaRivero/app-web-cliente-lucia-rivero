/* =========================================================
   Whiplash — Página Carrito
   Arma la lista con lo que se guardó desde "Agregar al
   carrito" y maneja los botones − / + / Eliminar.
   Cada cambio actualiza solo su fila y el resumen, para no
   perder el foco del teclado al volver a dibujar la lista.
   ========================================================= */

import {
  CANTIDAD_MAXIMA,
  CANTIDAD_MINIMA,
  cambiarCantidad,
  claveItem,
  eliminarDelCarrito,
  leerCarrito,
} from "../servicios/carrito.js";
import { obtenerProductosConArtista, rutaDesdeRaiz } from "../servicios/datos.js";
import { formatearPrecio } from "../componentes/tarjetas.js";
import { crearCargando, crearElemento } from "../utilidades/dom.js";

const ENVIO = 2500;
const ICONOS = rutaDesdeRaiz("assets/img/iconos/iconos.svg");
const SVG_NS = "http://www.w3.org/2000/svg";

const lista = document.querySelector(".carrito-items");
const titulo = document.querySelector("#titulo-items");
const aviso = document.querySelector(".carrito-aviso");
const botonPagar = document.querySelector(".boton-pagar");
const resumen = {
  subtotal: document.querySelector('[data-resumen="subtotal"]'),
  envio: document.querySelector('[data-resumen="envio"]'),
  total: document.querySelector('[data-resumen="total"]'),
};

// Productos de productos.json indexados por id, para buscar
// título, precio e imagen de cada ítem guardado.
let productosPorId = new Map();

// El ícono va con createElementNS: los <svg> y <use> creados
// con createElement no se dibujan.
function crearIconoEliminar() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "icono-eliminar");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("aria-hidden", "true");
  for (const [id, clase] of [["eliminar-tapa", "tapa-eliminar"], ["eliminar-cuerpo", ""]]) {
    const uso = document.createElementNS(SVG_NS, "use");
    uso.setAttribute("href", `${ICONOS}#${id}`);
    if (clase) uso.setAttribute("class", clase);
    svg.append(uso);
  }
  return svg;
}

// Cruz que reemplaza al tacho en mobile (el CSS muestra uno u otro).
function crearIconoCruz() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "icono-cruz");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const trazo = document.createElementNS(SVG_NS, "path");
  trazo.setAttribute("d", "M6 6l12 12M18 6L6 18");
  svg.append(trazo);
  return svg;
}

// "Vinilo · Los Cráteres" / "Entrada · Los Cráteres"
function crearSubtitulo(item, producto) {
  return [item.opcion ?? producto.tipo, producto.artista?.nombre].filter(Boolean).join(" · ");
}

function nombreItem(item, producto) {
  return item.opcion ? `${producto.titulo} (${item.opcion})` : producto.titulo;
}

function crearItem(item, producto) {
  const clave = claveItem(item);
  const nombre = nombreItem(item, producto);

  const restar = crearElemento("button", {
    texto: "−",
    atributos: { type: "button", "aria-label": `Restar una unidad de ${nombre}` },
  });
  const sumar = crearElemento("button", {
    texto: "+",
    atributos: { type: "button", "aria-label": `Sumar una unidad de ${nombre}` },
  });
  const cantidad = crearElemento("span", { texto: item.cantidad });
  const precio = crearElemento("span", { clase: "item-precio" });
  const eliminar = crearElemento(
    "button",
    {
      clase: "boton-eliminar",
      atributos: { type: "button", "aria-label": `Eliminar ${nombre} del carrito` },
    },
    crearIconoEliminar(),
    crearIconoCruz(),
    crearElemento("span", { clase: "texto-eliminar", texto: "Eliminar", atributos: { "aria-hidden": "true" } }),
  );

  const fila = crearElemento(
    "article",
    { clase: "carrito-item", atributos: { "data-clave": clave } },
    crearElemento("img", {
      clase: "item-imagen",
      atributos: { src: rutaDesdeRaiz(producto.imagen), alt: "" },
    }),
    crearElemento(
      "div",
      { clase: "item-detalle" },
      crearElemento("h3", { clase: "item-titulo", texto: producto.titulo }),
      crearElemento("p", { clase: "item-subtitulo", texto: crearSubtitulo(item, producto) }),
    ),
    crearElemento(
      "div",
      { clase: "item-controles" },
      crearElemento("div", { clase: "selector-cantidad" }, restar, cantidad, sumar),
      precio,
      crearElemento("div", { clase: "item-eliminar" }, eliminar),
    ),
  );

  function actualizarFila(unidades) {
    cantidad.textContent = unidades;
    precio.textContent = formatearPrecio(producto.precio * unidades);
    restar.disabled = unidades <= CANTIDAD_MINIMA;
    sumar.disabled = unidades >= CANTIDAD_MAXIMA;
  }

  function cambiar(diferencia) {
    const items = cambiarCantidad(clave, diferencia);
    const unidades = items.find((actual) => claveItem(actual) === clave)?.cantidad ?? CANTIDAD_MINIMA;
    actualizarFila(unidades);
    actualizarResumen();
    aviso.textContent = `${nombre}: ${unidades} ${unidades === 1 ? "unidad" : "unidades"}`;
    // Si el botón se deshabilitó (llegó al mínimo o al máximo),
    // el foco pasa al otro para no quedar en un botón muerto.
    const [pulsado, otro] = diferencia < 0 ? [restar, sumar] : [sumar, restar];
    if (pulsado.disabled) otro.focus();
  }

  restar.addEventListener("click", () => cambiar(-1));
  sumar.addEventListener("click", () => cambiar(1));
  eliminar.addEventListener("click", () => {
    eliminarDelCarrito(clave);
    // El foco pasa al Eliminar del ítem siguiente (o anterior);
    // si no queda ninguno, al título de la lista.
    const vecina = fila.nextElementSibling ?? fila.previousElementSibling;
    fila.remove();
    actualizarResumen();
    aviso.textContent = `${nombre} se eliminó del carrito`;
    if (vecina?.classList.contains("carrito-item")) {
      vecina.querySelector(".boton-eliminar").focus();
    } else {
      mostrarVacio();
      titulo.focus();
    }
  });

  actualizarFila(item.cantidad);
  return fila;
}

function mostrarVacio() {
  lista.replaceChildren(
    crearElemento(
      "div",
      { clase: "carrito-vacio" },
      crearElemento("p", { texto: "Tu carrito está vacío." }),
      crearElemento("a", {
        clase: "boton boton-contorno",
        texto: "Ver merch",
        atributos: { href: rutaDesdeRaiz("pages/merch.html") },
      }),
    ),
  );
}

// Ítems guardados cuyo producto existe (si uno se borra de
// productos.json, deja de mostrarse en vez de romper la página).
function itemsValidos() {
  return leerCarrito().filter((item) => productosPorId.has(item.id));
}

function actualizarResumen() {
  const subtotal = itemsValidos().reduce(
    (suma, item) => suma + productosPorId.get(item.id).precio * item.cantidad,
    0,
  );
  const envio = subtotal > 0 ? ENVIO : 0;
  resumen.subtotal.textContent = formatearPrecio(subtotal);
  resumen.envio.textContent = formatearPrecio(envio);
  resumen.total.textContent = formatearPrecio(subtotal + envio);
  botonPagar.disabled = subtotal === 0;
}

async function iniciarCarrito() {
  lista.setAttribute("aria-busy", "true");
  lista.replaceChildren(crearCargando("Cargando tu carrito…"));
  try {
    const productos = await obtenerProductosConArtista();
    productosPorId = new Map(productos.map((producto) => [producto.id, producto]));
  } catch (error) {
    console.error(error);
    lista.replaceChildren(crearElemento("p", { texto: "No pudimos cargar tu carrito." }));
    return;
  } finally {
    lista.removeAttribute("aria-busy");
  }

  const items = itemsValidos();
  if (items.length) {
    lista.replaceChildren(...items.map((item) => crearItem(item, productosPorId.get(item.id))));
  } else {
    mostrarVacio();
  }
  actualizarResumen();
}

iniciarCarrito();
