/* =========================================================
   Whiplash — Página Administrar artistas / Mi perfil de artista
   Para el admin global: lista de todos los artistas con
   "Editar" y "Eliminar" y el formulario de alta o edición.
   Para una cuenta de artista: solo su perfil, con el
   formulario abierto para editarlo (sin alta). Al resto lo
   lleva a la home. El formulario tiene filas de canciones que
   se agregan y se quitan.
   Un artista con productos no se puede eliminar: el modal lo
   avisa en lugar de ofrecer la baja.
   Las piezas comunes con Administrar productos están en
   js/componentes/panel-admin.js.
   ========================================================= */

import {
  fillOptions,
  showNoProfile,
  setupFieldErrors,
  setupImageField,
  setupDeleteModal,
  guardPanel,
  setPageTitle,
} from "../componentes/panel-admin.js";
import { createImage } from "../componentes/tarjetas.js";
import {
  DURATION_FORMAT,
  deleteArtist,
  saveArtist,
  getAdminArtists,
  getMyArtist,
} from "../servicios/artistas-admin.js";
import { validateImage } from "../servicios/catalogo-admin.js";
import { getGenres, getProducts, getRootPath } from "../servicios/datos.js";
import { createLoader, createElement, withSubmitting, showMessage, showToast } from "../utilidades/dom.js";

const form = document.querySelector(".formulario-admin form");
const formTitle = document.querySelector("#titulo-formulario");
const message = document.querySelector(".formulario-admin .mensaje-formulario");
const saveButton = form.querySelector('[type="submit"]');
const cancelButton = form.querySelector(".boton-cancelar");
const trackList = form.querySelector(".lista-tracks-admin");
const addTrackButton = form.querySelector(".boton-agregar-track");
const list = document.querySelector(".lista-admin");
const fields = form.elements;

let artists = [];
// Cantidad de productos de cada artista (por id), para bloquear su baja.
let productCountByArtist = new Map();
// Artista que se está editando; null = alta.
let editing = null;
// true con una cuenta de artista: solo ve y edita su perfil.
let ownOnly = false;
// Para que los id de los campos de cada fila no se repitan.
let nextRowId = 0;

// ---------- Canciones ----------

function getTrackRows() {
  return [...trackList.children].map((row) => ({
    row,
    title: row.querySelector('[name="track-titulo"]'),
    duration: row.querySelector('[name="track-duracion"]'),
  }));
}

// Las filas sin título ni duración se ignoran al validar y guardar.
const isEmptyRow = ({ title, duration }) => !title.value.trim() && !duration.value.trim();

function numberRows() {
  getTrackRows().forEach(({ row }, index) => {
    const number = index + 1;
    row.querySelector(".track-numero").textContent = number;
    row.querySelector(".etiqueta-titulo").textContent = `Título de la canción ${number}`;
    row.querySelector(".etiqueta-duracion").textContent = `Duración de la canción ${number}`;
    row.querySelector(".quitar-track").setAttribute("aria-label", `Quitar la canción ${number}`);
  });
}

function createTrackRow({ titulo: title = "", duracion: duration = "" } = {}) {
  const id = nextRowId++;
  const titleField = createElement("input", {
    attributes: {
      type: "text",
      id: `track-titulo-${id}`,
      name: "track-titulo",
      placeholder: "Título",
      maxlength: "80",
      value: title,
    },
  });
  const durationField = createElement("input", {
    className: "track-duracion-admin",
    attributes: {
      type: "text",
      id: `track-duracion-${id}`,
      name: "track-duracion",
      placeholder: "3:24",
      inputmode: "numeric",
      maxlength: "5",
      value: duration,
    },
  });
  const removeButton = createElement("button", {
    className: "quitar-track",
    text: "✕",
    attributes: { type: "button" },
  });

  const row = createElement(
    "li",
    { className: "track-admin" },
    createElement("span", { className: "track-numero", attributes: { "aria-hidden": "true" } }),
    createElement("label", { className: "sr-only etiqueta-titulo", attributes: { for: titleField.id } }),
    titleField,
    createElement("label", { className: "sr-only etiqueta-duracion", attributes: { for: durationField.id } }),
    durationField,
    removeButton,
  );

  // El foco pasa a la fila siguiente (o al botón de agregar) para
  // no perderse cuando la fila desaparece.
  removeButton.addEventListener("click", () => {
    const target = row.nextElementSibling?.querySelector("input") ?? addTrackButton;
    row.remove();
    numberRows();
    target.focus();
  });
  return row;
}

function renderTracks(tracks) {
  trackList.replaceChildren(...tracks.map(createTrackRow));
  numberRows();
}

addTrackButton.addEventListener("click", () => {
  const row = createTrackRow();
  trackList.append(row);
  numberRows();
  row.querySelector("input").focus();
});

// Al corregir una canción se quita su marca; el error general,
// cuando ya no queda ninguna marcada.
trackList.addEventListener("input", (event) => {
  event.target.removeAttribute("aria-invalid");
  if (!trackList.querySelector('[aria-invalid="true"]')) errors.show(fields.tracks, null);
});

function validateTracks() {
  let error = null;
  for (const track of getTrackRows()) {
    const missingTitle = !isEmptyRow(track) && !track.title.value.trim();
    const invalidDuration = !isEmptyRow(track) && !DURATION_FORMAT.test(track.duration.value.trim());
    for (const [field, isInvalid] of [
      [track.title, missingTitle],
      [track.duration, invalidDuration],
    ]) {
      if (isInvalid) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    }
    error ??=
      (missingTitle && "Cada canción necesita un título.") ||
      (invalidDuration && "La duración va en minutos y segundos, por ejemplo 3:24.") ||
      null;
  }
  return error;
}

function getTracks() {
  return getTrackRows()
    .filter((track) => !isEmptyRow(track))
    .map(({ title, duration }) => ({ titulo: title.value.trim(), duracion: duration.value.trim() }));
}

// ---------- Formulario ----------

// Cada regla devuelve el error del campo o un valor falso.
const errors = setupFieldErrors(form, {
  nombre: (field) => !field.value.trim() && "Escribí el nombre del artista.",
  genero: (field) => !field.value && "Elegí el género.",
  imagen: (field) => field.files[0] && validateImage(field.files[0]),
  tracks: validateTracks,
});
const imageField = setupImageField(form, errors, getRootPath("assets/img/artistas/sin-imagen.svg"));
const confirmDelete = setupDeleteModal(document.querySelector(".modal-eliminar"));

function resetForm() {
  editing = null;
  form.reset();
  errors.clear();
  imageField.show(null);
  renderTracks([]);
  formTitle.textContent = "Nuevo artista";
  saveButton.textContent = "Agregar artista";
  cancelButton.hidden = true;
}

// `focus`: lleva el foco al formulario (al tocar "Editar").
function editArtist(artist, { focus = true } = {}) {
  editing = artist;
  fields.nombre.value = artist.nombre;
  fields.genero.value = artist.genero;
  fields.bio.value = artist.bio ?? "";
  errors.clear();
  imageField.show(artist.imagen);
  renderTracks(artist.tracks ?? []);
  formTitle.textContent = ownOnly ? "Tu perfil" : `Editar “${artist.nombre}”`;
  saveButton.textContent = "Guardar cambios";
  // Una cuenta de artista no tiene alta: no hay edición que cancelar.
  cancelButton.hidden = ownOnly;
  showMessage(message, "");
  // El formulario queda arriba de la lista: se lleva el foco ahí.
  if (focus) formTitle.focus();
}

cancelButton.addEventListener("click", () => {
  resetForm();
  showMessage(message, "");
  fields.nombre.focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage(message, "");
  if (!errors.validate()) return;

  const wasEditing = Boolean(editing);
  const { artist, error } = await withSubmitting(form, "Guardando…", () =>
    saveArtist(
      {
        id: editing?.id,
        nombre: fields.nombre.value,
        genero: fields.genero.value,
        bio: fields.bio.value,
        tracks: getTracks(),
      },
      imageField.getData(),
    ),
  );
  if (error) {
    showMessage(message, error);
    return;
  }

  artists = wasEditing
    ? artists.map((current) => (current.id === artist.id ? artist : current))
    : [...artists, artist];
  renderList();
  // La cuenta de artista sigue editando su perfil, ya actualizado.
  if (ownOnly) editArtist(artist, { focus: false });
  else resetForm();
  showToast(
    wasEditing ? `Guardamos los cambios de “${artist.nombre}”.` : `Agregamos a “${artist.nombre}” al catálogo.`,
  );
});

// ---------- Lista ----------

const getCountText = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

async function removeArtist(artist) {
  const productCount = productCountByArtist.get(artist.id) ?? 0;
  const name = createElement("strong", { text: `“${artist.nombre}”` });

  if (productCount) {
    await confirmDelete({
      title: "No se puede eliminar",
      text: [
        name,
        ` tiene ${getCountText(productCount, "producto", "productos")} en la tienda. `,
        ownOnly
          ? "Eliminalos desde Mi merch y volvé a intentar."
          : "Eliminalos o asignalos a otro artista desde Administrar productos y volvé a intentar.",
      ],
      blocked: true,
    });
    return;
  }

  const deleted = await confirmDelete({
    title: "¿Eliminar artista?",
    text: [
      "Vas a eliminar a ",
      name,
      ". También se quita de Mis artistas de quienes lo siguen. Esta acción no se puede deshacer.",
    ],
    onDelete: () => deleteArtist(artist),
  });
  if (!deleted) return;

  if (ownOnly) {
    showNoProfile("Eliminaste tu perfil de artista. Tu cuenta sigue activa como usuario.");
    showToast("Eliminamos tu perfil de artista.");
    return;
  }
  if (editing?.id === artist.id) resetForm();
  artists = artists.filter((current) => current.id !== artist.id);
  renderList();
  showToast(`Eliminamos a “${artist.nombre}”.`);
  // El botón que abrió el modal ya no existe: el foco pasa al título de la lista.
  document.querySelector("#titulo-lista").focus();
}

function createItem(artist) {
  const editButton = createElement("button", {
    className: "boton-admin",
    text: "Editar",
    attributes: { type: "button", "aria-label": `Editar ${artist.nombre}` },
  });
  const deleteButton = createElement("button", {
    className: "boton-admin boton-admin-eliminar",
    text: "Eliminar",
    attributes: { type: "button", "aria-label": `Eliminar ${artist.nombre}` },
  });
  editButton.addEventListener("click", () => editArtist(artist));
  deleteButton.addEventListener("click", () => removeArtist(artist));

  const detail = [
    artist.genero,
    getCountText(artist.tracks?.length ?? 0, "canción", "canciones"),
    getCountText(productCountByArtist.get(artist.id) ?? 0, "producto", "productos"),
  ];

  return createElement(
    "li",
    { className: "item-admin" },
    createImage(artist.imagen, { className: "item-admin-imagen item-admin-avatar", type: "artista" }),
    createElement(
      "div",
      { className: "item-admin-datos" },
      createElement("p", { className: "item-admin-titulo", text: artist.nombre }),
      createElement("p", { className: "item-admin-detalle", text: detail.join(" · ") }),
    ),
    createElement("div", { className: "item-admin-acciones" }, editButton, deleteButton),
  );
}

function renderList() {
  if (!artists.length) {
    list.replaceChildren(
      createElement("li", { className: "admin-vacio", text: "Todavía no hay artistas. Cargá el primero." }),
    );
    return;
  }
  list.replaceChildren(...artists.map(createItem));
}

// ---------- Inicio ----------

async function init(user) {
  ownOnly = !user.esAdmin;
  if (ownOnly) {
    setPageTitle({
      title: "Mi perfil de artista",
      subtitle: "Actualizá tu información, tu imagen y tus canciones.",
    });
    document.querySelector("#titulo-lista").textContent = "Así te ven";
  }

  renderTracks([]);
  list.replaceChildren(createElement("li", {}, createLoader("Cargando artistas…")));
  try {
    const [allArtists, genres, products] = await Promise.all([
      ownOnly ? getMyArtist(user).then((artist) => (artist ? [artist] : [])) : getAdminArtists(),
      getGenres(),
      getProducts(),
    ]);
    if (ownOnly && !allArtists.length) {
      showNoProfile("Tu cuenta no tiene un perfil de artista. Si creés que es un error, escribinos desde Contacto.");
      return;
    }
    fillOptions(
      fields.genero,
      genres.map((genre) => ({ value: genre.nombre, text: genre.nombre })),
    );
    productCountByArtist = new Map();
    for (const product of products) {
      productCountByArtist.set(product.artista_id, (productCountByArtist.get(product.artista_id) ?? 0) + 1);
    }
    artists = allArtists;
    renderList();
    if (ownOnly) editArtist(artists[0], { focus: false });
  } catch (error) {
    console.error(error);
    list.replaceChildren(
      createElement("li", { className: "admin-vacio", text: "No pudimos cargar los artistas. Probá de nuevo en un rato." }),
    );
  }
}

const user = guardPanel();
if (user) init(user);
