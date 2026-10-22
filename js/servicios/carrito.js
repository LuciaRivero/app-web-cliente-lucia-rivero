/* =========================================================
   Whiplash — Estado del carrito
   Único lugar que sabe dónde se guarda el carrito.
   Cada ítem es { id, opcion, cantidad } y los datos del
   producto (título, precio, imagen) se buscan en el catálogo
   al mostrarlo.

   La copia de trabajo vive en localStorage, así leer el
   carrito es inmediato. Con sesión, además, cada cambio se
   guarda en la tabla carrito_items de Supabase y al cargar
   la página se trae lo guardado (carritoListo): el carrito
   sigue al usuario en cualquier navegador. Al ingresar, lo
   agregado sin sesión se suma a lo de la cuenta; al cerrar
   sesión, la copia local se vacía.

   Cada vez que se guarda dispara CAMBIO_CARRITO en window,
   así <site-header> actualiza el contador del ícono.
   ========================================================= */

import { CAMBIO_SESION, obtenerToken, usuarioActual } from "./sesion.js";
import { pedirTabla } from "./supabase.js";

const CLAVE = "whiplash-carrito";
export const CAMBIO_CARRITO = "carrito-cambiado";
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
  window.dispatchEvent(new CustomEvent(CAMBIO_CARRITO));
  return items;
}

// Unidades en total: 2 vinilos + 1 entrada = 3.
export function contarUnidades(items = leerCarrito()) {
  return items.reduce((total, item) => total + item.cantidad, 0);
}

// El evento storage llega cuando otra pestaña cambia el carrito.
export function escucharCambiosCarrito(callback) {
  window.addEventListener(CAMBIO_CARRITO, callback);
  window.addEventListener("storage", (evento) => {
    if (evento.key === CLAVE || evento.key === null) callback();
  });
}

function limitar(cantidad) {
  return Math.min(CANTIDAD_MAXIMA, Math.max(CANTIDAD_MINIMA, cantidad));
}

// El mismo producto con otra opción (Vinilo / CD, talle S / M)
// es un ítem distinto del carrito.
export function claveItem({ id, opcion }) {
  return `${id}-${opcion ?? ""}`;
}

/* ---------- Copia en Supabase (solo con sesión) ---------- */

// En la tabla, "sin opción" es '' (forma parte de la clave primaria).
const aFila = ({ id, opcion, cantidad }) => ({ producto_id: id, opcion: opcion ?? "", cantidad });
const aItem = ({ producto_id, opcion, cantidad }) => ({ id: producto_id, opcion: opcion || null, cantidad });

// Inserta o actualiza filas. keepalive: si después de agregar se
// cambia de página, el pedido termina igual.
async function guardarFilas(items) {
  const token = await obtenerToken();
  if (!token || !items.length) return;
  await pedirTabla("carrito_items", {
    metodo: "POST",
    cuerpo: items.map(aFila),
    token,
    prefer: "resolution=merge-duplicates,return=minimal",
    mantener: true,
  });
}

async function borrarFila({ id, opcion }) {
  const token = await obtenerToken();
  if (!token) return;
  const filtro = `producto_id=eq.${id}&opcion=eq.${encodeURIComponent(opcion ?? "")}`;
  await pedirTabla(`carrito_items?${filtro}`, { metodo: "DELETE", token, mantener: true });
}

async function leerFilas() {
  const token = await obtenerToken();
  if (!token) return null;
  const filas = await pedirTabla("carrito_items?select=producto_id,opcion,cantidad&order=creado_en", { token });
  return filas.map(aItem);
}

// Un error de red no frena al usuario: la copia local ya cambió.
function enCuenta(promesa) {
  promesa.catch((error) => console.error("No se pudo guardar el carrito en la cuenta", error));
}

// Con sesión, al cargar la página se trae el carrito de la cuenta.
// La página Carrito lo espera antes de dibujar la lista.
export const carritoListo = usuarioActual()
  ? leerFilas()
      .then((items) => {
        if (items) guardarCarrito(items);
      })
      .catch((error) => console.error("No se pudo traer el carrito de la cuenta", error))
  : Promise.resolve();

// Al cerrar sesión (o si la sesión vence) el carrito de esa cuenta
// no queda a la vista de quien use el navegador después.
window.addEventListener(CAMBIO_SESION, (evento) => {
  if (!evento.detail && leerCarrito().length) guardarCarrito([]);
});

// Después de ingresar o registrarse: suma lo agregado sin sesión
// a lo que ya tenía la cuenta y guarda el resultado en los dos lados.
export async function unirCarritoAlIngresar() {
  try {
    const deLaCuenta = (await leerFilas()) ?? [];
    const unidos = new Map(deLaCuenta.map((item) => [claveItem(item), { ...item }]));
    for (const item of leerCarrito()) {
      const existente = unidos.get(claveItem(item));
      if (existente) existente.cantidad = limitar(existente.cantidad + item.cantidad);
      else unidos.set(claveItem(item), { ...item });
    }
    const items = guardarCarrito([...unidos.values()]);
    await guardarFilas(items);
  } catch (error) {
    console.error("No se pudo unir el carrito con la cuenta", error);
  }
}

/* ---------- Operaciones ---------- */

export function agregarAlCarrito(id, opcion = null, cantidad = 1) {
  const items = leerCarrito();
  let item = items.find((actual) => claveItem(actual) === claveItem({ id, opcion }));
  if (item) {
    item.cantidad = limitar(item.cantidad + cantidad);
  } else {
    item = { id, opcion, cantidad: limitar(cantidad) };
    items.push(item);
  }
  enCuenta(guardarFilas([item]));
  return guardarCarrito(items);
}

export function cambiarCantidad(clave, diferencia) {
  const items = leerCarrito();
  const item = items.find((actual) => claveItem(actual) === clave);
  if (item) {
    item.cantidad = limitar(item.cantidad + diferencia);
    enCuenta(guardarFilas([item]));
  }
  return guardarCarrito(items);
}

export function eliminarDelCarrito(clave) {
  const items = leerCarrito();
  const item = items.find((actual) => claveItem(actual) === clave);
  if (item) enCuenta(borrarFila(item));
  return guardarCarrito(items.filter((actual) => claveItem(actual) !== clave));
}
