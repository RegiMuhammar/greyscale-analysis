import { Check, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

const DEFAULT_ROI = { x: 0, y: 0, width: 1, height: 1 };
const STARTER_ROI = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };
const MIN_SIZE = 0.05;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function sanitizeRoi(roi) {
  const next = roi || DEFAULT_ROI;
  const x = clamp(Number(next.x) || 0, 0, 1 - MIN_SIZE);
  const y = clamp(Number(next.y) || 0, 0, 1 - MIN_SIZE);
  const width = clamp(Number(next.width) || 1, MIN_SIZE, 1 - x);
  const height = clamp(Number(next.height) || 1, MIN_SIZE, 1 - y);
  return { x, y, width, height };
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function RoiCard({ title, image, roi, onChange, frameClassName = "h-[260px]" }) {
  const frameRef = useRef(null);
  const startRef = useRef(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [activeMode, setActiveMode] = useState("");
  const safeRoi = sanitizeRoi(roi);
  const coverage = safeRoi.width * safeRoi.height;
  const isFullRoi = safeRoi.x === 0 && safeRoi.y === 0 && safeRoi.width === 1 && safeRoi.height === 1;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const updateFrameSize = () => {
      const rect = frame.getBoundingClientRect();
      setFrameSize({ width: rect.width, height: rect.height });
    };

    updateFrameSize();
    const observer = new ResizeObserver(updateFrameSize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setNaturalSize(null);
  }, [image?.url]);

  const displayBox = (() => {
    if (!naturalSize || !frameSize.width || !frameSize.height) {
      return { left: 0, top: 0, width: frameSize.width || 1, height: frameSize.height || 1 };
    }

    const imageAspect = naturalSize.width / naturalSize.height;
    const frameAspect = frameSize.width / frameSize.height;

    if (imageAspect > frameAspect) {
      const height = frameSize.width / imageAspect;
      return { left: 0, top: (frameSize.height - height) / 2, width: frameSize.width, height };
    }

    const width = frameSize.height * imageAspect;
    return { left: (frameSize.width - width) / 2, top: 0, width, height: frameSize.height };
  })();

  const displayBoxStyle = {
    left: `${displayBox.left}px`,
    top: `${displayBox.top}px`,
    width: `${displayBox.width}px`,
    height: `${displayBox.height}px`,
  };

  useEffect(() => {
    if (!activeMode) return undefined;

    const handlePointerMove = (event) => {
      const start = startRef.current;
      const frame = frameRef.current;
      if (!start || !frame) return;

      const dx = (event.clientX - start.clientX) / Math.max(1, start.box.width);
      const dy = (event.clientY - start.clientY) / Math.max(1, start.box.height);

      if (activeMode === "move") {
        onChange({
          ...start.roi,
          x: clamp(start.roi.x + dx, 0, 1 - start.roi.width),
          y: clamp(start.roi.y + dy, 0, 1 - start.roi.height),
        });
        return;
      }

      if (activeMode === "resize") {
        onChange({
          ...start.roi,
          width: clamp(start.roi.width + dx, MIN_SIZE, 1 - start.roi.x),
          height: clamp(start.roi.height + dy, MIN_SIZE, 1 - start.roi.y),
        });
        return;
      }

      if (activeMode === "draw") {
        const currentX = clamp((event.clientX - start.box.left - start.frameLeft) / Math.max(1, start.box.width), 0, 1);
        const currentY = clamp((event.clientY - start.box.top - start.frameTop) / Math.max(1, start.box.height), 0, 1);
        const x = Math.min(start.anchorX, currentX);
        const y = Math.min(start.anchorY, currentY);
        const width = Math.max(MIN_SIZE, Math.abs(currentX - start.anchorX));
        const height = Math.max(MIN_SIZE, Math.abs(currentY - start.anchorY));

        onChange({
          x: clamp(x, 0, 1 - MIN_SIZE),
          y: clamp(y, 0, 1 - MIN_SIZE),
          width: clamp(width, MIN_SIZE, 1 - x),
          height: clamp(height, MIN_SIZE, 1 - y),
        });
      }
    };

    const handlePointerUp = () => {
      startRef.current = null;
      setActiveMode("");
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeMode, onChange]);

  const startInteraction = (event, mode) => {
    event.preventDefault();
    event.stopPropagation();
    startRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      roi: safeRoi,
      box: displayBox,
    };
    setActiveMode(mode);
  };

  const startDraw = (event) => {
    event.preventDefault();
    const frame = frameRef.current;
    if (!frame || !displayBox.width || !displayBox.height) return;

    const frameRect = frame.getBoundingClientRect();
    const anchorX = clamp((event.clientX - frameRect.left - displayBox.left) / displayBox.width, 0, 1);
    const anchorY = clamp((event.clientY - frameRect.top - displayBox.top) / displayBox.height, 0, 1);
    startRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      roi: safeRoi,
      box: displayBox,
      frameLeft: frameRect.left,
      frameTop: frameRect.top,
      anchorX,
      anchorY,
    };
    onChange({
      x: clamp(anchorX - 0.03, 0, 1 - MIN_SIZE),
      y: clamp(anchorY - 0.03, 0, 1 - MIN_SIZE),
      width: MIN_SIZE,
      height: MIN_SIZE,
    });
    setActiveMode("draw");
  };

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[#111111]">{title}</div>
          <div className="text-xs leading-5 text-[#666666]">
            ROI {formatPercent(coverage)} dari foto{isFullRoi ? " - drag di foto untuk membuat area kain" : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button className="h-8 min-h-8 rounded-full px-3 text-xs" variant="secondary" onClick={() => onChange(STARTER_ROI)}>
            Tengah
          </Button>
          <Button className="h-8 min-h-8 rounded-full px-3 text-xs" variant="secondary" onClick={() => onChange(DEFAULT_ROI)}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Full
          </Button>
        </div>
      </div>

      <div ref={frameRef} className={`figure-frame relative overflow-hidden rounded-[8px] bg-[#f7f7f7] ${frameClassName}`}>
        {image?.url && (!naturalSize || !frameSize.width || !frameSize.height) ? (
          <img
            src={image.url}
            alt={`${title} ROI`}
            className="h-full w-full object-contain"
            draggable={false}
            onLoad={(event) => {
              setNaturalSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              });
            }}
          />
        ) : image?.url ? (
          <>
            <div className="absolute cursor-crosshair" style={displayBoxStyle} onPointerDown={startDraw}>
              <img
                src={image.url}
                alt={`${title} ROI`}
                className="h-full w-full object-fill"
                draggable={false}
                onLoad={(event) => {
                  setNaturalSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  });
                }}
              />
              <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
              <div
                className="absolute cursor-move border-2 border-white bg-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]"
                style={{
                  left: `${safeRoi.x * 100}%`,
                  top: `${safeRoi.y * 100}%`,
                  width: `${safeRoi.width * 100}%`,
                  height: `${safeRoi.height * 100}%`,
                }}
                onPointerDown={(event) => startInteraction(event, "move")}
                role="presentation"
              >
                <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#111111]">
                  Area kain
                </span>
                <button
                  type="button"
                  className="absolute bottom-1 right-1 h-6 w-6 cursor-nwse-resize rounded-full border-2 border-white bg-[#111111] shadow-sm focus-ring"
                  aria-label={`Resize ROI ${title}`}
                  onPointerDown={(event) => startInteraction(event, "resize")}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#777777]">Upload foto dulu</div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] font-semibold text-[#666666]">
        <span>X {formatPercent(safeRoi.x)}</span>
        <span>Y {formatPercent(safeRoi.y)}</span>
        <span>W {formatPercent(safeRoi.width)}</span>
        <span>H {formatPercent(safeRoi.height)}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#777777]">
        Drag langsung di foto untuk menggambar area baru. Drag kotak untuk memindahkan. Tarik titik hitam untuk resize.
      </p>
    </div>
  );
}

export function RoiSelector({ before, after, beforeRoi, afterRoi, onBeforeRoiChange, onAfterRoiChange }) {
  return (
    <section className="research-panel p-4 sm:p-5" aria-labelledby="roi-heading">
      <div className="mb-4">
        <h3 id="roi-heading" className="text-base font-semibold text-[#111111]">Area analisis kain</h3>
        <p className="mt-1 text-sm leading-6 text-[#666666]">
          Geser kotak putih ke area kain yang sama pada foto sebelum dan sesudah. Semua angka, histogram, dan estimasi grade dihitung dari area ini.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <RoiCard title="Sebelum pencucian" image={before} roi={beforeRoi} onChange={onBeforeRoiChange} />
        <RoiCard title="Sesudah pencucian" image={after} roi={afterRoi} onChange={onAfterRoiChange} />
      </div>
    </section>
  );
}

export function RoiCropModal({
  title,
  image,
  roi,
  onChange,
  onConfirm,
  onCancel,
  onUseFull,
}) {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[8px] border border-[#dedede] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#eeeeee] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[#111111]">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-[#666666]">
              Pilih area kain yang akan dihitung. Area ini akan dipakai untuk RGB, greyscale, histogram, Delta E, dan report.
            </p>
          </div>
          <Button className="h-9 min-h-9 shrink-0 px-2.5" variant="ghost" onClick={onCancel} aria-label="Tutup crop area">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="min-h-0 overflow-auto p-5">
          <RoiCard
            title={image.name}
            image={image}
            roi={roi}
            onChange={onChange}
            frameClassName="h-[58vh] min-h-[360px]"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-[#eeeeee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-[#666666]">
            Drag langsung pada foto untuk membuat area baru, lalu klik tetapkan.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={onUseFull}>
              Gunakan seluruh foto
            </Button>
            <Button onClick={onConfirm}>
              <Check className="h-4 w-4" aria-hidden="true" />
              Tetapkan area
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
