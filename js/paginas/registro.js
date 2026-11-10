/* =========================================================
   Whiplash — Página Registro
   Crea la cuenta, deja la sesión abierta y lleva a Mi cuenta
   (o a Mis artistas si se tocó "Seguir" antes de registrarse).
   El navegador valida los campos obligatorios, el formato del
   email y el largo de la contraseña; acá se suma que las dos
   contraseñas coincidan y que el email no esté registrado.
   Con "Soy artista" se piden el nombre artístico y el género:
   la cuenta queda como dueña de un perfil de artista nuevo y
   el registro termina en Mi perfil de artista.
   ========================================================= */

import { registrarUsuario, usuarioActual, validarPassword } from "../servicios/sesion.js";
import { completarSeguirPendiente } from "../servicios/artistas-seguidos.js";
import { unirCarritoAlIngresar } from "../servicios/carrito.js";
import { obtenerGeneros } from "../servicios/datos.js";
import { crearElemento, enviando, mostrarMensaje } from "../utilidades/dom.js";

const formulario = document.querySelector(".formulario-registro");
const mensaje = document.querySelector(".mensaje-formulario");
const camposArtista = formulario.querySelector(".campos-artista");
const campos = formulario.elements;

// Con la sesión abierta no hay nada que registrar.
if (usuarioActual()) location.replace("cuenta.html");

// Ocultos, los campos de artista quedan deshabilitados: el
// navegador no los valida ni los envía.
function mostrarCamposArtista(visible) {
  camposArtista.hidden = !visible;
  campos.nombre_artistico.disabled = !visible;
  campos.genero.disabled = !visible;
}

campos.artista.addEventListener("change", () => {
  mostrarCamposArtista(campos.artista.checked);
  if (campos.artista.checked) campos.nombre_artistico.focus();
});

// Los géneros salen de la tabla generos; si no cargan, el
// registro común sigue funcionando.
obtenerGeneros()
  .then((generos) => {
    campos.genero.append(
      ...generos.map((genero) => crearElemento("option", { texto: genero.nombre, atributos: { value: genero.nombre } })),
    );
  })
  .catch((error) => console.error("No se pudieron cargar los géneros", error));

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const datos = new FormData(formulario);
  const password = datos.get("password");
  const esArtista = campos.artista.checked;

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
      artista: esArtista ? { nombre: datos.get("nombre_artistico"), genero: datos.get("genero") } : null,
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
      mostrarCamposArtista(false);
      mostrarMensaje(
        mensaje,
        "Te enviamos un mail para confirmar tu cuenta. Después de confirmarla, ingresá desde Mi cuenta.",
        "exito",
      );
      return null;
    }
    const [siguioPendiente] = await Promise.all([completarSeguirPendiente(), unirCarritoAlIngresar()]);
    if (esArtista) return "admin-artistas.html";
    return siguioPendiente ? "artistas.html" : "cuenta.html";
  });
  if (destino) location.href = destino;
});
