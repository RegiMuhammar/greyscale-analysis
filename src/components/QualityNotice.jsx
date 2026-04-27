import { AlertTriangle, ShieldCheck } from "lucide-react";

export function QualityNotice() {
  return (
    <section className="research-panel px-4 py-4 sm:px-5" aria-label="Catatan kualitas">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex min-w-0 gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-[#16A34A]" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#111827]">Pemrosesan lokal</h2>
            <p className="mt-1 text-sm leading-6 text-[#667085]">
              Foto dikonversi di browser menggunakan Canvas API. Tidak ada file yang dikirim ke
              server.
            </p>
          </div>
        </div>
        <div className="flex min-w-0 gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-[#D97706]" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#111827]">Bukan kalibrasi resmi</h2>
            <p className="mt-1 text-sm leading-6 text-[#667085]">
              Chart ISO 105-A02 adalah referensi visual untuk membaca perubahan warna. Penilaian
              akhir tetap dilakukan oleh observer.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
