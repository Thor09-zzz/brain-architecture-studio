# Brain Architecture Studio — 工程笔记

写给以后的你（或者明天的你）。「为什么这样做」的笔记，不是文档。
公开仓库前的诚实记录：哪里能跑、哪里有坑、哪里还在演化。

## 这是什么

浏览器里的 3D 大脑解剖工作台。**真实 BodyParts3D 解剖 mesh** + 「成像模态」材质风格化切换 + 真切面 + 双视图对比。**面向开发者 / 神经科学学生 / 教育者，而不是大众 (那是 brainfacts.org 的位置)**。

入口：`npm run dev` → http://127.0.0.1:5173/
线上：https://toby-bridges.github.io/brain-architecture-studio/

## 当前架构

```
src/
├── App.tsx                          ~700 行，UI 框架 + 全局状态
├── data/
│   └── regions.ts                   7 region × 28 substructure + 相机姿态
├── components/
│   ├── BrainScene.tsx               150 行 — orchestrator (Canvas + imperativeHandle)
│   ├── BrainSceneInner.tsx          120 行 — 灯光/相机/AutoSpin/Bloom，含 compact 模式
│   ├── ComparisonStage.tsx          50 行 — drei HtmlView 双脑并排
│   └── brain/
│       ├── fjIndex.ts               96 行 — FJ_INDEX + tagState + occludingShell
│       ├── materials.ts             140 行 — PRESETS + tintMaterial + SHARED_CLIP_PLANE
│       ├── FJMesh.tsx               64 行 — 单 mesh 渲染
│       ├── BrainAssembly.tsx        37 行 — 49 FJ mesh map
│       └── rigs.tsx                 90 行 — CameraRig + AutoSpinRig + CaptureContext
└── styles.css                       1500+ 行 — 19 世纪解剖图谱美学
```

**49 个 GLB** in `public/models/regions/`，~3.9MB 总。

## 数据流水线

```
BodyParts3D ZIP (143MB, CC-BY-SA 2.1 JP)
  └─ scripts/build-region-glbs.mjs
     ├─ unzip 出 49 个 .obj (按 FJ 编号)
     └─ obj2gltf → public/models/regions/FJxxxx.glb
        └─ useGLTF (drei) 缓存加载
           └─ <FJMesh> per FJ code
              └─ tintMaterial(preset[imagingMode], state, occludingShell)
                 └─ EffectComposer Bloom (luminanceThreshold)
```

FMA → FJ 映射通过 BodyParts3D 的 `isa_element_parts.txt` + `partof_element_parts.txt` 双表交叉。**49 个 FJ 覆盖** 7 region + 17 有真实 mesh 的 substructure，剩 11 个子结构是功能性/细胞构筑分区（V1, Broca, Vermis 等），label-only 处理。

## 关键技术决策

### 1. 为什么 49 个独立 GLB，不是 NIH 单 mesh

NIH 3DPX-021161 (CC-BY) 13MB 单 mesh 解剖准确度高，但是**单一 mesh** 没法按子结构高亮（你点 Hippocampus，整个脑都变色）。BodyParts3D 49 个独立 mesh 牺牲一点视觉精致换来了**子结构级交互粒度**，跟项目定位（教育交互工具）一致。

NIH 路径留在 `KNOWN_ISSUES.md` 历史区。如果将来要做「stylized / anatomical」双模式，用 NIH 大轮廓 + BodyParts3D 局部高亮的混合方案。

### 2. FJ_INDEX + 标签反查

`brain/fjIndex.ts` 构建一个 `FJTag[]`，每个 tag 记 `{code, regions[], substructures[]}` — 同一个 FJ 文件可能同时属于多个 region/sub（例如 FJ1786 既在右颞叶也在右边缘叶）。渲染时遍历 FJ_INDEX，按 selectedRegion + activeSubstructure 决定每个 mesh 的 tagState（substructure / region / off）。

**这避免了「region 拥有 meshes」单向树**，因为大脑解剖本身就是多对多关系。

### 3. tintMaterial PRESETS 是 imaging 模式的核心

`brain/materials.ts` 里的 `PRESETS: Record<ImagingMode, StylePreset>` 是 T1 / fMRI / DTI / Histology 4 套材质参数（baseColor / offColor / highlightEmissive / intensityScale / roughness / metalness）。tintMaterial 在 cloned material 上分支应用。

**Histology 故意 intensityScale = 0.35** 让 emissive 低于 Bloom 阈值 0.78 → 不发光、matte sepia 标本感。**fMRI intensityScale = 1.6** 让选中区强烈 bloom 红橙光晕。**DTI 加 metalness 0.22** 模拟纤维丝绒。

诚实声明：这是**风格化模拟**，不是真 T1/fMRI/DTI 体素数据。Roadmap 里 niivue branch 是真数据路线。

### 4. occluding shell 让深层结构透出来

`isOccludingShell(tag, selectedRegion, activeSubstructure)` 判定逻辑：当用户选中 `DEEP_SUBSTRUCTURES` (海马/杏仁核/丘脑/中脑/桥脑/延髓等) 或 `selectedRegion === "limbic"`，**所有外层 cortex mesh 自动变 opacity 0.22 + depthWrite=false**。让用户看到原本被脑壳挡住的内部结构。

### 5. SHARED_CLIP_PLANE 单实例 mutate

Cross Section 三向切面：`materials.ts` 顶层有 `SHARED_CLIP_PLANE = new Plane(...)`。slider 拖动只 mutate `plane.normal` 和 `plane.constant`，**不触发任何 React re-render**，也不重新 clone 49 个 mesh 的 material（否则每帧重 clone 拖动会卡）。Three.js 每帧自动读 plane 状态。

### 6. drei `<View>` HtmlView 模式（绕 v10 bug）

Comparison Modal 双脑并排用 drei `<View>`。drei v10 `View.js:19` 的 `isOffscreen` 检查 `trackRect.left > canvasSize.width` —— **当 canvas 不在 viewport 左边时这个检查误判右侧 view 为 offscreen**，整个右脑不渲染。

**修法**：用 HtmlView 模式（`<View>` 在 Canvas 外、`<View.Port />` 在 Canvas 内）+ Canvas `position: fixed; inset: 0` 撑满 viewport 让 canvasSize.width 大到不触发误判。每个 `<View>` 加独立 `<PerspectiveCamera makeDefault>`，BrainSceneInner 的 `compact` 模式跳过 OrbitControls (makeDefault 会冲突) 和 EffectComposer (一个 renderer 不能挂两个 composer)。

## 工程规范 (V3.1，从血泪教训沉淀)

**1. 不见证据不算完成**：任何「X 实现了 / 修好了」必须配截图 + 文件:行号引用。我之前栽过 2 次（imaging modes 自夸 + Comparison Modal 99% 置信度但右脑空白）。

**2. FEATURES.md + KNOWN_ISSUES.md 是 single source of truth**：用户面前的 feature 必须出现在 FEATURES.md，状态打 ✅⚠️🐞🚧。bug 进 KNOWN_ISSUES.md，修了挪到 Recently Fixed。

**3. 大改后必跑 inventory subagent**：`scripts/inventory.mjs` 用 Playwright 走遍每个 UI 元素截图。**外援发现 bug 率 > 自测**（实测：subagent 一次跑出 3 个我自测没找到的 bug）。

**4. 爆炸半径单 PR 单 fix**：每个 bug 独立 commit，独立 verify，不打包。前一个修完跑 verify 通过才提交，再修下一个时也要 regression check 上一个没退化。

**5. scripts/scratch/ 隔离一次性探针**：长期工具留在 `scripts/`（verify, inventory, build-region-glbs, killer-demo, 3 个 add-* authoring helpers）。debug / repro / one-off shots 进 `scripts/scratch/`。

## 踩过的坑

- **postprocessing Selection useEffect children 死循环** → 每次切换 region 触发 346 个 React "Maximum update depth" 警告。删 `<Selection><Select>` 包装层，单靠 `<Bloom luminanceThreshold={0.78}>` 按亮度筛选，归零。
- **drei View v10 isOffscreen 假阳性** → 见上面 "关键技术决策 6"。
- **BodyParts3D 文件名是 FJ 不是 FMA** → subagent 凭训练记忆给的 `FMA61824.obj` 不存在；实际官方 ZIP 是 `FJ1252.obj`。必须先下 `isa_parts_list_e.txt` + `partof_element_parts.txt` 做 FMA→FJ 映射。
- **obj2gltf scale 0.018**：BodyParts3D 是真实毫米单位，原始尺寸 ~150，scale 1.0 会塞满相机近平面。
- **Vite base 必须区分 dev/prod**：dev `/`, prod `/brain-architecture-studio/`。`FJ_MESH_BASE_URL` 必须用 `import.meta.env.BASE_URL` 而不是写死，否则线上 GLB 全 404。

## 未来分支

- **niivue 真成像数据**：subagent 已验证 CDN URL — `mni152.nii.gz` (4MB) / `spmMotor.nii.gz` (407KB) / `dpsv.trx` (588KB)，三者 CORS 通畅。新 branch 不上主干，UX 模型独立。
- **BodyParts3D label-only substructure 补全**：V1 / Broca / Vermis 等没有真 mesh。需要 Allen Mouse Brain Atlas 或 HCP Multi-Modal Parcellation（不同 ontology + 许可证）。
- **Mobile 布局**：390×900 viewport canvas 被推到 fold 之下。sidebar 折叠为 tab 即可。
- **Cross Section 与 OrbitControls 协作**：切面跟脑相对静止，autoRotate 会让切面"扫过"脑造成视觉错乱。目前临时做法是切面开启时自动禁用 autoRotate。更优解是 clipping plane 跟着 group 矩阵走。

## 历史 (collapsed)

V1（已废弃）：纯 procedural geometry，sin/cos 噪声位移半球 + sphereGeometry phi/theta 切片做 lobe patch。视觉上限「卡通示意图」。

V2（已废弃）：NIH 3DPX-021161 单 mesh，13MB CC-BY，下载链路绕了一圈才找到 (官方 JSON API 给的 S3 URL 是 403 私桶，真正的端点在 `/api/submissions/{subId}/runs/{runId}/output-files/{fileId}`)。子结构无法独立高亮。

V3（当前）：BodyParts3D 49 个 FJ GLB，4 套 imaging preset，drei View 双视图，clipping plane 三向，bloom luminance 高亮，FEATURES.md/KNOWN_ISSUES.md 工程规范。
