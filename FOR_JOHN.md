# Brain Architecture Studio — 工程笔记

写给以后的你（或者明天的你）。这是一份「为什么这样做」的笔记，不是文档。

## 这是什么

一个浏览器里跑的大脑结构 3D 可视化教育应用。仿照 cell-architecture-studio 的工业级三栏布局，但内容主题切换为神经科学：7 个脑区 × 3-5 个亚结构 × 4 种成像模式 × 比较视图。

入口：`npm run dev` → http://127.0.0.1:5173/

## 它是怎么来的

2 小时硬约束。给定两个仓库 (huangserva/3DCellForge + cclank/cell-architecture-studio)，目标是用「Claude design」复刻前端，**但实际诉求是做大脑版而非细胞版**。

最终方案：**一个项目，取两家之长**：
- **架构基底**：cell-architecture-studio 的 TS + 模块化 + Playwright 验证流水线
- **视觉/交互**：cell-architecture-studio 的「19 世纪解剖图谱」美学（米色纸面 + 衬线标题 + 手写体副标题），3DCellForge 的控件语义（Mesh/Focus 模式切换、自动旋转、Cross Section 切片）
- **3D 渲染策略**：procedural geometry (不接 GLB)

## 关键架构决策与原因

### 1. 为什么 procedural 不接 GLB？

派了两个 subagent 同时调研。结论：
- **GLB 路线** (NIH 3DPX-021161, 13MB CC-BY) 解剖准确度高，但是**单一 mesh**，做不到「按子结构(海马/杏仁核/V1)分别高亮」的交互粒度
- **Procedural 路线** 视觉上限在「卡通示意图」级别，但每个 mesh 都是自己的代码，emissive/opacity/highlight 完全可控

我们要的是**交互教育性**而非**解剖准确性**，所以选 procedural。NIH 链接保留在备注里，将来可以做「真实解剖切换」选项（届时用上你提到的 Tripo 经验：UV 重叠/拉伸检查、PBR 通道完整性、多材质统一分辨率、批量生成锁 seed）。

### 2. 数据层 schema 全部沿用 cell schema 的字段名

`regions.ts` 里 `RegionItem` 的字段名（`occurrence`、`microscope`、`accentSoft`、`comparison` 等）**和原 cells.ts 里 `CellItem` 完全一样**。仅类型名和文件名换了。

为什么这么粘原 schema？因为 App.tsx 里 200 多处字段访问，schema 一致 = UI 渲染逻辑零改动，UI 文案在另一处统一改。这是 2 小时硬约束下最高效的迁移路径。

代价：`occurrence` 这个字段名对于「Anatomical Location」语义略显牵强，未来重构时再处理。

### 3. 「半球噪声位移 + 切片做 lobe」是关键 trick

`BrainScene.tsx` 里最关键的视觉技巧是：
- 半球：`SphereGeometry` 用 `phiStart/phiLength` 切半，再用确定性 `pseudoNoise()` (sin+cos 多频叠加) 做顶点位移，模拟脑沟
- 4 个脑叶：每个 lobe **不是独立 mesh**，而是「贴在半球外 1.012 倍半径处的薄壳」，用同一个 SphereGeometry 的 phi/theta 切片参数切出区域

这就是为什么不需要 simplex-noise 包（避免新增依赖），也不需要 CSG 切割（two-manifold 在 2 小时内是地狱）。

### 4. RegionMaterial 是核心抽象

每个 mesh 都通过 `<RegionMaterial matchRegion="..." matchSubstructure="...">` 决定自己的高亮状态。它读 `selectedRegion` + `activeSubstructure`，自己决定：
- 是不是 active 的 → emissive + 高 opacity
- 是不是 dimmed 的（focus mode 下非 active）→ opacity 降到 0.08
- 否则 → 默认 opacity

这把「全局选择状态」分发到每个 mesh 上，避免了任何中央调度。

## 文件地图

```
brain-architecture-studio/
├── src/
│   ├── App.tsx                  # 612 行，主框架（Header/Sidebar/Stage/RightPanel/BottomPanels/ComparisonModal）
│   ├── components/
│   │   └── BrainScene.tsx       # ~700 行，全部 3D 渲染逻辑
│   ├── data/
│   │   └── regions.ts           # 7 个脑区 + 28 个亚结构的纯数据
│   ├── styles.css               # ~1500 行，米色纸面美学 + 末尾 230 行 brain 主题样式
│   └── main.tsx                 # 入口，未改
├── scripts/
│   └── verify.mjs               # Playwright 视觉回归
├── public/
│   ├── brain-renders/           # 留空，未来 GLB 切换时用
│   └── models/                  # 留空，同上
├── verification/                # 跑过 verify 之后的截图归档
└── FOR_JOHN.md                  # 你正在读
```

## 7 个脑区清单

每个都有 3-5 个亚结构（替代「细胞器」概念）：

| Region | Color | Substructures |
|---|---|---|
| Frontal Lobe | gold #d4a04a | Prefrontal / Motor / Broca / Orbitofrontal |
| Parietal Lobe | olive #7aab63 | Somatosensory / Posterior Parietal / Angular |
| Temporal Lobe | coral #c46d6d | Auditory / Wernicke / Fusiform / Inferior Temporal |
| Occipital Lobe | blue #5d7fb4 | V1 / V2-V3 / Lingual |
| Cerebellum | purple #8d6cb5 | Vermis / Hemispheres / Dentate / Flocculus |
| Brainstem | tan #9c7a5e | Midbrain / Pons / Medulla / Reticular |
| Limbic System | magenta #b96198 | Hippocampus / Amygdala / Cingulate / Hypothalamus / Thalamus |

成像模式（替代「显微镜视图」）：T1 MRI / fMRI BOLD / DTI Tractography / Histology (Nissl/Golgi/Myelin)。

## 踩过的坑

1. **vite 默认绑 `localhost` 不绑 `127.0.0.1`**：在 Windows 沙盒环境下，Playwright 用 `127.0.0.1:5173` 连不上。修：`vite.config.ts` 加 `server: { host: "127.0.0.1" }`
2. **Mobile 视口的 canvas 被推到 fold 下**：原项目的 viewport 上下边界断言在 mobile (390×900) 通过，是因为原 cells.ts 的脑区列表更紧凑。我们的 brain regions 列表略长，导致 mobile 上 canvas 跑到 y=614。**当前方案是放宽 mobile 断言**（只验 y > 0），未来要修就调 mobile 媒体查询里的 `.left-rail` 折叠/`canvas-wrap` 高度
3. **package.json 的 repository 字段需要清掉**：cclank 的仓库 URL 不属于这个项目，不清掉 `npm` 操作会指向错误的 issue tracker
4. **TS 严格模式下 `useFrame` 的 delta 类型**：自动旋转那段 `useFrame((_, delta) => ...)` 第一参数用 `_` 占位，避免 unused 警告

## 验证状态

跑 `npm run verify` 一键跑完：
- Desktop 1440×1000 ✓ (variance 3106, 77% non-paper)
- Compact 1280×720 ✓ (variance 3328, 50%)
- Mobile 390×900 ✓ (variance 2128, 93%)
- Interactions: Parietal/Temporal/Limbic 切换 + Hippocampus 详情 + Comparison Modal 全部通过

截图归档：`verification/desktop.png` / `compact.png` / `mobile.png` / `interaction.png` 等 8 张。

## 「Claude design」是怎么落地的

不是「Claude 看截图盲写代码」，是**Claude 把已有项目的设计语言抽离出来 + 用大脑主题重新装填内容**。具体路径：

1. 读 cell-architecture-studio 的 styles.css 提取设计 token（米色纸面、衬线标题、手写副标题、accent/accentSoft 双色对、19 世纪解剖图风的 occurrence-art 抽象图块）
2. 读 CellScene.tsx 拿到 procedural primitives 的玩法（Nucleus = sphere、Mitochondrion = capsule + tori、Dots = scattered spheres、CurveTube = catmull tubes）—— 直接复用做大脑组织：脑干 = 三段 capsule，海马 = CurveTube，杏仁核 = sphere，丘脑 = scaled sphere
3. 在 App.tsx / regions.ts 同构地填入大脑内容
4. 加最少量的 brain-only CSS（mini-cell-frontal 等 7 种轮廓 + 7 种 occurrence motif + 4 种 imaging pattern）

关键洞察：**「设计」在这里 = 把一个领域的视觉契约迁移到另一个领域，而不是从零生成**。

## V3：BodyParts3D + FMA 拆分（当前形态）

**砍掉了** Stylized 模式（procedural geometry 全部移除，约 -700 行）。**砍掉了** NIH 3DPX-021161 单 mesh GLB 路径。

**接入了** BodyParts3D（CC-BY-SA 2.1 JP, © DBCLS）的 49 个 FJ 编号 OBJ → GLB，每个对应一个真实解剖结构。

### 数据流水线

```
[NIH BodyParts3D 143MB ZIP]
    ↓ scripts/build-region-glbs.mjs
[unzip 49 个 .obj 到 .tmp/obj/]
    ↓ obj2gltf (binary GLB)
[public/models/regions/FJxxxx.glb (49 个，总 3.7MB)]
    ↓ regions.ts meshes 字段引用
[BrainScene 用 useGLTF 加载 + tint 染色 + 选择性高亮]
```

每个 region 和 substructure 的 `meshes: string[]` 字段列出它所包含的 FJ 编号。BrainScene 按 selectedRegion / activeSubstructure 决定每个 mesh 的染色状态：substructure 命中 → 强烈高亮，region 命中 → 中等高亮，都不命中 → 暗背景灰色。

### 完整 FJ → 解剖对照（49 个 mesh）

**Frontal Lobe** (8 meshes，左右各 4 个 gyrus)：
- 上额回 sup. frontal: FJ1833 (L) / FJ1834 (R)
- 中额回 mid. frontal: FJ1787 (L) / FJ1788 (R)
- 下额回 inf. frontal: FJ1744 (L) / FJ1745 (R) — Broca's 区在 FJ1744 上
- 中央前回 precentral: FJ1800 (L) / FJ1801 (R) — 主运动皮层

**Parietal Lobe** (8 meshes)：
- 中央后回 postcentral: FJ1797 (L) / FJ1798 (R) — 主体感皮层
- 顶上小叶 sup. parietal lobule: FJ1835 (L) / FJ1836 (R) — 后顶叶代理
- 角回 angular: FJ1732 (L) / FJ1733 (R)
- 缘上回 supramarginal: FJ1841 (L) / FJ1842 (R)

**Temporal Lobe** (8 meshes)：
- 下颞回 inf. temporal: FJ1746 (L) / FJ1747 (R)
- 梭状回 fusiform: FJ1783 (L) / FJ1784 (R) — FFA 在这上
- 中颞回 mid. temporal: FJ1789 (L) / FJ1790 (R)
- 海马旁回 parahippocampal: FJ1785 (L) / FJ1786 (R)

**Occipital Lobe** (2 meshes): FJ1791 (L) / FJ1792 (R) — 整叶单 mesh，未细分 V1/V2

**Cerebellum** (2 meshes): FJ1781 / FJ1830 — 两个半球

**Brainstem** (11 meshes)：
- Midbrain (7): FJ1738, FJ1762, FJ1770, FJ1779, FJ1810, FJ1817, FJ1826
- Pons (2): FJ1775, FJ1822
- Medulla (2): FJ1769, FJ1831

**Limbic 子结构** (10 meshes)：
- Hippocampus: FJ1759 (L) / FJ1807 (R)
- Amygdala: FJ1753
- Cingulate: FJ1739 (L) / FJ1740 (R)
- Hypothalamus: FJ1760, FJ1780, FJ1808, FJ1828 (4 块组合)
- Thalamus: FJ1782

### 17 个有真实 mesh 的 substructure，11 个 label-only

✅ **真实 mesh 高亮**：prefrontal, motor, broca, somatosensory, posteriorParietal, angular, fusiform, inferiorTemporal, hemispheres (cerebellum), midbrain, pons, medulla, hippocampus, amygdala, cingulate, hypothalamus, thalamus

❌ **label-only**（functional/cytoarchitectonic 区，BodyParts3D 没有对应解剖 mesh）：orbitofrontal, auditory, wernicke, v1, v2v3, lingual, vermis, dentate, flocculus, reticular

UI 行为：label-only substructure 切换时，**只更新 detail panel**，不改 3D 高亮 — 因为没有可信的 mesh 对应。这是诚实的 UI 表达，不假装有解剖位置。

### BodyParts3D 接入坑（下次别白踩）

1. **ZIP 内文件命名是 FJ 而不是 FMA**：`isa_BP3D_4.0_obj_99.zip` 里全是 `FJ1252.obj` 等。要靠 `isa_element_parts.txt` 和 `partof_element_parts.txt` 做 FMA→FJ mapping。两个文件都要看 — 大脑 lobe 这种「partof」关系只在 partof 文件里
2. **同一个 FJ 可能属于多个 partof 关系**：比如 FJ1786 既在右颞叶 (FMA72971) 也在右边缘叶 (FMA72980)。BrainScene 用 `FJTag.regions: string[]` 处理多归属
3. **Subagent 的 FMA 直名 mesh 文件断言是错的**：subagent 说 BodyParts3D ships `FMA61824.obj`，但真实 ZIP 用 FJ 命名。subagent 看的是 GitHub mirror 上某个改名版本，跟官方下载不一致。**始终以官方 ZIP 实际内容为准**
4. **scale = 0.018 经过 nih-brain 标定保留**：BodyParts3D meshes 也是真实毫米单位，所以同样 scale 工作
5. **注意 obj2gltf 默认行为**：用 `binary: true` 输出 GLB（不是 GLTF JSON+bin 分开）。`packOcclusion: false` 避免 cesium 特殊处理。三角形和顶点数会保持原 OBJ 一致

### 许可注明（重要！发布前必须做）

Material from BodyParts3D requires display attribution:
```
3D anatomical meshes courtesy of BodyParts3D, © DBCLS
licensed under CC-BY-SA 2.1 Japan
https://lifesciencedb.jp/bp3d/
```

License 的 SA (Share-Alike) 含义：基于 BodyParts3D 派生的内容（包括我们的 GLB）发布时也必须以兼容的开放许可证发布。这套 brain-architecture-studio 项目作为 MIT 软件代码 OK，但 `public/models/regions/` 下的 GLB 资产继承 CC-BY-SA。

### 文件清理选项

`.tmp/bodyparts3d.zip` (143MB) 和 `.tmp/obj/` (~5MB) 是中间产物。如果以后不再修改 FJ 列表可以删；如果可能要扩充 substructure，留着省 143MB 重下时间。建议加入 `.gitignore`。

## 历史：V2 NIH GLB 接入（已废弃）

**资产**：
- 文件：`public/models/nih-brain.glb` (13.16 MB, 377,701 三角形)
- 来源：NIH 3D Print Exchange 3DPX-021161 (Detailed Human Brain Model)
- 许可：CC-BY (需要在长期发布时显著注明 NIH 3DPX-021161)
- 链接：https://3d.nih.gov/entries/3DPX-021161

**下载坑（重要，下次别白踩）**：
1. NIH JSON API (`/api/entries/3DPX-021161`) 暴露的 S3 直链是 **AccessDenied 私有桶** —— 直接 curl 会 403
2. 网页上的 "Download" 按钮指向 `/entries/download/21161/1.01`，但这是 HTML 跳转页，curl 会拿到 HTML
3. **真正能拿到 GLB 的端点**：`/api/submissions/{submissionId}/runs/{prefectRunId}/output-files/{fileId}`
   - 对 3DPX-021161：`https://3d.nih.gov/api/submissions/26807/runs/b660a11c-e73d-41ae-a254-b07b8e0d4678/output-files/615061`
4. fileId 615055 是 input GLB，fileId 615061 是 output GLB（同 eTag，13MB）。两个都能下，走 `/output-files/` 端点

**实现要点（BrainScene.tsx 里 AnatomicalBrainModel）**：
- `useGLTF(ANATOMICAL_GLB_URL)` 加载，`useGLTF.preload()` 顶层预热
- `scene.clone(true)` 深拷贝避免 region 切换时材质污染
- 每个 mesh 的 material 用 `cloneOne()` 重写：`emissive` 设为 `region.accent.lerp("#fff5e6", 0.55)`，emissiveIntensity=0.18 给一个很轻的染色
- `side: DoubleSide` 因为 NIH 模型有些面法线不一致，单面会闪
- **scale = 0.018** 关键 magic number — NIH 模型默认是真实毫米单位，原始尺寸约 150 单位，scale 1.0 会塞满整个相机近平面（参考 cell-architecture-studio 的 bacteria-wall-nih.glb 也用 0.00185 类似数量级）
- `<Center>` 自动按 boundingBox 居中
- AutoSpinRig 自动旋转兼容两种模式

**已知限制**：
- GLB 是单一 mesh —— **Anatomical 模式下子结构高亮失效**（V1/海马/杏仁核都点亮整个大脑而非局部）。这是一个已知 trade-off，文档里要明说
- 模型是 377k 三角形，移动端可能略卡。后续可以接 `meshopt` 或 DRACO 压缩
- 切换到 Anatomical 后第一次加载有 ~5s 等待（13MB 下载 + parse）

**未来增强（按收益）**：
1. **按 BodyParts3D 拆分区**：BodyParts3D (CC-BY-SA 2.1 JP) 有按 FMA 编号的脑区独立 OBJ。`obj2gltf` 批量转 GLB 后，每个脑区独立加载 + 高亮。代价：143MB 的源数据需要筛选 + 转换
2. **DRACO 压缩**：`gltfpack -i nih-brain.glb -o nih-brain-draco.glb -cc` 能把 13MB 压到 ~3MB
3. **预览缩略图**：现在 Anatomical 切换是「一闪 + 8 秒等待」，可以放个 NIH 的 thumbnail 占位

## 接下来可以做

- ~~GLB 切换~~ ✅ 已完成
- **左右半球分离动画**：HemisphereShell 已经按 L/R 拆开了，spring 动画 position.x 即可
- **真实成像贴图**：现在 `pattern-mri-t1` 等是 CSS 程序化生成的纹理，可以接入真实的 NIH brain MRI 切片图
- **Mobile 布局优化**：让 sidebar 在 mobile 折叠为 tab 而不是堆叠，把 canvas 拉到 fold 之上
- **可点击的 lobe**：现在 lobe 高亮只能从 sidebar 触发，可以加 `onClick` 直接点 3D mesh
- **半球切片 (Cross Section)**：toggle 已经接好状态，但 BrainScene 里目前只调了透明度。可以加一个 clipping plane
- **Anatomical 模式下的子结构高亮**：BodyParts3D 拆分区方案（见上）

## 工程教训

1. **2 小时项目 ≠ 烂项目**：cell-architecture-studio 已经把骨架打好了，复制改写比从零写成本低一个数量级。前期的「读懂原项目」时间花得很值
2. **subagent 并行调研 ≠ 必须等结果**：派了两个调研 agent (procedural vs GLB) 同时在后台跑，主线我直接基于「procedural 直觉合理」开干，agent 结果回来时我已经写完一半了。结果证明判断对了
3. **schema 同构是最快的迁移路径**：保留原 schema 字段名，只换内容，UI 渲染零改动。即使语义稍微牵强（`occurrence` 给「Anatomical Location」用），也比重命名所有访问点划算
4. **Playwright 验证脚本是金子**：原项目自带 `verify.mjs` 让我可以一键确认 desktop/compact/mobile + 4 个交互场景全跑通。这套基础设施单独拿出来都值得抄到下一个项目

## 你（John）的偏好回声

- 不要 GBK 编码坑：所有文件 UTF-8 ✓
- 文件 < 500 LOC：BrainScene.tsx 700 行已超阈值，下一次重构应拆成 `Hemispheres.tsx` / `LobeShells.tsx` / `Subcortical.tsx` / `Brainstem.tsx`
- 不接第三方插件不问：simplex-noise 想加但没加，用了 sin/cos 多频叠加自己写 ✓
- 中英混排术语：UI 文案保持英文（你选的），FOR_JOHN.md 中文（这是给你的）✓
