# Third-party notices

## MediaPipe

- **`@mediapipe/tasks-vision` 1.0.1** (JavaScript API and WebAssembly runtime): Apache License 2.0 (as declared in the package's `package.json`).
- **Pose Landmarker model files** (`public/models/pose_landmarker_lite.task`, `pose_landmarker_full.task`) were downloaded from Google's public MediaPipe model storage:
  `https://storage.googleapis.com/mediapipe-models/pose_landmarker/<variant>/float16/latest/pose_landmarker_<variant>.task`
  The model files' own terms are published on the MediaPipe "Pose Landmarker" model card. **That model card has not been reviewed for this repository.** Review it before any commercial use or redistribution beyond this prototype.

SHA-256 of the bundled files (to detect accidental changes):

```
59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a  pose_landmarker_lite.task
4eaa5eb7a98365221087693fcc286334cf0858e2eb6e15b506aa4a7ecdcec4ad  pose_landmarker_full.task
8da277a733926eacd0474b8704b36742d6ec3231c57a860c5b889dff8f1df886  vision_wasm_internal.wasm
2dabd8e23c60984628beb7bb338764c81a08e6837145273f59578684b5d53c1b  vision_wasm_module_internal.wasm
a28483cd42e74e855bf5ebdb6b40d9b66a5b49e35e95020bc97669e6822a3192  vision_wasm_nosimd_internal.wasm
```

## Open-source libraries

React, React DOM, React Router, Zustand, Recharts, lucide-react, clsx, Tailwind CSS, Vite and Vitest are used under their respective permissive open-source licences (MIT or similar). Run `npm ls` and check each package's licence file before commercial distribution.

## Brand

The GearPhys name and logo image (`public/logo.jpg`) were supplied by the project owner.
