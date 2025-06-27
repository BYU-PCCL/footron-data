export function easeOutSine(t) {
  return Math.sin((t * Math.PI) / 2);
}

export function bounce(t) {
  let x = Math.abs(t);
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
}

export function inOutExpo(t) {
  return t === 0
    ? 0
    : t === 1
    ? 1
    : t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

export function easeInOut(t, amt = 2) {
  let tPow = Math.pow(t, amt);
  return tPow / (tPow + Math.pow(1 - t, amt));
}

export function sinEaseInOut(t) {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

export function smallEaseInOut(t, a, b) {
  // maximum slope, during the constant part
  let m = 1 / (1 - a - b);

  // f0
  if (t < a) {
    return 0;
  }

  // f1
  if (t < b) {
    return (m / 2 / (b - a)) * (t - a) * (t - a);
  }

  // f2
  if (t < 1 - b) {
    return (
      m * (t - b) + // constant line part
      (m / 2) * (b - a)
    ); // maximum value of f1
  }

  // use symmetry powers
  return 1 - smallEaseInOut(1 - t, a, b);
}

export function slurp(val1, val2, amt) {
  return val2 * amt + val1 * (1 - amt);
}

export function experp(val1, val2, amt) {
  return Math.exp(slurp(Math.log(val1), Math.log(val2), amt));
}

export function clampedSlurp(val1, val2, amt) {
  if (amt < 0) {
    return val1;
  }
  if (amt > 1) {
    return val2;
  }
  return slurp(val1, val2, amt);
}

export function clamp(amt, val1, val2) {
  if (amt < val1) {
    return val1;
  }
  if (amt > val2) {
    return val2;
  }
  return amt;
}

/**
 * Extracts a 0-1 interval from a section of a 0-1 interval
 *
 * For example, if min == 0.3 and max == 0.7, you get:
 *
 *           0.3  0.7
 *     t: 0 --+----+-- 1
 *           /      \
 *          /        \
 *         /          \
 *     -> 0 ---------- 1
 *
 * Useful for making sub animations.
 *
 * Doesn't do any clamping, so you might want to clamp yourself.
 */
export function divideInterval(t, min, max) {
  return (t - min) / (max - min);
}

/**
 * Does a positive modulo
 * @param {number} a The thing being modulo'd
 * @param {number} b The divider thing
 * @returns {number} a % b
 */
export function posMod(a, b) {
  let out = a % b;
  if (out < 0) {
    out += b;
  }
  return out;
}

export function isAprilFools() {
  const today = new Date();
  // Month is zero indexed; day is not.
  return today.getMonth() === 3 && today.getDate() === 1;
};
