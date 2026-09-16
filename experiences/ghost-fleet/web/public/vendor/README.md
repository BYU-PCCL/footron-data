# Vendored

`footron-messaging.min.js` — the wall's phone-controls client, the same UMD
build the other experiences in this repository carry. It defines
`globalThis.FootronMessaging`; `src/footron.js` reads that global and degrades
to a no-op when it is absent, so the piece runs unchanged in a plain browser.

It lives under `public/` rather than beside the source because Vite copies
`public/` verbatim into `dist/` and leaves the `<script src>` in `index.html`
alone. Referenced from `src/` instead, it is left as a dangling reference and
404s on the wall — with the only symptom being that the phone controls quietly
do nothing.
