import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  ScanSearch,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { COLOR_VALUE_REFERENCES, GREY_SCALE_GRADES } from "../constants/greyScaleChart";
import { formatLab, formatRgb, formatSigned, rgbToHex } from "../utils/colorAnalysis";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";

const CANVAS_WIDTH = 1360;
const CANVAS_HEIGHT = 1720;

const tooltips = {
  deltaE:
    "Delta E CIE76 adalah jarak warna rata-rata di ruang LAB. Nilai lebih besar berarti perubahan warna lebih terlihat.",
  grade:
    "Grade ini estimasi dari Delta E, bukan hasil ISO resmi. Observer tetap menentukan grade akhir.",
  value:
    "Value memakai luminosity RGB. Nilai negatif berarti sampel cenderung lebih gelap, positif berarti lebih terang.",
  lab: "LAB memisahkan terang/gelap (L*), arah hijau-merah (a*), dan arah biru-kuning (b*).",
  histogram:
    "Histogram menunjukkan distribusi pixel. Pergeseran ke kiri berarti lebih gelap, ke kanan berarti lebih terang.",
  matrix:
    "Matrix membagi foto menjadi area kecil dan menandai intensitas perubahan lokal. Oranye lebih gelap, biru lebih terang.",
};

function formatNumber(value, digits = 1) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return Number.parseFloat(value.toFixed(digits));
}

function clampZoom(value) {
  return Math.min(Math.max(value, 0.45), 1.35);
}

function SectionTitle({ title, description, tooltip }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold leading-6 text-[#111111]">{title}</h3>
          {tooltip ? <Tooltip label={tooltip} /> : null}
        </div>
        {description ? <p className="mt-1 text-xs leading-5 text-[#666666]">{description}</p> : null}
      </div>
    </div>
  );
}

function Metric({ label, value, detail, tooltip }) {
  return (
    <div className="min-w-0 rounded-[8px] border border-[#dedede] bg-white p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#666666]">
        <span>{label}</span>
        {tooltip ? <Tooltip label={tooltip} /> : null}
      </div>
      <div className="mt-2 whitespace-pre-line break-words text-xl font-semibold leading-snug tracking-[-0.02em] text-[#111111]">
        {value}
      </div>
      {detail ? <div className="mt-2 text-xs leading-5 text-[#666666]">{detail}</div> : null}
    </div>
  );
}

function PhotoTile({ title, src, subtitle, compact = false }) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-2">
        <div className="text-sm font-semibold text-[#111111]">{title}</div>
        <div className="text-xs font-medium text-[#666666]">{subtitle}</div>
      </figcaption>
      <div className={`figure-frame flex items-center justify-center overflow-hidden rounded-[8px] ${compact ? "h-[210px]" : "h-[280px]"}`}>
        {src ? (
          <img src={src} alt={title} className="h-full w-full object-contain" />
        ) : (
          <span className="text-sm text-[#888888]">Belum ada foto</span>
        )}
      </div>
    </figure>
  );
}

function AveragePatch({ label, analysis }) {
  const rgb = analysis?.averageRgb;
  const hex = analysis?.averageHex || (rgb ? rgbToHex(rgb) : "#f1f1f1");

  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 flex-none rounded-[8px] border border-[#dedede]" style={{ background: hex }} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#111111]">{label}</div>
          <div className="mt-1 text-xs leading-5 text-[#666666]">RGB {rgb ? formatRgb(rgb) : "-"}</div>
          <div className="text-xs leading-5 text-[#666666]">
            {hex} · Value {analysis ? formatNumber(analysis.averageValue) : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

function radarPoints(values, size) {
  const center = size / 2;
  const radius = size * 0.34;
  return ["r", "g", "b"]
    .map((channel, index) => {
      const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 3);
      const value = Math.max(0, Math.min(255, values?.[channel] || 0)) / 255;
      return `${center + Math.cos(angle) * radius * value},${center + Math.sin(angle) * radius * value}`;
    })
    .join(" ");
}

function axisPoint(index, size, factor = 1) {
  const center = size / 2;
  const radius = size * 0.34 * factor;
  const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 3);
  return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
}

function RgbRadar({ analysis }) {
  const size = 280;

  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <SectionTitle
        title="Radar RGB"
        description="Kekuatan channel warna sebelum dan sesudah."
        tooltip="Radar membantu melihat channel R/G/B mana yang berubah paling besar."
      />
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto mt-3 h-[235px] w-[235px]">
        {[0.33, 0.66, 1].map((factor) => (
          <polygon
            key={factor}
            points={[0, 1, 2]
              .map((index) => axisPoint(index, size, factor))
              .map((point) => `${point.x},${point.y}`)
              .join(" ")}
            fill="none"
            stroke="#dedede"
            strokeWidth="1"
          />
        ))}
        {["R", "G", "B"].map((label, index) => {
          const end = axisPoint(index, size, 1.1);
          const line = axisPoint(index, size, 1);
          return (
            <g key={label}>
              <line x1={size / 2} y1={size / 2} x2={line.x} y2={line.y} stroke="#dedede" />
              <text x={end.x} y={end.y} textAnchor="middle" dominantBaseline="middle" className="fill-[#111111] text-xs font-bold">
                {label}
              </text>
            </g>
          );
        })}
        <polygon
          points={radarPoints(analysis?.before.averageRgb, size)}
          fill="rgba(17,17,17,0.08)"
          stroke="#111111"
          strokeWidth="3"
        />
        <polygon
          points={radarPoints(analysis?.after.averageRgb, size)}
          fill="rgba(217,119,6,0.16)"
          stroke="#D97706"
          strokeWidth="3"
        />
      </svg>
      <div className="flex justify-center gap-4 text-xs font-semibold">
        <span className="text-[#111111]">Sebelum</span>
        <span className="text-[#D97706]">Sesudah</span>
      </div>
    </div>
  );
}

function histogramPath(values, width, height) {
  const max = Math.max(...values, 1);
  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function HistogramOverlay({ before, after, channel = "value", color = "#111111", afterColor = "#D97706" }) {
  const width = 420;
  const height = 120;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[122px] w-full">
      <rect width={width} height={height} rx="8" fill="#fbfbfa" />
      {[0.25, 0.5, 0.75].map((line) => (
        <line key={line} x1="0" x2={width} y1={height * line} y2={height * line} stroke="#e9e9e9" />
      ))}
      <path d={histogramPath(before?.histogram[channel] || [], width, height - 12)} fill="none" stroke={color} strokeWidth="3" />
      <path d={histogramPath(after?.histogram[channel] || [], width, height - 12)} fill="none" stroke={afterColor} strokeWidth="3" />
    </svg>
  );
}

function HistogramPanel({ analysis }) {
  const [mode, setMode] = useState("value");
  const channels = [
    { id: "r", label: "R", color: "#DC2626" },
    { id: "g", label: "G", color: "#16A34A" },
    { id: "b", label: "B", color: "#2563EB" },
  ];

  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle title="Histogram" description="Distribusi pixel sebelum dan sesudah." tooltip={tooltips.histogram} />
        <Segmented value={mode} onChange={setMode} options={[["value", "Value"], ["rgb", "RGB"]]} />
      </div>
      {mode === "value" ? (
        <div className="mt-4">
          <HistogramOverlay before={analysis?.before} after={analysis?.after} />
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {channels.map((channel) => (
            <div key={channel.id}>
              <div className="mb-1 text-xs font-bold text-[#444444]">{channel.label}</div>
              <HistogramOverlay before={analysis?.before} after={analysis?.after} channel={channel.id} color={channel.color} afterColor="#111111" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChangeMatrix({ analysis }) {
  const matrix = analysis?.matrix;

  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle
          title="Change matrix"
          description="Peta perubahan lokal dari area foto."
          tooltip={tooltips.matrix}
        />
        <Badge tone="neutral">{matrix ? `${matrix.size} x ${matrix.size}` : "Menunggu"}</Badge>
      </div>
      <div
        className="mt-4 grid overflow-hidden rounded-[8px] border border-[#dedede]"
        style={{ gridTemplateColumns: `repeat(${matrix?.size || 18}, minmax(0, 1fr))` }}
      >
        {(matrix?.cells || Array.from({ length: 18 * 18 })).map((cell, index) => (
          <div
            key={index}
            className="aspect-square border-b border-r border-white/50"
            style={{ background: cell?.color || "#f1f1f1" }}
            title={cell ? `Intensity ${formatNumber(cell.intensity)}%` : undefined}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="Avg" value={`${matrix ? formatNumber(matrix.averageIntensity) : "-"}%`} detail="rata-rata" />
        <Metric label="Max" value={`${matrix ? formatNumber(matrix.maxIntensity) : "-"}%`} detail="tertinggi" />
        <Metric label="Area kuat" value={`${matrix ? formatNumber(matrix.highChangePercent) : "-"}%`} detail="di atas ambang" />
      </div>
    </div>
  );
}

function IsoReference() {
  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <SectionTitle
        title="ISO 105-A03 visual reference"
        description="Referensi visual ilustratif untuk observer."
        tooltip="Chip ini bukan kalibrasi resmi ISO. Gunakan sebagai panduan visual bersama penilaian observer."
      />
      <div className="mt-4 grid grid-cols-9 gap-2">
        {GREY_SCALE_GRADES.map((item) => (
          <div key={item.grade} className="rounded-[8px] border border-[#dedede] bg-[#fbfbfa] p-2">
            <div className="grid h-11 grid-cols-2 overflow-hidden rounded-[6px] border border-[#dedede]">
              <div style={{ background: item.patches[0] }} />
              <div style={{ background: item.patches[1] }} />
            </div>
            <div className="mt-2 text-center text-sm font-bold text-[#111111]">{item.grade}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorValueReference() {
  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <SectionTitle
        title="Color value grey chart"
        description="Hue warna disandingkan dengan grey value."
        tooltip="Grey value dihitung dari luminosity RGB: 0.299R + 0.587G + 0.114B."
      />
      <div className="mt-4 grid grid-cols-[86px_1fr] overflow-hidden rounded-[8px] border border-[#dedede] text-xs font-semibold text-[#444444]">
        <div className="border-b border-r border-[#dedede] bg-[#fbfbfa] p-2">Hue</div>
        <div className="grid grid-cols-9 border-b border-[#dedede]">
          {COLOR_VALUE_REFERENCES.map((item) => (
            <div key={item.name} className="truncate border-r border-[#dedede] p-2 text-center last:border-r-0">{item.name}</div>
          ))}
        </div>
        <div className="border-b border-r border-[#dedede] bg-[#fbfbfa] p-2">Color</div>
        <div className="grid grid-cols-9 border-b border-[#dedede]">
          {COLOR_VALUE_REFERENCES.map((item) => (
            <div key={`${item.name}-color`} className="border-r border-[#dedede] p-2 last:border-r-0">
              <div className="h-9 rounded-[6px] border border-[#dedede]" style={{ background: item.hex }} />
            </div>
          ))}
        </div>
        <div className="border-r border-[#dedede] bg-[#fbfbfa] p-2">Grey</div>
        <div className="grid grid-cols-9">
          {COLOR_VALUE_REFERENCES.map((item) => (
            <div key={`${item.name}-grey`} className="border-r border-[#dedede] p-2 text-center last:border-r-0">
              <div className="h-9 rounded-[6px] border border-[#dedede]" style={{ background: item.grey }} />
              <div className="mt-1">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex shrink-0 rounded-[8px] border border-[#dedede] bg-[#fbfbfa] p-1">
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={`rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === id ? "bg-white text-[#111111] shadow-sm" : "text-[#666666]"
          }`}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function AnalysisSummary({ analysis }) {
  if (!analysis) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#bdbdbd] bg-[#fbfbfa] p-6 text-center">
        <ScanSearch className="mx-auto h-8 w-8 text-[#777777]" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-[#111111]">Upload dua foto untuk melihat analisis.</p>
        <p className="mt-1 text-sm leading-6 text-[#666666]">
          Dashboard akan menghitung RGB, value, LAB, Delta E, histogram, dan matrix perubahan.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <Metric label="Delta E" value={formatNumber(analysis.deltaE, 2)} detail="CIE76 estimate" tooltip={tooltips.deltaE} />
      <Metric label="Grade" value={analysis.estimatedGrade} detail={analysis.gradeDescription} tooltip={tooltips.grade} />
      <Metric
        label="Value"
        value={`${formatSigned(analysis.valueChangePercent, 1)}%`}
        detail={`Delta ${formatSigned(analysis.delta.value, 1)}`}
        tooltip={tooltips.value}
      />
    </div>
  );
}

function PreviewGrid({ before, after, greyscaleBefore, greyscaleAfter, compact = false }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <PhotoTile title="Sebelum pencucian" subtitle="Original" src={before?.url} compact={compact} />
      <PhotoTile title="Sebelum pencucian" subtitle="Greyscale" src={greyscaleBefore?.dataUrl} compact={compact} />
      <PhotoTile title="Sesudah pencucian" subtitle="Original" src={after?.url} compact={compact} />
      <PhotoTile title="Sesudah pencucian" subtitle="Greyscale" src={greyscaleAfter?.dataUrl} compact={compact} />
    </div>
  );
}

function AnalysisDetails({ before, after, greyscaleBefore, greyscaleAfter, analysis, referenceMode }) {
  return (
    <div className="grid gap-6">
      <section className="research-panel p-4 sm:p-5">
        <SectionTitle
          title="Preview foto"
          description="Susunan 2x2: original dan greyscale sebelum/sesudah."
        />
        <div className="mt-4">
          <PreviewGrid
            before={before}
            after={after}
            greyscaleBefore={greyscaleBefore}
            greyscaleAfter={greyscaleAfter}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="research-panel p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-[#111111]">Color shift overview</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#666666]">
                {analysis?.insight.summary || "Menunggu hasil analisis warna."}
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-2 text-xs font-semibold text-[#666666] sm:flex">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              before / after
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <AveragePatch label="Average before" analysis={analysis?.before} />
            <AveragePatch label="Average after" analysis={analysis?.after} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Metric
              label="Delta RGB"
              value={
                analysis
                  ? `R ${formatSigned(analysis.delta.rgb.r)}\nG ${formatSigned(analysis.delta.rgb.g)}\nB ${formatSigned(analysis.delta.rgb.b)}`
                  : "-"
              }
              detail={analysis?.insight.rgb || "R / G / B difference"}
            />
            <Metric
              label="Delta LAB"
              value={
                analysis
                  ? `L* ${formatSigned(analysis.delta.lab.l)}\na* ${formatSigned(analysis.delta.lab.a)}\nb* ${formatSigned(analysis.delta.lab.b)}`
                  : "-"
              }
              detail={analysis?.insight.lab || "L* / a* / b* direction"}
              tooltip={tooltips.lab}
            />
            <Metric
              label="After LAB"
              value={
                analysis
                  ? `L* ${formatNumber(analysis.after.lab.l)}\na* ${formatNumber(analysis.after.lab.a)}\nb* ${formatNumber(analysis.after.lab.b)}`
                  : "-"
              }
              detail="rata-rata setelah"
              tooltip={tooltips.lab}
            />
          </div>
        </div>
        <AnalysisSummary analysis={analysis} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <RgbRadar analysis={analysis} />
        <HistogramPanel analysis={analysis} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.75fr)]">
        <ChangeMatrix analysis={analysis} />
        <div className="grid gap-6">
          {referenceMode === "iso" ? <IsoReference /> : <ColorValueReference />}
          <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
            <SectionTitle title="Interpretasi cepat" />
            <div className="mt-3 grid gap-2 text-sm leading-6 text-[#444444]">
              <p><strong>Delta E</strong> membaca besar perubahan warna rata-rata.</p>
              <p><strong>Delta value</strong> negatif berarti lebih gelap; positif berarti lebih terang.</p>
              <p><strong>Matrix</strong> menunjukkan apakah perubahan merata atau lokal.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="research-panel p-4 sm:p-5">
        <SectionTitle title="Numeric report" description="Ringkasan angka siap dibaca observer." />
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <ReportRow label="Before RGB" value={analysis ? formatRgb(analysis.before.averageRgb) : "-"} />
          <ReportRow label="After RGB" value={analysis ? formatRgb(analysis.after.averageRgb) : "-"} />
          <ReportRow label="Before value" value={analysis ? formatNumber(analysis.before.averageValue) : "-"} tooltip={tooltips.value} />
          <ReportRow label="After value" value={analysis ? formatNumber(analysis.after.averageValue) : "-"} tooltip={tooltips.value} />
          <ReportRow label="Before LAB" value={analysis ? formatLab(analysis.before.lab) : "-"} tooltip={tooltips.lab} />
          <ReportRow label="After LAB" value={analysis ? formatLab(analysis.after.lab) : "-"} tooltip={tooltips.lab} />
          <ReportRow label="Delta E CIE76" value={analysis ? formatNumber(analysis.deltaE, 2) : "-"} tooltip={tooltips.deltaE} />
          <ReportRow label="Estimated grade" value={analysis?.estimatedGrade || "-"} tooltip={tooltips.grade} />
        </div>
      </section>
    </div>
  );
}

export function AnalysisCanvas({
  before,
  after,
  greyscaleBefore,
  greyscaleAfter,
  analysis,
  isAnalysing,
  error,
}) {
  const [zoom, setZoom] = useState(0.86);
  const [referenceMode, setReferenceMode] = useState("iso");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const status = isAnalysing ? "Menganalisis" : analysis ? "Siap dianalisis" : "Menunggu foto";
  const ready = Boolean(before?.url && after?.url);
  const fitZoom = () => {
    if (typeof window === "undefined") return 0.86;
    return clampZoom(Math.min((window.innerWidth - 56) / CANVAS_WIDTH, 1));
  };

  return (
    <>
      <section className="research-panel overflow-hidden p-5 sm:p-6" aria-labelledby="analysis-canvas-heading">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="analysis-canvas-heading" className="text-xl font-semibold text-[#111111]">
                Analysis Greyscale
              </h2>
              <Badge tone={analysis ? "success" : "neutral"}>{status}</Badge>
            </div>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[#666666]">
              Ringkasan konversi greyscale dan analisis perubahan warna. Gunakan icon expand untuk
              membuka workspace zoomable layar penuh.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-[#777777] sm:inline">
              Expand
            </span>
            <Button className="h-11 min-h-11 rounded-full px-3" variant="secondary" onClick={() => setIsOpen(true)} disabled={!ready} aria-label="Buka fullscreen Analysis Greyscale">
              <Maximize2 className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Delta E" value={analysis ? formatNumber(analysis.deltaE, 2) : "-"} detail="CIE76" tooltip={tooltips.deltaE} />
          <Metric label="Grade" value={analysis?.estimatedGrade || "-"} detail="estimasi" tooltip={tooltips.grade} />
          <Metric
            label="Value"
            value={analysis ? `${formatSigned(analysis.valueChangePercent, 1)}%` : "-"}
            detail="change"
            tooltip={tooltips.value}
          />
        </div>
        {error ? <p className="mt-4 text-sm font-semibold text-[#DC2626]">{error}</p> : null}

        <div className="mt-6">
          <AnalysisDetails
            before={before}
            after={after}
            greyscaleBefore={greyscaleBefore}
            greyscaleAfter={greyscaleAfter}
            analysis={analysis}
            referenceMode={referenceMode}
          />
        </div>
      </section>

      {isOpen ? (
        <FullscreenCanvas
          before={before}
          after={after}
          greyscaleBefore={greyscaleBefore}
          greyscaleAfter={greyscaleAfter}
          analysis={analysis}
          isAnalysing={isAnalysing}
          error={error}
          zoom={zoom}
          setZoom={setZoom}
          fitZoom={fitZoom}
          referenceMode={referenceMode}
          setReferenceMode={setReferenceMode}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}

function FullscreenCanvas({
  before,
  after,
  greyscaleBefore,
  greyscaleAfter,
  analysis,
  isAnalysing,
  error,
  zoom,
  setZoom,
  fitZoom,
  referenceMode,
  setReferenceMode,
  onClose,
}) {
  const clampedZoom = clampZoom(zoom);
  const canvasStyle = useMemo(
    () => ({ width: CANVAS_WIDTH * clampedZoom, height: CANVAS_HEIGHT * clampedZoom }),
    [clampedZoom],
  );

  useEffect(() => {
    setZoom(fitZoom());
  }, [fitZoom, setZoom]);
  const boardStyle = useMemo(
    () => ({
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      transform: `scale(${clampedZoom})`,
      transformOrigin: "top left",
    }),
    [clampedZoom],
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex min-h-[72px] flex-col gap-3 border-b border-[#dedede] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-[#111111]">Analysis Greyscale</h2>
            {isAnalysing ? (
              <Badge tone="blue">
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                Menganalisis
              </Badge>
            ) : analysis ? (
              <Badge tone="success">Siap</Badge>
            ) : (
              <Badge tone="neutral">Menunggu foto</Badge>
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-[#666666]">
            Scroll canvas untuk eksplorasi, gunakan zoom untuk membaca chart dan matrix secara detail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented value={referenceMode} onChange={setReferenceMode} options={[["iso", "ISO greyscale"], ["value", "Color value"]]} />
          <div className="flex items-center gap-2 rounded-[8px] border border-[#dedede] bg-white px-2 py-1">
            <Button className="h-8 min-h-8 px-2" variant="ghost" onClick={() => setZoom((current) => clampZoom(current - 0.1))} aria-label="Zoom out">
              <Minus className="h-4 w-4" aria-hidden="true" />
            </Button>
            <input
              className="w-24 accent-[#111111]"
              type="range"
              min="0.45"
              max="1.35"
              step="0.05"
              value={clampedZoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              aria-label="Zoom canvas"
            />
            <Button className="h-8 min-h-8 px-2" variant="ghost" onClick={() => setZoom((current) => clampZoom(current + 0.1))} aria-label="Zoom in">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button className="h-8 min-h-8 px-2" variant="ghost" onClick={() => setZoom(fitZoom())} aria-label="Fit canvas">
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="w-11 text-right text-xs font-bold text-[#333333]">{Math.round(clampedZoom * 100)}%</span>
          </div>
          <Button className="h-9 min-h-9 rounded-full px-3" variant="secondary" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
            Tutup
          </Button>
        </div>
      </div>

      {error ? <div className="border-b border-[#FECACA] bg-[#FEF2F2] px-4 py-2 text-sm font-semibold text-[#991B1B]">{error}</div> : null}

      <div className="min-h-0 flex-1 overflow-auto bg-[#efefed] p-5">
        <div style={canvasStyle}>
          <CanvasBoard
            before={before}
            after={after}
            greyscaleBefore={greyscaleBefore}
            greyscaleAfter={greyscaleAfter}
            analysis={analysis}
            referenceMode={referenceMode}
            boardStyle={boardStyle}
          />
        </div>
      </div>
    </div>
  );
}

function CanvasBoard({ before, after, greyscaleBefore, greyscaleAfter, analysis, referenceMode, boardStyle }) {
  return (
    <div className="analysis-grid rounded-[8px] border border-[#cfcfcb] bg-[#fbfbfa] p-7 shadow-sm" style={boardStyle}>
      <AnalysisDetails
        before={before}
        after={after}
        greyscaleBefore={greyscaleBefore}
        greyscaleAfter={greyscaleAfter}
        analysis={analysis}
        referenceMode={referenceMode}
      />
    </div>
  );
}

function ReportRow({ label, value, tooltip }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#eeeeee] pb-2 last:border-b-0">
      <span className="flex min-w-0 items-center gap-1 text-[#666666]">
        {label}
        {tooltip ? <Tooltip label={tooltip} /> : null}
      </span>
      <span className="max-w-[175px] text-right font-semibold leading-5 text-[#111111]">{value}</span>
    </div>
  );
}
