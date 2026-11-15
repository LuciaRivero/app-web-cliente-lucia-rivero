/* =========================================================
   Whiplash — Página Administrar productos / Mi merch
   Arma la lista de productos con "Editar" y "Eliminar" y
   maneja el formulario, que sirve para el alta y, al tocar
   "Editar", para la edición del producto elegido.
   El admin global ve todos los productos; una cuenta de
   artista, solo los suyos, con el artista fijo en el
   formulario. Al resto lo lleva a la home.
   Las piezas comunes con Administrar artistas están en
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
import { createImage, formatPrice, getFallbackImage } from "../componentes/tarjetas.js";
import { getMyArtist } from "../servicios/artistas-admin.js";
import { validateImage } from "../servicios/catalogo-admin.js";
import { getArtists } from "../servicios/datos.js";
import {
  PRODUCT_TYPES,
  deleteProduct,
  saveProduct,
  getAdminProducts,
} from "../servicios/productos-admin.js";
import { createLoader, createElement, withSubmitting, showMessage, showToast } from "../utilidades/dom.js";

const form = document.querySelector(".formulario-admin form");
const formTitle = document.querySelector("#titulo-formulario");
const message = document.querySelector(".formulario-admin .mensaje-formulario");
const saveButton = form.querySelector('[type="submit"]');
const cancelButton = form.querySelector(".boton-cancelar");
const list = document.querySelector(".lista-admin");
const fields = form.elements;

let artistsById = new Map();
let products = [];
// Producto que se está editando; null = alta.
let editing = null;

// Cada regla devuelve el error del campo o un valor falso.
const errors = setupFieldErrors(form, {
  titulo: (field) => !field.value.trim() && "Escribí el título del producto.",
  tipo: (field) => !field.value && "Elegí el tipo de producto.",
  precio: (field) => {
    const price = Number(field.value);
    return (
      (field.value === "" || !Number.isInteger(price) || price < 0) &&
      "Ingresá un número entero mayor o igual a 0."
    );
  },
  artista_id: (field) => !field.value && "Elegí el artista.",
  imagen: (field) => field.files[0] && validateImage(field.files[0]),
});
// Sin imagen, la vista previa muestra la de reemplazo del tipo elegido.
const imageField = setupImageField(form, errors, () => getFallbackImage(fields.tipo.value));
fields.tipo.addEventListener("change", () => imageField.updateFallback());
const confirmDelete = setupDeleteModal(document.querySelector(".modal-eliminar"));

// ---------- Formulario ----------

function resetForm() {
  editing = null;
  form.reset();
  errors.clear();
  imageField.show(null);
  formTitle.textContent = "Nuevo producto";
  saveButton.textContent = "Agregar producto";
  cancelButton.hidden = true;
}

function editProduct(product) {
  editing = product;
  fields.titulo.value = product.titulo;
  fields.tipo.value = product.tipo;
  fields.precio.value = product.precio;
  fields.artista_id.value = product.artista_id;
  errors.clear();
  imageField.show(product.imagen);
  formTitle.textContent = `Editar “${product.titulo}”`;
  saveButton.textContent = "Guardar cambios";
  cancelButton.hidden = false;
  showMessage(message, "");
  // El formulario queda arriba de la lista: se lleva el foco ahí.
  formTitle.focus();
}

cancelButton.addEventListener("click", () => {
  resetForm();
  showMessage(message, "");
  fields.titulo.focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage(message, "");
  if (!errors.validate()) return;

  const wasEditing = Boolean(editing);
  const { product, error } = await withSubmitting(form, "Guardando…", () =>
    saveProduct(
      {
        id: editing?.id,
        titulo: fields.titulo.value,
        tipo: fields.tipo.value,
        precio: Number(fields.precio.value),
        artista_id: Number(fields.artista_id.value),
      },
      imageField.getData(),
    ),
  );
  if (error) {
    showMessage(message, error);
    return;
  }

  products = wasEditing
    ? products.map((current) => (current.id === product.id ? product : current))
    : [...products, product];
  renderList();
  resetForm();
  showToast(
    wasEditing ? `Guardamos los cambios de “${product.titulo}”.` : `Agregamos “${product.titulo}” a la tienda.`,
  );
});

// ---------- Lista ----------

async function removeProduct(product) {
  const deleted = await confirmDelete({
    title: "¿Eliminar producto?",
    text: [
      "Vas a eliminar ",
      createElement("strong", { text: `“${product.titulo}”` }),
      ". También se quita de los carritos donde esté. Esta acción no se puede deshacer.",
    ],
    onDelete: () => deleteProduct(product),
  });
  if (!deleted) return;

  if (editing?.id === product.id) resetForm();
  products = products.filter((current) => current.id !== product.id);
  renderList();
  showToast(`Eliminamos “${product.titulo}”.`);
  // El botón que abrió el modal ya no existe: el foco pasa al título de la lista.
  document.querySelector("#titulo-lista").focus();
}

function createItem(product) {
  const artist = artistsById.get(product.artista_id);
  const editButton = createElement("button", {
    className: "boton-admin",
    text: "Editar",
    attributes: { type: "button", "aria-label": `Editar ${product.titulo}` },
  });
  const deleteButton = createElement("button", {
    className: "boton-admin boton-admin-eliminar",
    text: "Eliminar",
    attributes: { type: "button", "aria-label": `Eliminar ${product.titulo}` },
  });
  editButton.addEventListener("click", () => editProduct(product));
  deleteButton.addEventListener("click", () => removeProduct(product));

  return createElement(
    "li",
    { className: "item-admin" },
    createImage(product.imagen, { className: "item-admin-imagen", type: product.tipo }),
    createElement(
      "div",
      { className: "item-admin-datos" },
      createElement("p", { className: "item-admin-titulo", text: product.titulo }),
      createElement("p", {
        className: "item-admin-detalle",
        text: [product.tipo, artist?.nombre, formatPrice(product.precio)].filter(Boolean).join(" · "),
      }),
    ),
    createElement("div", { className: "item-admin-acciones" }, editButton, deleteButton),
  );
}

function renderList() {
  if (!products.length) {
    list.replaceChildren(
      createElement("li", { className: "admin-vacio", text: "Todavía no hay productos. Cargá el primero." }),
    );
    return;
  }
  list.replaceChildren(...products.map(createItem));
}

// ---------- Inicio ----------

// Cuenta de artista: el único artista posible es el suyo. Va como
// opción seleccionada por defecto, así form.reset() la mantiene.
function lockArtist(artist) {
  fields.artista_id.replaceChildren(
    createElement("option", { text: artist.nombre, attributes: { value: artist.id, selected: "" } }),
  );
  fields.artista_id.disabled = true;
}

async function init(user) {
  const ownOnly = !user.esAdmin;
  if (ownOnly) {
    setPageTitle({
      title: "Mi merch",
      subtitle: "Cargá tus productos, editá los que ya están en la tienda o eliminalos.",
    });
  }

  fillOptions(
    fields.tipo,
    PRODUCT_TYPES.map((type) => ({ value: type, text: type })),
  );
  list.replaceChildren(createElement("li", {}, createLoader("Cargando productos…")));
  try {
    const [artists, allProducts, myArtist] = await Promise.all([
      getArtists(),
      getAdminProducts(),
      ownOnly ? getMyArtist(user) : null,
    ]);
    if (ownOnly && !myArtist) {
      showNoProfile("Tu cuenta no tiene un perfil de artista, así que no podés cargar merch.");
      return;
    }
    artistsById = new Map(artists.map((artist) => [artist.id, artist]));
    if (ownOnly) {
      lockArtist(myArtist);
    } else {
      fillOptions(
        fields.artista_id,
        artists.map((artist) => ({ value: artist.id, text: artist.nombre })),
      );
    }
    products = ownOnly ? allProducts.filter((product) => product.artista_id === myArtist.id) : allProducts;
    renderList();
  } catch (error) {
    console.error(error);
    list.replaceChildren(
      createElement("li", { className: "admin-vacio", text: "No pudimos cargar los productos. Probá de nuevo en un rato." }),
    );
  }
}

const user = guardPanel();
if (user) init(user);
