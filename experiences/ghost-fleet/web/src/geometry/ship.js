import * as THREE from 'three';
import { SplatBuilder, surface, tube, cord, PART } from './splatbuilder.js';
import { makeRng } from './rng.js';
import { SHIP, beamProfile, sheer, keelDepth, sectionWidth, hullPoint } from './hull.js';

/**
 * Procedurally builds a galleon as a cloud of anisotropic Gaussians.
 *
 * Nothing here is a triangle mesh: the hull is a parametric surface sampled
 * into overlapping flat splats, masts and ropes are swept tubes of splats,
 * and the sails are billowing sheets. Because we author every Gaussian we
 * also own them at impact time, which is what makes the ships shatter into
 * a believable splat cloud instead of a particle puff.
 */

// The hull form itself lives in hull.js: gunnery, collision and the depth
// proxy all need the same shape, and none of them should depend on how many
// Gaussians are still alive.
export { SHIP };

// ---------------------------------------------------------------- palettes

const WOOD = [0x3a2a1c, 0x4a3524, 0x5b432c, 0x342518, 0x60492f, 0x2c1f14];
const DECK_WOOD = [0x8a7250, 0x9b8460, 0x7a6544, 0xa08a66];

function woodAt(rng, v, c, faction) {
  const plank = Math.floor(v * 26);
  c.setHex(WOOD[plank % WOOD.length]);
  // wales: two heavy dark rubbing strakes
  const wale = Math.exp(-Math.pow((v - 0.72) / 0.020, 2)) + Math.exp(-Math.pow((v - 0.60) / 0.016, 2));
  c.lerp(new THREE.Color(0x191009), Math.min(0.8, wale));
  // a narrow gilded sheer strake just under the rail, and the faction band above it
  const gild = Math.exp(-Math.pow((v - 0.905) / 0.014, 2));
  c.lerp(faction.gold, Math.min(0.75, gild));
  const band = Math.exp(-Math.pow((v - 0.955) / 0.022, 2));
  c.lerp(faction.trim, Math.min(0.7, band * 0.85));
  // below the waterline the hull is tarred and fouled
  if (v < 0.30) c.lerp(new THREE.Color(0x1b1a14), (0.30 - v) / 0.30 * 0.85);
  c.multiplyScalar(0.82 + 0.36 * Math.random());
  return c;
}

// ---------------------------------------------------------------- the build

export function buildShip({ seed = 1, faction, density = 1 } = {}) {
  const rng = makeRng(seed);
  const b = new SplatBuilder();
  const C = (hex) => new THREE.Color(hex);
  const f = faction;

  const gunPortsAt = [0.18, 0.29, 0.40, 0.51, 0.62, 0.73];
  // a gun port is roughly a square metre on a 36 m hull, so it needs to be
  // big enough to read from across the sea, not a pinhole
  const GUN_V = 0.76, GUN_HALF_T = 0.026, GUN_HALF_V = 0.085;

  const isGunPort = (u, v) => {
    if (Math.abs(v - GUN_V) > GUN_HALF_V) return false;
    for (const g of gunPortsAt) if (Math.abs(u - g) < GUN_HALF_T) return true;
    return false;
  };

  // ---- planked hull, both sides
  for (const side of [1, -1]) {
    surface(b, (u, v, o) => hullPoint(u, v, side, o),
      Math.round(142 * density), Math.round(50 * density), {
        thickness: 0.05, part: PART.HULL, opacity: 1, rng,
        colorAt: (u, v, c) => woodAt(rng, v, c, f),
        skip: isGunPort
      });
  }

  // ---- inner shell: a dark second skin just inside the planking, so a
  // breach opens onto a shadowed gun deck instead of showing daylight
  // straight through to the far side of the ship
  for (const side of [1, -1]) {
    surface(b, (u, v, o) => {
      hullPoint(u, v, side, o);
      o.p.z *= 0.86;
      o.p.y += 0.06;
    }, Math.round(96 * density), Math.round(34 * density), {
      thickness: 0.06, part: PART.HULL, opacity: 1, rng, maxSize: 0.40,
      colorAt: (u, v, c) => {
        // charred frames and beams, catching a little light near the deck head
        c.setRGB(0.038, 0.030, 0.023);
        const frame = Math.abs(((u * 44) % 1) - 0.5) > 0.36 ? 1.9 : 1.0;
        return c.multiplyScalar(frame * (0.7 + 0.6 * rng()) * (0.55 + 0.75 * v));
      }
    });
  }

  // ---- transom (flat stern face) with the captain's gallery
  surface(b, (u, v, o) => {
    const t = 0.0;
    const half = (SHIP.B / 2) * beamProfile(t) * 0.96;
    const kd = keelDepth(t), top = SHIP.FREEBOARD + sheer(t) + 1.6;
    const z = (u * 2 - 1) * half * sectionWidth(Math.max(0.25, v));
    const y = -kd * 0.6 + (top + kd * 0.6) * v;
    o.p.set(-SHIP.L / 2 - 0.35 * v, y, z);
    o.du.set(0, 0, 2 * half * sectionWidth(Math.max(0.25, v)));
    o.dv.set(-0.35, top + kd * 0.6, 0);
  }, Math.round(42 * density), Math.round(40 * density), {
    thickness: 0.05, part: PART.HULL, opacity: 1, rng,
    colorAt: (u, v, c) => {
      woodAt(rng, v * 0.9, c, f);
      // stern gallery: two rows of small leaded panes set in a dark frame
      if (v > 0.56 && v < 0.86 && u > 0.16 && u < 0.84) {
        const gx = Math.abs(Math.sin(u * Math.PI * 7.0));
        const gy = Math.abs(Math.sin((v - 0.56) / 0.30 * Math.PI * 2.0));
        c.setHex(0x1a120a);                                  // the frame
        if (gx > 0.42 && gy > 0.42) {
          c.setRGB(0.55, 0.36, 0.14).multiplyScalar(0.8 + 0.5 * rng());   // warm glass
        }
      }
      return c;
    }
  });

  // ---- weather deck
  const deckY = (t) => SHIP.FREEBOARD + sheer(t) - 0.55;
  surface(b, (u, v, o) => {
    const t = 0.08 + u * 0.84;
    const half = (SHIP.B / 2) * beamProfile(t) * sectionWidth(0.86);
    const z = (v * 2 - 1) * half;
    o.p.set(SHIP.L * (t - 0.5), deckY(t) - 0.02 * Math.abs(v * 2 - 1), z);
    o.du.set(SHIP.L * 0.84, 0, 0);
    o.dv.set(0, 0, 2 * half);
  }, Math.round(96 * density), Math.round(38 * density), {
    thickness: 0.05, part: PART.DECK, opacity: 1, rng,
    colorAt: (u, v, c) => {
      c.setHex(DECK_WOOD[Math.floor(Math.abs(v * 2 - 1) * 30) % DECK_WOOD.length]);
      c.multiplyScalar(0.80 + 0.30 * rng());
      return c;
    }
  });

  // ---- raised quarterdeck & forecastle
  const platform = (t0, t1, y, shrink) => {
    surface(b, (u, v, o) => {
      const t = t0 + u * (t1 - t0);
      const half = (SHIP.B / 2) * beamProfile(t) * sectionWidth(0.86) * shrink;
      o.p.set(SHIP.L * (t - 0.5), y + sheer(t) * 0.5, (v * 2 - 1) * half);
      o.du.set(SHIP.L * (t1 - t0), 0, 0);
      o.dv.set(0, 0, 2 * half);
    }, Math.round(34 * density), Math.round(30 * density), {
      thickness: 0.05, part: PART.DECK, opacity: 1, rng,
      colorAt: (u, v, c) => c.setHex(DECK_WOOD[Math.floor(Math.abs(v * 2 - 1) * 24) % 4]).multiplyScalar(0.78 + 0.3 * rng())
    });
  };
  platform(0.02, 0.26, SHIP.FREEBOARD + 1.35, 0.95);   // quarterdeck (aft)
  platform(0.80, 0.97, SHIP.FREEBOARD + 1.05, 0.9);    // forecastle

  // ---- rails / bulwark capping
  for (const side of [1, -1]) {
    tube(b, (t, o) => {
      const tt = 0.04 + t * 0.93;
      const half = (SHIP.B / 2) * beamProfile(tt) * sectionWidth(1.0);
      o.set(SHIP.L * (tt - 0.5), SHIP.FREEBOARD + sheer(tt), side * half);
    }, () => 0.14, Math.round(86 * density), 5, {
      color: C(0x1d140c), part: PART.RAIL, opacity: 1, rng, thickness: 0.05,
      colorAt: (t, a, c) => c.copy(f.trim).multiplyScalar(0.55 + 0.5 * rng())
    });
  }

  // ---- gun ports: dark interior, open lid, protruding barrel
  for (const side of [1, -1]) {
    for (const g of gunPortsAt) {
      const o = { p: new THREE.Vector3(), du: new THREE.Vector3(), dv: new THREE.Vector3() };
      hullPoint(g, GUN_V, side, o);
      const port = o.p.clone();

      // the true outward normal of the hull at this point, not just +/-z
      const nrm = new THREE.Vector3().crossVectors(o.du, o.dv).normalize();
      if (nrm.z * side < 0) nrm.negate();
      const up = new THREE.Vector3(0, 1, 0);
      const across = new THREE.Vector3().crossVectors(up, nrm).normalize();

      const PW = 1.30, PH = 1.15;   // port width and height

      // the gun deck seen through the opening: near black, with a hint of
      // lamplight on the deck head so it does not read as a painted patch
      surface(b, (u, v, oo) => {
        oo.p.copy(port)
          .addScaledVector(nrm, -0.55)
          .addScaledVector(across, (u - 0.5) * PW)
          .addScaledVector(up, (v - 0.5) * PH);
        oo.du.copy(across).multiplyScalar(PW);
        oo.dv.copy(up).multiplyScalar(PH);
      }, 14, 13, {
        thickness: 0.04, part: PART.HULL, opacity: 1, rng, maxSize: 0.2,
        colorAt: (u, v, c) => c.setRGB(0.030, 0.022, 0.016)
          .multiplyScalar(1 + 2.6 * Math.pow(Math.max(0, v - 0.7) / 0.3, 2))
      });

      // the lid, hinged at the top and triced up out of the way
      surface(b, (u, v, oo) => {
        // hinged along the top of the port and triced part-way up
        const swing = 0.78;                       // radians open
        const r = PH * 0.88 * v;
        oo.p.copy(port)
          .addScaledVector(across, (u - 0.5) * PW * 1.04)
          .addScaledVector(up, PH * 0.5 + r * Math.sin(swing))
          .addScaledVector(nrm, r * Math.cos(swing) + 0.10);
        oo.du.copy(across).multiplyScalar(PW);
        oo.dv.copy(up).multiplyScalar(PH * 0.88);
      }, 13, 12, {
        thickness: 0.05, part: PART.HULL, opacity: 1, rng, maxSize: 0.2,
        colorAt: (u, v, c) => {
          // planked outboard face, painted inboard in the faction colour
          c.setHex(WOOD[Math.floor(v * 5) % WOOD.length]).multiplyScalar(0.85 + 0.3 * rng());
          c.lerp(f.trim, 0.42 * v);          // painted inboard, bare timber at the hinge
          return c;
        }
      });

      // the barrel, run out through the port
      const muzzle = port.clone().addScaledVector(nrm, 1.45);
      tube(b, (t, oo) => oo.copy(port).addScaledVector(nrm, -0.45 + t * 1.90),
        (t) => 0.30 - 0.10 * t * t, 16, 9, {
          part: PART.CANNON, opacity: 1, rng, thickness: 0.045, color: C(0x15171b),
          colorAt: (t, a, c) => {
            // cast iron, with reinforcing rings at the breech
            const ring = Math.abs(Math.sin(t * 9.0)) > 0.94 ? 1.5 : 1.0;
            c.setRGB(0.055, 0.058, 0.068).multiplyScalar(ring * (0.85 + 0.35 * rng()));
            return c;
          }
        });

      // cap the muzzle so we do not look down an open pipe
      surface(b, (u, v, oo) => {
        const a = u * Math.PI * 2, r = v * 0.20;
        oo.p.copy(muzzle)
          .addScaledVector(across, Math.cos(a) * r)
          .addScaledVector(up, Math.sin(a) * r);
        oo.du.copy(across).multiplyScalar(0.42);
        oo.dv.copy(up).multiplyScalar(0.42);
      }, 10, 5, {
        thickness: 0.04, part: PART.CANNON, opacity: 1, rng, maxSize: 0.12,
        colorAt: (u, v, c) => c.setRGB(0.012, 0.012, 0.014)
      });
    }
  }

  // ---- masts, spars, sails, rigging
  // [heightFraction, halfWidth, drop] — courses are wide and deep, topsails taper
  const masts = [
    { t: 0.21, h: 19.5, r: 0.32, sails: [[0.30, 7.0, 6.0], [0.58, 5.8, 4.6], [0.80, 3.9, 3.1]] },  // mizzen (aft)
    { t: 0.49, h: 25.0, r: 0.40, sails: [[0.25, 9.8, 7.8], [0.53, 8.2, 6.3], [0.76, 5.6, 4.2]] },  // main
    { t: 0.78, h: 20.5, r: 0.32, sails: [[0.28, 8.0, 6.6], [0.56, 6.7, 5.1], [0.79, 4.4, 3.4]] }   // fore
  ];

  const BRACE = 0.42;                  // radians the yards are swung round
  const cb = Math.cos(BRACE), sb = Math.sin(BRACE);
  /** Rotate a point in the yard's plane about the mast's vertical axis. */
  const brace = (ox, oz) => [ox * cb - oz * sb, ox * sb + oz * cb];

  const mastTops = [];
  for (const m of masts) {
    const baseY = deckY(m.t);
    const x = SHIP.L * (m.t - 0.5);
    const rake = 0.55 * (m.t - 0.5);   // masts rake aft slightly
    const topPt = new THREE.Vector3(x - rake * m.h * 0.12, baseY + m.h, 0);
    mastTops.push(topPt);

    tube(b, (t, o) => o.set(x - rake * t * m.h * 0.12, baseY - 2.2 + t * (m.h + 2.2), 0),
      (t) => m.r * (1 - 0.55 * t), Math.round(60 * density), Math.round(9 * density), {
        color: C(0x584936), part: PART.MAST, opacity: 1, rng, thickness: 0.05,
        colorAt: (t, a, c) => c.setHex(0x54402c).multiplyScalar(0.86 + 0.28 * rng())
      });

    // yards + sails
    for (const [hf, half, sh] of m.sails) {
      const yy = baseY + m.h * hf;
      const yx = x - rake * (m.h * hf) * 0.12;

      tube(b, (t, o) => {
        const [bx, bz] = brace(0, (t * 2 - 1) * half);
        o.set(yx + bx, yy + Math.pow(Math.abs(t * 2 - 1), 2) * 0.35, bz);
      }, (t) => 0.17 * (1 - 0.5 * Math.abs(t * 2 - 1)), Math.round(34 * density), 6, {
          color: C(0x4b3826), part: PART.MAST, opacity: 1, rng, thickness: 0.04
        });

      // the sail: a sheet that bellies away from the wind
      const belly = 1.35;
      surface(b, (u, v, o) => {
        const zz = (u * 2 - 1) * half * (1 - 0.07 * v);
        // the sail bellies away from the wind, deepest at its middle
        const bow = Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 1.15)) * belly;
        const ripple = 0.14 * Math.sin(u * 13.0 + v * 4.0) * Math.sin(Math.PI * u);
        const [bx, bz] = brace(-bow - ripple, zz);
        o.p.set(yx + bx, yy - v * sh + Math.pow(Math.sin(Math.PI * u), 1.5) * 0.30 * v, bz);
        const [dux, duz] = brace(0, 2 * half);
        const [dvx, dvz] = brace(-0.2, 0);
        o.du.set(dux, 0, duz);
        o.dv.set(dvx, -sh, dvz);
      }, Math.round(46 * density), Math.round(32 * density), {
        thickness: 0.055, part: PART.SAIL, opacity: 1, rng, sizeBoost: 1.08,
        colorAt: (u, v, c) => {
          c.setRGB(0.86, 0.82, 0.73);
          // seams every few panels, plus grime toward the foot
          const seam = Math.abs(((u * 9) % 1) - 0.5) > 0.46 ? 0.72 : 1;
          c.multiplyScalar(seam * (0.86 + 0.22 * rng()) * (1 - 0.16 * v));
          // faction device printed on the main course
          if (f.device && half > 7 && v > 0.18 && v < 0.82) {
            const d = f.device(u, (v - 0.18) / 0.64);
            if (d > 0) c.lerp(f.sail, Math.min(1, d));
          }
          return c;
        }
      });
    }

    // shrouds: ratline ladders from the channels up to the masthead
    for (const side of [1, -1]) {
      const hp = { p: new THREE.Vector3(), du: new THREE.Vector3(), dv: new THREE.Vector3() };
      for (let k = 0; k < 6; k++) {
        hullPoint(m.t + (k - 2.5) * 0.018, 0.97, side, hp);
        const a = hp.p.clone();
        const z2 = topPt.clone();
        z2.y -= 3.2;
        z2.z += side * 0.35;
        cord(b, a, z2, 0.045, {
          color: C(0x352719), part: PART.RIGGING, opacity: 1, rng, thickness: 0.04
        });
      }
    }
  }

  // ---- fore/aft stays and a bowsprit
  const bowTip = new THREE.Vector3(SHIP.L / 2 + 7.0, SHIP.FREEBOARD + 3.4, 0);
  tube(b, (t, o) => o.set(SHIP.L * 0.40 + t * (bowTip.x - SHIP.L * 0.40), deckY(0.95) + t * (bowTip.y - deckY(0.95)), 0),
    (t) => 0.22 * (1 - 0.5 * t), Math.round(40 * density), 7, {
      color: C(0x584936), part: PART.MAST, opacity: 1, rng, thickness: 0.05
    });

  cord(b, mastTops[2].clone().setY(mastTops[2].y - 1.0), bowTip, 0.055,
    { color: C(0x352719), part: PART.RIGGING, opacity: 1, rng, thickness: 0.04 });
  cord(b, mastTops[1].clone().setY(mastTops[1].y - 1.0), mastTops[2].clone().setY(mastTops[2].y - 4.0), 0.055,
    { color: C(0x352719), part: PART.RIGGING, opacity: 1, rng, thickness: 0.04 });
  cord(b, mastTops[0].clone().setY(mastTops[0].y - 1.0), mastTops[1].clone().setY(mastTops[1].y - 5.0), 0.055,
    { color: C(0x352719), part: PART.RIGGING, opacity: 1, rng, thickness: 0.04 });

  // ---- pennants
  masts.forEach((m, i) => {
    const top = mastTops[i];
    const len = 5.2 - i * 0.6;
    surface(b, (u, v, o) => {
      const wave = Math.sin(u * 5.0) * 0.55 * u;
      o.p.set(top.x - u * len, top.y + 0.9 - v * (0.95 - 0.5 * u) + wave * 0.35, wave);
      o.du.set(-len, 0, Math.cos(u * 5.0) * 5.0 * 0.55 * u);
      o.dv.set(0, -(0.95 - 0.5 * u), 0);
    }, Math.round(30 * density), Math.round(9 * density), {
      thickness: 0.04, part: PART.FLAG, opacity: 1, rng, sizeBoost: 1.1,
      colorAt: (u, v, c) => c.copy(v < 0.5 ? f.flagA : f.flagB).multiplyScalar(0.85 + 0.3 * rng())
    });
  });

  // ---- stern lanterns (the only emissive geometry on the ship)
  const lanternSpots = [
    new THREE.Vector3(-SHIP.L / 2 + 0.6, SHIP.FREEBOARD + 3.4, 0),
    new THREE.Vector3(-SHIP.L / 2 + 1.4, SHIP.FREEBOARD + 2.9, 1.9),
    new THREE.Vector3(-SHIP.L / 2 + 1.4, SHIP.FREEBOARD + 2.9, -1.9)
  ];
  for (const s of lanternSpots) {
    for (let i = 0; i < Math.round(120 * density); i++) {
      const r = 0.22 + 0.34 * Math.pow(rng(), 0.6);
      const th = rng() * Math.PI * 2, ph = Math.acos(rng() * 2 - 1);
      const p = new THREE.Vector3(
        s.x + r * Math.sin(ph) * Math.cos(th),
        s.y + r * Math.cos(ph) * 1.25,
        s.z + r * Math.sin(ph) * Math.sin(th)
      );
      const c = new THREE.Color(0xffb257).lerp(new THREE.Color(0xfff0c8), rng() * 0.6);
      b.pushBlob(p, 0.075, 0.075, 0.075, c, 0.30, PART.LANTERN, 0.55 * (1 - r));
    }
  }

  return b.finish();
}
