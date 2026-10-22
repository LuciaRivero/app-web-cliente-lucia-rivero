/* =========================================================
   Whiplash — Conexión con Supabase
   Pedidos con fetch a la API REST (tablas) y a Auth, sin
   librerías. La clave publicable está pensada para ir en el
   navegador: lo que protege los datos son las políticas RLS
   de supabase/esquema.sql. La clave secreta nunca va acá.
   ========================================================= */

export const SUPABASE_URL = "https://lbhqamxjaejauypzrahy.supabase.co";
export const SUPABASE_CLAVE = "sb_publishable_YkL38FsurTLrT-cB7XF5PA_0c-jA0za";

// Error con el código de Supabase (error_code o code) para que
// cada servicio lo traduzca a un mensaje en español.
export class ErrorSupabase extends Error {
  constructor(mensaje, { codigo = "", estado = 0 } = {}) {
    super(mensaje);
    this.codigo = codigo;
    this.estado = estado;
  }
}

async function pedir(url, { metodo = "GET", cuerpo, token, prefer, mantener = false } = {}) {
  const encabezados = { apikey: SUPABASE_CLAVE };
  if (token) encabezados.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) encabezados["Content-Type"] = "application/json";
  if (prefer) encabezados.Prefer = prefer;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: encabezados,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      // keepalive: el pedido termina aunque la página cambie
      // (por ejemplo, cerrar sesión y volver a la home).
      keepalive: mantener,
    });
  } catch {
    throw new ErrorSupabase("No hay conexión con el servidor.", { codigo: "sin_conexion" });
  }

  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : null;
  if (!respuesta.ok) {
    throw new ErrorSupabase(datos?.msg ?? datos?.message ?? datos?.error_description ?? respuesta.statusText, {
      codigo: datos?.error_code ?? datos?.code ?? datos?.error ?? "",
      estado: respuesta.status,
    });
  }
  return datos;
}

// Tablas: pedirTabla("artistas?select=*&order=id")
export function pedirTabla(consulta, opciones) {
  return pedir(`${SUPABASE_URL}/rest/v1/${consulta}`, opciones);
}

// Auth: pedirAuth("token?grant_type=password", { metodo: "POST", cuerpo })
export function pedirAuth(ruta, opciones) {
  return pedir(`${SUPABASE_URL}/auth/v1/${ruta}`, opciones);
}
