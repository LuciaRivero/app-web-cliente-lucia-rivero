/* =========================================================
   Whiplash — Buscador del encabezado
   - Mientras se escribe muestra resultados en un desplegable.
   - Al enviar (Enter o botón) lleva a Explorar con ?q=...
   - En mobile, .boton-buscar muestra y oculta el formulario.
   ========================================================= */

import { buscar, rutaDesdeRaiz } from "../servicios/datos.js";
import { crearResultadoBuscador, formatearPrecio } from "./tarjetas.js";
import { crearElemento, leerConsulta, textoResultados } from "../utilidades/dom.js";

const MAXIMO_POR_GRUPO = 4;
const ESPERA_MS = 200;

export function iniciarBuscador() {
  const encabezado = document.querySelector(".encabezado-sitio");
  const formulario = document.querySelector(".buscador");
  if (!encabezado || !formulario) return;

  const input = formulario.querySelector('input[type="search"]');
  const urlExplorar = rutaDesdeRaiz("pages/explorar.html");

  const panel = crearElemento("div", {
    clase: "buscador-resultados",
    atributos: { id: "buscador-resultados" },
  });
  panel.hidden = true;
  formulario.append(panel);
  input.setAttribute("aria-controls", panel.id);
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("autocomplete", "off");

  // Lector de pantalla: anuncia cuántos resultados hay.
  const anuncio = crearElemento("p", { clase: "sr-only", atributos: { "aria-live": "polite" } });
  formulario.append(anuncio);

  // Si se está en Explorar con ?q=, el campo arranca con esa búsqueda.
  const consultaActual = leerConsulta();
  if (consultaActual) input.value = consultaActual;

  function abrir() {
    panel.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }

  function cerrar() {
    panel.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }

  function urlBusqueda(termino) {
    return `${urlExplorar}?q=${encodeURIComponent(termino)}`;
  }

  function crearGrupo(titulo, elementos) {
    return crearElemento(
      "div",
      { clase: "grupo-resultados" },
      crearElemento("p", { clase: "titulo-grupo", texto: titulo }),
      ...elementos,
    );
  }

  function mostrarAviso(texto) {
    panel.replaceChildren(crearElemento("p", { clase: "sin-resultados", texto }));
    abrir();
  }

  function mostrar(termino, { artistas, productos }) {
    const total = artistas.length + productos.length;

    if (total === 0) {
      mostrarAviso(`No encontramos nada para “${termino}”.`);
      anuncio.textContent = "Sin resultados";
      return;
    }

    panel.replaceChildren();

    if (artistas.length) {
      const filas = artistas.slice(0, MAXIMO_POR_GRUPO).map((artista) =>
        crearResultadoBuscador({
          imagen: artista.imagen,
          titulo: artista.nombre,
          detalle: artista.genero,
        }),
      );
      panel.append(crearGrupo("Artistas", filas));
    }

    if (productos.length) {
      const filas = productos.slice(0, MAXIMO_POR_GRUPO).map((producto) =>
        crearResultadoBuscador({
          imagen: producto.imagen,
          titulo: producto.titulo,
          detalle: [producto.artista?.nombre, formatearPrecio(producto.precio)]
            .filter(Boolean)
            .join(" · "),
        }),
      );
      panel.append(crearGrupo("Merch", filas));
    }

    panel.append(
      crearElemento("a", {
        clase: "ver-todos",
        texto: total === 1 ? "Ver 1 resultado" : `Ver los ${total} resultados`,
        atributos: { href: urlBusqueda(termino) },
      }),
    );

    anuncio.textContent = textoResultados(total);
    abrir();
  }

  // Cada búsqueda lleva un número; si llega la respuesta de una
  // búsqueda vieja (el usuario siguió escribiendo) se descarta.
  let ultimaBusqueda = 0;
  let temporizador;

  input.addEventListener("input", () => {
    clearTimeout(temporizador);
    const termino = input.value.trim();

    if (!termino) {
      ultimaBusqueda++;
      cerrar();
      return;
    }

    temporizador = setTimeout(async () => {
      const numero = ++ultimaBusqueda;
      try {
        const resultados = await buscar(termino);
        if (numero === ultimaBusqueda) mostrar(termino, resultados);
      } catch (error) {
        console.error(error);
        if (numero === ultimaBusqueda) mostrarAviso("No pudimos buscar en este momento.");
      }
    }, ESPERA_MS);
  });

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const termino = input.value.trim();
    if (termino) location.href = urlBusqueda(termino);
  });

  // Teclado: flechas para moverse entre resultados, Escape para cerrar.
  formulario.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      cerrar();
      input.focus();
      return;
    }

    if (panel.hidden || !["ArrowDown", "ArrowUp"].includes(evento.key)) return;

    const enlaces = [...panel.querySelectorAll("a")];
    if (!enlaces.length) return;
    evento.preventDefault();

    const actual = enlaces.indexOf(document.activeElement);
    if (evento.key === "ArrowDown") {
      enlaces[(actual + 1) % enlaces.length].focus();
    } else if (actual <= 0) {
      input.focus();
    } else {
      enlaces[actual - 1].focus();
    }
  });

  input.addEventListener("focus", () => {
    if (input.value.trim() && panel.childElementCount) abrir();
  });

  // Se cierra cuando el foco o el clic salen del buscador.
  formulario.addEventListener("focusout", (evento) => {
    if (!formulario.contains(evento.relatedTarget)) cerrar();
  });

  document.addEventListener("click", (evento) => {
    if (!formulario.contains(evento.target)) cerrar();
  });

  // Mobile: la lupa abre y cierra el formulario.
  const botonBuscar = document.querySelector(".boton-buscar");
  if (botonBuscar) {
    botonBuscar.setAttribute("aria-expanded", "false");
    botonBuscar.addEventListener("click", (evento) => {
      evento.stopPropagation();
      const abierto = encabezado.classList.toggle("buscador-abierto");
      botonBuscar.setAttribute("aria-expanded", String(abierto));
      if (abierto) input.focus();
    });
  }
}
