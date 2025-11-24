export const el = (id) => document.getElementById(id);

export function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function setStatus(msg) {
  const s = el('status'); 
  s.textContent = msg;
  clearTimeout(setStatus._t); 
  setStatus._t = setTimeout(() => s.textContent = '', 1800);
}

export function setTime() {
  const now = new Date();
  el('time').textContent = now.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
}
