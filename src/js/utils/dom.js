/** Generates a random short ID */
export function genId() {
  return Math.random().toString(36).slice(2, 9);
}

/** Escapes HTML special characters to prevent XSS */
export function escHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Briefly shakes an element to indicate invalid input */
export function shakeElement(el) {
  el.classList.remove('animate-shake');
  void el.offsetWidth; // Reflow to restart animation
  el.classList.add('animate-shake');
  el.addEventListener('animationend', () => el.classList.remove('animate-shake'), { once: true });
  el.focus();
}

/** Creates an element from an HTML string */
export function htmlToElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

/** Returns a selector's element, throws if not found */
export function qs(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}

/** Returns all matching elements as an array */
export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}
