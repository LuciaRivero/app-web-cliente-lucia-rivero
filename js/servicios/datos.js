/* =========================================================
   Whiplash — Capa de datos
   Único lugar que sabe de dónde salen los datos.
   Por ahora lee los JSON locales de js/datos/; para pasar a
   Supabase alcanza con reescribir cargarDatos() manteniendo
   la misma forma de los objetos.
   ========================================================= */

// Raíz del sitio calculada desde este archivo, así las rutas
// funcionan igual desde index.html que desde pages/*.html.
const RAIZ = new URL("../../", import.meta.url);

export function rutaDesdeRaiz(ruta) {
  return new URL(ruta, RAIZ).href;
}

async function leerJson(ruta) {
  const respuesta = await fetch(new URL(ruta, import.meta.url));
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer ${ruta} (${respuesta.status})`);
  }
  return respuesta.json();
}

// Se guarda la promesa para no volver a pedir los archivos en cada
// tecla del buscador ni en cada grilla de la misma página.
let cache = null;

function cargarDatos() {
  if (!cache) {
    cache = Promise.all([
      leerJson("../datos/artistas.json"),
      leerJson("../datos/productos.json"),
      leerJson("../datos/generos.json"),
    ]).catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}

export async function obtenerArtistas() {
  const [artistas] = await cargarDatos();
  return artistas;
}

export async function obtenerProductos() {
  const [, productos] = await cargarDatos();
  return productos;
}

export async function obtenerGeneros() {
  const [, , generos] = await cargarDatos();
  return generos;
}

// Cada producto se completa con su artista para poder buscar
// por el nombre de la banda y mostrarlo en las tarjetas.
export async function obtenerProductosConArtista() {
  const [artistas, productos] = await cargarDatos();
  return productos.map((producto) => ({
    ...producto,
    artista: artistas.find((artista) => artista.id === producto.artista_id),
  }));
}

// Pasa a minúsculas y saca tildes: "Cráteres" y "crateres" coinciden.
export function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export async function buscar(termino) {
  const consulta = normalizar(termino);
  if (!consulta) {
    return { artistas: [], productos: [] };
  }

  const [artistas, productos] = await Promise.all([
    obtenerArtistas(),
    obtenerProductosConArtista(),
  ]);
  const coincide = (...campos) => campos.some((campo) => normalizar(campo).includes(consulta));

  const artistasEncontrados = artistas.filter((artista) =>
    coincide(artista.nombre, artista.genero),
  );

  const productosEncontrados = productos.filter((producto) =>
    coincide(producto.titulo, producto.tipo, producto.artista?.nombre ?? ""),
  );

  return { artistas: artistasEncontrados, productos: productosEncontrados };
}
