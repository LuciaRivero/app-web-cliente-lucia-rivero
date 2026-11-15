/* =========================================================
   Whiplash — Links del sitio
   Único lugar donde se declaran los menús. Los usan
   <site-header>, <site-footer> y <site-breadcrumbs>.
   Las rutas son desde la raíz del sitio: los componentes
   las resuelven con getRootPath().

   El `id` es el valor del atributo current de <site-header>
   que marca el link activo con aria-current="page".
   `signedInOnly` oculta el link si no hay sesión iniciada.
   ========================================================= */

export const HOME = { text: "Inicio", path: "index.html" };

export const MAIN_NAV = [
  { id: "artistas", text: "Mis artistas", path: "pages/artistas.html", signedInOnly: true },
  { id: "explorar", text: "Explorar", path: "pages/explorar.html" },
  { id: "generos", text: "Géneros", path: "pages/generos.html" },
  { id: "merch", text: "Merch", path: "pages/merch.html" },
  { id: "novedades", text: "Novedades", path: "pages/novedades.html" },
];

export const ACCOUNT_NAV = [
  {
    id: "carrito",
    text: "Carrito",
    path: "pages/carrito.html",
    className: "ir-carrito",
    icon: "carrito",
  },
  {
    id: "cuenta",
    text: "Mi cuenta",
    path: "pages/cuenta.html",
    className: "ir-cuenta",
    icon: "usuario",
  },
];

export const FOOTER_NAV = [
  { text: "Trabajá con nosotros", path: "pages/nosotros.html" },
  { text: "Contacto", path: "pages/contacto.html" },
  { text: "Ayuda", path: "pages/ayuda.html" },
  { text: "Términos y condiciones", path: "pages/terminos.html" },
];
