/* =========================================================
   Whiplash — Capa de datos
   Único lugar que sabe de dónde salen los datos.
   El catálogo (artistas, productos y géneros) se lee de las
   tablas de Supabase (ver supabase/esquema.sql) con la misma
   forma que tenían los JSON locales.
   ========================================================= */

import { pedirTabla } from "./supabase.js";

// Raíz del sitio calculada desde este archivo, así las rutas
// funcionan igual desde index.html que desde pages/*.html.
const RAIZ = new URL("../../", import.meta.url);

export function rutaDesdeRaiz(ruta) {
  return new URL(ruta, RAIZ).href;
}

// Se guarda la promesa para no volver a pedir las tablas en cada
// tecla del buscador ni en cada grilla de la misma página.
let cache = null;

function cargarDatos() {
  if (!cache) {
    cache = Promise.all([
      pedirTabla("artistas?select=*&order=id"),
      pedirTabla("productos?select=*&order=id"),
      pedirTabla("generos?select=*&order=id"),
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
