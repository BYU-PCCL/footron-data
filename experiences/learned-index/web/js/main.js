/* The loop, the HUD and every input: autoplay rotation, the desktop dock and
 * keyboard, and the phone over Footron's socket. All three inputs go through
 * `cmd`, so they behave identically.
 *
 * URL options
 *   ?scene=<id>      start on one structure
 *   ?interactive     desktop: start in interactive mode with the dock pinned
 *   ?speed=<x>       global speed multiplier
 *   ?ftmsg=1         force the phone-controls client on (local testing)
 *   ?warp=<s>        fast-forward the first scene by s seconds (screenshots, tiles)
 *   ?clean           hide the HUD (launcher tiles)
 */
(function () {
  'use strict';
  const DS = window.DS;
  const scenes = DS.scenes;
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);

  const IDLE = 60;         // seconds without input before the wall takes itself back
  const FADE_OUT = 0.45, FADE_IN = 0.7;
  const NOTE_EVERY = 10;

  const canvas = $('c');
  const g = canvas.getContext('2d');

  const st = {
    i: 0,
    mode: 'attract',       // 'attract' | 'interactive'
    paused: false,
    speed: DS.clamp(parseFloat(params.get('speed')) || 1, 0.25, 3),
    t: 0,
    sceneT: 0,
    lastInput: -1e9,
    autoHold: 0,
    fade: 0,
    pending: -1,
    pinned: params.has('interactive'),
  };
  const cur = () => scenes[st.i];
  // A standalone package ships exactly one scene: no counter, no dots, no
  // rotation — the scene's own script loops for the whole Footron slot.
  const single = scenes.length === 1;
  if (single) document.body.classList.add('single');

  /* ---------------- layout ---------------- */

  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    DS.u = Math.min(W / 1920, H / 1080);
    // ?clean (launcher tiles) has no HUD, so the picture gets the whole sheet.
    const clean = params.has('clean');
    const x = W * 0.05, x1 = W * 0.95;
    const y = H * (clean ? 0.07 : 0.24), y1 = H * (clean ? 0.93 : 0.83);
    DS.stage = { x, y, x1, y1, w: x1 - x, h: y1 - y, cx: (x + x1) / 2, cy: (y + y1) / 2 };
    DS.W = W; DS.H = H;
    const s = cur();
    if (s && s.resize) s.resize();
  }
  window.addEventListener('resize', resize);

  /* ---------------- HUD ---------------- */

  const el = {
    eyebrow: $('eyebrow'), name: $('name'), idea: $('idea'), legend: $('legend'), stats: $('stats'),
    op: $('op'), note: $('note'), mode: $('mode'), dots: $('dots'), bar: $('bar').firstElementChild,
    dockScenes: $('dock-scenes'), dockActions: $('dock-actions'),
  };

  const OP_MIN = 1.6;          // seconds a message stays before the next may replace it
  let opTimer = 0, opShown = -1e9, opPending = null;
  function showOp(text, tone) {
    el.op.textContent = text;
    el.op.className = tone || '';
    opTimer = 7;
    opShown = st.t;
  }
  DS.say = (text, tone) => {
    // outcomes (coloured) jump the queue only if nothing coloured is still fresh
    if (st.t - opShown >= OP_MIN) showOp(text, tone);
    else opPending = [text, tone];
  };

  let noteI = 0, noteT = 0;
  function showNote(i) {
    const s = cur();
    if (!s.notes || !s.notes.length) return;
    noteI = i % s.notes.length;
    el.note.classList.remove('visible');
    setTimeout(() => {
      el.note.innerHTML = s.notes[noteI];
      el.note.classList.add('visible');
    }, 450);
  }

  let statsKey = '', statsT = 0;
  function renderStats() {
    const rows = cur().stats ? cur().stats() : [];
    const key = rows.map((r) => r.k + r.v + (r.accent ? 1 : 0)).join('|');
    if (key === statsKey) return;
    statsKey = key;
    // the accented stat is the headline: drawn last (rightmost) and big
    const ordered = rows.filter((r) => !r.accent).concat(rows.filter((r) => r.accent));
    el.stats.innerHTML = ordered
      .map((r) => `<div class="stat${r.accent ? ' hero' : ''}"><div class="v${r.accent ? ' accent' : ''}">${r.v}</div><div class="k">${r.k}</div></div>`)
      .join('');
  }

  function renderHeader() {
    const s = cur();
    const n = String(st.i + 1).padStart(2, '0');
    el.eyebrow.innerHTML = single
      ? `Data structures &nbsp;·&nbsp; <b>${s.tag || ''}</b>`
      : `Data structures &nbsp;·&nbsp; ${n} / ${String(scenes.length).padStart(2, '0')} &nbsp;·&nbsp; <b>${s.tag || ''}</b>`;
    el.name.textContent = s.title;
    el.idea.textContent = s.idea;
    el.legend.innerHTML = (s.legend || [])
      .map(([c, label]) => `<span><i style="background:${DS.C[c] || c}"></i>${label}</span>`)
      .join('');
    el.dots.innerHTML = scenes.map((_, j) => `<i class="${j === st.i ? 'on' : ''}"></i>`).join('');
    statsKey = '';
    renderStats();
    renderDock();
  }

  function renderMode() {
    const bits = [];
    if (st.mode === 'interactive') bits.push('interactive');
    else bits.push(onWall ? 'autoplay' : 'autoplay — move the mouse to take over');
    if (st.paused) bits.push('paused');
    if (st.speed !== 1) bits.push(`${st.speed}×`);
    el.mode.textContent = bits.join(' · ');
    el.mode.classList.toggle('live', st.mode === 'interactive');
    renderDock();
  }

  /* ---------------- desktop dock ---------------- */

  function renderDock() {
    // grouped, so two dozen structures read as a handful of families
    const groups = [];
    scenes.forEach((s, j) => {
      let grp = groups.find((x) => x.name === (s.group || ''));
      if (!grp) groups.push((grp = { name: s.group || '', items: [] }));
      grp.items.push(`<button data-scene="${s.id}" class="${j === st.i ? 'on' : ''}">${s.title}</button>`);
    });
    el.dockScenes.innerHTML = groups.map((grp) => `<span class="grp">${grp.name}</span>${grp.items.join('')}`).join('');
    const acts = (cur().actions || [])
      .map((a, j) => `<button class="act" data-action="${a.id}">${a.label}<kbd>${j + 1}</kbd></button>`)
      .join('');
    el.dockActions.innerHTML =
      acts +
      `<span class="sep"></span>` +
      `<button data-cmd="pause">${st.paused ? 'Play' : 'Pause'}<kbd>space</kbd></button>` +
      [0.5, 1, 2].map((v) => `<button data-speed="${v}" class="${st.speed === v ? 'on' : ''}">${v}×</button>`).join('') +
      `<span class="sep"></span>` +
      `<button data-cmd="release">Autoplay<kbd>A</kbd></button>`;
  }

  $('dock').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.scene) cmd.scene(b.dataset.scene);
    else if (b.dataset.action) cmd.action(b.dataset.action);
    else if (b.dataset.speed) cmd.speed(parseFloat(b.dataset.speed));
    else if (b.dataset.cmd === 'pause') cmd.pause(!st.paused);
    else if (b.dataset.cmd === 'release') cmd.release();
  });

  let dockT = 0, overDock = false;
  $('dock').addEventListener('mouseenter', () => { overDock = true; });
  $('dock').addEventListener('mouseleave', () => { overDock = false; });
  function pokeDock() {
    if (document.body.classList.contains('footron')) return;
    dockT = 4;
    document.body.classList.add('dock-on');
  }

  /* ---------------- commands (dock, keys and phone all land here) ---------------- */

  function activity() {
    st.lastInput = st.t;
    if (st.mode !== 'interactive') {
      st.mode = 'interactive';
      renderMode();
      broadcast();
    }
  }

  // Autoplay order. A Footron slot is a few minutes — about five scenes — so
  // the structures a passer-by gets at a glance (glance: 1) come first, in a
  // fresh random order each run, and the rest follow.
  let playlist = [], pi = 0;
  function buildPlaylist() {
    const tier = (t) => DS.shuffle(scenes.map((s, j) => j).filter((j) => (scenes[j].glance || 2) === t));
    playlist = tier(1).concat(tier(2));
    pi = 0;
  }
  function nextInPlaylist() {
    if (!playlist.length) buildPlaylist();
    const at = playlist.indexOf(st.i);
    pi = (at >= 0 ? at : pi) + 1;
    if (pi >= playlist.length) { buildPlaylist(); }
    return playlist[pi % playlist.length];
  }

  function switchTo(i) {
    i = ((i % scenes.length) + scenes.length) % scenes.length;
    if (st.pending >= 0) { st.pending = i; return; }
    st.pending = i;
  }

  function enter(i) {
    st.i = i;
    st.sceneT = 0;
    st.autoHold = 0;
    const s = cur();
    s.init();
    if (s.resize) s.resize();
    el.op.textContent = '';
    opPending = null;
    opShown = -1e9;
    renderHeader();
    noteT = 0;
    showNote(0);
    broadcast();
  }

  const cmd = {
    scene(id) {
      const i = scenes.findIndex((s) => s.id === id);
      if (i < 0) return false;
      activity();
      if (i !== st.i || st.pending >= 0) switchTo(i);
      return true;
    },
    step(d) { activity(); switchTo((st.pending >= 0 ? st.pending : st.i) + d); },
    action(id) {
      const s = cur();
      if (st.pending >= 0 || !(s.actions || []).some((a) => a.id === id)) return false;
      activity();
      st.autoHold = st.t + 14;   // let the visitor's op play out before autoplay resumes
      s.act(id);
      return true;
    },
    pause(v) { activity(); st.paused = v; renderMode(); broadcast(); },
    speed(v) { activity(); st.speed = v; renderMode(); broadcast(); },
    release() {
      st.mode = 'attract';
      st.paused = false;
      st.speed = 1;
      st.autoHold = 0;
      st.sceneT = 0;
      renderMode();
      broadcast();
    },
  };
  DS.cmd = cmd;

  /* ---------------- keyboard & pointer ---------------- */

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    pokeDock();
    const k = e.key;
    if (k === 'ArrowRight') cmd.step(1);
    else if (k === 'ArrowLeft') cmd.step(-1);
    else if (k === ' ') { e.preventDefault(); cmd.pause(!st.paused); }
    else if (k === 'a' || k === 'A') cmd.release();
    else if (k === '+' || k === '=') cmd.speed(Math.min(3, st.speed * 2));
    else if (k === '-') cmd.speed(Math.max(0.25, st.speed / 2));
    else if (/^[1-9]$/.test(k)) {
      const a = (cur().actions || [])[+k - 1];
      if (a) cmd.action(a.id);
    }
  });

  function pointer(type, e) {
    const s = cur();
    if (type === 'down') activity();
    if (s.pointer && st.pending < 0) s.pointer(type, e.clientX, e.clientY);
  }
  canvas.addEventListener('pointermove', (e) => { pokeDock(); pointer('move', e); });
  canvas.addEventListener('pointerdown', (e) => pointer('down', e));
  canvas.addEventListener('pointerleave', (e) => pointer('leave', e));

  /* ---------------- Footron ---------------- */

  const onWall = window.DSFootron && window.DSFootron.footronEnabled();
  if (onWall) document.body.classList.add('footron');
  const link = window.DSFootron
    ? window.DSFootron.connect({
        onHello: () => broadcast(),
        onScene: (id) => cmd.scene(id),
        onAction: (id) => cmd.action(id),
        onPause: (v) => cmd.pause(v),
        onSpeed: (v) => cmd.speed(v),
        onRelease: () => cmd.release(),
      })
    : { send() {} };

  function broadcast() {
    const s = cur();
    if (!s) return;
    link.send({
      type: 'state',
      scene: s.id,
      mode: st.mode,
      paused: st.paused,
      speed: st.speed,
      scenes: scenes.map((x) => ({ id: x.id, title: x.title, group: x.group || '' })),
      actions: (s.actions || []).map((a) => ({ id: a.id, label: a.label })),
    });
  }

  /* ---------------- loop ---------------- */

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    st.t += dt;
    DS.time = st.t;

    // Scene transitions: fade out, swap, fade in.
    if (st.pending >= 0) {
      st.fade -= dt / FADE_OUT;
      if (st.fade <= 0) {
        st.fade = 0;
        const i = st.pending;
        st.pending = -1;
        enter(i);
      }
    } else if (st.fade < 1) {
      st.fade = Math.min(1, st.fade + dt / FADE_IN);
    }
    const f = DS.smooth(st.fade);
    canvas.style.opacity = f.toFixed(3);
    $('title').style.opacity = f.toFixed(3);
    $('stats').style.opacity = f.toFixed(3);

    const s = cur();
    const sdt = st.paused ? 0 : dt * st.speed;
    if (st.pending < 0) {
      st.sceneT += sdt;
      const auto = st.t >= st.autoHold;
      s.update(sdt, auto);
    }

    // Autoplay rotation and the idle hand-back.
    if (!single && st.mode === 'attract' && st.pending < 0 && st.sceneT > (s.duration || 60)) switchTo(nextInPlaylist());
    if (st.mode === 'interactive' && !st.pinned && st.t - st.lastInput > IDLE) cmd.release();
    if (!single) el.bar.style.width = st.mode === 'attract' ? `${Math.min(100, (100 * st.sceneT) / (s.duration || 60))}%` : '100%';

    // Captions.
    if (opPending && st.t - opShown >= OP_MIN) { const [t, tone] = opPending; opPending = null; showOp(t, tone); }
    if (opTimer > 0) { opTimer -= dt; if (opTimer <= 0) el.op.classList.add('stale'); }
    noteT += dt;
    if (noteT > NOTE_EVERY) { noteT = 0; showNote(noteI + 1); }
    statsT -= dt;
    if (statsT <= 0) { statsT = 0.2; renderStats(); }

    // Dock auto-hide.
    if (!st.pinned && !overDock && dockT > 0) {
      dockT -= dt;
      if (dockT <= 0) document.body.classList.remove('dock-on');
    }

    // Paint.
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    s.draw(g);

    requestAnimationFrame(frame);
  }

  /* ---------------- boot ---------------- */

  resize();
  const first = scenes.findIndex((s) => s.id === params.get('scene'));
  if (st.pinned) {
    st.mode = 'interactive';
    document.body.classList.add('dock-on');
  }
  // A Footron slot is ~5 minutes and the tour is 16 scenes, so each run starts
  // somewhere different rather than always showing the same first five.
  buildPlaylist();
  enter(first >= 0 ? first : st.pinned ? 0 : playlist[0]);
  renderMode();
  const warp = Math.min(600, parseFloat(params.get('warp')) || 0);
  for (let t = 0; t < warp; t += 1 / 30) { DS.time = st.t += 1 / 30; cur().update(1 / 30, true); }
  if (warp) st.fade = 1;
  if (params.has('clean')) document.querySelectorAll('.hud').forEach((e) => { e.style.display = 'none'; });
  requestAnimationFrame(frame);
})();
