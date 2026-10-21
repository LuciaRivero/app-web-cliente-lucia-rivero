---
name: iniciar-cambio
description: Arranca un cambio nuevo en el proyecto siguiendo el flujo del curso: una rama por cambio y, antes de tocar código, un primer commit que solo agrega la predicción en docs/predictions.md. Usar siempre que el usuario pida un cambio nuevo (pantalla, funcionalidad, refactor, estilo, fix) y todavía no exista la rama con su predicción.
---

# Iniciar un cambio: rama + predicción

En este proyecto cada cambio vive en su propia rama y su **primer commit** es la predicción: una entrada en `docs/predictions.md` que dice qué se va a hacer, escrita **antes** de tocar código. Seguí estos pasos en orden y no edites código hasta terminar el paso 5.

## 1. Revisar el estado del repo

- `git status` y `git branch --show-current`.
- Si hay cambios sin commitear, mostralos y preguntá qué hacer con ellos antes de cambiar de rama. Nunca los descartes.

## 2. Un cambio por rama

- Si el pedido incluye varios cambios independientes (por ejemplo, "agregá un spinner y arreglá el menú"), proponé una rama y una predicción para cada uno, y empezá por el primero que elija el usuario.
- Si el cambio depende de otra rama que todavía no se mergeó, la rama nueva sale de esa (avisale al usuario que los PRs se mergean en orden). Si no, sale de `main` actualizado: `git checkout main` y `git pull origin main`.

## 3. Crear la rama

`git checkout -b feature/<descripcion-corta-en-kebab-case>`, en español, según el cambio (ej.: `feature/menu-hamburguesa-mobile`).

## 4. Escribir la predicción en formato técnico

Reescribí el pedido del usuario en formato técnico, sin copiar el texto original:

- Mantené su intención: no agregues pedidos que no hizo ni quites los que sí hizo.
- Usá vocabulario técnico concreto: archivos, componentes, APIs del navegador, atributos ARIA, propiedades CSS.
- Corregí ortografía y redacción; usá infinitivo, sin muletillas ("quiero", "me gustaría").

Leé `docs/predictions.md` en el momento, continuá la numeración y agregá al final una entrada con este formato (dejá una línea en blanco entre entradas y respetá los saltos de línea CRLF del archivo):

```
N. **<Título corto>** — <Objetivo en una oración>. Alcance: <archivos o componentes>. Restricciones: <las principales>.
```

Mostrale la entrada al usuario y esperá su confirmación o correcciones antes de commitear.

## 5. Commitear solo la predicción

- `git add docs/predictions.md` (ningún otro archivo).
- Mensaje en inglés, como los existentes: `Add prediction for <cambio>`.
- `git log --oneline -1` para confirmar.

## 6. Recién ahora, implementar

Con la predicción commiteada, empezá el cambio en la misma rama. Si mientras trabajás el usuario pide algo que no entra en esta predicción, proponé dejarlo para una rama nueva. Al terminar, el PR se crea con el skill `crear-pr`.
