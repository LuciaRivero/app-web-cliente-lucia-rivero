/* =========================================================
   Whiplash — Piezas comunes de las páginas de admin
   (pages/admin.html y pages/admin-artistas.html), que usan el
   admin global y, filtradas a lo suyo, las cuentas de artista:
   - guardPanel: saca de la página a quien no es admin ni artista.
   - setPageTitle / showNoProfile: textos según quién la usa.
   - setupFieldErrors: errores debajo de cada campo.
   - setupImageField: campo de imagen con vista previa y
     "Quitar la imagen actual".
   - setupDeleteModal: confirmación de "Eliminar" en un
     <dialog> (foco atrapado, Escape y resto de la página inerte).
   - fillOptions: opciones de un <select>.
   Estilos en css/paginas/admin.css.
   ========================================================= */

import { validateImage } from "../servicios/catalogo-admin.js";
import { getRootPath } from "../servicios/datos.js";
import { SESSION_CHANGE, getCurrentUser } from "../servicios/sesion.js";
import { createElement, showMessage } from "../utilidades/dom.js";

// Entran el admin global y las cuentas de artista; al resto lo
// lleva a la home. Ocultar la página no protege nada: Supabase
// rechaza los cambios de quien no tiene permiso (RLS).
// Devuelve el usuario si puede seguir, o null.
export function guardPanel() {
  const getAllowedUser = () => {
    const user = getCurrentUser();
    return user?.esAdmin || user?.esArtista ? user : null;
  };
  const leave = () => location.replace(getRootPath("index.html"));
  // Si se cierra la sesión (o vence) desde otra parte, se sale.
  window.addEventListener(SESSION_CHANGE, () => {
    if (!getAllowedUser()) leave();
  });
  const user = getAllowedUser();
  if (!user) leave();
  return user;
}

// Textos de la página según quién la usa: el admin global o una
// cuenta de artista. Actualiza <title>, <h1>, subtítulo y miga actual.
export function setPageTitle({ title, subtitle }) {
  document.title = `${title} | Whiplash`;
  document.querySelector("h1").textContent = title;
  document.querySelector("main > .subtitulo").textContent = subtitle;
  const crumb = document.querySelector('.migas-de-pan [aria-current="page"]');
  if (crumb) crumb.textContent = title;
}

// Reemplaza el formulario y la lista por un aviso (por ejemplo,
// una cuenta de artista que ya no tiene perfil).
export function showNoProfile(text) {
  document.querySelector(".admin-panel").replaceChildren(createElement("p", { className: "admin-vacio", text }));
}

// `options`: [{ value, text }].
export function fillOptions(select, options) {
  select.replaceChildren(
    createElement("option", { text: "Elegí una opción", attributes: { value: "" } }),
    ...options.map(({ value, text }) => createElement("option", { text, attributes: { value } })),
  );
}

// ---------- Errores por campo ----------

// `validations`: { nombreDelCampo: (campo) => error o valor falso }.
// El error va en el <small id="error-<name>"> debajo del campo,
// que el campo ya tiene en aria-describedby.
export function setupFieldErrors(form, validations) {
  const fields = form.elements;

  function show(field, text) {
    document.querySelector(`#error-${field.name}`).textContent = text || "";
    if (text) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  }

  function clear() {
    for (const name of Object.keys(validations)) show(fields[name], null);
  }

  // Marca todos los campos con error y enfoca el primero.
  // Devuelve true si el formulario es válido.
  function validate() {
    let first = null;
    for (const [name, rule] of Object.entries(validations)) {
      const error = rule(fields[name]);
      show(fields[name], error);
      if (error) first ??= fields[name];
    }
    // Un <fieldset> con error enfoca su primer campo marcado.
    (first?.querySelector?.('[aria-invalid="true"]') ?? first)?.focus();
    return !first;
  }

  // Al corregir un campo, su error desaparece.
  form.addEventListener("input", (event) => {
    if (event.target.name in validations) show(event.target, null);
  });

  return { show, clear, validate };
}

// ---------- Imagen ----------

// Maneja .vista-previa, el campo "imagen" y el checkbox
// "quitarImagen" (dentro de .quitar-imagen) del formulario.
// `fallback`: imagen que se ve cuando no hay ninguna.
export function setupImageField(form, errors, fallback) {
  const fields = form.elements;
  const preview = form.querySelector(".vista-previa");
  const removeImageOption = form.querySelector(".quitar-imagen");
  // Imagen guardada de la fila que se edita; null = alta o sin imagen.
  let current = null;
  // URL temporal de la imagen elegida, para la vista previa.
  let previewUrl = null;

  // `fallback`: URL de la imagen de reemplazo, o una función que la
  // devuelve (por ejemplo, según el tipo de producto elegido).
  const getFallbackUrl = () => (typeof fallback === "function" ? fallback() : fallback);
  // true mientras la vista previa muestra la imagen de reemplazo.
  let isShowingFallback = true;

  function showFallback() {
    isShowingFallback = true;
    preview.src = getFallbackUrl();
  }

  function showPreview(src) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    if (!src) {
      showFallback();
      return;
    }
    isShowingFallback = false;
    preview.src = src;
  }

  const showCurrent = () => showPreview(current ? getRootPath(current) : null);

  // Si la imagen guardada no carga, la vista previa muestra la de reemplazo.
  preview.addEventListener("error", () => {
    if (!isShowingFallback) showFallback();
  });

  fields.imagen.addEventListener("change", () => {
    const file = fields.imagen.files[0];
    if (!file) {
      showCurrent();
      return;
    }
    const error = validateImage(file);
    if (error) {
      fields.imagen.value = "";
      errors.show(fields.imagen, error);
      return;
    }
    showPreview(null);
    previewUrl = URL.createObjectURL(file);
    isShowingFallback = false;
    preview.src = previewUrl;
    fields.quitarImagen.checked = false;
  });

  // Quitar la imagen y subir otra se excluyen.
  fields.quitarImagen.addEventListener("change", () => {
    if (!fields.quitarImagen.checked) {
      showCurrent();
      return;
    }
    fields.imagen.value = "";
    showPreview(null);
  });

  return {
    // `image`: la de la fila que se empieza a editar (null para un alta).
    show(image) {
      current = image ?? null;
      fields.imagen.value = "";
      fields.quitarImagen.checked = false;
      removeImageOption.hidden = !current;
      showCurrent();
    },
    // Si la vista previa muestra la imagen de reemplazo, la vuelve a
    // pedir (por ejemplo, porque cambió el tipo de producto).
    updateFallback() {
      if (isShowingFallback) showFallback();
    },
    // Lo que espera saveRow() de catalogo-admin.js.
    getData() {
      return {
        file: fields.imagen.files[0],
        removeImage: fields.quitarImagen.checked,
        currentImage: current,
      };
    },
  };
}

// ---------- Modal de eliminación ----------

// Devuelve confirmDelete({ title, text, blocked, onDelete }):
// - text: string o lista de nodos/strings para .modal-texto.
// - blocked: no se puede eliminar; solo se muestra el aviso.
// - onDelete: async () => ({ error }) que hace la baja.
// La promesa se resuelve en true si se eliminó y en false si se cerró.
export function setupDeleteModal(modal) {
  const titleElement = modal.querySelector(".modal-titulo");
  const textElement = modal.querySelector(".modal-texto");
  const message = modal.querySelector(".mensaje-formulario");
  const confirmButton = modal.querySelector('[data-accion="eliminar"]');
  const cancelButton = modal.querySelector('[data-accion="cancelar"]');
  let pending = null;

  // Al cerrar, el navegador devuelve el foco al botón que abrió el modal.
  function close() {
    if (!confirmButton.disabled) modal.close();
  }

  modal.addEventListener("close", () => {
    pending?.resolve(false);
    pending = null;
  });

  confirmButton.addEventListener("click", async () => {
    const { onDelete, resolve } = pending;
    confirmButton.disabled = true;
    confirmButton.textContent = "Eliminando…";
    modal.setAttribute("aria-busy", "true");
    const { error } = await onDelete();
    confirmButton.disabled = false;
    confirmButton.textContent = "Eliminar";
    modal.removeAttribute("aria-busy");
    if (error) {
      showMessage(message, error);
      return;
    }
    pending = null;
    modal.close();
    resolve(true);
  });

  cancelButton.addEventListener("click", close);
  // Clic en el fondo oscuro (fuera de .modal-contenido) también cierra.
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  // Escape no cierra mientras se está eliminando.
  modal.addEventListener("cancel", (event) => {
    if (confirmButton.disabled) event.preventDefault();
  });

  return function confirmDelete({ title, text, blocked = false, onDelete }) {
    titleElement.textContent = title;
    textElement.replaceChildren(...[text].flat());
    showMessage(message, "");
    confirmButton.hidden = blocked;
    cancelButton.textContent = blocked ? "Entendido" : "Cancelar";
    modal.showModal();
    return new Promise((resolve) => {
      pending = { onDelete, resolve };
    });
  };
}
