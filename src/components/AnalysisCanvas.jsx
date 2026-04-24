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
import { useEffect, useState } from "react";
import { COLOR_VALUE_REFERENCES, GREY_SCALE_GRADES } from "../constants/greyScaleChart";
import { formatLab, formatRgb, formatSigned, rgbToHex } from "../utils/colorAnalysis";
import { ObserverForm } from "./ObserverForm";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";

const FULLSCREEN_BOARD_WIDTH = "80%";

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

function greyHexFromValue(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return "#f1f1f1";
  const channel = Math.round(Math.min(Math.max(value, 0), 255)).toString(16).padStart(2, "0");
  return `#${channel}${channel}${channel}`;
}

function valuePercent(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return 0;
  return Math.min(Math.max((value / 255) * 100, 0), 100);
}

function valueSummary(analysis) {
  if (!analysis) {
    return {
      title: "Menunggu dua foto",
      body: "Upload foto sebelum dan sesudah pencucian untuk melihat nilai greyscale dan ringkasan perubahan.",
      direction: "Belum tersedia",
    };
  }

  const delta = analysis.delta.value;
  if (Math.abs(delta) < 2) {
    return {
      title: "Nilai greyscale relatif stabil",
      body: "Perubahan terang-gelap sangat kecil, sehingga sampel terlihat belum banyak berubah secara visual.",
      direction: "Stabil",
    };
  }

  if (delta > 0) {
    return {
      title: "Sesudah pencucian lebih terang",
      body: "Nilai greyscale naik setelah pencucian. Ini dapat dibaca sebagai indikasi visual pemudaran atau kelunturan.",
      direction: "Lebih terang",
    };
  }

  return {
    title: "Sesudah pencucian lebih gelap",
    body: "Nilai greyscale turun setelah pencucian. Perubahan ini perlu dicek ulang terhadap foto dan kondisi pencahayaan.",
    direction: "Lebih gelap",
  };
}

function clampZoom(value) {
  return Math.min(Math.max(value, 0.45), 1.35);
}

function clampPhotoZoom(value) {
  return Math.min(Math.max(value, 1), 3);
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

function Metric({ label, value, detail, tooltip, compact = false }) {
  return (
    <div className={`min-w-0 rounded-[8px] border border-[#dedede] bg-white ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#666666]">
        <span>{label}</span>
        {tooltip ? <Tooltip label={tooltip} /> : null}
      </div>
      <div className={`${compact ? "mt-1 text-lg" : "mt-2 text-xl"} whitespace-pre-line break-words font-semibold leading-snug tracking-[-0.02em] text-[#111111]`}>
        {value}
      </div>
      {detail ? <div className="mt-2 text-xs leading-5 text-[#666666]">{detail}</div> : null}
    </div>
  );
}

function PhotoTile({ title, src, subtitle, compact = false }) {
  const [photoZoom, setPhotoZoom] = useState(1);

  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 flex min-h-10 items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[#111111]">{title}</div>
          <div className="text-xs font-medium text-[#666666]">{subtitle}</div>
        </div>
        <div className="flex shrink-0 items-center rounded-[8px] border border-[#dedede] bg-white p-1">
          <Button
            className="h-7 min-h-7 px-1.5"
            variant="ghost"
            onClick={() => setPhotoZoom((current) => clampPhotoZoom(current - 0.25))}
            disabled={!src || photoZoom <= 1}
            aria-label={`Zoom out ${title}`}
          >
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <span className="w-10 text-center text-[11px] font-bold text-[#444444]">
            {Math.round(photoZoom * 100)}%
          </span>
          <Button
            className="h-7 min-h-7 px-1.5"
            variant="ghost"
            onClick={() => setPhotoZoom((current) => clampPhotoZoom(current + 0.25))}
            disabled={!src || photoZoom >= 3}
            aria-label={`Zoom in ${title}`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </figcaption>
      <div className={`figure-frame flex items-center justify-center overflow-auto rounded-[8px] ${compact ? "h-[210px]" : "h-[280px]"}`}>
        {src ? (
          <img
            src={src}
            alt={title}
            className="max-h-none max-w-none object-contain transition-transform"
            style={{ width: `${photoZoom * 100}%`, height: `${photoZoom * 100}%` }}
          />
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
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 flex-none rounded-[8px] border border-[#cfcfcf]" style={{ background: hex }} />
        <div className="min-w-0">
          <div className="text-base font-semibold leading-6 text-[#111111]">{label}</div>
          <div className="mt-1 text-sm leading-6 text-[#4b5563]">RGB {rgb ? formatRgb(rgb) : "-"}</div>
          <div className="text-sm leading-6 text-[#4b5563]">
            {hex} - Value {analysis ? formatNumber(analysis.averageValue) : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

function GreyscaleValueCard({ label, imageAnalysis, marker }) {
  const value = imageAnalysis?.averageValue;
  const grey = greyHexFromValue(value);

  return (
    <div className="min-w-0 border-l-4 border-[#111111] bg-white py-4 pl-4 pr-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#666666]">{label}</div>
          <div className="mt-2 text-4xl font-semibold leading-none tracking-[-0.02em] text-[#111111]">
            {value !== undefined ? Math.round(value) : "-"}
          </div>
          <div className="mt-2 text-sm leading-6 text-[#666666]">
            Value greyscale digital dari 0 hitam sampai 255 putih.
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-[8px] border border-[#cfcfcf]" style={{ background: grey }} />
          <span className="text-xs font-bold text-[#444444]">{marker}</span>
        </div>
      </div>
    </div>
  );
}

function ValueComparisonChart({ analysis }) {
  const beforeValue = analysis?.before.averageValue;
  const afterValue = analysis?.after.averageValue;
  const summary = valueSummary(analysis);

  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <SectionTitle
        title="Perbandingan value greyscale"
        description="Marker menunjukkan posisi nilai rata-rata foto pada skala hitam ke putih."
        tooltip={tooltips.value}
      />
      <div className="mt-5">
        <div className="relative h-14 rounded-[8px] border border-[#cfcfcf] bg-[linear-gradient(90deg,#050505,#777777,#ffffff)]">
          {analysis ? (
            <>
              <div
                className="absolute top-[-8px] h-[72px] w-1 rounded-full bg-[#111111]"
                style={{ left: `calc(${valuePercent(beforeValue)}% - 2px)` }}
                title={`Sebelum value ${formatNumber(beforeValue)}`}
              />
              <div
                className="absolute top-[-8px] h-[72px] w-1 rounded-full bg-[#D97706]"
                style={{ left: `calc(${valuePercent(afterValue)}% - 2px)` }}
                title={`Sesudah value ${formatNumber(afterValue)}`}
              />
            </>
          ) : null}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#666666]">
          <span>0 Hitam</span>
          <span>128 Tengah</span>
          <span>255 Putih</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Arah" value={summary.direction} detail={summary.title} compact />
          <Metric
            label="Selisih value"
            value={analysis ? formatSigned(analysis.delta.value, 1) : "-"}
            detail="sesudah - sebelum"
            compact
          />
          <Metric
            label="Perubahan"
            value={analysis ? `${formatSigned(analysis.valueChangePercent, 1)}%` : "-"}
            detail="berdasarkan value sebelum"
            compact
          />
        </div>
      </div>
    </div>
  );
}

function ColorGreyscaleWheel({ analysis }) {
  const angle = 360 / COLOR_VALUE_REFERENCES.length;
  const colorGradient = COLOR_VALUE_REFERENCES.map((item, index) => {
    const start = Math.round(index * angle);
    const end = Math.round((index + 1) * angle);
    return `${item.hex} ${start}deg ${end}deg`;
  }).join(", ");
  const greyGradient = COLOR_VALUE_REFERENCES.map((item, index) => {
    const start = Math.round(index * angle);
    const end = Math.round((index + 1) * angle);
    return `${item.grey} ${start}deg ${end}deg`;
  }).join(", ");

  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <SectionTitle
        title="Hue ke greyscale value"
        description="Chart ini menerjemahkan warna menjadi nilai abu-abu seperti referensi yang kamu lampirkan."
        tooltip="Warna yang berbeda bisa memiliki value greyscale yang berbeda walaupun sama-sama terlihat kuat."
      />
      <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr] lg:items-center">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div
              className="aspect-square rounded-full border border-[#dedede]"
              style={{ background: `conic-gradient(${colorGradient})` }}
              aria-label="Hue color wheel"
            />
            <div className="mt-2 text-center text-xs font-bold text-[#555555]">Hue</div>
          </div>
          <div>
            <div
              className="aspect-square rounded-full border border-[#dedede]"
              style={{ background: `conic-gradient(${greyGradient})` }}
              aria-label="Greyscale value wheel"
            />
            <div className="mt-2 text-center text-xs font-bold text-[#555555]">Greyscale</div>
          </div>
        </div>
        <div className="min-w-0">
          <div className="grid grid-cols-9 overflow-hidden rounded-[8px] border border-[#d2d2d2]">
            {COLOR_VALUE_REFERENCES.map((item) => (
              <div key={`${item.name}-color-strip`} className="h-8" style={{ background: item.hex }} title={item.name} />
            ))}
            {COLOR_VALUE_REFERENCES.map((item) => (
              <div key={`${item.name}-grey-strip`} className="h-8 border-t border-[#d2d2d2]" style={{ background: item.grey }} title={`${item.name} value ${item.value}`} />
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <AveragePatch label="Average before" analysis={analysis?.before} />
            <AveragePatch label="Average after" analysis={analysis?.after} />
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualResultDashboard({ analysis }) {
  const summary = valueSummary(analysis);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch">
        <div className="grid gap-3 rounded-[8px] border border-[#dedede] bg-[#fbfbfa] p-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#666666]">Ringkasan hasil</div>
            <h3 className="mt-2 text-2xl font-semibold leading-8 tracking-[-0.02em] text-[#111111]">
              {summary.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#555555]">{summary.body}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <GreyscaleValueCard label="Sebelum pencucian" imageAnalysis={analysis?.before} marker="Before" />
            <GreyscaleValueCard label="Sesudah pencucian" imageAnalysis={analysis?.after} marker="After" />
          </div>
        </div>
        <ValueComparisonChart analysis={analysis} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-start">
        <ColorGreyscaleWheel analysis={analysis} />
        <RgbRadar analysis={analysis} />
      </section>
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
  const size = 420;

  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <SectionTitle
        title="Radar RGB"
        description="Sumbu R/G/B memakai skala 0-255; semakin jauh dari pusat berarti channel lebih kuat."
        tooltip="Radar membantu melihat channel R/G/B mana yang berubah paling besar."
      />
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto mt-4 h-[360px] w-full max-w-[420px]">
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
        <text x={size / 2 + 6} y={size / 2 - size * 0.34 - 3} className="fill-[#666666] text-[10px] font-bold">255</text>
        <text x={size / 2 + 5} y={size / 2 - size * 0.17} className="fill-[#666666] text-[10px] font-bold">128</text>
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
      <div className="flex justify-center gap-6 text-sm font-semibold">
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
  const width = 720;
  const height = 220;
  const plotHeight = 168;
  const bottom = 182;
  const left = 54;
  const right = width - 16;
  const plotWidth = right - left;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block h-[220px] w-full">
      <rect width={width} height={height} rx="8" fill="#fbfbfa" />
      {[0.25, 0.5, 0.75].map((line) => (
        <line key={line} x1={left} x2={right} y1={plotHeight * line + 14} y2={plotHeight * line + 14} stroke="#e0e0e0" />
      ))}
      <line x1={left} x2={left} y1="14" y2={bottom} stroke="#111111" strokeWidth="2" />
      <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="#111111" strokeWidth="2" />
      <g transform={`translate(${left} 14)`}>
        <path d={histogramPath(before?.histogram[channel] || [], plotWidth, plotHeight)} fill="none" stroke={color} strokeWidth="4" />
        <path d={histogramPath(after?.histogram[channel] || [], plotWidth, plotHeight)} fill="none" stroke={afterColor} strokeWidth="4" />
      </g>
      <text x="24" y="98" textAnchor="middle" transform="rotate(-90 24 98)" className="fill-[#4b5563] text-xs font-bold">
        jumlah pixel
      </text>
      <text x={left} y="205" className="fill-[#4b5563] text-xs font-bold">0</text>
      <text x={left + plotWidth / 2} y="205" textAnchor="middle" className="fill-[#4b5563] text-xs font-bold">128</text>
      <text x={right} y="205" textAnchor="end" className="fill-[#4b5563] text-xs font-bold">255</text>
      <text x={width / 2} y="217" textAnchor="middle" className="fill-[#4b5563] text-xs font-bold">
        intensitas {channel.toUpperCase()}
      </text>
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
        <div className="mt-4 w-full">
          <HistogramOverlay before={analysis?.before} after={analysis?.after} />
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {channels.map((channel) => (
            <div key={channel.id}>
              <div className="mb-2 text-sm font-bold text-[#333333]">{channel.label}</div>
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
        className="mt-4 grid gap-px overflow-hidden rounded-[8px] border border-[#111111] bg-[#111111]"
        style={{ gridTemplateColumns: `repeat(${matrix?.size || 18}, minmax(0, 1fr))` }}
      >
        {(matrix?.cells || Array.from({ length: 18 * 18 })).map((cell, index) => (
          <div
            key={index}
            className="aspect-square"
            style={{ background: cell?.color || "#f1f1f1" }}
            title={cell ? `Intensity ${formatNumber(cell.intensity)}%, value ${formatSigned(cell.valueDelta, 1)}` : undefined}
          />
        ))}
      </div>
      <div className="mt-3 grid gap-2 text-xs font-semibold text-[#444444] sm:grid-cols-3">
        <div className="flex items-center gap-2"><span className="h-3 w-8 rounded-sm bg-[#1D4ED8]" /> Lebih terang / luntur</div>
        <div className="flex items-center gap-2"><span className="h-3 w-8 rounded-sm bg-[#B45309]" /> Lebih gelap</div>
        <div className="flex items-center gap-2"><span className="h-3 w-8 rounded-sm bg-[#7C3AED]" /> Chroma berubah</div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="Avg" value={`${matrix ? formatNumber(matrix.averageIntensity) : "-"}%`} detail="rata-rata" />
        <Metric label="Max" value={`${matrix ? formatNumber(matrix.maxIntensity) : "-"}%`} detail="tertinggi" />
        <Metric label="Area kuat" value={`${matrix ? formatNumber(matrix.highChangePercent) : "-"}%`} detail="di atas ambang" />
      </div>
    </div>
  );
}

function IsoReference({ variant = "grid" }) {
  const isVertical = variant === "vertical";

  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <SectionTitle
        title="ISO 105-A03 visual reference"
        description="Referensi visual ilustratif untuk observer."
        tooltip="Chip ini bukan kalibrasi resmi ISO. Gunakan sebagai panduan visual bersama penilaian observer."
      />
      <div className="mt-4 grid gap-3">
        {GREY_SCALE_GRADES.map((item) => (
          <div
            key={item.grade}
            className={
              isVertical
                ? "grid grid-cols-[32%_1fr] items-center gap-4 rounded-[8px] border border-[#d2d2d2] bg-[#fbfbfa] p-3"
                : "grid grid-cols-[32%_1fr] items-center gap-4 rounded-[8px] border border-[#d2d2d2] bg-[#fbfbfa] p-3"
            }
          >
            <div className="grid h-20 grid-cols-2 overflow-hidden rounded-[6px] border border-[#c9c9c9]">
              <div style={{ background: item.patches[0] }} />
              <div style={{ background: item.patches[1] }} />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold leading-7 text-[#111111]">{item.grade}</div>
              <div className="mt-1 text-sm leading-6 text-[#4b5563] [overflow-wrap:anywhere]">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorValueReference() {
  const maxValue = 255;

  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <SectionTitle
        title="Color value grey chart"
        description="Sumbu X adalah hue; sumbu Y adalah value digital 0-255 hasil luminosity RGB."
        tooltip="Grey value dihitung dari luminosity RGB: 0.299R + 0.587G + 0.114B."
      />
      <div className="mt-4 grid grid-cols-[42px_1fr] gap-2">
        <div className="flex flex-col justify-between pb-7 pt-1 text-right text-[10px] font-semibold text-[#666666]">
          <span>255</span>
          <span>128</span>
          <span>0</span>
        </div>
        <div>
          <div className="relative h-56 border-b-2 border-l-2 border-[#111111] bg-[linear-gradient(to_top,#e5e5e5_1px,transparent_1px)] bg-[length:100%_25%] px-2">
            <span className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold uppercase tracking-[0.12em] text-[#666666]">
              Value
            </span>
            <div className="flex h-full items-end gap-2">
              {COLOR_VALUE_REFERENCES.map((item) => (
                <div key={`${item.name}-bar`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="w-full rounded-t-[4px] border border-[#111111]/15"
                    style={{
                      height: `${Math.max(8, (item.value / maxValue) * 100)}%`,
                      background: item.grey,
                    }}
                    title={`${item.name}: value ${item.value}`}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-9 gap-2 text-center text-[10px] font-semibold text-[#666666]">
            {COLOR_VALUE_REFERENCES.map((item) => (
              <span key={`${item.name}-axis`} className="truncate">{item.name}</span>
            ))}
          </div>
          <div className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#666666]">
            Hue
          </div>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto pb-1">
        <div className="grid min-w-full grid-cols-[12%_repeat(9,minmax(0,1fr))] overflow-hidden rounded-[8px] border border-[#d2d2d2] text-sm font-semibold text-[#333333]">
          <div className="border-b border-r border-[#d2d2d2] bg-[#fbfbfa] p-3">Hue</div>
          {COLOR_VALUE_REFERENCES.map((item) => (
            <div key={item.name} className="border-b border-r border-[#d2d2d2] p-3 text-center last:border-r-0">{item.name}</div>
          ))}

          <div className="border-b border-r border-[#d2d2d2] bg-[#fbfbfa] p-3">Color</div>
          {COLOR_VALUE_REFERENCES.map((item) => (
            <div key={`${item.name}-color`} className="border-b border-r border-[#d2d2d2] p-3 last:border-r-0">
              <div className="h-16 rounded-[6px] border border-[#c9c9c9]" style={{ background: item.hex }} />
              <div className="mt-2 text-center text-xs font-bold text-[#4b5563]">{item.hex}</div>
            </div>
          ))}

          <div className="border-r border-[#d2d2d2] bg-[#fbfbfa] p-3">Grey</div>
          {COLOR_VALUE_REFERENCES.map((item) => (
            <div key={`${item.name}-grey`} className="border-r border-[#d2d2d2] p-3 text-center last:border-r-0">
              <div className="h-16 rounded-[6px] border border-[#c9c9c9]" style={{ background: item.grey }} />
              <div className="mt-2 text-sm font-bold text-[#111111]">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex shrink-0 rounded-[8px] border border-[#b7b7b7] bg-[#e7e7e4] p-1 shadow-sm">
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={`rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === id ? "bg-[#111111] text-white shadow-sm" : "text-[#3f3f3f] hover:bg-white/70 hover:text-[#111111]"
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
      <Metric label="Delta E" value={formatNumber(analysis.deltaE, 2)} detail="CIE76 estimate" tooltip={tooltips.deltaE} compact />
      <Metric label="Grade" value={analysis.estimatedGrade} detail={analysis.gradeDescription} tooltip={tooltips.grade} compact />
      <Metric
        label="Value"
        value={`${formatSigned(analysis.valueChangePercent, 1)}%`}
        detail={`Delta ${formatSigned(analysis.delta.value, 1)}`}
        tooltip={tooltips.value}
        compact
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

function WorkspaceObserver({
  before,
  after,
  greyscaleBefore,
  greyscaleAfter,
  analysis,
  observer,
  onObserverChange,
}) {
  return (
    <div className="grid gap-6">
      <VisualResultDashboard analysis={analysis} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,64%)_minmax(0,36%)]">
        <div className="research-panel p-4 sm:p-5">
          <SectionTitle
            title="Foto hasil konversi"
            description="Original dan greyscale tetap ditampilkan agar observer bisa membandingkan sampel secara visual."
          />
          <div className="mt-4">
            <PreviewGrid
              before={before}
              after={after}
              greyscaleBefore={greyscaleBefore}
              greyscaleAfter={greyscaleAfter}
            />
          </div>
        </div>
        <div className="grid content-start gap-4">
          <IsoReference variant="vertical" />
        </div>
      </section>

      <ObserverForm value={observer} onChange={onObserverChange} />
    </div>
  );
}

function AdvancedMetrics({ analysis, referenceMode }) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <RgbRadar analysis={analysis} />
        <HistogramPanel analysis={analysis} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,62%)_minmax(0,38%)] xl:items-start">
        <ChangeMatrix analysis={analysis} />
        <div className="grid content-start gap-6">
          {referenceMode === "iso" ? <IsoReference /> : <ColorValueReference />}
          <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
            <SectionTitle title="Interpretasi cepat" />
            <div className="mt-3 grid gap-2 text-sm leading-6 text-[#444444]">
              <p><strong>Delta E</strong> membaca besar perubahan warna rata-rata.</p>
              <p><strong>Delta value</strong> negatif berarti lebih gelap; positif berarti lebih terang.</p>
              <p><strong>Matrix</strong> menunjukkan apakah perubahan merata atau lokal; biru berarti lebih terang/luntur dan oranye berarti lebih gelap.</p>
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
  observer,
  onObserverChange,
  isAnalysing,
  error,
}) {
  const [zoom, setZoom] = useState(0.86);
  const [referenceMode, setReferenceMode] = useState("iso");
  const [showDetails, setShowDetails] = useState(false);
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
    return 1;
  };

  return (
    <>
      <section className="research-panel overflow-hidden p-5 sm:p-6" aria-labelledby="analysis-canvas-heading">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="analysis-canvas-heading" className="text-xl font-semibold text-[#111111]">
                Hasil analisis greyscale
              </h2>
              <Badge tone={analysis ? "success" : "neutral"}>{status}</Badge>
            </div>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[#666666]">
              Nilai greyscale, ringkasan perubahan, dan chart visual ditampilkan lebih dulu.
              Detail perhitungan teknis bisa dibuka saat diperlukan.
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

        {error ? <p className="mt-4 text-sm font-semibold text-[#DC2626]">{error}</p> : null}

        <div className="mt-6">
          <WorkspaceObserver
            before={before}
            after={after}
            greyscaleBefore={greyscaleBefore}
            greyscaleAfter={greyscaleAfter}
            analysis={analysis}
            observer={observer}
            onObserverChange={onObserverChange}
          />
        </div>

        <div className="mt-6 border-t border-[#eeeeee] pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#111111]">Detail perhitungan</h3>
              <p className="mt-1 text-sm leading-6 text-[#666666]">
                Buka bagian ini untuk melihat Delta E, LAB, histogram, matrix, dan numeric report.
              </p>
            </div>
            <Button className="shrink-0 rounded-full px-5" variant="secondary" onClick={() => setShowDetails((current) => !current)}>
              <ChevronRight className={`h-4 w-4 transition-transform ${showDetails ? "rotate-90" : ""}`} aria-hidden="true" />
              {showDetails ? "Sembunyikan detail" : "Lihat detail"}
            </Button>
          </div>
          {showDetails ? (
            <div className="mt-5">
              <div className="mb-4 flex justify-end">
                <Segmented value={referenceMode} onChange={setReferenceMode} options={[["iso", "ISO greyscale"], ["value", "Color value"]]} />
              </div>
              <AdvancedMetrics analysis={analysis} referenceMode={referenceMode} />
            </div>
          ) : null}
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
          observer={observer}
          onObserverChange={onObserverChange}
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
  observer,
  onObserverChange,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("workspace");
  const clampedZoom = clampZoom(zoom);

  useEffect(() => {
    setZoom(fitZoom());
  }, [fitZoom, setZoom]);
  const boardStyle = {
    width: FULLSCREEN_BOARD_WIDTH,
    zoom: clampedZoom,
  };

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
          <Segmented
            value={activeTab}
            onChange={setActiveTab}
            options={[
              ["workspace", "Workspace"],
              ["advanced", "Data"],
            ]}
          />
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

      <div className="min-h-0 flex-1 overflow-auto bg-[#efefed] p-[2%]">
        <CanvasBoard
          before={before}
          after={after}
          greyscaleBefore={greyscaleBefore}
          greyscaleAfter={greyscaleAfter}
          analysis={analysis}
          referenceMode={referenceMode}
          activeTab={activeTab}
          observer={observer}
          onObserverChange={onObserverChange}
          boardStyle={boardStyle}
        />
      </div>
    </div>
  );
}

function CanvasBoard({
  before,
  after,
  greyscaleBefore,
  greyscaleAfter,
  analysis,
  referenceMode,
  activeTab,
  observer,
  onObserverChange,
  boardStyle,
}) {
  return (
    <div className="analysis-grid mx-auto rounded-[8px] border border-[#cfcfcb] bg-[#fbfbfa] p-[2%] shadow-sm" style={boardStyle}>
      {activeTab === "workspace" ? (
        <WorkspaceObserver
          before={before}
          after={after}
          greyscaleBefore={greyscaleBefore}
          greyscaleAfter={greyscaleAfter}
          analysis={analysis}
          observer={observer}
          onObserverChange={onObserverChange}
        />
      ) : (
        <AdvancedMetrics analysis={analysis} referenceMode={referenceMode} />
      )}
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
