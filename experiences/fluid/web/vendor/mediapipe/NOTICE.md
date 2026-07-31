# Vendored MediaPipe

Bundled so the wall runs with no network access.

| File | Source |
| --- | --- |
| `vision_bundle.mjs`, `wasm/*` | `@mediapipe/tasks-vision` 1.0.0, https://www.npmjs.com/package/@mediapipe/tasks-vision |
| `hand_landmarker.task` | Hand landmarker (full, float16), https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task |

Both are from Google and licensed under the Apache License 2.0
(https://www.apache.org/licenses/LICENSE-2.0). Model card:
https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker

To refresh:

```bash
V=1.0.0
B=https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@$V
curl -o vision_bundle.mjs $B/vision_bundle.mjs
for f in vision_wasm_internal.js vision_wasm_internal.wasm \
         vision_wasm_nosimd_internal.js vision_wasm_nosimd_internal.wasm; do
    curl -o wasm/$f $B/wasm/$f
done
curl -o hand_landmarker.task \
    https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
```
