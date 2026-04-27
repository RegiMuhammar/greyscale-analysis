import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { AnalysisCanvas } from "./components/AnalysisCanvas";
import { AppHeader } from "./components/AppHeader";
import { DownloadButtons } from "./components/DownloadButtons";
import { QualityNotice } from "./components/QualityNotice";
import { RoiCropModal } from "./components/RoiSelector";
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

const initialRoi = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };
const fullRoi = { x: 0, y: 0, width: 1, height: 1 };

export default function App() {
  const beforeUpload = useImageUpload();
  const afterUpload = useImageUpload();
  const beforeGreyscale = useGreyscale(beforeUpload.image?.file);
  const afterGreyscale = useGreyscale(afterUpload.image?.file);
  const [beforeRoi, setBeforeRoi] = useState(initialRoi);
  const [afterRoi, setAfterRoi] = useState(initialRoi);
  const [appliedBeforeRoi, setAppliedBeforeRoi] = useState(initialRoi);
  const [appliedAfterRoi, setAppliedAfterRoi] = useState(initialRoi);
  const [beforeRoiConfirmed, setBeforeRoiConfirmed] = useState(false);
  const [afterRoiConfirmed, setAfterRoiConfirmed] = useState(false);
  const [selectionDirty, setSelectionDirty] = useState(false);
  const [cropTarget, setCropTarget] = useState(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const colorAnalysis = useColorAnalysis(
    analysisStarted ? beforeUpload.image?.url : null,
    analysisStarted ? afterUpload.image?.url : null,
    appliedBeforeRoi,
    appliedAfterRoi,
  );
  const [observer, setObserver] = useState(initialObserver);

  const hasAnyData = Boolean(
    beforeUpload.image || afterUpload.image || observer.name || observer.grade || observer.notes,
  );
  const photosReady = Boolean(beforeUpload.image && afterUpload.image);
  const analysisReady = photosReady && beforeRoiConfirmed && afterRoiConfirmed;

  const flowStatus = useMemo(() => {
    if (!beforeUpload.image && !afterUpload.image) return "Upload dua foto untuk memulai.";
    if (!beforeUpload.image || !afterUpload.image) return "Lengkapi foto sebelum dan sesudah pencucian.";
    if (!beforeRoiConfirmed || !afterRoiConfirmed) return "Tetapkan area kain untuk kedua foto sebelum analisis.";
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
    afterRoiConfirmed,
    beforeGreyscale.isProcessing,
    beforeGreyscale.result,
    beforeUpload.image,
    beforeRoiConfirmed,
    colorAnalysis.analysis,
    colorAnalysis.isAnalysing,
  ]);

  const resetAll = () => {
    beforeUpload.reset();
    afterUpload.reset();
    setBeforeRoi(initialRoi);
    setAfterRoi(initialRoi);
    setAppliedBeforeRoi(initialRoi);
    setAppliedAfterRoi(initialRoi);
    setBeforeRoiConfirmed(false);
    setAfterRoiConfirmed(false);
    setSelectionDirty(false);
    setCropTarget(null);
    setObserver(initialObserver);
    setAnalysisStarted(false);
  };

  const setBeforeFile = (file) => {
    setAnalysisStarted(false);
    setBeforeRoi(initialRoi);
    setAppliedBeforeRoi(initialRoi);
    setBeforeRoiConfirmed(false);
    setSelectionDirty(false);
    if (beforeUpload.setFile(file)) setCropTarget("before");
  };

  const setAfterFile = (file) => {
    setAnalysisStarted(false);
    setAfterRoi(initialRoi);
    setAppliedAfterRoi(initialRoi);
    setAfterRoiConfirmed(false);
    setSelectionDirty(false);
    if (afterUpload.setFile(file)) setCropTarget("after");
  };

  const confirmCrop = () => {
    if (cropTarget === "before") setBeforeRoiConfirmed(true);
    if (cropTarget === "after") setAfterRoiConfirmed(true);
    if (analysisStarted) setSelectionDirty(true);
    setCropTarget(null);
  };

  const useFullPhotoForCrop = () => {
    if (cropTarget === "before") {
      setBeforeRoi(fullRoi);
      setBeforeRoiConfirmed(true);
    }
    if (cropTarget === "after") {
      setAfterRoi(fullRoi);
      setAfterRoiConfirmed(true);
    }
    if (analysisStarted) setSelectionDirty(true);
    setCropTarget(null);
  };

  const runAnalysis = () => {
    setAppliedBeforeRoi({ ...beforeRoi });
    setAppliedAfterRoi({ ...afterRoi });
    setSelectionDirty(false);
    setAnalysisStarted(true);
    window.setTimeout(() => {
      document.getElementById("analysis-canvas-heading")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <div className="app-shell min-h-screen">
      <AppHeader />

      <main id="workspace" className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#666666]">
              Grey scale textile test
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-[#0a0a0a] sm:text-5xl lg:text-6xl">
              Analisis kelunturan warna kain
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#555555] sm:text-lg">
              Upload foto sebelum dan sesudah pencucian, lihat nilai greyscale masing-masing foto,
              lalu baca ringkasan perbedaannya lewat chart visual.
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
              roi={beforeRoi}
              roiConfirmed={beforeRoiConfirmed}
              onEditArea={() => setCropTarget("before")}
              onReset={() => {
                setAnalysisStarted(false);
                setBeforeRoi(initialRoi);
                setAppliedBeforeRoi(initialRoi);
                setBeforeRoiConfirmed(false);
                setSelectionDirty(false);
                beforeUpload.reset();
              }}
            />
            <UploadZone
              title="Sesudah pencucian"
              description="Foto sampel kain sesudah proses pencucian."
              image={afterUpload.image}
              error={afterUpload.error}
              onFile={setAfterFile}
              roi={afterRoi}
              roiConfirmed={afterRoiConfirmed}
              onEditArea={() => setCropTarget("after")}
              onReset={() => {
                setAnalysisStarted(false);
                setAfterRoi(initialRoi);
                setAppliedAfterRoi(initialRoi);
                setAfterRoiConfirmed(false);
                setSelectionDirty(false);
                afterUpload.reset();
              }}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-[#eeeeee] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-[#666666]">
              Setelah kedua foto masuk, jalankan konversi dan tampilkan nilai greyscale serta chart perbandingan.
            </p>
            <Button
              className="rounded-full px-6"
              disabled={!analysisReady}
              onClick={runAnalysis}
            >
              Analisis Greyscale
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
              beforeRoi={appliedBeforeRoi}
              afterRoi={appliedAfterRoi}
              onBeforeRoiChange={setBeforeRoi}
              onAfterRoiChange={setAfterRoi}
              selectionDirty={selectionDirty}
              onUpdateBeforeSelection={() => setCropTarget("before")}
              onUpdateAfterSelection={() => setCropTarget("after")}
              onRefreshAnalysis={runAnalysis}
              observer={observer}
              onObserverChange={setObserver}
              isAnalysing={
                colorAnalysis.isAnalysing ||
                beforeGreyscale.isProcessing ||
                afterGreyscale.isProcessing
              }
              error={colorAnalysis.error || beforeGreyscale.error || afterGreyscale.error}
            />

            <DownloadButtons
              before={beforeUpload.image}
              after={afterUpload.image}
              greyscaleBefore={beforeGreyscale.result}
              greyscaleAfter={afterGreyscale.result}
              analysis={colorAnalysis.analysis}
              observer={observer}
            />
          </>
        ) : null}

        <QualityNotice />
      </main>

      <RoiCropModal
        title={cropTarget === "before" ? "Pilih area kain - sebelum pencucian" : "Pilih area kain - sesudah pencucian"}
        image={cropTarget === "before" ? beforeUpload.image : cropTarget === "after" ? afterUpload.image : null}
        roi={cropTarget === "before" ? beforeRoi : afterRoi}
        onChange={cropTarget === "before" ? setBeforeRoi : setAfterRoi}
        onConfirm={confirmCrop}
        onCancel={() => setCropTarget(null)}
        onUseFull={useFullPhotoForCrop}
      />
    </div>
  );
}
