import sampleAfter from "../assets/samples/sample-sesudah.jpeg";
import sampleBefore from "../assets/samples/sample-sebelum.jpeg";
import { GREY_SCALE_GRADES } from "../constants/greyScaleChart";
import { WORKSPACE_HASH } from "../routes";
import { formatSigned } from "../utils/colorAnalysis";

export const SAMPLE_BEFORE = sampleBefore;
export const SAMPLE_AFTER = sampleAfter;
// Module-level so the analysis hook sees a stable reference and runs once.
export const DEMO_ROI = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };

// Mirrors estimateGrade() in utils/colorAnalysis.js.
const DELTA_E_RANGES = {
  5: "≤ 0.8",
  "4-5": "≤ 1.7",
  4: "≤ 2.5",
  "3-4": "≤ 3.4",
  3: "≤ 6.8",
  "2-3": "≤ 9",
  2: "≤ 12",
  "1-2": "≤ 16",
  1: "> 16",
};

export const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950";

function RoiPhoto({ src, label }) {
  return (
    <figure className="min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] bg-neutral-100">
        <img src={src} alt={`Foto sampel kain ${label.toLowerCase()} pencucian`} className="h-full w-full object-cover" />
        <div
          aria-hidden="true"
          className="absolute border-2 border-dashed border-neutral-950"
          style={{
            left: `${DEMO_ROI.x * 100}%`,
            top: `${DEMO_ROI.y * 100}%`,
            width: `${DEMO_ROI.width * 100}%`,
            height: `${DEMO_ROI.height * 100}%`,
            boxShadow: "0 0 0 999px rgba(255, 255, 255, 0.55)",
          }}
        />
      </div>
      <figcaption className="mt-2 text-xs font-medium text-neutral-600">{label}</figcaption>
    </figure>
  );
}

function Reading({ label, value, mono = true }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-neutral-200 py-2.5">
      <dt className="text-xs text-neutral-600">{label}</dt>
      <dd className={`${mono ? "font-mono tabular-nums" : ""} text-sm text-neutral-950`}>{value}</dd>
    </div>
  );
}

export function DemoCard({ analysis, isAnalysing, error }) {
  const ready = Boolean(analysis) && !isAnalysing;
  const pending = "...";

  return (
    <div className="relative z-[1] w-full max-w-[760px] rounded-[12px] bg-white p-4 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.12),0px_4px_6px_-2px_rgba(0,0,0,0.1),0px_12px_24px_-6px_rgba(0,0,0,0.14)] sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="text-sm font-medium text-neutral-950">Contoh: kain katun putih, sebelum dan sesudah dicuci</p>
        <p className="text-xs text-neutral-600">Dihitung dari dua foto ini saat halaman dibuka</p>
      </div>

      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
        <RoiPhoto src={SAMPLE_BEFORE} label="Sebelum" />
        <RoiPhoto src={SAMPLE_AFTER} label="Sesudah" />

        <div className="flex min-w-0 flex-col" aria-live="polite" aria-busy={isAnalysing}>
          {error ? (
            <div className="rounded-[8px] border border-neutral-200 p-4">
              <p className="text-sm font-medium text-neutral-950">Foto contoh gagal dihitung.</p>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Workspace tetap bisa dipakai dengan foto Anda sendiri.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-600">Estimasi grade</p>
              <p className="mt-1 font-display text-[56px] font-medium leading-none tracking-[-1px] text-[#C2410C]">
                {ready ? analysis.estimatedGrade : pending}
              </p>
              <p className="mt-2 text-sm text-neutral-950">
                {ready ? analysis.gradeDescription : "Menghitung warna rata-rata area kain..."}
              </p>

              <dl className="mt-4">
                <Reading label="Delta E CIE76" value={ready ? analysis.deltaE.toFixed(2) : pending} />
                <Reading label="Selisih L* (terang)" value={ready ? formatSigned(analysis.delta.lab.l, 2) : pending} />
                <Reading label="Selisih a* (merah)" value={ready ? formatSigned(analysis.delta.lab.a, 2) : pending} />
                <Reading label="Selisih b* (kuning)" value={ready ? formatSigned(analysis.delta.lab.b, 2) : pending} />
              </dl>
            </>
          )}

          <a
            href={WORKSPACE_HASH}
            className={`mt-auto inline-flex h-11 items-center justify-center rounded-[8px] border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-950 hover:bg-neutral-50 max-md:mt-4 ${focusRing}`}
          >
            Coba dengan foto Anda
          </a>
        </div>
      </div>
    </div>
  );
}

export function PatchPair({ patches, size = "h-8 w-8" }) {
  return (
    <span className="inline-flex border border-neutral-300" aria-hidden="true">
      <span className={size} style={{ background: patches[0] }} />
      <span className={size} style={{ background: patches[1] }} />
    </span>
  );
}

export function ScaleStrip({ activeGrade }) {
  return (
    <ol className="grid grid-cols-3 gap-px overflow-hidden rounded-[12px] border border-neutral-200 bg-neutral-200 sm:grid-cols-5 lg:grid-cols-9">
      {GREY_SCALE_GRADES.map((item) => {
        const active = item.grade === activeGrade;
        return (
          <li
            key={item.grade}
            className={`flex flex-col items-start gap-3 bg-white p-3 sm:p-4 ${active ? "outline-2 -outline-offset-2 outline-neutral-950" : ""}`}
          >
            <PatchPair patches={item.patches} />
            <div>
              <p className="font-display text-xl font-medium leading-none text-neutral-950">{item.grade}</p>
              <p className="mt-1.5 font-mono text-xs tabular-nums text-neutral-600">ΔE {DELTA_E_RANGES[item.grade]}</p>
              {active ? <p className="mt-1.5 text-xs font-medium text-neutral-950">Hasil contoh</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
