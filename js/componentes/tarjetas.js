/* =========================================================
   Whiplash — Tarjetas generadas desde los datos
   Arman el HTML de .tarjeta-artista y .producto-merch
   para reutilizar sus estilos. Las usan <artist-grid>,
   <product-grid>, el buscador y la página Explorar.
   Se usa textContent para que los datos nunca se interpreten
   como HTML (importante cuando vengan de Supabase).
   ========================================================= */

import {
  alternarSeguir,
  estaSiguiendo,
  guardarSeguirPendiente,
} from "../servicios/artistas-seguidos.js";
import { agregarAlCarrito } from "../servicios/carrito.js";
import { rutaDesdeRaiz } from "../servicios/datos.js";
import { usuarioActual } from "../servicios/sesion.js";
import { crearElemento } from "../utilidades/dom.js";

const URL_PRODUCTO = rutaDesdeRaiz("pages/producto.html");
const URL_CUENTA = rutaDesdeRaiz("pages/cuenta.html");
const URL_EXPLORAR = rutaDesdeRaiz("pages/explorar.html");
// Imagen que se ve cuando un producto o artista no tiene una.
const IMAGEN_REEMPLAZO = {
  producto: rutaDesdeRaiz("assets/img/productos/sin-imagen.svg"),
  artista: rutaDesdeRaiz("assets/img/artistas/sin-imagen.svg"),
};
// Opciones del formulario de compra según el tipo de producto.
// Las entradas no tienen opciones: se elige la cantidad.
const OPCIONES_COMPRA = {
  Disco: { etiqueta: "Formato", nombre: "formato", valores: ["Vinilo", "CD", "Digital"] },
  Remera: { etiqueta: "Talle", nombre: "talle", valores: ["S", "M", "L", "XL"] },
};

// Perfil de un artista: pages/producto.html?id=3. El merch no tiene
// página propia, así que sus enlaces llevan al perfil de su artista.
export function urlArtista(id) {
  return `${URL_PRODUCTO}?id=${id}`;
}

// Explorar con un género ya elegido en los filtros:
// pages/explorar.html?genero=Deathcore.
export function urlGenero(genero) {
  return `${URL_EXPLORAR}?genero=${encodeURIComponent(genero)}`;
}

export function formatearPrecio(precio) {
  return `$${precio.toLocaleString("es-AR")}`;
}

// Pone en `img` la imagen de un producto o artista (`tipo`). Sin
// imagen guardada, o si la guardada no carga (URL rota, archivo
// borrado), muestra la de reemplazo.
export function mostrarImagen(img, imagen, tipo = "producto") {
  const reemplazo = IMAGEN_REEMPLAZO[tipo];
  img.src = imagen ? rutaDesdeRaiz(imagen) : reemplazo;
  img.addEventListener(
    "error",
    () => {
      img.src = reemplazo;
    },
    { once: true },
  );
  return img;
}

export function crearImagen(imagen, { clase, alt = "", tipo = "producto" } = {}) {
  return mostrarImagen(crearElemento("img", { clase, atributos: { alt } }), imagen, tipo);
}

function crearFigura(imagen, alt, titulo, tipo) {
  return crearElemento(
    "figure",
    {},
    crearImagen(imagen, { alt, tipo }),
    crearElemento("figcaption", { texto: titulo }),
  );
}

function crearFiguraConEnlace(href, imagen, alt, titulo, tipo) {
  return crearElemento("a", { atributos: { href } }, crearFigura(imagen, alt, titulo, tipo));
}

// Botón de alternar: aria-pressed dice si ya se sigue al artista
// y el texto visible cambia a "Siguiendo". Sin sesión deja al
// artista pendiente y lleva a Mi cuenta: al ingresar se sigue.
// El estado llega de Supabase: hasta entonces se muestra "Seguir".
// Lo usan las tarjetas y el perfil.
export function prepararBotonSeguir(boton, artista) {
  const mostrarEstado = (siguiendo) => {
    boton.setAttribute("aria-pressed", String(siguiendo));
    boton.textContent = siguiendo ? "Siguiendo" : "Seguir";
  };
  boton.setAttribute("aria-label", `Seguir a ${artista.nombre}`);
  mostrarEstado(false);
  if (usuarioActual()) {
    estaSiguiendo(artista.id)
      .then(mostrarEstado)
      .catch((error) => console.error(error));
  }
  boton.addEventListener("click", async () => {
    if (!usuarioActual()) {
      guardarSeguirPendiente(artista.id);
      location.href = URL_CUENTA;
      return;
    }
    // Mientras se guarda, el botón no acepta otro clic.
    boton.disabled = true;
    try {
      mostrarEstado(await alternarSeguir(artista.id));
    } catch (error) {
      console.error("No se pudo actualizar el artista seguido", error);
    } finally {
      boton.disabled = false;
    }
  });
  return boton;
}

export function crearTarjetaArtista(artista) {
  return crearElemento(
    "article",
    { clase: "tarjeta-artista" },
    crearFiguraConEnlace(
      urlArtista(artista.id),
      artista.imagen,
      `Imagen de ${artista.nombre}`,
      artista.nombre,
      "artista",
    ),
    crearElemento("p", { clase: "genero-artista", texto: artista.genero }),
    prepararBotonSeguir(
      crearElemento("button", { clase: "boton-seguir-artista", atributos: { type: "button" } }),
      artista,
    ),
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
    : crearFiguraConEnlace(urlArtista(producto.artista_id), producto.imagen, alt, producto.titulo);

  const accion = conCompra
    ? crearFormularioCompra(producto)
    : crearElemento("a", {
        clase: "boton boton-compra",
        texto: "Ver producto",
        atributos: { href: urlArtista(producto.artista_id) },
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
// `tipo`: "producto" o "artista", para la imagen de reemplazo.
export function crearResultadoBuscador({ href, imagen, tipo, titulo, detalle }) {
  return crearElemento(
    "a",
    { clase: "resultado-buscador", atributos: { href } },
    crearImagen(imagen, { tipo }),
    crearElemento(
      "span",
      {},
      crearElemento("strong", { texto: titulo }),
      crearElemento("small", { texto: detalle }),
    ),
  );
}
