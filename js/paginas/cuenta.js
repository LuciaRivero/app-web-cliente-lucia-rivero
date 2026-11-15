/* =========================================================
   Whiplash — Página Mi cuenta
   Sin sesión muestra el formulario de ingreso (con el enlace
   a registro.html), que al ingresar lleva a la home (o a Mis
   artistas si se tocó "Seguir" antes de ingresar); con
   sesión, el formulario para editar los datos. Para cerrar
   sesión está el menú de usuario del encabezado.
   ========================================================= */

import {
  updateUser,
  signIn,
  getCurrentUser,
  validatePassword,
} from "../servicios/sesion.js";
import { completePendingFollow } from "../servicios/artistas-seguidos.js";
import { mergeCartOnSignIn } from "../servicios/carrito.js";
import { getRootPath } from "../servicios/datos.js";
import { withSubmitting, showMessage } from "../utilidades/dom.js";

const views = {
  signIn: document.querySelector('[data-vista="ingreso"]'),
  edit: document.querySelector('[data-vista="edicion"]'),
};
const signInForm = views.signIn.querySelector("form");
const editForm = views.edit.querySelector("form");
const signInMessage = views.signIn.querySelector(".mensaje-formulario");
const editMessage = views.edit.querySelector(".mensaje-formulario");
const greetingName = views.edit.querySelector(".cuenta-nombre");

function fillEditForm(user) {
  greetingName.textContent = user.nombre;
  editForm.elements.nombre.value = user.nombre;
  editForm.elements.email.value = user.email;
  editForm.elements.password.value = "";
  editForm.elements.password2.value = "";
}

function showView(user) {
  views.signIn.hidden = Boolean(user);
  views.edit.hidden = !user;
  if (user) fillEditForm(user);
}

signInForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(signInForm);
  showMessage(signInMessage, "");
  const destination = await withSubmitting(signInForm, "Ingresando…", async () => {
    const { error } = await signIn(data.get("email"), data.get("password"));
    if (error) {
      showMessage(signInMessage, error);
      signInForm.elements.password.select();
      return null;
    }
    // Lo agregado al carrito sin sesión se suma al de la cuenta.
    // Si se tocó "Seguir" sin sesión, ese artista se sigue ahora y
    // el ingreso termina en Mis artistas; si no, en la home.
    const [followedPending] = await Promise.all([completePendingFollow(), mergeCartOnSignIn()]);
    return followedPending ? "pages/artistas.html" : "index.html";
  });
  if (destination) location.href = getRootPath(destination);
});

editForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(editForm);
  const password = data.get("password");

  // La contraseña solo se valida si se quiere cambiar.
  if (password || data.get("password2")) {
    const passwordError = validatePassword(password, data.get("password2"));
    if (passwordError) {
      showMessage(editMessage, passwordError);
      editForm.elements.password2.focus();
      return;
    }
  }

  showMessage(editMessage, "");
  const { user, pendingEmail, error } = await withSubmitting(editForm, "Guardando…", () =>
    updateUser({
      name: data.get("nombre"),
      email: data.get("email"),
      password,
    }),
  );
  if (error) {
    showMessage(editMessage, error);
    return;
  }
  fillEditForm(user);
  showMessage(
    editMessage,
    pendingEmail
      ? `Guardamos tus cambios. Para usar ${pendingEmail}, confirmalo desde el mail que te enviamos.`
      : "Guardamos tus cambios.",
    "exito",
  );
});

showView(getCurrentUser());
