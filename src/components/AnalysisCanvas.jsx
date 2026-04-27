import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  ScanSearch,
  Crop,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { COLOR_VALUE_REFERENCES, GREY_SCALE_GRADES } from "../constants/greyScaleChart";
import { useCroppedPreview } from "../hooks/useCroppedPreview";
import { formatLab, formatRgb, formatSigned, rgbToHex } from "../utils/colorAnalysis";
import { ObserverForm } from "./ObserverForm";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tooltip } from "./ui/tooltip";

const FULLSCREEN_BOARD_WIDTH = "100%";

const tooltips = {
  deltaE:
    "Delta E CIE76 adalah jarak warna rata-rata di ruang LAB. Nilai lebih besar berarti perubahan warna lebih terlihat.",
  grade:
    "Estimasi grade dihitung dari Delta E CIE76 antara warna rata-rata sebelum dan sesudah, lalu dipetakan ke skala 5 sampai 1.",
  value:
    "Value memakai rata-rata luminosity RGB: 0.299R + 0.587G + 0.114B. Nilai negatif berarti lebih gelap, positif berarti lebih terang.",
  lab: "LAB memisahkan terang/gelap (L*), arah hijau-merah (a*), dan arah biru-kuning (b*).",
  histogram:
    "Histogram menunjukkan sebaran intensitas pixel pada ROI. Ringkasan gelap/tengah/terang lebih mudah dibaca; kurva detail dipakai untuk melihat pola distribusi. Garis vertikal menandai mean sebelum dan sesudah.",
  matrix:
    "Matrix membagi foto menjadi area kecil dan menandai intensitas perubahan lokal. Oranye lebih gelap, biru lebih terang.",
  rgbDelta:
    "Delta RGB membaca perubahan rata-rata channel dari area ROI: sesudah dikurangi sebelum. Nilai negatif berarti channel turun, positif berarti channel naik. Bar delta memakai skala yang diperbesar agar perubahan kecil tetap terlihat.",
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

function gradeDeltaRange(grade) {
  const ranges = {
    5: "Delta E <= 0.8",
    "4-5": "Delta E <= 1.7",
    4: "Delta E <= 2.5",
    "3-4": "Delta E <= 3.4",
    3: "Delta E <= 6.8",
    "2-3": "Delta E <= 9",
    2: "Delta E <= 12",
    "1-2": "Delta E <= 16",
    1: "Delta E > 16",
  };

  return ranges[grade] || "Menunggu Delta E";
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

function PhotoTile({ title, src, subtitle, roi, compact = false }) {
  const [photoZoom, setPhotoZoom] = useState(1);
  const croppedSrc = useCroppedPreview(src, roi, 1100);
  const displaySrc = croppedSrc || src;

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
        {displaySrc ? (
          <img
            src={displaySrc}
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

function AveragePatch({ label, analysis, compact = false, vertical = false }) {
  const rgb = analysis?.averageRgb;
  const hex = analysis?.averageHex || (rgb ? rgbToHex(rgb) : "#f1f1f1");

  if (vertical) {
    return (
      <div className="flex min-h-0 flex-col overflow-hidden rounded-[8px] border border-[#dedede] bg-white">
        <div
          className="min-h-[150px] flex-1 border-b border-[#dedede]"
          style={{ background: hex }}
          aria-label={`${label} color swatch`}
        />
        <div className="p-3">
          <div className="text-sm font-semibold leading-6 text-[#111111]">{label}</div>
          <div className="mt-1 text-xs leading-5 text-[#4b5563]">Rata-rata RGB {rgb ? formatRgb(rgb) : "-"}</div>
          <div className="text-xs leading-5 text-[#4b5563]">
            {hex} - value {analysis ? formatNumber(analysis.averageValue) : "-"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-[8px] border border-[#dedede] bg-white ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center gap-3">
        <div className={`${compact ? "h-12 w-12" : "h-20 w-20"} flex-none rounded-[8px] border border-[#cfcfcf]`} style={{ background: hex }} />
        <div className="min-w-0">
          <div className={`${compact ? "text-sm" : "text-base"} font-semibold leading-6 text-[#111111]`}>{label}</div>
          <div className="mt-0.5 text-xs leading-5 text-[#4b5563]">Rata-rata RGB {rgb ? formatRgb(rgb) : "-"}</div>
          <div className="text-xs leading-5 text-[#4b5563]">
            {hex} - value {analysis ? formatNumber(analysis.averageValue) : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

function GreyscaleValueCard({ label, imageAnalysis, marker }) {
  const value = imageAnalysis?.averageValue;
  const grey = greyHexFromValue(value);
  const rgb = imageAnalysis?.averageRgb;

  return (
    <div className="min-w-0 border-l-4 border-[#111111] bg-white py-4 pl-4 pr-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#666666]">{label}</div>
          <div className="mt-2 text-4xl font-semibold leading-none tracking-[-0.02em] text-[#111111]">
            {value !== undefined ? Math.round(value) : "-"}
          </div>
          <div className="mt-2 text-sm leading-6 text-[#666666]">
            Rata-rata value dari RGB foto, dibulatkan dari {value !== undefined ? formatNumber(value, 1) : "-"}.
          </div>
          <div className="mt-1 text-xs leading-5 text-[#777777]">
            Rumus: 0.299R + 0.587G + 0.114B{rgb ? ` dari avg RGB ${formatRgb(rgb)}` : ""}.
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

function GradeExplanation({ analysis }) {
  const summary = valueSummary(analysis);
  const grade = analysis?.estimatedGrade || "-";
  const deltaE = analysis ? formatNumber(analysis.deltaE, 2) : "-";
  const deltaValue = analysis ? formatSigned(analysis.delta.value, 1) : "-";
  const deltaRgb = analysis
    ? `${formatSigned(analysis.delta.rgb.r, 1)} R / ${formatSigned(analysis.delta.rgb.g, 1)} G / ${formatSigned(analysis.delta.rgb.b, 1)} B`
    : "-";

  return (
    <section className="rounded-[8px] border border-[#dedede] bg-white p-4 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#666666]">Cara membaca estimasi</div>
          <h3 className="mt-2 text-2xl font-semibold leading-8 tracking-[-0.02em] text-[#111111]">
            Grade {grade} berasal dari jarak warna rata-rata
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#555555]">
            Setelah foto dibandingkan dengan referensi ISO, angka estimasi dibaca dari Delta E. Delta E menghitung jarak antara warna rata-rata sebelum dan sesudah di ruang LAB; makin kecil jaraknya, makin tinggi grade-nya.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="1. Delta E"
            value={deltaE}
            detail="jarak LAB sebelum ke sesudah"
            tooltip={tooltips.deltaE}
            compact
          />
          <Metric
            label="2. Ambang grade"
            value={grade}
            detail={gradeDeltaRange(analysis?.estimatedGrade)}
            tooltip={tooltips.grade}
            compact
          />
          <Metric
            label="3. Arah visual"
            value={summary.direction}
            detail={`Delta value ${deltaValue}`}
            tooltip={tooltips.value}
            compact
          />
        </div>
      </div>

      <div className="mt-4 rounded-[8px] bg-[#fbfbfa] p-3 text-sm leading-6 text-[#4b5563]">
        <strong className="text-[#111111]">Yang dihitung:</strong> rata-rata RGB foto berubah {deltaRgb}, lalu dikonversi ke LAB untuk Delta E. Grade ini adalah estimasi digital; keputusan akhir tetap dari observer saat membandingkan foto dan chip referensi.
      </div>
    </section>
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

      {/* Wheels + color-grey strip */}
      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex flex-col items-center">
            <div
              className="h-[88px] w-[88px] rounded-full border border-[#dedede]"
              style={{ background: `conic-gradient(${colorGradient})` }}
              aria-label="Hue color wheel"
            />
            <div className="mt-1.5 text-[11px] font-bold text-[#555555]">Hue</div>
          </div>
          <div className="text-lg font-light text-[#cccccc]">→</div>
          <div className="flex flex-col items-center">
            <div
              className="h-[88px] w-[88px] rounded-full border border-[#dedede]"
              style={{ background: `conic-gradient(${greyGradient})` }}
              aria-label="Greyscale value wheel"
            />
            <div className="mt-1.5 text-[11px] font-bold text-[#555555]">Greyscale</div>
          </div>
        </div>

        <div className="min-w-0 flex-1 self-stretch">
          <div className="grid grid-cols-9 overflow-hidden rounded-[8px] border border-[#d2d2d2]">
            {COLOR_VALUE_REFERENCES.map((item) => (
              <div key={`${item.name}-color-strip`} className="h-7" style={{ background: item.hex }} title={item.name} />
            ))}
            {COLOR_VALUE_REFERENCES.map((item) => (
              <div key={`${item.name}-grey-strip`} className="h-7 border-t border-[#d2d2d2]" style={{ background: item.grey }} title={`${item.name} value ${item.value}`} />
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-9 text-center text-[9px] font-semibold leading-tight text-[#888888]">
            {COLOR_VALUE_REFERENCES.map((item) => (
              <span key={`${item.name}-lbl`} className="truncate px-0.5">{item.name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Average patches - full width, clear hierarchy */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <AveragePatch label="Avg sebelum" analysis={analysis?.before} compact />
        <AveragePatch label="Avg sesudah" analysis={analysis?.after} compact />
      </div>
    </div>
  );
}

function ColorGreyscaleStory({ analysis }) {
  const [selectedName, setSelectedName] = useState(COLOR_VALUE_REFERENCES[0]?.name);
  const selected = COLOR_VALUE_REFERENCES.find((item) => item.name === selectedName) || COLOR_VALUE_REFERENCES[0];
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
        title="Referensi color value greyscale"
        description="Referensi tambahan untuk membaca konversi warna ke abu-abu. Ini bukan hasil before/after, tapi konteks kenapa tiap hue punya value greyscale berbeda."
        tooltip="Warna yang berbeda bisa memiliki value greyscale yang berbeda walaupun sama-sama terlihat kuat."
      />

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex flex-col items-center">
            <div
              className="h-[88px] w-[88px] rounded-full border border-[#dedede]"
              style={{ background: `conic-gradient(${colorGradient})` }}
              aria-label="Hue color wheel"
            />
            <div className="mt-1.5 text-[11px] font-bold text-[#555555]">Hue</div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#b7b7b7]" aria-hidden="true" />
          <div className="flex flex-col items-center">
            <div
              className="h-[88px] w-[88px] rounded-full border border-[#dedede]"
              style={{ background: `conic-gradient(${greyGradient})` }}
              aria-label="Greyscale value wheel"
            />
            <div className="mt-1.5 text-[11px] font-bold text-[#555555]">Greyscale</div>
          </div>
        </div>

        <div className="min-w-0 flex-1 self-stretch">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#666666]">
            Pilih warna referensi
          </div>
          <div className="grid grid-cols-9 overflow-hidden rounded-[8px] border border-[#d2d2d2]">
            {COLOR_VALUE_REFERENCES.map((item) => (
              <button
                key={`${item.name}-color-story`}
                type="button"
                className={`h-8 border-0 transition-transform focus-ring ${selected.name === item.name ? "scale-y-110 ring-2 ring-inset ring-[#111111]" : ""}`}
                style={{ background: item.hex }}
                title={item.name}
                aria-label={`Pilih ${item.name}`}
                onClick={() => setSelectedName(item.name)}
              />
            ))}
            {COLOR_VALUE_REFERENCES.map((item) => (
              <button
                key={`${item.name}-grey-story`}
                type="button"
                className={`h-8 border-0 border-t border-[#d2d2d2] transition-transform focus-ring ${selected.name === item.name ? "scale-y-110 ring-2 ring-inset ring-[#111111]" : ""}`}
                style={{ background: item.grey }}
                title={`${item.name} value ${item.value}`}
                aria-label={`Pilih greyscale ${item.name}`}
                onClick={() => setSelectedName(item.name)}
              />
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-9 text-center text-[9px] font-semibold leading-tight text-[#888888]">
            {COLOR_VALUE_REFERENCES.map((item) => (
              <span key={`${item.name}-story-label`} className="truncate px-0.5">{item.name}</span>
            ))}
          </div>

          <div className="mt-4 grid gap-3 rounded-[8px] bg-[#fbfbfa] p-3 sm:grid-cols-[80px_1fr]">
            <div className="grid grid-cols-2 overflow-hidden rounded-[6px] border border-[#cfcfcf]">
              <div style={{ background: selected.hex }} />
              <div style={{ background: selected.grey }} />
            </div>
            <div className="min-w-0 text-sm leading-6 text-[#555555]">
              <strong className="text-[#111111]">{selected.name}</strong> diterjemahkan menjadi value {selected.value} pada skala 0-255. Prinsip yang sama dipakai saat aplikasi mengambil rata-rata RGB foto, lalu mengubahnya menjadi value greyscale.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function AveragePhotoPanel({ analysis }) {
  return (
    <div className="flex h-full min-h-[470px] flex-col rounded-[8px] border border-[#dedede] bg-white p-4">
      <SectionTitle
        title="Rata-rata warna foto"
        description="Dua swatch ini adalah warna rata-rata foto sebelum dan sesudah. Dari titik rata-rata ini aplikasi menghitung value greyscale, LAB, Delta E, lalu estimasi grade."
        tooltip="Rata-rata RGB dipakai agar perubahan warna bisa dibaca sebagai angka ringkas sebelum dilihat lewat chart detail."
      />
      <div className="mt-4 grid min-h-0 flex-1 gap-3 sm:grid-cols-2">
        <AveragePatch label="Rata-rata sebelum" analysis={analysis?.before} vertical />
        <AveragePatch label="Rata-rata sesudah" analysis={analysis?.after} vertical />
      </div>
    </div>
  );
}

const RGB_CHANNELS = [
  { key: "r", label: "R", name: "Red", color: "#DC2626" },
  { key: "g", label: "G", name: "Green", color: "#16A34A" },
  { key: "b", label: "B", name: "Blue", color: "#2563EB" },
];

function RgbChangePanel({ analysis }) {
  const maxDelta = analysis
    ? Math.max(4, ...RGB_CHANNELS.map((channel) => Math.abs(analysis.delta.rgb[channel.key])))
    : 16;
  const strongest = analysis
    ? RGB_CHANNELS.reduce((current, next) =>
        Math.abs(analysis.delta.rgb[next.key]) > Math.abs(analysis.delta.rgb[current.key]) ? next : current,
      )
    : RGB_CHANNELS[0];
  const strongestDelta = analysis ? analysis.delta.rgb[strongest.key] : 0;
  const allDeltas = analysis ? RGB_CHANNELS.map((channel) => analysis.delta.rgb[channel.key]) : [];
  const directionSummary = !analysis
    ? "Menunggu analisis"
    : allDeltas.every((delta) => delta < 0)
      ? "Semua channel turun"
      : allDeltas.every((delta) => delta > 0)
        ? "Semua channel naik"
        : "Channel berubah campuran";

  return (
    <div className="flex h-full flex-col rounded-[8px] border border-[#dedede] bg-white p-4">
      <SectionTitle
        title="RGB delta summary"
        description="Fokus pada selisih sesudah - sebelum agar perubahan kecil pada channel warna langsung terlihat."
        tooltip={tooltips.rgbDelta}
      />

      <div className="mt-4 rounded-[8px] bg-[#fbfbfa] p-3">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#666666]">Channel paling berubah</div>
        <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
          <div className="text-2xl font-semibold leading-8 text-[#111111]">
            {analysis ? `${strongest.name} ${strongestDelta < 0 ? "turun" : "naik"} ${Math.abs(formatNumber(strongestDelta, 1))}` : "-"}
          </div>
          <div className="pb-1 text-sm font-semibold text-[#666666]">{directionSummary}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-3">
          {RGB_CHANNELS.map((channel) => {
            const beforeValue = analysis?.before.averageRgb[channel.key] || 0;
            const afterValue = analysis?.after.averageRgb[channel.key] || 0;
            const delta = analysis?.delta.rgb[channel.key] || 0;
            const width = Math.max(2, (Math.abs(delta) / maxDelta) * 50);
            const direction = Math.abs(delta) < 0.1 ? "stabil" : delta < 0 ? "turun" : "naik";

            return (
              <div key={`${channel.key}-delta`} className="rounded-[8px] border border-[#eeeeee] bg-white p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: channel.color }}>
                      {channel.label}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-[#111111]">{channel.name}</div>
                      <div className="text-xs leading-5 text-[#666666]">
                        {analysis ? `${formatNumber(beforeValue, 1)} -> ${formatNumber(afterValue, 1)}` : "Sebelum -> sesudah"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold leading-6 text-[#111111]">{analysis ? formatSigned(delta, 1) : "-"}</div>
                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#777777]">{direction}</div>
                  </div>
                </div>

                <div className="grid grid-cols-[48px_1fr_42px] items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777777]">Turun</span>
                  <div className="relative h-7 rounded-[8px] bg-[#f1f1f1]">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-[#111111]" />
                    {analysis ? (
                      <div
                        className="absolute top-1 h-5 rounded-[6px]"
                        style={{
                          width: `${width}%`,
                          left: delta < 0 ? `${50 - width}%` : "50%",
                          background: delta < 0 ? "#B45309" : channel.color,
                        }}
                      />
                    ) : null}
                  </div>
                  <span className="text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#777777]">Naik</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-2 rounded-[8px] border border-[#eeeeee] bg-[#fbfbfa] p-3 text-xs leading-5 text-[#555555] sm:grid-cols-3">
          {RGB_CHANNELS.map((channel) => {
            const beforeValue = analysis?.before.averageRgb[channel.key] || 0;
            const afterValue = analysis?.after.averageRgb[channel.key] || 0;
            return (
              <div key={`${channel.key}-context`} className="min-w-0">
                <div className="font-bold text-[#111111]">{channel.label} average</div>
                <div>{analysis ? `${formatNumber(beforeValue, 1)} sebelum -> ${formatNumber(afterValue, 1)} sesudah` : "-"}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-auto pt-4">
        <div className="rounded-[8px] border border-[#eeeeee] bg-[#fbfbfa] p-3 text-sm leading-6 text-[#555555]">
          <strong className="text-[#111111]">Cara baca:</strong> lihat delta terbesar dulu, lalu cek apakah semua channel bergerak searah.
          Jika semua turun, area ROI cenderung lebih gelap. Jika salah satu channel berubah dominan, warna sampel bergeser ke arah hue tertentu.
        </div>
      </div>
    </div>
  );
}

function QualityChecks({ analysis }) {
  const notes = analysis?.quality || [];
  if (!notes.length) return null;

  return (
    <div className="rounded-[8px] border border-[#f3d6a4] bg-[#fffaf2] p-4">
      <SectionTitle
        title="Catatan kualitas analisis"
        description="Peringatan ini membantu membedakan perubahan kain dari pengaruh foto."
      />
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {notes.map((note) => (
          <div key={note.title} className="rounded-[8px] border border-[#f0dfc3] bg-white p-3">
            <div className="text-sm font-semibold text-[#111111]">{note.title}</div>
            <p className="mt-1 text-xs leading-5 text-[#666666]">{note.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValueStatsPanel({ analysis }) {
  const before = analysis?.before.stats.value;
  const after = analysis?.after.stats.value;
  const rows = [
    ["P10", before?.p10, after?.p10],
    ["Median", before?.median, after?.median],
    ["Mean", before?.mean, after?.mean],
    ["P90", before?.p90, after?.p90],
    ["Std dev", before?.stdDev, after?.stdDev],
  ];

  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <SectionTitle
        title="Ringkasan distribusi greyscale"
        description="Median dan percentile membantu membaca perubahan kecil tanpa terlalu bergantung pada rata-rata."
      />
      <div className="mt-4 overflow-hidden rounded-[8px] border border-[#dedede]">
        <div className="grid grid-cols-4 bg-[#fbfbfa] text-xs font-bold uppercase tracking-[0.12em] text-[#666666]">
          <div className="p-3">Metric</div>
          <div className="p-3 text-right">Sebelum</div>
          <div className="p-3 text-right">Sesudah</div>
          <div className="p-3 text-right">Delta</div>
        </div>
        {rows.map(([label, beforeValue, afterValue]) => (
          <div key={label} className="grid grid-cols-4 border-t border-[#eeeeee] text-sm">
            <div className="p-3 font-semibold text-[#111111]">{label}</div>
            <div className="p-3 text-right text-[#555555]">{beforeValue ?? "-"}</div>
            <div className="p-3 text-right text-[#555555]">{afterValue ?? "-"}</div>
            <div className="p-3 text-right font-semibold text-[#111111]">
              {analysis ? formatSigned((afterValue || 0) - (beforeValue || 0), 1) : "-"}
            </div>
          </div>
        ))}
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
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#666666]">Perubahan value greyscale</div>
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-stretch">
        <AveragePhotoPanel analysis={analysis} />
        <RgbChangePanel analysis={analysis} />
      </section>

      <ValueStatsPanel analysis={analysis} />
      <QualityChecks analysis={analysis} />
      <ColorGreyscaleStory analysis={analysis} />
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
        title="Konteks channel RGB"
        description="Radar menunjukkan channel warna mana yang berubah sebelum value dan Delta E dihitung."
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

function histogramPath(values, width, height, max) {
  const safeValues = values || [];
  const safeMax = Math.max(max || 0, 1);
  return safeValues
    .map((value, index) => {
      const x = (index / Math.max(1, safeValues.length - 1)) * width;
      const y = height - (value / safeMax) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function normalizeHistogram(histogram, pixelCount) {
  return (histogram || []).map((value) => value / Math.max(1, pixelCount));
}

function aggregateValues(values, bucketCount = 64) {
  if (!values.length) return [];
  const bucketSize = values.length / bucketCount;
  return Array.from({ length: bucketCount }, (_, bucketIndex) => {
    const start = Math.floor(bucketIndex * bucketSize);
    const end = Math.max(start + 1, Math.floor((bucketIndex + 1) * bucketSize));
    return values.slice(start, end).reduce((sum, value) => sum + value, 0);
  });
}

function smoothValues(values) {
  return values.map((value, index) => {
    const prev = values[Math.max(0, index - 1)];
    const next = values[Math.min(values.length - 1, index + 1)];
    return (prev + value * 2 + next) / 4;
  });
}

function clippedHistogramMax(values) {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (!sorted.length) return 1;
  const p95 = sorted[Math.floor((sorted.length - 1) * 0.95)];
  return Math.max(p95, sorted[sorted.length - 1] * 0.25, 0.001);
}

function valueBandStats(imageAnalysis, channel = "value") {
  const histogram = imageAnalysis?.histogram[channel] || [];
  const total = histogram.reduce((sum, value) => sum + value, 0) || 1;
  const dark = histogram.slice(0, 86).reduce((sum, value) => sum + value, 0) / total;
  const mid = histogram.slice(86, 171).reduce((sum, value) => sum + value, 0) / total;
  const bright = histogram.slice(171).reduce((sum, value) => sum + value, 0) / total;
  return { dark, mid, bright };
}

function PercentStack({ label, stats }) {
  const segments = [
    ["Gelap", stats.dark, "#111111"],
    ["Tengah", stats.mid, "#8A8A8A"],
    ["Terang", stats.bright, "#D9D9D9"],
  ];

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-xs font-semibold text-[#555555]">
        <span>{label}</span>
        <span>
          Gelap {formatNumber(stats.dark * 100, 0)}% / Tengah {formatNumber(stats.mid * 100, 0)}% / Terang {formatNumber(stats.bright * 100, 0)}%
        </span>
      </div>
      <div className="flex h-4 overflow-hidden rounded-full border border-[#d9d9d9] bg-white">
        {segments.map(([name, value, color]) => (
          <div
            key={name}
            style={{ width: `${Math.max(0, value * 100)}%`, background: color }}
            title={`${name} ${formatNumber(value * 100, 1)}%`}
          />
        ))}
      </div>
    </div>
  );
}

function HistogramOverlay({ before, after, channel = "value", color = "#111111", afterColor = "#D97706" }) {
  const width = 720;
  const height = 220;
  const plotHeight = 168;
  const bottom = 182;
  const left = 54;
  const right = width - 16;
  const plotWidth = right - left;
  const beforePixelCount = before ? before.sampleWidth * before.sampleHeight : 1;
  const afterPixelCount = after ? after.sampleWidth * after.sampleHeight : 1;
  const beforeValues = smoothValues(aggregateValues(normalizeHistogram(before?.histogram[channel], beforePixelCount)));
  const afterValues = smoothValues(aggregateValues(normalizeHistogram(after?.histogram[channel], afterPixelCount)));
  const commonMax = clippedHistogramMax([...beforeValues, ...afterValues]);
  const beforeMean = before?.stats[channel]?.mean ?? before?.averageValue;
  const afterMean = after?.stats[channel]?.mean ?? after?.averageValue;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="block h-[220px] w-full">
      <rect width={width} height={height} rx="8" fill="#fbfbfa" />
      {[0.25, 0.5, 0.75].map((line) => (
        <line key={line} x1={left} x2={right} y1={plotHeight * line + 14} y2={plotHeight * line + 14} stroke="#e0e0e0" />
      ))}
      <line x1={left} x2={left} y1="14" y2={bottom} stroke="#111111" strokeWidth="2" />
      <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="#111111" strokeWidth="2" />
      <g transform={`translate(${left} 14)`}>
        {before ? (
          <line
            x1={(beforeMean / 255) * plotWidth}
            x2={(beforeMean / 255) * plotWidth}
            y1="0"
            y2={plotHeight}
            stroke={color}
            strokeDasharray="5 5"
            strokeWidth="2"
          />
        ) : null}
        {after ? (
          <line
            x1={(afterMean / 255) * plotWidth}
            x2={(afterMean / 255) * plotWidth}
            y1="0"
            y2={plotHeight}
            stroke={afterColor}
            strokeDasharray="5 5"
            strokeWidth="2"
          />
        ) : null}
        <path d={histogramPath(beforeValues, plotWidth, plotHeight, commonMax)} fill="none" stroke={color} strokeWidth="3" />
        <path d={histogramPath(afterValues, plotWidth, plotHeight, commonMax)} fill="none" stroke={afterColor} strokeWidth="3" />
      </g>
      <text x="24" y="98" textAnchor="middle" transform="rotate(-90 24 98)" className="fill-[#4b5563] text-xs font-bold">
        persen pixel
      </text>
      <text x={left} y="205" className="fill-[#4b5563] text-xs font-bold">0</text>
      <text x={left + plotWidth / 2} y="205" textAnchor="middle" className="fill-[#4b5563] text-xs font-bold">128</text>
      <text x={right} y="205" textAnchor="end" className="fill-[#4b5563] text-xs font-bold">255</text>
      <text x={width / 2} y="217" textAnchor="middle" className="fill-[#4b5563] text-xs font-bold">
        intensitas {channel.toUpperCase()}
      </text>
      <g>
        <rect x={width - 150} y="18" width="10" height="10" fill={color} />
        <text x={width - 134} y="27" className="fill-[#4b5563] text-[10px] font-bold">Sebelum</text>
        <rect x={width - 82} y="18" width="10" height="10" fill={afterColor} />
        <text x={width - 66} y="27" className="fill-[#4b5563] text-[10px] font-bold">Sesudah</text>
      </g>
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
  const beforeValueBands = valueBandStats(analysis?.before, "value");
  const afterValueBands = valueBandStats(analysis?.after, "value");
  const beforeMean = analysis?.before.stats.value.mean;
  const afterMean = analysis?.after.stats.value.mean;
  const beforeMedian = analysis?.before.stats.value.median;
  const afterMedian = analysis?.after.stats.value.median;

  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle title="Histogram" description="Ringkasan distribusi pixel ROI sebelum dan sesudah." tooltip={tooltips.histogram} />
        <Segmented value={mode} onChange={setMode} options={[["value", "Value"], ["rgb", "RGB"]]} />
      </div>
      {mode === "value" ? (
        <div className="mt-4 grid gap-4">
          <div className="rounded-[8px] border border-[#eeeeee] bg-[#fbfbfa] p-3">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#666666]">
              Komposisi tonal
            </div>
            <div className="grid gap-3">
              <PercentStack label="Sebelum" stats={beforeValueBands} />
              <PercentStack label="Sesudah" stats={afterValueBands} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric
              label="Mean value"
              value={analysis ? `${formatNumber(beforeMean, 1)} -> ${formatNumber(afterMean, 1)}` : "-"}
              detail={analysis ? `Delta ${formatSigned(afterMean - beforeMean, 1)}` : "rata-rata terang gelap"}
              compact
            />
            <Metric
              label="Median value"
              value={analysis ? `${formatNumber(beforeMedian, 1)} -> ${formatNumber(afterMedian, 1)}` : "-"}
              detail={analysis ? `Delta ${formatSigned(afterMedian - beforeMedian, 1)}` : "nilai tengah pixel"}
              compact
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#666666]">
              Kurva detail
            </div>
            <HistogramOverlay before={analysis?.before} after={analysis?.after} />
          </div>
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

function IsoReference({ estimatedGrade }) {
  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionTitle
          title="ISO 105-A02 visual reference"
          description="Referensi visual ilustratif untuk membaca perubahan warna."
          tooltip="Gunanya untuk membandingkan estimasi digital dengan skala visual 5 sampai 1. Chip layar ini bukan kalibrasi resmi ISO, jadi hasil akhir tetap perlu dikonfirmasi observer."
        />
        {estimatedGrade ? (
          <div className="shrink-0 rounded-full border border-[#111111] bg-[#f7f7f6] px-3 py-1 text-sm font-semibold text-[#333333]">
            Estimasi grade <strong className="text-[#111111]">{estimatedGrade}</strong>
          </div>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-9 gap-2">
        {GREY_SCALE_GRADES.map((item) => {
          const isEstimated = estimatedGrade === item.grade;

          return (
            <div
              key={item.grade}
              className={`rounded-[8px] border p-2 transition-shadow ${
                isEstimated
                  ? "border-[#111111] bg-[#f7f7f6] shadow-[0_0_0_2px_#111111]"
                  : "border-[#d2d2d2] bg-[#fbfbfa]"
              }`}
            >
              <div className="grid h-10 grid-cols-2 overflow-hidden rounded-[4px] border border-[#c9c9c9]">
                <div style={{ background: item.patches[0] }} />
                <div style={{ background: item.patches[1] }} />
              </div>
              <div className="mt-1.5 text-center">
                <div className={`text-sm font-bold leading-none ${isEstimated ? "text-[#111111]" : "text-[#444444]"}`}>
                  {item.grade}
                </div>
                <div className="mt-1 text-[9px] leading-tight text-[#888888]">
                  {item.label}
                </div>
                {isEstimated ? (
                  <div className="mt-1.5 rounded-full bg-[#111111] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                    Estimasi
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ColorValueReference() {
  const referenceExamples = COLOR_VALUE_REFERENCES.filter((item) =>
    ["Kuning", "Merah", "Biru", "Cokelat"].includes(item.name),
  );

  return (
    <div className="rounded-[8px] border border-[#dedede] bg-white p-4">
      <SectionTitle
        title="Cara warna dibaca menjadi greyscale"
        description="Value digital menjelaskan seberapa terang warna setelah dikonversi ke abu-abu."
        tooltip="Value dihitung dari luminosity RGB: 0.299R + 0.587G + 0.114B. Kuning biasanya lebih terang karena kontribusi R dan G tinggi; biru/ungu sering lebih gelap."
      />

      <div className="mt-4 grid gap-3">
        <div className="rounded-[8px] border border-[#eeeeee] bg-[#fbfbfa] p-3 text-sm leading-6 text-[#555555]">
          <strong className="text-[#111111]">Intinya:</strong> dua warna yang sama-sama terlihat kuat bisa menjadi abu-abu yang berbeda.
          Karena rumus greyscale memberi bobot paling besar ke channel G, lalu R, lalu B.
        </div>

        <div className="grid gap-2">
          {referenceExamples.map((item) => (
            <div key={item.name} className="grid grid-cols-[72px_1fr_52px] items-center gap-3 rounded-[8px] border border-[#eeeeee] bg-white p-2">
              <div className="grid h-9 grid-cols-2 overflow-hidden rounded-[6px] border border-[#d2d2d2]">
                <div style={{ background: item.hex }} />
                <div style={{ background: item.grey }} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#111111]">{item.name}</div>
                <div className="h-2 overflow-hidden rounded-full bg-[#eeeeee]">
                  <div className="h-full rounded-full bg-[#111111]" style={{ width: `${(item.value / 255) * 100}%` }} />
                </div>
              </div>
              <div className="text-right text-sm font-semibold text-[#111111]">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[8px] border border-[#eeeeee] bg-white p-3 text-xs leading-5 text-[#666666]">
          Bagian ini hanya referensi konversi warna ke value greyscale. Untuk keputusan before/after, tetap baca ROI, RGB delta, value histogram, Delta E, dan grade observer.
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

function PreviewGrid({ before, after, greyscaleBefore, greyscaleAfter, beforeRoi, afterRoi, compact = false }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <PhotoTile title="Sebelum pencucian" subtitle="Original ROI" src={before?.url} roi={beforeRoi} compact={compact} />
      <PhotoTile title="Sebelum pencucian" subtitle="Greyscale ROI" src={greyscaleBefore?.dataUrl} roi={beforeRoi} compact={compact} />
      <PhotoTile title="Sesudah pencucian" subtitle="Original ROI" src={after?.url} roi={afterRoi} compact={compact} />
      <PhotoTile title="Sesudah pencucian" subtitle="Greyscale ROI" src={greyscaleAfter?.dataUrl} roi={afterRoi} compact={compact} />
    </div>
  );
}

function WorkspaceObserver({
  before,
  after,
  greyscaleBefore,
  greyscaleAfter,
  analysis,
  beforeRoi,
  afterRoi,
  observer,
  onObserverChange,
}) {
  return (
    <div className="grid gap-6">
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
            beforeRoi={beforeRoi}
            afterRoi={afterRoi}
          />
        </div>
      </div>

      {/* 2. ISO reference — horizontal, di bawah foto */}
      <IsoReference estimatedGrade={analysis?.estimatedGrade} />

      <GradeExplanation analysis={analysis} />

      {/* 3. Visual result dashboard */}
      <VisualResultDashboard analysis={analysis} />

      <ObserverForm value={observer} onChange={onObserverChange} />
    </div>
  );
}

function AdvancedMetrics({ analysis, referenceMode }) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
        <RgbChangePanel analysis={analysis} />
        <HistogramPanel analysis={analysis} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,62%)_minmax(0,38%)] xl:items-start">
        <ChangeMatrix analysis={analysis} />
        <div className="grid content-start gap-6">
          {referenceMode === "iso" ? <IsoReference estimatedGrade={analysis?.estimatedGrade} /> : <ColorValueReference />}
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
  beforeRoi,
  afterRoi,
  onBeforeRoiChange,
  onAfterRoiChange,
  selectionDirty,
  onUpdateBeforeSelection,
  onUpdateAfterSelection,
  onRefreshAnalysis,
  observer,
  onObserverChange,
  isAnalysing,
  error,
}) {
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
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button className="h-10 min-h-10 rounded-full px-3" variant="secondary" onClick={onUpdateBeforeSelection}>
              <Crop className="h-4 w-4" aria-hidden="true" />
              Update selection sebelum
            </Button>
            <Button className="h-10 min-h-10 rounded-full px-3" variant="secondary" onClick={onUpdateAfterSelection}>
              <Crop className="h-4 w-4" aria-hidden="true" />
              Update selection sesudah
            </Button>
            <Button className="h-10 min-h-10 rounded-full px-3" onClick={onRefreshAnalysis} disabled={!selectionDirty || isAnalysing}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {selectionDirty ? "Perbarui analisis" : "Analisis terbaru"}
            </Button>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-[#777777] sm:inline">
              Expand
            </span>
            <Button className="h-11 min-h-11 rounded-full px-3" variant="secondary" onClick={() => setIsOpen(true)} disabled={!ready} aria-label="Buka fullscreen Analysis Greyscale">
              <Maximize2 className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {selectionDirty ? (
          <div className="mt-4 rounded-[8px] border border-[#fed7aa] bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#9a3412]">
            Area selection sudah diubah. Klik Perbarui analisis untuk menghitung ulang data dan grafik.
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm font-semibold text-[#DC2626]">{error}</p> : null}

        <div className="mt-6">
          <WorkspaceObserver
            before={before}
            after={after}
            greyscaleBefore={greyscaleBefore}
            greyscaleAfter={greyscaleAfter}
            analysis={analysis}
            beforeRoi={beforeRoi}
            afterRoi={afterRoi}
            onBeforeRoiChange={onBeforeRoiChange}
            onAfterRoiChange={onAfterRoiChange}
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
          beforeRoi={beforeRoi}
          afterRoi={afterRoi}
          onBeforeRoiChange={onBeforeRoiChange}
          onAfterRoiChange={onAfterRoiChange}
          isAnalysing={isAnalysing}
          error={error}
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
  beforeRoi,
  afterRoi,
  onBeforeRoiChange,
  onAfterRoiChange,
  isAnalysing,
  error,
  referenceMode,
  setReferenceMode,
  observer,
  onObserverChange,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("workspace");

  const boardStyle = {
    width: FULLSCREEN_BOARD_WIDTH,
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
            Scroll canvas untuk eksplorasi dan membaca chart serta matrix secara detail.
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
          <Button className="h-9 min-h-9 rounded-full px-3" variant="secondary" onClick={onClose} aria-label="Tutup fullscreen">
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          </Button>
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
          beforeRoi={beforeRoi}
          afterRoi={afterRoi}
          onBeforeRoiChange={onBeforeRoiChange}
          onAfterRoiChange={onAfterRoiChange}
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
  beforeRoi,
  afterRoi,
  onBeforeRoiChange,
  onAfterRoiChange,
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
          beforeRoi={beforeRoi}
          afterRoi={afterRoi}
          onBeforeRoiChange={onBeforeRoiChange}
          onAfterRoiChange={onAfterRoiChange}
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
