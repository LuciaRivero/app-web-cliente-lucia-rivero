/* =========================================================
   Whiplash — Gestión de productos (administradores)
   Alta, edición y baja de productos con su imagen en el
   bucket "productos". Lo usa pages/admin.html; el trabajo
   con Supabase lo hace catalogo-admin.js.
   ========================================================= */

import { deleteRow, saveRow, getRows } from "./catalogo-admin.js";

export const PRODUCT_TYPES = ["Disco", "Remera", "Entrada"];

const PRODUCTS = {
  table: "productos",
  bucket: "productos",
  messages: {
    23503: "El artista elegido no existe.",
    23514: "Revisá los datos: el precio no puede ser negativo.",
  },
};

export function getAdminProducts() {
  return getRows(PRODUCTS.table);
}

// `product` sin id = alta; con id = edición. Ver saveRow().
export async function saveProduct({ id, titulo, tipo, precio, artista_id }, image) {
  const { row, error } = await saveRow(PRODUCTS, { id, titulo: titulo.trim(), tipo, precio, artista_id }, image);
  return { product: row, error };
}

// Los ítems de carritos con este producto se borran con él
// (on delete cascade en carrito_items).
export function deleteProduct(product) {
  return deleteRow(PRODUCTS, product);
}
