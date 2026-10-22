/* =========================================================
   Whiplash — Página Mi cuenta
   Sin sesión muestra el formulario de ingreso (con el enlace
   a registro.html), que al ingresar lleva a la home; con
   sesión, el formulario para editar los datos y el botón para
   cerrar sesión.
   ========================================================= */

import {
  actualizarUsuario,
  cerrarSesion,
  iniciarSesion,
  usuarioActual,
  validarPassword,
} from "../servicios/sesion.js";
import { rutaDesdeRaiz } from "../servicios/datos.js";
import { mostrarMensaje } from "../utilidades/dom.js";

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

// `enfocar` mueve el foco al título de la vista nueva cuando el
// cambio lo provocó el usuario (al cerrar sesión), para
// que el teclado y el lector de pantalla no queden en un botón oculto.
function mostrarVista(usuario, { enfocar = false } = {}) {
  const vista = usuario ? vistas.edicion : vistas.ingreso;
  vistas.ingreso.hidden = Boolean(usuario);
  vistas.edicion.hidden = !usuario;
  if (usuario) completarEdicion(usuario);
  if (enfocar) vista.querySelector("h2").focus();
}

formularioIngreso.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const datos = new FormData(formularioIngreso);
  const { error } = iniciarSesion(datos.get("email"), datos.get("password"));
  if (error) {
    mostrarMensaje(mensajeIngreso, error);
    formularioIngreso.elements.password.select();
    return;
  }
  // Con la sesión abierta, el ingreso termina en la home.
  location.href = rutaDesdeRaiz("index.html");
});

formularioEdicion.addEventListener("submit", (evento) => {
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

  const { usuario, error } = actualizarUsuario({
    nombre: datos.get("nombre"),
    email: datos.get("email"),
    password,
  });
  if (error) {
    mostrarMensaje(mensajeEdicion, error);
    return;
  }
  completarEdicion(usuario);
  mostrarMensaje(mensajeEdicion, "Guardamos tus cambios.", "exito");
});

vistas.edicion.querySelector(".boton-cerrar-sesion").addEventListener("click", () => {
  cerrarSesion();
  mostrarMensaje(mensajeEdicion, "");
  mostrarMensaje(mensajeIngreso, "Cerraste sesión.", "exito");
  mostrarVista(null, { enfocar: true });
});

mostrarVista(usuarioActual());
