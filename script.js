/* ============================================================
   CARTA VICTORIANA INTERACTIVA  ·  "puzzle purse" de 3 etapas
   ------------------------------------------------------------
   Etapas (como las cartas reales):
     1. CERRADA      → cuadrado central pequeño (panel "love").
     2. ESTRELLA     → se despliegan las 4 solapas interiores
                       (las puntas: sol, luna, etc.).
     3. ABIERTA      → se despliegan las 4 esquinas y queda el
                       cuadrado grande y plano con todos los dibujos.

   Mecánica: cada solapa va doblada hacia el centro (oculta) y al
   abrirse gira 180° hasta quedar plana mostrando su dibujo.

   Para personalizar, reemplaza las imágenes de /images (mismo
   nombre) o cambia las rutas en CONFIG. Sirve JPG, PNG, WEBP, SVG.
   ============================================================ */
const CONFIG = {
  centroCerrado: "images/centro-cerrado.svg", // panel central con la carta cerrada
  centroAbierto: "images/centro.svg",         // dibujo central revelado (abierta)
  reverso: "images/reverso.svg",              // al "dar vuelta"

  // 8 solapas: 4 interiores (estrella) + 4 esquinas. El orden define
  // qué abre el botón "Desplegar" (primero la estrella, luego las esquinas).
  flaps: [
    // --- Interiores: forman la ESTRELLA ---
    { id: "in-n", capa: "in", nombre: "Punta Norte", cover: "images/solapa-n.svg",
      clip: "polygon(50% 0, 75% 25%, 25% 25%)", origin: "50% 25%", fold: "rotate3d(1,0,0,180deg)" },
    { id: "in-e", capa: "in", nombre: "Punta Este", cover: "images/solapa-e.svg",
      clip: "polygon(100% 50%, 75% 25%, 75% 75%)", origin: "75% 50%", fold: "rotate3d(0,1,0,180deg)" },
    { id: "in-s", capa: "in", nombre: "Punta Sur", cover: "images/solapa-s.svg",
      clip: "polygon(50% 100%, 75% 75%, 25% 75%)", origin: "50% 75%", fold: "rotate3d(1,0,0,180deg)" },
    { id: "in-w", capa: "in", nombre: "Punta Oeste", cover: "images/solapa-w.svg",
      clip: "polygon(0 50%, 25% 25%, 25% 75%)", origin: "25% 50%", fold: "rotate3d(0,1,0,180deg)" },
    // --- Esquinas: completan el CUADRADO ---
    { id: "out-tl", capa: "out", nombre: "Esquina sup. izq.", cover: "images/esq-tl.svg",
      clip: "polygon(0 0, 50% 0, 0 50%)", origin: "25% 25%", fold: "rotate3d(-1,1,0,180deg)" },
    { id: "out-tr", capa: "out", nombre: "Esquina sup. der.", cover: "images/esq-tr.svg",
      clip: "polygon(100% 0, 50% 0, 100% 50%)", origin: "75% 25%", fold: "rotate3d(1,1,0,180deg)" },
    { id: "out-br", capa: "out", nombre: "Esquina inf. der.", cover: "images/esq-br.svg",
      clip: "polygon(100% 100%, 100% 50%, 50% 100%)", origin: "75% 75%", fold: "rotate3d(-1,1,0,180deg)" },
    { id: "out-bl", capa: "out", nombre: "Esquina inf. izq.", cover: "images/esq-bl.svg",
      clip: "polygon(0 100%, 0 50%, 50% 100%)", origin: "25% 75%", fold: "rotate3d(1,1,0,180deg)" },
  ],
};

const ORDEN = CONFIG.flaps.map((f) => f.id);
const INNER = CONFIG.flaps.filter((f) => f.capa === "in").map((f) => f.id);

/* ---------- Estado ---------- */
let abierta = {};
ORDEN.forEach((id) => (abierta[id] = false));
let volteada = false;
let sonidoActivo = true;
const historial = [];

/* ---------- DOM ---------- */
const purse = document.getElementById("purse");
const stage = document.getElementById("stage");
const hint = document.getElementById("hint");
const partsList = document.getElementById("parts-list");
const btnUndo = document.getElementById("btn-undo");
const btnHome = document.getElementById("btn-home");
const btnOpen = document.getElementById("btn-open");
const btnFlip = document.getElementById("btn-flip");
const btnSound = document.getElementById("btn-sound");

let centroEl = null;

/* ============================================================
   SONIDO SUAVE DE HOJAS (generado, sin archivos externos)
   ============================================================ */
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}
function sonidoHoja() {
  if (!sonidoActivo) return;
  initAudio();
  if (!audioCtx) return;
  const dur = 0.45;
  const frames = Math.floor(dur * audioCtx.sampleRate);
  const buffer = audioCtx.createBuffer(1, frames, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    const t = i / frames;
    const env = Math.sin(Math.PI * t) * (1 - t * 0.6);
    data[i] = (Math.random() * 2 - 1) * env * 0.5;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = "bandpass"; bandpass.frequency.value = 1800; bandpass.Q.value = 0.7;
  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = "lowpass"; lowpass.frequency.value = 3200;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.32, audioCtx.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  source.connect(bandpass); bandpass.connect(lowpass); lowpass.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

/* ============================================================
   CONSTRUCCIÓN DEL DOM
   ============================================================ */
function imagen(src, alt) {
  const img = document.createElement("img");
  img.src = src; img.alt = alt; img.draggable = false;
  return img;
}

function construir() {
  purse.innerHTML = "";

  // Base: panel central cerrado
  const base = document.createElement("div");
  base.className = "base";
  base.appendChild(imagen(CONFIG.centroCerrado, "Panel central (cerrada)"));
  purse.appendChild(base);

  // Centro: dibujo revelado (abierta)
  centroEl = document.createElement("div");
  centroEl.className = "centro";
  centroEl.appendChild(imagen(CONFIG.centroAbierto, "Dibujo central"));
  purse.appendChild(centroEl);

  // Solapas
  CONFIG.flaps.forEach((f) => {
    const flap = document.createElement("div");
    flap.className = "flap capa-" + f.capa;
    flap.dataset.id = f.id;
    flap.title = f.nombre;
    flap.style.clipPath = f.clip;
    flap.style.transformOrigin = f.origin;
    flap.appendChild(imagen(f.cover, f.nombre));
    flap.addEventListener("click", (e) => { e.stopPropagation(); alternarSolapa(f.id); });
    purse.appendChild(flap);
  });

  // Reverso de toda la carta
  const pback = document.createElement("div");
  pback.className = "purse-back";
  pback.appendChild(imagen(CONFIG.reverso, "Reverso de la carta"));
  purse.appendChild(pback);
}

function construirIndice() {
  partsList.innerHTML = "";
  CONFIG.flaps.forEach((f) => {
    const thumb = crearThumb(f.cover, f.nombre, "flap:" + f.id);
    thumb.addEventListener("click", () => verSolapa(f.id));
    partsList.appendChild(thumb);
  });
  const thumbAll = crearThumb(CONFIG.centroAbierto, "Abrir todo", "todo");
  thumbAll.addEventListener("click", abrirTodo);
  partsList.appendChild(thumbAll);
}

function crearThumb(src, nombre, key) {
  const thumb = document.createElement("div");
  thumb.className = "part-thumb";
  thumb.dataset.key = key;
  thumb.title = "Ver " + nombre;
  thumb.appendChild(imagen(src, nombre));
  const label = document.createElement("span");
  label.textContent = nombre;
  thumb.appendChild(label);
  return thumb;
}

/* ============================================================
   RENDER
   ============================================================ */
function render() {
  CONFIG.flaps.forEach((f) => {
    const flap = purse.querySelector('.flap[data-id="' + f.id + '"]');
    const isOpen = !!abierta[f.id];
    flap.classList.toggle("open", isOpen);
    flap.style.transform = isOpen ? "" : f.fold;
  });

  // El dibujo central se muestra cuando la estrella (interiores) está abierta
  const estrellaAbierta = INNER.every((id) => abierta[id]);
  centroEl.style.opacity = estrellaAbierta ? "1" : "0";

  const todasAbiertas = ORDEN.every((id) => abierta[id]);
  const algunaAbierta = ORDEN.some((id) => abierta[id]);

  partsList.querySelectorAll(".part-thumb").forEach((t) => {
    const key = t.dataset.key;
    if (key === "todo") t.classList.toggle("active", todasAbiertas);
    else t.classList.toggle("active", !!abierta[key.split(":")[1]]);
  });

  btnUndo.disabled = historial.length === 0;
  btnOpen.disabled = todasAbiertas;
  hint.classList.toggle("hidden", algunaAbierta || volteada);
}

/* ============================================================
   ACCIONES
   ============================================================ */
function snapshot() { historial.push(JSON.stringify(abierta)); }

function alternarSolapa(id) {
  snapshot();
  abierta[id] = !abierta[id];
  sonidoHoja();
  render();
}
function desplegarSiguiente() {
  const sig = ORDEN.find((id) => !abierta[id]);
  if (!sig) return;
  snapshot();
  abierta[sig] = true;
  sonidoHoja();
  render();
}
function verSolapa(id) {
  snapshot();
  ORDEN.forEach((k) => (abierta[k] = k === id));
  sonidoHoja();
  render();
}
function abrirTodo() {
  snapshot();
  ORDEN.forEach((k) => (abierta[k] = true));
  sonidoHoja();
  render();
}
function volverInicio() {
  if (!ORDEN.some((id) => abierta[id])) return;
  snapshot();
  ORDEN.forEach((k) => (abierta[k] = false));
  sonidoHoja();
  render();
}
function deshacer() {
  if (historial.length === 0) return;
  abierta = JSON.parse(historial.pop());
  sonidoHoja();
  render();
}
function darVuelta() {
  volteada = !volteada;
  purse.classList.toggle("flipped", volteada);
  btnFlip.textContent = volteada ? "⟲ Ver frente" : "⟲ Dar vuelta";
  sonidoHoja();
  render();
}
function alternarSonido() {
  sonidoActivo = !sonidoActivo;
  btnSound.textContent = sonidoActivo ? "🔊 Sonido" : "🔇 Silencio";
  btnSound.setAttribute("aria-pressed", String(sonidoActivo));
  if (sonidoActivo) { initAudio(); sonidoHoja(); }
}

/* ============================================================
   EVENTOS
   ============================================================ */
function clicEscenario() {
  if (volteada) { darVuelta(); return; }
  desplegarSiguiente();
}
stage.addEventListener("click", clicEscenario);
stage.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); clicEscenario(); }
});
btnOpen.addEventListener("click", (e) => { e.stopPropagation(); desplegarSiguiente(); });
btnUndo.addEventListener("click", (e) => { e.stopPropagation(); deshacer(); });
btnHome.addEventListener("click", (e) => { e.stopPropagation(); volverInicio(); });
btnFlip.addEventListener("click", (e) => { e.stopPropagation(); darVuelta(); });
btnSound.addEventListener("click", (e) => { e.stopPropagation(); alternarSonido(); });
document.addEventListener("keydown", (e) => {
  if (e.target === stage) return;
  if (e.key === "ArrowRight") desplegarSiguiente();
  if (e.key === "ArrowLeft") deshacer();
  if (e.key === "Home") volverInicio();
  if (e.key === "f" || e.key === "F") darVuelta();
});

/* ---------- Inicio ---------- */
construir();
construirIndice();
render();
