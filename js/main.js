/* =========================================================
   Whiplash — Script principal
   Punto de entrada compartido por todas las páginas.
   Se carga con type="module", así que corre cuando el HTML
   ya está listo y puede importar los componentes comunes.
   ========================================================= */

import { iniciarBuscador } from "./componentes/buscador.js";

iniciarBuscador();
