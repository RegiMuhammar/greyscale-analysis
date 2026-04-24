export const GREY_SCALE_GRADES = [
  {
    grade: "5",
    label: "Tidak ada staining/perubahan visual",
    severity: "best",
    patches: ["#f7f7f7", "#f7f7f7"],
  },
  {
    grade: "4-5",
    label: "Perubahan sangat sangat kecil",
    severity: "very-low",
    patches: ["#f7f7f7", "#eeeeee"],
  },
  {
    grade: "4",
    label: "Perubahan kecil",
    severity: "low",
    patches: ["#f7f7f7", "#e4e4e4"],
  },
  {
    grade: "3-4",
    label: "Perubahan cukup kecil",
    severity: "mild",
    patches: ["#f7f7f7", "#d4d4d4"],
  },
  {
    grade: "3",
    label: "Perubahan sedang",
    severity: "medium",
    patches: ["#f7f7f7", "#bdbdbd"],
  },
  {
    grade: "2-3",
    label: "Perubahan cukup besar",
    severity: "high",
    patches: ["#f7f7f7", "#9f9f9f"],
  },
  {
    grade: "2",
    label: "Perubahan besar",
    severity: "very-high",
    patches: ["#f7f7f7", "#858585"],
  },
  {
    grade: "1-2",
    label: "Perubahan sangat besar",
    severity: "severe",
    patches: ["#f7f7f7", "#686868"],
  },
  {
    grade: "1",
    label: "Perubahan ekstrem",
    severity: "worst",
    patches: ["#f7f7f7", "#4a4a4a"],
  },
];

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(value) {
  const part = Math.round(value).toString(16).padStart(2, "0");
  return `#${part}${part}${part}`;
}

function luminosityValue(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

const COLOR_VALUE_INPUTS = [
  { name: "Kuning", hex: "#FFF200" },
  { name: "Oranye", hex: "#FF8A00" },
  { name: "Merah", hex: "#D60000" },
  { name: "Hijau", hex: "#00C853" },
  { name: "Sian", hex: "#00D5E8" },
  { name: "Biru", hex: "#174BFF" },
  { name: "Ungu", hex: "#5B2DBA" },
  { name: "Magenta", hex: "#C0007A" },
  { name: "Cokelat", hex: "#8A4B24" },
];

export const COLOR_VALUE_REFERENCES = COLOR_VALUE_INPUTS.map((item) => {
  const value = luminosityValue(item.hex);

  return {
    ...item,
    value: Math.round(value),
    grey: rgbToHex(value),
  };
});
