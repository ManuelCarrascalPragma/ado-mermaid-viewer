let mermaidLoaded = false;

export async function loadMermaid() {
  if (mermaidLoaded && window.mermaid) return;
  if (window.mermaid) {
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose'
    });
    mermaidLoaded = true;
    return;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('lib/mermaid.min.js');
    script.onload = () => {
      if (window.mermaid) {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose'
        });
        mermaidLoaded = true;
        resolve();
      } else {
        reject(new Error('Mermaid not exposed'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Mermaid'));
    document.head.appendChild(script);
  });
}

export async function renderMermaid(mermaidCode, idPrefix = 'mermaid') {
  await loadMermaid();
  const id = `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return window.mermaid.render(id, mermaidCode);
}

export function isMermaidLoaded() {
  return mermaidLoaded && !!window.mermaid;
}