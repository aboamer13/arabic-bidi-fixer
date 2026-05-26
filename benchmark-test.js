const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // تحميل صفحة الاختبار
  await page.goto('file://' + __dirname + '/benchmark.html');
  
  // استخراج كل الجمل الاختبارية
  const testCases = await page.$$eval('.test-case', cases => 
    cases.map(c => {
      const el = c.querySelector('.original, textarea');
      return el ? (el.value || el.innerText).trim() : '';
    })
  );
  
  let results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const text = testCases[i];
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    
    // قياس العرض: هل العنصر موجود ومرئي؟
    const isVisible = await page.evaluate(i => {
      const el = document.querySelectorAll('.test-case')[i];
      return el && el.offsetParent !== null;
    }, i);
    
    // قياس النسخ: محاكاة نسخ النص
    const copied = await page.evaluate(i => {
      const el = document.querySelectorAll('.test-case')[i].querySelector('.original, textarea');
      if (!el) return '';
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      return el.innerText || el.value || '';
    }, i);
    
    results.push({
      index: i + 1,
      text: text.substring(0, 60),
      hasArabic,
      isVisible,
      copySuccess: copied.length > 0,
      copied: copied.substring(0, 60)
    });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    totalCases: testCases.length,
    results
  };
  
  fs.writeFileSync('benchmark-results.json', JSON.stringify(report, null, 2));
  console.log('✅ تم إنشاء التقرير: benchmark-results.json');
  
  await browser.close();
})();
