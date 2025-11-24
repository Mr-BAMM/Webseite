import { el, setTime } from './dom.js';
import { renderItem } from './render.js';
import { drawIndex } from './shuffleBag.js';
import { tryResumeAudio } from './media.js';

let ITEMS = [];

/* -------- Daten laden -------- */
async function loadItems() {
  const res = await fetch('./data/items.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('items.json konnte nicht geladen werden');
  return res.json();
}

/* -------- Render-Flow -------- */
function renderRandom(){
  if (!ITEMS.length) return;
  const i = drawIndex(ITEMS.length);
  renderItem(ITEMS[i]);
  // Nach jedem Render: an die Viewporthöhe anpassen
  fitToViewport();
}

async function copyCurrent(){
  const ps = Array.from(el('quote').querySelectorAll('p')).map(p => p.textContent.trim()).filter(Boolean);
  const author = el('author').textContent.trim();
  const clip = (ps.join('\n\n') + (author ? '\n' + author : '')).trim();
  try {
    await navigator.clipboard.writeText(clip);
    document.getElementById('status').textContent = 'Kopiert.';
  } catch {
    document.getElementById('status').textContent = 'Konnte nicht kopieren.';
  } finally {
    setTimeout(()=>document.getElementById('status').textContent='', 1800);
  }
}

/* -------- Fit-Logik: skaliert Schrift & Bildhöhe bis alles passt -------- */
function fitToViewport() {
  const root = document.documentElement;
  const card = document.querySelector('.card');

  if (!card) return;

  // Ausgangswerte (Reset vor Messung)
  let fsQuote = getStartPx('--fs-quote', 20);
  let fsAuthor = getStartPx('--fs-author', 14);
  let fsH1 = getStartPx('--fs-h1', 18);
  let heroMax = getStartPx('--hero-max-h', 360);

  setPxVar('--fs-quote', fsQuote);
  setPxVar('--fs-author', fsAuthor);
  setPxVar('--fs-h1', fsH1);
  setPxVar('--hero-max-h', heroMax);

  const minQuote = 14;   // untere Grenze für Lesbarkeit
  const minAuthor = 12;
  const minH1 = 14;
  const minHero = getStartPx('--hero-min-h', 160); // nicht unter diese Bildhöhe

  const available = window.innerHeight - getSealHeight() - 32; // 32px Body-Top/Bottom padding Summe

  // Sicherheits-Grenze, um Endlosschleifen zu vermeiden
  let guard = 200;

  // 1) Solange die Karte höher als der verfügbare Platz ist, reduzieren:
  while (card.scrollHeight > available && guard-- > 0) {
    // Priorität: Zuerst Zitat-Text kleiner, dann Bild niedriger, dann Autor/Überschrift
    if (fsQuote > minQuote) {
      fsQuote -= 1;
      setPxVar('--fs-quote', fsQuote);
    } else if (heroMax > minHero) {
      heroMax -= 6; // Bild schneller verkleinern
      setPxVar('--hero-max-h', heroMax);
    } else if (fsAuthor > minAuthor) {
      fsAuthor -= 1;
      setPxVar('--fs-author', fsAuthor);
    } else if (fsH1 > minH1) {
      fsH1 -= 1;
      setPxVar('--fs-h1', fsH1);
    } else {
      // Nichts mehr zu verkleinern: Abbruch
      break;
    }
  }
}

function getSealHeight() {
  const seal = document.querySelector('.seal-bar');
  const hVar = getComputedStyle(document.documentElement).getPropertyValue('--seal-h').trim();
  const num = parseInt(hVar, 10);
  return seal ? (Number.isFinite(num) ? num : seal.offsetHeight || 72) : 0;
}

function getStartPx(varName, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const m = v.match(/([\d.]+)px/);
  return m ? parseFloat(m[1]) : fallback;
}
function setPxVar(varName, num) {
  document.documentElement.style.setProperty(varName, `${num}px`);
}

/* -------- Init -------- */
export async function initApp(){
  setTime(); setInterval(setTime, 30_000);
  window.addEventListener('click', tryResumeAudio);
  window.addEventListener('touchstart', tryResumeAudio);
  window.addEventListener('keydown', tryResumeAudio);

  // Refit bei Drehung/Resize
  window.addEventListener('resize', () => {
    // kleine Entzerrung bei mobilen Tastatur-/Adressleiste-Änderungen
    clearTimeout(initApp._t);
    initApp._t = setTimeout(fitToViewport, 120);
  });

  try {
    const data = await loadItems();
    ITEMS = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
  } catch (e) {
    console.error('items.json Laden fehlgeschlagen:', e);
    ITEMS = [];
  }

  if (!ITEMS.length) {
    ITEMS = [{
      text: ["Kein items.json gefunden oder leer.", "Trag Einträge in data/items.json ein."],
      author: "System"
    }];
  }

  renderRandom();
}
