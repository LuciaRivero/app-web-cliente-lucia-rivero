/* =========================================================
   Whiplash — Estado del carrito
   Único lugar que sabe dónde se guarda el carrito.
   Por ahora vive en localStorage; cada ítem es
   { id, opcion, cantidad } y los datos del producto (título,
   precio, imagen) se buscan en productos.json al mostrarlo.
   ========================================================= */

const CLAVE = "whiplash-carrito";
export const CANTIDAD_MINIMA = 1;
export const CANTIDAD_MAXIMA = 10;

// localStorage puede fallar (modo privado, almacenamiento
// bloqueado): en ese caso el carrito arranca vacío.
export function leerCarrito() {
  try {
    const items = JSON.parse(localStorage.getItem(CLAVE));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function guardarCarrito(items) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch (error) {
    console.error("No se pudo guardar el carrito", error);
  }
  return items;
}

function limitar(cantidad) {
  return Math.min(CANTIDAD_MAXIMA, Math.max(CANTIDAD_MINIMA, cantidad));
}

// El mismo producto con otra opción (Vinilo / CD, talle S / M)
// es un ítem distinto del carrito.
export function claveItem({ id, opcion }) {
  return `${id}-${opcion ?? ""}`;
}

export function agregarAlCarrito(id, opcion = null, cantidad = 1) {
  const items = leerCarrito();
  const existente = items.find((item) => claveItem(item) === claveItem({ id, opcion }));
  if (existente) {
    existente.cantidad = limitar(existente.cantidad + cantidad);
  } else {
    items.push({ id, opcion, cantidad: limitar(cantidad) });
  }
  return guardarCarrito(items);
}

export function cambiarCantidad(clave, diferencia) {
  const items = leerCarrito();
  const item = items.find((actual) => claveItem(actual) === clave);
  if (item) item.cantidad = limitar(item.cantidad + diferencia);
  return guardarCarrito(items);
}

export function eliminarDelCarrito(clave) {
  return guardarCarrito(leerCarrito().filter((item) => claveItem(item) !== clave));
}
