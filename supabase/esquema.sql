-- =========================================================
-- Whiplash — Esquema de Supabase
-- Ejecutar completo en el SQL Editor del proyecto. Se puede
-- volver a ejecutar: crea lo que falta y actualiza los datos.
--
-- - generos, artistas y productos: el catálogo del sitio.
--   Lectura pública, nadie lo modifica desde el navegador.
-- - seguidos y carrito_items: datos de cada usuario de
--   Supabase Auth. Cada uno ve y edita solo sus filas (RLS).
-- =========================================================

-- ---------- Tablas ----------

create table if not exists public.generos (
  id bigint primary key,
  nombre text not null unique
);

create table if not exists public.artistas (
  id bigint primary key,
  nombre text not null,
  genero text not null,
  imagen text not null,
  bio text,
  -- [{ "titulo": "Ruido blanco", "duracion": "3:24" }, ...]
  tracks jsonb not null default '[]'::jsonb
);

create table if not exists public.productos (
  id bigint primary key,
  titulo text not null,
  tipo text not null,
  precio integer not null check (precio >= 0),
  artista_id bigint not null references public.artistas (id),
  imagen text not null
);

create table if not exists public.seguidos (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  artista_id bigint not null references public.artistas (id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (user_id, artista_id)
);

-- opcion vacía ('') = producto sin opciones (por ejemplo, entradas).
create table if not exists public.carrito_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  producto_id bigint not null references public.productos (id) on delete cascade,
  opcion text not null default '',
  cantidad integer not null check (cantidad between 1 and 10),
  creado_en timestamptz not null default now(),
  primary key (user_id, producto_id, opcion)
);

-- ---------- Seguridad (RLS) ----------

alter table public.generos enable row level security;
alter table public.artistas enable row level security;
alter table public.productos enable row level security;
alter table public.seguidos enable row level security;
alter table public.carrito_items enable row level security;

grant select on public.generos, public.artistas, public.productos to anon, authenticated;
grant select, insert, delete on public.seguidos to authenticated;
grant select, insert, update, delete on public.carrito_items to authenticated;

drop policy if exists "Catálogo público" on public.generos;
create policy "Catálogo público" on public.generos
  for select to anon, authenticated using (true);

drop policy if exists "Catálogo público" on public.artistas;
create policy "Catálogo público" on public.artistas
  for select to anon, authenticated using (true);

drop policy if exists "Catálogo público" on public.productos;
create policy "Catálogo público" on public.productos
  for select to anon, authenticated using (true);

drop policy if exists "Cada usuario ve sus seguidos" on public.seguidos;
create policy "Cada usuario ve sus seguidos" on public.seguidos
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Cada usuario sigue artistas" on public.seguidos;
create policy "Cada usuario sigue artistas" on public.seguidos
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Cada usuario deja de seguir" on public.seguidos;
create policy "Cada usuario deja de seguir" on public.seguidos
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Cada usuario maneja su carrito" on public.carrito_items;
create policy "Cada usuario maneja su carrito" on public.carrito_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------- Datos del catálogo ----------

insert into public.generos (id, nombre) values
  (1, 'Rock independiente'),
  (2, 'Folk indie'),
  (3, 'Electrónica cruda'),
  (4, 'Pop alternativo'),
  (5, 'Punk DIY'),
  (6, 'Hip-hop under')
on conflict (id) do update set nombre = excluded.nombre;

insert into public.artistas (id, nombre, genero, imagen, bio, tracks) values
  (1, 'Los Cráteres', 'Rock independiente', 'assets/img/artistas/artista1.jpg',
   'Banda de rock indie con guitarras crudas y letras que hablan de la ciudad. Desde su primer demo autoeditado, construyeron su propio camino sin intermediarios.',
   '[{"titulo": "Ruido blanco", "duracion": "3:24"}, {"titulo": "Andén", "duracion": "4:01"}, {"titulo": "Enero", "duracion": "3:47"}]'::jsonb),
  (2, 'Marea Onda', 'Folk indie', 'assets/img/artistas/artista2.jpg',
   'Dúo de folk indie que graba en casa, con guitarras acústicas, armonías de dos voces y canciones sobre el mar y los viajes cortos.',
   '[{"titulo": "Bajamar", "duracion": "3:58"}, {"titulo": "Faro apagado", "duracion": "4:12"}, {"titulo": "Sal en la piel", "duracion": "3:31"}]'::jsonb),
  (3, 'Valle Silente', 'Electrónica cruda', 'assets/img/artistas/artista3.jpg',
   'Proyecto de electrónica cruda nacido en un sótano: sintetizadores analógicos, cajas de ritmos gastadas y paisajes que suenan mejor de noche.',
   '[{"titulo": "Estática", "duracion": "5:06"}, {"titulo": "Llanura", "duracion": "4:44"}, {"titulo": "Señal débil", "duracion": "6:02"}]'::jsonb),
  (4, 'Tejido Rojo', 'Pop alternativo', 'assets/img/artistas/artista4.jpg',
   'Banda de pop alternativo con estribillos pegadizos y letras melancólicas. Tocan en centros culturales y editan todo de forma independiente.',
   '[{"titulo": "Hilo suelto", "duracion": "3:18"}, {"titulo": "Carmín", "duracion": "3:42"}, {"titulo": "Telar", "duracion": "4:05"}]'::jsonb),
  (5, 'Risa Cósmica', 'Punk DIY', 'assets/img/artistas/artista2.jpg',
   'Punk DIY rápido y directo, grabado en vivo en una sola toma. Canciones cortas, mucho volumen y fechas en cada rincón del conurbano.',
   '[{"titulo": "Risa nerviosa", "duracion": "1:58"}, {"titulo": "Fotocopia", "duracion": "2:21"}, {"titulo": "Ruido de fondo", "duracion": "2:07"}]'::jsonb),
  (6, 'Norte Adentro', 'Hip-hop under', 'assets/img/artistas/artista3.jpg',
   'Crew de hip-hop under del norte del país: rimas sobre el barrio, beats hechos con samples de discos viejos y producción propia.',
   '[{"titulo": "Tierra adentro", "duracion": "3:36"}, {"titulo": "Ruta 9", "duracion": "3:52"}, {"titulo": "Siesta", "duracion": "3:14"}]'::jsonb)
on conflict (id) do update set
  nombre = excluded.nombre, genero = excluded.genero, imagen = excluded.imagen,
  bio = excluded.bio, tracks = excluded.tracks;

insert into public.productos (id, titulo, tipo, precio, artista_id, imagen) values
  (1, 'Ruido blanco (EP)', 'Disco', 12000, 1, 'assets/img/productos/disco1.jpg'),
  (2, 'Andén (LP)', 'Disco', 15000, 1, 'assets/img/productos/disco2.jpg'),
  (3, 'Show en Vorterix', 'Entrada', 25000, 1, 'assets/img/productos/entrada1.jpg'),
  (4, 'Marea Onda (EP)', 'Disco', 10000, 2, 'assets/img/productos/disco3.jpg'),
  (5, 'Caminos (LP)', 'Disco', 10000, 3, 'assets/img/productos/disco4.jpg'),
  (6, 'Remera "Andén"', 'Remera', 9500, 1, 'assets/img/productos/disco1.jpg'),
  (7, 'Show en Niceto', 'Entrada', 18000, 2, 'assets/img/productos/disco3.jpg')
on conflict (id) do update set
  titulo = excluded.titulo, tipo = excluded.tipo, precio = excluded.precio,
  artista_id = excluded.artista_id, imagen = excluded.imagen;
