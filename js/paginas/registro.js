/* =========================================================
   Whiplash — Página Registro
   Crea la cuenta, deja la sesión abierta y lleva a Mi cuenta
   (o a Mis artistas si se tocó "Seguir" antes de registrarse).
   El navegador valida los campos obligatorios, el formato del
   email y el largo de la contraseña; acá se suma que las dos
   contraseñas coincidan y que el email no esté registrado.
   ========================================================= */

import { registrarUsuario, usuarioActual, validarPassword } from "../servicios/sesion.js";
import { completarSeguirPendiente } from "../servicios/artistas-seguidos.js";
import { mostrarMensaje } from "../utilidades/dom.js";

const formulario = document.querySelector(".formulario-registro");
const mensaje = document.querySelector(".mensaje-formulario");

// Con la sesión abierta no hay nada que registrar.
if (usuarioActual()) location.replace("cuenta.html");

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const datos = new FormData(formulario);
  const password = datos.get("password");

  const errorPassword = validarPassword(password, datos.get("password2"));
  if (errorPassword) {
    mostrarMensaje(mensaje, errorPassword);
    formulario.elements.password2.focus();
    return;
  }

  const { error } = registrarUsuario({
    nombre: datos.get("nombre"),
    email: datos.get("email"),
    password,
  });
  if (error) {
    mostrarMensaje(mensaje, error);
    formulario.elements.email.focus();
    return;
  }

  location.href = completarSeguirPendiente() ? "artistas.html" : "cuenta.html";
});
