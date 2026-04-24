import { COLOR_VALUE_REFERENCES } from "../constants/greyScaleChart";

export function ColorValueChart() {
  return (
    <section className="research-panel p-4 sm:p-5" aria-labelledby="color-value-heading">
      <div className="mb-4">
        <h2 id="color-value-heading" className="text-lg font-semibold text-[#111827]">
          Color value chart
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#667085]">
          Referensi ini memperlihatkan hubungan hue warna dengan nilai greyscale digital
          berdasarkan formula luminosity yang dipakai aplikasi.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[620px] grid-cols-[110px_repeat(9,minmax(42px,1fr))] border border-[#D9DEE7] text-center text-xs font-semibold text-[#344054]">
            <div className="border-b border-r border-[#D9DEE7] bg-[#F8FAFC] px-3 py-2 text-left">
              Hue
            </div>
            {COLOR_VALUE_REFERENCES.map((item) => (
              <div key={item.name} className="border-b border-r border-[#D9DEE7] px-2 py-2 last:border-r-0">
                {item.name}
              </div>
            ))}

            <div className="border-r border-b border-[#D9DEE7] bg-[#F8FAFC] px-3 py-2 text-left">
              Warna
            </div>
            {COLOR_VALUE_REFERENCES.map((item) => (
              <div key={`${item.name}-color`} className="border-r border-b border-[#D9DEE7] p-2 last:border-r-0">
                <div
                  className="h-12 rounded-[6px] border border-[#D9DEE7]"
                  style={{ background: item.hex }}
                  aria-label={`${item.name} ${item.hex}`}
                />
              </div>
            ))}

            <div className="border-r border-b border-[#D9DEE7] bg-[#F8FAFC] px-3 py-2 text-left">
              Greyscale
            </div>
            {COLOR_VALUE_REFERENCES.map((item) => (
              <div key={`${item.name}-grey`} className="border-r border-b border-[#D9DEE7] p-2 last:border-r-0">
                <div
                  className="h-12 rounded-[6px] border border-[#D9DEE7]"
                  style={{ background: item.grey }}
                  aria-label={`Greyscale ${item.name} value ${item.value}`}
                />
              </div>
            ))}

            <div className="border-r border-[#D9DEE7] bg-[#F8FAFC] px-3 py-2 text-left">
              Value
            </div>
            {COLOR_VALUE_REFERENCES.map((item) => (
              <div key={`${item.name}-value`} className="border-r border-[#D9DEE7] px-2 py-2 last:border-r-0">
                {item.value}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#D9DEE7] bg-[#F8FAFC] p-3">
          <p className="text-sm font-semibold text-[#111827]">Cara baca</p>
          <p className="mt-2 text-sm leading-6 text-[#667085]">
            Value 0 berarti hitam dan 255 berarti putih. Nilai dihitung dari RGB foto dengan
            rumus 0.299R + 0.587G + 0.114B, jadi warna terang seperti kuning menghasilkan abu-abu
            lebih muda dibanding biru atau ungu.
          </p>
        </div>
      </div>
    </section>
  );
}
