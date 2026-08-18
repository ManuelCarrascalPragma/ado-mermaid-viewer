export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function onKeyDown(key, handler) {
  const listener = (e) => {
    if (e.key === key) handler(e);
  };
  window.addEventListener('keydown', listener);
  return () => window.removeEventListener('keydown', listener);
}

export function onKeyMod(modKey, handler) {
  const listener = (e) => {
    if (e[modKey]) handler(e);
  };
  window.addEventListener('keydown', listener);
  return () => window.removeEventListener('keydown', listener);
}