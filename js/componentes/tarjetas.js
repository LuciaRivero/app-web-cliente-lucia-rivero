/* =========================================================
   Whiplash — Tarjetas generadas desde los datos
   Arman el HTML de .tarjeta-artista y .producto-merch
   para reutilizar sus estilos. Las usan <artist-grid>,
   <product-grid>, el buscador y la página Explorar.
   Se usa textContent para que los datos nunca se interpreten
   como HTML (importante cuando vengan de Supabase).
   ========================================================= */

import { agregarAlCarrito } from "../servicios/carrito.js";
import { rutaDesdeRaiz } from "../servicios/datos.js";
import { crearElemento } from "../utilidades/dom.js";

const URL_PRODUCTO = rutaDesdeRaiz("pages/producto.html");
// Opciones del formulario de compra según el tipo de producto.
// Las entradas no tienen opciones: se elige la cantidad.
const OPCIONES_COMPRA = {
  Disco: { etiqueta: "Formato", nombre: "formato", valores: ["Vinilo", "CD", "Digital"] },
  Remera: { etiqueta: "Talle", nombre: "talle", valores: ["S", "M", "L", "XL"] },
};

export function formatearPrecio(precio) {
  return `$${precio.toLocaleString("es-AR")}`;
}

function crearFigura(imagen, alt, titulo) {
  return crearElemento(
    "figure",
    {},
    crearElemento("img", { atributos: { src: rutaDesdeRaiz(imagen), alt } }),
    crearElemento("figcaption", { texto: titulo }),
  );
}

function crearFiguraConEnlace(imagen, alt, titulo) {
  return crearElemento("a", { atributos: { href: URL_PRODUCTO } }, crearFigura(imagen, alt, titulo));
}

export function crearTarjetaArtista(artista) {
  return crearElemento(
    "article",
    { clase: "tarjeta-artista" },
    crearFiguraConEnlace(artista.imagen, `Imagen de ${artista.nombre}`, artista.nombre),
    crearElemento("p", { clase: "genero-artista", texto: artista.genero }),
    crearElemento("button", { texto: "Seguir", atributos: { type: "button" } }),
  );
}

// Texto visible corto ("Formato") + el producto solo para lectores
// de pantalla ("Formato de Andén (LP)"), para distinguir cada tarjeta.
function crearTitulo(etiqueta, texto, producto, atributos = {}) {
  return crearElemento(
    etiqueta,
    { clase: "titulo-opcion", atributos },
    texto,
    crearElemento("span", { clase: "sr-only", texto: ` de ${producto.titulo}` }),
  );
}

// Opciones como pastillas: radios nativos (teclado y lector de
// pantalla funcionan solos) con el círculo oculto por CSS.
function crearPastillas(producto, opciones) {
  return crearElemento(
    "fieldset",
    { clase: "opciones-compra" },
    crearTitulo("legend", opciones.etiqueta, producto),
    crearElemento(
      "div",
      { clase: "lista-opciones" },
      ...opciones.valores.map((valor, indice) => {
        const radio = crearElemento("input", {
          atributos: { type: "radio", name: opciones.nombre, value: valor },
        });
        radio.checked = indice === 0;
        return crearElemento("label", { clase: "opcion-compra" }, radio, crearElemento("span", { texto: valor }));
      }),
    ),
  );
}

// Cantidad de entradas con botones − y + (mismo estilo que el carrito).
function crearCantidad(producto) {
  const idCampo = `cantidad-${producto.id}`;
  const input = crearElemento("input", {
    atributos: { type: "number", id: idCampo, name: "cantidad", value: "1", min: "1", max: "10" },
  });
  const restar = crearElemento("button", {
    texto: "−",
    atributos: { type: "button", "aria-label": "Restar una entrada" },
  });
  const sumar = crearElemento("button", {
    texto: "+",
    atributos: { type: "button", "aria-label": "Sumar una entrada" },
  });

  const min = Number(input.min);
  const max = Number(input.max);
  function actualizar() {
    // Si se escribe a mano un número fuera de rango, se corrige.
    const valor = Math.min(max, Math.max(min, Math.round(input.valueAsNumber) || min));
    if (input.valueAsNumber !== valor) input.value = valor;
    restar.disabled = valor <= min;
    sumar.disabled = valor >= max;
  }
  restar.addEventListener("click", () => {
    input.stepDown();
    actualizar();
  });
  sumar.addEventListener("click", () => {
    input.stepUp();
    actualizar();
  });
  input.addEventListener("change", actualizar);
  actualizar();

  return crearElemento(
    "div",
    { clase: "fila-cantidad" },
    crearTitulo("label", "Cantidad", producto, { for: idCampo }),
    crearElemento("div", { clase: "selector-cantidad" }, restar, input, sumar),
  );
}

// Guarda el producto con la opción elegida (formato, talle) o la
// cantidad de entradas; el botón confirma visualmente y avisa al
// lector de pantalla, sin recargar la página.
function confirmarAgregado(formulario, producto, boton, aviso) {
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (boton.classList.contains("agregado")) return;

    const campos = new FormData(formulario);
    const opciones = OPCIONES_COMPRA[producto.tipo];
    const opcion = opciones ? campos.get(opciones.nombre) : null;
    const cantidad = Number(campos.get("cantidad")) || 1;
    agregarAlCarrito(producto.id, opcion, cantidad);

    boton.classList.add("agregado");
    boton.textContent = "Agregado ✓";
    aviso.textContent = "Producto agregado al carrito";
    setTimeout(() => {
      boton.classList.remove("agregado");
      boton.textContent = "Agregar al carrito";
      aviso.textContent = "";
    }, 1800);
  });
}

// Formulario de la página del artista: pastillas con las opciones
// del tipo (formato, talle) o la cantidad para las entradas.
function crearFormularioCompra(producto) {
  const opciones = OPCIONES_COMPRA[producto.tipo];
  const boton = crearElemento("button", {
    clase: "boton-agregar",
    texto: "Agregar al carrito",
    atributos: { type: "submit" },
  });
  const aviso = crearElemento("p", { clase: "sr-only", atributos: { "aria-live": "polite" } });

  const formulario = crearElemento(
    "form",
    { clase: "compra-merch", atributos: { action: "#", method: "post" } },
    opciones ? crearPastillas(producto, opciones) : crearCantidad(producto),
    boton,
    aviso,
  );
  confirmarAgregado(formulario, producto, boton, aviso);
  return formulario;
}

// conCompra: en lugar del enlace "Ver producto" muestra el formulario
// para agregar al carrito (se usa en la página del artista).
export function crearProductoMerch(producto, { conCompra = false } = {}) {
  const alt = producto.artista
    ? `${producto.tipo} ${producto.titulo} de ${producto.artista.nombre}`
    : `${producto.tipo} ${producto.titulo}`;

  const portada = conCompra
    ? crearFigura(producto.imagen, alt, producto.titulo)
    : crearFiguraConEnlace(producto.imagen, alt, producto.titulo);

  const accion = conCompra
    ? crearFormularioCompra(producto)
    : crearElemento("a", {
        clase: "boton boton-compra",
        texto: "Ver producto",
        atributos: { href: URL_PRODUCTO },
      });

  return crearElemento(
    "article",
    { clase: "producto-merch" },
    portada,
    crearElemento("p", { clase: "tipo-merch", texto: producto.tipo }),
    crearElemento("p", { clase: "precio", texto: formatearPrecio(producto.precio) }),
    accion,
  );
}

// Fila compacta para el desplegable del buscador.
export function crearResultadoBuscador({ imagen, titulo, detalle }) {
  return crearElemento(
    "a",
    { clase: "resultado-buscador", atributos: { href: URL_PRODUCTO } },
    crearElemento("img", { atributos: { src: rutaDesdeRaiz(imagen), alt: "" } }),
    crearElemento(
      "span",
      {},
      crearElemento("strong", { texto: titulo }),
      crearElemento("small", { texto: detalle }),
    ),
  );
}
