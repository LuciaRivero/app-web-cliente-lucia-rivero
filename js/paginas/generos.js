/* =========================================================
   Whiplash — Página Géneros
   - Arma una .tarjeta-genero por cada género de la tabla
     generos (Supabase) que tiene artistas, con su lista.
   - Los chips de <genre-chips filter> filtran las tarjetas
     en la misma página; "Todos" vuelve a mostrarlas todas.
   ========================================================= */

import { obtenerArtistas, obtenerGenerosConArtistas } from "../servicios/datos.js";
import { urlArtista, urlGenero } from "../componentes/tarjetas.js";
import { crearCargando, crearElemento } from "../utilidades/dom.js";

const info = document.querySelector(".info-resultados");
const grilla = document.querySelector(".grilla-generos");

// "Mostrando 1 género" / "Mostrando 11 géneros"
function textoGeneros(cantidad) {
  return `Mostrando ${cantidad} ${cantidad === 1 ? "género" : "géneros"}`;
}

// "Deathcore: 5 artistas"
function textoGenero(tarjeta) {
  const cantidad = Number(tarjeta.dataset.artistas);
  return `${tarjeta.dataset.genero}: ${cantidad} ${cantidad === 1 ? "artista" : "artistas"}`;
}

function crearTarjetaGenero(genero, artistas) {
  const tarjeta = crearElemento("article", { clase: "tarjeta-genero" }, crearElemento("h3", { texto: genero.nombre }));
  tarjeta.dataset.genero = genero.nombre;
  tarjeta.dataset.artistas = artistas.length;

  tarjeta.append(
    crearElemento(
      "ul",
      {},
      ...artistas.map((artista) =>
        crearElemento(
          "li",
          {},
          crearElemento("a", { texto: artista.nombre, atributos: { href: urlArtista(artista.id) } }),
        ),
      ),
    ),
    crearElemento("a", {
      clase: "boton",
      texto: "Ver artistas",
      atributos: { href: urlGenero(genero.nombre), "aria-label": `Ver artistas de ${genero.nombre}` },
    }),
  );
  return tarjeta;
}

let tarjetas = [];
let elegido = null;

// Con un género elegido queda visible solo su tarjeta.
function filtrar() {
  const visible = tarjetas.find((tarjeta) => tarjeta.dataset.genero === elegido);
  for (const tarjeta of tarjetas) {
    tarjeta.hidden = Boolean(elegido) && tarjeta !== visible;
  }
  info.textContent = elegido && visible ? textoGenero(visible) : textoGeneros(tarjetas.length);
}

// Si se elige un chip antes de que lleguen los artistas, el
// filtro se aplica cuando lleguen.
document.addEventListener("genre-change", ({ detail }) => {
  elegido = detail.genre;
  if (tarjetas.length) filtrar();
});

async function mostrarGeneros() {
  const cargando = crearCargando("Cargando géneros…");
  grilla.setAttribute("aria-busy", "true");
  grilla.append(cargando);

  let generos;
  let artistas;
  try {
    [generos, artistas] = await Promise.all([obtenerGenerosConArtistas(), obtenerArtistas()]);
  } catch (error) {
    console.error(error);
    info.textContent = "No pudimos cargar los géneros. Probá de nuevo en un rato.";
    return;
  } finally {
    cargando.remove();
    grilla.removeAttribute("aria-busy");
  }

  // --orden escalona la animación de entrada (css/componentes/cargando.css).
  tarjetas = generos.map((genero, indice) => {
    const tarjeta = crearTarjetaGenero(
      genero,
      artistas.filter((artista) => artista.genero === genero.nombre),
    );
    tarjeta.style.setProperty("--orden", indice);
    return tarjeta;
  });
  grilla.append(...tarjetas);
  filtrar();
}

mostrarGeneros();
