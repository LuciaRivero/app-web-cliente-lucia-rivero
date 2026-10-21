---
name: crear-pr
description: Crea un Pull Request en GitHub completando la plantilla del proyecto (.github/pull_request_template.md), con el historial de prompts reescrito en formato técnico. Usar siempre que el usuario diga que quiere hacer/crear/abrir/subir un PR o pull request.
---

# Crear PR con la plantilla del proyecto

Seguí estos pasos en orden. Todo el texto del PR va en español.

## 1. Revisar el estado del repo

- `git status`, `git branch --show-current`, `git log main..HEAD --oneline` y `git diff main...HEAD --stat`.
- Si estás en `main`: creá una rama nueva con nombre `feature/<descripcion-corta-en-kebab-case>` (según los cambios) antes de seguir. Nunca crear el PR desde `main`.
- Si no hay commits nuevos respecto de `main` ni cambios sin commitear, avisá y no crees el PR.
- Controlá el flujo del curso (una rama por cambio, predicción primero):
  - El primer commit de la rama tiene que ser solo la entrada en `docs/predictions.md` (`git log main..HEAD --reverse --stat`). Si falta, avisale al usuario antes de seguir: la predicción se escribe al empezar el cambio con el skill `iniciar-cambio`, no al final.
  - Si el diff mezcla cambios independientes, avisale y proponé separarlos en ramas.

## 2. Reescribir los prompts en formato técnico

El historial del PR no lleva los prompts textuales: cada prompt del usuario relacionado con estos cambios se reescribe en formato técnico. El texto original no se incluye, y se dejan afuera los prompts que el usuario pida no sumar.

### Cómo reescribir cada prompt

- Mantené la intención del usuario: no agregues pedidos que no hizo ni quites los que sí hizo. Las decisiones que tomó durante la sesión (respuestas a preguntas, correcciones, aprobaciones de planes) se incorporan al prompt que corresponda.
- Usá vocabulario técnico concreto: nombres de archivos, componentes, APIs del navegador (`customElements`, `matchMedia`, `fetch`...), atributos ARIA, propiedades CSS.
- Corregí ortografía y redacción; escribí en infinitivo o imperativo, sin muletillas ("quiero", "me gustaría").
- Los mensajes que solo confirman ("sí", "dale") no son prompts propios: su contenido se suma al prompt anterior.

Formato de cada prompt dentro del bloque de código del PR:

```
### Prompt N — <título corto>
Objetivo: <qué se busca lograr, en una o dos oraciones>
Alcance: <páginas, archivos o componentes afectados>
Restricciones: <tecnologías permitidas, convenciones, lo que queda afuera>
Criterios de aceptación: <cómo se verifica que está bien>
Resultado del agente: <qué hizo el agente, archivos creados/modificados y cómo lo verificó>
```

Ejemplo (prompt original: "agrega un spinner para la carga para que se vea mas fluida"):

```
### Prompt 1 — Indicador de carga en grillas
Objetivo: Mostrar un indicador de carga mientras se obtienen los datos JSON y suavizar la entrada del contenido.
Alcance: DataGrid (artist-grid, product-grid, genre-chips) y la búsqueda de Explorar.
Restricciones: JS vanilla, HTML y CSS, sin librerías; respetar prefers-reduced-motion.
Criterios de aceptación: el indicador se ve solo si la carga tarda; las tarjetas entran con animación escalonada; sin errores en consola.
Resultado del agente: creó css/componentes/cargando.css y crearCargando() en js/utilidades/dom.js; DataGrid muestra el indicador y aplica aria-busy. Verificado en Edge reteniendo los JSON.
```

Si los cambios se hicieron en otra sesión y no tenés el historial, preguntale al usuario si quiere pegarlo para reescribirlo; si no, dejá `(pegar acá)` y avisale.

### Confirmar con el usuario

Mostrale el historial reescrito antes de seguir y esperá su confirmación o correcciones. Es su registro de trabajo para el profesor.

## 3. Commitear

- Si hay cambios sin commitear: mostralos al usuario y commitealos en la rama (mensaje claro en inglés, como los commits existentes) salvo que el usuario diga lo contrario.

## 4. Leer la plantilla

Leé `.github/pull_request_template.md` en el momento (puede haber cambiado) y respetá exactamente sus secciones y su orden.

## 5. Completar cada sección

- **Descripción**: resumen breve de qué se hizo + lista de archivos modificados/agregados (a partir del diff contra `main`), con una línea explicando cada uno.
- **Cómo probarlo**: pasos concretos para que el profesor revise el cambio (ej.: abrir `index.html` con Live Server, qué página visitar, qué probar en mobile/desktop, etc.).
- **Prompt usado y historial con Open Code**: pegá dentro del bloque de código el historial reescrito y confirmado en el paso 2.
- **Checklist antes de enviar**: marcá con `[x]` solo lo que sea verdad (rama propia si no es `main`, PR dentro del propio repo si el remote es del usuario, plantilla completa). "Probé que mi código funciona" marcalo solo si se verificó o el usuario lo confirma.
- **Comentarios adicionales**: dudas o aclaraciones relevantes; si no hay, dejar "Ninguno."

## 6. Crear el PR

- `git push -u origin <rama>`.
- Título: corto y descriptivo, en español.
- Escribí el cuerpo en un archivo temporal y creá el PR con:
  `gh pr create --base main --head <rama> --title "<título>" --body-file <archivo>`
- Si `gh` no está instalado o autenticado, indicá cómo resolverlo (`winget install GitHub.cli` y `gh auth login`) y mostrá el título y el cuerpo listos para pegar en GitHub.

## 7. Informar

Devolvé la URL del PR creado y un resumen breve de lo completado.
