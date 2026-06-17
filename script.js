/* ============================================================
   CARTA VICTORIANA INTERACTIVA  ·  estilo "puzzle purse"
   ------------------------------------------------------------
   Un cuadrado con 4 solapas triangulares dobladas al centro.
   Cada solapa se despliega hacia afuera y revela el dibujo
   interior. Sonido suave de hoja en cada acción.

   Para personalizar, reemplaza las imágenes de /images o cambia
   las rutas en CONFIG. Puedes usar JPG, PNG, WEBP o SVG.
   ============================================================ */
const CONFIG = {
  // Dibujo del interior (se revela al desplegar las solapas)
  interior: "images/centro.svg",
  // Reverso de la carta (al "dar vuelta")
  reverso: "images/reverso.svg",
  // Las 4 solapas. "cover" = dibujo visible cuando está cerrada.
  // El orden define qué solapa abre el botón "Desplegar solapa".
  solapas: [
    { id: "n", nombre: "Solapa Norte", cover: "images/solapa-n.svg" },
    { id: "e", nombre: "Solapa Este",  cover: "images/solapa-e.svg" },
    { id: "s", nombre: "Solapa Sur",   cover: "images/solapa-s.svg" },
    { id: "w", nombre: "Solapa Oeste", cover: "images/solapa-w.svg" },
  ],
};

const ORDEN = CONFIG.solapas.map((s) => s.id);

/* ---------- Estado ---------- */
let abierta = {};                 // { n:false, e:false, ... }
ORDEN.forEach((id) => (abierta[id] = false));
let volteada = false;
let sonidoActivo = true;
const historial = [];             // pila de estados previos (para deshacer)

/* ---------- Referencias del DOM ---------- */
const purse = document.getElementById("purse");
const stage = document.getElementById("stage");
const hint = document.getElementById("hint");
const partsList = document.getElementById("parts-list");
const btnUndo = document.getElementById("btn-undo");
const btnHome = document.getElementById("btn-home");
const btnOpen = document.getElementById("btn-open");
const btnFlip = document.getElementById("btn-flip");
const btnSound = document.getElementById("btn-sound");

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
  bandpass.type = "bandpass";
  bandpass.frequency.value = 1800;
  bandpass.Q.value = 0.7;

  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 3200;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.32, audioCtx.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);

  source.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

/* ============================================================
   CONSTRUCCIÓN DEL DOM
   ============================================================ */
function construir() {
  purse.innerHTML = "";

  // Base (dibujo interior)
  const base = document.createElement("div");
  base.className = "base";
  const baseImg = document.createElement("img");
  baseImg.src = CONFIG.interior;
  baseImg.alt = "Dibujo interior de la carta";
  baseImg.draggable = false;
  base.appendChild(baseImg);
  purse.appendChild(base);

  // Solapas
  CONFIG.solapas.forEach((s) => {
    const flap = document.createElement("div");
    flap.className = "flap " + s.id;
    flap.dataset.id = s.id;
    flap.title = s.nombre;

    const front = document.createElement("div");
    front.className = "flap-face front";
    const frontImg = document.createElement("img");
    frontImg.src = s.cover;
    frontImg.alt = s.nombre;
    frontImg.draggable = false;
    front.appendChild(frontImg);

    const back = document.createElement("div");
    back.className = "flap-face back";

    flap.appendChild(back);
    flap.appendChild(front);
    flap.addEventListener("click", (e) => {
      e.stopPropagation();
      alternarSolapa(s.id);
    });
    purse.appendChild(flap);
  });

  // Reverso de la carta
  const pback = document.createElement("div");
  pback.className = "purse-back";
  const pbackImg = document.createElement("img");
  pbackImg.src = CONFIG.reverso;
  pbackImg.alt = "Reverso de la carta";
  pbackImg.draggable = false;
  pback.appendChild(pbackImg);
  purse.appendChild(pback);
}

function construirIndice() {
  partsList.innerHTML = "";

  // Una miniatura por solapa
  CONFIG.solapas.forEach((s) => {
    const thumb = crearThumb(s.cover, s.nombre, "flap:" + s.id);
    thumb.addEventListener("click", () => verSolapa(s.id));
    partsList.appendChild(thumb);
  });

  // Miniatura del interior (abre todas)
  const thumbInt = crearThumb(CONFIG.interior, "Interior (todo abierto)", "interior");
  thumbInt.addEventListener("click", abrirTodo);
  partsList.appendChild(thumbInt);
}

function crearThumb(src, nombre, key) {
  const thumb = document.createElement("div");
  thumb.className = "part-thumb";
  thumb.dataset.key = key;
  thumb.title = "Ver " + nombre;
  const img = document.createElement("img");
  img.src = src;
  img.alt = nombre;
  img.draggable = false;
  const label = document.createElement("span");
  label.textContent = nombre;
  thumb.appendChild(img);
  thumb.appendChild(label);
  return thumb;
}

/* ============================================================
   RENDER
   ============================================================ */
function render() {
  purse.querySelectorAll(".flap").forEach((flap) => {
    flap.classList.toggle("open", !!abierta[flap.dataset.id]);
  });

  const todasAbiertas = ORDEN.every((id) => abierta[id]);
  const algunaAbierta = ORDEN.some((id) => abierta[id]);

  // Resaltar partes activas
  partsList.querySelectorAll(".part-thumb").forEach((t) => {
    const key = t.dataset.key;
    if (key === "interior") t.classList.toggle("active", todasAbiertas);
    else t.classList.toggle("active", !!abierta[key.split(":")[1]]);
  });

  btnUndo.disabled = historial.length === 0;
  btnOpen.disabled = todasAbiertas;
  hint.classList.toggle("hidden", algunaAbierta || volteada);
}

/* ============================================================
   ACCIONES
   ============================================================ */
function snapshot() {
  historial.push(JSON.stringify(abierta));
}

function alternarSolapa(id) {
  snapshot();
  abierta[id] = !abierta[id];
  sonidoHoja();
  render();
}

function desplegarSiguiente() {
  const siguiente = ORDEN.find((id) => !abierta[id]);
  if (!siguiente) return;
  snapshot();
  abierta[siguiente] = true;
  sonidoHoja();
  render();
}

// Ver una sola solapa abierta (las demás cerradas)
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
