import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { AnalysisCanvas } from "./components/AnalysisCanvas";
import { AppHeader } from "./components/AppHeader";
import { DownloadButtons } from "./components/DownloadButtons";
import { ObserverForm } from "./components/ObserverForm";
import { QualityNotice } from "./components/QualityNotice";
import { UploadZone } from "./components/UploadZone";
import { Button } from "./components/ui/button";
import { useColorAnalysis } from "./hooks/useColorAnalysis";
import { useGreyscale } from "./hooks/useGreyscale";
import { useImageUpload } from "./hooks/useImageUpload";

const initialObserver = {
  name: "",
  grade: "",
  notes: "",
};

export default function App() {
  const beforeUpload = useImageUpload();
  const afterUpload = useImageUpload();
  const beforeGreyscale = useGreyscale(beforeUpload.image?.file);
  const afterGreyscale = useGreyscale(afterUpload.image?.file);
  const colorAnalysis = useColorAnalysis(beforeUpload.image?.url, afterUpload.image?.url);
  const [observer, setObserver] = useState(initialObserver);
  const [analysisStarted, setAnalysisStarted] = useState(false);

  const hasAnyData = Boolean(
    beforeUpload.image || afterUpload.image || observer.name || observer.grade || observer.notes,
  );
  const photosReady = Boolean(beforeUpload.image && afterUpload.image);

  const flowStatus = useMemo(() => {
    if (!beforeUpload.image && !afterUpload.image) return "Upload dua foto untuk memulai.";
    if (!beforeUpload.image || !afterUpload.image) return "Lengkapi foto sebelum dan sesudah pencucian.";
    if (beforeGreyscale.isProcessing || afterGreyscale.isProcessing || colorAnalysis.isAnalysing) {
      return "Mengkonversi dan menganalisis perubahan warna.";
    }
    if (beforeGreyscale.result && afterGreyscale.result && colorAnalysis.analysis) {
      return "Analisis siap dibandingkan dan diunduh.";
    }
    return "Menunggu hasil konversi.";
  }, [
    afterGreyscale.isProcessing,
    afterGreyscale.result,
    afterUpload.image,
    beforeGreyscale.isProcessing,
    beforeGreyscale.result,
    beforeUpload.image,
    colorAnalysis.analysis,
    colorAnalysis.isAnalysing,
  ]);

  const resetAll = () => {
    beforeUpload.reset();
    afterUpload.reset();
    setObserver(initialObserver);
    setAnalysisStarted(false);
  };

  const setBeforeFile = (file) => {
    setAnalysisStarted(false);
    beforeUpload.setFile(file);
  };

  const setAfterFile = (file) => {
    setAnalysisStarted(false);
    afterUpload.setFile(file);
  };

  return (
    <div className="app-shell min-h-screen">
      <AppHeader />

      <main id="workspace" className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#666666]">
              Textile colour lab
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-[#0a0a0a] sm:text-5xl lg:text-6xl">
              Fabric colour shift analyser
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#555555] sm:text-lg">
              Upload foto sampel sebelum dan sesudah pencucian, lalu baca perubahan warna lewat
              RGB, value, LAB, Delta E, histogram, dan matrix perubahan.
            </p>
          </div>
        </section>

        <section className="research-panel p-5 sm:p-6" aria-label="Upload foto sampel">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-[#111111]">Input foto sampel</h2>
              <div className="mt-3 flex flex-col gap-2 text-sm leading-6 text-[#555555] sm:flex-row sm:flex-wrap sm:gap-x-5">
                <span><strong className="text-[#111111]">Status:</strong> {flowStatus}</span>
                <span><strong className="text-[#111111]">Output:</strong> analisis lokal aktif setelah dua foto diinput.</span>
              </div>
            </div>
            <Button className="shrink-0 rounded-full px-5" variant="secondary" onClick={resetAll} disabled={!hasAnyData}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </Button>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <UploadZone
              title="Sebelum pencucian"
              description="Foto sampel kain sebelum proses pencucian."
              image={beforeUpload.image}
              error={beforeUpload.error}
              onFile={setBeforeFile}
              onReset={() => {
                setAnalysisStarted(false);
                beforeUpload.reset();
              }}
            />
            <UploadZone
              title="Sesudah pencucian"
              description="Foto sampel kain sesudah proses pencucian."
              image={afterUpload.image}
              error={afterUpload.error}
              onFile={setAfterFile}
              onReset={() => {
                setAnalysisStarted(false);
                afterUpload.reset();
              }}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-[#eeeeee] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-[#666666]">
              Setelah kedua foto masuk, jalankan konversi dan tampilkan panel analisis greyscale.
            </p>
            <Button
              className="rounded-full px-6"
              disabled={!photosReady}
              onClick={() => {
                setAnalysisStarted(true);
                window.setTimeout(() => {
                  document.getElementById("analysis-canvas-heading")?.scrollIntoView({ behavior: "smooth" });
                }, 50);
              }}
            >
              Convert & Analysis Greyscale
            </Button>
          </div>
        </section>

        {analysisStarted ? (
          <>
            <AnalysisCanvas
              before={beforeUpload.image}
              after={afterUpload.image}
              greyscaleBefore={beforeGreyscale.result}
              greyscaleAfter={afterGreyscale.result}
              analysis={colorAnalysis.analysis}
              isAnalysing={
                colorAnalysis.isAnalysing ||
                beforeGreyscale.isProcessing ||
                afterGreyscale.isProcessing
              }
              error={colorAnalysis.error || beforeGreyscale.error || afterGreyscale.error}
            />

            <ObserverForm value={observer} onChange={setObserver} />

            <DownloadButtons
              before={beforeUpload.image}
              after={afterUpload.image}
              greyscaleBefore={beforeGreyscale.result}
              greyscaleAfter={afterGreyscale.result}
              observer={observer}
            />
          </>
        ) : null}

        <QualityNotice />
      </main>
    </div>
  );
}
