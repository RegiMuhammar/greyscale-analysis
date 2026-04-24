import { loadImage } from "./image";

const HISTOGRAM_BINS = 32;
const MATRIX_SIZE = 18;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value, digits = 1) {
  return Number.parseFloat(value.toFixed(digits));
}

function toHexChannel(value) {
  return Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0");
}

export function rgbToHex(rgb) {
  return `#${toHexChannel(rgb.r)}${toHexChannel(rgb.g)}${toHexChannel(rgb.b)}`;
}

export function luminanceFromRgb({ r, g, b }) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function srgbToLinear(value) {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function labPivot(value) {
  return value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
}

export function rgbToLab({ r, g, b }) {
  const linearR = srgbToLinear(r);
  const linearG = srgbToLinear(g);
  const linearB = srgbToLinear(b);

  const x = (0.4124564 * linearR + 0.3575761 * linearG + 0.1804375 * linearB) * 100;
  const y = (0.2126729 * linearR + 0.7151522 * linearG + 0.072175 * linearB) * 100;
  const z = (0.0193339 * linearR + 0.119192 * linearG + 0.9503041 * linearB) * 100;

  const fx = labPivot(x / 95.047);
  const fy = labPivot(y / 100);
  const fz = labPivot(z / 108.883);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function deltaE76(beforeLab, afterLab) {
  return Math.sqrt(
    (afterLab.l - beforeLab.l) ** 2 +
      (afterLab.a - beforeLab.a) ** 2 +
      (afterLab.b - beforeLab.b) ** 2,
  );
}

function estimateGrade(deltaE) {
  if (deltaE <= 0.8) return "5";
  if (deltaE <= 1.7) return "4-5";
  if (deltaE <= 2.5) return "4";
  if (deltaE <= 3.4) return "3-4";
  if (deltaE <= 6.8) return "3";
  if (deltaE <= 9) return "2-3";
  if (deltaE <= 12) return "2";
  if (deltaE <= 16) return "1-2";
  return "1";
}

function gradeDescription(grade) {
  const descriptions = {
    5: "Tidak ada perubahan warna",
    "4-5": "Perubahan sangat kecil",
    4: "Perubahan kecil",
    "3-4": "Perubahan cukup kecil",
    3: "Perubahan sedang",
    "2-3": "Perubahan cukup besar",
    2: "Perubahan besar",
    "1-2": "Perubahan sangat besar",
    1: "Perubahan ekstrem",
  };
  return descriptions[grade] || "Estimasi belum tersedia";
}

function imageToData(src, maxDimension = 240) {
  return loadImage(src).then((image) => {
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, width, height);
    return {
      image,
      width,
      height,
      imageData: context.getImageData(0, 0, width, height),
    };
  });
}

function emptyHistogram() {
  return Array.from({ length: HISTOGRAM_BINS }, () => 0);
}

function analyseImageData({ image, width, height, imageData }) {
  const histogram = {
    r: emptyHistogram(),
    g: emptyHistogram(),
    b: emptyHistogram(),
    value: emptyHistogram(),
  };
  const sums = { r: 0, g: 0, b: 0, value: 0 };
  const { data } = imageData;
  const pixelCount = width * height;

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const value = luminanceFromRgb({ r, g, b });
    const binR = Math.min(HISTOGRAM_BINS - 1, Math.floor((r / 256) * HISTOGRAM_BINS));
    const binG = Math.min(HISTOGRAM_BINS - 1, Math.floor((g / 256) * HISTOGRAM_BINS));
    const binB = Math.min(HISTOGRAM_BINS - 1, Math.floor((b / 256) * HISTOGRAM_BINS));
    const binValue = Math.min(HISTOGRAM_BINS - 1, Math.floor((value / 256) * HISTOGRAM_BINS));

    sums.r += r;
    sums.g += g;
    sums.b += b;
    sums.value += value;
    histogram.r[binR] += 1;
    histogram.g[binG] += 1;
    histogram.b[binB] += 1;
    histogram.value[binValue] += 1;
  }

  const averageRgb = {
    r: sums.r / pixelCount,
    g: sums.g / pixelCount,
    b: sums.b / pixelCount,
  };
  const averageValue = sums.value / pixelCount;
  const lab = rgbToLab(averageRgb);

  return {
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    sampleWidth: width,
    sampleHeight: height,
    averageRgb,
    averageHex: rgbToHex(averageRgb),
    averageValue,
    lab,
    histogram,
  };
}

async function createMatrix(beforeSrc, afterSrc) {
  const [beforeImage, afterImage] = await Promise.all([loadImage(beforeSrc), loadImage(afterSrc)]);
  const beforeCanvas = document.createElement("canvas");
  const afterCanvas = document.createElement("canvas");
  beforeCanvas.width = MATRIX_SIZE;
  beforeCanvas.height = MATRIX_SIZE;
  afterCanvas.width = MATRIX_SIZE;
  afterCanvas.height = MATRIX_SIZE;

  const beforeContext = beforeCanvas.getContext("2d", { willReadFrequently: true });
  const afterContext = afterCanvas.getContext("2d", { willReadFrequently: true });
  beforeContext.drawImage(beforeImage, 0, 0, MATRIX_SIZE, MATRIX_SIZE);
  afterContext.drawImage(afterImage, 0, 0, MATRIX_SIZE, MATRIX_SIZE);

  const beforeData = beforeContext.getImageData(0, 0, MATRIX_SIZE, MATRIX_SIZE).data;
  const afterData = afterContext.getImageData(0, 0, MATRIX_SIZE, MATRIX_SIZE).data;
  const cells = [];
  let total = 0;
  let max = 0;
  let highChange = 0;

  for (let index = 0; index < beforeData.length; index += 4) {
    const beforeRgb = {
      r: beforeData[index],
      g: beforeData[index + 1],
      b: beforeData[index + 2],
    };
    const afterRgb = {
      r: afterData[index],
      g: afterData[index + 1],
      b: afterData[index + 2],
    };
    const beforeValue = luminanceFromRgb(beforeRgb);
    const afterValue = luminanceFromRgb(afterRgb);
    const rgbDistance = Math.sqrt(
      (afterRgb.r - beforeRgb.r) ** 2 +
        (afterRgb.g - beforeRgb.g) ** 2 +
        (afterRgb.b - beforeRgb.b) ** 2,
    );
    const rgbIntensity = clamp((rgbDistance / 441.67) * 100, 0, 100);
    const valueDelta = afterValue - beforeValue;
    const intensity = clamp(rgbIntensity * 0.7 + Math.abs(valueDelta / 255) * 100 * 0.3, 0, 100);

    total += intensity;
    max = Math.max(max, intensity);
    if (intensity >= 18) highChange += 1;
    cells.push({
      intensity,
      valueDelta,
      color: matrixColor(intensity, valueDelta),
    });
  }

  return {
    size: MATRIX_SIZE,
    cells,
    averageIntensity: total / cells.length,
    maxIntensity: max,
    highChangePercent: (highChange / cells.length) * 100,
  };
}

function matrixColor(intensity, valueDelta) {
  const alpha = clamp(intensity / 100, 0.08, 0.92);
  if (valueDelta > 4) return `rgba(37, 99, 235, ${alpha})`;
  if (valueDelta < -4) return `rgba(217, 119, 6, ${alpha})`;
  return `rgba(17, 24, 39, ${alpha})`;
}

function makeInsight(pair) {
  const valueDirection =
    Math.abs(pair.delta.value) < 2
      ? "nilai terang/gelap relatif stabil"
      : pair.delta.value < 0
        ? "sampel cenderung lebih gelap setelah pencucian"
        : "sampel cenderung lebih terang atau pudar setelah pencucian";

  const rgbDeltas = [
    ["R", pair.delta.rgb.r],
    ["G", pair.delta.rgb.g],
    ["B", pair.delta.rgb.b],
  ];
  const strongest = rgbDeltas.reduce((current, next) =>
    Math.abs(next[1]) > Math.abs(current[1]) ? next : current,
  );
  const channelDirection = strongest[1] < 0 ? "turun" : "naik";
  const labDirection =
    Math.abs(pair.delta.lab.a) > Math.abs(pair.delta.lab.b)
      ? pair.delta.lab.a < 0
        ? "arah merah berkurang / lebih hijau"
        : "arah merah meningkat"
      : pair.delta.lab.b < 0
        ? "arah kuning berkurang / lebih biru"
        : "arah kuning meningkat";

  return {
    summary: `Estimasi grade ${pair.estimatedGrade} (${gradeDescription(pair.estimatedGrade)}). ${valueDirection}.`,
    rgb: `Channel ${strongest[0]} paling berubah (${channelDirection} ${Math.abs(round(strongest[1], 1))} poin).`,
    lab: labDirection,
  };
}

export async function analyseColorPair(beforeSrc, afterSrc) {
  if (!beforeSrc || !afterSrc) return null;

  const [beforeData, afterData, matrix] = await Promise.all([
    imageToData(beforeSrc).then(analyseImageData),
    imageToData(afterSrc).then(analyseImageData),
    createMatrix(beforeSrc, afterSrc),
  ]);

  const delta = {
    rgb: {
      r: afterData.averageRgb.r - beforeData.averageRgb.r,
      g: afterData.averageRgb.g - beforeData.averageRgb.g,
      b: afterData.averageRgb.b - beforeData.averageRgb.b,
    },
    value: afterData.averageValue - beforeData.averageValue,
    lab: {
      l: afterData.lab.l - beforeData.lab.l,
      a: afterData.lab.a - beforeData.lab.a,
      b: afterData.lab.b - beforeData.lab.b,
    },
  };
  const deltaE = deltaE76(beforeData.lab, afterData.lab);
  const estimatedGrade = estimateGrade(deltaE);

  const pair = {
    before: beforeData,
    after: afterData,
    delta,
    deltaE,
    estimatedGrade,
    gradeDescription: gradeDescription(estimatedGrade),
    valueChangePercent: beforeData.averageValue
      ? (delta.value / beforeData.averageValue) * 100
      : 0,
    matrix,
  };

  return {
    ...pair,
    insight: makeInsight(pair),
  };
}

export function formatRgb(rgb) {
  return `${Math.round(rgb.r)} / ${Math.round(rgb.g)} / ${Math.round(rgb.b)}`;
}

export function formatLab(lab) {
  return `L* ${round(lab.l, 1)} / a* ${round(lab.a, 1)} / b* ${round(lab.b, 1)}`;
}

export function formatSigned(value, digits = 1) {
  const rounded = round(value, digits);
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}
