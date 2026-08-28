(function () {
  function el(id) { return document.getElementById(id); }
  var pendingCaption, fading = false;

  function setCaption(text) {
    var c = el('caption');
    if (fading) { pendingCaption = text; return; }
    if (c.textContent === (text || '')) return;
    fading = true;
    c.style.opacity = '0';
    setTimeout(function () {
      c.textContent = text || '';
      c.style.opacity = text ? '1' : '0';
      fading = false;
      if (pendingCaption !== undefined && pendingCaption !== text) {
        var p = pendingCaption; pendingCaption = undefined; setCaption(p);
      }
    }, 620);
  }

  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function setMeter(samples) {
    var frac = Math.min(1, Math.log2(1 + samples) / Math.log2(1 + 1024));
    el('meter-fill').style.width = (frac * 100).toFixed(1) + '%';
    var paths = samples * CONFIG.PT.INTERNAL_W * CONFIG.PT.INTERNAL_H;
    el('meter-text').textContent = fmt(paths) + ' light paths';
  }

  if (typeof window !== 'undefined') window.UI = { setCaption: setCaption, setMeter: setMeter };
})();
