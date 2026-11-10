/* =========================================================
   Whiplash — Piezas comunes de las páginas de admin
   (pages/admin.html y pages/admin-artistas.html), que usan el
   admin global y, filtradas a lo suyo, las cuentas de artista:
   - protegerPanel: saca de la página a quien no es admin ni artista.
   - titularPagina / mostrarSinPerfil: textos según quién la usa.
   - prepararErrores: errores debajo de cada campo.
   - prepararImagen: campo de imagen con vista previa y
     "Quitar la imagen actual".
   - prepararModalEliminar: confirmación de "Eliminar" en un
     <dialog> (foco atrapado, Escape y resto de la página inerte).
   - completarOpciones: opciones de un <select>.
   Estilos en css/paginas/admin.css.
   ========================================================= */

import { validarImagen } from "../servicios/catalogo-admin.js";
import { rutaDesdeRaiz } from "../servicios/datos.js";
import { CAMBIO_SESION, usuarioActual } from "../servicios/sesion.js";
import { crearElemento, mostrarMensaje } from "../utilidades/dom.js";

// Entran el admin global y las cuentas de artista; al resto lo
// lleva a la home. Ocultar la página no protege nada: Supabase
// rechaza los cambios de quien no tiene permiso (RLS).
// Devuelve el usuario si puede seguir, o null.
export function protegerPanel() {
  const puedeEntrar = () => {
    const usuario = usuarioActual();
    return usuario?.esAdmin || usuario?.esArtista ? usuario : null;
  };
  const salir = () => location.replace(rutaDesdeRaiz("index.html"));
  // Si se cierra la sesión (o vence) desde otra parte, se sale.
  window.addEventListener(CAMBIO_SESION, () => {
    if (!puedeEntrar()) salir();
  });
  const usuario = puedeEntrar();
  if (!usuario) salir();
  return usuario;
}

// Textos de la página según quién la usa: el admin global o una
// cuenta de artista. Actualiza <title>, <h1>, subtítulo y miga actual.
export function titularPagina({ titulo, subtitulo }) {
  document.title = `${titulo} | Whiplash`;
  document.querySelector("h1").textContent = titulo;
  document.querySelector("main > .subtitulo").textContent = subtitulo;
  const miga = document.querySelector('.migas-de-pan [aria-current="page"]');
  if (miga) miga.textContent = titulo;
}

// Reemplaza el formulario y la lista por un aviso (por ejemplo,
// una cuenta de artista que ya no tiene perfil).
export function mostrarSinPerfil(texto) {
  document.querySelector(".admin-panel").replaceChildren(crearElemento("p", { clase: "admin-vacio", texto }));
}

export function completarOpciones(select, opciones) {
  select.replaceChildren(
    crearElemento("option", { texto: "Elegí una opción", atributos: { value: "" } }),
    ...opciones.map(({ valor, texto }) => crearElemento("option", { texto, atributos: { value: valor } })),
  );
}

// ---------- Errores por campo ----------

// `validaciones`: { nombreDelCampo: (campo) => error o valor falso }.
// El error va en el <small id="error-<name>"> debajo del campo,
// que el campo ya tiene en aria-describedby.
export function prepararErrores(formulario, validaciones) {
  const campos = formulario.elements;

  function mostrar(campo, texto) {
    document.querySelector(`#error-${campo.name}`).textContent = texto || "";
    if (texto) campo.setAttribute("aria-invalid", "true");
    else campo.removeAttribute("aria-invalid");
  }

  function limpiar() {
    for (const nombre of Object.keys(validaciones)) mostrar(campos[nombre], null);
  }

  // Marca todos los campos con error y enfoca el primero.
  // Devuelve true si el formulario es válido.
  function validar() {
    let primero = null;
    for (const [nombre, regla] of Object.entries(validaciones)) {
      const error = regla(campos[nombre]);
      mostrar(campos[nombre], error);
      if (error) primero ??= campos[nombre];
    }
    // Un <fieldset> con error enfoca su primer campo marcado.
    (primero?.querySelector?.('[aria-invalid="true"]') ?? primero)?.focus();
    return !primero;
  }

  // Al corregir un campo, su error desaparece.
  formulario.addEventListener("input", (evento) => {
    if (evento.target.name in validaciones) mostrar(evento.target, null);
  });

  return { mostrar, limpiar, validar };
}

// ---------- Imagen ----------

// Maneja .vista-previa, el campo "imagen" y el checkbox
// "quitarImagen" (dentro de .quitar-imagen) del formulario.
// `reemplazo`: imagen que se ve cuando no hay ninguna.
export function prepararImagen(formulario, errores, reemplazo) {
  const campos = formulario.elements;
  const vistaPrevia = formulario.querySelector(".vista-previa");
  const quitarImagen = formulario.querySelector(".quitar-imagen");
  // Imagen guardada de la fila que se edita; null = alta o sin imagen.
  let actual = null;
  // URL temporal de la imagen elegida, para la vista previa.
  let urlPrevia = null;

  function mostrarVistaPrevia(src) {
    if (urlPrevia) URL.revokeObjectURL(urlPrevia);
    urlPrevia = null;
    vistaPrevia.src = src || reemplazo;
  }

  const mostrarActual = () => mostrarVistaPrevia(actual ? rutaDesdeRaiz(actual) : null);

  // Si la imagen guardada no carga, la vista previa muestra la de reemplazo.
  vistaPrevia.addEventListener("error", () => {
    if (vistaPrevia.src !== reemplazo) vistaPrevia.src = reemplazo;
  });

  campos.imagen.addEventListener("change", () => {
    const archivo = campos.imagen.files[0];
    if (!archivo) {
      mostrarActual();
      return;
    }
    const error = validarImagen(archivo);
    if (error) {
      campos.imagen.value = "";
      errores.mostrar(campos.imagen, error);
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
      mostrarActual();
      return;
    }
    campos.imagen.value = "";
    mostrarVistaPrevia(null);
  });

  return {
    // `imagen`: la de la fila que se empieza a editar (null para un alta).
    mostrar(imagen) {
      actual = imagen ?? null;
      campos.imagen.value = "";
      campos.quitarImagen.checked = false;
      quitarImagen.hidden = !actual;
      mostrarActual();
    },
    // Lo que espera guardarFila() de catalogo-admin.js.
    datos() {
      return {
        archivo: campos.imagen.files[0],
        quitarImagen: campos.quitarImagen.checked,
        imagenActual: actual,
      };
    },
  };
}

// ---------- Modal de eliminación ----------

// Devuelve pedirConfirmacion({ titulo, texto, bloqueado, eliminar }):
// - texto: string o lista de nodos/strings para .modal-texto.
// - bloqueado: no se puede eliminar; solo se muestra el aviso.
// - eliminar: async () => ({ error }) que hace la baja.
// La promesa se resuelve en true si se eliminó y en false si se cerró.
export function prepararModalEliminar(modal) {
  const titulo = modal.querySelector(".modal-titulo");
  const texto = modal.querySelector(".modal-texto");
  const mensaje = modal.querySelector(".mensaje-formulario");
  const botonConfirmar = modal.querySelector('[data-accion="eliminar"]');
  const botonCancelar = modal.querySelector('[data-accion="cancelar"]');
  let pendiente = null;

  // Al cerrar, el navegador devuelve el foco al botón que abrió el modal.
  function cerrar() {
    if (!botonConfirmar.disabled) modal.close();
  }

  modal.addEventListener("close", () => {
    pendiente?.resolver(false);
    pendiente = null;
  });

  botonConfirmar.addEventListener("click", async () => {
    const { eliminar, resolver } = pendiente;
    botonConfirmar.disabled = true;
    botonConfirmar.textContent = "Eliminando…";
    modal.setAttribute("aria-busy", "true");
    const { error } = await eliminar();
    botonConfirmar.disabled = false;
    botonConfirmar.textContent = "Eliminar";
    modal.removeAttribute("aria-busy");
    if (error) {
      mostrarMensaje(mensaje, error);
      return;
    }
    pendiente = null;
    modal.close();
    resolver(true);
  });

  botonCancelar.addEventListener("click", cerrar);
  // Clic en el fondo oscuro (fuera de .modal-contenido) también cierra.
  modal.addEventListener("click", (evento) => {
    if (evento.target === modal) cerrar();
  });
  // Escape no cierra mientras se está eliminando.
  modal.addEventListener("cancel", (evento) => {
    if (botonConfirmar.disabled) evento.preventDefault();
  });

  return function pedirConfirmacion({ titulo: textoTitulo, texto: contenido, bloqueado = false, eliminar }) {
    titulo.textContent = textoTitulo;
    texto.replaceChildren(...[contenido].flat());
    mostrarMensaje(mensaje, "");
    botonConfirmar.hidden = bloqueado;
    botonCancelar.textContent = bloqueado ? "Entendido" : "Cancelar";
    modal.showModal();
    return new Promise((resolver) => {
      pendiente = { eliminar, resolver };
    });
  };
}
