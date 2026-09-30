---
name: crear-pr
description: Crea un Pull Request en GitHub completando la plantilla del proyecto (.github/pull_request_template.md). Usar siempre que el usuario diga que quiere hacer/crear/abrir/subir un PR o pull request.
---

# Crear PR con la plantilla del proyecto

Seguí estos pasos en orden. Todo el texto del PR va en español.

## 1. Revisar el estado del repo

- `git status`, `git branch --show-current`, `git log main..HEAD --oneline` y `git diff main...HEAD --stat`.
- Si estás en `main`: creá una rama nueva con nombre `feature/<descripcion-corta-en-kebab-case>` (según los cambios) antes de seguir. Nunca crear el PR desde `main`.
- Si hay cambios sin commitear: mostralos al usuario y commitealos en la rama (mensaje claro en inglés, como los commits existentes) salvo que el usuario diga lo contrario.
- Si no hay commits nuevos respecto de `main`, avisá y no crees el PR.

## 2. Leer la plantilla

Leé `.github/pull_request_template.md` en el momento (puede haber cambiado) y respetá exactamente sus secciones y su orden.

## 3. Completar cada sección

- **Descripción**: resumen breve de qué se hizo + lista de archivos modificados/agregados (a partir del diff contra `main`), con una línea explicando cada uno.
- **Cómo probarlo**: pasos concretos para que el profesor revise el cambio (ej.: abrir `index.html` en el navegador, qué página visitar, qué probar en mobile/desktop, etc.).
- **Prompt usado y historial con Open Code**: pegá dentro del bloque de código el historial de mensajes con el agente de IA relacionados con estos cambios: los prompts del usuario textuales y un resumen de lo que respondió/hizo el agente en cada paso. Si los cambios se hicieron en otra sesión y no tenés el historial, preguntale al usuario si quiere pegarlo; si no, dejá `(pegar acá)` y avisale.
- **Checklist antes de enviar**: marcá con `[x]` solo lo que sea verdad (rama propia si no es `main`, PR dentro del propio repo si el remote es del usuario, plantilla completa). "Probé que mi código funciona" marcalo solo si se verificó o el usuario lo confirma.
- **Comentarios adicionales**: dudas o aclaraciones relevantes; si no hay, dejar "Ninguno."

## 4. Crear el PR

- `git push -u origin <rama>`.
- Título: corto y descriptivo, en español.
- Escribí el cuerpo en un archivo temporal y creá el PR con:
  `gh pr create --base main --head <rama> --title "<título>" --body-file <archivo>`
- Si `gh` no está instalado o autenticado, indicá cómo resolverlo (`winget install GitHub.cli` y `gh auth login`) y mostrá el título y el cuerpo listos para pegar en GitHub.

## 5. Informar

Devolvé la URL del PR creado y un resumen breve de lo completado.
