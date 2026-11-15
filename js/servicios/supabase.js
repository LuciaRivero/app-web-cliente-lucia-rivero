/* =========================================================
   Whiplash — Conexión con Supabase
   Pedidos con fetch a la API REST (tablas), a Auth y a
   Storage (imágenes), sin librerías. La clave publicable está pensada para ir en el
   navegador: lo que protege los datos son las políticas RLS
   de supabase/esquema.sql. La clave secreta nunca va acá.
   ========================================================= */

export const SUPABASE_URL = "https://lbhqamxjaejauypzrahy.supabase.co";
export const SUPABASE_KEY = "sb_publishable_YkL38FsurTLrT-cB7XF5PA_0c-jA0za";

// Error con el código de Supabase (error_code o code) para que
// cada servicio lo traduzca a un mensaje en español.
export class SupabaseError extends Error {
  constructor(message, { code = "", status = 0 } = {}) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// `file` (un File) se manda tal cual, para subirlo a Storage;
// `body` se manda como JSON.
async function fetchSupabase(url, { method = "GET", body, file, token, prefer, keepalive = false } = {}) {
  const headers = { apikey: SUPABASE_KEY };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (file) headers["Content-Type"] = file.type;
  if (prefer) headers.Prefer = prefer;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: file ?? (body === undefined ? undefined : JSON.stringify(body)),
      // keepalive: el pedido termina aunque la página cambie
      // (por ejemplo, cerrar sesión y volver a la home).
      keepalive,
    });
  } catch {
    throw new SupabaseError("No hay conexión con el servidor.", { code: "sin_conexion" });
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new SupabaseError(data?.msg ?? data?.message ?? data?.error_description ?? response.statusText, {
      code: data?.error_code ?? data?.code ?? data?.error ?? "",
      status: response.status,
    });
  }
  return data;
}

// Tablas: fetchTable("artistas?select=*&order=id")
export function fetchTable(query, options) {
  return fetchSupabase(`${SUPABASE_URL}/rest/v1/${query}`, options);
}

// Auth: fetchAuth("token?grant_type=password", { method: "POST", body })
export function fetchAuth(path, options) {
  return fetchSupabase(`${SUPABASE_URL}/auth/v1/${path}`, options);
}

// Storage: fetchStorage("object/productos/foto.jpg", { method: "POST", file, token })
export function fetchStorage(path, options) {
  return fetchSupabase(`${SUPABASE_URL}/storage/v1/${path}`, options);
}
