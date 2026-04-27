import { GREY_SCALE_GRADES } from "../constants/greyScaleChart";

export function GreyscaleChart() {
  return (
    <section className="research-panel p-4 sm:p-5" aria-labelledby="chart-heading">
      <div className="mb-4">
        <h2 id="chart-heading" className="text-lg font-semibold text-[#111827]">
          Referensi ISO 105-A02
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#667085]">
          Paired grey patches berikut membantu observer membaca estimasi perubahan warna terhadap
          skala 5 sampai 1. Ini referensi visual ilustratif, bukan chip kalibrasi resmi.
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[760px] grid-cols-9 gap-2">
          {GREY_SCALE_GRADES.map((item) => (
            <div
              key={item.grade}
              className="rounded-[8px] border border-[#D9DEE7] bg-white p-2"
            >
              <div className="grid h-16 grid-cols-2 overflow-hidden rounded-[6px] border border-[#D9DEE7]">
                <div style={{ background: item.patches[0] }} />
                <div style={{ background: item.patches[1] }} />
              </div>
              <div className="mt-2 text-center">
                <div className="text-base font-bold text-[#111827]">{item.grade}</div>
                <p className="mt-1 min-h-12 text-[11px] leading-4 text-[#667085]">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
