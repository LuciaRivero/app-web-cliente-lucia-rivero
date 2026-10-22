/* =========================================================
   Whiplash — Usuarios y sesión
   Único lugar que sabe dónde se guardan las cuentas.
   No hay backend: los usuarios ({ nombre, email, password })
   y el email de la sesión abierta viven en localStorage.
   Las contraseñas quedan sin cifrar en el navegador, así que
   esto sirve para la práctica, no para un sitio real.

   Las funciones que pueden fallar devuelven { error } con un
   mensaje listo para mostrar, o { usuario } si salió bien.
   Cada vez que la sesión cambia (ingreso, edición o cierre)
   se dispara CAMBIO_SESION en window, así <site-header>
   actualiza el menú de usuario sin recargar la página.
   ========================================================= */

const CLAVE_USUARIOS = "whiplash-usuarios";
const CLAVE_SESION = "whiplash-sesion";
export const CAMBIO_SESION = "sesion-cambiada";
export const LARGO_MINIMO_PASSWORD = 8;

// localStorage puede fallar (modo privado, almacenamiento
// bloqueado): en ese caso no hay usuarios ni sesión.
function leer(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave));
  } catch {
    return null;
  }
}

function guardar(clave, valor) {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (error) {
    console.error("No se pudo guardar la cuenta", error);
    return false;
  }
}

const ERROR_GUARDADO = "No pudimos guardar tus datos en este navegador. Probá de nuevo.";

function leerUsuarios() {
  const usuarios = leer(CLAVE_USUARIOS);
  return Array.isArray(usuarios) ? usuarios : [];
}

// El email se compara sin mayúsculas ni espacios sobrantes.
function normalizarEmail(email) {
  return email.trim().toLowerCase();
}

function buscarUsuario(usuarios, email) {
  return usuarios.find((usuario) => usuario.email === normalizarEmail(email));
}

// Sin la contraseña: es lo único que necesitan las páginas.
// `imagen` (URL del avatar) es opcional; sin ella se usan las iniciales.
function datosPublicos({ nombre, email, imagen = null }) {
  return { nombre, email, imagen };
}

function avisarCambio() {
  window.dispatchEvent(new CustomEvent(CAMBIO_SESION, { detail: usuarioActual() }));
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
  const email = leer(CLAVE_SESION);
  if (typeof email !== "string") return null;
  const usuario = buscarUsuario(leerUsuarios(), email);
  return usuario ? datosPublicos(usuario) : null;
}

export function registrarUsuario({ nombre, email, password }) {
  const usuarios = leerUsuarios();
  if (buscarUsuario(usuarios, email)) {
    return { error: "Ya existe una cuenta con ese correo electrónico." };
  }
  const usuario = { nombre: nombre.trim(), email: normalizarEmail(email), password };
  usuarios.push(usuario);
  if (!guardar(CLAVE_USUARIOS, usuarios) || !guardar(CLAVE_SESION, usuario.email)) {
    return { error: ERROR_GUARDADO };
  }
  avisarCambio();
  return { usuario: datosPublicos(usuario) };
}

export function iniciarSesion(email, password) {
  const usuario = buscarUsuario(leerUsuarios(), email);
  // Mismo mensaje para email y contraseña: no revela qué cuentas existen.
  if (!usuario || usuario.password !== password) {
    return { error: "El correo electrónico o la contraseña no son correctos." };
  }
  if (!guardar(CLAVE_SESION, usuario.email)) return { error: ERROR_GUARDADO };
  avisarCambio();
  return { usuario: datosPublicos(usuario) };
}

export function cerrarSesion() {
  guardar(CLAVE_SESION, null);
  avisarCambio();
}

// `password` es opcional: si viene vacía se mantiene la actual.
export function actualizarUsuario({ nombre, email, password }) {
  const actual = usuarioActual();
  if (!actual) return { error: "Tu sesión se cerró. Volvé a ingresar." };

  const usuarios = leerUsuarios();
  const otro = buscarUsuario(usuarios, email);
  if (otro && otro.email !== actual.email) {
    return { error: "Ya existe otra cuenta con ese correo electrónico." };
  }

  const usuario = buscarUsuario(usuarios, actual.email);
  usuario.nombre = nombre.trim();
  usuario.email = normalizarEmail(email);
  if (password) usuario.password = password;

  if (!guardar(CLAVE_USUARIOS, usuarios) || !guardar(CLAVE_SESION, usuario.email)) {
    return { error: ERROR_GUARDADO };
  }
  avisarCambio();
  return { usuario: datosPublicos(usuario) };
}
