# vendor/

`footron-messaging.min.js` is the UMD build of [`@footron/messaging`][pkg]
v0.1.6, copied verbatim from the published package. It is the client the wall
uses to talk to a visitor's phone.

It is vendored rather than installed because this piece has no build step — it
is a plain page and two scripts served as files, which is what lets
`python3 -m http.server` and the wall serve the byte-identical tree. Adding a
bundler for one 12 KB dependency would cost that property. The UMD build
defines `globalThis.FootronMessaging`, so a plain `<script>` tag is all it
needs, and `footron.js` degrades to a no-op if the global is absent.

To update: bump the version in a checkout that has it installed and copy
`node_modules/@footron/messaging/dist/footron-messaging.production.min.js` here.

[pkg]: https://www.npmjs.com/package/@footron/messaging
