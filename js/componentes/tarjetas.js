/* =========================================================
   Whiplash — Tarjetas generadas desde los datos
   Arman el HTML de .tarjeta-artista y .producto-merch
   para reutilizar sus estilos. Las usan <artist-grid>,
   <product-grid>, el buscador y la página Explorar.
   Se usa textContent para que los datos nunca se interpreten
   como HTML (importante cuando vengan de Supabase).
   ========================================================= */

import {
  toggleFollow,
  isFollowing,
  savePendingFollow,
} from "../servicios/artistas-seguidos.js";
import { addToCart } from "../servicios/carrito.js";
import { getRootPath } from "../servicios/datos.js";
import { getCurrentUser } from "../servicios/sesion.js";
import { createElement } from "../utilidades/dom.js";

const PRODUCT_URL = getRootPath("pages/producto.html");
const ACCOUNT_URL = getRootPath("pages/cuenta.html");
const EXPLORE_URL = getRootPath("pages/explorar.html");
// Imagen que se ve cuando un producto o artista no tiene una:
// la del tipo de producto, o la de artista.
const FALLBACK_IMAGES = {
  Disco: getRootPath("assets/img/productos/disco.svg"),
  Entrada: getRootPath("assets/img/productos/entrada.svg"),
  Remera: getRootPath("assets/img/productos/remera.svg"),
  artista: getRootPath("assets/img/artistas/sin-imagen.svg"),
};
// Opciones del formulario de compra según el tipo de producto.
// Las entradas no tienen opciones: se elige la cantidad.
const PURCHASE_OPTIONS = {
  Disco: { label: "Formato", name: "formato", values: ["Vinilo", "CD", "Digital"] },
  Remera: { label: "Talle", name: "talle", values: ["S", "M", "L", "XL"] },
};

// Perfil de un artista: pages/producto.html?id=3. El merch no tiene
// página propia, así que sus enlaces llevan al perfil de su artista.
export function getArtistUrl(id) {
  return `${PRODUCT_URL}?id=${id}`;
}

// Explorar con un género ya elegido en los filtros:
// pages/explorar.html?genero=Deathcore.
export function getGenreUrl(genre) {
  return `${EXPLORE_URL}?genero=${encodeURIComponent(genre)}`;
}

export function formatPrice(price) {
  return `$${price.toLocaleString("es-AR")}`;
}

// `type`: "artista" o el tipo del producto ("Disco", "Entrada",
// "Remera"). Un tipo desconocido usa la imagen de disco.
export function getFallbackImage(type) {
  return FALLBACK_IMAGES[type] ?? FALLBACK_IMAGES.Disco;
}

// Pone en `img` la imagen de un producto o artista (ver `type` en
// getFallbackImage()). Sin imagen guardada, o si la guardada no carga
// (URL rota, archivo borrado), muestra la de reemplazo de su tipo.
export function showImage(img, image, type) {
  const fallback = getFallbackImage(type);
  img.src = image ? getRootPath(image) : fallback;
  img.addEventListener(
    "error",
    () => {
      img.src = fallback;
    },
    { once: true },
  );
  return img;
}

export function createImage(image, { className, alt = "", type } = {}) {
  return showImage(createElement("img", { className, attributes: { alt } }), image, type);
}

function createFigure(image, alt, title, type) {
  return createElement(
    "figure",
    {},
    createImage(image, { alt, type }),
    createElement("figcaption", { text: title }),
  );
}

function createLinkedFigure(href, image, alt, title, type) {
  return createElement("a", { attributes: { href } }, createFigure(image, alt, title, type));
}

// Botón de alternar: aria-pressed dice si ya se sigue al artista
// y el texto visible cambia a "Siguiendo". Sin sesión deja al
// artista pendiente y lleva a Mi cuenta: al ingresar se sigue.
// El estado llega de Supabase: hasta entonces se muestra "Seguir".
// Lo usan las tarjetas y el perfil.
export function setupFollowButton(button, artist) {
  const showState = (following) => {
    button.setAttribute("aria-pressed", String(following));
    button.textContent = following ? "Siguiendo" : "Seguir";
  };
  button.setAttribute("aria-label", `Seguir a ${artist.nombre}`);
  showState(false);
  if (getCurrentUser()) {
    isFollowing(artist.id)
      .then(showState)
      .catch((error) => console.error(error));
  }
  button.addEventListener("click", async () => {
    if (!getCurrentUser()) {
      savePendingFollow(artist.id);
      location.href = ACCOUNT_URL;
      return;
    }
    // Mientras se guarda, el botón no acepta otro clic.
    button.disabled = true;
    try {
      showState(await toggleFollow(artist.id));
    } catch (error) {
      console.error("No se pudo actualizar el artista seguido", error);
    } finally {
      button.disabled = false;
    }
  });
  return button;
}

export function createArtistCard(artist) {
  return createElement(
    "article",
    { className: "tarjeta-artista" },
    createLinkedFigure(
      getArtistUrl(artist.id),
      artist.imagen,
      `Imagen de ${artist.nombre}`,
      artist.nombre,
      "artista",
    ),
    createElement("p", { className: "genero-artista", text: artist.genero }),
    setupFollowButton(
      createElement("button", { className: "boton-seguir-artista", attributes: { type: "button" } }),
      artist,
    ),
  );
}

// Texto visible corto ("Formato") + el producto solo para lectores
// de pantalla ("Formato de Andén (LP)"), para distinguir cada tarjeta.
function createOptionTitle(tag, text, product, attributes = {}) {
  return createElement(
    tag,
    { className: "titulo-opcion", attributes },
    text,
    createElement("span", { className: "sr-only", text: ` de ${product.titulo}` }),
  );
}

// Opciones como pastillas: radios nativos (teclado y lector de
// pantalla funcionan solos) con el círculo oculto por CSS.
function createPills(product, options) {
  return createElement(
    "fieldset",
    { className: "opciones-compra" },
    createOptionTitle("legend", options.label, product),
    createElement(
      "div",
      { className: "lista-opciones" },
      ...options.values.map((value, index) => {
        const radio = createElement("input", {
          attributes: { type: "radio", name: options.name, value },
        });
        radio.checked = index === 0;
        return createElement("label", { className: "opcion-compra" }, radio, createElement("span", { text: value }));
      }),
    ),
  );
}

// Cantidad de entradas con botones − y + (mismo estilo que el carrito).
function createQuantityPicker(product) {
  const fieldId = `cantidad-${product.id}`;
  const input = createElement("input", {
    attributes: { type: "number", id: fieldId, name: "cantidad", value: "1", min: "1", max: "10" },
  });
  const decrease = createElement("button", {
    text: "−",
    attributes: { type: "button", "aria-label": "Restar una entrada" },
  });
  const increase = createElement("button", {
    text: "+",
    attributes: { type: "button", "aria-label": "Sumar una entrada" },
  });

  const min = Number(input.min);
  const max = Number(input.max);
  function update() {
    // Si se escribe a mano un número fuera de rango, se corrige.
    const value = Math.min(max, Math.max(min, Math.round(input.valueAsNumber) || min));
    if (input.valueAsNumber !== value) input.value = value;
    decrease.disabled = value <= min;
    increase.disabled = value >= max;
  }
  decrease.addEventListener("click", () => {
    input.stepDown();
    update();
  });
  increase.addEventListener("click", () => {
    input.stepUp();
    update();
  });
  input.addEventListener("change", update);
  update();

  return createElement(
    "div",
    { className: "fila-cantidad" },
    createOptionTitle("label", "Cantidad", product, { for: fieldId }),
    createElement("div", { className: "selector-cantidad" }, decrease, input, increase),
  );
}

// Guarda el producto con la opción elegida (formato, talle) o la
// cantidad de entradas; el botón confirma visualmente y avisa al
// lector de pantalla, sin recargar la página.
function setupAddToCart(form, product, button, notice) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (button.classList.contains("agregado")) return;

    const fields = new FormData(form);
    const options = PURCHASE_OPTIONS[product.tipo];
    const option = options ? fields.get(options.name) : null;
    const quantity = Number(fields.get("cantidad")) || 1;
    addToCart(product.id, option, quantity);

    button.classList.add("agregado");
    button.textContent = "Agregado ✓";
    notice.textContent = "Producto agregado al carrito";
    setTimeout(() => {
      button.classList.remove("agregado");
      button.textContent = "Agregar al carrito";
      notice.textContent = "";
    }, 1800);
  });
}

// Formulario de la página del artista: pastillas con las opciones
// del tipo (formato, talle) o la cantidad para las entradas.
function createPurchaseForm(product) {
  const options = PURCHASE_OPTIONS[product.tipo];
  const button = createElement("button", {
    className: "boton-agregar",
    text: "Agregar al carrito",
    attributes: { type: "submit" },
  });
  const notice = createElement("p", { className: "sr-only", attributes: { "aria-live": "polite" } });

  const form = createElement(
    "form",
    { className: "compra-merch", attributes: { action: "#", method: "post" } },
    options ? createPills(product, options) : createQuantityPicker(product),
    button,
    notice,
  );
  setupAddToCart(form, product, button, notice);
  return form;
}

// withPurchase: en lugar del enlace "Ver producto" muestra el formulario
// para agregar al carrito (se usa en la página del artista).
export function createMerchProduct(product, { withPurchase = false } = {}) {
  const alt = product.artist
    ? `${product.tipo} ${product.titulo} de ${product.artist.nombre}`
    : `${product.tipo} ${product.titulo}`;

  const cover = withPurchase
    ? createFigure(product.imagen, alt, product.titulo, product.tipo)
    : createLinkedFigure(getArtistUrl(product.artista_id), product.imagen, alt, product.titulo, product.tipo);

  const action = withPurchase
    ? createPurchaseForm(product)
    : createElement("a", {
        className: "boton boton-compra",
        text: "Ver producto",
        attributes: { href: getArtistUrl(product.artista_id) },
      });

  return createElement(
    "article",
    { className: "producto-merch" },
    cover,
    createElement("p", { className: "tipo-merch", text: product.tipo }),
    createElement("p", { className: "precio", text: formatPrice(product.precio) }),
    action,
  );
}

// Fila compacta para el desplegable del buscador.
// `type`: "artista" o el tipo del producto, para la imagen de reemplazo.
export function createSearchResult({ href, image, type, title, detail }) {
  return createElement(
    "a",
    { className: "resultado-buscador", attributes: { href } },
    createImage(image, { type }),
    createElement(
      "span",
      {},
      createElement("strong", { text: title }),
      createElement("small", { text: detail }),
    ),
  );
}
