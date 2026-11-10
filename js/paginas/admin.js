/* =========================================================
   Whiplash — Página Administrar productos
   Solo para administradores: al resto lo lleva a la home.
   Arma la lista de productos con "Editar" y "Eliminar" y
   maneja el formulario, que sirve para el alta y, al tocar
   "Editar", para la edición del producto elegido.
   Ocultar la página no protege nada: Supabase rechaza los
   cambios de quien no es administrador (RLS).
   ========================================================= */

import { crearImagen, formatearPrecio } from "../componentes/tarjetas.js";
import { obtenerArtistas, rutaDesdeRaiz } from "../servicios/datos.js";
import {
  TIPOS_PRODUCTO,
  eliminarProducto,
  guardarProducto,
  obtenerProductosAdmin,
  validarImagen,
} from "../servicios/productos-admin.js";
import { CAMBIO_SESION, usuarioActual } from "../servicios/sesion.js";
import { crearCargando, crearElemento, enviando, mostrarMensaje } from "../utilidades/dom.js";

const IMAGEN_REEMPLAZO = rutaDesdeRaiz("assets/img/productos/sin-imagen.svg");

const formulario = document.querySelector(".formulario-producto form");
const tituloFormulario = document.querySelector("#titulo-formulario");
const mensaje = document.querySelector(".formulario-producto .mensaje-formulario");
const vistaPrevia = formulario.querySelector(".vista-previa");
const quitarImagen = formulario.querySelector(".quitar-imagen");
const botonGuardar = formulario.querySelector('[type="submit"]');
const botonCancelar = formulario.querySelector(".boton-cancelar");
const lista = document.querySelector(".lista-productos");
const aviso = document.querySelector(".admin-aviso");
const campos = formulario.elements;

let artistasPorId = new Map();
let productos = [];
// Producto que se está editando; null = alta.
let editando = null;
// URL temporal de la imagen elegida, para la vista previa.
let urlPrevia = null;

function esAdmin() {
  return Boolean(usuarioActual()?.esAdmin);
}

// ---------- Formulario ----------

function mostrarVistaPrevia(src) {
  if (urlPrevia) URL.revokeObjectURL(urlPrevia);
  urlPrevia = null;
  vistaPrevia.src = src || IMAGEN_REEMPLAZO;
}

function limpiarFormulario() {
  editando = null;
  formulario.reset();
  mostrarVistaPrevia(null);
  quitarImagen.hidden = true;
  tituloFormulario.textContent = "Nuevo producto";
  botonGuardar.textContent = "Agregar producto";
  botonCancelar.hidden = true;
}

function editar(producto) {
  editando = producto;
  campos.titulo.value = producto.titulo;
  campos.tipo.value = producto.tipo;
  campos.precio.value = producto.precio;
  campos.artista_id.value = producto.artista_id;
  campos.imagen.value = "";
  campos.quitarImagen.checked = false;
  quitarImagen.hidden = !producto.imagen;
  mostrarVistaPrevia(producto.imagen ? rutaDesdeRaiz(producto.imagen) : null);
  tituloFormulario.textContent = `Editar “${producto.titulo}”`;
  botonGuardar.textContent = "Guardar cambios";
  botonCancelar.hidden = false;
  mostrarMensaje(mensaje, "");
  // El formulario queda arriba de la lista: se lleva el foco ahí.
  tituloFormulario.focus();
}

// Devuelve el primer error (y enfoca su campo) o null.
function validar() {
  const precio = Number(campos.precio.value);
  const archivo = campos.imagen.files[0];
  const errores = [
    [campos.titulo, !campos.titulo.value.trim() && "Escribí el título del producto."],
    [campos.tipo, !campos.tipo.value && "Elegí el tipo de producto."],
    [
      campos.precio,
      (campos.precio.value === "" || !Number.isInteger(precio) || precio < 0) &&
        "El precio tiene que ser un número entero mayor o igual a 0.",
    ],
    [campos.artista_id, !campos.artista_id.value && "Elegí el artista."],
    [campos.imagen, archivo && validarImagen(archivo)],
  ];
  const [campo, error] = errores.find(([, error]) => error) ?? [];
  if (!error) return null;
  campo.focus();
  return error;
}

// Si la imagen guardada no carga, la vista previa muestra la de reemplazo.
vistaPrevia.addEventListener("error", () => {
  if (vistaPrevia.src !== IMAGEN_REEMPLAZO) vistaPrevia.src = IMAGEN_REEMPLAZO;
});

campos.imagen.addEventListener("change", () => {
  const archivo = campos.imagen.files[0];
  if (!archivo) {
    mostrarVistaPrevia(editando?.imagen ? rutaDesdeRaiz(editando.imagen) : null);
    return;
  }
  const error = validarImagen(archivo);
  if (error) {
    mostrarMensaje(mensaje, error);
    campos.imagen.value = "";
    return;
  }
  mostrarMensaje(mensaje, "");
  mostrarVistaPrevia(null);
  urlPrevia = URL.createObjectURL(archivo);
  vistaPrevia.src = urlPrevia;
  campos.quitarImagen.checked = false;
});

// Quitar la imagen y subir otra se excluyen.
campos.quitarImagen.addEventListener("change", () => {
  if (!campos.quitarImagen.checked) {
    mostrarVistaPrevia(rutaDesdeRaiz(editando.imagen));
    return;
  }
  campos.imagen.value = "";
  mostrarVistaPrevia(null);
});

botonCancelar.addEventListener("click", () => {
  limpiarFormulario();
  mostrarMensaje(mensaje, "");
  campos.titulo.focus();
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const error = validar();
  if (error) {
    mostrarMensaje(mensaje, error);
    return;
  }

  mostrarMensaje(mensaje, "");
  const eraEdicion = Boolean(editando);
  const { producto, error: errorGuardado } = await enviando(formulario, "Guardando…", () =>
    guardarProducto(
      {
        id: editando?.id,
        titulo: campos.titulo.value,
        tipo: campos.tipo.value,
        precio: Number(campos.precio.value),
        artista_id: Number(campos.artista_id.value),
      },
      {
        archivo: campos.imagen.files[0],
        quitarImagen: campos.quitarImagen.checked,
        imagenActual: editando?.imagen,
      },
    ),
  );
  if (errorGuardado) {
    mostrarMensaje(mensaje, errorGuardado);
    return;
  }

  productos = eraEdicion
    ? productos.map((actual) => (actual.id === producto.id ? producto : actual))
    : [...productos, producto];
  dibujarLista();
  limpiarFormulario();
  mostrarMensaje(
    mensaje,
    eraEdicion ? `Guardamos los cambios de “${producto.titulo}”.` : `Agregamos “${producto.titulo}” a la tienda.`,
    "exito",
  );
});

// ---------- Lista ----------

async function eliminar(producto, boton) {
  if (!confirm(`¿Eliminar “${producto.titulo}”? También se quita de los carritos donde esté.`)) return;
  boton.disabled = true;
  const { error } = await eliminarProducto(producto);
  if (error) {
    boton.disabled = false;
    mostrarMensaje(mensaje, error);
    return;
  }
  if (editando?.id === producto.id) limpiarFormulario();
  productos = productos.filter((actual) => actual.id !== producto.id);
  dibujarLista();
  aviso.textContent = `Eliminamos “${producto.titulo}”.`;
  // El botón eliminado se llevó el foco: pasa al título de la lista.
  document.querySelector("#titulo-lista").focus();
}

function crearItem(producto) {
  const artista = artistasPorId.get(producto.artista_id);
  const botonEditar = crearElemento("button", {
    clase: "boton-admin",
    texto: "Editar",
    atributos: { type: "button", "aria-label": `Editar ${producto.titulo}` },
  });
  const botonEliminar = crearElemento("button", {
    clase: "boton-admin boton-admin-eliminar",
    texto: "Eliminar",
    atributos: { type: "button", "aria-label": `Eliminar ${producto.titulo}` },
  });
  botonEditar.addEventListener("click", () => editar(producto));
  botonEliminar.addEventListener("click", () => eliminar(producto, botonEliminar));

  return crearElemento(
    "li",
    { clase: "producto-admin" },
    crearImagen(producto.imagen, { clase: "producto-admin-imagen" }),
    crearElemento(
      "div",
      { clase: "producto-admin-datos" },
      crearElemento("p", { clase: "producto-admin-titulo", texto: producto.titulo }),
      crearElemento("p", {
        clase: "producto-admin-detalle",
        texto: [producto.tipo, artista?.nombre, formatearPrecio(producto.precio)].filter(Boolean).join(" · "),
      }),
    ),
    crearElemento("div", { clase: "producto-admin-acciones" }, botonEditar, botonEliminar),
  );
}

function dibujarLista() {
  if (!productos.length) {
    lista.replaceChildren(
      crearElemento("li", { clase: "admin-vacio", texto: "Todavía no hay productos. Cargá el primero." }),
    );
    return;
  }
  lista.replaceChildren(...productos.map(crearItem));
}

// ---------- Inicio ----------

function completarOpciones(select, opciones) {
  select.replaceChildren(
    crearElemento("option", { texto: "Elegí una opción", atributos: { value: "" } }),
    ...opciones.map(({ valor, texto }) => crearElemento("option", { texto, atributos: { value: valor } })),
  );
}

async function iniciar() {
  completarOpciones(
    campos.tipo,
    TIPOS_PRODUCTO.map((tipo) => ({ valor: tipo, texto: tipo })),
  );
  lista.replaceChildren(crearElemento("li", {}, crearCargando("Cargando productos…")));
  try {
    const [artistas, todos] = await Promise.all([obtenerArtistas(), obtenerProductosAdmin()]);
    artistasPorId = new Map(artistas.map((artista) => [artista.id, artista]));
    completarOpciones(
      campos.artista_id,
      artistas.map((artista) => ({ valor: artista.id, texto: artista.nombre })),
    );
    productos = todos;
    dibujarLista();
  } catch (error) {
    console.error(error);
    lista.replaceChildren(
      crearElemento("li", { clase: "admin-vacio", texto: "No pudimos cargar los productos. Probá de nuevo en un rato." }),
    );
  }
}

// Si se cierra la sesión (o vence) desde otra parte, se sale.
window.addEventListener(CAMBIO_SESION, () => {
  if (!esAdmin()) location.replace(rutaDesdeRaiz("index.html"));
});

if (esAdmin()) iniciar();
else location.replace(rutaDesdeRaiz("index.html"));
