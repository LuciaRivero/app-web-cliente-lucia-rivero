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

import { signUp, getCurrentUser, validatePassword } from "../servicios/sesion.js";
import { completePendingFollow } from "../servicios/artistas-seguidos.js";
import { mergeCartOnSignIn } from "../servicios/carrito.js";
import { getGenres } from "../servicios/datos.js";
import { createElement, withSubmitting, showMessage } from "../utilidades/dom.js";

const form = document.querySelector(".formulario-registro");
const message = document.querySelector(".mensaje-formulario");
const artistFields = form.querySelector(".campos-artista");
const fields = form.elements;

// Con la sesión abierta no hay nada que registrar.
if (getCurrentUser()) location.replace("cuenta.html");

// Ocultos, los campos de artista quedan deshabilitados: el
// navegador no los valida ni los envía.
function showArtistFields(visible) {
  artistFields.hidden = !visible;
  fields.nombre_artistico.disabled = !visible;
  fields.genero.disabled = !visible;
}

fields.artista.addEventListener("change", () => {
  showArtistFields(fields.artista.checked);
  if (fields.artista.checked) fields.nombre_artistico.focus();
});

// Los géneros salen de la tabla generos; si no cargan, el
// registro común sigue funcionando.
getGenres()
  .then((genres) => {
    fields.genero.append(
      ...genres.map((genre) => createElement("option", { text: genre.nombre, attributes: { value: genre.nombre } })),
    );
  })
  .catch((error) => console.error("No se pudieron cargar los géneros", error));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const password = data.get("password");
  const isArtist = fields.artista.checked;

  const passwordError = validatePassword(password, data.get("password2"));
  if (passwordError) {
    showMessage(message, passwordError);
    form.elements.password2.focus();
    return;
  }

  showMessage(message, "");
  const destination = await withSubmitting(form, "Creando cuenta…", async () => {
    const { error, needsConfirmation } = await signUp({
      name: data.get("nombre"),
      email: data.get("email"),
      password,
      artist: isArtist ? { name: data.get("nombre_artistico"), genre: data.get("genero") } : null,
    });
    if (error) {
      showMessage(message, error);
      form.elements.email.focus();
      return null;
    }
    // Supabase puede pedir confirmar el email: la cuenta existe pero
    // todavía no hay sesión.
    if (needsConfirmation) {
      form.reset();
      showArtistFields(false);
      showMessage(
        message,
        "Te enviamos un mail para confirmar tu cuenta. Después de confirmarla, ingresá desde Mi cuenta.",
        "exito",
      );
      return null;
    }
    const [followedPending] = await Promise.all([completePendingFollow(), mergeCartOnSignIn()]);
    if (isArtist) return "admin-artistas.html";
    return followedPending ? "artistas.html" : "cuenta.html";
  });
  if (destination) location.href = destination;
});
