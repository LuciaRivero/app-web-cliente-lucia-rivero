/* =========================================================
   Whiplash — Capa de datos
   Único lugar que sabe de dónde salen los datos.
   El catálogo (artistas, productos y géneros) se lee de las
   tablas de Supabase (ver supabase/esquema.sql) con la misma
   forma que tenían los JSON locales.
   ========================================================= */

import { fetchTable } from "./supabase.js";

// Raíz del sitio calculada desde este archivo, así las rutas
// funcionan igual desde index.html que desde pages/*.html.
const ROOT = new URL("../../", import.meta.url);

export function getRootPath(path) {
  return new URL(path, ROOT).href;
}

// Se guarda la promesa para no volver a pedir las tablas en cada
// tecla del buscador ni en cada grilla de la misma página.
let cache = null;

function loadData() {
  if (!cache) {
    cache = Promise.all([
      fetchTable("artistas?select=*&order=id"),
      fetchTable("productos?select=*&order=id"),
      fetchTable("generos?select=*&order=id"),
    ]).catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}

export async function getArtists() {
  const [artists] = await loadData();
  return artists;
}

export async function getProducts() {
  const [, products] = await loadData();
  return products;
}

export async function getGenres() {
  const [, , genres] = await loadData();
  return genres;
}

// Solo los géneros que tienen al menos un artista (para los
// chips: elegir uno vacío no mostraría nada).
export async function getGenresWithArtists() {
  const [artists, , genres] = await loadData();
  const used = new Set(artists.map((artist) => artist.genero));
  return genres.filter((genre) => used.has(genre.nombre));
}

// Cada producto se completa con su artista para poder buscar
// por el nombre de la banda y mostrarlo en las tarjetas.
export async function getProductsWithArtist() {
  const [artists, products] = await loadData();
  return products.map((product) => ({
    ...product,
    artist: artists.find((artist) => artist.id === product.artista_id),
  }));
}

// Pasa a minúsculas y saca tildes: "Cráteres" y "crateres" coinciden.
export function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export async function search(term) {
  const query = normalizeText(term);
  if (!query) {
    return { artists: [], products: [] };
  }

  const [artists, products] = await Promise.all([
    getArtists(),
    getProductsWithArtist(),
  ]);
  const matches = (...fields) => fields.some((field) => normalizeText(field).includes(query));

  const foundArtists = artists.filter((artist) =>
    matches(artist.nombre, artist.genero),
  );

  const foundProducts = products.filter((product) =>
    matches(product.titulo, product.tipo, product.artist?.nombre ?? ""),
  );

  return { artists: foundArtists, products: foundProducts };
}
