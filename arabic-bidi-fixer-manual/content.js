(function() {
  'use strict';
  const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

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
    if (!el || el.nodeType !== 1) return;
    if (el.closest('pre, code, script, style')) return;
    const text = el.textContent || '';
    if (!hasArabic(text)) return;
    el.style.direction = 'rtl';
    el.style.unicodeBidi = 'plaintext';
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest('pre, code, script, style')) continue;
      if (hasArabic(node.textContent)) {
        node.textContent = injectRLM(node.textContent);
      }
    }
  }

  function fixInput(el) {
    if (!el) return;
    const v = el.value !== undefined ? el.value : el.textContent || '';
    el.style.direction = hasArabic(v) ? 'rtl' : 'ltr';
    el.style.textAlign = hasArabic(v) ? 'right' : 'left';
  }

  document.querySelectorAll('p, div, span, li, td, th, h1, h2, h3, h4, h5, h6, blockquote, figcaption').forEach(fixElement);
  document.querySelectorAll('textarea, input[type=text], input[type=search], [contenteditable], [role=textbox]').forEach(fixInput);

  const toast = document.createElement('div');
  toast.textContent = '✅ تم إصلاح النص العربي';
  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#4CAF50;color:white;padding:12px 24px;border-radius:8px;z-index:99999;font-family:sans-serif;font-size:14px;opacity:0;transition:opacity 0.3s;';
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
})();
