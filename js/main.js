/* =========================================================
   Whiplash — Script principal
   Punto de entrada compartido por todas las páginas.
   Se carga con type="module", así que corre cuando el HTML
   ya está listo y puede importar los componentes comunes.

   Los componentes se registran primero: al definirlos, las
   etiquetas que ya están en la página se arman en el momento,
   así el buscador encuentra el formulario de <site-header>.
   ========================================================= */

import "./componentes/site-header.js";
import "./componentes/site-footer.js";
import "./componentes/site-breadcrumbs.js";
import "./componentes/promo-banner.js";
import "./componentes/artist-grid.js";
import "./componentes/product-grid.js";
import { iniciarBuscador } from "./componentes/buscador.js";

iniciarBuscador();
