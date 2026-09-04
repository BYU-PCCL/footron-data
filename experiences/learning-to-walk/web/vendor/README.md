# watch-public/vendor/

`footron-messaging.min.js` is the UMD build of [`@footron/messaging`][pkg] v0.1.6, copied verbatim
from the published package. It is the client the wall uses to talk to a visitor's phone.

It is vendored as a plain `<script>` rather than imported as a module because that is what lets the
page degrade cleanly. The UMD build defines `globalThis.FootronMessaging`, and `src/watch/footron.js`
treats an absent global as "not on the wall" — so the identical built tree runs under
`python3 -m http.server` for development, with the phone protocol simply inert, and nothing about the
exhibit is conditional on a bundler having resolved a dependency.

To update: bump the version in `devDependencies`, `npm install`, and copy
`node_modules/@footron/messaging/dist/footron-messaging.production.min.js` here.

[pkg]: https://www.npmjs.com/package/@footron/messaging
