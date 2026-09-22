# vendor/

- `matter.min.js` is Matter.js 0.19.0, the 2D physics engine the collapse
  animation uses.
- `footron-messaging.min.js` is the UMD build of [`@footron/messaging`][pkg]
  v0.1.6, copied verbatim from the copy Wave Lab already vendors on the wall
  (`experiences/wave-lab/web/vendor/`). It is the client the wall uses to
  receive messages from a visitor's phone. It defines
  `globalThis.FootronMessaging`, and `src/footron.js` degrades to a no-op when
  that global is absent, so the page still runs off the wall.

Both are vendored rather than installed so the page has no build step: it is
plain ES modules served as files.

[pkg]: https://www.npmjs.com/package/@footron/messaging
