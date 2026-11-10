/* =========================================================
   Whiplash — Gestión de productos (administradores)
   Alta, edición y baja de productos y subida de sus imágenes
   al bucket "productos" de Supabase Storage. Lo usa
   pages/admin.html.
   Supabase solo acepta estos pedidos con el token de un
   administrador (políticas RLS de supabase/esquema.sql).

   Igual que sesion.js, las funciones devuelven { error } con
   un mensaje listo para mostrar, o el resultado si salió bien.
   ========================================================= */

import { SUPABASE_URL, pedirStorage, pedirTabla } from "./supabase.js";
import { obtenerToken } from "./sesion.js";

const BUCKET = "productos";
// Las imágenes subidas se leen por esta URL; las que empiezan
// con assets/ son las del sitio y no se borran de Storage.
const URL_IMAGENES = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;

export const TIPOS_PRODUCTO = ["Disco", "Remera", "Entrada"];
// Los mismos límites que tiene el bucket en Storage.
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
export const TAMANO_MAXIMO_IMAGEN = 2 * 1024 * 1024;

const SIN_PERMISO = "Tu cuenta no tiene permiso para administrar productos. Volvé a ingresar.";

// Códigos de PostgREST y de Storage → mensajes para el usuario.
const MENSAJES = {
  42501: SIN_PERMISO,
  23503: "El artista elegido no existe.",
  23514: "Revisá los datos: el precio no puede ser negativo.",
  sin_conexion: "No hay conexión con el servidor. Revisá tu internet y probá de nuevo.",
};

function mensajeDeError(error) {
  console.error(error);
  if (MENSAJES[error.codigo]) return MENSAJES[error.codigo];
  if (error.estado === 401 || error.estado === 403) return SIN_PERMISO;
  if (error.estado === 413) return "La imagen pesa más de 2 MB.";
  return "Algo salió mal. Probá de nuevo en un rato.";
}

// null si el archivo se puede subir; si no, el motivo.
export function validarImagen(archivo) {
  if (!TIPOS_IMAGEN.includes(archivo.type)) return "La imagen tiene que ser JPG, PNG o WebP.";
  if (archivo.size > TAMANO_MAXIMO_IMAGEN) return "La imagen pesa más de 2 MB.";
  return null;
}

// Nombre único para no pisar otra imagen con el mismo nombre.
async function subirImagen(archivo, token) {
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[archivo.type];
  const nombre = `${crypto.randomUUID()}.${extension}`;
  await pedirStorage(`object/${BUCKET}/${nombre}`, { metodo: "POST", archivo, token });
  return URL_IMAGENES + nombre;
}

// Si falla, la imagen queda en Storage sin usar: no vale la
// pena frenar el guardado por eso.
async function borrarImagen(url, token) {
  if (!url?.startsWith(URL_IMAGENES)) return;
  try {
    await pedirStorage(`object/${BUCKET}/${url.slice(URL_IMAGENES.length)}`, { metodo: "DELETE", token });
  } catch (error) {
    console.error("No se pudo borrar la imagen", error);
  }
}

// Sin caché (a diferencia de datos.js): después de cada cambio
// la página vuelve a pedir la lista.
export function obtenerProductosAdmin() {
  return pedirTabla("productos?select=*&order=id");
}

// `producto` sin id = alta; con id = edición.
// `archivo`: imagen nueva (opcional). `quitarImagen`: deja el
// producto sin imagen, así se muestra la de reemplazo.
// `imagenActual`: la que tenía, para borrarla si se reemplaza.
export async function guardarProducto({ id, titulo, tipo, precio, artista_id }, { archivo, quitarImagen, imagenActual } = {}) {
  const token = await obtenerToken();
  if (!token) return { error: "Tu sesión se cerró. Volvé a ingresar." };

  const datos = { titulo: titulo.trim(), tipo, precio, artista_id };
  let imagenNueva = null;
  try {
    if (archivo) {
      imagenNueva = await subirImagen(archivo, token);
      datos.imagen = imagenNueva;
    } else if (quitarImagen) {
      datos.imagen = null;
    }

    const opciones = { cuerpo: datos, token, prefer: "return=representation" };
    const [guardado] = id
      ? await pedirTabla(`productos?id=eq.${id}`, { ...opciones, metodo: "PATCH" })
      : await pedirTabla("productos", { ...opciones, metodo: "POST" });
    // Sin permiso, RLS no tira error en un PATCH: no actualiza ninguna fila.
    if (!guardado) {
      await borrarImagen(imagenNueva, token);
      return { error: SIN_PERMISO };
    }

    if ("imagen" in datos && imagenActual !== datos.imagen) await borrarImagen(imagenActual, token);
    return { producto: guardado };
  } catch (error) {
    await borrarImagen(imagenNueva, token);
    return { error: mensajeDeError(error) };
  }
}

// Los ítems de carritos con este producto se borran con él
// (on delete cascade en carrito_items).
export async function eliminarProducto(producto) {
  const token = await obtenerToken();
  if (!token) return { error: "Tu sesión se cerró. Volvé a ingresar." };

  try {
    const [borrado] = await pedirTabla(`productos?id=eq.${producto.id}`, {
      metodo: "DELETE",
      token,
      prefer: "return=representation",
    });
    if (!borrado) return { error: SIN_PERMISO };
    await borrarImagen(producto.imagen, token);
    return {};
  } catch (error) {
    return { error: mensajeDeError(error) };
  }
}
