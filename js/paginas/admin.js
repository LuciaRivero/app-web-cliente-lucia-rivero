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
const modal = document.querySelector(".modal-eliminar");
const modalProducto = modal.querySelector(".modal-producto");
const modalMensaje = modal.querySelector(".mensaje-formulario");
const botonConfirmar = modal.querySelector('[data-accion="eliminar"]');

let artistasPorId = new Map();
let productos = [];
// Producto que se está editando; null = alta.
let editando = null;
// URL temporal de la imagen elegida, para la vista previa.
let urlPrevia = null;
// Producto que espera confirmación en el modal.
let porEliminar = null;

function esAdmin() {
  return Boolean(usuarioActual()?.esAdmin);
}

// ---------- Errores por campo ----------

// Cada regla devuelve el error del campo o un valor falso.
const VALIDACIONES = {
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
};

// El error va en el <small id="error-<name>"> debajo del campo,
// que el campo ya tiene en aria-describedby.
function mostrarErrorCampo(campo, texto) {
  document.querySelector(`#error-${campo.name}`).textContent = texto || "";
  if (texto) campo.setAttribute("aria-invalid", "true");
  else campo.removeAttribute("aria-invalid");
}

function limpiarErrores() {
  for (const nombre of Object.keys(VALIDACIONES)) mostrarErrorCampo(campos[nombre], null);
}

// Marca todos los campos con error y enfoca el primero.
// Devuelve true si el formulario es válido.
function validar() {
  let primero = null;
  for (const [nombre, regla] of Object.entries(VALIDACIONES)) {
    const error = regla(campos[nombre]);
    mostrarErrorCampo(campos[nombre], error);
    if (error) primero ??= campos[nombre];
  }
  primero?.focus();
  return !primero;
}

// Al corregir un campo, su error desaparece.
formulario.addEventListener("input", (evento) => {
  if (evento.target.name in VALIDACIONES) mostrarErrorCampo(evento.target, null);
});

// ---------- Formulario ----------

function mostrarVistaPrevia(src) {
  if (urlPrevia) URL.revokeObjectURL(urlPrevia);
  urlPrevia = null;
  vistaPrevia.src = src || IMAGEN_REEMPLAZO;
}

function limpiarFormulario() {
  editando = null;
  formulario.reset();
  limpiarErrores();
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
  limpiarErrores();
  quitarImagen.hidden = !producto.imagen;
  mostrarVistaPrevia(producto.imagen ? rutaDesdeRaiz(producto.imagen) : null);
  tituloFormulario.textContent = `Editar “${producto.titulo}”`;
  botonGuardar.textContent = "Guardar cambios";
  botonCancelar.hidden = false;
  mostrarMensaje(mensaje, "");
  // El formulario queda arriba de la lista: se lleva el foco ahí.
  tituloFormulario.focus();
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
    campos.imagen.value = "";
    mostrarErrorCampo(campos.imagen, error);
    return;
  }
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
  mostrarMensaje(mensaje, "");
  if (!validar()) return;

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

// ---------- Modal de eliminación ----------

function pedirConfirmacion(producto) {
  porEliminar = producto;
  modalProducto.textContent = `“${producto.titulo}”`;
  mostrarMensaje(modalMensaje, "");
  modal.showModal();
}

// Al cerrar, el navegador devuelve el foco al botón "Eliminar"
// que abrió el modal (si el producto sigue en la lista).
function cerrarModal() {
  if (botonConfirmar.disabled) return;
  modal.close();
}

async function eliminar() {
  const producto = porEliminar;
  botonConfirmar.disabled = true;
  botonConfirmar.textContent = "Eliminando…";
  modal.setAttribute("aria-busy", "true");
  const { error } = await eliminarProducto(producto);
  botonConfirmar.disabled = false;
  botonConfirmar.textContent = "Eliminar";
  modal.removeAttribute("aria-busy");
  if (error) {
    mostrarMensaje(modalMensaje, error);
    return;
  }

  modal.close();
  if (editando?.id === producto.id) limpiarFormulario();
  productos = productos.filter((actual) => actual.id !== producto.id);
  dibujarLista();
  aviso.textContent = `Eliminamos “${producto.titulo}”.`;
  // El botón que abrió el modal ya no existe: el foco pasa al título de la lista.
  document.querySelector("#titulo-lista").focus();
}

botonConfirmar.addEventListener("click", eliminar);
modal.querySelector('[data-accion="cancelar"]').addEventListener("click", cerrarModal);
// Clic en el fondo oscuro (fuera de .modal-contenido) también cierra.
modal.addEventListener("click", (evento) => {
  if (evento.target === modal) cerrarModal();
});
// Escape no cierra mientras se está eliminando.
modal.addEventListener("cancel", (evento) => {
  if (botonConfirmar.disabled) evento.preventDefault();
});

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
  botonEliminar.addEventListener("click", () => pedirConfirmacion(producto));

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
