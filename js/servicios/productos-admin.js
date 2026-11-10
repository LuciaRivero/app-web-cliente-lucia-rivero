/* =========================================================
   Whiplash — Gestión de productos (administradores)
   Alta, edición y baja de productos con su imagen en el
   bucket "productos". Lo usa pages/admin.html; el trabajo
   con Supabase lo hace catalogo-admin.js.
   ========================================================= */

import { eliminarFila, guardarFila, obtenerFilas } from "./catalogo-admin.js";

export const TIPOS_PRODUCTO = ["Disco", "Remera", "Entrada"];

const PRODUCTOS = {
  tabla: "productos",
  bucket: "productos",
  mensajes: {
    23503: "El artista elegido no existe.",
    23514: "Revisá los datos: el precio no puede ser negativo.",
  },
};

export function obtenerProductosAdmin() {
  return obtenerFilas(PRODUCTOS.tabla);
}

// `producto` sin id = alta; con id = edición. Ver guardarFila().
export async function guardarProducto({ id, titulo, tipo, precio, artista_id }, imagen) {
  const { fila, error } = await guardarFila(PRODUCTOS, { id, titulo: titulo.trim(), tipo, precio, artista_id }, imagen);
  return { producto: fila, error };
}

// Los ítems de carritos con este producto se borran con él
// (on delete cascade en carrito_items).
export function eliminarProducto(producto) {
  return eliminarFila(PRODUCTOS, producto);
}
