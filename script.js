/* ============================================================
   CARTA VICTORIANA INTERACTIVA
   ------------------------------------------------------------
   Para personalizar: edita el arreglo PARTES de abajo.
   - "img"     : ruta de la imagen (reemplaza los archivos de /images
                 por tus propios dibujos, manteniendo el nombre, o
                 cambia aquí la ruta).
   - "titulo"  : nombre corto que aparece en el índice de partes.
   - "leyenda" : texto que aparece sobre la imagen al abrirla.
   La PRIMERA entrada es la portada (carta cerrada).
   ============================================================ */
const PARTES = [
  { img: "images/portada.svg", titulo: "Portada",   leyenda: "Una carta por abrir…" },
  { img: "images/parte-1.svg", titulo: "Capa I",    leyenda: "Primer dibujo" },
  { img: "images/parte-2.svg", titulo: "Capa II",   leyenda: "Segundo dibujo" },
  { img: "images/parte-3.svg", titulo: "Capa III",  leyenda: "Tercer dibujo" },
  { img: "images/parte-4.svg", titulo: "Capa IV",   leyenda: "Cuarto dibujo" },
  { img: "images/parte-5.svg", titulo: "Capa V",    leyenda: "Última sorpresa" },
];

// Imagen del reverso (al "dar vuelta" la carta). Reemplaza el archivo o la ruta.
const REVERSO = "images/reverso.svg";

/* ---------- Estado ---------- */
let pasoActual = 0;            // índice de la capa visible (0 = portada)
const historial = [];         // para "deshacer"
let sonidoActivo = true;
let volteada = false;         // ¿la carta está dada vuelta?

/* ---------- Referencias del DOM ---------- */
const card = document.getElementById("card");
const stage = document.getElementById("stage");
const hint = document.getElementById("hint");
const partsList = document.getElementById("parts-list");
const btnUndo = document.getElementById("btn-undo");
const btnHome = document.getElementById("btn-home");
const btnOpen = document.getElementById("btn-open");
const btnSound = document.getElementById("btn-sound");
const btnFlip = document.getElementById("btn-flip");

/* ============================================================
   SONIDO SUAVE DE HOJAS (generado, sin archivos externos)
   Usa la Web Audio API para crear un "rustle" de papel suave.
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
  const sampleRate = audioCtx.sampleRate;
  const frames = Math.floor(dur * sampleRate);
  const buffer = audioCtx.createBuffer(1, frames, sampleRate);
  const data = buffer.getChannelData(0);

  // Ruido con envolvente suave = papel/hoja al pasar
  for (let i = 0; i < frames; i++) {
    const t = i / frames;
    const envelope = Math.sin(Math.PI * t) * (1 - t * 0.6);
    data[i] = (Math.random() * 2 - 1) * envelope * 0.5;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;

  // Filtro pasa-banda para hacerlo "suave" y no áspero
  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 1800;
  bandpass.Q.value = 0.7;

  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 3200;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);

  source.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

/* ============================================================
   CONSTRUCCIÓN DE LAS CAPAS
   ============================================================ */
function construirCarta() {
  card.innerHTML = "";
  // Se crean de la última a la primera para que la portada quede arriba (z-index)
  PARTES.forEach((parte, i) => {
    const layer = document.createElement("div");
    layer.className = "layer";
    layer.style.zIndex = String(PARTES.length - i);
    layer.dataset.index = String(i);

    const img = document.createElement("img");
    img.src = parte.img;
    img.alt = parte.titulo;
    img.draggable = false;

    const caption = document.createElement("div");
    caption.className = "layer-caption";
    caption.textContent = parte.leyenda;

    layer.appendChild(img);
    layer.appendChild(caption);
    card.appendChild(layer);
  });

  // Reverso de la carta (visible al darla vuelta)
  const back = document.createElement("div");
  back.className = "card-back";
  const backImg = document.createElement("img");
  backImg.src = REVERSO;
  backImg.alt = "Reverso de la carta";
  backImg.draggable = false;
  back.appendChild(backImg);
  card.appendChild(back);
}

function construirIndice() {
  partsList.innerHTML = "";
  PARTES.forEach((parte, i) => {
    const thumb = document.createElement("div");
    thumb.className = "part-thumb";
    thumb.dataset.index = String(i);
    thumb.title = "Ver " + parte.titulo;

    const img = document.createElement("img");
    img.src = parte.img;
    img.alt = parte.titulo;
    img.draggable = false;

    const label = document.createElement("span");
    label.textContent = parte.titulo;

    thumb.appendChild(img);
    thumb.appendChild(label);
    thumb.addEventListener("click", () => irAParte(i));
    partsList.appendChild(thumb);
  });
}

/* ============================================================
   RENDERIZADO segun el paso actual
   ============================================================ */
function render() {
  const layers = card.querySelectorAll(".layer");
  layers.forEach((layer) => {
    const idx = Number(layer.dataset.index);
    // Las capas con índice menor que el paso actual están abiertas (giradas)
    layer.classList.toggle("is-open", idx < pasoActual);
    layer.classList.toggle("is-current", idx === pasoActual);
  });

  // Resaltar parte activa en el índice
  partsList.querySelectorAll(".part-thumb").forEach((t) => {
    t.classList.toggle("active", Number(t.dataset.index) === pasoActual);
  });

  // Botones
  btnUndo.disabled = historial.length === 0;
  btnOpen.disabled = pasoActual >= PARTES.length - 1;

  // Pista
  hint.classList.toggle("hidden", pasoActual > 0);
}

/* ============================================================
   ACCIONES
   ============================================================ */
function abrirSiguiente() {
  if (pasoActual >= PARTES.length - 1) return;
  historial.push(pasoActual);
  pasoActual++;
  sonidoHoja();
  render();
}

function deshacer() {
  if (historial.length === 0) return;
  pasoActual = historial.pop();
  sonidoHoja();
  render();
}

function volverInicio() {
  if (pasoActual === 0 && historial.length === 0) return;
  historial.push(pasoActual);
  pasoActual = 0;
  sonidoHoja();
  render();
}

// Ir a una parte concreta (cada parte se puede ver por separado)
function irAParte(i) {
  if (i === pasoActual) return;
  historial.push(pasoActual);
  pasoActual = i;
  sonidoHoja();
  render();
}

// Dar vuelta la carta para ver el reverso (y volver a verla de frente)
function darVuelta() {
  volteada = !volteada;
  card.classList.toggle("flipped", volteada);
  btnFlip.textContent = volteada ? "⟲ Ver frente" : "⟲ Dar vuelta";
  sonidoHoja();
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
  // Si la carta está dada vuelta, un clic la regresa al frente
  if (volteada) { darVuelta(); return; }
  abrirSiguiente();
}

stage.addEventListener("click", clicEscenario);
stage.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); clicEscenario(); }
});

btnOpen.addEventListener("click", (e) => { e.stopPropagation(); abrirSiguiente(); });
btnUndo.addEventListener("click", (e) => { e.stopPropagation(); deshacer(); });
btnHome.addEventListener("click", (e) => { e.stopPropagation(); volverInicio(); });
btnSound.addEventListener("click", (e) => { e.stopPropagation(); alternarSonido(); });
btnFlip.addEventListener("click", (e) => { e.stopPropagation(); darVuelta(); });

// Atajos de teclado
document.addEventListener("keydown", (e) => {
  if (e.target === stage) return; // ya manejado arriba
  if (e.key === "ArrowRight") abrirSiguiente();
  if (e.key === "ArrowLeft") deshacer();
  if (e.key === "Home") volverInicio();
  if (e.key === "f" || e.key === "F") darVuelta();
});

/* ---------- Inicio ---------- */
construirCarta();
construirIndice();
render();
