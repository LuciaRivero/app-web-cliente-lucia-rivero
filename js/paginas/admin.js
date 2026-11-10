/* =========================================================
   Whiplash — Página Administrar productos
   Solo para administradores: al resto lo lleva a la home.
   Arma la lista de productos con "Editar" y "Eliminar" y
   maneja el formulario, que sirve para el alta y, al tocar
   "Editar", para la edición del producto elegido.
   Las piezas comunes con Administrar artistas están en
   js/componentes/panel-admin.js.
   ========================================================= */

import {
  completarOpciones,
  prepararErrores,
  prepararImagen,
  prepararModalEliminar,
  protegerPaginaAdmin,
} from "../componentes/panel-admin.js";
import { crearImagen, formatearPrecio } from "../componentes/tarjetas.js";
import { validarImagen } from "../servicios/catalogo-admin.js";
import { obtenerArtistas, rutaDesdeRaiz } from "../servicios/datos.js";
import {
  TIPOS_PRODUCTO,
  eliminarProducto,
  guardarProducto,
  obtenerProductosAdmin,
} from "../servicios/productos-admin.js";
import { crearCargando, crearElemento, enviando, mostrarMensaje, mostrarToast } from "../utilidades/dom.js";

const formulario = document.querySelector(".formulario-admin form");
const tituloFormulario = document.querySelector("#titulo-formulario");
const mensaje = document.querySelector(".formulario-admin .mensaje-formulario");
const botonGuardar = formulario.querySelector('[type="submit"]');
const botonCancelar = formulario.querySelector(".boton-cancelar");
const lista = document.querySelector(".lista-admin");
const campos = formulario.elements;

let artistasPorId = new Map();
let productos = [];
// Producto que se está editando; null = alta.
let editando = null;

// Cada regla devuelve el error del campo o un valor falso.
const errores = prepararErrores(formulario, {
  titulo: (campo) => !campo.value.trim() && "Escribí el título del producto.",
  tipo: (campo) => !campo.value && "Elegí el tipo de producto.",
  precio: (campo) => {
    const precio = Number(campo.value);
    return (
      (campo.value === "" || !Number.isInteger(precio) || precio < 0) &&
      "Ingresá un número entero mayor o igual a 0."
    );
  },
  artista_id: (campo) => !campo.value && "Elegí el artista.",
  imagen: (campo) => campo.files[0] && validarImagen(campo.files[0]),
});
const imagen = prepararImagen(formulario, errores, rutaDesdeRaiz("assets/img/productos/sin-imagen.svg"));
const pedirConfirmacion = prepararModalEliminar(document.querySelector(".modal-eliminar"));

// ---------- Formulario ----------

function limpiarFormulario() {
  editando = null;
  formulario.reset();
  errores.limpiar();
  imagen.mostrar(null);
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
  errores.limpiar();
  imagen.mostrar(producto.imagen);
  tituloFormulario.textContent = `Editar “${producto.titulo}”`;
  botonGuardar.textContent = "Guardar cambios";
  botonCancelar.hidden = false;
  mostrarMensaje(mensaje, "");
  // El formulario queda arriba de la lista: se lleva el foco ahí.
  tituloFormulario.focus();
}

botonCancelar.addEventListener("click", () => {
  limpiarFormulario();
  mostrarMensaje(mensaje, "");
  campos.titulo.focus();
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mostrarMensaje(mensaje, "");
  if (!errores.validar()) return;

  const eraEdicion = Boolean(editando);
  const { producto, error } = await enviando(formulario, "Guardando…", () =>
    guardarProducto(
      {
        id: editando?.id,
        titulo: campos.titulo.value,
        tipo: campos.tipo.value,
        precio: Number(campos.precio.value),
        artista_id: Number(campos.artista_id.value),
      },
      imagen.datos(),
    ),
  );
  if (error) {
    mostrarMensaje(mensaje, error);
    return;
  }

  productos = eraEdicion
    ? productos.map((actual) => (actual.id === producto.id ? producto : actual))
    : [...productos, producto];
  dibujarLista();
  limpiarFormulario();
  mostrarToast(
    eraEdicion ? `Guardamos los cambios de “${producto.titulo}”.` : `Agregamos “${producto.titulo}” a la tienda.`,
  );
});

// ---------- Lista ----------

async function eliminar(producto) {
  const eliminado = await pedirConfirmacion({
    titulo: "¿Eliminar producto?",
    texto: [
      "Vas a eliminar ",
      crearElemento("strong", { texto: `“${producto.titulo}”` }),
      ". También se quita de los carritos donde esté. Esta acción no se puede deshacer.",
    ],
    eliminar: () => eliminarProducto(producto),
  });
  if (!eliminado) return;

  if (editando?.id === producto.id) limpiarFormulario();
  productos = productos.filter((actual) => actual.id !== producto.id);
  dibujarLista();
  mostrarToast(`Eliminamos “${producto.titulo}”.`);
  // El botón que abrió el modal ya no existe: el foco pasa al título de la lista.
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
  botonEliminar.addEventListener("click", () => eliminar(producto));

  return crearElemento(
    "li",
    { clase: "item-admin" },
    crearImagen(producto.imagen, { clase: "item-admin-imagen" }),
    crearElemento(
      "div",
      { clase: "item-admin-datos" },
      crearElemento("p", { clase: "item-admin-titulo", texto: producto.titulo }),
      crearElemento("p", {
        clase: "item-admin-detalle",
        texto: [producto.tipo, artista?.nombre, formatearPrecio(producto.precio)].filter(Boolean).join(" · "),
      }),
    ),
    crearElemento("div", { clase: "item-admin-acciones" }, botonEditar, botonEliminar),
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

if (protegerPaginaAdmin()) iniciar();
