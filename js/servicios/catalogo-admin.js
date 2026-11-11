/* =========================================================
   Whiplash — ABM del catálogo (administradores)
   Alta, edición y baja de filas de las tablas del catálogo
   (productos y artistas) con su imagen en Supabase Storage.
   Lo usan productos-admin.js y artistas-admin.js.
   Supabase solo acepta estos pedidos con el token de un
   administrador o del dueño del artista (políticas RLS de
   supabase/esquema.sql).

   Igual que sesion.js, las funciones devuelven { error } con
   un mensaje listo para mostrar, o el resultado si salió bien.
   ========================================================= */

import { SUPABASE_URL, pedirStorage, pedirTabla } from "./supabase.js";
import { obtenerToken, usuarioActual } from "./sesion.js";

// Los mismos límites que tienen los buckets en Storage.
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
export const TAMANO_MAXIMO_IMAGEN = 2 * 1024 * 1024;

const SIN_PERMISO = "Tu cuenta no tiene permiso para hacer este cambio. Volvé a ingresar.";
const SIN_SESION = "Tu sesión se cerró. Volvé a ingresar.";

// Códigos de PostgREST y de Storage → mensajes para el usuario.
// Cada tabla puede sumar o cambiar los suyos (`mensajes`).
const MENSAJES = {
  42501: SIN_PERMISO,
  23514: "Revisá los datos: hay un valor fuera de rango.",
  sin_conexion: "No hay conexión con el servidor. Revisá tu internet y probá de nuevo.",
};

function mensajeDeError(error, mensajes = {}) {
  console.error(error);
  const mensaje = mensajes[error.codigo] ?? MENSAJES[error.codigo];
  if (mensaje) return mensaje;
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

// Las imágenes subidas se leen por esta URL; las que empiezan
// con assets/ son las del sitio y no se borran de Storage.
function urlImagenes(bucket) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/`;
}

// Nombre único para no pisar otra imagen con el mismo nombre, en la
// carpeta de la cuenta: las cuentas de artista solo pueden escribir
// en la suya (políticas de Storage en supabase/esquema.sql).
async function subirImagen(bucket, archivo, token) {
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[archivo.type];
  const nombre = `${usuarioActual().id}/${crypto.randomUUID()}.${extension}`;
  await pedirStorage(`object/${bucket}/${nombre}`, { metodo: "POST", archivo, token });
  return urlImagenes(bucket) + nombre;
}

// Si falla, la imagen queda en Storage sin usar: no vale la
// pena frenar el guardado por eso.
async function borrarImagen(bucket, url, token) {
  if (!url?.startsWith(urlImagenes(bucket))) return;
  try {
    await pedirStorage(`object/${bucket}/${url.slice(urlImagenes(bucket).length)}`, { metodo: "DELETE", token });
  } catch (error) {
    console.error("No se pudo borrar la imagen", error);
  }
}

// Sin caché (a diferencia de datos.js): la página de admin
// vuelve a pedir la lista cada vez que se abre.
export function obtenerFilas(tabla) {
  return pedirTabla(`${tabla}?select=*&order=id`);
}

// `datos.id` vacío = alta; con id = edición (el id no se envía).
// `archivo`: imagen nueva (opcional). `quitarImagen`: deja la
// fila sin imagen, así se muestra la de reemplazo.
// `imagenActual`: la que tenía, para borrarla si se reemplaza.
export async function guardarFila(
  { tabla, bucket, mensajes },
  { id, ...datos },
  { archivo, quitarImagen, imagenActual } = {},
) {
  const token = await obtenerToken();
  if (!token) return { error: SIN_SESION };

  let imagenNueva = null;
  try {
    if (archivo) {
      imagenNueva = await subirImagen(bucket, archivo, token);
      datos.imagen = imagenNueva;
    } else if (quitarImagen) {
      datos.imagen = null;
    }

    const opciones = { cuerpo: datos, token, prefer: "return=representation" };
    const [guardada] = id
      ? await pedirTabla(`${tabla}?id=eq.${id}`, { ...opciones, metodo: "PATCH" })
      : await pedirTabla(tabla, { ...opciones, metodo: "POST" });
    // Sin permiso, RLS no tira error en un PATCH: no actualiza ninguna fila.
    if (!guardada) {
      await borrarImagen(bucket, imagenNueva, token);
      return { error: SIN_PERMISO };
    }

    if ("imagen" in datos && imagenActual !== datos.imagen) await borrarImagen(bucket, imagenActual, token);
    return { fila: guardada };
  } catch (error) {
    await borrarImagen(bucket, imagenNueva, token);
    return { error: mensajeDeError(error, mensajes) };
  }
}

export async function eliminarFila({ tabla, bucket, mensajes }, fila) {
  const token = await obtenerToken();
  if (!token) return { error: SIN_SESION };

  try {
    const [borrada] = await pedirTabla(`${tabla}?id=eq.${fila.id}`, {
      metodo: "DELETE",
      token,
      prefer: "return=representation",
    });
    if (!borrada) return { error: SIN_PERMISO };
    await borrarImagen(bucket, fila.imagen, token);
    return {};
  } catch (error) {
    return { error: mensajeDeError(error, mensajes) };
  }
}
