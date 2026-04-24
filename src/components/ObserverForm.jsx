import { GREY_SCALE_GRADES } from "../constants/greyScaleChart";

export function ObserverForm({ value, onChange }) {
  const update = (field, nextValue) => {
    onChange({ ...value, [field]: nextValue });
  };

  return (
    <section className="research-panel p-4 sm:p-5" aria-labelledby="observer-heading">
      <div className="mb-4">
        <h2 id="observer-heading" className="text-lg font-semibold text-[#111827]">
          Input observer
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#667085]">
          Catat grade visual dan keterangan untuk dokumentasi penelitian.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-[#344054]">Nama observer</span>
          <input
            className="focus-ring mt-2 h-11 w-full rounded-[8px] border border-[#D9DEE7] bg-white px-3 text-sm text-[#111827]"
            value={value.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Contoh: Observer 1"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-[#344054]">Grade observer</span>
          <select
            className="focus-ring mt-2 h-11 w-full rounded-[8px] border border-[#D9DEE7] bg-white px-3 text-sm font-medium text-[#111827]"
            value={value.grade}
            onChange={(event) => update("grade", event.target.value)}
          >
            <option value="">Pilih grade</option>
            {GREY_SCALE_GRADES.map((grade) => (
              <option key={grade.grade} value={grade.grade}>
                {grade.grade} - {grade.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-semibold text-[#344054]">Catatan observer</span>
          <textarea
            className="focus-ring mt-2 min-h-28 w-full resize-y rounded-[8px] border border-[#D9DEE7] bg-white px-3 py-2 text-sm leading-6 text-[#111827]"
            value={value.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Tulis catatan perubahan value, kontras, atau kondisi pencahayaan foto."
          />
        </label>
      </div>
    </section>
  );
}
