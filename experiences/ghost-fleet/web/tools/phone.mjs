/**
 * The phone controls' end of the wall.
 *
 * This exists because `connectFootron` failed silently for a whole release:
 * `FootronMessaging` is a UMD namespace, not a factory, so calling it threw a
 * TypeError which the catch reported as "not running on the wall". Everything
 * downstream was fine and the phone just said "disconnected".
 *
 * So the test is deliberately not a screenshot. It stubs the global with the
 * same *shape* the real UMD bundle has — an object carrying a `Messaging`
 * class — and asserts that the wall constructs it, mounts it, listens, and
 * routes each message in the protocol to the right call on the api.
 */
import { connectFootron, footronEnabled } from '../src/footron.js';

let mounted = 0, listeners = [];
class FakeMessaging {
  constructor(url) { this.url = url; }
  mount() { mounted++; return Promise.resolve(); }
  addMessageListener(fn) { listeners.push(fn); }
}
globalThis.FootronMessaging = { Connection: class {}, Messaging: FakeMessaging };

const calls = [];
const api = {
  markInput: () => calls.push('markInput'),
  volley: (f) => calls.push(`volley:${f}`),
  target: (i) => calls.push(`target:${i}`),
  camera: (m) => calls.push(`camera:${m}`),
  storm: (b) => calls.push(`storm:${b}`),
  reset: () => calls.push('reset'),
  replay: () => calls.push('replay'),
  release: () => calls.push('release')
};

const fails = [];
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails.push(`${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}`);
};

const res = connectFootron(api, { enabled: true });
check('connects', res.connected, true);
check('mounts', mounted, 1);
check('listens', listeners.length, 1);

const send = (msg) => { calls.length = 0; listeners.forEach(fn => fn(msg)); return calls.slice(); };

check('fire crimson', send({ type: 'fire', value: 'crimson' }), ['markInput', 'volley:crimson']);
check('fire both',    send({ type: 'fire', value: 'both' }),    ['markInput', 'volley:crimson', 'volley:azure']);
check('target',       send({ type: 'target', value: 2 }),       ['markInput', 'target:2']);
check('camera',       send({ type: 'camera', value: 'cinematic' }), ['markInput', 'camera:cinematic']);
check('storm on',     send({ type: 'storm', value: true }),     ['markInput', 'storm:true']);
check('reset',        send({ type: 'reset' }),                  ['markInput', 'reset']);
check('replay',       send({ type: 'replay' }),                 ['markInput', 'replay']);
check('release',      send({ type: 'release' }),                ['release']);
check('unknown type ignored', send({ type: 'no-such-thing' }), []);
check('garbage ignored',      send(null),                       []);

// and the dev-server path still reports honestly rather than throwing
delete globalThis.FootronMessaging;
check('absent global = not connected', connectFootron(api, { enabled: true }).connected, false);

// a namespace without the class must not be reported as connected
globalThis.FootronMessaging = {};
check('malformed global = not connected', connectFootron(api, { enabled: true }).connected, false);

// The gate. Footron supplies ftMsgUrl; without it the client would retry a
// dead socket forever. Getting this wrong kills the controls silently, which
// is the same failure mode as the constructor bug, so it is tested too.
globalThis.FootronMessaging = { Connection: class {}, Messaging: FakeMessaging };
check('gate: wall URL',        footronEnabled('?ftMsgUrl=ws%3A%2F%2Frouter%2Fout'), true);
check('gate: manual override', footronEnabled('?ftmsg=1'), true);
check('gate: with other args', footronEnabled('?capture=1&ftMsgUrl=ws://r/out'), true);
check('gate: bare dev server', footronEnabled(''), false);
check('gate: capture only',    footronEnabled('?capture=1'), false);
check('gate: ftmsg=0',         footronEnabled('?ftmsg=0'), false);
check('ungated = not connected', connectFootron(api, { enabled: false }).connected, false);

console.log(fails.length ? `\n${fails.length} FAILED\n` + fails.join('\n') : '\nall ok');
process.exit(fails.length ? 1 : 0);
