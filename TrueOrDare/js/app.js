// App-Entry für Variante A (Mandanten via URL-Params)
// Lädt Items aus ./data/<site>.items.json und optional Theme ./css/theme-<theme>.css

import { el, setTime } from './dom.js';
import { renderItem } from './render.js';
import { drawIndex } from './shuffleBag.js';
import { tryResumeAudio } from './media.js';

let ITEMS = [];

/* ------------------- URL-Parameter & Loader ------------------- */

function getParam(name, fallback = '') {
  const v = new URLSearchParams(location.search).get(name);
  return (v && v.trim()) || fallback;
}

async function loadJSON(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.json();
}

async function loadItemsForSite() {
  const site = getParam('site', 'default'); // z.B. ?site=care
  try {
    const data = await loadJSON(`./data/${site}.items.json`);
    return Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
  } catch {
    const data = await loadJSON(`./data/default.items.json`);
    return Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
  }
}

function applyThemeForSite() {
  const theme = getParam('theme', ''); // z.B. ?theme=care -> ./css/theme-care.css
  if (!theme) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `./css/theme-${theme}.css`;
  document.head.appendChild(link);
}

function applySealForSite() {
  const site = getParam('site', 'default'); // Bildpfad kann pro Site variieren
  const seal = document.getElementById('sealImg');
  if (!seal) return;
  // Wenn vorhanden, verwende assets/<site>/siegel.png, sonst fallback bleibt
  const candidate = `./assets/${site}/siegel.png`;
  // Wir testen existenz "leicht" via Image-Probe (ohne die App zu blockieren)
  const probe = new Image();
  probe.onload = () => { seal.src = candidate; };
  probe.onerror = () => {}; // Bei Fehler: belasse Standard ./assets/siegel.png
  probe.src = candidate;
}

/* ------------------- Viewport-Handling (Mobile-sicher) ------------------- */

function setViewportVars() {
  const vv = window.visualViewport;
  const h = vv ? Math.round(vv.height) : window.innerHeight;
  document.documentElement.style.setProperty('--vhpx', h + 'px');
  document.documentElement.style.setProperty('--vh', (h / 100) + 'px');
}

/* ------------------- Fit-Logik: Inhalte auf eine Seite bringen ------------------- */

function fitToViewport() {
  const card = document.querySelector('.card');
  if (!card) return;

  // sichtbare Höhe
  const visH = window.visualViewport ? Math.round(window.visualViewport.height) : window.innerHeight;
  const cs = getComputedStyle(document.body);
  const padTop = parseFloat(cs.paddingTop) || 0;
  const padBottom = parseFloat(cs.paddingBottom) || 0;
  const available = visH - padTop - padBottom;

  // Startwerte aus CSS-Variablen lesen
  const root = document.documentElement;
  let fsQuote = getStartPx('--fs-quote', 20);
  let fsAuthor = getStartPx('--fs-author', 14);
  let fsH1 = getStartPx('--fs-h1', 18);
  let heroMax = getStartPx('--hero-max-h', 360);

  setPxVar('--fs-quote', fsQuote);
  setPxVar('--fs-author', fsAuthor);
  setPxVar('--fs-h1', fsH1);
  setPxVar('--hero-max-h', heroMax);

  const minQuote = 14;
  const minAuthor = 12;
  const minH1 = 14;
  const minHero = getStartPx('--hero-min-h', 140);

  let guard = 220; // Sicherheit gegen Endlosschleifen

  // Solange die Karte höher als verfügbar ist: stufenweise reduzieren
  while (card.scrollHeight > available && guard-- > 0) {
    if (fsQuote > minQuote) {
      fsQuote -= 1;
      setPxVar('--fs-quote', fsQuote);
    } else if (heroMax > minHero && heroIsVisible()) {
      heroMax -= 6; // Bild/Video schneller verkleinern
      setPxVar('--hero-max-h', heroMax);
    } else if (fsAuthor > minAuthor) {
      fsAuthor -= 1;
      setPxVar('--fs-author', fsAuthor);
    } else if (fsH1 > minH1) {
      fsH1 -= 1;
      setPxVar('--fs-h1', fsH1);
    } else {
      break;
    }
  }
}

function heroIsVisible() {
  const hero = document.getElementById('hero');
  return hero && hero.style.display !== 'none';
}

function getStartPx(varName, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const m = v.match(/([\d.]+)px/);
  return m ? parseFloat(m[1]) : fallback;
}
function setPxVar(varName, num) {
  document.documentElement.style.setProperty(varName, `${num}px`);
}

/* ------------------- Render-Flow ------------------- */

function renderRandom() {
  if (!ITEMS.length) return;
  const i = drawIndex(ITEMS.length);
  renderItem(ITEMS[i]);     // rendert Medien + Absätze/Autor
  fitToViewport();          // danach an Viewport anpassen
}

/* ------------------- Init ------------------- */

export async function initApp() {
  // Zeit
  setTime();
  setInterval(setTime, 30_000);

  // Viewport-Variablen setzen + Listener
  setViewportVars();
  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', () => { setViewportVars(); fitToViewport(); });
    vv.addEventListener('scroll', () => { setViewportVars(); fitToViewport(); });
  }
  window.addEventListener('resize', () => {
    clearTimeout(initApp._t);
    initApp._t = setTimeout(() => { setViewportVars(); fitToViewport(); }, 120);
  });

  // Audio-Unlock bei User-Interaktion
  window.addEventListener('click', tryResumeAudio);
  window.addEventListener('touchstart', tryResumeAudio);
  window.addEventListener('keydown', tryResumeAudio);

  // Theme & Daten laden (mandantenfähig)
  applyThemeForSite();
  const data = await loadItemsForSite().catch(() => []);
  ITEMS = Array.isArray(data) && data.length ? data : [{
    text: ["Keine Daten gefunden. Bitte items.json für diese Site anlegen."],
    author: "System"
  }];

  // Rendern
  renderRandom();

  // Siegel ggf. pro Site überschreiben
  applySealForSite();
}
