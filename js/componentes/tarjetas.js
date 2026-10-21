/* =========================================================
   Whiplash — Tarjetas generadas desde los datos
   Arman el mismo HTML que está escrito a mano en las páginas
   (.tarjeta-artista y .producto-merch) para reutilizar sus estilos.
   Se usa textContent para que los datos nunca se interpreten
   como HTML (importante cuando vengan de Supabase).
   ========================================================= */

import { rutaDesdeRaiz } from "../servicios/datos.js";

const URL_PRODUCTO = rutaDesdeRaiz("pages/producto.html");

export function formatearPrecio(precio) {
  return `$${precio.toLocaleString("es-AR")}`;
}

function crearFigura(imagen, alt, titulo) {
  const enlace = document.createElement("a");
  enlace.href = URL_PRODUCTO;

  const figura = document.createElement("figure");
  const img = document.createElement("img");
  img.src = rutaDesdeRaiz(imagen);
  img.alt = alt;
  const leyenda = document.createElement("figcaption");
  leyenda.textContent = titulo;

  figura.append(img, leyenda);
  enlace.append(figura);
  return enlace;
}

function crearParrafo(clase, texto) {
  const parrafo = document.createElement("p");
  parrafo.className = clase;
  parrafo.textContent = texto;
  return parrafo;
}

export function crearTarjetaArtista(artista) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta-artista";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.textContent = "Seguir";

  tarjeta.append(
    crearFigura(artista.imagen, `Imagen de ${artista.nombre}`, artista.nombre),
    crearParrafo("genero-artista", artista.genero),
    boton,
  );
  return tarjeta;
}

export function crearProductoMerch(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "producto-merch";

  const alt = producto.artista
    ? `${producto.tipo} ${producto.titulo} de ${producto.artista.nombre}`
    : `${producto.tipo} ${producto.titulo}`;

  const enlace = document.createElement("a");
  enlace.className = "boton boton-compra";
  enlace.href = URL_PRODUCTO;
  enlace.textContent = "Ver producto";

  tarjeta.append(
    crearFigura(producto.imagen, alt, producto.titulo),
    crearParrafo("tipo-merch", producto.tipo),
    crearParrafo("precio", formatearPrecio(producto.precio)),
    enlace,
  );
  return tarjeta;
}

// Fila compacta para el desplegable del buscador.
export function crearResultadoBuscador({ imagen, titulo, detalle }) {
  const enlace = document.createElement("a");
  enlace.className = "resultado-buscador";
  enlace.href = URL_PRODUCTO;

  const img = document.createElement("img");
  img.src = rutaDesdeRaiz(imagen);
  img.alt = "";

  const textos = document.createElement("span");
  const nombre = document.createElement("strong");
  nombre.textContent = titulo;
  const extra = document.createElement("small");
  extra.textContent = detalle;
  textos.append(nombre, extra);

  enlace.append(img, textos);
  return enlace;
}
