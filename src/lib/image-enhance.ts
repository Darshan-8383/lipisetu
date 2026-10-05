"use client";

/**
 * LipiSetu — client-side image enhancement pipeline for inscription photos.
 * Pipeline: grayscale → brightness → contrast stretch → sharpen → threshold (Otsu/manual)
 * All operations run on ImageData using typed arrays for performance.
 */

export type EnhanceSettings = {
  grayscale: boolean;
  contrast: boolean;
  contrastAmount: number; // 0–100 (percentile stretch intensity)
  brightness: number; // -50–50
  sharpen: boolean;
  sharpenAmount: number; // 0–100
  threshold: boolean;
  thresholdLevel: number; // 0 = auto (Otsu), else 1–254
};

export const DEFAULT_SETTINGS: EnhanceSettings = {
  grayscale: true,
  contrast: true,
  contrastAmount: 40,
  brightness: 0,
  sharpen: true,
  sharpenAmount: 50,
  threshold: false,
  thresholdLevel: 0,
};

export const AUTO_SETTINGS: EnhanceSettings = {
  ...DEFAULT_SETTINGS,
  contrastAmount: 70,
  brightness: 5,
  sharpenAmount: 70,
  threshold: false,
};

/** Convert RGB ImageData to grayscale luminance in-place. */
function grayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
    data[i] = lum;
    data[i + 1] = lum;
    data[i + 2] = lum;
  }
}

/** Percentile-based linear contrast stretch. */
function contrastStretch(data: Uint8ClampedArray, amount: number): void {
  const hist = new Uint32Array(256);
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) hist[data[i]]++;

  const cut = (n * amount) / 200; // amount% of pixels clipped in total (both tails)
  let lo = 0;
  let acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc > cut) {
      lo = v;
      break;
    }
  }
  let hi = 255;
  acc = 0;
  for (let v = 255; v >= 0; v--) {
    acc += hist[v];
    if (acc > cut) {
      hi = v;
      break;
    }
  }
  if (hi - lo < 10) return;

  const lut = new Uint8ClampedArray(256);
  const scale = 255 / (hi - lo);
  for (let v = 0; v < 256; v++) {
    lut[v] = Math.max(0, Math.min(255, ((v - lo) * scale) | 0));
  }
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
}

/** Additive brightness in-place. */
function brightness(data: Uint8ClampedArray, amount: number): void {
  if (amount === 0) return;
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) lut[v] = v + amount;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]];
    data[i + 1] = lut[data[i + 1]];
    data[i + 2] = lut[data[i + 2]];
  }
}

/** Unsharp-mask style sharpening via 3×3 convolution. */
function sharpen(data: Uint8ClampedArray, w: number, h: number, amount: number): void {
  const k = amount / 100; // 0..1 blend of the sharpened result
  if (k <= 0) return;
  const src = new Uint8ClampedArray(data);
  // Kernel: center 5, orthogonal -1 (normalized by 1)
  const center = 1 + 4 * k;
  const side = -k;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const v =
        src[idx] * center +
        (src[idx - 4] + src[idx + 4] + src[idx - w * 4] + src[idx + w * 4]) * side;
      const clamped = Math.max(0, Math.min(255, v | 0));
      data[idx] = clamped;
      data[idx + 1] = clamped;
      data[idx + 2] = clamped;
    }
  }
}

/** Otsu's method — automatic threshold selection. */
function otsu(data: Uint8ClampedArray): number {
  const hist = new Uint32Array(256);
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) hist[data[i]]++;

  let sum = 0;
  for (let v = 0; v < 256; v++) sum += v * hist[v];

  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 128;
  for (let v = 0; v < 256; v++) {
    wB += hist[v];
    if (wB === 0) continue;
    const wF = n - wB;
    if (wF === 0) break;
    sumB += v * hist[v];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      threshold = v;
    }
  }
  return threshold;
}

/** Binarize with a given (or Otsu) threshold. */
function thresholdImg(data: Uint8ClampedArray, level: number): void {
  const t = level > 0 ? level : otsu(data);
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i] >= t ? 255 : 0;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
}

/** Run the full enhancement pipeline on a copy of the source ImageData. */
export function enhanceImage(source: ImageData, settings: EnhanceSettings): ImageData {
  const out = new ImageData(
    new Uint8ClampedArray(source.data),
    source.width,
    source.height
  );
  const { data, width, height } = out;

  if (settings.grayscale) grayscale(data);
  if (settings.brightness !== 0) brightness(data, settings.brightness);
  if (settings.contrast && settings.contrastAmount > 0) {
    contrastStretch(data, settings.contrastAmount);
  }
  if (settings.sharpen && settings.sharpenAmount > 0) {
    sharpen(data, width, height, settings.sharpenAmount);
  }
  if (settings.threshold) thresholdImg(data, settings.thresholdLevel);

  return out;
}

/** Load a File / Blob into an HTMLImageElement. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

/** Read a File as a resized JPEG data URL (max dimension cap). */
export async function fileToDataUrl(
  file: File,
  maxSize = 1400,
  quality = 0.88
): Promise<string> {
  const rawUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(rawUrl);
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(rawUrl);
  }
}

/** Fetch a URL (e.g. bundled sample) as a resized JPEG data URL. */
export async function urlToDataUrl(
  url: string,
  maxSize = 1400,
  quality = 0.88
): Promise<string> {
  const img = await loadImage(url);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Create a small JPEG thumbnail data URL from a data URL. */
export async function makeThumbnail(
  dataUrl: string,
  maxSize = 320,
  quality = 0.6
): Promise<string> {
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Convert an ImageData to a JPEG data URL. */
export function imageDataToDataUrl(
  imageData: ImageData,
  quality = 0.85
): string {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Draw an ImageData onto a canvas element. */
export function drawImageData(canvas: HTMLCanvasElement, imageData: ImageData): void {
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.putImageData(imageData, 0, 0);
}
