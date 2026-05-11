# FEATURES

Single source of truth for what works. Updated 2026-05-11.
**Legend**: ✅ working · ⚠️ works with caveat · 🐞 broken · 🚧 placeholder by design

Evidence basis: `.tmp/inventory.md` (86 features × Playwright screenshots in `verification/inv-NN.png`).

## Brain selection

| Status | Feature | Code | Note |
|---|---|---|---|
| ✅ | 7 region cards (Frontal · Parietal · Temporal · Occipital · Cerebellum · Brainstem · Limbic) | `App.tsx:108-134` | All click → camera fly + accent shift |
| ✅ | Region favorite stars (toggle state persists in session) | `App.tsx:120-131` | Not surfaced elsewhere — favorites view doesn't exist |
| ✅ | 17 substructures with real meshes | `data/regions.ts` | Hippocampus / Amygdala / Cingulate / etc. fly close-up + cortex auto-ghosts |
| 🚧 | 11 substructures are **label-only** | `data/regions.ts` `meshes: []` | Functional regions (V1/Broca/Wernicke/Vermis/Reticular/etc.) — BodyParts3D doesn't ship them, intentionally honest |
| ✅ | 28 substructure detail panel updates (right rail) | `App.tsx:332-365` | All 28 confirmed |

## 3D stage controls

| Status | Feature | Code | Note |
|---|---|---|---|
| ✅ | Orbit (drag) + zoom (scroll) | drei `OrbitControls` | minDistance 2.0 / maxDistance 6.6, damping enabled |
| ✅ | Camera auto-fly on region change | `brain/rigs.tsx CameraRig` | Per-region pose in `regions.ts` |
| ✅ | Camera auto-fly on substructure change | same | 17 substructure-specific poses set |
| ✅ | Whole / Region view-mode toggle (Isolate button mirror) | `App.tsx:221-232,289-297` | Region mode dims non-selected to opacity 0.08 |
| ✅ | Cross Section: Off · Axial · Coronal · Sagittal | `App.tsx:236-247` + `materials.ts SHARED_CLIP_PLANE` | Real `THREE.Plane` clipping, slider mutates in place (no re-clone) |
| ✅ | Cross Section offset slider (-1.2 to 1.2) | `App.tsx:248-259` | Auto-disables auto-rotate to avoid spinning past plane |
| ✅ | Auto-rotate toggle | `App.tsx:280-288` | Y axis spin in `AutoSpinRig` |
| ✅ | Reset View | `App.tsx:298-301` | Resets OrbitControls + clears AutoSpin rotation, fires toast |
| ✅ | Bloom highlight on selected mesh | `BrainSceneInner.tsx EffectComposer` | luminanceThreshold-based, no Selection wrapper (see KNOWN_ISSUES history) |
| ✅ | Occluding shell (cortex auto-transparent) | `brain/fjIndex.ts isOccludingShell` | Triggers when deep substructure or limbic/brainstem region selected |

## Imaging modes (visual stylization)

| Status | Feature | Code | Note |
|---|---|---|---|
| ⚠️ | 4 visual modes: T1 MRI · fMRI BOLD · DTI Tractography · Histology | `materials.ts PRESETS` | Each is a material preset (color/emissive/roughness/metalness), not real imaging data — see KNOWN_ISSUES "Imaging is stylization" |
| ✅ | Per-region 3 imaging buttons (21 total) with active state | `App.tsx:413-426` | All 21 verified is-active + toast |

## Export

| Status | Feature | Code | Note |
|---|---|---|---|
| ⚠️ | Screenshot → PNG download | `BrainScene.tsx imperative.screenshot` | PNG saves correctly but logs `camera is not an instance of THREE.Camera` to console (cosmetic) — see KNOWN_ISSUES |
| ✅ | GLB Export → .glb download | `BrainScene.tsx imperative.exportGLB` | Exports full brain assembly group via GLTFExporter |

## Comparison

| Status | Feature | Code | Note |
|---|---|---|---|
| ✅ | Compare panel shows current region vs `region.comparison` | `App.tsx:430-453` | Static info card |
| 🐞 | "Open Comparison View" → dual-3D modal | `App.tsx:482-523` + `ComparisonStage.tsx` | **Right `<View>` stays blank** — regression detected by inventory subagent — see KNOWN_ISSUES |

## Decoration / supporting

| Status | Feature | Code | Note |
|---|---|---|---|
| ✅ | Loader overlay (drei `<Loader>`) during initial GLB load | `App.tsx:711` | Hides cleanly when 49 GLBs done |
| ✅ | Toast notification (2.6s auto-dismiss) | `App.tsx:526-531` | Used by Reset View, imaging mode click, screenshot/glb success |
| 🚧 | Topbar brand block + region chip | `App.tsx:41-55` | Display only, no click handler |

## Data assets

| Status | Asset | Source | License |
|---|---|---|---|
| ✅ | 49 BodyParts3D FJ GLB meshes | DBCLS BodyParts3D 4.0 | CC-BY-SA 2.1 JP — must attribute "© DBCLS" on publish |
| ✅ | 7 region camera poses + 17 substructure camera poses | `data/regions.ts` | All hand-tuned with screenshot evidence |

## Verification scripts (`scripts/`)

| Status | Script | Purpose |
|---|---|---|
| ✅ | `verify.mjs` | `npm run verify` — viewport sweep + interaction asserts + downloads |
| ✅ | `inventory.mjs` | Walks every UI element, screenshots → `.tmp/inventory.md` (regenerable) |
| ✅ | `build-region-glbs.mjs` | BodyParts3D OBJ → GLB pipeline |
| ✅ | `add-region-cameras.mjs` / `add-substructure-cameras.mjs` / `add-substructure-meshes.mjs` | Schema authoring helpers |
| ✅ | `killer-demo.mjs` | Marketing recording (Playwright video → ffmpeg mp4/gif) |
| 🗑️ | 10 scratch scripts | See KNOWN_ISSUES "Scripts hygiene" — pending move to `scripts/scratch/` |

---

**How to update this file**: every PR touching user-facing behavior must add/modify the row + screenshot reference. Re-run `node scripts/inventory.mjs` to regenerate baseline.
