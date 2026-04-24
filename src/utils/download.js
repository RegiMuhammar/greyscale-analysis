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
  context.fillText("Referensi ISO 105-A03 bersifat visual, bukan kalibrasi resmi.", margin, 102);

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
