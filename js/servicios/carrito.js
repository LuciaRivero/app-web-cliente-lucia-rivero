/* =========================================================
   Whiplash — Estado del carrito
   Único lugar que sabe dónde se guarda el carrito.
   Cada ítem es { id, opcion, cantidad } y los datos del
   producto (título, precio, imagen) se buscan en el catálogo
   al mostrarlo. Esas propiedades quedan en español porque
   así están guardadas en localStorage y en la tabla.

   La copia de trabajo vive en localStorage, así leer el
   carrito es inmediato. Con sesión, además, cada cambio se
   guarda en la tabla carrito_items de Supabase y al cargar
   la página se trae lo guardado (cartReady): el carrito
   sigue al usuario en cualquier navegador. Al ingresar, lo
   agregado sin sesión se suma a lo de la cuenta; al cerrar
   sesión, la copia local se vacía.

   Cada vez que se guarda dispara CART_CHANGE en window,
   así <site-header> actualiza el contador del ícono.
   ========================================================= */

import { SESSION_CHANGE, getToken, getCurrentUser } from "./sesion.js";
import { fetchTable } from "./supabase.js";

const CART_KEY = "whiplash-carrito";
export const CART_CHANGE = "carrito-cambiado";
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;

// localStorage puede fallar (modo privado, almacenamiento
// bloqueado): en ese caso el carrito arranca vacío.
export function getCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("No se pudo guardar el carrito", error);
  }
  window.dispatchEvent(new CustomEvent(CART_CHANGE));
  return items;
}

// Unidades en total: 2 vinilos + 1 entrada = 3.
export function countUnits(items = getCart()) {
  return items.reduce((total, item) => total + item.cantidad, 0);
}

// El evento storage llega cuando otra pestaña cambia el carrito.
export function onCartChange(callback) {
  window.addEventListener(CART_CHANGE, callback);
  window.addEventListener("storage", (event) => {
    if (event.key === CART_KEY || event.key === null) callback();
  });
}

function clampQuantity(quantity) {
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, quantity));
}

// El mismo producto con otra opción (Vinilo / CD, talle S / M)
// es un ítem distinto del carrito.
export function getItemKey({ id, opcion: option }) {
  return `${id}-${option ?? ""}`;
}

/* ---------- Copia en Supabase (solo con sesión) ---------- */

// En la tabla, "sin opción" es '' (forma parte de la clave primaria).
const toRow = ({ id, opcion, cantidad }) => ({ producto_id: id, opcion: opcion ?? "", cantidad });
const toItem = ({ producto_id, opcion, cantidad }) => ({ id: producto_id, opcion: opcion || null, cantidad });

// Inserta o actualiza filas. keepalive: si después de agregar se
// cambia de página, el pedido termina igual.
async function saveCartRows(items) {
  const token = await getToken();
  if (!token || !items.length) return;
  await fetchTable("carrito_items", {
    method: "POST",
    body: items.map(toRow),
    token,
    prefer: "resolution=merge-duplicates,return=minimal",
    keepalive: true,
  });
}

async function deleteCartRow({ id, opcion: option }) {
  const token = await getToken();
  if (!token) return;
  const filter = `producto_id=eq.${id}&opcion=eq.${encodeURIComponent(option ?? "")}`;
  await fetchTable(`carrito_items?${filter}`, { method: "DELETE", token, keepalive: true });
}

async function getCartRows() {
  const token = await getToken();
  if (!token) return null;
  const rows = await fetchTable("carrito_items?select=producto_id,opcion,cantidad&order=creado_en", { token });
  return rows.map(toItem);
}

// Un error de red no frena al usuario: la copia local ya cambió.
function syncToAccount(promise) {
  promise.catch((error) => console.error("No se pudo guardar el carrito en la cuenta", error));
}

// Con sesión, al cargar la página se trae el carrito de la cuenta.
// La página Carrito lo espera antes de dibujar la lista.
export const cartReady = getCurrentUser()
  ? getCartRows()
      .then((items) => {
        if (items) saveCart(items);
      })
      .catch((error) => console.error("No se pudo traer el carrito de la cuenta", error))
  : Promise.resolve();

// Al cerrar sesión (o si la sesión vence) el carrito de esa cuenta
// no queda a la vista de quien use el navegador después.
window.addEventListener(SESSION_CHANGE, (event) => {
  if (!event.detail && getCart().length) saveCart([]);
});

// Después de ingresar o registrarse: suma lo agregado sin sesión
// a lo que ya tenía la cuenta y guarda el resultado en los dos lados.
export async function mergeCartOnSignIn() {
  try {
    const fromAccount = (await getCartRows()) ?? [];
    const merged = new Map(fromAccount.map((item) => [getItemKey(item), { ...item }]));
    for (const item of getCart()) {
      const existing = merged.get(getItemKey(item));
      if (existing) existing.cantidad = clampQuantity(existing.cantidad + item.cantidad);
      else merged.set(getItemKey(item), { ...item });
    }
    const items = saveCart([...merged.values()]);
    await saveCartRows(items);
  } catch (error) {
    console.error("No se pudo unir el carrito con la cuenta", error);
  }
}

/* ---------- Operaciones ---------- */

export function addToCart(id, option = null, quantity = 1) {
  const items = getCart();
  let item = items.find((current) => getItemKey(current) === getItemKey({ id, opcion: option }));
  if (item) {
    item.cantidad = clampQuantity(item.cantidad + quantity);
  } else {
    item = { id, opcion: option, cantidad: clampQuantity(quantity) };
    items.push(item);
  }
  syncToAccount(saveCartRows([item]));
  return saveCart(items);
}

export function updateQuantity(key, difference) {
  const items = getCart();
  const item = items.find((current) => getItemKey(current) === key);
  if (item) {
    item.cantidad = clampQuantity(item.cantidad + difference);
    syncToAccount(saveCartRows([item]));
  }
  return saveCart(items);
}

export function removeFromCart(key) {
  const items = getCart();
  const item = items.find((current) => getItemKey(current) === key);
  if (item) syncToAccount(deleteCartRow(item));
  return saveCart(items.filter((current) => getItemKey(current) !== key));
}
