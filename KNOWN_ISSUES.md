# KNOWN_ISSUES

Issues discovered, not yet fixed. Updated 2026-05-11.
**Severity**: 🔴 broken (visible to user) · 🟡 cosmetic / behind-the-scenes · 🟢 by-design limitation

Evidence basis: subagent inventory run on dev `http://127.0.0.1:5173/` (3 passes, 86 features each).

## 🔴 Comparison Modal: only left brain renders

**Symptom**: Click "Open Comparison View" → modal opens with 2 region labels and 2 placeholder divs, but only the **left `<View>` shows a 3D brain**. The right `<View>` stays as paper-cream background.

**Reproduction**: Inventory `inv-84.png` shows it consistently across all 3 runs.

**Suspect**: `src/components/ComparisonStage.tsx` mounts 1 `<Canvas eventSource>` + 2 `<View track={ref}>`. The right View's `track` ref likely points to a div that never gets a non-zero bounding box at the moment Canvas reads positions, OR drei v10's `<View>` requires an explicit camera per view (we share defaults).

**Severity**: 🔴 — feature is the headline of the Comparison column but doesn't deliver.

**Investigation start**: log `getBoundingClientRect` of both refs at modal open + check drei `<View>` v10 docs on shared cameras.

## 🟡 Screenshot logs camera-type error

**Symptom**: Click Screenshot → PNG downloads correctly with valid frame data, but `THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.` is logged to console.

**Cause**: `BrainScene.tsx:64` line `gl.render(scene, gl.xr.isPresenting ? gl.xr.getCamera() : (gl as any).camera ?? scene)` falls back to passing `scene` as camera when `gl.camera` doesn't exist. Should grab the actual `useThree().camera`.

**Severity**: 🟡 — output works, only log noise.

**Fix sketch**: Capture camera ref via a `<CaptureContext>` similar to how `glRef` / `sceneRef` are captured, then use it in screenshot().

## 🟡 Occipital + Myelin Stain crash (intermittent)

**Symptom**: 1 of 3 inventory runs hit `pageerror: Cannot read properties of null (reading 'alpha')` after clicking Occipital → Myelin Stain. White-screened the React tree, all subsequent clicks failed.

**Frequency**: Intermittent, ~33% reproduction in inventory runs. Other Histology-family imaging (Nissl, Purkinje, Golgi, Brainstem Myelin) clicked clean.

**Suspect**: A `null` material/texture somewhere in the bloom/clipping pass when this specific (region, mode) combination fires during a particular animation frame. Race condition on first paint of that mode.

**Severity**: 🟡 — race not consistent, but a crash is a crash. Worth reproducing with `node scripts/inventory.mjs` until caught with stack trace.

## 🟢 Imaging modes are visual stylization, not real imaging data

**By design** (with limited honesty): the 4 imaging modes change material presets (color/emissive/intensity/roughness), not the underlying volumetric data. There is no real T1 MRI volume, no fMRI activation map, no DTI streamline file.

**Where stated**: this README's `KNOWN_ISSUES.md` and the project FOR_JOHN.md "imaging modes" section.

**Path to real data**: separate `niivue-integration` branch (not started), per the subagent research that confirmed niivue + 4 MB MNI152 + 0.4 MB spmMotor + 0.6 MB DTI tract files are CDN-available and CORS-clean.

## 🟢 11 substructures are label-only

**By design**: V1 / V2-V3 / Lingual Gyrus / Vermis / Dentate Nucleus / Flocculonodular Lobe / Reticular Formation / Wernicke's Area / Auditory Cortex / Orbitofrontal Cortex / Posterior Parietal Cortex.

These are functional or cytoarchitectonic regions BodyParts3D doesn't ship as discrete meshes (they aren't strict anatomical units). Detail panel updates on click; 3D scene doesn't add a highlight because there's nothing to highlight.

**Path forward**: would require either (a) generating procedural ellipsoid placeholders annotated as "approximate region", or (b) sourcing meshes from Allen Mouse Brain Atlas or HCP Multi-Modal Parcellation (different ontology, different licensing).

## 🟢 Stage toolbar Rotate / Isolate are silent

**By design** (not documented previously): the Rotate and Isolate buttons toggle state without firing a toast. Only Reset View fires one. Inventory subagent flagged this as worth noting — could be confusing on a slow GPU where the visual change isn't immediate.

**Fix sketch**: add a toast for both, e.g. "Auto-rotation on/off", "Isolated to current region".

## 🟢 Mobile layout pushes canvas below fold

**Known since FOR_JOHN V2**: at 390×900 viewport, the sidebar list pushes the 3D canvas below the visible fold. Verify currently has a relaxed assertion for mobile to avoid blocking on this.

**Path forward**: collapse sidebar to tab on mobile.

## 🟡 Scripts hygiene

**Status**: `scripts/` has 16 files; per inventory subagent classification, **10 are scratch** and should move to `scripts/scratch/` (gitignored):

`all-region-shots, check-brainstem, clip-shot, cross-section-shot, debug-warning, imaging-modes-shot, recon, sub-cam-shots, three-features-shot`

**Disagreement with subagent**: `killer-demo.mjs` was classified as scratch but is actually the marketing demo recorder — keep at top level.

**Pending action**: `git mv` + `.gitignore` update.

## Recently fixed (history)

- **Brainstem invisible by default** (2026-05-11): Brainstem region camera flipped from front-low view `[0, -1.6, 5]` to back-low view `[0, -0.3, -4.8]`; midbrain/pons/medulla camera updated. Now visible. Evidence: `verification/audit-brainstem-*.png`.
- **Maximum update depth React loop** (2026-05-11): Removed `<Selection><Select>` wrapper from `@react-three/postprocessing`; bloom now uses pure `luminanceThreshold` selection. 0 console warnings vs previous 346 per session.
- **3D Comparison stub → drei `<View>` integration** (2026-05-11): Replaced text-only modal with 1-Canvas + 2-View architecture. **Half-broken** (see 🔴 above) but architecturally correct.
- **Cross Section "fake" opacity → real clipping plane** (2026-05-11): `SHARED_CLIP_PLANE` mutated in place by slider; material clones don't re-fire on slider drag.

---

**How to use this file**: before working on a feature, check here. After fixing an issue, move the row to "Recently fixed" with date + evidence.
