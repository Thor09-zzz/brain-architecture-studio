export type RegionKind =
  | "frontal"
  | "parietal"
  | "temporal"
  | "occipital"
  | "cerebellum"
  | "brainstem"
  | "limbic";

export type ViewMode = "mesh" | "focus";

export const BODYPARTS3D_LICENSE = {
  source: "BodyParts3D, © DBCLS",
  url: "https://lifesciencedb.jp/bp3d/",
  license: "CC-BY-SA 2.1 Japan",
} as const;

export type SubstructureItem = {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  attributes: Array<{
    label: string;
    value: string;
  }>;
  note: string;
  fact: string;
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
  name: string;
  type: string;
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
    title: string;
    body: string;
    motif: string;
  };
  microscope: Array<{
    label: string;
    tone: string;
    pattern: string;
  }>;
  substructures: SubstructureItem[];
};

export const DEFAULT_CAMERA: CameraPose = {
  position: [2.4, 1.5, 3.0],
  target: [0, 0.05, 0],
};

export const FJ_MESH_BASE_URL = "/models/regions";
export const fjMeshUrl = (code: string) => `${FJ_MESH_BASE_URL}/${code}.glb`;

export const regions: RegionItem[] = [
  {
    id: "frontal",
    name: "Frontal Lobe",
    type: "Cerebral Lobe",
    accent: "#c0863a",
    accentSoft: "#f1e3c4",
    color: "#d4a04a",
    modelKind: "frontal",
    defaultSubstructure: "prefrontal",
    comparison: "parietal",
    meshes: ["FJ1744", "FJ1745", "FJ1787", "FJ1788", "FJ1800", "FJ1801", "FJ1833", "FJ1834"],
    camera: { position: [0.4, 1.4, 6.0], target: [0, 0.3, 0.5] },
    occurrence: {
      title: "Anterior cerebral cortex",
      body: "The frontal lobe sits at the front of each hemisphere, behind the forehead, and extends to the central sulcus that separates it from the parietal lobe.",
      motif: "frontal",
    },
    microscope: [
      { label: "T1 MRI", tone: "#d8c9a8", pattern: "mri-t1" },
      { label: "fMRI BOLD", tone: "#d99a4d", pattern: "fmri" },
      { label: "Nissl Stain", tone: "#9a8e7c", pattern: "histology" },
    ],
    substructures: [
      {
        id: "prefrontal",
        name: "Prefrontal Cortex",
        subtitle: "The executive director",
        color: "#b06f2c",
        attributes: [
          { label: "Volume", value: "About 10% of cortex" },
          { label: "Maturity", value: "Last to fully develop, around age 25" },
          { label: "Connections", value: "Limbic, parietal, temporal" },
        ],
        note:
          "The prefrontal cortex coordinates planning, decision making, working memory, and impulse control. It is the seat of the so called executive functions.",
        fact: "The prefrontal cortex is the most evolutionarily expanded area in humans relative to other primates.",
        meshes: ["FJ1787", "FJ1788", "FJ1833", "FJ1834"],
        camera: { position: [0.4, 0.5, 4.8], target: [0, 0.3, 0.6] },
      },
      {
        id: "motor",
        name: "Primary Motor Cortex",
        subtitle: "The action launcher",
        color: "#d6a64b",
        attributes: [
          { label: "Location", value: "Precentral gyrus" },
          { label: "Map", value: "Somatotopic motor homunculus" },
          { label: "Layer", value: "Giant Betz cells in layer V" },
        ],
        note:
          "The primary motor cortex sends signals down the corticospinal tract to drive voluntary movement of muscles across the body.",
        fact: "The hands and lips occupy disproportionately large areas of the motor map, reflecting fine control.",
        meshes: ["FJ1800", "FJ1801"],
        camera: { position: [0.5, 3.4, 1.4], target: [0, 0.2, 0] },
      },
      {
        id: "broca",
        name: "Broca's Area",
        subtitle: "The speech producer",
        color: "#e0b87a",
        attributes: [
          { label: "Brodmann", value: "Areas 44 and 45" },
          { label: "Lateralization", value: "Usually left dominant" },
          { label: "Network", value: "Dorsal language stream" },
        ],
        note:
          "Broca's area helps assemble words into fluent speech and supports the motor planning of articulation.",
        fact: "Damage here produces non fluent aphasia: comprehension survives but speech becomes effortful.",
        meshes: ["FJ1744"],
        camera: { position: [-3.6, 0.2, 1.6], target: [-0.6, 0, 0.4] },
      },
      {
        id: "orbitofrontal",
        name: "Orbitofrontal Cortex",
        subtitle: "The value evaluator",
        color: "#a87238",
        attributes: [
          { label: "Position", value: "Above the orbits of the eyes" },
          { label: "Inputs", value: "Olfactory, gustatory, limbic" },
          { label: "Role", value: "Reward and social judgment" },
        ],
        note:
          "The orbitofrontal cortex weighs rewards and punishments and shapes social decision making by integrating emotional signals.",
        fact: "Phineas Gage's classic case revealed how orbitofrontal damage can change personality.",
        meshes: [],
      },
    ],
  },
  {
    id: "parietal",
    name: "Parietal Lobe",
    type: "Cerebral Lobe",
    accent: "#5e8a4b",
    accentSoft: "#e2efd3",
    color: "#7aab63",
    modelKind: "parietal",
    defaultSubstructure: "somatosensory",
    comparison: "temporal",
    meshes: ["FJ1732", "FJ1733", "FJ1797", "FJ1798", "FJ1835", "FJ1836", "FJ1841", "FJ1842"],
    camera: { position: [0.3, 5.5, -2.5], target: [0, 0.2, -0.4] },
    occurrence: {
      title: "Superior posterior cortex",
      body: "The parietal lobe sits between the central sulcus and the parieto-occipital sulcus, above the temporal lobe and behind the frontal lobe.",
      motif: "parietal",
    },
    microscope: [
      { label: "T1 MRI", tone: "#cad8b7", pattern: "mri-t1" },
      { label: "DTI Tractography", tone: "#7e9de1", pattern: "dti" },
      { label: "Nissl Stain", tone: "#8e8f7d", pattern: "histology" },
    ],
    substructures: [
      {
        id: "somatosensory",
        name: "Somatosensory Cortex",
        subtitle: "The body map",
        color: "#5d8a3d",
        attributes: [
          { label: "Location", value: "Postcentral gyrus" },
          { label: "Map", value: "Sensory homunculus" },
          { label: "Modality", value: "Touch, pressure, proprioception" },
        ],
        note:
          "The somatosensory cortex receives signals from the body and is laid out as a topographic map of the skin and joints.",
        fact: "The lips and fingertips occupy huge zones of the sensory homunculus.",
        meshes: ["FJ1797", "FJ1798"],
        camera: { position: [0.5, 3.4, -0.3], target: [0, 0.2, 0] },
      },
      {
        id: "posteriorParietal",
        name: "Posterior Parietal Cortex",
        subtitle: "The spatial integrator",
        color: "#8aaf60",
        attributes: [
          { label: "Function", value: "Spatial reasoning" },
          { label: "Streams", value: "Dorsal where pathway" },
          { label: "Output", value: "Frontal motor planning" },
        ],
        note:
          "The posterior parietal cortex builds spatial representations of the world and guides reaching, eye movements, and attention.",
        fact: "Damage here can produce hemispatial neglect, where one side of space is ignored.",
        meshes: ["FJ1835", "FJ1836"],
        camera: { position: [0.5, 3.4, -2], target: [0, 0.2, -0.5] },
      },
      {
        id: "angular",
        name: "Angular Gyrus",
        subtitle: "The cross-modal hub",
        color: "#a3c178",
        attributes: [
          { label: "Brodmann", value: "Area 39" },
          { label: "Position", value: "At parietal temporal junction" },
          { label: "Function", value: "Reading, math, semantics" },
        ],
        note:
          "The angular gyrus is a multimodal association zone that helps bind language, numbers, and spatial concepts.",
        fact: "It is consistently active during reading and mental arithmetic.",
        meshes: ["FJ1732", "FJ1733"],
        camera: { position: [3.4, 1, -2], target: [0.5, 0, -0.4] },
      },
    ],
  },
  {
    id: "temporal",
    name: "Temporal Lobe",
    type: "Cerebral Lobe",
    accent: "#a55050",
    accentSoft: "#f3d8d8",
    color: "#c46d6d",
    modelKind: "temporal",
    defaultSubstructure: "auditory",
    comparison: "occipital",
    meshes: ["FJ1746", "FJ1747", "FJ1783", "FJ1784", "FJ1785", "FJ1786", "FJ1789", "FJ1790"],
    camera: { position: [5.5, 0.4, 0.6], target: [0, 0.0, 0.0] },
    occurrence: {
      title: "Lateral cortex below sylvian fissure",
      body: "The temporal lobe lies below the lateral sulcus on each side, occupying the space behind the temple and reaching back toward the occipital lobe.",
      motif: "temporal",
    },
    microscope: [
      { label: "T1 MRI", tone: "#e1c5c5", pattern: "mri-t1" },
      { label: "fMRI BOLD", tone: "#d97a7a", pattern: "fmri" },
      { label: "Histology", tone: "#928283", pattern: "histology" },
    ],
    substructures: [
      {
        id: "auditory",
        name: "Auditory Cortex",
        subtitle: "The sound analyzer",
        color: "#c25656",
        attributes: [
          { label: "Location", value: "Heschl's gyrus" },
          { label: "Map", value: "Tonotopic frequency layout" },
          { label: "Brodmann", value: "Areas 41 and 42" },
        ],
        note:
          "The primary auditory cortex maps incoming frequencies and forms the first cortical stage of hearing.",
        fact: "Adjacent neurons respond to neighboring frequencies, producing a piano keyboard like map.",
        meshes: [],
      },
      {
        id: "wernicke",
        name: "Wernicke's Area",
        subtitle: "The meaning decoder",
        color: "#d97070",
        attributes: [
          { label: "Position", value: "Posterior superior temporal gyrus" },
          { label: "Lateralization", value: "Usually left dominant" },
          { label: "Network", value: "Ventral language stream" },
        ],
        note:
          "Wernicke's area helps map sounds onto meaning and supports speech comprehension.",
        fact: "Damage here produces fluent but nonsensical speech, called Wernicke's aphasia.",
        meshes: [],
      },
      {
        id: "fusiform",
        name: "Fusiform Face Area",
        subtitle: "The face detector",
        color: "#e29797",
        attributes: [
          { label: "Position", value: "Ventral fusiform gyrus" },
          { label: "Selectivity", value: "Faces over objects" },
          { label: "Lateralization", value: "Right dominant" },
        ],
        note:
          "The fusiform face area shows strong activation when people view faces and is central to face recognition.",
        fact: "Lesions here can cause prosopagnosia, the inability to recognize familiar faces.",
        meshes: ["FJ1783", "FJ1784"],
        camera: { position: [0.2, -3.4, 1.2], target: [0, -0.3, 0.2] },
      },
      {
        id: "inferiorTemporal",
        name: "Inferior Temporal Cortex",
        subtitle: "The object library",
        color: "#a73e3e",
        attributes: [
          { label: "Stream", value: "Ventral what pathway" },
          { label: "Coding", value: "View invariant objects" },
          { label: "Inputs", value: "From V4 extrastriate" },
        ],
        note:
          "The inferior temporal cortex stores rich object representations and supports recognition of shapes, tools, and animals.",
        fact: "Single neurons here can fire selectively for very specific objects, even individual faces.",
        meshes: ["FJ1746", "FJ1747"],
        camera: { position: [3.8, -1.4, 1], target: [0.5, -0.3, 0.2] },
      },
    ],
  },
  {
    id: "occipital",
    name: "Occipital Lobe",
    type: "Cerebral Lobe",
    accent: "#3f5d96",
    accentSoft: "#d8e2f2",
    color: "#5d7fb4",
    modelKind: "occipital",
    defaultSubstructure: "v1",
    comparison: "parietal",
    meshes: ["FJ1791", "FJ1792"],
    camera: { position: [0, 1.0, -5.5], target: [0, 0.0, 0.0] },
    occurrence: {
      title: "Posterior cortex behind parieto-occipital sulcus",
      body: "The occipital lobe sits at the very back of the brain. The calcarine sulcus splits it into upper and lower banks that house the primary visual cortex.",
      motif: "occipital",
    },
    microscope: [
      { label: "T1 MRI", tone: "#c2cee3", pattern: "mri-t1" },
      { label: "fMRI Retinotopy", tone: "#5e80b9", pattern: "fmri" },
      { label: "Myelin Stain", tone: "#8a93a4", pattern: "histology" },
    ],
    substructures: [
      {
        id: "v1",
        name: "V1 Primary Visual Cortex",
        subtitle: "The image entry point",
        color: "#3a5e96",
        attributes: [
          { label: "Position", value: "Banks of calcarine sulcus" },
          { label: "Map", value: "Retinotopic" },
          { label: "Layer 4", value: "Stria of Gennari" },
        ],
        note:
          "V1 is the first cortical stage of vision, where the retinal image is mapped onto the cortex with edge and orientation detectors.",
        fact: "Hubel and Wiesel won a Nobel Prize for revealing V1's orientation columns.",
        meshes: [],
      },
      {
        id: "v2v3",
        name: "V2 and V3 Extrastriate",
        subtitle: "The shape builder",
        color: "#6b8ec0",
        attributes: [
          { label: "Inputs", value: "From V1" },
          { label: "Function", value: "Contours, color, texture" },
          { label: "Streams", value: "Splits into dorsal and ventral" },
        ],
        note:
          "V2 and V3 elaborate features begun in V1 and start to bind contours, depth, and color into coherent shapes.",
        fact: "Illusory contour neurons here respond to lines that the eye does not see directly.",
        meshes: [],
      },
      {
        id: "lingual",
        name: "Lingual Gyrus",
        subtitle: "The color and word reader",
        color: "#9ab2d3",
        attributes: [
          { label: "Position", value: "Below calcarine sulcus" },
          { label: "Function", value: "Color and visual words" },
          { label: "Connections", value: "To fusiform gyrus" },
        ],
        note:
          "The lingual gyrus participates in color perception and reading, and connects with the fusiform gyrus for word recognition.",
        fact: "Pure alexia can follow lingual or fusiform damage on the left.",
        meshes: [],
      },
    ],
  },
  {
    id: "cerebellum",
    name: "Cerebellum",
    type: "Hindbrain Region",
    accent: "#7253a4",
    accentSoft: "#e7defb",
    color: "#8d6cb5",
    modelKind: "cerebellum",
    defaultSubstructure: "hemispheres",
    comparison: "brainstem",
    meshes: ["FJ1781", "FJ1830"],
    camera: { position: [0, -0.8, -5.0], target: [0, -0.2, 0.0] },
    occurrence: {
      title: "Behind the brainstem, below the occipital lobe",
      body: "The cerebellum sits in the posterior fossa beneath the occipital lobe and behind the brainstem, connected by three pairs of cerebellar peduncles.",
      motif: "cerebellum",
    },
    microscope: [
      { label: "T1 MRI", tone: "#d4c4ec", pattern: "mri-t1" },
      { label: "DTI Tractography", tone: "#8a76c5", pattern: "dti" },
      { label: "Purkinje Stain", tone: "#867c97", pattern: "histology" },
    ],
    substructures: [
      {
        id: "vermis",
        name: "Vermis",
        subtitle: "The midline core",
        color: "#5d3e8c",
        attributes: [
          { label: "Position", value: "Midline of cerebellum" },
          { label: "Role", value: "Trunk and posture" },
          { label: "Inputs", value: "Spinocerebellar tracts" },
        ],
        note:
          "The vermis sits at the midline and helps coordinate posture and trunk movement using spinal feedback.",
        fact: "Vermal damage tends to produce truncal ataxia rather than limb tremor.",
        meshes: [],
      },
      {
        id: "hemispheres",
        name: "Cerebellar Hemispheres",
        subtitle: "The fine motor specialists",
        color: "#8e6cb6",
        attributes: [
          { label: "Position", value: "Lateral lobes" },
          { label: "Role", value: "Limb coordination, timing" },
          { label: "Loops", value: "With motor cortex" },
        ],
        note:
          "The cerebellar hemispheres support skilled limb movement and motor learning through closed loops with the cerebral cortex.",
        fact: "The cerebellum holds about half of all neurons in the brain, mostly granule cells.",
        meshes: ["FJ1781", "FJ1830"],
        camera: { position: [0, -1, -4.5], target: [0, -0.4, 0] },
      },
      {
        id: "dentate",
        name: "Dentate Nucleus",
        subtitle: "The output gateway",
        color: "#aa86ce",
        attributes: [
          { label: "Type", value: "Deep cerebellar nucleus" },
          { label: "Output", value: "Via superior peduncle" },
          { label: "Targets", value: "Thalamus and motor cortex" },
        ],
        note:
          "The dentate nucleus is the largest deep nucleus and routes cerebellar output to thalamus and ultimately motor cortex.",
        fact: "Its folded shape resembles a crumpled bag of nerve cells.",
        meshes: [],
      },
      {
        id: "flocculus",
        name: "Flocculonodular Lobe",
        subtitle: "The balance center",
        color: "#c5a4dc",
        attributes: [
          { label: "Inputs", value: "Vestibular nuclei" },
          { label: "Role", value: "Balance and gaze" },
          { label: "Position", value: "Inferior surface" },
        ],
        note:
          "The flocculonodular lobe coordinates balance and eye movements through close ties with the vestibular system.",
        fact: "It is the oldest part of the cerebellum in evolutionary terms.",
        meshes: [],
      },
    ],
  },
  {
    id: "brainstem",
    name: "Brainstem",
    type: "Brainstem",
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
      title: "Continuous with the spinal cord",
      body: "The brainstem extends from the diencephalon down to the foramen magnum and connects the cerebrum and cerebellum to the spinal cord.",
      motif: "brainstem",
    },
    microscope: [
      { label: "T1 MRI", tone: "#dcc8af", pattern: "mri-t1" },
      { label: "DTI Tractography", tone: "#a07a52", pattern: "dti" },
      { label: "Myelin Stain", tone: "#8b7c66", pattern: "histology" },
    ],
    substructures: [
      {
        id: "midbrain",
        name: "Midbrain",
        subtitle: "The reflex relay",
        color: "#9c6a3c",
        attributes: [
          { label: "Parts", value: "Tectum, tegmentum, peduncles" },
          { label: "Houses", value: "Substantia nigra" },
          { label: "Role", value: "Eye movements, reflexes" },
        ],
        note:
          "The midbrain houses superior and inferior colliculi for visual and auditory reflexes plus the substantia nigra for movement.",
        fact: "Loss of dopamine neurons in the substantia nigra causes Parkinson's disease.",
        meshes: ["FJ1738", "FJ1762", "FJ1770", "FJ1779", "FJ1810", "FJ1817", "FJ1826"],
        camera: { position: [0, -0.1, -4.2], target: [0, -0.3, 0] },
      },
      {
        id: "pons",
        name: "Pons",
        subtitle: "The traffic exchange",
        color: "#b08458",
        attributes: [
          { label: "Position", value: "Between midbrain and medulla" },
          { label: "Connects", value: "Cerebrum to cerebellum" },
          { label: "Houses", value: "Sleep and respiration nuclei" },
        ],
        note:
          "The pons relays signals between the cerebral cortex and cerebellum and contains nuclei that gate sleep and breathing.",
        fact: "Pontine nuclei carry massive corticopontocerebellar bundles.",
        meshes: ["FJ1775", "FJ1822"],
        camera: { position: [0, -0.5, -4.0], target: [0, -0.7, 0] },
      },
      {
        id: "medulla",
        name: "Medulla Oblongata",
        subtitle: "The vital regulator",
        color: "#7d5734",
        attributes: [
          { label: "Position", value: "Lowest brainstem" },
          { label: "Role", value: "Heart rate, breathing" },
          { label: "Pyramids", value: "Corticospinal decussation" },
        ],
        note:
          "The medulla controls life critical functions including heart rate, breathing, and blood pressure, and is where motor fibers cross.",
        fact: "Bilateral medullary damage is incompatible with life.",
        meshes: ["FJ1769", "FJ1831"],
        camera: { position: [0, -1.4, -3.5], target: [0, -0.7, 0] },
      },
      {
        id: "reticular",
        name: "Reticular Formation",
        subtitle: "The arousal network",
        color: "#c8a07a",
        attributes: [
          { label: "Spread", value: "Throughout brainstem core" },
          { label: "Role", value: "Arousal and consciousness" },
          { label: "Outputs", value: "Diffuse to cortex" },
        ],
        note:
          "The reticular formation is a diffuse network that gates arousal and modulates cortical activity through ascending projections.",
        fact: "Damage here can leave the body intact but produce coma.",
        meshes: [],
      },
    ],
  },
  {
    id: "limbic",
    name: "Limbic System",
    type: "Subcortical System",
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
      title: "Medial deep structures",
      body: "The limbic system is a ring of structures around the corpus callosum that ties cortex to deep nuclei. It bridges sensation, memory, and emotion.",
      motif: "limbic",
    },
    microscope: [
      { label: "T1 MRI", tone: "#e7c4d8", pattern: "mri-t1" },
      { label: "fMRI BOLD", tone: "#b14d8c", pattern: "fmri" },
      { label: "Golgi Stain", tone: "#917d88", pattern: "histology" },
    ],
    substructures: [
      {
        id: "hippocampus",
        name: "Hippocampus",
        subtitle: "The memory weaver",
        color: "#a23978",
        attributes: [
          { label: "Shape", value: "Curled like a seahorse" },
          { label: "Position", value: "Medial temporal lobe" },
          { label: "Cells", value: "Place and grid cells" },
        ],
        note:
          "The hippocampus binds events into episodic memories and supports spatial navigation through specialized place and grid cells.",
        fact: "Patient HM lost the ability to form new memories after bilateral hippocampal removal.",
        meshes: ["FJ1759", "FJ1807"],
        camera: { position: [0, 4.5, 0.4], target: [0, 0, 0.2] },
      },
      {
        id: "amygdala",
        name: "Amygdala",
        subtitle: "The salience alarm",
        color: "#c66ea2",
        attributes: [
          { label: "Position", value: "Anterior medial temporal lobe" },
          { label: "Inputs", value: "All sensory streams" },
          { label: "Role", value: "Fear, emotional learning" },
        ],
        note:
          "The amygdala assigns emotional value to stimuli and is essential for fear learning and rapid threat detection.",
        fact: "It can drive a startle response before conscious awareness of a threat.",
        meshes: ["FJ1753"],
        camera: { position: [0.4, 3.8, 0.7], target: [0, 0, 0.4] },
      },
      {
        id: "cingulate",
        name: "Cingulate Gyrus",
        subtitle: "The conflict monitor",
        color: "#d590b5",
        attributes: [
          { label: "Position", value: "Above the corpus callosum" },
          { label: "Anterior", value: "Conflict and effort" },
          { label: "Posterior", value: "Self referential thought" },
        ],
        note:
          "The cingulate gyrus integrates emotion with cognition, monitoring conflict, error, and pain across the brain.",
        fact: "Anterior cingulate activity rises whenever an unexpected outcome occurs.",
        meshes: ["FJ1739", "FJ1740"],
        camera: { position: [0, 5, -0.6], target: [0, 0, -0.4] },
      },
      {
        id: "hypothalamus",
        name: "Hypothalamus",
        subtitle: "The body governor",
        color: "#7e2c5d",
        attributes: [
          { label: "Size", value: "Pea sized" },
          { label: "Outputs", value: "Hormones and autonomic" },
          { label: "Drives", value: "Thirst, hunger, sleep" },
        ],
        note:
          "The hypothalamus integrates the autonomic nervous system with hormonal control and tunes drives like hunger, thirst, and temperature.",
        fact: "Through the pituitary gland it sets the body's hormonal baseline.",
        meshes: ["FJ1760", "FJ1780", "FJ1808", "FJ1828"],
        camera: { position: [2.6, 0.1, 0.6], target: [0, -0.2, 0.1] },
      },
      {
        id: "thalamus",
        name: "Thalamus",
        subtitle: "The cortical relay",
        color: "#e0a4c5",
        attributes: [
          { label: "Position", value: "Center of the brain" },
          { label: "Role", value: "Sensory and motor relay" },
          { label: "Nuclei", value: "Many specialized groups" },
        ],
        note:
          "The thalamus is the central relay station of the brain, routing sensory and motor signals to the appropriate cortical areas.",
        fact: "Almost every cortical area pairs with a dedicated thalamic nucleus.",
        meshes: ["FJ1782"],
        camera: { position: [0.4, 3.5, 0.1], target: [0, 0, 0] },
      },
    ],
  },
];

export function getRegionById(id: string) {
  return regions.find((region) => region.id === id) ?? regions[0];
}
