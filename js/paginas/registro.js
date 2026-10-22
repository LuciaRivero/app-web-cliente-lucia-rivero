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
import { unirCarritoAlIngresar } from "../servicios/carrito.js";
import { enviando, mostrarMensaje } from "../utilidades/dom.js";

const formulario = document.querySelector(".formulario-registro");
const mensaje = document.querySelector(".mensaje-formulario");

// Con la sesión abierta no hay nada que registrar.
if (usuarioActual()) location.replace("cuenta.html");

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const datos = new FormData(formulario);
  const password = datos.get("password");

  const errorPassword = validarPassword(password, datos.get("password2"));
  if (errorPassword) {
    mostrarMensaje(mensaje, errorPassword);
    formulario.elements.password2.focus();
    return;
  }

  mostrarMensaje(mensaje, "");
  const destino = await enviando(formulario, "Creando cuenta…", async () => {
    const { error, confirmar } = await registrarUsuario({
      nombre: datos.get("nombre"),
      email: datos.get("email"),
      password,
    });
    if (error) {
      mostrarMensaje(mensaje, error);
      formulario.elements.email.focus();
      return null;
    }
    // Supabase puede pedir confirmar el email: la cuenta existe pero
    // todavía no hay sesión.
    if (confirmar) {
      formulario.reset();
      mostrarMensaje(
        mensaje,
        "Te enviamos un mail para confirmar tu cuenta. Después de confirmarla, ingresá desde Mi cuenta.",
        "exito",
      );
      return null;
    }
    const [siguioPendiente] = await Promise.all([completarSeguirPendiente(), unirCarritoAlIngresar()]);
    return siguioPendiente ? "artistas.html" : "cuenta.html";
  });
  if (destino) location.href = destino;
});
