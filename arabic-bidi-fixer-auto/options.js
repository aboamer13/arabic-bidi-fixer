document.getElementById('save').onclick = () => {
  const list = document.getElementById('blacklist').value.split('\n').map(s => s.trim()).filter(Boolean);
  chrome.storage.sync.set({ blacklist: list }, () => alert('تم الحفظ'));
};
chrome.storage.sync.get({ blacklist: [] }, data => {
  document.getElementById('blacklist').value = data.blacklist.join('\n');
});
