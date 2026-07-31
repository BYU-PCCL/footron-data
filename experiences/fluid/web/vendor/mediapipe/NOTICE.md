# Vendored MediaPipe

Bundled so the wall runs with no network access.

| File | Source |
| --- | --- |
| `vision_bundle.mjs` (main thread), `vision_bundle.js` (IIFE, for the classic worker), `wasm/*` | `@mediapipe/tasks-vision` 1.0.0, https://www.npmjs.com/package/@mediapipe/tasks-vision |
| `pose_landmarker_lite.task`, `pose_landmarker_full.task` | Pose landmarker (float16), https://storage.googleapis.com/mediapipe-models/pose_landmarker/ |
| `hand_landmarker.task` | Hand landmarker (full, float16), https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task |

Both are from Google and licensed under the Apache License 2.0
(https://www.apache.org/licenses/LICENSE-2.0). Model cards:
https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker

To refresh:

```bash
V=1.0.0
B=https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@$V
curl -o vision_bundle.mjs $B/vision_bundle.mjs
curl -o vision_bundle.js $B/vision_bundle.js
for f in vision_wasm_internal.js vision_wasm_internal.wasm \
         vision_wasm_nosimd_internal.js vision_wasm_nosimd_internal.wasm; do
    curl -o wasm/$f $B/wasm/$f
done
curl -o hand_landmarker.task \
    https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
for v in lite full; do
    curl -o pose_landmarker_$v.task \
        https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_$v/float16/1/pose_landmarker_$v.task
done
```
