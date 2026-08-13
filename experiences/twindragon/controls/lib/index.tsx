// ftcontrols (the @footron/controls-cli dev preview server) hard-codes its
// entry point as lib/index.tsx, unlike the real deployment pipeline which
// uses lib/index.js (see every other experience's controls/lib/index.js).
// This just re-exports the real component so local preview can find it.
export { default } from "./index.js";
