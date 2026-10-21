1. Quiero hacer la estructura base de mi index.html con un encabezado, filtro de categorias, catalogo cetral y footer.

2. Quiero crear la pagina de detalle del producto donde se puedan ver especificaciones del mismo

3. Quiero crear pantalla de carrito.

4. Voy agregar formulario de contacto.

5. Voy a agregar las pantallas que me faltan desarrollar como mi cuenta, Explorar, Géneros, Merch, Novedades

6. Voy a adaptar a mobile el header y el menu hambuguesa.

7. Voy a reorganizar la estructura del proyecto (carpetas, CSS por capas, nombres en español y tokens) para que sea más mantenible y escalable.

8. Voy a darle funcionalidad al buscador

9. **Componentización con Web Components** — Convertir encabezado, pie, migas de pan, promo y grillas repetidas en Custom Elements renderizados desde JSON. Alcance: 14 páginas, js/componentes/, js/utilidades/dom.js. Restricciones: JS vanilla sin librerías, componentes en inglés.

10. **Optimización de géneros, íconos, precarga y menú mobile** — Generar los chips de género desde generos.json, unificar el ícono del carrito en un sprite SVG, precargar fuentes y módulos y hacer funcional el menú hamburguesa. Alcance: `<genre-chips>`, iconos.svg, `<head>` de las páginas, menu.js. Restricciones: JS vanilla, accesibilidad ARIA.

11. **Indicador de carga y selector de compra** — Mostrar un disco de carga mientras llegan los datos y reemplazar los `<select>` de compra por pastillas y un selector de cantidad. Alcance: DataGrid, Explorar, tarjetas de merch con compra. Restricciones: JS vanilla, prefers-reduced-motion.
