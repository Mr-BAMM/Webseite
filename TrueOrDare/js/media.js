import { clearNode, setStatus } from './dom.js';

let activeAudio = null;

export function stopAudio() {
  if (activeAudio) {
    try { activeAudio.pause(); } catch {}
    activeAudio = null;
  }
}

export function renderMedia(item) {
  const hero = document.getElementById('hero');       // <figure>
  const host = document.getElementById('heroMedia');  // Medien-Container
  const cap  = document.getElementById('heroCaption');

  // --- FALL: KEIN VIDEO & KEIN BILD -> Hero komplett ausblenden ---
  const hasVideo = !!(item.video && item.video.src);
  const hasImage = !!(item.image && item.image.src);

  if (!hasVideo && !hasImage) {
    // Medien + Caption leeren und Figur ausblenden
    clearNode(host);
    if (cap) { cap.textContent = ''; cap.classList.add('hidden'); }
    if (hero) hero.style.display = 'none';

    // evtl. laufendes Audio stoppen / optional neues Audio starten
    stopAudio();
    if (item.audio?.src) {
      const a = new Audio(item.audio.src);
      a.loop = item.audio.loop ?? true;
      a.preload = 'auto';
      a.play().then(() => {
        activeAudio = a;
        setStatus('Audio läuft.');
      }).catch(() => {
        activeAudio = a;
        setStatus('Klick zum Aktivieren von Audio.');
      });
    }
    return; // fertig – direkt zum Text
  }

  // --- FALL: ES GIBT MEDIEN -> Hero einblenden und rendern ---
  if (hero) hero.style.display = '';  // zurücksetzen (sichtbar)
  clearNode(host);

  if (hasVideo) {
    const v = document.createElement('video');
    v.src = item.video.src;
    v.autoplay = true;
    v.muted = true;          // Autoplay-Regeln
    v.loop = item.video.loop ?? true;
    v.playsInline = true;
    v.preload = 'metadata';
    if (item.video.poster) v.poster = item.video.poster;
    host.appendChild(v);
  } else if (hasImage) {
    const img = document.createElement('img');
    img.src = item.image.src;
    img.alt = item.image.alt || '';
    img.loading = 'eager';
    img.decoding = 'async';
    host.appendChild(img);
  }

  // Bild-Credit
  if (cap) {
    if (item.image?.credit) {
      cap.textContent = item.image.credit;
      cap.classList.remove('hidden');
    } else {
      cap.textContent = '';
      cap.classList.add('hidden');
    }
  }

  // Audio parallel
  stopAudio();
  if (item.audio?.src) {
    const a = new Audio(item.audio.src);
    a.loop = item.audio.loop ?? true;
    a.preload = 'auto';
    a.play().then(() => {
      activeAudio = a;
      setStatus('Audio läuft.');
    }).catch(() => {
      activeAudio = a;
      setStatus('Klick zum Aktivieren von Audio.');
    });
  }
}

export function tryResumeAudio() {
  if (activeAudio && activeAudio.paused) {
    activeAudio.play().then(() => setStatus('Audio aktiviert.')).catch(()=>{});
  }
}
