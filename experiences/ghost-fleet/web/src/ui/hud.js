import { FACTIONS } from '../sim/factions.js';

/** DOM overlay: fleet condition, counters, controls, idle statistics. */
export class HUD {
  constructor(world) {
    this.world = world;
    this.el = {
      hint: document.getElementById('hint'),
      splats: document.getElementById('splatCount'),
      fps: document.getElementById('fps'),
      idleSplats: document.getElementById('idleSplats'),
      idleFps: document.getElementById('idleFps'),
      idleShots: document.getElementById('idleShots'),
      camLabel: document.getElementById('camLabel'),
      stormLabel: document.getElementById('stormLabel'),
      fleetA: document.getElementById('fleetA'),
      fleetB: document.getElementById('fleetB')
    };

    this.marker = document.createElement('div');
    this.marker.className = 'marker';
    document.body.appendChild(this.marker);

    this.rows = new Map();
    this._acc = 0;
    this._handlers = [];

    document.querySelectorAll('.hud-bottom .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._handlers.forEach(h => h(btn.dataset.act));
        btn.classList.add('armed');
        setTimeout(() => btn.classList.remove('armed'), 260);
      });
    });

    this.rebuild();
  }

  onAction(fn) { this._handlers.push(fn); }
  setCamLabel(v) { this.el.camLabel.textContent = v; }
  setStormLabel(v) { this.el.stormLabel.textContent = v; }

  rebuild() {
    this.rows.clear();
    this.el.fleetA.innerHTML = '';
    this.el.fleetB.innerHTML = '';
    for (const ship of this.world.ships) {
      const host = ship.faction.key === FACTIONS.crimson.key ? this.el.fleetA : this.el.fleetB;
      const row = document.createElement('div');
      row.className = 'vessel';
      row.innerHTML = `<span class="nm">${ship.name}</span><span class="bar2"><i></i></span>`;
      row.querySelector('i').style.background = ship.faction.ui;
      host.appendChild(row);
      this.rows.set(ship, row);
    }
  }

  setTarget(ship) {
    for (const [s, row] of this.rows) row.classList.toggle('targeted', s === ship);
    this.el.hint.textContent = `Marked: ${ship.name} — the ${ship.faction.key === 'crimson' ? 'Azure' : 'Crimson'} fleet is answering`;
  }

  clearTarget() {
    for (const [, row] of this.rows) row.classList.remove('targeted');
    this.el.hint.textContent = 'Drag to orbit · tap a ship to mark your target · tap the sea for a ranging shot';
  }

  pingMarker(x, y) {
    this.marker.style.left = `${x}px`;
    this.marker.style.top = `${y}px`;
    this.marker.classList.remove('on');
    void this.marker.offsetWidth;   // restart the animation
    this.marker.classList.add('on');
    clearTimeout(this._mt);
    this._mt = setTimeout(() => this.marker.classList.remove('on'), 1900);
  }

  update(dt, { fps, mode, splats, shots }) {
    this._acc += dt;
    if (this._acc < 0.2) return;
    this._acc = 0;

    const f = Math.round(fps);
    const s = splats.toLocaleString();
    if (mode === 'idle') {
      this.el.idleSplats.textContent = s;
      this.el.idleFps.textContent = f;
      this.el.idleShots.textContent = shots.toLocaleString();
    } else {
      this.el.splats.textContent = s;
      this.el.fps.textContent = f;
    }

    for (const [ship, row] of this.rows) {
      const bar = row.querySelector('i');
      const v = ship.dead ? 0 : Math.max(0, ship.integrity);
      bar.style.width = `${(v * 100).toFixed(1)}%`;
      bar.style.background = v > 0.55 ? ship.faction.ui : v > 0.22 ? '#e0a23c' : '#d1453b';
      row.classList.toggle('gone', ship.dead || ship.sinking);
    }
  }
}
