(function() {
  'use strict';
  const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const SKIP = 'pre, code, script, style, [data-bidi-fixed]';

  let pending = new Set();
  let timeout = null;

  function hasArabic(text) {
    return ARABIC.test(text);
  }

  function injectRLM(text) {
    if (!hasArabic(text)) return text;
    let result = '';
    let i = 0;
    while (i < text.length) {
      if (/[\u0600-\u06FF]/.test(text[i])) {
        let run = '';
        while (i < text.length && /[\u0600-\u06FF]/.test(text[i])) {
          run += text[i]; i++;
        }
        result += '\u200F' + run + '\u200F';
      } else {
        result += text[i]; i++;
      }
    }
    return result;
  }

  function fixElement(el) {
    if (!el || el.nodeType !== 1 || el.closest(SKIP)) return;
    const text = el.textContent || '';
    if (!hasArabic(text)) return;
    el.style.direction = 'rtl';
    el.style.unicodeBidi = 'plaintext';
    el.setAttribute('data-bidi-fixed', '1');
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest(SKIP)) continue;
      if (hasArabic(node.textContent)) {
        node.textContent = injectRLM(node.textContent);
      }
    }
  }

  function fixInput(el) {
    if (!el || el.hasAttribute('data-bidi-input')) return;
    el.setAttribute('data-bidi-input', '1');
    function update() {
      const v = el.value !== undefined ? el.value : el.textContent || '';
      el.style.direction = hasArabic(v) ? 'rtl' : 'ltr';
      el.style.textAlign = hasArabic(v) ? 'right' : 'left';
    }
    el.addEventListener('input', update);
    el.addEventListener('compositionend', update);
    update();
  }

  function processBatch() {
    const toProcess = new Set(pending);
    pending.clear();
    timeout = null;
    for (let el of toProcess) {
      if (!el.parentElement) continue;
      if (el.nodeType === 1) {
        fixElement(el);
        el.querySelectorAll?.('textarea, input[type=text], input[type=search], [contenteditable], [role=textbox]').forEach(fixInput);
      }
    }
  }

  function schedule(el) {
    pending.add(el);
    if (!timeout) {
      timeout = requestAnimationFrame(processBatch);
    }
  }

  const observer = new MutationObserver(mutations => {
    for (let m of mutations) {
      for (let node of m.addedNodes) {
        if (node.nodeType === 1) {
          schedule(node);
          if (node.querySelectorAll) {
            node.querySelectorAll('p,div,span,li,td,th,*').forEach(el => schedule(el));
          }
        } else if (node.nodeType === 3) {
          schedule(node.parentElement);
        }
      }
      if (m.type === 'characterData') {
        schedule(m.target.parentElement);
      }
    }
  });

  if (document.body) {
    schedule(document.body);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
})();
