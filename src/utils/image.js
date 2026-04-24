export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function validateImageFile(file) {
  if (!file) return "File tidak ditemukan.";
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Format tidak didukung. Gunakan JPG, PNG, atau WEBP.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Ukuran file melebihi 10MB.";
  }
  return "";
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gambar tidak dapat dimuat."));
    image.src = src;
  });
}
