import { Download, FileImage, FileText } from "lucide-react";
import { useState } from "react";
import { createAnalysisReportPdf, createCompositePng, downloadDataUrl } from "../utils/download";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function DownloadButtons({ before, after, greyscaleBefore, greyscaleAfter, analysis, observer }) {
  const [isComposing, setIsComposing] = useState(false);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const outputsReady = Boolean(before?.url && after?.url && greyscaleBefore?.dataUrl && greyscaleAfter?.dataUrl);
  const reportReady = outputsReady && Boolean(analysis);
  const selectedGrade = observer.grade || "Belum dipilih";

  const downloadComposite = async () => {
    if (!outputsReady) return;
    setIsComposing(true);
    try {
      const dataUrl = await createCompositePng({
        originalBefore: before.url,
        greyscaleBefore: greyscaleBefore.dataUrl,
        originalAfter: after.url,
        greyscaleAfter: greyscaleAfter.dataUrl,
        observer,
      });
      downloadDataUrl(dataUrl, "komposit_greyscale.png");
    } finally {
      setIsComposing(false);
    }
  };

  const downloadAnalysisReport = async () => {
    if (!reportReady) return;
    setIsCreatingReport(true);
    try {
      await createAnalysisReportPdf({
        originalBefore: before.url,
        originalAfter: after.url,
        greyscaleBefore: greyscaleBefore.dataUrl,
        greyscaleAfter: greyscaleAfter.dataUrl,
        analysis,
        observer,
      });
    } finally {
      setIsCreatingReport(false);
    }
  };

  return (
    <section className="research-panel p-4 sm:p-5" aria-labelledby="download-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="download-heading" className="text-lg font-semibold text-[#111827]">
            Download output
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#667085]">
            Unduh PNG greyscale, komposit, atau PDF report analisis dengan data dan grafik.
          </p>
        </div>
        <Badge tone={observer.grade ? "success" : "warning"}>Grade: {selectedGrade}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Button
          className="w-full"
          disabled={!greyscaleBefore?.dataUrl}
          onClick={() => downloadDataUrl(greyscaleBefore.dataUrl, "greyscale_sebelum.png")}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download greyscale sebelum
        </Button>
        <Button
          className="w-full"
          disabled={!greyscaleAfter?.dataUrl}
          onClick={() => downloadDataUrl(greyscaleAfter.dataUrl, "greyscale_sesudah.png")}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download greyscale sesudah
        </Button>
        <Button className="w-full" disabled={!outputsReady || isComposing} onClick={downloadComposite}>
          <FileImage className="h-4 w-4" aria-hidden="true" />
          {isComposing ? "Membuat komposit..." : "Download komposit"}
        </Button>
        <Button className="w-full" disabled={!reportReady || isCreatingReport} onClick={downloadAnalysisReport}>
          <FileText className="h-4 w-4" aria-hidden="true" />
          {isCreatingReport ? "Membuat report..." : "Export analisis PDF"}
        </Button>
      </div>
    </section>
  );
}
