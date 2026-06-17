# Carta Victoriana Interactiva

Página web estática e interactiva de una **carta victoriana** que se va abriendo
por capas. Cada clic abre una capa con un dibujo, con un **sonido suave de hoja**.
Incluye: ver cada parte por separado, volver al inicio y deshacer el último clic.

## Funciones

- 🖱️ **Clic para abrir** la carta capa por capa (también botón "Abrir capa" o flecha →).
- 🍃 **Sonido suave de hoja** en cada clic (generado en el navegador, sin archivos de audio). Se puede silenciar.
- 🗂️ **Ver cada parte por separado** desde el índice inferior de miniaturas.
- ⌂ **Volver al inicio** (botón Inicio o tecla Home).
- ↩ **Deshacer** el último clic (botón Deshacer o flecha ←).
- ⟲ **Dar vuelta la carta** para ver el reverso (botón "Dar vuelta" o tecla F).
  Reemplaza `images/reverso.svg` por tu imagen del reverso.

## Cómo poner TUS imágenes

1. Entra en la carpeta `images/`.
2. Reemplaza los archivos de ejemplo por tus dibujos. Puedes usar **JPG, PNG, WEBP o SVG**.
   - Opción fácil: nombra tus archivos igual (`portada`, `parte-1`, …) y listo.
   - Si cambias la extensión (ej. `.jpg`), edita las rutas en `script.js`
     (arreglo `PARTES`, campo `img`).
3. La **primera** entrada del arreglo `PARTES` es la portada (carta cerrada).
4. Para añadir o quitar capas, agrega o borra entradas en `PARTES` dentro de `script.js`.
   También puedes cambiar el `titulo` (índice) y la `leyenda` (texto sobre la imagen).

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
