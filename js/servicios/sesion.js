/* =========================================================
   Whiplash — Usuarios y sesión (Supabase Auth)
   Único lugar que sabe cómo se manejan las cuentas.
   Las cuentas viven en Supabase Auth; en localStorage solo
   queda la sesión abierta (tokens y datos públicos), así
   getCurrentUser() sigue siendo inmediato para el encabezado.
   El token de acceso vence a la hora: getToken() lo
   renueva con el refresh token antes de usarlo.

   Las funciones que pueden fallar devuelven { error } con un
   mensaje listo para mostrar, o { user } si salió bien.
   Cada vez que la sesión cambia (ingreso, edición o cierre)
   se dispara SESSION_CHANGE en window, así <site-header>
   actualiza el menú de usuario sin recargar la página.

   La sesión guardada mantiene sus propiedades en español
   (`usuario`, `nombre`, `esAdmin`…) para no cerrar las
   sesiones que ya están abiertas.
   ========================================================= */

import { fetchAuth } from "./supabase.js";

const SESSION_KEY = "whiplash-sesion";
export const SESSION_CHANGE = "sesion-cambiada";
export const MIN_PASSWORD_LENGTH = 8;
// Margen para renovar el token un poco antes de que venza.
const EXPIRY_MARGIN_S = 60;

// Antes las cuentas se guardaban en el navegador, con la
// contraseña sin cifrar: se borran al cargar.
try {
  localStorage.removeItem("whiplash-usuarios");
} catch {
  // Sin acceso a localStorage no hay nada que borrar.
}

// localStorage puede fallar (modo privado, almacenamiento
// bloqueado): en ese caso no hay sesión.
function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    return session?.access_token && session.usuario ? session : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("No se pudo guardar la sesión", error);
  }
}

// Lo que necesitan las páginas del usuario de Supabase.
// `imagen` (URL del avatar) es opcional; sin ella se usan las iniciales.
// `esAdmin` sale de app_metadata, que el usuario no puede editar
// (ver supabase/esquema.sql). `esArtista`: la cuenta se registró
// como artista. Los dos solo deciden qué se muestra: lo que protege
// artistas y productos son las políticas RLS.
function toPublicUser(user) {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    nombre: metadata.nombre ?? user.email.split("@")[0],
    email: user.email,
    imagen: metadata.imagen ?? null,
    esAdmin: user.app_metadata?.rol === "admin",
    esArtista: metadata.artista === true,
  };
}

// Respuesta de Auth con tokens → sesión guardada.
function toSession(response) {
  return {
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    expires_at: response.expires_at ?? Math.floor(Date.now() / 1000) + response.expires_in,
    usuario: toPublicUser(response.user),
  };
}

function notifyChange() {
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE, { detail: getCurrentUser() }));
}

// Códigos de Supabase Auth → mensajes para el usuario.
const MESSAGES = {
  user_already_exists: "Ya existe una cuenta con ese correo electrónico.",
  email_exists: "Ya existe una cuenta con ese correo electrónico.",
  invalid_credentials: "El correo electrónico o la contraseña no son correctos.",
  email_not_confirmed: "Confirmá tu correo electrónico desde el mail que te enviamos antes de ingresar.",
  weak_password: `La contraseña es muy débil: usá al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  email_address_invalid: "Ese correo electrónico no es válido.",
  validation_failed: "Revisá los datos: el correo electrónico o la contraseña no son válidos.",
  same_password: "La nueva contraseña tiene que ser distinta de la actual.",
  over_email_send_rate_limit: "Hicimos muchos envíos de mail seguidos. Esperá unos minutos y probá de nuevo.",
  over_request_rate_limit: "Hubo demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.",
  sin_conexion: "No hay conexión con el servidor. Revisá tu internet y probá de nuevo.",
};

function getErrorMessage(error) {
  console.error(error);
  return MESSAGES[error.code] ?? "Algo salió mal. Probá de nuevo en un rato.";
}

// Reglas compartidas por el registro y la edición.
export function validatePassword(password, repeated) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (password !== repeated) return "Las contraseñas no coinciden.";
  return null;
}

export function getCurrentUser() {
  return getSession()?.usuario ?? null;
}

// Token de acceso vigente para pedidos a Supabase (null sin sesión).
// Si venció, lo renueva; si no se puede renovar, cierra la sesión.
let refreshing = null;

export async function getToken() {
  const session = getSession();
  if (!session) return null;
  if (session.expires_at - EXPIRY_MARGIN_S > Date.now() / 1000) return session.access_token;

  // Varios pedidos a la vez comparten la misma renovación.
  refreshing ??= fetchAuth("token?grant_type=refresh_token", {
    method: "POST",
    body: { refresh_token: session.refresh_token },
  })
    .then((response) => {
      const renewed = toSession(response);
      saveSession(renewed);
      return renewed.access_token;
    })
    .catch((error) => {
      console.error("No se pudo renovar la sesión", error);
      saveSession(null);
      notifyChange();
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// Si Supabase pide confirmar el email, la cuenta se crea pero
// sin sesión: devuelve { needsConfirmation: true } para avisarlo.
// `artist` ({ name, genre }, opcional): registro como artista.
// Con esos datos, la base crea el perfil del artista (trigger en
// supabase/esquema.sql).
export async function signUp({ name, email, password, artist = null }) {
  const data = { nombre: name.trim() };
  if (artist) {
    Object.assign(data, { artista: true, nombre_artistico: artist.name.trim(), genero: artist.genre });
  }
  try {
    const response = await fetchAuth("signup", {
      method: "POST",
      body: { email: email.trim(), password, data },
    });
    if (!response.access_token) return { needsConfirmation: true };
    const session = toSession(response);
    saveSession(session);
    notifyChange();
    return { user: session.usuario };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function signIn(email, password) {
  try {
    const response = await fetchAuth("token?grant_type=password", {
      method: "POST",
      body: { email: email.trim(), password },
    });
    const session = toSession(response);
    saveSession(session);
    notifyChange();
    return { user: session.usuario };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

// La sesión se borra en el momento; el aviso a Supabase sigue
// aunque la página cambie (keepalive).
export function signOut() {
  const session = getSession();
  saveSession(null);
  notifyChange();
  if (session) {
    fetchAuth("logout", { method: "POST", token: session.access_token, keepalive: true }).catch(() => {});
  }
}

// `password` es opcional: si viene vacía se mantiene la actual.
// Si cambia el email, Supabase puede pedir confirmarlo por mail:
// en ese caso devuelve { user, pendingEmail }.
export async function updateUser({ name, email, password }) {
  const token = await getToken();
  const session = getSession();
  if (!token || !session) return { error: "Tu sesión se cerró. Volvé a ingresar." };

  const changes = { data: { nombre: name.trim() } };
  const newEmail = email.trim().toLowerCase();
  if (newEmail !== session.usuario.email) changes.email = newEmail;
  if (password) changes.password = password;

  try {
    const user = await fetchAuth("user", { method: "PUT", body: changes, token });
    const updated = { ...getSession(), usuario: toPublicUser(user) };
    saveSession(updated);
    notifyChange();
    return {
      user: updated.usuario,
      pendingEmail: user.new_email && user.new_email !== user.email ? user.new_email : null,
    };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
