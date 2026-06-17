# Carta Victoriana Interactiva

Página web estática e interactiva de una **carta victoriana** real (*puzzle purse*)
que se despliega en **3 etapas**, con un **sonido suave de hoja** en cada acción:

1. **Cerrada** → cuadrado pequeño (panel central).
2. **Estrella** → se despliegan 4 solapas interiores formando una estrella de 4 puntas.
3. **Abierta** → se despliegan las 4 esquinas y queda el cuadrado grande y plano con todos los dibujos.

## Funciones

- 🖱️ **Clic para desplegar** paso a paso (primero las 4 puntas, luego las 4 esquinas). También botón "Desplegar" o flecha →. Puedes clicar una solapa abierta para volver a cerrarla.
- 🍃 **Sonido suave de hoja** en cada acción (generado en el navegador, sin archivos de audio). Se puede silenciar.
- 🗂️ **Ver cada parte por separado** desde el índice de miniaturas (abre solo esa solapa; o "Abrir todo").
- ⌂ **Volver al inicio** / cerrar todo (botón Inicio o tecla Home).
- ↩ **Deshacer** la última acción (botón Deshacer o flecha ←).
- ⟲ **Dar vuelta la carta** para ver el reverso (botón "Dar vuelta" o tecla F).

## Cómo poner TUS imágenes

Las imágenes están en `images/`. Puedes usar **JPG, PNG, WEBP o SVG**.
La forma fácil: reemplaza cada archivo manteniendo el mismo nombre.

| Archivo | Qué es |
| --- | --- |
| `centro-cerrado.svg` | Panel central visible cuando la carta está **cerrada** |
| `centro.svg`         | Dibujo **central** que se revela al abrir la estrella |
| `solapa-n/e/s/w.svg` | Las 4 **puntas** de la estrella (interiores) |
| `esq-tl/tr/br/bl.svg`| Las 4 **esquinas** (se despliegan al final) |
| `reverso.svg`        | **Reverso** de la carta (al "dar vuelta") |

Si cambias la extensión (ej. `.jpg`) o los nombres, edita las rutas en el objeto
`CONFIG` al inicio de `script.js`.

## Probar en tu PC

Abre `index.html` con doble clic, o sirve la carpeta con cualquier servidor estático:

```bash
npx serve .
```

## Subir a Vercel

**Opción A — Web (sin instalar nada):**
1. Sube esta carpeta a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → *Add New Project* → importa el repo.
3. Framework Preset: **Other**. No requiere build. → *Deploy*.

**Opción B — CLI:**
```bash
npm i -g vercel
vercel
```
Acepta las opciones por defecto. ¡Es un sitio estático, no necesita build!
