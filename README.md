# Brain Architecture Studio

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=fff)
![Three.js](https://img.shields.io/badge/Three.js-0.181-000000?logo=threedotjs&logoColor=fff)
![BodyParts3D](https://img.shields.io/badge/anatomy-BodyParts3D%20CC--BY--SA-4f8a3f)
![License](https://img.shields.io/badge/code-MIT-blue)
![Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-green)

> **Modern 3D anatomical workbench**: real BodyParts3D meshes + scientific imaging metaphors + open architecture.

[**Live demo →**](https://toby-bridges.github.io/brain-architecture-studio/) · [v0.1.0 release notes](https://github.com/toby-bridges/brain-architecture-studio/releases/tag/v0.1.0)

![demo](https://github.com/toby-bridges/brain-architecture-studio/releases/download/v0.1.0/killer-demo-small.gif)

## 中文说明

本项目基于 **Brain Architecture Studio** 进行中文本地化与体验改造。

- 原作者：toby-bridges
- 原项目地址：https://github.com/toby-bridges/brain-architecture-studio
- 代码许可证：MIT License
- 3D 解剖模型数据来源：BodyParts3D / DBCLS
- 数据授权：CC-BY-SA 2.1 Japan
- 本版本仅用于学习、测试、中文化展示和开源项目体验改造。

A browser-based 3D brain explorer for developers, neuroscience students, and educators who want **real anatomy + interactive material metaphors + an open, forkable codebase**. Not a textbook tour (that's [brainfacts.org](https://brainfacts.org/3d-brain)) — a lab notebook.

> 36-second tour above: region selection → deep-structure occluding shell → 4 imaging modes (T1 / fMRI / DTI / Histology) → cross-section → dual-view comparison. [Full MP4 (1.7MB)](https://github.com/toby-bridges/brain-architecture-studio/releases/download/v0.1.0/killer-demo.mp4)

## What's in here

- **49 anatomically-real GLB meshes** from BodyParts3D (CC-BY-SA 2.1 JP, © DBCLS), covering 7 brain regions + 17 individually-highlightable substructures
- **4 imaging mode material presets** — T1 MRI / fMRI BOLD / DTI Tractography / Histology — each a distinct visual signature (stylized; not real volumetric data yet)
- **Real Three.js clipping plane Cross Section** with axial / coronal / sagittal switch + offset slider
- **Per-region + per-substructure camera auto-fly** with deep-structure occluding shell (cortex auto-ghosts when you select hippocampus / thalamus / brainstem etc.)
- **Dual-view Comparison Modal** via drei `<View>` HtmlView pattern (with a fix for drei v10's `isOffscreen` bug — see FOR_JOHN.md)
- **Bloom highlight** via `@react-three/postprocessing` `luminanceThreshold` (no `<Selection>` wrapper, avoids React infinite loop)
- **PNG + GLB export** of the current scene
- **Playwright verification suite** with 86-element inventory walker

## Quick start

```bash
git clone https://github.com/toby-bridges/brain-architecture-studio.git
cd brain-architecture-studio
npm install
npm run dev   # → http://127.0.0.1:5173/
```

Other commands:

```bash
npm run build           # tsc -b && vite build → dist/
npm run preview         # serve dist/ at /brain-architecture-studio/
npm run verify          # Playwright headless verification suite
node scripts/inventory.mjs   # full UI walker → .tmp/inventory.md + verification/inv-*.png
node scripts/killer-demo.mjs # record demo webm → verification/killer-demo.webm
```

## Architecture

Read [FOR_JOHN.md](./FOR_JOHN.md) for the full engineering notes — file map, data pipeline, key decisions, pitfalls, future branches.

TL;DR file layout:

```
src/
  App.tsx                          UI shell (sidebar / stage / detail / comparison)
  data/regions.ts                  7 regions × 28 substructures + camera poses
  components/
    BrainScene.tsx                 Canvas + imperative handle (screenshot/glb export)
    BrainSceneInner.tsx            lights / camera / autospin / bloom (compact-aware)
    ComparisonStage.tsx            drei HtmlView dual brain renderer
    brain/
      fjIndex.ts                   FJ_INDEX + tagState + occludingShell
      materials.ts                 4 imaging-mode PRESETS + SHARED_CLIP_PLANE
      FJMesh.tsx / BrainAssembly.tsx / rigs.tsx
public/models/regions/             49 FJ*.glb (BodyParts3D anatomical meshes)
scripts/
  verify.mjs                       npm run verify
  inventory.mjs                    full UI inventory walker
  build-region-glbs.mjs            BodyParts3D ZIP → OBJ → obj2gltf → GLB
  killer-demo.mjs                  marketing recorder
  scratch/                         13 one-off probes (gitignored for new probes)
```

## Status & known limitations

See [FEATURES.md](./FEATURES.md) (status table) and [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) (active + recently-fixed bugs).

Most material limitations:
- **Imaging modes are visual stylization, not real volumetric data.** Real T1 MRI / fMRI activation maps / DTI streamlines are a separate `niivue-integration` branch (not started). CDN sources for niivue integration are verified and documented.
- **11 of 28 substructures are label-only** (V1 / Broca / Vermis / Wernicke / etc. — functional regions BodyParts3D doesn't ship as discrete meshes).
- **Mobile layout pushes canvas below fold** at 390px wide; deferred.

## Data attribution

**Anatomical 3D meshes**: [BodyParts3D 4.0](https://lifesciencedb.jp/bp3d/), © DBCLS, licensed CC-BY-SA 2.1 Japan. The 49 GLB files in `public/models/regions/` are derived from the BodyParts3D `isa_BP3D_4.0_obj_99.zip` OBJ dataset via `obj2gltf` conversion. The derivative meshes inherit the CC-BY-SA license — if you redistribute, you must credit DBCLS and license your derivative under a compatible open license.

**Application code**: MIT, see [LICENSE](./LICENSE).

## Compared to brainfacts.org 3D Brain

| | brainfacts.org | this project |
|---|---|---|
| Anatomy | Stylized single mesh, no provenance | 49 BodyParts3D meshes, FMA-tagged, CC-BY-SA |
| Substructure highlighting | Flat list of ~30 | 7 regions × 28 substructures, 17 with real meshes |
| Cross section | — | axial / coronal / sagittal + slider, real clipping plane |
| Imaging modes | — | 4 visual presets (stylized) |
| Comparison | — | dual 3D side-by-side |
| Export | Screenshot | PNG + GLB |
| Tech | 2017 jQuery + Three.js r80s | 2026 React 19 + R3F + Three.js 0.181 |
| Content depth | Society for Neuroscience curated text | Wikipedia-level placeholder; community PRs welcome |

## Contributing

PRs welcome, especially:
- Filling in `regions.ts` substructure `note` / `fact` / `attributes` with citations
- Mobile layout
- niivue branch (real T1/fMRI/DTI data)

Run `npm run verify` before submitting. New features should add a row to FEATURES.md and a screenshot to `verification/`.
