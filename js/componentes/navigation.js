/* =========================================================
   Whiplash — Links del sitio
   Único lugar donde se declaran los menús. Los usan
   <site-header>, <site-footer> y <site-breadcrumbs>.
   Las rutas son desde la raíz del sitio: los componentes
   las resuelven con rutaDesdeRaiz().

   El `id` es el valor del atributo current de <site-header>
   que marca el link activo con aria-current="page".
   ========================================================= */

export const HOME = { texto: "Inicio", ruta: "index.html" };

export const MAIN_NAV = [
  { id: "artistas", texto: "Mis artistas", ruta: "pages/artistas.html" },
  { id: "explorar", texto: "Explorar", ruta: "pages/explorar.html" },
  { id: "generos", texto: "Géneros", ruta: "pages/generos.html" },
  { id: "merch", texto: "Merch", ruta: "pages/merch.html" },
  { id: "novedades", texto: "Novedades", ruta: "pages/novedades.html" },
];

export const ACCOUNT_NAV = [
  {
    id: "cuenta",
    texto: "Mi cuenta",
    ruta: "pages/cuenta.html",
    clase: "ir-cuenta",
    icono: "usuario",
  },
  {
    id: "carrito",
    texto: "Carrito",
    ruta: "pages/carrito.html",
    clase: "ir-carrito",
    icono: "carrito",
  },
];

export const FOOTER_NAV = [
  { texto: "Trabajá con nosotros", ruta: "pages/nosotros.html" },
  { texto: "Contacto", ruta: "pages/contacto.html" },
  { texto: "Ayuda", ruta: "pages/ayuda.html" },
  { texto: "Términos y condiciones", ruta: "pages/terminos.html" },
];
