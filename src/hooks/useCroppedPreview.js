import { useEffect, useState } from "react";
import { loadImage } from "../utils/image";

const DEFAULT_ROI = { x: 0, y: 0, width: 1, height: 1 };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRoi(roi) {
  const next = roi || DEFAULT_ROI;
  const x = clamp(Number(next.x) || 0, 0, 0.98);
  const y = clamp(Number(next.y) || 0, 0, 0.98);
  const width = clamp(Number(next.width) || 1, 0.02, 1 - x);
  const height = clamp(Number(next.height) || 1, 0.02, 1 - y);
  return { x, y, width, height };
}

export function useCroppedPreview(src, roi, maxDimension = 900) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!src) {
      setPreview("");
      return undefined;
    }

    loadImage(src)
      .then((image) => {
        if (cancelled) return;

        const safeRoi = normalizeRoi(roi);
        const sx = Math.round(safeRoi.x * image.naturalWidth);
        const sy = Math.round(safeRoi.y * image.naturalHeight);
        const sw = Math.max(1, Math.round(safeRoi.width * image.naturalWidth));
        const sh = Math.max(1, Math.round(safeRoi.height * image.naturalHeight));
        const boundedWidth = Math.min(sw, image.naturalWidth - sx);
        const boundedHeight = Math.min(sh, image.naturalHeight - sy);
        const scale = Math.min(1, maxDimension / Math.max(boundedWidth, boundedHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(boundedWidth * scale));
        canvas.height = Math.max(1, Math.round(boundedHeight * scale));
        const context = canvas.getContext("2d");
        context.drawImage(
          image,
          sx,
          sy,
          boundedWidth,
          boundedHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        setPreview(canvas.toDataURL("image/png"));
      })
      .catch(() => {
        if (!cancelled) setPreview("");
      });

    return () => {
      cancelled = true;
    };
  }, [src, roi, maxDimension]);

  return preview;
}
