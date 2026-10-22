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

12. **Flujo de predicción por rama** — Agregar un skill que, al iniciar cada cambio, cree la rama y commitee primero la predicción en docs/predictions.md, y adaptar crear-pr para verificarlo. Alcance: .claude/skills/iniciar-cambio, .claude/skills/crear-pr. Restricciones: un cambio por rama, predicción antes del código, formato técnico.

13. **Carrito funcional conectado a Merch** — Persistir el carrito en localStorage, hacer que "Agregar al carrito" guarde el producto con su opción (formato, talle) o cantidad, y renderizar la página Carrito desde ese estado con controles para sumar, restar y eliminar ítems, recalculando precios, subtotal y total. Alcance: js/servicios/carrito.js, js/componentes/tarjetas.js, `<product-grid with-purchase>` en pages/merch.html, pages/carrito.html, js/paginas/carrito.js, css/paginas/carrito.css. Restricciones: JS vanilla, cantidad entre 1 y 10, estado vacío, accesos a localStorage protegidos con try/catch, anuncios con `aria-live`.

14. **Ingreso, registro y edición de cuenta funcionales** — Separar el ingreso y el registro en páginas distintas y darles funcionalidad: sin sesión, la página Mi cuenta muestra el formulario de ingreso con un enlace a la página de registro; con sesión, muestra un formulario para editar los datos del usuario. Alcance: js/servicios/sesion.js, pages/cuenta.html (nueva), pages/registro.html, js/paginas/cuenta.js, js/paginas/registro.js, ACCOUNT_NAV en js/componentes/navigation.js, css/paginas/cuenta.css. Restricciones: JS vanilla sin backend, usuarios y sesión en localStorage con accesos protegidos con try/catch, validación de email único, contraseña de al menos 8 caracteres y coincidencia de contraseñas, mensajes de error y confirmación con `aria-live`.

15. **Menú desplegable de usuario en el encabezado** — Reemplazar el ícono de usuario de `<site-header>` por un avatar que, con sesión iniciada, abra un menú desplegable con el avatar, el nombre y el email del usuario y las opciones Mi perfil (pages/cuenta.html), Ayuda (pages/ayuda.html) y Cerrar sesión; el avatar muestra la imagen del usuario si tiene una y, si no, sus iniciales. Sin sesión, el ícono sigue llevando a pages/cuenta.html. Alcance: js/componentes/site-header.js, js/componentes/menu-usuario.js (nuevo), ACCOUNT_NAV en js/componentes/navigation.js, js/servicios/sesion.js, íconos en assets/img/iconos/iconos.svg, css/layout/encabezado.css. Restricciones: JS vanilla, botón con `aria-expanded` y `aria-controls`, cierre con Escape y clic afuera devolviendo el foco, sin opción Apariencia.

16. **Seguir, quitar y compartir artistas** — Guardar por usuario los artistas seguidos y mostrar la pestaña Mis artistas solo con sesión iniciada: el botón "Seguir" de las tarjetas y del perfil alterna entre seguir y dejar de seguir (sin sesión lleva a pages/cuenta.html), la página Mis artistas se arma desde esa lista con "Quitar" funcional y estado vacío, y "Compartir" del perfil usa la Web Share API con copia al portapapeles como alternativa. Alcance: js/servicios/artistas-seguidos.js (nuevo), MAIN_NAV en js/componentes/navigation.js, js/componentes/site-header.js, js/componentes/tarjetas.js, pages/artistas.html, js/paginas/artistas.js (nuevo), pages/producto.html, js/paginas/producto.js (nuevo), css/paginas/artistas.css, css/paginas/producto.css. Restricciones: JS vanilla, accesos a localStorage protegidos con try/catch, `aria-pressed` en "Seguir", anuncios con `aria-live`, pages/artistas.html redirige a Mi cuenta sin sesión.

17. **Contador del carrito en el encabezado** — Mostrar sobre el ícono del carrito de `<site-header>` una insignia con la cantidad total de unidades en el carrito, que se actualice al agregar, cambiar o eliminar productos sin recargar la página. Alcance: js/servicios/carrito.js (evento de cambio), js/componentes/site-header.js, css/layout/encabezado.css. Restricciones: JS vanilla, la insignia se oculta con el carrito vacío, `aria-label` del enlace con la cantidad, sincronización entre pestañas con el evento `storage`, animación breve al sumar respetando `prefers-reduced-motion`.

18. **Menú lateral en mobile** — Convertir el menú hamburguesa mobile en un panel lateral (off-canvas) que entre de izquierda a derecha sin ocupar todo el ancho, con fondo claro, botón de cierre y fondo oscurecido sobre el resto de la página, que contenga las opciones de `.nav-principal` y un enlace al Carrito con su contador. Alcance: js/componentes/menu.js, js/componentes/site-header.js, css/layout/encabezado.css. Restricciones: JS vanilla, solo en mobile (el menú de escritorio no cambia), `aria-expanded` en el botón, foco atrapado dentro del panel mientras está abierto, cierre con Escape, con el botón de cierre y con clic en el fondo devolviendo el foco, bloqueo del scroll de la página, transición desactivada con `prefers-reduced-motion`.
