import { el } from './dom.js';
import { renderMedia } from './media.js';

export function renderItem(item){
  renderMedia(item);

  const quote = el('quote');
  quote.innerHTML = '';
  (item.text || []).forEach(t => {
    const p = document.createElement('p');
    p.textContent = t;
    quote.appendChild(p);
  });

  const author = el('author');
  author.textContent = item.author ? '— ' + item.author : '';
}
