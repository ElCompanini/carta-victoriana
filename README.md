# Carta Victoriana Interactiva

Página web estática e interactiva de una **carta victoriana** estilo *puzzle purse*:
un cuadrado con **4 solapas triangulares** dobladas al centro que se van
desplegando hacia afuera para revelar el dibujo interior, con un **sonido suave
de hoja** en cada acción.

## Funciones

- 🖱️ **Clic para desplegar** las solapas una a una (también botón "Desplegar solapa" o flecha →). También puedes clicar directamente una solapa para abrirla o cerrarla.
- 🍃 **Sonido suave de hoja** en cada acción (generado en el navegador, sin archivos de audio). Se puede silenciar.
- 🗂️ **Ver cada parte por separado** desde el índice de miniaturas (abre solo esa solapa; o "Interior" para abrirlas todas).
- ⌂ **Volver al inicio** / cerrar todo (botón Inicio o tecla Home).
- ↩ **Deshacer** la última acción (botón Deshacer o flecha ←).
- ⟲ **Dar vuelta la carta** para ver el reverso (botón "Dar vuelta" o tecla F).

## Cómo poner TUS imágenes

Las imágenes están en `images/`. Puedes usar **JPG, PNG, WEBP o SVG**.
La forma fácil: reemplaza cada archivo manteniendo el mismo nombre.

| Archivo | Qué es |
| --- | --- |
| `centro.svg`   | Dibujo del **interior** (se revela al abrir las solapas) |
| `solapa-n.svg` | Cara visible de la solapa **Norte** (arriba) |
| `solapa-e.svg` | Cara visible de la solapa **Este** (derecha) |
| `solapa-s.svg` | Cara visible de la solapa **Sur** (abajo) |
| `solapa-w.svg` | Cara visible de la solapa **Oeste** (izquierda) |
| `reverso.svg`  | **Reverso** de la carta (al "dar vuelta") |

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
