import { Loader2 } from "lucide-react";

function Figure({ title, subtitle, src, isLoading, error }) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 flex min-h-10 flex-col justify-end">
        <span className="text-sm font-semibold text-[#111827]">{title}</span>
        <span className="text-xs font-medium text-[#667085]">{subtitle}</span>
      </figcaption>
      <div className="figure-frame flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[8px]">
        {src ? (
          <img src={src} alt={title} className="h-full w-full object-contain" />
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-[#667085]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Mengkonversi...
          </div>
        ) : (
          <p className="px-4 text-center text-sm text-[#98A2B3]">
            {error || "Preview akan muncul setelah foto diupload."}
          </p>
        )}
      </div>
    </figure>
  );
}

export function PreviewPanel({ before, after, greyscaleBefore, greyscaleAfter }) {
  return (
    <section className="research-panel p-4 sm:p-5" aria-labelledby="preview-heading">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="preview-heading" className="text-lg font-semibold text-[#111827]">
            Preview 4-panel
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#667085]">
            Bandingkan foto asli dan hasil greyscale dengan aspect ratio tetap.
          </p>
        </div>
        {(greyscaleBefore.isProcessing || greyscaleAfter.isProcessing) && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Mengkonversi...
          </span>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Figure
          title="Foto asli sebelum"
          subtitle="Sebelum pencucian"
          src={before?.url}
        />
        <Figure
          title="Greyscale sebelum"
          subtitle="Luminosity method"
          src={greyscaleBefore.result?.dataUrl}
          isLoading={greyscaleBefore.isProcessing}
          error={greyscaleBefore.error}
        />
        <Figure
          title="Foto asli sesudah"
          subtitle="Sesudah pencucian"
          src={after?.url}
        />
        <Figure
          title="Greyscale sesudah"
          subtitle="Luminosity method"
          src={greyscaleAfter.result?.dataUrl}
          isLoading={greyscaleAfter.isProcessing}
          error={greyscaleAfter.error}
        />
      </div>
    </section>
  );
}
