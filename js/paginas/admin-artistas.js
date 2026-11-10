/* =========================================================
   Whiplash — Página Administrar artistas
   Solo para administradores: al resto lo lleva a la home.
   Arma la lista de artistas con "Editar" y "Eliminar" y
   maneja el formulario (alta o edición del artista elegido),
   con filas de canciones que se agregan y se quitan.
   Un artista con productos no se puede eliminar: el modal lo
   avisa en lugar de ofrecer la baja.
   Las piezas comunes con Administrar productos están en
   js/componentes/panel-admin.js.
   ========================================================= */

import {
  completarOpciones,
  prepararErrores,
  prepararImagen,
  prepararModalEliminar,
  protegerPaginaAdmin,
} from "../componentes/panel-admin.js";
import { crearImagen } from "../componentes/tarjetas.js";
import {
  FORMATO_DURACION,
  eliminarArtista,
  guardarArtista,
  obtenerArtistasAdmin,
} from "../servicios/artistas-admin.js";
import { validarImagen } from "../servicios/catalogo-admin.js";
import { obtenerGeneros, obtenerProductos, rutaDesdeRaiz } from "../servicios/datos.js";
import { crearCargando, crearElemento, enviando, mostrarMensaje, mostrarToast } from "../utilidades/dom.js";

const formulario = document.querySelector(".formulario-admin form");
const tituloFormulario = document.querySelector("#titulo-formulario");
const mensaje = document.querySelector(".formulario-admin .mensaje-formulario");
const botonGuardar = formulario.querySelector('[type="submit"]');
const botonCancelar = formulario.querySelector(".boton-cancelar");
const listaTracks = formulario.querySelector(".lista-tracks-admin");
const botonAgregarTrack = formulario.querySelector(".boton-agregar-track");
const lista = document.querySelector(".lista-admin");
const campos = formulario.elements;

let artistas = [];
// Cantidad de productos de cada artista (por id), para bloquear su baja.
let productosPorArtista = new Map();
// Artista que se está editando; null = alta.
let editando = null;
// Para que los id de los campos de cada fila no se repitan.
let siguienteFila = 0;

// ---------- Canciones ----------

function filasTracks() {
  return [...listaTracks.children].map((fila) => ({
    fila,
    titulo: fila.querySelector('[name="track-titulo"]'),
    duracion: fila.querySelector('[name="track-duracion"]'),
  }));
}

// Las filas sin título ni duración se ignoran al validar y guardar.
const filaVacia = ({ titulo, duracion }) => !titulo.value.trim() && !duracion.value.trim();

function numerarFilas() {
  filasTracks().forEach(({ fila }, indice) => {
    const numero = indice + 1;
    fila.querySelector(".track-numero").textContent = numero;
    fila.querySelector(".etiqueta-titulo").textContent = `Título de la canción ${numero}`;
    fila.querySelector(".etiqueta-duracion").textContent = `Duración de la canción ${numero}`;
    fila.querySelector(".quitar-track").setAttribute("aria-label", `Quitar la canción ${numero}`);
  });
}

function crearFilaTrack({ titulo = "", duracion = "" } = {}) {
  const id = siguienteFila++;
  const campoTitulo = crearElemento("input", {
    atributos: {
      type: "text",
      id: `track-titulo-${id}`,
      name: "track-titulo",
      placeholder: "Título",
      maxlength: "80",
      value: titulo,
    },
  });
  const campoDuracion = crearElemento("input", {
    clase: "track-duracion-admin",
    atributos: {
      type: "text",
      id: `track-duracion-${id}`,
      name: "track-duracion",
      placeholder: "3:24",
      inputmode: "numeric",
      maxlength: "5",
      value: duracion,
    },
  });
  const quitar = crearElemento("button", {
    clase: "quitar-track",
    texto: "✕",
    atributos: { type: "button" },
  });

  const fila = crearElemento(
    "li",
    { clase: "track-admin" },
    crearElemento("span", { clase: "track-numero", atributos: { "aria-hidden": "true" } }),
    crearElemento("label", { clase: "sr-only etiqueta-titulo", atributos: { for: campoTitulo.id } }),
    campoTitulo,
    crearElemento("label", { clase: "sr-only etiqueta-duracion", atributos: { for: campoDuracion.id } }),
    campoDuracion,
    quitar,
  );

  // El foco pasa a la fila siguiente (o al botón de agregar) para
  // no perderse cuando la fila desaparece.
  quitar.addEventListener("click", () => {
    const destino = fila.nextElementSibling?.querySelector("input") ?? botonAgregarTrack;
    fila.remove();
    numerarFilas();
    destino.focus();
  });
  return fila;
}

function mostrarTracks(tracks) {
  listaTracks.replaceChildren(...tracks.map(crearFilaTrack));
  numerarFilas();
}

botonAgregarTrack.addEventListener("click", () => {
  const fila = crearFilaTrack();
  listaTracks.append(fila);
  numerarFilas();
  fila.querySelector("input").focus();
});

// Al corregir una canción se quita su marca; el error general,
// cuando ya no queda ninguna marcada.
listaTracks.addEventListener("input", (evento) => {
  evento.target.removeAttribute("aria-invalid");
  if (!listaTracks.querySelector('[aria-invalid="true"]')) errores.mostrar(campos.tracks, null);
});

function validarTracks() {
  let error = null;
  for (const track of filasTracks()) {
    const faltaTitulo = !filaVacia(track) && !track.titulo.value.trim();
    const duracionMal = !filaVacia(track) && !FORMATO_DURACION.test(track.duracion.value.trim());
    for (const [campo, mal] of [
      [track.titulo, faltaTitulo],
      [track.duracion, duracionMal],
    ]) {
      if (mal) campo.setAttribute("aria-invalid", "true");
      else campo.removeAttribute("aria-invalid");
    }
    error ??=
      (faltaTitulo && "Cada canción necesita un título.") ||
      (duracionMal && "La duración va en minutos y segundos, por ejemplo 3:24.") ||
      null;
  }
  return error;
}

function leerTracks() {
  return filasTracks()
    .filter((track) => !filaVacia(track))
    .map(({ titulo, duracion }) => ({ titulo: titulo.value.trim(), duracion: duracion.value.trim() }));
}

// ---------- Formulario ----------

// Cada regla devuelve el error del campo o un valor falso.
const errores = prepararErrores(formulario, {
  nombre: (campo) => !campo.value.trim() && "Escribí el nombre del artista.",
  genero: (campo) => !campo.value && "Elegí el género.",
  imagen: (campo) => campo.files[0] && validarImagen(campo.files[0]),
  tracks: validarTracks,
});
const imagen = prepararImagen(formulario, errores, rutaDesdeRaiz("assets/img/artistas/sin-imagen.svg"));
const pedirConfirmacion = prepararModalEliminar(document.querySelector(".modal-eliminar"));

function limpiarFormulario() {
  editando = null;
  formulario.reset();
  errores.limpiar();
  imagen.mostrar(null);
  mostrarTracks([]);
  tituloFormulario.textContent = "Nuevo artista";
  botonGuardar.textContent = "Agregar artista";
  botonCancelar.hidden = true;
}

function editar(artista) {
  editando = artista;
  campos.nombre.value = artista.nombre;
  campos.genero.value = artista.genero;
  campos.bio.value = artista.bio ?? "";
  errores.limpiar();
  imagen.mostrar(artista.imagen);
  mostrarTracks(artista.tracks ?? []);
  tituloFormulario.textContent = `Editar “${artista.nombre}”`;
  botonGuardar.textContent = "Guardar cambios";
  botonCancelar.hidden = false;
  mostrarMensaje(mensaje, "");
  // El formulario queda arriba de la lista: se lleva el foco ahí.
  tituloFormulario.focus();
}

botonCancelar.addEventListener("click", () => {
  limpiarFormulario();
  mostrarMensaje(mensaje, "");
  campos.nombre.focus();
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mostrarMensaje(mensaje, "");
  if (!errores.validar()) return;

  const eraEdicion = Boolean(editando);
  const { artista, error } = await enviando(formulario, "Guardando…", () =>
    guardarArtista(
      {
        id: editando?.id,
        nombre: campos.nombre.value,
        genero: campos.genero.value,
        bio: campos.bio.value,
        tracks: leerTracks(),
      },
      imagen.datos(),
    ),
  );
  if (error) {
    mostrarMensaje(mensaje, error);
    return;
  }

  artistas = eraEdicion
    ? artistas.map((actual) => (actual.id === artista.id ? artista : actual))
    : [...artistas, artista];
  dibujarLista();
  limpiarFormulario();
  mostrarToast(
    eraEdicion ? `Guardamos los cambios de “${artista.nombre}”.` : `Agregamos a “${artista.nombre}” al catálogo.`,
  );
});

// ---------- Lista ----------

const textoCantidad = (cantidad, singular, plural) => `${cantidad} ${cantidad === 1 ? singular : plural}`;

async function eliminar(artista) {
  const cantidadProductos = productosPorArtista.get(artista.id) ?? 0;
  const nombre = crearElemento("strong", { texto: `“${artista.nombre}”` });

  if (cantidadProductos) {
    await pedirConfirmacion({
      titulo: "No se puede eliminar",
      texto: [
        nombre,
        ` tiene ${textoCantidad(cantidadProductos, "producto", "productos")} en la tienda. `,
        "Eliminalos o asignalos a otro artista desde Administrar productos y volvé a intentar.",
      ],
      bloqueado: true,
    });
    return;
  }

  const eliminado = await pedirConfirmacion({
    titulo: "¿Eliminar artista?",
    texto: [
      "Vas a eliminar a ",
      nombre,
      ". También se quita de Mis artistas de quienes lo siguen. Esta acción no se puede deshacer.",
    ],
    eliminar: () => eliminarArtista(artista),
  });
  if (!eliminado) return;

  if (editando?.id === artista.id) limpiarFormulario();
  artistas = artistas.filter((actual) => actual.id !== artista.id);
  dibujarLista();
  mostrarToast(`Eliminamos a “${artista.nombre}”.`);
  // El botón que abrió el modal ya no existe: el foco pasa al título de la lista.
  document.querySelector("#titulo-lista").focus();
}

function crearItem(artista) {
  const botonEditar = crearElemento("button", {
    clase: "boton-admin",
    texto: "Editar",
    atributos: { type: "button", "aria-label": `Editar ${artista.nombre}` },
  });
  const botonEliminar = crearElemento("button", {
    clase: "boton-admin boton-admin-eliminar",
    texto: "Eliminar",
    atributos: { type: "button", "aria-label": `Eliminar ${artista.nombre}` },
  });
  botonEditar.addEventListener("click", () => editar(artista));
  botonEliminar.addEventListener("click", () => eliminar(artista));

  const detalle = [
    artista.genero,
    textoCantidad(artista.tracks?.length ?? 0, "canción", "canciones"),
    textoCantidad(productosPorArtista.get(artista.id) ?? 0, "producto", "productos"),
  ];

  return crearElemento(
    "li",
    { clase: "item-admin" },
    crearImagen(artista.imagen, { clase: "item-admin-imagen item-admin-avatar", tipo: "artista" }),
    crearElemento(
      "div",
      { clase: "item-admin-datos" },
      crearElemento("p", { clase: "item-admin-titulo", texto: artista.nombre }),
      crearElemento("p", { clase: "item-admin-detalle", texto: detalle.join(" · ") }),
    ),
    crearElemento("div", { clase: "item-admin-acciones" }, botonEditar, botonEliminar),
  );
}

function dibujarLista() {
  if (!artistas.length) {
    lista.replaceChildren(
      crearElemento("li", { clase: "admin-vacio", texto: "Todavía no hay artistas. Cargá el primero." }),
    );
    return;
  }
  lista.replaceChildren(...artistas.map(crearItem));
}

// ---------- Inicio ----------

async function iniciar() {
  mostrarTracks([]);
  lista.replaceChildren(crearElemento("li", {}, crearCargando("Cargando artistas…")));
  try {
    const [todos, generos, productos] = await Promise.all([
      obtenerArtistasAdmin(),
      obtenerGeneros(),
      obtenerProductos(),
    ]);
    completarOpciones(
      campos.genero,
      generos.map((genero) => ({ valor: genero.nombre, texto: genero.nombre })),
    );
    productosPorArtista = new Map();
    for (const producto of productos) {
      productosPorArtista.set(producto.artista_id, (productosPorArtista.get(producto.artista_id) ?? 0) + 1);
    }
    artistas = todos;
    dibujarLista();
  } catch (error) {
    console.error(error);
    lista.replaceChildren(
      crearElemento("li", { clase: "admin-vacio", texto: "No pudimos cargar los artistas. Probá de nuevo en un rato." }),
    );
  }
}

if (protegerPaginaAdmin()) iniciar();
