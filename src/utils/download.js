import { jsPDF } from "jspdf";
import { loadImage } from "./image";

export function downloadDataUrl(dataUrl, filename) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function drawContainedImage(context, image, x, y, width, height) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  context.fillStyle = "#F8FAFC";
  context.fillRect(x, y, width, height);
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  let line = "";
  let lines = 0;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, y);
      y += lineHeight;
      lines += 1;
      line = word;
      if (lines >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }

  if (line && lines < maxLines) {
    context.fillText(line, x, y);
  }
}

function drawContainedImageCrop(context, image, roi, x, y, width, height) {
  const safeRoi = roi || { x: 0, y: 0, width: 1, height: 1 };
  const sx = safeRoi.x * image.naturalWidth;
  const sy = safeRoi.y * image.naturalHeight;
  const sw = safeRoi.width * image.naturalWidth;
  const sh = safeRoi.height * image.naturalHeight;
  const scale = Math.min(width / sw, height / sh);
  const drawWidth = sw * scale;
  const drawHeight = sh * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  context.fillStyle = "#F8FAFC";
  context.fillRect(x, y, width, height);
  context.drawImage(image, sx, sy, sw, sh, drawX, drawY, drawWidth, drawHeight);
}

function formatNumber(value, digits = 1) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return Number.parseFloat(value.toFixed(digits));
}

function formatSigned(value, digits = 1) {
  const rounded = formatNumber(value, digits);
  if (rounded === "-") return "-";
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

function drawRoundedRect(context, x, y, width, height, radius = 12) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function drawLabel(context, label, value, x, y, width) {
  context.fillStyle = "#6B7280";
  context.font = "700 18px Arial";
  context.fillText(label, x, y);
  context.fillStyle = "#111827";
  context.font = "700 30px Arial";
  context.fillText(String(value), x, y + 38, width);
}

function drawRgbBars(context, analysis, x, y, width, height) {
  const channels = [
    ["R", "r", "#DC2626"],
    ["G", "g", "#16A34A"],
    ["B", "b", "#2563EB"],
  ];

  context.fillStyle = "#111827";
  context.font = "700 22px Arial";
  context.fillText("RGB average dan delta", x, y);

  channels.forEach(([label, key, color], index) => {
    const rowY = y + 44 + index * 70;
    const before = analysis.before.averageRgb[key];
    const after = analysis.after.averageRgb[key];
    const delta = analysis.delta.rgb[key];
    const barX = x + 70;
    const barWidth = width - 190;

    context.fillStyle = color;
    context.font = "700 20px Arial";
    context.fillText(label, x, rowY + 22);

    context.fillStyle = "#E5E7EB";
    context.fillRect(barX, rowY, barWidth, 14);
    context.fillRect(barX, rowY + 24, barWidth, 14);
    context.fillStyle = "#111827";
    context.fillRect(barX, rowY, (before / 255) * barWidth, 14);
    context.fillStyle = color;
    context.fillRect(barX, rowY + 24, (after / 255) * barWidth, 14);

    context.fillStyle = "#111827";
    context.font = "700 18px Arial";
    context.fillText(formatSigned(delta, 1), x + width - 90, rowY + 28);
  });
}

function drawHistogramLine(context, values, x, y, width, height, color, max) {
  context.beginPath();
  values.forEach((value, index) => {
    const px = x + (index / Math.max(1, values.length - 1)) * width;
    const py = y + height - (value / max) * height;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  });
  context.strokeStyle = color;
  context.lineWidth = 4;
  context.stroke();
}

function drawValueHistogram(context, analysis, x, y, width, height) {
  const beforeCount = analysis.before.sampleWidth * analysis.before.sampleHeight;
  const afterCount = analysis.after.sampleWidth * analysis.after.sampleHeight;
  const beforeValues = analysis.before.histogram.value.map((value) => value / beforeCount);
  const afterValues = analysis.after.histogram.value.map((value) => value / afterCount);
  const max = Math.max(...beforeValues, ...afterValues, 0.001);

  context.fillStyle = "#111827";
  context.font = "700 22px Arial";
  context.fillText("Histogram greyscale value", x, y);

  context.strokeStyle = "#E5E7EB";
  context.lineWidth = 1;
  for (let line = 0; line <= 4; line += 1) {
    const lineY = y + 40 + (height / 4) * line;
    context.beginPath();
    context.moveTo(x, lineY);
    context.lineTo(x + width, lineY);
    context.stroke();
  }

  drawHistogramLine(context, beforeValues, x, y + 40, width, height, "#111827", max);
  drawHistogramLine(context, afterValues, x, y + 40, width, height, "#D97706", max);

  context.fillStyle = "#6B7280";
  context.font = "700 16px Arial";
  context.fillText("0", x, y + height + 66);
  context.fillText("128", x + width / 2 - 18, y + height + 66);
  context.fillText("255", x + width - 34, y + height + 66);
}

export async function createCompositePng({
  originalBefore,
  greyscaleBefore,
  originalAfter,
  greyscaleAfter,
  observer,
}) {
  const sources = [
    { src: originalBefore, label: "Asli sebelum pencucian" },
    { src: greyscaleBefore, label: "Greyscale sebelum pencucian" },
    { src: originalAfter, label: "Asli sesudah pencucian" },
    { src: greyscaleAfter, label: "Greyscale sesudah pencucian" },
  ];

  const images = await Promise.all(sources.map((item) => loadImage(item.src)));
  const canvas = document.createElement("canvas");
  const scale = 2;
  const panelWidth = 420;
  const panelHeight = 330;
  const gap = 28;
  const margin = 48;
  const headerHeight = 124;
  const footerHeight = 154;

  canvas.width = (panelWidth * 2 + gap + margin * 2) * scale;
  canvas.height = (headerHeight + panelHeight * 2 + gap + footerHeight + margin) * scale;

  const context = canvas.getContext("2d");
  context.scale(scale, scale);
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#111827";
  context.font = "700 28px Arial";
  context.fillText("Grey Scale Analyser", margin, 52);
  context.font = "400 14px Arial";
  context.fillStyle = "#667085";
  context.fillText("Konversi digital greyscale untuk dokumentasi observasi tekstil.", margin, 80);
  context.fillText("Referensi ISO 105-A02 bersifat visual, bukan kalibrasi resmi.", margin, 102);

  sources.forEach((source, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + column * (panelWidth + gap);
    const y = headerHeight + row * (panelHeight + gap);

    context.strokeStyle = "#D9DEE7";
    context.lineWidth = 1;
    context.strokeRect(x, y, panelWidth, panelHeight);
    drawContainedImage(context, images[index], x + 16, y + 16, panelWidth - 32, panelHeight - 62);

    context.fillStyle = "#111827";
    context.font = "700 15px Arial";
    context.fillText(source.label, x + 16, y + panelHeight - 24);
  });

  const footerY = headerHeight + panelHeight * 2 + gap + 42;
  context.fillStyle = "#111827";
  context.font = "700 16px Arial";
  context.fillText("Catatan observer", margin, footerY);

  context.font = "400 14px Arial";
  context.fillStyle = "#344054";
  const observerName = observer.name?.trim() || "-";
  const grade = observer.grade || "-";
  context.fillText(`Observer: ${observerName}`, margin, footerY + 28);
  context.fillText(`Grade observer: ${grade}`, margin + 270, footerY + 28);
  wrapText(context, observer.notes || "-", margin, footerY + 58, panelWidth * 2 + gap, 20);

  return canvas.toDataURL("image/png");
}

export async function createAnalysisReportPdf({
  originalBefore,
  originalAfter,
  greyscaleBefore,
  greyscaleAfter,
  analysis,
  observer,
}) {
  const [beforeImage, afterImage, beforeGreyImage, afterGreyImage] = await Promise.all([
    loadImage(originalBefore),
    loadImage(originalAfter),
    loadImage(greyscaleBefore),
    loadImage(greyscaleAfter),
  ]);

  const canvas = document.createElement("canvas");
  const scale = 2;
  const width = 1200;
  const height = 1680;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext("2d");
  context.scale(scale, scale);

  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#111827";
  context.font = "700 38px Arial";
  context.fillText("Grey Scale Analyser - Report Analisis", 64, 72);
  context.fillStyle = "#667085";
  context.font = "400 18px Arial";
  context.fillText("Data dihitung dari ROI kain, bukan seluruh foto bila area analisis sudah dipilih.", 64, 104);

  const roiLabel = `ROI before ${formatNumber(analysis.before.roiCoveragePercent, 1)}% / after ${formatNumber(analysis.after.roiCoveragePercent, 1)}%`;
  context.fillStyle = "#111827";
  context.font = "700 18px Arial";
  context.fillText(roiLabel, 64, 136);

  const imageY = 170;
  const imageWidth = 250;
  const imageHeight = 220;
  const imageGap = 28;
  const images = [
    [beforeImage, analysis.before.roi, "ROI asli sebelum"],
    [afterImage, analysis.after.roi, "ROI asli sesudah"],
    [beforeGreyImage, analysis.before.roi, "ROI greyscale sebelum"],
    [afterGreyImage, analysis.after.roi, "ROI greyscale sesudah"],
  ];

  images.forEach(([image, roi, label], index) => {
    const x = 64 + index * (imageWidth + imageGap);
    context.strokeStyle = "#D1D5DB";
    context.strokeRect(x, imageY, imageWidth, imageHeight);
    if (roi) drawContainedImageCrop(context, image, roi, x + 10, imageY + 10, imageWidth - 20, imageHeight - 50);
    else drawContainedImage(context, image, x + 10, imageY + 10, imageWidth - 20, imageHeight - 50);
    context.fillStyle = "#111827";
    context.font = "700 16px Arial";
    context.fillText(label, x + 12, imageY + imageHeight - 18);
  });

  const metricY = 450;
  const cardWidth = 250;
  const metricCards = [
    ["Delta E", formatNumber(analysis.deltaE, 2)],
    ["Estimasi grade", analysis.estimatedGrade],
    ["Delta value", formatSigned(analysis.delta.value, 1)],
    ["Delta RGB", `${formatSigned(analysis.delta.rgb.r, 1)} / ${formatSigned(analysis.delta.rgb.g, 1)} / ${formatSigned(analysis.delta.rgb.b, 1)}`],
  ];

  metricCards.forEach(([label, value], index) => {
    const x = 64 + index * (cardWidth + 28);
    drawRoundedRect(context, x, metricY, cardWidth, 118, 14);
    context.fillStyle = "#F9FAFB";
    context.fill();
    context.strokeStyle = "#E5E7EB";
    context.stroke();
    drawLabel(context, label, value, x + 22, metricY + 34, cardWidth - 44);
  });

  drawRgbBars(context, analysis, 64, 640, 520, 230);
  drawValueHistogram(context, analysis, 636, 640, 500, 190);

  context.fillStyle = "#111827";
  context.font = "700 22px Arial";
  context.fillText("Statistik value", 64, 940);
  const statsRows = [
    ["P10", analysis.before.stats.value.p10, analysis.after.stats.value.p10],
    ["Median", analysis.before.stats.value.median, analysis.after.stats.value.median],
    ["Mean", analysis.before.stats.value.mean, analysis.after.stats.value.mean],
    ["P90", analysis.before.stats.value.p90, analysis.after.stats.value.p90],
    ["Std dev", analysis.before.stats.value.stdDev, analysis.after.stats.value.stdDev],
  ];

  context.font = "700 17px Arial";
  context.fillStyle = "#6B7280";
  context.fillText("Metric", 64, 982);
  context.fillText("Sebelum", 250, 982);
  context.fillText("Sesudah", 390, 982);
  context.fillText("Delta", 530, 982);

  statsRows.forEach(([label, before, after], index) => {
    const y = 1020 + index * 34;
    context.fillStyle = index % 2 ? "#FFFFFF" : "#F9FAFB";
    context.fillRect(56, y - 24, 560, 32);
    context.fillStyle = "#111827";
    context.font = "700 17px Arial";
    context.fillText(label, 64, y);
    context.font = "400 17px Arial";
    context.fillText(String(before), 250, y);
    context.fillText(String(after), 390, y);
    context.fillText(formatSigned(after - before, 1), 530, y);
  });

  context.fillStyle = "#111827";
  context.font = "700 22px Arial";
  context.fillText("Catatan kualitas", 636, 940);
  context.font = "400 17px Arial";
  context.fillStyle = "#374151";
  const qualityNotes = analysis.quality?.length
    ? analysis.quality.map((note) => `${note.title}: ${note.body}`).join(" ")
    : "Tidak ada peringatan kualitas utama.";
  wrapText(context, qualityNotes, 636, 982, 500, 25, 8);

  const observerY = 1260;
  context.fillStyle = "#111827";
  context.font = "700 22px Arial";
  context.fillText("Observer", 64, observerY);
  context.font = "400 18px Arial";
  context.fillStyle = "#374151";
  context.fillText(`Nama: ${observer.name?.trim() || "-"}`, 64, observerY + 38);
  context.fillText(`Grade observer: ${observer.grade || "-"}`, 64, observerY + 68);
  wrapText(context, `Catatan: ${observer.notes || "-"}`, 64, observerY + 102, 1040, 25, 6);

  context.fillStyle = "#6B7280";
  context.font = "400 16px Arial";
  context.fillText("Catatan: chart ISO di aplikasi adalah referensi visual, bukan kalibrasi resmi.", 64, height - 64);

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 595.28, 841.89);
  pdf.save("report_analisis_greyscale.pdf");
}
