# Whiplash

Plataforma de música independiente: descubrir artistas, explorar géneros y comprar merch y entradas.
Proyecto de la materia **Aplicaciones Web Cliente** (ISTEA).

## Cómo verlo

No necesita instalación ni dependencias. Abrí `index.html` en el navegador,
o usá la extensión **Live Server** de VS Code para que se recargue solo al guardar.

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
├── js/                     Estructura preparada para la lógica (todavía sin código)
│   ├── main.js
│   ├── componentes/
│   ├── paginas/
│   └── datos/
├── assets/
│   ├── fuentes/
│   └── img/                iconos/, artistas/, productos/ y logo.svg
└── docs/                   Guía del template y registro de prompts
```

Cada página carga dos hojas de estilo: `css/main.css` (lo compartido) y la suya en `css/paginas/`.

## Convenciones

- **Idioma**: nombres de clases, ids, archivos y carpetas en español, en minúsculas y separados por guiones (`tarjeta-artista`, `migas-de-pan`).
- **Colores, radios, sombras y espaciados**: siempre con las variables de `css/base/tokens.css`, nunca con valores sueltos.
- **Dónde va cada estilo**:
  - Si lo usa una sola página → `css/paginas/<pagina>.css`.
  - Si lo usan dos o más → un archivo en `css/componentes/` importado desde `main.css`.
- **Breakpoint mobile**: `max-width: 768px`.
- **Formato**: el `.editorconfig` define indentación de 2 espacios y UTF-8.

## Documentación

- [Guía para usar el repositorio template](docs/guia-template.md)
- [Registro de prompts del proyecto](docs/predictions.md)
