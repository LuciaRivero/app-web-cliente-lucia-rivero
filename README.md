# Whiplash

Plataforma de música independiente: descubrir artistas, explorar géneros y comprar merch y entradas.
Proyecto de la materia **Aplicaciones Web Cliente** (ISTEA).

## Cómo verlo

No necesita instalación ni dependencias, pero sí un servidor local: el JS se carga como
módulo y lee los datos con `fetch`, y el navegador bloquea las dos cosas si abrís el
archivo con doble clic (`file://`). Usá la extensión **Live Server** de VS Code
(clic derecho en `index.html` → *Open with Live Server*).

## Estructura

```
├── index.html              Página de inicio
├── 404.html                Página no encontrada (GitHub Pages la muestra sola)
├── pages/                  Resto de las páginas (carrito, merch, contacto, ...)
├── css/
│   ├── main.css            Punto de entrada: importa base, layout y componentes
│   ├── base/               Fuentes, tokens, reset, estilos de elementos y utilidades
│   ├── layout/             Encabezado, contenido, migas de pan y pie
│   ├── componentes/        Piezas reutilizables (botón, filtros, tarjetas, formularios)
│   └── paginas/            Estilos propios de cada página
├── js/
│   ├── main.js             Punto de entrada: registra los componentes e inicia el buscador
│   ├── componentes/        Web Components (site-header, product-grid, ...), tarjetas, buscador, menú
│   ├── paginas/            Lógica propia de cada página (explorar, carrito)
│   ├── servicios/          datos.js: único lugar que lee los datos (hoy JSON, después Supabase)
│   ├── utilidades/         dom.js: ayudas para armar elementos
│   └── datos/              artistas.json, productos.json y generos.json
├── assets/
│   ├── fuentes/
│   └── img/                iconos/, artistas/, productos/ y logo.svg
└── docs/                   Guía del template y registro de prompts
```

Cada página carga dos hojas de estilo: `css/main.css` (lo compartido) y la suya en `css/paginas/`.

## Componentes

Las piezas que se repiten entre páginas son Web Components nativos (`customElements`, sin
librerías) que se registran desde `js/main.js`. Se arman en light DOM, así que usan los
mismos estilos de `css/` que el HTML escrito a mano.

| Etiqueta | Qué arma | Atributos |
|---|---|---|
| `<site-header>` | Encabezado con buscador y menús | `current`: id del link activo (`merch`, `cuenta`, ...) |
| `<site-footer>` | Pie del sitio | — |
| `<site-breadcrumbs>` | Migas de pan (agrega "Inicio" solo) | Hijos: `<a>` por cada paso y `<span>` para la página actual |
| `<promo-banner>` | Banner `.promo` | `heading`, `text`, `href`, `link-text` |
| `<artist-grid>` | Grilla de artistas desde `artistas.json` | `limit` |
| `<product-grid>` | Grilla de merch desde `productos.json` | `limit`, `artist` (id), `with-purchase` |
| `<genre-chips>` | Chips de género desde `generos.json` (enlazan a Explorar con `?q=`) | `limit`, `filter` (botones que disparan el evento `genre-change`) |

```html
<site-header current="merch"></site-header>
<main id="contenido-principal">
  <site-breadcrumbs><span>Merch</span></site-breadcrumbs>
  <product-grid limit="6"></product-grid>
</main>
<site-footer></site-footer>
```

Los links del encabezado y el pie se editan en un solo lugar: `js/componentes/navigation.js`.

Mientras llegan los datos, las grillas y los chips muestran un disco girando (`css/componentes/cargando.css`)
y después las tarjetas entran con un fundido escalonado. Con `prefers-reduced-motion` no hay animaciones.

Los íconos SVG que se repiten viven en `assets/img/iconos/iconos.svg` y se usan con
`<use href=".../iconos.svg#id" />`.

## Convenciones

- **Idioma**: nombres de clases, ids, archivos y carpetas en español, en minúsculas y separados por guiones (`tarjeta-artista`, `migas-de-pan`).
  Excepción: los Web Components (etiqueta, clase JS, archivo y atributos) van en inglés (`<product-grid>`, `site-header.js`).
- **Colores, radios, sombras y espaciados**: siempre con las variables de `css/base/tokens.css`, nunca con valores sueltos.
- **Dónde va cada estilo**:
  - Si lo usa una sola página → `css/paginas/<pagina>.css`.
  - Si lo usan dos o más → un archivo en `css/componentes/` importado desde `main.css`.
- **Breakpoint mobile**: `max-width: 768px`.
- **Formato**: el `.editorconfig` define indentación de 2 espacios y UTF-8.

## Documentación

- [Guía para usar el repositorio template](docs/guia-template.md)
- [Registro de prompts del proyecto](docs/predictions.md)
