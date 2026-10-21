/* =========================================================
   Whiplash — Tarjetas generadas desde los datos
   Arman el HTML de .tarjeta-artista y .producto-merch
   para reutilizar sus estilos. Las usan <artist-grid>,
   <product-grid>, el buscador y la página Explorar.
   Se usa textContent para que los datos nunca se interpreten
   como HTML (importante cuando vengan de Supabase).
   ========================================================= */

import { rutaDesdeRaiz } from "../servicios/datos.js";
import { crearElemento } from "../utilidades/dom.js";

const URL_PRODUCTO = rutaDesdeRaiz("pages/producto.html");
// Opciones del formulario de compra según el tipo de producto.
// Las entradas no tienen opciones: se elige la cantidad.
const OPCIONES_COMPRA = {
  Disco: { etiqueta: "Formato", nombre: "formato", valores: ["Vinilo", "CD", "Digital"] },
  Remera: { etiqueta: "Talle", nombre: "talle", valores: ["S", "M", "L", "XL"] },
};

export function formatearPrecio(precio) {
  return `$${precio.toLocaleString("es-AR")}`;
}

function crearFigura(imagen, alt, titulo) {
  return crearElemento(
    "figure",
    {},
    crearElemento("img", { atributos: { src: rutaDesdeRaiz(imagen), alt } }),
    crearElemento("figcaption", { texto: titulo }),
  );
}

function crearFiguraConEnlace(imagen, alt, titulo) {
  return crearElemento("a", { atributos: { href: URL_PRODUCTO } }, crearFigura(imagen, alt, titulo));
}

export function crearTarjetaArtista(artista) {
  return crearElemento(
    "article",
    { clase: "tarjeta-artista" },
    crearFiguraConEnlace(artista.imagen, `Imagen de ${artista.nombre}`, artista.nombre),
    crearElemento("p", { clase: "genero-artista", texto: artista.genero }),
    crearElemento("button", { texto: "Seguir", atributos: { type: "button" } }),
  );
}

// Formulario de la página del artista: un desplegable con las
// opciones del tipo (formato, talle) o la cantidad de entradas.
function crearFormularioCompra(producto) {
  const idCampo = `compra-${producto.id}`;
  const opciones = OPCIONES_COMPRA[producto.tipo];
  let etiqueta;
  let campo;

  if (opciones) {
    etiqueta = `${opciones.etiqueta} de ${producto.titulo}`;
    campo = crearElemento(
      "select",
      { atributos: { id: idCampo, name: opciones.nombre } },
      ...opciones.valores.map((valor) => crearElemento("option", { texto: valor })),
    );
  } else {
    etiqueta = `Cantidad de ${producto.titulo}`;
    campo = crearElemento("input", {
      atributos: { type: "number", id: idCampo, name: "cantidad", value: "1", min: "1", max: "10" },
    });
  }

  return crearElemento(
    "form",
    { clase: "compra-merch", atributos: { action: "#", method: "post" } },
    crearElemento("label", { clase: "sr-only", texto: etiqueta, atributos: { for: idCampo } }),
    campo,
    crearElemento("button", { texto: "Agregar al carrito", atributos: { type: "submit" } }),
  );
}

// conCompra: en lugar del enlace "Ver producto" muestra el formulario
// para agregar al carrito (se usa en la página del artista).
export function crearProductoMerch(producto, { conCompra = false } = {}) {
  const alt = producto.artista
    ? `${producto.tipo} ${producto.titulo} de ${producto.artista.nombre}`
    : `${producto.tipo} ${producto.titulo}`;

  const portada = conCompra
    ? crearFigura(producto.imagen, alt, producto.titulo)
    : crearFiguraConEnlace(producto.imagen, alt, producto.titulo);

  const accion = conCompra
    ? crearFormularioCompra(producto)
    : crearElemento("a", {
        clase: "boton boton-compra",
        texto: "Ver producto",
        atributos: { href: URL_PRODUCTO },
      });

  return crearElemento(
    "article",
    { clase: "producto-merch" },
    portada,
    crearElemento("p", { clase: "tipo-merch", texto: producto.tipo }),
    crearElemento("p", { clase: "precio", texto: formatearPrecio(producto.precio) }),
    accion,
  );
}

// Fila compacta para el desplegable del buscador.
export function crearResultadoBuscador({ imagen, titulo, detalle }) {
  return crearElemento(
    "a",
    { clase: "resultado-buscador", atributos: { href: URL_PRODUCTO } },
    crearElemento("img", { atributos: { src: rutaDesdeRaiz(imagen), alt: "" } }),
    crearElemento(
      "span",
      {},
      crearElemento("strong", { texto: titulo }),
      crearElemento("small", { texto: detalle }),
    ),
  );
}
