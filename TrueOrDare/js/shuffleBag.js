const STORAGE_KEY = 'motivation.shuffleBag.v2';

function newBag(size) {
  const bag = Array.from({length: size}, (_, i) => i);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return { bag, i:0, size };
}

export function drawIndex(size) {
  let state = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (Array.isArray(obj.bag) && typeof obj.i === 'number' && obj.size === size) state = obj;
    }
  } catch {}
  if (!state) state = newBag(size);
  if (state.i >= state.bag.length) state = newBag(size);
  const idx = state.bag[state.i++];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return idx;
}
