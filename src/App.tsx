import {
  ArrowRight,
  Box,
  Brain,
  Camera,
  CircleDot,
  Heart,
  Info,
  Microscope,
  RotateCcw,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Loader } from "@react-three/drei";
import { BrainScene, type BrainSceneHandle } from "./components/BrainScene";
import { ComparisonStage } from "./components/ComparisonStage";
import {
  deriveImagingMode,
  type ClipOrientation,
  type ImagingMode,
} from "./components/brain/materials";
import { regions, getRegionById, type RegionItem, type ViewMode } from "./data/regions";

type ModeOption = {
  id: ViewMode;
  label: string;
  Icon: LucideIcon;
};

const modeOptions: ModeOption[] = [
  { id: "mesh", label: "Whole", Icon: Box },
  { id: "focus", label: "Region", Icon: CircleDot },
];

const initialRegion = getRegionById("frontal");

function Header({ region }: { region: RegionItem }) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-orb" aria-hidden="true">
          <Brain size={26} />
        </div>
        <div>
          <h1>Brain Architecture Studio</h1>
          <p>Explore the cortex from systems to circuits</p>
        </div>
      </div>

      <div className="topbar-meta" aria-hidden="true">
        <span className="accent-chip" style={{ background: region.accent }} />
        <span className="topbar-label">{region.name}</span>
      </div>
    </header>
  );
}

type SidebarProps = {
  selectedRegion: RegionItem;
  activeSubstructure: string;
  favorites: Set<string>;
  onSelectRegion: (id: string) => void;
  onSelectSubstructure: (id: string) => void;
  onToggleFavorite: (id: string) => void;
};

function MiniRegion({ region }: { region: RegionItem }) {
  if (region.renderImage?.url) {
    return (
      <span className="mini-cell has-preview" style={{ "--thumb": region.accent } as CSSProperties}>
        <img src={region.renderImage.url} alt="" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className={`mini-cell mini-cell-${region.modelKind}`} style={{ "--thumb": region.accent } as CSSProperties}>
      <span />
      <i />
      <b />
    </span>
  );
}

function Sidebar({
  selectedRegion,
  activeSubstructure,
  favorites,
  onSelectRegion,
  onSelectSubstructure,
  onToggleFavorite,
}: SidebarProps) {
  return (
    <aside className="left-rail">
      <section className="panel cell-type-panel">
        <div className="panel-heading">
          <span>
            <Brain size={18} />
            Brain Regions
          </span>
        </div>

        <div className="cell-list">
          {regions.map((region) => {
            const selected = selectedRegion.id === region.id;
            return (
              <button
                className={`cell-row ${selected ? "is-active" : ""}`}
                type="button"
                key={region.id}
                onClick={() => onSelectRegion(region.id)}
              >
                <MiniRegion region={region} />
                <span className="cell-row-copy">
                  <strong>{region.name}</strong>
                  <span>{region.type}</span>
                </span>
                <span
                  className={`favorite-dot ${favorites.has(region.id) ? "is-on" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFavorite(region.id);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Favorite ${region.name}`}
                >
                  <Star size={18} fill="currentColor" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel organelle-panel">
        <div className="panel-heading">
          <span>
            <Sparkles size={16} />
            Substructures
          </span>
        </div>

        <div className="organelle-list">
          {selectedRegion.substructures.map((substructure) => (
            <button
              className={`organelle-row ${activeSubstructure === substructure.id ? "is-active" : ""}`}
              type="button"
              key={substructure.id}
              onClick={() => onSelectSubstructure(substructure.id)}
            >
              <span className="color-dot" style={{ background: substructure.color }} />
              <span>{substructure.name}</span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

type StageProps = {
  region: RegionItem;
  activeSubstructure: string;
  viewMode: ViewMode;
  clipOrientation: ClipOrientation;
  clipOffset: number;
  autoRotate: boolean;
  resetKey: number;
  imagingTone: string;
  imagingMode: ImagingMode;
  brainRef: React.RefObject<BrainSceneHandle | null>;
  onModeChange: (mode: ViewMode) => void;
  onClipOrientationChange: (value: ClipOrientation) => void;
  onClipOffsetChange: (value: number) => void;
  onAutoRotateChange: (value: boolean) => void;
  onReset: () => void;
  onScreenshot: () => void;
  onGlbExport: () => void;
};

const clipOptions: ReadonlyArray<{ id: ClipOrientation; label: string }> = [
  { id: "off", label: "Off" },
  { id: "axial", label: "Axial" },
  { id: "coronal", label: "Coronal" },
  { id: "sagittal", label: "Sagittal" },
];

function Stage({
  region,
  activeSubstructure,
  viewMode,
  clipOrientation,
  clipOffset,
  autoRotate,
  resetKey,
  imagingTone,
  imagingMode,
  brainRef,
  onModeChange,
  onClipOrientationChange,
  onClipOffsetChange,
  onAutoRotateChange,
  onReset,
  onScreenshot,
  onGlbExport,
}: StageProps) {
  return (
    <main className="stage-column">
      <section className="stage-panel">
        <div className="stage-title">
          <div>
            <h2>{region.name}</h2>
            <p>{region.type}</p>
          </div>

          <div className="view-card">
            <span>View Mode</span>
            <div className="mode-switcher">
              {modeOptions.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={viewMode === id ? "is-active" : ""}
                  onClick={() => onModeChange(id)}
                  title={label}
                >
                  <Icon size={22} />
                </button>
              ))}
            </div>
            <div className="clip-section">
              <span className="clip-label">Cross Section</span>
              <div className="clip-switcher">
                {clipOptions.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={clipOrientation === id ? "is-active" : ""}
                    onClick={() => onClipOrientationChange(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {clipOrientation !== "off" ? (
                <input
                  type="range"
                  min={-1.2}
                  max={1.2}
                  step={0.01}
                  value={clipOffset}
                  onChange={(event) => onClipOffsetChange(Number(event.target.value))}
                  className="clip-slider"
                  aria-label="Cross section offset"
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="canvas-wrap">
          <BrainScene
            ref={brainRef}
            region={region}
            activeSubstructure={activeSubstructure}
            viewMode={viewMode}
            clipOrientation={clipOrientation}
            clipOffset={clipOffset}
            autoRotate={autoRotate}
            resetKey={resetKey}
            imagingTone={imagingTone}
            imagingMode={imagingMode}
          />
        </div>

        <div className="stage-toolbar">
          <button
            type="button"
            className={autoRotate ? "is-active" : ""}
            onClick={() => onAutoRotateChange(!autoRotate)}
            title="Toggle auto rotation"
          >
            <RotateCcw size={20} />
            Rotate
          </button>
          <button
            type="button"
            className={viewMode === "focus" ? "is-active" : ""}
            onClick={() => onModeChange(viewMode === "focus" ? "mesh" : "focus")}
            title="Isolate the selected region"
          >
            <CircleDot size={20} />
            Isolate
          </button>
          <button type="button" onClick={onReset} title="Reset camera and rotation">
            <RotateCcw size={20} />
            Reset View
          </button>
        </div>

        <div className="export-toolbar">
          <button type="button" onClick={onScreenshot} title="Download canvas as PNG">
            <Camera size={20} />
            Screenshot
          </button>
          <button type="button" onClick={onGlbExport} title="Export current scene as GLB">
            <Box size={20} />
            GLB Export
          </button>
        </div>
      </section>
    </main>
  );
}

type RightPanelProps = {
  region: RegionItem;
  activeSubstructure: string;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
};

function RightPanel({ region, activeSubstructure, favorites, onToggleFavorite }: RightPanelProps) {
  const substructure =
    region.substructures.find((item) => item.id === activeSubstructure) ?? region.substructures[0];

  return (
    <aside className="right-rail">
      <section className="panel details-panel">
        <div className="panel-heading detail-heading">
          <span>Substructure Details</span>
          <button type="button" onClick={() => onToggleFavorite(region.id)} aria-label="Toggle favorite">
            <Heart size={22} fill={favorites.has(region.id) ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="detail-hero">
          <span className="organelle-orb" style={{ background: substructure.color }} />
          <div>
            <h3>{substructure.name}</h3>
            <p>{substructure.subtitle}</p>
          </div>
        </div>

        <dl className="attribute-list">
          {substructure.attributes.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
          <div>
            <dt>Mesh status</dt>
            <dd>
              <span className="detail-dot" style={{ background: substructure.color }} />
              {substructure.meshes.length > 0
                ? `${substructure.meshes.length} BodyParts3D mesh${substructure.meshes.length > 1 ? "es" : ""}`
                : "Functional region — label only"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="panel notes-panel">
        <div className="panel-heading">
          <span>Neuroscience Notes</span>
        </div>
        <p>{substructure.note}</p>
        <div className="fun-fact">
          <span>Fun Fact: {substructure.fact}</span>
          <Sparkles size={18} />
        </div>
      </section>

      <section className="panel occurrence-panel">
        <div className="panel-heading">
          <span>Anatomical Location</span>
        </div>
        <div className={`occurrence-art occurrence-${region.occurrence.motif}`}>
          <span />
          <i />
          <b />
        </div>
        <h4>{region.occurrence.title}</h4>
        <p>{region.occurrence.body}</p>
      </section>
    </aside>
  );
}

type BottomPanelsProps = {
  region: RegionItem;
  activeImaging: string;
  onCompare: () => void;
  onSelectImaging: (label: string) => void;
};

function BottomPanels({ region, activeImaging, onCompare, onSelectImaging }: BottomPanelsProps) {
  const comparedRegion = getRegionById(region.comparison);

  return (
    <section className="bottom-grid">
      <div className="panel microscope-panel">
        <div className="panel-heading">
          <span>
            <Microscope size={16} />
            Imaging Modes
          </span>
        </div>
        <div className="micro-card-row">
          {region.microscope.map((image) => (
            <button
              type="button"
              key={image.label}
              className={`micro-card pattern-${image.pattern} ${activeImaging === image.label ? "is-active" : ""}`}
              style={{ "--micro": image.tone } as CSSProperties}
              onClick={() => onSelectImaging(image.label)}
              aria-pressed={activeImaging === image.label}
            >
              <span />
              <strong>{image.label}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="panel compare-panel">
        <div className="panel-heading">
          <span>
            Compare Regions
            <Info size={16} />
          </span>
        </div>
        <div className="compare-row">
          <div>
            <MiniRegion region={region} />
            <span>
              <strong>{region.name}</strong>
              <em>You are here</em>
            </span>
          </div>
          <b>VS</b>
          <div>
            <span>
              <strong>{comparedRegion.name}</strong>
              <em>{comparedRegion.type}</em>
            </span>
            <MiniRegion region={comparedRegion} />
          </div>
        </div>
        <button type="button" className="comparison-button" onClick={onCompare}>
          Open Comparison View
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}

type ComparisonModalProps = {
  region: RegionItem;
  open: boolean;
  onClose: () => void;
};

function ComparisonModal({ region, open, onClose }: ComparisonModalProps) {
  const comparedRegion = getRegionById(region.comparison);
  if (!open) {
    return null;
  }

  const currentSub =
    region.substructures.find((item) => item.id === region.defaultSubstructure) ??
    region.substructures[0];
  const comparedSub =
    comparedRegion.substructures.find((item) => item.id === comparedRegion.defaultSubstructure) ??
    comparedRegion.substructures[0];

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Region comparison">
      <div className="comparison-modal">
        <button className="modal-close" type="button" onClick={onClose}>
          Close
        </button>
        <div className="comparison-modal-head">
          <h3>Comparison View</h3>
          <p>
            {region.name} compared with {comparedRegion.name}
          </p>
        </div>
        <ComparisonStage left={region} right={comparedRegion} />
        <div className="comparison-columns">
          {[region, comparedRegion].map((item) => {
            const sub = item.id === region.id ? currentSub : comparedSub;
            return (
              <section key={item.id}>
                <MiniRegion region={item} />
                <h4>{item.name}</h4>
                <p>{item.type}</p>
                <dl>
                  <div>
                    <dt>Default focus</dt>
                    <dd>{sub.name}</dd>
                  </div>
                  <div>
                    <dt>Main note</dt>
                    <dd>{sub.subtitle}</dd>
                  </div>
                  <div>
                    <dt>Located at</dt>
                    <dd>{item.occurrence.title}</dd>
                  </div>
                </dl>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Toast({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return <div className="toast">{message}</div>;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload] = dataUrl.split(",");
  const mime = header.match(/data:([^;]+);/)?.[1] ?? "application/octet-stream";
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export default function App() {
  const [selectedRegionId, setSelectedRegionId] = useState(initialRegion.id);
  const [activeSubstructure, setActiveSubstructure] = useState(initialRegion.defaultSubstructure);
  const [viewMode, setViewMode] = useState<ViewMode>("mesh");
  const [clipOrientation, setClipOrientation] = useState<ClipOrientation>("off");
  const [clipOffset, setClipOffset] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set([initialRegion.id]));
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeImaging, setActiveImaging] = useState<string>(
    initialRegion.microscope[0]?.label ?? "T1 MRI",
  );
  const toastTimer = useRef<number | null>(null);
  const brainRef = useRef<BrainSceneHandle | null>(null);

  const selectedRegion = useMemo(() => getRegionById(selectedRegionId), [selectedRegionId]);

  useEffect(() => {
    setActiveSubstructure(selectedRegion.defaultSubstructure);
    setComparisonOpen(false);
    setActiveImaging((current) => {
      const labels = selectedRegion.microscope.map((image) => image.label);
      return labels.includes(current) ? current : labels[0] ?? current;
    });
  }, [selectedRegion]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleScreenshot() {
    const dataUrl = brainRef.current?.screenshot();
    if (!dataUrl) {
      showToast("Screenshot unavailable.");
      return;
    }
    downloadBlob(dataUrlToBlob(dataUrl), `brain-${selectedRegion.id}-${Date.now()}.png`);
    showToast("Screenshot saved.");
  }

  async function handleGlbExport() {
    showToast("Building GLB…");
    const buffer = await brainRef.current?.exportGLB();
    if (!buffer) {
      showToast("GLB export failed.");
      return;
    }
    downloadBlob(
      new Blob([buffer], { type: "model/gltf-binary" }),
      `brain-${selectedRegion.id}-${Date.now()}.glb`,
    );
    showToast(`GLB exported (${(buffer.byteLength / 1024).toFixed(0)} KB).`);
  }

  function handleReset() {
    brainRef.current?.resetView();
    setResetKey((key) => key + 1);
    showToast("View reset.");
  }

  const activeImagingEntry = useMemo(
    () =>
      selectedRegion.microscope.find((image) => image.label === activeImaging) ??
      selectedRegion.microscope[0],
    [selectedRegion, activeImaging],
  );
  const imagingTone = activeImagingEntry?.tone ?? selectedRegion.accentSoft;
  const imagingMode = useMemo<ImagingMode>(
    () => deriveImagingMode(activeImagingEntry?.pattern),
    [activeImagingEntry],
  );

  const shellStyle = {
    "--accent": selectedRegion.accent,
    "--accent-soft": selectedRegion.accentSoft,
    "--cell-color": selectedRegion.color,
  } as CSSProperties;

  return (
    <div className="app-shell" style={shellStyle}>
      <Header region={selectedRegion} />

      <div className="app-grid">
        <Sidebar
          selectedRegion={selectedRegion}
          activeSubstructure={activeSubstructure}
          favorites={favorites}
          onSelectRegion={setSelectedRegionId}
          onSelectSubstructure={setActiveSubstructure}
          onToggleFavorite={toggleFavorite}
        />

        <div className="center-stack">
          <Stage
            region={selectedRegion}
            activeSubstructure={activeSubstructure}
            viewMode={viewMode}
            clipOrientation={clipOrientation}
            clipOffset={clipOffset}
            autoRotate={autoRotate}
            resetKey={resetKey}
            imagingTone={imagingTone}
            imagingMode={imagingMode}
            brainRef={brainRef}
            onModeChange={setViewMode}
            onClipOrientationChange={(orientation) => {
              setClipOrientation(orientation);
              if (orientation === "off") {
                setClipOffset(0);
              }
            }}
            onClipOffsetChange={setClipOffset}
            onAutoRotateChange={setAutoRotate}
            onReset={handleReset}
            onScreenshot={handleScreenshot}
            onGlbExport={handleGlbExport}
          />
          <BottomPanels
            region={selectedRegion}
            activeImaging={activeImaging}
            onCompare={() => setComparisonOpen(true)}
            onSelectImaging={(label) => {
              setActiveImaging(label);
              showToast(`${label} imaging tone applied.`);
            }}
          />
        </div>

        <RightPanel
          region={selectedRegion}
          activeSubstructure={activeSubstructure}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      <ComparisonModal region={selectedRegion} open={comparisonOpen} onClose={() => setComparisonOpen(false)} />
      <Toast message={toast} />
      <Loader
        containerStyles={{
          background: "rgba(251, 246, 236, 0.92)",
          backdropFilter: "blur(6px)",
        }}
        innerStyles={{ background: "rgba(85, 75, 61, 0.18)", borderRadius: 999 }}
        barStyles={{ background: "var(--accent, #b06f2c)", borderRadius: 999 }}
        dataStyles={{
          color: "#3a2e22",
          fontFamily: "Iowan Old Style, Baskerville, Georgia, serif",
          fontSize: "14px",
          letterSpacing: "0.04em",
        }}
        dataInterpolation={(p) => `Loading anatomy ${p.toFixed(0)} %`}
      />
    </div>
  );
}
