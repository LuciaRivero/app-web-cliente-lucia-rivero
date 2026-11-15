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

import { SUPABASE_URL, fetchStorage, fetchTable } from "./supabase.js";
import { getToken, getCurrentUser } from "./sesion.js";

// Los mismos límites que tienen los buckets en Storage.
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const NO_PERMISSION = "Tu cuenta no tiene permiso para hacer este cambio. Volvé a ingresar.";
const NO_SESSION = "Tu sesión se cerró. Volvé a ingresar.";

// Códigos de PostgREST y de Storage → mensajes para el usuario.
// Cada tabla puede sumar o cambiar los suyos (`messages`).
const MESSAGES = {
  42501: NO_PERMISSION,
  23514: "Revisá los datos: hay un valor fuera de rango.",
  sin_conexion: "No hay conexión con el servidor. Revisá tu internet y probá de nuevo.",
};

function getErrorMessage(error, messages = {}) {
  console.error(error);
  const message = messages[error.code] ?? MESSAGES[error.code];
  if (message) return message;
  if (error.status === 401 || error.status === 403) return NO_PERMISSION;
  if (error.status === 413) return "La imagen pesa más de 2 MB.";
  return "Algo salió mal. Probá de nuevo en un rato.";
}

// null si el archivo se puede subir; si no, el motivo.
export function validateImage(file) {
  if (!IMAGE_TYPES.includes(file.type)) return "La imagen tiene que ser JPG, PNG o WebP.";
  if (file.size > MAX_IMAGE_SIZE) return "La imagen pesa más de 2 MB.";
  return null;
}

// Las imágenes subidas se leen por esta URL; las que empiezan
// con assets/ son las del sitio y no se borran de Storage.
function getImagesUrl(bucket) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/`;
}

// Nombre único para no pisar otra imagen con el mismo nombre, en la
// carpeta de la cuenta: las cuentas de artista solo pueden escribir
// en la suya (políticas de Storage en supabase/esquema.sql).
async function uploadImage(bucket, file, token) {
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
  const name = `${getCurrentUser().id}/${crypto.randomUUID()}.${extension}`;
  await fetchStorage(`object/${bucket}/${name}`, { method: "POST", file, token });
  return getImagesUrl(bucket) + name;
}

// Si falla, la imagen queda en Storage sin usar: no vale la
// pena frenar el guardado por eso.
async function deleteImage(bucket, url, token) {
  if (!url?.startsWith(getImagesUrl(bucket))) return;
  try {
    await fetchStorage(`object/${bucket}/${url.slice(getImagesUrl(bucket).length)}`, { method: "DELETE", token });
  } catch (error) {
    console.error("No se pudo borrar la imagen", error);
  }
}

// Sin caché (a diferencia de datos.js): la página de admin
// vuelve a pedir la lista cada vez que se abre.
export function getRows(table) {
  return fetchTable(`${table}?select=*&order=id`);
}

// `data.id` vacío = alta; con id = edición (el id no se envía).
// `file`: imagen nueva (opcional). `removeImage`: deja la
// fila sin imagen, así se muestra la de reemplazo.
// `currentImage`: la que tenía, para borrarla si se reemplaza.
export async function saveRow(
  { table, bucket, messages },
  { id, ...data },
  { file, removeImage, currentImage } = {},
) {
  const token = await getToken();
  if (!token) return { error: NO_SESSION };

  let newImage = null;
  try {
    if (file) {
      newImage = await uploadImage(bucket, file, token);
      data.imagen = newImage;
    } else if (removeImage) {
      data.imagen = null;
    }

    const options = { body: data, token, prefer: "return=representation" };
    const [saved] = id
      ? await fetchTable(`${table}?id=eq.${id}`, { ...options, method: "PATCH" })
      : await fetchTable(table, { ...options, method: "POST" });
    // Sin permiso, RLS no tira error en un PATCH: no actualiza ninguna fila.
    if (!saved) {
      await deleteImage(bucket, newImage, token);
      return { error: NO_PERMISSION };
    }

    if ("imagen" in data && currentImage !== data.imagen) await deleteImage(bucket, currentImage, token);
    return { row: saved };
  } catch (error) {
    await deleteImage(bucket, newImage, token);
    return { error: getErrorMessage(error, messages) };
  }
}

export async function deleteRow({ table, bucket, messages }, row) {
  const token = await getToken();
  if (!token) return { error: NO_SESSION };

  try {
    const [deleted] = await fetchTable(`${table}?id=eq.${row.id}`, {
      method: "DELETE",
      token,
      prefer: "return=representation",
    });
    if (!deleted) return { error: NO_PERMISSION };
    await deleteImage(bucket, row.imagen, token);
    return {};
  } catch (error) {
    return { error: getErrorMessage(error, messages) };
  }
}
