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
import {
  regions,
  getRegionById,
  type LocalizedText,
  type RegionItem,
  type ViewMode,
} from "./data/regions";
import { languageOptions, uiText, type Language } from "./i18n/uiText";

type UiCopy = (typeof uiText)[Language];

type ModeOption = {
  id: ViewMode;
  Icon: LucideIcon;
};

const LANGUAGE_STORAGE_KEY = "brain-architecture-language";

const modeOptions: ModeOption[] = [
  { id: "mesh", Icon: Box },
  { id: "focus", Icon: CircleDot },
];

const clipOptions: ReadonlyArray<{ id: ClipOrientation; labelKey: "off" | "axial" | "coronal" | "sagittal" }> = [
  { id: "off", labelKey: "off" },
  { id: "axial", labelKey: "axial" },
  { id: "coronal", labelKey: "coronal" },
  { id: "sagittal", labelKey: "sagittal" },
];

const initialRegion = getRegionById("frontal");

function localize(text: LocalizedText, language: Language) {
  return text[language];
}

function getInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return "zh";
  }

  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "zh";
}

function getImagingLabel(pattern: string, fallback: LocalizedText, language: Language) {
  const labels = uiText[language].imagingModes;
  return pattern in labels ? labels[pattern as keyof typeof labels] : localize(fallback, language);
}

function LanguageToggle({
  language,
  onChange,
  t,
}: {
  language: Language;
  onChange: (language: Language) => void;
  t: UiCopy;
}) {
  return (
    <div className="language-switch" aria-label={t.languageLabel}>
      {languageOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          className={language === option.id ? "is-active" : ""}
          onClick={() => onChange(option.id)}
          aria-pressed={language === option.id}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Header({
  regionName,
  language,
  onLanguageChange,
  t,
}: {
  regionName: string;
  language: Language;
  onLanguageChange: (language: Language) => void;
  t: UiCopy;
}) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-orb" aria-hidden="true">
          <Brain size={26} />
        </div>
        <div>
          <h1>{t.appTitle}</h1>
          <p>{t.tagline}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-meta" aria-hidden="true">
          <span className="accent-chip" />
          <span className="topbar-label">{regionName}</span>
        </div>
        <LanguageToggle language={language} onChange={onLanguageChange} t={t} />
      </div>
    </header>
  );
}

type SidebarProps = {
  selectedRegion: RegionItem;
  activeSubstructure: string;
  favorites: Set<string>;
  language: Language;
  t: UiCopy;
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
  language,
  t,
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
            {t.panels.regions}
          </span>
        </div>

        <div className="cell-list">
          {regions.map((region) => {
            const selected = selectedRegion.id === region.id;
            const regionName = localize(region.name, language);
            return (
              <button
                className={`cell-row ${selected ? "is-active" : ""}`}
                type="button"
                key={region.id}
                onClick={() => onSelectRegion(region.id)}
              >
                <MiniRegion region={region} />
                <span className="cell-row-copy">
                  <strong>{regionName}</strong>
                  <span>{localize(region.type, language)}</span>
                </span>
                <span
                  className={`favorite-dot ${favorites.has(region.id) ? "is-on" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleFavorite(region.id);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={t.favorite.add(regionName)}
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
            {t.panels.substructures}
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
              <span>{localize(substructure.name, language)}</span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

type StageProps = {
  region: RegionItem;
  regionName: string;
  regionType: string;
  activeSubstructure: string;
  viewMode: ViewMode;
  clipOrientation: ClipOrientation;
  clipOffset: number;
  autoRotate: boolean;
  resetKey: number;
  imagingTone: string;
  imagingMode: ImagingMode;
  brainRef: React.RefObject<BrainSceneHandle | null>;
  t: UiCopy;
  onModeChange: (mode: ViewMode) => void;
  onClipOrientationChange: (value: ClipOrientation) => void;
  onClipOffsetChange: (value: number) => void;
  onAutoRotateChange: (value: boolean) => void;
  onReset: () => void;
  onScreenshot: () => void;
  onGlbExport: () => void;
};

function Stage({
  region,
  regionName,
  regionType,
  activeSubstructure,
  viewMode,
  clipOrientation,
  clipOffset,
  autoRotate,
  resetKey,
  imagingTone,
  imagingMode,
  brainRef,
  t,
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
            <h2>{regionName}</h2>
            <p>{regionType}</p>
          </div>

          <div className="view-card">
            <span>{t.viewMode}</span>
            <div className="mode-switcher">
              {modeOptions.map(({ id, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={viewMode === id ? "is-active" : ""}
                  onClick={() => onModeChange(id)}
                  title={t.modes[id]}
                >
                  <Icon size={22} />
                </button>
              ))}
            </div>
            <div className="clip-section">
              <span className="clip-label">{t.clip.label}</span>
              <div className="clip-switcher">
                {clipOptions.map(({ id, labelKey }) => (
                  <button
                    key={id}
                    type="button"
                    className={clipOrientation === id ? "is-active" : ""}
                    onClick={() => onClipOrientationChange(id)}
                  >
                    {t.clip[labelKey]}
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
                  aria-label={t.clip.offset}
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
            title={t.toolbar.rotateTitle}
          >
            <RotateCcw size={20} />
            {t.toolbar.rotate}
          </button>
          <button
            type="button"
            className={viewMode === "focus" ? "is-active" : ""}
            onClick={() => onModeChange(viewMode === "focus" ? "mesh" : "focus")}
            title={t.toolbar.isolateTitle}
          >
            <CircleDot size={20} />
            {t.toolbar.isolate}
          </button>
          <button type="button" onClick={onReset} title={t.toolbar.resetTitle}>
            <RotateCcw size={20} />
            {t.toolbar.reset}
          </button>
        </div>

        <div className="export-toolbar">
          <button type="button" onClick={onScreenshot} title={t.toolbar.screenshotTitle}>
            <Camera size={20} />
            {t.toolbar.screenshot}
          </button>
          <button type="button" onClick={onGlbExport} title={t.toolbar.exportGlbTitle}>
            <Box size={20} />
            {t.toolbar.exportGlb}
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
  language: Language;
  t: UiCopy;
  onToggleFavorite: (id: string) => void;
};

function RightPanel({
  region,
  activeSubstructure,
  favorites,
  language,
  t,
  onToggleFavorite,
}: RightPanelProps) {
  const substructure =
    region.substructures.find((item) => item.id === activeSubstructure) ?? region.substructures[0];

  return (
    <aside className="right-rail">
      <section className="panel details-panel">
        <div className="panel-heading detail-heading">
          <span>{t.panels.details}</span>
          <button type="button" onClick={() => onToggleFavorite(region.id)} aria-label={t.favorite.toggle}>
            <Heart size={22} fill={favorites.has(region.id) ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="detail-hero">
          <span className="organelle-orb" style={{ background: substructure.color }} />
          <div>
            <h3>{localize(substructure.name, language)}</h3>
            <p>{localize(substructure.subtitle, language)}</p>
          </div>
        </div>

        <dl className="attribute-list">
          {substructure.attributes.map((item, index) => (
            <div key={`${substructure.id}-${index}`}>
              <dt>{localize(item.label, language)}</dt>
              <dd>{localize(item.value, language)}</dd>
            </div>
          ))}
          <div>
            <dt>{t.meshStatus.label}</dt>
            <dd>
              <span className="detail-dot" style={{ background: substructure.color }} />
              {substructure.meshes.length > 0
                ? t.meshStatus.count(substructure.meshes.length)
                : t.meshStatus.labelOnly}
            </dd>
          </div>
        </dl>
      </section>

      <section className="panel notes-panel">
        <div className="panel-heading">
          <span>{t.panels.notes}</span>
        </div>
        <p>{localize(substructure.note, language)}</p>
        <div className="fun-fact">
          <span>
            {t.factPrefix}
            {localize(substructure.fact, language)}
          </span>
          <Sparkles size={18} />
        </div>
      </section>

      <section className="panel occurrence-panel">
        <div className="panel-heading">
          <span>{t.panels.location}</span>
        </div>
        <div className={`occurrence-art occurrence-${region.occurrence.motif}`}>
          <span />
          <i />
          <b />
        </div>
        <h4>{localize(region.occurrence.title, language)}</h4>
        <p>{localize(region.occurrence.body, language)}</p>
      </section>
    </aside>
  );
}

type BottomPanelsProps = {
  region: RegionItem;
  activeImagingPattern: string;
  language: Language;
  t: UiCopy;
  onCompare: () => void;
  onSelectImaging: (pattern: string) => void;
};

function BottomPanels({
  region,
  activeImagingPattern,
  language,
  t,
  onCompare,
  onSelectImaging,
}: BottomPanelsProps) {
  const comparedRegion = getRegionById(region.comparison);
  const regionName = localize(region.name, language);
  const comparedRegionName = localize(comparedRegion.name, language);

  return (
    <section className="bottom-grid">
      <div className="panel microscope-panel">
        <div className="panel-heading">
          <span>
            <Microscope size={16} />
            {t.panels.imaging}
          </span>
        </div>
        <div className="micro-card-row">
          {region.microscope.map((image) => {
            const label = getImagingLabel(image.pattern, image.label, language);
            return (
              <button
                type="button"
                key={image.pattern}
                className={`micro-card pattern-${image.pattern} ${activeImagingPattern === image.pattern ? "is-active" : ""}`}
                style={{ "--micro": image.tone } as CSSProperties}
                onClick={() => onSelectImaging(image.pattern)}
                aria-pressed={activeImagingPattern === image.pattern}
              >
                <span />
                <strong>{label}</strong>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel compare-panel">
        <div className="panel-heading">
          <span>
            {t.panels.compare}
            <Info size={16} />
          </span>
        </div>
        <div className="compare-row">
          <div>
            <MiniRegion region={region} />
            <span>
              <strong>{regionName}</strong>
              <em>{t.comparison.current}</em>
            </span>
          </div>
          <b>{t.comparison.versus}</b>
          <div>
            <span>
              <strong>{comparedRegionName}</strong>
              <em>{localize(comparedRegion.type, language)}</em>
            </span>
            <MiniRegion region={comparedRegion} />
          </div>
        </div>
        <button type="button" className="comparison-button" onClick={onCompare}>
          {t.comparison.open}
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
}

type ComparisonModalProps = {
  region: RegionItem;
  language: Language;
  open: boolean;
  t: UiCopy;
  onClose: () => void;
};

function ComparisonModal({ region, language, open, t, onClose }: ComparisonModalProps) {
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
  const regionName = localize(region.name, language);
  const comparedRegionName = localize(comparedRegion.name, language);

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label={t.comparison.dialogLabel}>
      <div className="comparison-modal">
        <button className="modal-close" type="button" onClick={onClose}>
          {t.comparison.close}
        </button>
        <div className="comparison-modal-head">
          <h3>{t.comparison.title}</h3>
          <p>{t.comparison.description(regionName, comparedRegionName)}</p>
        </div>
        <ComparisonStage left={region} right={comparedRegion} leftLabel={regionName} rightLabel={comparedRegionName} />
        <div className="comparison-columns">
          {[region, comparedRegion].map((item) => {
            const sub = item.id === region.id ? currentSub : comparedSub;
            return (
              <section key={item.id}>
                <MiniRegion region={item} />
                <h4>{localize(item.name, language)}</h4>
                <p>{localize(item.type, language)}</p>
                <dl>
                  <div>
                    <dt>{t.comparison.defaultFocus}</dt>
                    <dd>{localize(sub.name, language)}</dd>
                  </div>
                  <div>
                    <dt>{t.comparison.mainNote}</dt>
                    <dd>{localize(sub.subtitle, language)}</dd>
                  </div>
                  <div>
                    <dt>{t.comparison.locatedAt}</dt>
                    <dd>{localize(item.occurrence.title, language)}</dd>
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
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
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
  const [activeImagingPattern, setActiveImagingPattern] = useState<string>(
    initialRegion.microscope[0]?.pattern ?? "mri-t1",
  );
  const toastTimer = useRef<number | null>(null);
  const brainRef = useRef<BrainSceneHandle | null>(null);
  const t = uiText[language];

  const selectedRegion = useMemo(() => getRegionById(selectedRegionId), [selectedRegionId]);
  const selectedRegionName = localize(selectedRegion.name, language);
  const selectedRegionType = localize(selectedRegion.type, language);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = t.documentTitle;
  }, [language, t.documentTitle]);

  useEffect(() => {
    setActiveSubstructure(selectedRegion.defaultSubstructure);
    setComparisonOpen(false);
    setActiveImagingPattern((current) => {
      const patterns = selectedRegion.microscope.map((image) => image.pattern);
      return patterns.includes(current) ? current : patterns[0] ?? current;
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
      showToast(t.toast.screenshotUnavailable);
      return;
    }
    downloadBlob(dataUrlToBlob(dataUrl), `brain-${selectedRegion.id}-${Date.now()}.png`);
    showToast(t.toast.screenshotSaved);
  }

  async function handleGlbExport() {
    showToast(t.toast.buildingGlb);
    const buffer = await brainRef.current?.exportGLB();
    if (!buffer) {
      showToast(t.toast.glbFailed);
      return;
    }
    downloadBlob(
      new Blob([buffer], { type: "model/gltf-binary" }),
      `brain-${selectedRegion.id}-${Date.now()}.glb`,
    );
    showToast(t.toast.glbExported((buffer.byteLength / 1024).toFixed(0)));
  }

  function handleReset() {
    brainRef.current?.resetView();
    setResetKey((key) => key + 1);
    showToast(t.toast.viewReset);
  }

  const activeImagingEntry = useMemo(
    () =>
      selectedRegion.microscope.find((image) => image.pattern === activeImagingPattern) ??
      selectedRegion.microscope[0],
    [selectedRegion, activeImagingPattern],
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
      <Header
        regionName={selectedRegionName}
        language={language}
        onLanguageChange={setLanguage}
        t={t}
      />

      <div className="app-grid">
        <Sidebar
          selectedRegion={selectedRegion}
          activeSubstructure={activeSubstructure}
          favorites={favorites}
          language={language}
          t={t}
          onSelectRegion={setSelectedRegionId}
          onSelectSubstructure={setActiveSubstructure}
          onToggleFavorite={toggleFavorite}
        />

        <div className="center-stack">
          <Stage
            region={selectedRegion}
            regionName={selectedRegionName}
            regionType={selectedRegionType}
            activeSubstructure={activeSubstructure}
            viewMode={viewMode}
            clipOrientation={clipOrientation}
            clipOffset={clipOffset}
            autoRotate={autoRotate}
            resetKey={resetKey}
            imagingTone={imagingTone}
            imagingMode={imagingMode}
            brainRef={brainRef}
            t={t}
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
            activeImagingPattern={activeImagingPattern}
            language={language}
            t={t}
            onCompare={() => setComparisonOpen(true)}
            onSelectImaging={(pattern) => {
              const entry = selectedRegion.microscope.find((image) => image.pattern === pattern);
              const label = entry ? getImagingLabel(entry.pattern, entry.label, language) : pattern;
              setActiveImagingPattern(pattern);
              showToast(t.toast.imagingApplied(label));
            }}
          />
        </div>

        <RightPanel
          region={selectedRegion}
          activeSubstructure={activeSubstructure}
          favorites={favorites}
          language={language}
          t={t}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      <ComparisonModal
        region={selectedRegion}
        language={language}
        open={comparisonOpen}
        t={t}
        onClose={() => setComparisonOpen(false)}
      />
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
        dataInterpolation={(p) => t.loading(p)}
      />
    </div>
  );
}
