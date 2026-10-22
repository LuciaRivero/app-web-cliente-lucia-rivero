/* =========================================================
   Whiplash — Página Mi cuenta
   Sin sesión muestra el formulario de ingreso (con el enlace
   a registro.html), que al ingresar lleva a la home (o a Mis
   artistas si se tocó "Seguir" antes de ingresar); con
   sesión, el formulario para editar los datos. Para cerrar
   sesión está el menú de usuario del encabezado.
   ========================================================= */

import {
  actualizarUsuario,
  iniciarSesion,
  usuarioActual,
  validarPassword,
} from "../servicios/sesion.js";
import { completarSeguirPendiente } from "../servicios/artistas-seguidos.js";
import { unirCarritoAlIngresar } from "../servicios/carrito.js";
import { rutaDesdeRaiz } from "../servicios/datos.js";
import { enviando, mostrarMensaje } from "../utilidades/dom.js";

const vistas = {
  ingreso: document.querySelector('[data-vista="ingreso"]'),
  edicion: document.querySelector('[data-vista="edicion"]'),
};
const formularioIngreso = vistas.ingreso.querySelector("form");
const formularioEdicion = vistas.edicion.querySelector("form");
const mensajeIngreso = vistas.ingreso.querySelector(".mensaje-formulario");
const mensajeEdicion = vistas.edicion.querySelector(".mensaje-formulario");
const nombreSaludo = vistas.edicion.querySelector(".cuenta-nombre");

function completarEdicion(usuario) {
  nombreSaludo.textContent = usuario.nombre;
  formularioEdicion.elements.nombre.value = usuario.nombre;
  formularioEdicion.elements.email.value = usuario.email;
  formularioEdicion.elements.password.value = "";
  formularioEdicion.elements.password2.value = "";
}

function mostrarVista(usuario) {
  vistas.ingreso.hidden = Boolean(usuario);
  vistas.edicion.hidden = !usuario;
  if (usuario) completarEdicion(usuario);
}

formularioIngreso.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const datos = new FormData(formularioIngreso);
  mostrarMensaje(mensajeIngreso, "");
  const destino = await enviando(formularioIngreso, "Ingresando…", async () => {
    const { error } = await iniciarSesion(datos.get("email"), datos.get("password"));
    if (error) {
      mostrarMensaje(mensajeIngreso, error);
      formularioIngreso.elements.password.select();
      return null;
    }
    // Lo agregado al carrito sin sesión se suma al de la cuenta.
    // Si se tocó "Seguir" sin sesión, ese artista se sigue ahora y
    // el ingreso termina en Mis artistas; si no, en la home.
    const [siguioPendiente] = await Promise.all([completarSeguirPendiente(), unirCarritoAlIngresar()]);
    return siguioPendiente ? "pages/artistas.html" : "index.html";
  });
  if (destino) location.href = rutaDesdeRaiz(destino);
});

formularioEdicion.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const datos = new FormData(formularioEdicion);
  const password = datos.get("password");

  // La contraseña solo se valida si se quiere cambiar.
  if (password || datos.get("password2")) {
    const errorPassword = validarPassword(password, datos.get("password2"));
    if (errorPassword) {
      mostrarMensaje(mensajeEdicion, errorPassword);
      formularioEdicion.elements.password2.focus();
      return;
    }
  }

  mostrarMensaje(mensajeEdicion, "");
  const { usuario, emailPendiente, error } = await enviando(formularioEdicion, "Guardando…", () =>
    actualizarUsuario({
      nombre: datos.get("nombre"),
      email: datos.get("email"),
      password,
    }),
  );
  if (error) {
    mostrarMensaje(mensajeEdicion, error);
    return;
  }
  completarEdicion(usuario);
  mostrarMensaje(
    mensajeEdicion,
    emailPendiente
      ? `Guardamos tus cambios. Para usar ${emailPendiente}, confirmalo desde el mail que te enviamos.`
      : "Guardamos tus cambios.",
    "exito",
  );
});

mostrarVista(usuarioActual());
