(function () {
  'use strict';

  var data = window.MANIFEST;
  var KINDS = [
    { key: 'slides', title: 'Slides' },
    { key: 'transcripts', title: 'Transcripts' },
    { key: 'assignments', title: 'Assignments' }
  ];
  var DONE_KEY = 'dl-done';
  var $ = function (id) { return document.getElementById(id); };

  var state = { q: '', type: 'all', done: loadDone() };

  function loadDone() {
    try { return JSON.parse(localStorage.getItem(DONE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveDone() {
    try { localStorage.setItem(DONE_KEY, JSON.stringify(state.done)); } catch (e) { /* storage unavailable */ }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtSize(b) {
    if (b >= 1048576) return (b / 1048576).toFixed(b >= 10485760 ? 0 : 1) + ' MB';
    return Math.max(1, Math.round(b / 1024)) + ' KB';
  }
  function url(path) { return encodeURI(path); }

  function highlight(text) {
    var safe = esc(text);
    if (!state.q) return safe;
    var re = new RegExp('(' + state.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return safe.replace(re, '<mark>$1</mark>');
  }

  /* ---------- stats ---------- */
  function renderStats() {
    var count = function (k) { return data.weeks.reduce(function (n, w) { return n + w[k].length; }, 0); };
    var total = data.weeks.reduce(function (n, w) {
      return n + KINDS.reduce(function (m, k) {
        return m + w[k.key].reduce(function (s, f) { return s + f.size; }, 0);
      }, 0);
    }, 0);
    var items = [
      [data.weeks.length, 'Weeks'], [count('slides'), 'Lecture decks'],
      [count('transcripts'), 'Transcripts'], [count('assignments'), 'Assignments'],
      [fmtSize(total), 'Total size']
    ];
    $('stats').innerHTML = items.map(function (i) {
      return '<li><b>' + esc(i[0]) + '</b><span>' + i[1] + '</span></li>';
    }).join('');
  }

  /* ---------- filtering ---------- */
  function weekMatches(w) {
    if (!state.q) return true;
    var q = state.q.toLowerCase();
    var hay = ['week ' + w.week, 'w' + w.week, w.title].concat(w.topics);
    KINDS.forEach(function (k) { w[k.key].forEach(function (f) { hay.push(f.label); }); });
    return hay.join(' | ').toLowerCase().indexOf(q) !== -1;
  }
  function visibleKinds(w) {
    return KINDS.filter(function (k) {
      return (state.type === 'all' || state.type === k.key) && w[k.key].length;
    });
  }

  /* ---------- rendering ---------- */
  var canPreview = !window.matchMedia('(pointer: coarse)').matches;

  function fileRow(f, w) {
    return '<div class="file">' +
      '<a class="name" href="' + url(f.path) + '" target="_blank" rel="noopener">' + highlight(f.label) + '</a>' +
      '<span class="size">' + fmtSize(f.size) + '</span>' +
      (canPreview ? '<button class="act" type="button" data-preview="' + esc(f.path) + '" data-label="' + esc('Week ' + w.week + ' · ' + f.label) + '" data-size="' + f.size + '">Preview</button>' : '') +
      '<a class="act" href="' + url(f.path) + '" download aria-label="Download ' + esc(f.label) + '">↓</a>' +
      '</div>';
  }

  function card(w) {
    var kinds = visibleKinds(w);
    var done = !!state.done[w.week];
    var pad = String(w.week).padStart(2, '0');
    return '<article class="card' + (done ? ' done' : '') + '" id="week-' + w.week + '">' +
      '<div class="card-head">' +
        '<div class="badge"><div><small>Week</small>' + pad + '</div></div>' +
        '<div><h2 class="card-title">' + highlight(w.title) + '</h2>' +
          '<div class="tags">' + w.topics.map(function (t) { return '<span class="tag">' + highlight(t) + '</span>'; }).join('') + '</div></div>' +
        '<label class="done-toggle"><input type="checkbox" data-done="' + w.week + '"' + (done ? ' checked' : '') + '> Done</label>' +
      '</div>' +
      kinds.map(function (k) {
        return '<div class="group" data-kind="' + k.key + '"><h3>' + k.title + '</h3>' +
          w[k.key].map(function (f) { return fileRow(f, w); }).join('') + '</div>';
      }).join('') +
    '</article>';
  }

  function render() {
    var list = data.weeks.filter(function (w) { return weekMatches(w) && visibleKinds(w).length; });
    $('weeks').innerHTML = list.map(card).join('');
    $('empty').hidden = list.length > 0;
    renderProgress();
    markTarget();
  }

  function renderProgress() {
    var n = data.weeks.filter(function (w) { return state.done[w.week]; }).length;
    $('bar').style.width = (n / data.weeks.length * 100) + '%';
    $('progress-text').textContent = n + ' of ' + data.weeks.length + ' weeks done';
  }

  function markTarget() {
    var m = /^#week-(\d+)$/.exec(location.hash);
    document.querySelectorAll('.card.target').forEach(function (c) { c.classList.remove('target'); });
    if (!m) return;
    var el = $('week-' + m[1]);
    if (el) { el.classList.add('target'); el.scrollIntoView({ block: 'start' }); }
  }

  /* ---------- viewer ---------- */
  var viewer = $('viewer'), frame = $('viewer-frame');
  function openViewer(path, label, size) {
    $('viewer-title').textContent = label;
    $('viewer-open').href = url(path);
    $('viewer-dl').href = url(path);
    $('viewer-note').textContent = (size > 15 * 1048576
      ? 'Large file (' + fmtSize(size) + ') — the preview may take a while. ' : '') +
      'If the preview stays blank, use “Open in new tab”.';
    frame.src = url(path) + '#view=FitH';
    if (typeof viewer.showModal === 'function') viewer.showModal(); else window.open(url(path), '_blank');
  }
  function closeViewer() { viewer.close(); }
  viewer.addEventListener('close', function () { frame.removeAttribute('src'); });
  viewer.addEventListener('click', function (e) { if (e.target === viewer) closeViewer(); });
  $('viewer-close').addEventListener('click', closeViewer);

  /* ---------- events ---------- */
  $('weeks').addEventListener('click', function (e) {
    var b = e.target.closest('[data-preview]');
    if (b) openViewer(b.dataset.preview, b.dataset.label, +b.dataset.size);
  });
  $('weeks').addEventListener('change', function (e) {
    var c = e.target.closest('[data-done]');
    if (!c) return;
    if (c.checked) state.done[c.dataset.done] = true; else delete state.done[c.dataset.done];
    saveDone();
    c.closest('.card').classList.toggle('done', c.checked);
    renderProgress();
  });

  var qEl = $('q'), timer;
  qEl.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { state.q = qEl.value.trim(); render(); }, 120);
  });
  $('types').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-type]');
    if (!b) return;
    state.type = b.dataset.type;
    document.querySelectorAll('#types button').forEach(function (x) {
      x.setAttribute('aria-pressed', String(x === b));
    });
    render();
  });
  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (e.key === '/' && tag !== 'INPUT' && !viewer.open) { e.preventDefault(); qEl.focus(); }
    if (e.key === 'Escape' && document.activeElement === qEl && qEl.value) { qEl.value = ''; state.q = ''; render(); }
  });
  window.addEventListener('hashchange', markTarget);

  $('theme').addEventListener('click', function () {
    var cur = document.documentElement.dataset.theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('dl-theme', next); } catch (e) { /* ignore */ }
  });

  renderStats();
  render();
})();
