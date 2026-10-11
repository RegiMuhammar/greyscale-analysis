import { CheckCircle2, Crop, ImagePlus, RefreshCw, ScanLine, Upload, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useCroppedPreview } from "../hooks/useCroppedPreview";
import { formatBytes } from "../utils/image";
import { Button } from "./ui/button";

export function UploadZone({ title, description, image, error, onFile, onReset, roi, roiConfirmed = false, onEditArea }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const croppedPreview = useCroppedPreview(image?.url, roi, 420);

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const [file] = event.dataTransfer.files;
    if (file) onFile(file);
  };

  const dropEvents = {
    onDragOver: (event) => {
      event.preventDefault();
      setIsDragging(true);
    },
    onDragLeave: () => setIsDragging(false),
    onDrop: handleDrop,
  };

  const openFileDialog = () => inputRef.current?.click();

  return (
    <div className="research-panel overflow-hidden">
      <div className="border-b border-neutral-200 px-4 py-3 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
            <p className="mt-1 text-sm text-neutral-600">{description}</p>
          </div>
          {image ? (
            <Button
              aria-label={`Hapus ${title}`}
              className="h-9 min-h-9 px-2.5"
              variant="ghost"
              onClick={onReset}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        className="sr-only"
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={(event) => {
          const [file] = event.target.files;
          if (file) onFile(file);
          event.target.value = "";
        }}
      />

      <div
        {...dropEvents}
        className={[
          "block p-4 transition-colors sm:p-5",
          isDragging ? "bg-neutral-100" : "bg-white hover:bg-neutral-50",
        ].join(" ")}
      >
        {image ? (
          <div className="grid gap-4 sm:grid-cols-[132px_1fr] sm:items-center">
            <div className="figure-frame aspect-[4/3] overflow-hidden rounded-[8px] border border-neutral-200">
              <img src={croppedPreview || image.url} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
                <ImagePlus className="h-4 w-4 flex-none text-neutral-950" aria-hidden="true" />
                <span className="truncate">{image.name}</span>
              </div>
              <p className="mt-1 font-mono text-xs text-neutral-600">{formatBytes(image.size)}</p>
              <div className={`mt-3 inline-flex items-center gap-2 rounded-[6px] border px-2.5 py-1 text-xs font-medium ${
                roiConfirmed
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-amber-300 bg-amber-50 text-amber-900"
              }`}>
                {roiConfirmed ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />}
                {roiConfirmed ? "Area kain ditetapkan" : "Area kain belum ditetapkan"}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={onEditArea} disabled={!image}>
                  <Crop className="h-4 w-4" aria-hidden="true" />
                  {roiConfirmed ? "Edit area" : "Pilih area"}
                </Button>
                <Button variant="secondary" onClick={openFileDialog}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Ganti foto
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="focus-ring flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-neutral-300 bg-neutral-50/50 px-4 text-center hover:border-neutral-950 hover:bg-neutral-50"
            role="button"
            tabIndex={0}
            aria-controls={inputId}
            onClick={openFileDialog}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openFileDialog();
              }
            }}
          >
            <Upload className="h-8 w-8 text-neutral-950" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-neutral-950">Upload foto sampel</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-neutral-600">
              Pilih file atau drag & drop. Format JPG, PNG, WEBP hingga 10MB.
            </p>
          </div>
        )}
      </div>

      {error ? (
        <div className="border-t border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900 sm:px-5">
          {error}
        </div>
      ) : null}
    </div>
  );
}
