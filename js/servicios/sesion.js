/* =========================================================
   Whiplash — Usuarios y sesión (Supabase Auth)
   Único lugar que sabe cómo se manejan las cuentas.
   Las cuentas viven en Supabase Auth; en localStorage solo
   queda la sesión abierta (tokens y datos públicos), así
   usuarioActual() sigue siendo inmediato para el encabezado.
   El token de acceso vence a la hora: obtenerToken() lo
   renueva con el refresh token antes de usarlo.

   Las funciones que pueden fallar devuelven { error } con un
   mensaje listo para mostrar, o { usuario } si salió bien.
   Cada vez que la sesión cambia (ingreso, edición o cierre)
   se dispara CAMBIO_SESION en window, así <site-header>
   actualiza el menú de usuario sin recargar la página.
   ========================================================= */

import { pedirAuth } from "./supabase.js";

const CLAVE_SESION = "whiplash-sesion";
export const CAMBIO_SESION = "sesion-cambiada";
export const LARGO_MINIMO_PASSWORD = 8;
// Margen para renovar el token un poco antes de que venza.
const MARGEN_VENCIMIENTO_S = 60;

// Antes las cuentas se guardaban en el navegador, con la
// contraseña sin cifrar: se borran al cargar.
try {
  localStorage.removeItem("whiplash-usuarios");
} catch {
  // Sin acceso a localStorage no hay nada que borrar.
}

// localStorage puede fallar (modo privado, almacenamiento
// bloqueado): en ese caso no hay sesión.
function leerSesion() {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION));
    return sesion?.access_token && sesion.usuario ? sesion : null;
  } catch {
    return null;
  }
}

function guardarSesion(sesion) {
  try {
    if (sesion) localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    else localStorage.removeItem(CLAVE_SESION);
  } catch (error) {
    console.error("No se pudo guardar la sesión", error);
  }
}

// Lo que necesitan las páginas del usuario de Supabase.
// `imagen` (URL del avatar) es opcional; sin ella se usan las iniciales.
function datosPublicos(usuario) {
  const metadatos = usuario.user_metadata ?? {};
  return {
    id: usuario.id,
    nombre: metadatos.nombre ?? usuario.email.split("@")[0],
    email: usuario.email,
    imagen: metadatos.imagen ?? null,
  };
}

// Respuesta de Auth con tokens → sesión guardada.
function sesionDesde(respuesta) {
  return {
    access_token: respuesta.access_token,
    refresh_token: respuesta.refresh_token,
    expires_at: respuesta.expires_at ?? Math.floor(Date.now() / 1000) + respuesta.expires_in,
    usuario: datosPublicos(respuesta.user),
  };
}

function avisarCambio() {
  window.dispatchEvent(new CustomEvent(CAMBIO_SESION, { detail: usuarioActual() }));
}

// Códigos de Supabase Auth → mensajes para el usuario.
const MENSAJES = {
  user_already_exists: "Ya existe una cuenta con ese correo electrónico.",
  email_exists: "Ya existe una cuenta con ese correo electrónico.",
  invalid_credentials: "El correo electrónico o la contraseña no son correctos.",
  email_not_confirmed: "Confirmá tu correo electrónico desde el mail que te enviamos antes de ingresar.",
  weak_password: `La contraseña es muy débil: usá al menos ${LARGO_MINIMO_PASSWORD} caracteres.`,
  email_address_invalid: "Ese correo electrónico no es válido.",
  validation_failed: "Revisá los datos: el correo electrónico o la contraseña no son válidos.",
  same_password: "La nueva contraseña tiene que ser distinta de la actual.",
  over_email_send_rate_limit: "Hicimos muchos envíos de mail seguidos. Esperá unos minutos y probá de nuevo.",
  over_request_rate_limit: "Hubo demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.",
  sin_conexion: "No hay conexión con el servidor. Revisá tu internet y probá de nuevo.",
};

function mensajeDeError(error) {
  console.error(error);
  return MENSAJES[error.codigo] ?? "Algo salió mal. Probá de nuevo en un rato.";
}

// Reglas compartidas por el registro y la edición.
export function validarPassword(password, repetida) {
  if (password.length < LARGO_MINIMO_PASSWORD) {
    return `La contraseña tiene que tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`;
  }
  if (password !== repetida) return "Las contraseñas no coinciden.";
  return null;
}

export function usuarioActual() {
  return leerSesion()?.usuario ?? null;
}

// Token de acceso vigente para pedidos a Supabase (null sin sesión).
// Si venció, lo renueva; si no se puede renovar, cierra la sesión.
let renovando = null;

export async function obtenerToken() {
  const sesion = leerSesion();
  if (!sesion) return null;
  if (sesion.expires_at - MARGEN_VENCIMIENTO_S > Date.now() / 1000) return sesion.access_token;

  // Varios pedidos a la vez comparten la misma renovación.
  renovando ??= pedirAuth("token?grant_type=refresh_token", {
    metodo: "POST",
    cuerpo: { refresh_token: sesion.refresh_token },
  })
    .then((respuesta) => {
      const nueva = sesionDesde(respuesta);
      guardarSesion(nueva);
      return nueva.access_token;
    })
    .catch((error) => {
      console.error("No se pudo renovar la sesión", error);
      guardarSesion(null);
      avisarCambio();
      return null;
    })
    .finally(() => {
      renovando = null;
    });
  return renovando;
}

// Si Supabase pide confirmar el email, la cuenta se crea pero
// sin sesión: devuelve { confirmar: true } para avisarlo.
export async function registrarUsuario({ nombre, email, password }) {
  try {
    const respuesta = await pedirAuth("signup", {
      metodo: "POST",
      cuerpo: { email: email.trim(), password, data: { nombre: nombre.trim() } },
    });
    if (!respuesta.access_token) return { confirmar: true };
    const sesion = sesionDesde(respuesta);
    guardarSesion(sesion);
    avisarCambio();
    return { usuario: sesion.usuario };
  } catch (error) {
    return { error: mensajeDeError(error) };
  }
}

export async function iniciarSesion(email, password) {
  try {
    const respuesta = await pedirAuth("token?grant_type=password", {
      metodo: "POST",
      cuerpo: { email: email.trim(), password },
    });
    const sesion = sesionDesde(respuesta);
    guardarSesion(sesion);
    avisarCambio();
    return { usuario: sesion.usuario };
  } catch (error) {
    return { error: mensajeDeError(error) };
  }
}

// La sesión se borra en el momento; el aviso a Supabase sigue
// aunque la página cambie (keepalive).
export function cerrarSesion() {
  const sesion = leerSesion();
  guardarSesion(null);
  avisarCambio();
  if (sesion) {
    pedirAuth("logout", { metodo: "POST", token: sesion.access_token, mantener: true }).catch(() => {});
  }
}

// `password` es opcional: si viene vacía se mantiene la actual.
// Si cambia el email, Supabase puede pedir confirmarlo por mail:
// en ese caso devuelve { usuario, emailPendiente }.
export async function actualizarUsuario({ nombre, email, password }) {
  const token = await obtenerToken();
  const sesion = leerSesion();
  if (!token || !sesion) return { error: "Tu sesión se cerró. Volvé a ingresar." };

  const cambios = { data: { nombre: nombre.trim() } };
  const emailNuevo = email.trim().toLowerCase();
  if (emailNuevo !== sesion.usuario.email) cambios.email = emailNuevo;
  if (password) cambios.password = password;

  try {
    const usuario = await pedirAuth("user", { metodo: "PUT", cuerpo: cambios, token });
    const actualizada = { ...leerSesion(), usuario: datosPublicos(usuario) };
    guardarSesion(actualizada);
    avisarCambio();
    return {
      usuario: actualizada.usuario,
      emailPendiente: usuario.new_email && usuario.new_email !== usuario.email ? usuario.new_email : null,
    };
  } catch (error) {
    return { error: mensajeDeError(error) };
  }
}
