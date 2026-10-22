/* =========================================================
   Whiplash — Página Mis artistas
   Solo con sesión: sin ella lleva a Mi cuenta para ingresar.
   Arma la lista con los artistas que sigue el usuario (en el
   orden en que los siguió) y maneja el botón "Quitar".
   ========================================================= */

import { dejarDeSeguir, leerSeguidos } from "../servicios/artistas-seguidos.js";
import { obtenerArtistas, rutaDesdeRaiz } from "../servicios/datos.js";
import { usuarioActual } from "../servicios/sesion.js";
import { crearCargando, crearElemento } from "../utilidades/dom.js";

const lista = document.querySelector(".lista-artistas");
const vacio = document.querySelector(".artistas-vacio");
const aviso = document.querySelector(".artistas-aviso");
const titulo = document.querySelector("#titulo-mis-artistas");

function mostrarVacio() {
  lista.hidden = true;
  vacio.hidden = false;
}

function crearItem(artista) {
  const quitar = crearElemento("button", {
    clase: "quitar",
    texto: "Quitar",
    atributos: { type: "button", "aria-label": `Quitar a ${artista.nombre} de mis artistas` },
  });

  const item = crearElemento(
    "li",
    { clase: "artista-guardado" },
    crearElemento(
      "a",
      { clase: "artista-guardado-enlace", atributos: { href: rutaDesdeRaiz("pages/producto.html") } },
      crearElemento("img", {
        clase: "avatar",
        atributos: { src: rutaDesdeRaiz(artista.imagen), alt: `Avatar de ${artista.nombre}` },
      }),
      crearElemento("span", { clase: "artista-guardado-nombre", texto: artista.nombre }),
      crearElemento("span", { clase: "artista-guardado-genero", texto: artista.genero }),
    ),
    quitar,
  );

  quitar.addEventListener("click", () => {
    dejarDeSeguir(artista.id);
    // El foco pasa al "Quitar" siguiente (o al anterior); si la
    // lista queda vacía, al título, para no perderse con el teclado.
    const vecino = item.nextElementSibling ?? item.previousElementSibling;
    item.remove();
    aviso.textContent = `Quitaste a ${artista.nombre} de tus artistas.`;
    if (vecino) {
      vecino.querySelector(".quitar").focus();
    } else {
      mostrarVacio();
      titulo.focus();
    }
  });

  return item;
}

async function iniciar() {
  const ids = leerSeguidos();
  if (!ids.length) {
    mostrarVacio();
    return;
  }

  lista.replaceChildren(crearElemento("li", {}, crearCargando("Cargando tus artistas…")));
  try {
    const artistas = await obtenerArtistas();
    const porId = new Map(artistas.map((artista) => [artista.id, artista]));
    const seguidos = ids.map((id) => porId.get(id)).filter(Boolean);
    if (!seguidos.length) {
      mostrarVacio();
      return;
    }
    lista.replaceChildren(...seguidos.map(crearItem));
  } catch (error) {
    console.error(error);
    lista.replaceChildren(crearElemento("li", { texto: "No pudimos cargar tus artistas." }));
  }
}

if (usuarioActual()) iniciar();
else location.replace(rutaDesdeRaiz("pages/cuenta.html"));
