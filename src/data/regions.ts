export type RegionKind =
  | "frontal"
  | "parietal"
  | "temporal"
  | "occipital"
  | "cerebellum"
  | "brainstem"
  | "limbic";

export type ViewMode = "mesh" | "focus";

export type LocalizedText = {
  zh: string;
  en: string;
};

export const BODYPARTS3D_LICENSE = {
  source: "BodyParts3D, © DBCLS",
  url: "https://lifesciencedb.jp/bp3d/",
  license: "CC-BY-SA 2.1 Japan",
} as const;

export type SubstructureItem = {
  id: string;
  name: LocalizedText;
  subtitle: LocalizedText;
  color: string;
  attributes: Array<{
    label: LocalizedText;
    value: LocalizedText;
  }>;
  note: LocalizedText;
  fact: LocalizedText;
  /** BodyParts3D FJ codes that compose this substructure. Empty array = no real mesh, label-only. */
  meshes: string[];
  /** Optional close-up camera pose for this substructure. */
  camera?: CameraPose;
};

export type RegionRenderImage = {
  url: string;
  aspect: "square" | "wide" | "landscape";
};

export type CameraPose = {
  /** Camera world-space position. */
  position: [number, number, number];
  /** OrbitControls target point. */
  target: [number, number, number];
};

export type RegionItem = {
  id: string;
  name: LocalizedText;
  type: LocalizedText;
  accent: string;
  accentSoft: string;
  color: string;
  modelKind: RegionKind;
  defaultSubstructure: string;
  comparison: string;
  /** BodyParts3D FJ codes that compose the entire region. */
  meshes: string[];
  /** Best camera pose to show this region. */
  camera: CameraPose;
  renderImage?: RegionRenderImage;
  occurrence: {
    title: LocalizedText;
    body: LocalizedText;
    motif: string;
  };
  microscope: Array<{
    label: LocalizedText;
    tone: string;
    pattern: string;
  }>;
  substructures: SubstructureItem[];
};

export const DEFAULT_CAMERA: CameraPose = {
  position: [2.4, 1.5, 3.0],
  target: [0, 0.05, 0],
};

// Vite injects BASE_URL based on vite.config.ts `base`. In dev = "/", in prod
// (GitHub Pages) = "/brain-architecture-studio/". Both end with a slash.
export const FJ_MESH_BASE_URL = `${import.meta.env.BASE_URL}models/regions`;
export const fjMeshUrl = (code: string) => `${FJ_MESH_BASE_URL}/${code}.glb`;

export const regions: RegionItem[] = [
  {
    id: "frontal",
    name: { zh: "额叶", en: "Frontal Lobe" },
    type: { zh: "大脑叶", en: "Cerebral Lobe" },
    accent: "#c0863a",
    accentSoft: "#f1e3c4",
    color: "#d4a04a",
    modelKind: "frontal",
    defaultSubstructure: "prefrontal",
    comparison: "parietal",
    meshes: ["FJ1744", "FJ1745", "FJ1787", "FJ1788", "FJ1800", "FJ1801", "FJ1833", "FJ1834"],
    camera: { position: [0.4, 1.4, 6.0], target: [0, 0.3, 0.5] },
    occurrence: {
      title: { zh: "前部大脑皮层", en: "Anterior cerebral cortex" },
      body: { zh: "额叶位于每个大脑半球前部、额头后方，并延伸至与顶叶分隔的中央沟。", en: "The frontal lobe sits at the front of each hemisphere, behind the forehead, and extends to the central sulcus that separates it from the parietal lobe." },
      motif: "frontal",
    },
    microscope: [
      { label: { zh: "结构磁共振（T1）", en: "T1 MRI" }, tone: "#d8c9a8", pattern: "mri-t1" },
      { label: { zh: "功能磁共振（BOLD）", en: "fMRI BOLD" }, tone: "#d99a4d", pattern: "fmri" },
      { label: { zh: "Nissl 染色", en: "Nissl Stain" }, tone: "#9a8e7c", pattern: "histology" },
    ],
    substructures: [
      {
        id: "prefrontal",
        name: { zh: "前额叶皮层", en: "Prefrontal Cortex" },
        subtitle: { zh: "执行控制", en: "The executive director" },
        color: "#b06f2c",
        attributes: [
          { label: { zh: "体积", en: "Volume" }, value: { zh: "约占皮层 10%", en: "About 10% of cortex" } },
          { label: { zh: "成熟", en: "Maturity" }, value: { zh: "较晚完全发育，约 25 岁", en: "Last to fully develop, around age 25" } },
          { label: { zh: "连接", en: "Connections" }, value: { zh: "边缘系统、顶叶、颞叶", en: "Limbic, parietal, temporal" } },
        ],
        note:
          { zh: "前额叶皮层协调计划、决策、工作记忆和冲动控制，常被称为执行功能相关区域。", en: "The prefrontal cortex coordinates planning, decision making, working memory, and impulse control. It is the seat of the so called executive functions." },
        fact: { zh: "相较其他灵长类，人类前额叶皮层是演化扩展最明显的区域之一。", en: "The prefrontal cortex is the most evolutionarily expanded area in humans relative to other primates." },
        meshes: ["FJ1787", "FJ1788", "FJ1833", "FJ1834"],
        camera: { position: [0.4, 0.5, 4.8], target: [0, 0.3, 0.6] },
      },
      {
        id: "motor",
        name: { zh: "初级运动皮层", en: "Primary Motor Cortex" },
        subtitle: { zh: "动作启动", en: "The action launcher" },
        color: "#d6a64b",
        attributes: [
          { label: { zh: "位置", en: "Location" }, value: { zh: "中央前回", en: "Precentral gyrus" } },
          { label: { zh: "映射", en: "Map" }, value: { zh: "躯体运动人形图", en: "Somatotopic motor homunculus" } },
          { label: { zh: "层级", en: "Layer" }, value: { zh: "第 V 层巨型 Betz 细胞", en: "Giant Betz cells in layer V" } },
        ],
        note:
          { zh: "初级运动皮层通过皮质脊髓束发送信号，驱动身体肌肉的随意运动。", en: "The primary motor cortex sends signals down the corticospinal tract to drive voluntary movement of muscles across the body." },
        fact: { zh: "手和嘴唇在运动映射中占据较大区域，反映精细控制需求。", en: "The hands and lips occupy disproportionately large areas of the motor map, reflecting fine control." },
        meshes: ["FJ1800", "FJ1801"],
        camera: { position: [0.5, 3.4, 1.4], target: [0, 0.2, 0] },
      },
      {
        id: "broca",
        name: { zh: "布罗卡区", en: "Broca's Area" },
        subtitle: { zh: "言语生成", en: "The speech producer" },
        color: "#e0b87a",
        attributes: [
          { label: { zh: "Brodmann", en: "Brodmann" }, value: { zh: "44 区和 45 区", en: "Areas 44 and 45" } },
          { label: { zh: "侧化", en: "Lateralization" }, value: { zh: "通常左侧优势", en: "Usually left dominant" } },
          { label: { zh: "网络", en: "Network" }, value: { zh: "背侧语言通路", en: "Dorsal language stream" } },
        ],
        note:
          { zh: "布罗卡区帮助将词语组织成流畅言语，并支持发音的运动计划。", en: "Broca's area helps assemble words into fluent speech and supports the motor planning of articulation." },
        fact: { zh: "该区域受损可导致非流利性失语：理解相对保留，但说话费力。", en: "Damage here produces non fluent aphasia: comprehension survives but speech becomes effortful." },
        meshes: ["FJ1744"],
        camera: { position: [-3.6, 0.2, 1.6], target: [-0.6, 0, 0.4] },
      },
      {
        id: "orbitofrontal",
        name: { zh: "眶额皮层", en: "Orbitofrontal Cortex" },
        subtitle: { zh: "价值评估", en: "The value evaluator" },
        color: "#a87238",
        attributes: [
          { label: { zh: "位置", en: "Position" }, value: { zh: "眼眶上方", en: "Above the orbits of the eyes" } },
          { label: { zh: "输入", en: "Inputs" }, value: { zh: "嗅觉、味觉、边缘系统", en: "Olfactory, gustatory, limbic" } },
          { label: { zh: "作用", en: "Role" }, value: { zh: "奖赏与社会判断", en: "Reward and social judgment" } },
        ],
        note:
          { zh: "眶额皮层权衡奖赏与惩罚，并通过整合情绪信号影响社会决策。", en: "The orbitofrontal cortex weighs rewards and punishments and shapes social decision making by integrating emotional signals." },
        fact: { zh: "Phineas Gage 的经典病例显示，眶额损伤可能改变人格。", en: "Phineas Gage's classic case revealed how orbitofrontal damage can change personality." },
        meshes: [],
      },
    ],
  },
  {
    id: "parietal",
    name: { zh: "顶叶", en: "Parietal Lobe" },
    type: { zh: "大脑叶", en: "Cerebral Lobe" },
    accent: "#5e8a4b",
    accentSoft: "#e2efd3",
    color: "#7aab63",
    modelKind: "parietal",
    defaultSubstructure: "somatosensory",
    comparison: "temporal",
    meshes: ["FJ1732", "FJ1733", "FJ1797", "FJ1798", "FJ1835", "FJ1836", "FJ1841", "FJ1842"],
    camera: { position: [0.3, 5.5, -2.5], target: [0, 0.2, -0.4] },
    occurrence: {
      title: { zh: "上后部皮层", en: "Superior posterior cortex" },
      body: { zh: "顶叶位于中央沟与顶枕沟之间，在颞叶上方、额叶后方。", en: "The parietal lobe sits between the central sulcus and the parieto-occipital sulcus, above the temporal lobe and behind the frontal lobe." },
      motif: "parietal",
    },
    microscope: [
      { label: { zh: "结构磁共振（T1）", en: "T1 MRI" }, tone: "#cad8b7", pattern: "mri-t1" },
      { label: { zh: "弥散张量成像（DTI）", en: "DTI Tractography" }, tone: "#7e9de1", pattern: "dti" },
      { label: { zh: "Nissl 染色", en: "Nissl Stain" }, tone: "#8e8f7d", pattern: "histology" },
    ],
    substructures: [
      {
        id: "somatosensory",
        name: { zh: "躯体感觉皮层", en: "Somatosensory Cortex" },
        subtitle: { zh: "身体地图", en: "The body map" },
        color: "#5d8a3d",
        attributes: [
          { label: { zh: "位置", en: "Location" }, value: { zh: "中央后回", en: "Postcentral gyrus" } },
          { label: { zh: "映射", en: "Map" }, value: { zh: "感觉人形图", en: "Sensory homunculus" } },
          { label: { zh: "模态", en: "Modality" }, value: { zh: "触觉、压力、本体感觉", en: "Touch, pressure, proprioception" } },
        ],
        note:
          { zh: "躯体感觉皮层接收来自身体的信号，并以皮肤和关节的拓扑地图方式排列。", en: "The somatosensory cortex receives signals from the body and is laid out as a topographic map of the skin and joints." },
        fact: { zh: "嘴唇和指尖在感觉人形图中占据很大区域。", en: "The lips and fingertips occupy huge zones of the sensory homunculus." },
        meshes: ["FJ1797", "FJ1798"],
        camera: { position: [0.5, 3.4, -0.3], target: [0, 0.2, 0] },
      },
      {
        id: "posteriorParietal",
        name: { zh: "后顶叶皮层", en: "Posterior Parietal Cortex" },
        subtitle: { zh: "空间整合", en: "The spatial integrator" },
        color: "#8aaf60",
        attributes: [
          { label: { zh: "功能", en: "Function" }, value: { zh: "空间推理", en: "Spatial reasoning" } },
          { label: { zh: "通路", en: "Streams" }, value: { zh: "背侧“位置”通路", en: "Dorsal where pathway" } },
          { label: { zh: "输出", en: "Output" }, value: { zh: "额叶运动计划", en: "Frontal motor planning" } },
        ],
        note:
          { zh: "后顶叶皮层构建空间表征，并引导伸手、眼动和注意。", en: "The posterior parietal cortex builds spatial representations of the world and guides reaching, eye movements, and attention." },
        fact: { zh: "该区域受损可导致半侧空间忽略，即忽视一侧空间。", en: "Damage here can produce hemispatial neglect, where one side of space is ignored." },
        meshes: ["FJ1835", "FJ1836"],
        camera: { position: [0.5, 3.4, -2], target: [0, 0.2, -0.5] },
      },
      {
        id: "angular",
        name: { zh: "角回", en: "Angular Gyrus" },
        subtitle: { zh: "跨模态枢纽", en: "The cross-modal hub" },
        color: "#a3c178",
        attributes: [
          { label: { zh: "Brodmann", en: "Brodmann" }, value: { zh: "39 区", en: "Area 39" } },
          { label: { zh: "位置", en: "Position" }, value: { zh: "顶颞交界处", en: "At parietal temporal junction" } },
          { label: { zh: "功能", en: "Function" }, value: { zh: "阅读、数学、语义", en: "Reading, math, semantics" } },
        ],
        note:
          { zh: "角回是多模态联合区，帮助整合语言、数字和空间概念。", en: "The angular gyrus is a multimodal association zone that helps bind language, numbers, and spatial concepts." },
        fact: { zh: "阅读和心算时，角回常表现出活动。", en: "It is consistently active during reading and mental arithmetic." },
        meshes: ["FJ1732", "FJ1733"],
        camera: { position: [3.4, 1, -2], target: [0.5, 0, -0.4] },
      },
    ],
  },
  {
    id: "temporal",
    name: { zh: "颞叶", en: "Temporal Lobe" },
    type: { zh: "大脑叶", en: "Cerebral Lobe" },
    accent: "#a55050",
    accentSoft: "#f3d8d8",
    color: "#c46d6d",
    modelKind: "temporal",
    defaultSubstructure: "auditory",
    comparison: "occipital",
    meshes: ["FJ1746", "FJ1747", "FJ1783", "FJ1784", "FJ1785", "FJ1786", "FJ1789", "FJ1790"],
    camera: { position: [5.5, 0.4, 0.6], target: [0, 0.0, 0.0] },
    occurrence: {
      title: { zh: "外侧裂下方皮层", en: "Lateral cortex below sylvian fissure" },
      body: { zh: "颞叶位于两侧外侧沟下方，占据太阳穴后方区域，并向后延伸至枕叶方向。", en: "The temporal lobe lies below the lateral sulcus on each side, occupying the space behind the temple and reaching back toward the occipital lobe." },
      motif: "temporal",
    },
    microscope: [
      { label: { zh: "结构磁共振（T1）", en: "T1 MRI" }, tone: "#e1c5c5", pattern: "mri-t1" },
      { label: { zh: "功能磁共振（BOLD）", en: "fMRI BOLD" }, tone: "#d97a7a", pattern: "fmri" },
      { label: { zh: "组织学染色", en: "Histology" }, tone: "#928283", pattern: "histology" },
    ],
    substructures: [
      {
        id: "auditory",
        name: { zh: "听觉皮层", en: "Auditory Cortex" },
        subtitle: { zh: "声音分析", en: "The sound analyzer" },
        color: "#c25656",
        attributes: [
          { label: { zh: "位置", en: "Location" }, value: { zh: "Heschl 回", en: "Heschl's gyrus" } },
          { label: { zh: "映射", en: "Map" }, value: { zh: "音频拓扑排列", en: "Tonotopic frequency layout" } },
          { label: { zh: "Brodmann", en: "Brodmann" }, value: { zh: "41 区和 42 区", en: "Areas 41 and 42" } },
        ],
        note:
          { zh: "初级听觉皮层映射传入频率，是听觉的第一层皮层处理阶段。", en: "The primary auditory cortex maps incoming frequencies and forms the first cortical stage of hearing." },
        fact: { zh: "相邻神经元响应相邻频率，形成类似键盘的频率地图。", en: "Adjacent neurons respond to neighboring frequencies, producing a piano keyboard like map." },
        meshes: [],
      },
      {
        id: "wernicke",
        name: { zh: "韦尼克区", en: "Wernicke's Area" },
        subtitle: { zh: "意义解码", en: "The meaning decoder" },
        color: "#d97070",
        attributes: [
          { label: { zh: "位置", en: "Position" }, value: { zh: "颞上回后部", en: "Posterior superior temporal gyrus" } },
          { label: { zh: "侧化", en: "Lateralization" }, value: { zh: "通常左侧优势", en: "Usually left dominant" } },
          { label: { zh: "网络", en: "Network" }, value: { zh: "腹侧语言通路", en: "Ventral language stream" } },
        ],
        note:
          { zh: "韦尼克区帮助将声音映射到意义，并支持言语理解。", en: "Wernicke's area helps map sounds onto meaning and supports speech comprehension." },
        fact: { zh: "该区域受损可导致流利但无意义的言语，称为韦尼克失语。", en: "Damage here produces fluent but nonsensical speech, called Wernicke's aphasia." },
        meshes: [],
      },
      {
        id: "fusiform",
        name: { zh: "梭状回面孔区", en: "Fusiform Face Area" },
        subtitle: { zh: "面孔识别", en: "The face detector" },
        color: "#e29797",
        attributes: [
          { label: { zh: "位置", en: "Position" }, value: { zh: "腹侧梭状回", en: "Ventral fusiform gyrus" } },
          { label: { zh: "选择性", en: "Selectivity" }, value: { zh: "面孔高于物体", en: "Faces over objects" } },
          { label: { zh: "侧化", en: "Lateralization" }, value: { zh: "右侧优势", en: "Right dominant" } },
        ],
        note:
          { zh: "人观看面孔时，梭状回面孔区会明显激活，是面孔识别的重要区域。", en: "The fusiform face area shows strong activation when people view faces and is central to face recognition." },
        fact: { zh: "该区域病变可能导致面孔失认，难以识别熟悉面孔。", en: "Lesions here can cause prosopagnosia, the inability to recognize familiar faces." },
        meshes: ["FJ1783", "FJ1784"],
        camera: { position: [0.2, -3.4, 1.2], target: [0, -0.3, 0.2] },
      },
      {
        id: "inferiorTemporal",
        name: { zh: "下颞叶皮层", en: "Inferior Temporal Cortex" },
        subtitle: { zh: "物体表征", en: "The object library" },
        color: "#a73e3e",
        attributes: [
          { label: { zh: "通路", en: "Stream" }, value: { zh: "腹侧“什么”通路", en: "Ventral what pathway" } },
          { label: { zh: "编码", en: "Coding" }, value: { zh: "视角不变物体", en: "View invariant objects" } },
          { label: { zh: "输入", en: "Inputs" }, value: { zh: "来自 V4 纹外区", en: "From V4 extrastriate" } },
        ],
        note:
          { zh: "下颞叶皮层储存丰富的物体表征，支持形状、工具和动物识别。", en: "The inferior temporal cortex stores rich object representations and supports recognition of shapes, tools, and animals." },
        fact: { zh: "该区域单个神经元可对非常具体的物体甚至单张面孔选择性放电。", en: "Single neurons here can fire selectively for very specific objects, even individual faces." },
        meshes: ["FJ1746", "FJ1747"],
        camera: { position: [3.8, -1.4, 1], target: [0.5, -0.3, 0.2] },
      },
    ],
  },
  {
    id: "occipital",
    name: { zh: "枕叶", en: "Occipital Lobe" },
    type: { zh: "大脑叶", en: "Cerebral Lobe" },
    accent: "#3f5d96",
    accentSoft: "#d8e2f2",
    color: "#5d7fb4",
    modelKind: "occipital",
    defaultSubstructure: "v1",
    comparison: "parietal",
    meshes: ["FJ1791", "FJ1792"],
    camera: { position: [0, 1.0, -5.5], target: [0, 0.0, 0.0] },
    occurrence: {
      title: { zh: "顶枕沟后方皮层", en: "Posterior cortex behind parieto-occipital sulcus" },
      body: { zh: "枕叶位于大脑最后方。距状沟将其分为上下两岸，其中包含初级视觉皮层。", en: "The occipital lobe sits at the very back of the brain. The calcarine sulcus splits it into upper and lower banks that house the primary visual cortex." },
      motif: "occipital",
    },
    microscope: [
      { label: { zh: "结构磁共振（T1）", en: "T1 MRI" }, tone: "#c2cee3", pattern: "mri-t1" },
      { label: { zh: "功能磁共振（BOLD）", en: "fMRI Retinotopy" }, tone: "#5e80b9", pattern: "fmri" },
      { label: { zh: "髓鞘染色", en: "Myelin Stain" }, tone: "#8a93a4", pattern: "histology" },
    ],
    substructures: [
      {
        id: "v1",
        name: { zh: "V1 初级视觉皮层", en: "V1 Primary Visual Cortex" },
        subtitle: { zh: "图像入口", en: "The image entry point" },
        color: "#3a5e96",
        attributes: [
          { label: { zh: "位置", en: "Position" }, value: { zh: "距状沟两岸", en: "Banks of calcarine sulcus" } },
          { label: { zh: "映射", en: "Map" }, value: { zh: "视网膜拓扑", en: "Retinotopic" } },
          { label: { zh: "第 4 层", en: "Layer 4" }, value: { zh: "Gennari 纹", en: "Stria of Gennari" } },
        ],
        note:
          { zh: "V1 是视觉的第一层皮层处理阶段，视网膜图像在此映射到皮层并进行边缘和方向检测。", en: "V1 is the first cortical stage of vision, where the retinal image is mapped onto the cortex with edge and orientation detectors." },
        fact: { zh: "Hubel 和 Wiesel 因揭示 V1 方向柱获得诺贝尔奖。", en: "Hubel and Wiesel won a Nobel Prize for revealing V1's orientation columns." },
        meshes: [],
      },
      {
        id: "v2v3",
        name: { zh: "V2 与 V3 纹外区", en: "V2 and V3 Extrastriate" },
        subtitle: { zh: "形状加工", en: "The shape builder" },
        color: "#6b8ec0",
        attributes: [
          { label: { zh: "输入", en: "Inputs" }, value: { zh: "来自 V1", en: "From V1" } },
          { label: { zh: "功能", en: "Function" }, value: { zh: "轮廓、颜色、纹理", en: "Contours, color, texture" } },
          { label: { zh: "通路", en: "Streams" }, value: { zh: "分为背侧与腹侧", en: "Splits into dorsal and ventral" } },
        ],
        note:
          { zh: "V2 与 V3 进一步处理 V1 的特征，并开始将轮廓、深度和颜色整合为形状。", en: "V2 and V3 elaborate features begun in V1 and start to bind contours, depth, and color into coherent shapes." },
        fact: { zh: "这里的错觉轮廓神经元会响应眼睛并未直接看到的线条。", en: "Illusory contour neurons here respond to lines that the eye does not see directly." },
        meshes: [],
      },
      {
        id: "lingual",
        name: { zh: "舌回", en: "Lingual Gyrus" },
        subtitle: { zh: "颜色与文字", en: "The color and word reader" },
        color: "#9ab2d3",
        attributes: [
          { label: { zh: "位置", en: "Position" }, value: { zh: "距状沟下方", en: "Below calcarine sulcus" } },
          { label: { zh: "功能", en: "Function" }, value: { zh: "颜色与视觉词形", en: "Color and visual words" } },
          { label: { zh: "连接", en: "Connections" }, value: { zh: "至梭状回", en: "To fusiform gyrus" } },
        ],
        note:
          { zh: "舌回参与颜色知觉和阅读，并与梭状回连接以支持词识别。", en: "The lingual gyrus participates in color perception and reading, and connects with the fusiform gyrus for word recognition." },
        fact: { zh: "左侧舌回或梭状回损伤后可能出现纯失读。", en: "Pure alexia can follow lingual or fusiform damage on the left." },
        meshes: [],
      },
    ],
  },
  {
    id: "cerebellum",
    name: { zh: "小脑", en: "Cerebellum" },
    type: { zh: "后脑区域", en: "Hindbrain Region" },
    accent: "#7253a4",
    accentSoft: "#e7defb",
    color: "#8d6cb5",
    modelKind: "cerebellum",
    defaultSubstructure: "hemispheres",
    comparison: "brainstem",
    meshes: ["FJ1781", "FJ1830"],
    camera: { position: [0, -0.8, -5.0], target: [0, -0.2, 0.0] },
    occurrence: {
      title: { zh: "脑干后方、枕叶下方", en: "Behind the brainstem, below the occipital lobe" },
      body: { zh: "小脑位于枕叶下方的后颅窝、脑干后方，并通过三对小脑脚连接。", en: "The cerebellum sits in the posterior fossa beneath the occipital lobe and behind the brainstem, connected by three pairs of cerebellar peduncles." },
      motif: "cerebellum",
    },
    microscope: [
      { label: { zh: "结构磁共振（T1）", en: "T1 MRI" }, tone: "#d4c4ec", pattern: "mri-t1" },
      { label: { zh: "弥散张量成像（DTI）", en: "DTI Tractography" }, tone: "#8a76c5", pattern: "dti" },
      { label: { zh: "Purkinje 染色", en: "Purkinje Stain" }, tone: "#867c97", pattern: "histology" },
    ],
    substructures: [
      {
        id: "vermis",
        name: { zh: "小脑蚓部", en: "Vermis" },
        subtitle: { zh: "中线核心", en: "The midline core" },
        color: "#5d3e8c",
        attributes: [
          { label: { zh: "位置", en: "Position" }, value: { zh: "小脑中线", en: "Midline of cerebellum" } },
          { label: { zh: "作用", en: "Role" }, value: { zh: "躯干与姿势", en: "Trunk and posture" } },
          { label: { zh: "输入", en: "Inputs" }, value: { zh: "脊髓小脑束", en: "Spinocerebellar tracts" } },
        ],
        note:
          { zh: "小脑蚓部位于中线，利用脊髓反馈帮助协调姿势和躯干运动。", en: "The vermis sits at the midline and helps coordinate posture and trunk movement using spinal feedback." },
        fact: { zh: "蚓部损伤更常引起躯干性共济失调，而不是肢体震颤。", en: "Vermal damage tends to produce truncal ataxia rather than limb tremor." },
        meshes: [],
      },
      {
        id: "hemispheres",
        name: { zh: "小脑半球", en: "Cerebellar Hemispheres" },
        subtitle: { zh: "精细运动", en: "The fine motor specialists" },
        color: "#8e6cb6",
        attributes: [
          { label: { zh: "位置", en: "Position" }, value: { zh: "外侧叶", en: "Lateral lobes" } },
          { label: { zh: "作用", en: "Role" }, value: { zh: "肢体协调、时序", en: "Limb coordination, timing" } },
          { label: { zh: "环路", en: "Loops" }, value: { zh: "与运动皮层连接", en: "With motor cortex" } },
        ],
        note:
          { zh: "小脑半球通过与大脑皮层的闭环连接，支持熟练肢体运动和运动学习。", en: "The cerebellar hemispheres support skilled limb movement and motor learning through closed loops with the cerebral cortex." },
        fact: { zh: "小脑包含约半数脑神经元，其中多为颗粒细胞。", en: "The cerebellum holds about half of all neurons in the brain, mostly granule cells." },
        meshes: ["FJ1781", "FJ1830"],
        camera: { position: [0, -1, -4.5], target: [0, -0.4, 0] },
      },
      {
        id: "dentate",
        name: { zh: "齿状核", en: "Dentate Nucleus" },
        subtitle: { zh: "输出通道", en: "The output gateway" },
        color: "#aa86ce",
        attributes: [
          { label: { zh: "类型", en: "Type" }, value: { zh: "小脑深部核团", en: "Deep cerebellar nucleus" } },
          { label: { zh: "输出", en: "Output" }, value: { zh: "经小脑上脚", en: "Via superior peduncle" } },
          { label: { zh: "目标", en: "Targets" }, value: { zh: "丘脑和运动皮层", en: "Thalamus and motor cortex" } },
        ],
        note:
          { zh: "齿状核是最大的小脑深部核团，将小脑输出传至丘脑并最终到达运动皮层。", en: "The dentate nucleus is the largest deep nucleus and routes cerebellar output to thalamus and ultimately motor cortex." },
        fact: { zh: "其褶皱形态类似一团折叠的神经细胞。", en: "Its folded shape resembles a crumpled bag of nerve cells." },
        meshes: [],
      },
      {
        id: "flocculus",
        name: { zh: "绒球小结叶", en: "Flocculonodular Lobe" },
        subtitle: { zh: "平衡中枢", en: "The balance center" },
        color: "#c5a4dc",
        attributes: [
          { label: { zh: "输入", en: "Inputs" }, value: { zh: "前庭核", en: "Vestibular nuclei" } },
          { label: { zh: "作用", en: "Role" }, value: { zh: "平衡与凝视", en: "Balance and gaze" } },
          { label: { zh: "位置", en: "Position" }, value: { zh: "下表面", en: "Inferior surface" } },
        ],
        note:
          { zh: "绒球小结叶通过与前庭系统的紧密联系协调平衡和眼动。", en: "The flocculonodular lobe coordinates balance and eye movements through close ties with the vestibular system." },
        fact: { zh: "从演化角度看，它是小脑中较古老的部分。", en: "It is the oldest part of the cerebellum in evolutionary terms." },
        meshes: [],
      },
    ],
  },
  {
    id: "brainstem",
    name: { zh: "脑干", en: "Brainstem" },
    type: { zh: "脑干", en: "Brainstem" },
    accent: "#7c5a3a",
    accentSoft: "#ecd9bf",
    color: "#9c7a5e",
    modelKind: "brainstem",
    defaultSubstructure: "midbrain",
    comparison: "cerebellum",
    meshes: [
      "FJ1738", "FJ1762", "FJ1769", "FJ1770", "FJ1775", "FJ1779",
      "FJ1810", "FJ1817", "FJ1822", "FJ1826", "FJ1831",
    ],
    camera: { position: [0, -0.3, -4.8], target: [0, -0.5, 0] },
    occurrence: {
      title: { zh: "与脊髓连续", en: "Continuous with the spinal cord" },
      body: { zh: "脑干从间脑向下延伸至枕骨大孔，将大脑和小脑与脊髓连接。", en: "The brainstem extends from the diencephalon down to the foramen magnum and connects the cerebrum and cerebellum to the spinal cord." },
      motif: "brainstem",
    },
    microscope: [
      { label: { zh: "结构磁共振（T1）", en: "T1 MRI" }, tone: "#dcc8af", pattern: "mri-t1" },
      { label: { zh: "弥散张量成像（DTI）", en: "DTI Tractography" }, tone: "#a07a52", pattern: "dti" },
      { label: { zh: "髓鞘染色", en: "Myelin Stain" }, tone: "#8b7c66", pattern: "histology" },
    ],
    substructures: [
      {
        id: "midbrain",
        name: { zh: "中脑", en: "Midbrain" },
        subtitle: { zh: "反射中继", en: "The reflex relay" },
        color: "#9c6a3c",
        attributes: [
          { label: { zh: "组成", en: "Parts" }, value: { zh: "顶盖、被盖、脑脚", en: "Tectum, tegmentum, peduncles" } },
          { label: { zh: "包含", en: "Houses" }, value: { zh: "黑质", en: "Substantia nigra" } },
          { label: { zh: "作用", en: "Role" }, value: { zh: "眼动、反射", en: "Eye movements, reflexes" } },
        ],
        note:
          { zh: "中脑包含参与视觉和听觉反射的上下丘，以及与运动相关的黑质。", en: "The midbrain houses superior and inferior colliculi for visual and auditory reflexes plus the substantia nigra for movement." },
        fact: { zh: "黑质多巴胺神经元丢失会导致帕金森病。", en: "Loss of dopamine neurons in the substantia nigra causes Parkinson's disease." },
        meshes: ["FJ1738", "FJ1762", "FJ1770", "FJ1779", "FJ1810", "FJ1817", "FJ1826"],
        camera: { position: [0, -0.1, -4.2], target: [0, -0.3, 0] },
      },
      {
        id: "pons",
        name: { zh: "脑桥", en: "Pons" },
        subtitle: { zh: "信号交换", en: "The traffic exchange" },
        color: "#b08458",
        attributes: [
          { label: { zh: "位置", en: "Position" }, value: { zh: "中脑与延髓之间", en: "Between midbrain and medulla" } },
          { label: { zh: "连接", en: "Connects" }, value: { zh: "大脑至小脑", en: "Cerebrum to cerebellum" } },
          { label: { zh: "包含", en: "Houses" }, value: { zh: "睡眠与呼吸相关核团", en: "Sleep and respiration nuclei" } },
        ],
        note:
          { zh: "脑桥在大脑皮层与小脑之间中继信号，并包含调控睡眠和呼吸的核团。", en: "The pons relays signals between the cerebral cortex and cerebellum and contains nuclei that gate sleep and breathing." },
        fact: { zh: "脑桥核承载大量皮质-脑桥-小脑束。", en: "Pontine nuclei carry massive corticopontocerebellar bundles." },
        meshes: ["FJ1775", "FJ1822"],
        camera: { position: [0, -0.5, -4.0], target: [0, -0.7, 0] },
      },
      {
        id: "medulla",
        name: { zh: "延髓", en: "Medulla Oblongata" },
        subtitle: { zh: "生命调控", en: "The vital regulator" },
        color: "#7d5734",
        attributes: [
          { label: { zh: "位置", en: "Position" }, value: { zh: "脑干最下部", en: "Lowest brainstem" } },
          { label: { zh: "作用", en: "Role" }, value: { zh: "心率、呼吸", en: "Heart rate, breathing" } },
          { label: { zh: "锥体", en: "Pyramids" }, value: { zh: "皮质脊髓束交叉", en: "Corticospinal decussation" } },
        ],
        note:
          { zh: "延髓控制心率、呼吸和血压等生命关键功能，也是运动纤维交叉处。", en: "The medulla controls life critical functions including heart rate, breathing, and blood pressure, and is where motor fibers cross." },
        fact: { zh: "双侧延髓损伤通常与生命不相容。", en: "Bilateral medullary damage is incompatible with life." },
        meshes: ["FJ1769", "FJ1831"],
        camera: { position: [0, -1.4, -3.5], target: [0, -0.7, 0] },
      },
      {
        id: "reticular",
        name: { zh: "网状结构", en: "Reticular Formation" },
        subtitle: { zh: "唤醒网络", en: "The arousal network" },
        color: "#c8a07a",
        attributes: [
          { label: { zh: "分布", en: "Spread" }, value: { zh: "贯穿脑干核心", en: "Throughout brainstem core" } },
          { label: { zh: "作用", en: "Role" }, value: { zh: "唤醒与意识", en: "Arousal and consciousness" } },
          { label: { zh: "输出", en: "Outputs" }, value: { zh: "弥散投射至皮层", en: "Diffuse to cortex" } },
        ],
        note:
          { zh: "网状结构是弥散网络，通过上行投射调节唤醒状态和皮层活动。", en: "The reticular formation is a diffuse network that gates arousal and modulates cortical activity through ascending projections." },
        fact: { zh: "该区域受损可能在身体结构保留的情况下导致昏迷。", en: "Damage here can leave the body intact but produce coma." },
        meshes: [],
      },
    ],
  },
  {
    id: "limbic",
    name: { zh: "边缘系统", en: "Limbic System" },
    type: { zh: "皮层下系统", en: "Subcortical System" },
    accent: "#a14781",
    accentSoft: "#f5d8e9",
    color: "#b96198",
    modelKind: "limbic",
    defaultSubstructure: "hippocampus",
    comparison: "frontal",
    meshes: [
      "FJ1739", "FJ1740", "FJ1753", "FJ1759", "FJ1760",
      "FJ1780", "FJ1782", "FJ1807", "FJ1808", "FJ1828",
    ],
    camera: { position: [0.4, 5.5, 0.4], target: [0, 0.0, 0.2] },
    occurrence: {
      title: { zh: "内侧深部结构", en: "Medial deep structures" },
      body: { zh: "边缘系统是一组环绕胼胝体的结构，将皮层与深部核团连接，关联感觉、记忆和情绪。", en: "The limbic system is a ring of structures around the corpus callosum that ties cortex to deep nuclei. It bridges sensation, memory, and emotion." },
      motif: "limbic",
    },
    microscope: [
      { label: { zh: "结构磁共振（T1）", en: "T1 MRI" }, tone: "#e7c4d8", pattern: "mri-t1" },
      { label: { zh: "功能磁共振（BOLD）", en: "fMRI BOLD" }, tone: "#b14d8c", pattern: "fmri" },
      { label: { zh: "Golgi 染色", en: "Golgi Stain" }, tone: "#917d88", pattern: "histology" },
    ],
    substructures: [
      {
        id: "hippocampus",
        name: { zh: "海马体", en: "Hippocampus" },
        subtitle: { zh: "记忆整合", en: "The memory weaver" },
        color: "#a23978",
        attributes: [
          { label: { zh: "形态", en: "Shape" }, value: { zh: "卷曲似海马", en: "Curled like a seahorse" } },
          { label: { zh: "位置", en: "Position" }, value: { zh: "内侧颞叶", en: "Medial temporal lobe" } },
          { label: { zh: "细胞", en: "Cells" }, value: { zh: "位置细胞和网格细胞", en: "Place and grid cells" } },
        ],
        note:
          { zh: "海马体将事件绑定为情景记忆，并通过位置细胞和网格细胞支持空间导航。", en: "The hippocampus binds events into episodic memories and supports spatial navigation through specialized place and grid cells." },
        fact: { zh: "患者 HM 在双侧海马切除后失去了形成新记忆的能力。", en: "Patient HM lost the ability to form new memories after bilateral hippocampal removal." },
        meshes: ["FJ1759", "FJ1807"],
        camera: { position: [0, 4.5, 0.4], target: [0, 0, 0.2] },
      },
      {
        id: "amygdala",
        name: { zh: "杏仁核", en: "Amygdala" },
        subtitle: { zh: "显著性警报", en: "The salience alarm" },
        color: "#c66ea2",
        attributes: [
          { label: { zh: "位置", en: "Position" }, value: { zh: "前内侧颞叶", en: "Anterior medial temporal lobe" } },
          { label: { zh: "输入", en: "Inputs" }, value: { zh: "各类感觉通路", en: "All sensory streams" } },
          { label: { zh: "作用", en: "Role" }, value: { zh: "恐惧、情绪学习", en: "Fear, emotional learning" } },
        ],
        note:
          { zh: "杏仁核为刺激赋予情绪价值，对恐惧学习和快速威胁检测很重要。", en: "The amygdala assigns emotional value to stimuli and is essential for fear learning and rapid threat detection." },
        fact: { zh: "在有意识觉察威胁之前，它就可能驱动惊吓反应。", en: "It can drive a startle response before conscious awareness of a threat." },
        meshes: ["FJ1753"],
        camera: { position: [0.4, 3.8, 0.7], target: [0, 0, 0.4] },
      },
      {
        id: "cingulate",
        name: { zh: "扣带回", en: "Cingulate Gyrus" },
        subtitle: { zh: "冲突监测", en: "The conflict monitor" },
        color: "#d590b5",
        attributes: [
          { label: { zh: "位置", en: "Position" }, value: { zh: "胼胝体上方", en: "Above the corpus callosum" } },
          { label: { zh: "前部", en: "Anterior" }, value: { zh: "冲突与努力", en: "Conflict and effort" } },
          { label: { zh: "后部", en: "Posterior" }, value: { zh: "自我相关思维", en: "Self referential thought" } },
        ],
        note:
          { zh: "扣带回整合情绪与认知，参与监测冲突、错误和疼痛。", en: "The cingulate gyrus integrates emotion with cognition, monitoring conflict, error, and pain across the brain." },
        fact: { zh: "出现意外结果时，前扣带活动通常升高。", en: "Anterior cingulate activity rises whenever an unexpected outcome occurs." },
        meshes: ["FJ1739", "FJ1740"],
        camera: { position: [0, 5, -0.6], target: [0, 0, -0.4] },
      },
      {
        id: "hypothalamus",
        name: { zh: "下丘脑", en: "Hypothalamus" },
        subtitle: { zh: "身体调节", en: "The body governor" },
        color: "#7e2c5d",
        attributes: [
          { label: { zh: "大小", en: "Size" }, value: { zh: "约豌豆大小", en: "Pea sized" } },
          { label: { zh: "输出", en: "Outputs" }, value: { zh: "激素和自主神经", en: "Hormones and autonomic" } },
          { label: { zh: "驱动", en: "Drives" }, value: { zh: "口渴、饥饿、睡眠", en: "Thirst, hunger, sleep" } },
        ],
        note:
          { zh: "下丘脑整合自主神经系统与激素控制，调节饥饿、口渴和体温等驱动。", en: "The hypothalamus integrates the autonomic nervous system with hormonal control and tunes drives like hunger, thirst, and temperature." },
        fact: { zh: "它通过垂体设定身体的激素基线。", en: "Through the pituitary gland it sets the body's hormonal baseline." },
        meshes: ["FJ1760", "FJ1780", "FJ1808", "FJ1828"],
        camera: { position: [2.6, 0.1, 0.6], target: [0, -0.2, 0.1] },
      },
      {
        id: "thalamus",
        name: { zh: "丘脑", en: "Thalamus" },
        subtitle: { zh: "皮层中继", en: "The cortical relay" },
        color: "#e0a4c5",
        attributes: [
          { label: { zh: "位置", en: "Position" }, value: { zh: "大脑中央", en: "Center of the brain" } },
          { label: { zh: "作用", en: "Role" }, value: { zh: "感觉与运动中继", en: "Sensory and motor relay" } },
          { label: { zh: "核团", en: "Nuclei" }, value: { zh: "多个专门核团", en: "Many specialized groups" } },
        ],
        note:
          { zh: "丘脑是大脑的中央中继站，将感觉和运动信号路由至相应皮层区域。", en: "The thalamus is the central relay station of the brain, routing sensory and motor signals to the appropriate cortical areas." },
        fact: { zh: "几乎每个皮层区域都与专门的丘脑核团相配对。", en: "Almost every cortical area pairs with a dedicated thalamic nucleus." },
        meshes: ["FJ1782"],
        camera: { position: [0.4, 3.5, 0.1], target: [0, 0, 0] },
      },
    ],
  },
];

export function getRegionById(id: string) {
  return regions.find((region) => region.id === id) ?? regions[0];
}
