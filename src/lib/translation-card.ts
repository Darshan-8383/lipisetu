/**
 * LipiSetu — Translation Card composer.
 *
 * Deterministically composes a museum-style "translation card" image in the
 * browser (canvas) from an inscription photo + Sanskrit / English / Kannada
 * text. Unlike AI image generation, every character is rendered exactly from
 * the verified translation, using the Noto Devanagari / Kannada webfonts.
 */

import { loadImage } from "./image-enhance";

const PALETTE = {
  bg: "#FBF7EE",
  frame: "#9C4A2F",
  frameInner: "#C9A96A",
  ink: "#3B2A1E",
  muted: "#8C7A6B",
  chip: "#F3E7D2",
  sanskrit: "#7A3418",
};

const LATIN_SERIF = 'Georgia, "Times New Roman", serif';

function cssVarFamily(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

async function ensureCardFonts(): Promise<{
  dev: string;
  kan: string;
  serifDev: string;
}> {
  const dev =
    cssVarFamily("--font-devanagari", '"Noto Sans Devanagari"') +
    ', "Nirmala UI", "Mangal", serif';
  const kan =
    cssVarFamily("--font-kannada", '"Noto Sans Kannada"') +
    ', "Tunga", "Nirmala UI", serif';
  const serifDev =
    cssVarFamily("--font-serif-devanagari", '"Noto Serif Devanagari"') +
    ', "Noto Sans Devanagari", serif';
  if (typeof document !== "undefined" && document.fonts?.load) {
    try {
      await Promise.all([
        document.fonts.load(`400 28px ${dev}`),
        document.fonts.load(`700 46px ${serifDev}`),
        document.fonts.load(`400 26px ${kan}`),
        document.fonts.load(`600 20px ${dev}`),
      ]);
      await document.fonts.ready;
    } catch {
      /* fall back to system fonts */
    }
  }
  return { dev, kan, serifDev };
}

/** Word-wrap with hard-breaking for very long words. Returns at most maxLines. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 12
): string[] {
  const out: string[] = [];
  const pushLine = (line: string) => {
    out.push(line);
    if (out.length >= maxLines) return true;
    return false;
  };
  for (const para of text.split(/\n+/)) {
    if (!para.trim()) {
      if (out.length && out.length < maxLines) out.push("");
      continue;
    }
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth || !line) {
        if (!line && ctx.measureText(word).width > maxWidth) {
          // hard-break an oversized single word
          let chunk = "";
          for (const ch of word) {
            if (chunk && ctx.measureText(chunk + ch).width > maxWidth) {
              if (pushLine(chunk)) return out;
              chunk = ch;
            } else {
              chunk += ch;
            }
          }
          line = chunk;
        } else {
          line = test;
        }
      } else {
        if (pushLine(line)) return out;
        line = word;
      }
    }
    if (line) if (pushLine(line)) return out;
  }
  return out;
}

export type TranslationCardInput = {
  title?: string | null;
  originalImage?: string | null;
  sanskrit: string;
  transliteration?: string | null;
  english?: string | null;
  kannada?: string | null;
  engineNote?: string | null;
};

/**
 * Compose the translation card and return a JPEG data URL.
 */
export async function composeTranslationCard(
  input: TranslationCardInput
): Promise<string> {
  const fonts = await ensureCardFonts();
  const photo = input.originalImage
    ? await loadImage(input.originalImage).catch(() => null)
    : null;

  const W = 1080;
  const M = 96; // content margin inside the frame
  const CW = W - M * 2;

  const measureCanvas = document.createElement("canvas");
  measureCanvas.width = W;
  measureCanvas.height = 100;
  const mctx = measureCanvas.getContext("2d");
  if (!mctx) throw new Error("Canvas is not supported in this browser");

  type Section = {
    height: number;
    draw: (ctx: CanvasRenderingContext2D, y: number) => void;
  };
  const sections: Section[] = [];

  // ---- Header ------------------------------------------------------
  const headerHeight = input.title ? 178 : 150;
  sections.push({
    height: headerHeight,
    draw: (ctx, y) => {
      ctx.textAlign = "center";
      ctx.fillStyle = PALETTE.frame;
      ctx.font = `700 46px ${fonts.serifDev}`;
      ctx.fillText("लिपिसेतु", W / 2, y + 52);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `600 16px ${LATIN_SERIF}`;
      try {
        ctx.letterSpacing = "3px";
      } catch {
        /* not supported */
      }
      ctx.fillText(
        "L I P I S E T U   ·   T R A N S L A T I O N   C A R D",
        W / 2,
        y + 84
      );
      try {
        ctx.letterSpacing = "0px";
      } catch {
        /* ignore */
      }
      if (input.title) {
        ctx.fillStyle = PALETTE.ink;
        ctx.font = `italic 600 23px ${LATIN_SERIF}`;
        ctx.fillText(input.title, W / 2, y + 122);
      }
      // ornament divider: line + diamond + line
      const cy = y + headerHeight - 34;
      ctx.strokeStyle = PALETTE.frameInner;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 150, cy);
      ctx.lineTo(W / 2 - 16, cy);
      ctx.moveTo(W / 2 + 16, cy);
      ctx.lineTo(W / 2 + 150, cy);
      ctx.stroke();
      ctx.fillStyle = PALETTE.frame;
      ctx.save();
      ctx.translate(W / 2, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-5.5, -5.5, 11, 11);
      ctx.restore();
    },
  });

  // ---- Photo -------------------------------------------------------
  if (photo) {
    const maxPh = 370;
    const scale = Math.min(CW / photo.width, maxPh / photo.height, 1);
    const pw = Math.round(photo.width * scale);
    const ph = Math.round(photo.height * scale);
    const height = ph + 38;
    sections.push({
      height,
      draw: (ctx, y) => {
        const x = Math.round((W - pw) / 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x - 6, y - 6, pw + 12, ph + 12);
        ctx.strokeStyle = PALETTE.frameInner;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 6.5, y - 6.5, pw + 13, ph + 13);
        ctx.drawImage(photo, x, y, pw, ph);
        ctx.fillStyle = PALETTE.muted;
        ctx.textAlign = "center";
        ctx.font = `600 14px ${LATIN_SERIF}`;
        ctx.fillText("ORIGINAL INSCRIPTION", W / 2, y + ph + 24);
      },
    });
  }

  // ---- Text blocks -------------------------------------------------
  const blockGap = 34;

  const addTextBlock = (
    label: string,
    body: string,
    font: string,
    lineGap: number,
    color: string,
    opts: { center?: boolean; italic?: boolean; maxLines?: number } = {}
  ) => {
    const maxLines = opts.maxLines ?? 10;
    mctx.font = font;
    const lines = wrapText(mctx, body, CW, maxLines);
    if (!lines.length) return;
    const lh = Math.round(lineGap);
    const height = 30 + 10 + lines.length * lh + 6;
    sections.push({
      height,
      draw: (ctx, y) => {
        // label chip
        mctx.font = `700 13px ${fonts.dev}`;
        const labelW = mctx.measureText(label).width + 26;
        const chipX = opts.center ? (W - labelW) / 2 : M;
        ctx.fillStyle = PALETTE.chip;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(chipX, y, labelW, 26, 13);
          ctx.fill();
        } else {
          ctx.fillRect(chipX, y, labelW, 26);
        }
        ctx.fillStyle = PALETTE.frame;
        ctx.textAlign = "center";
        ctx.font = `700 13px ${fonts.dev}`;
        ctx.fillText(label, chipX + labelW / 2, y + 17.5);
        // body
        ctx.font = font;
        ctx.fillStyle = color;
        if (opts.center) {
          ctx.textAlign = "center";
          lines.forEach((ln, i) =>
            ctx.fillText(ln, W / 2, y + 30 + 10 + i * lh)
          );
        } else {
          ctx.textAlign = "left";
          lines.forEach((ln, i) =>
            ctx.fillText(ln, M, y + 30 + 10 + i * lh)
          );
        }
      },
    });
  };

  const sanskrit = (input.sanskrit ?? "").trim();
  if (sanskrit) {
    mctx.font = `400 30px ${fonts.dev}`;
    const lines = wrapText(mctx, sanskrit, CW, 10);
    const centered = lines.length <= 2;
    addTextBlock(
      "संस्कृतम् · SANSKRIT",
      sanskrit,
      `400 30px ${fonts.dev}`,
      52,
      PALETTE.sanskrit,
      { center: centered, maxLines: 10 }
    );
  }

  const iast = (input.transliteration ?? "").trim();
  if (iast) {
    addTextBlock(
      "IAST TRANSLITERATION",
      iast,
      `italic 400 19px ${LATIN_SERIF}`,
      32,
      PALETTE.muted,
      { maxLines: 6 }
    );
  }

  const english = (input.english ?? "").trim();
  if (english) {
    mctx.font = `400 22px ${LATIN_SERIF}`;
    const lines = wrapText(mctx, english, CW, 8);
    const centered = lines.length <= 1;
    addTextBlock(
      "ENGLISH",
      english,
      `400 22px ${LATIN_SERIF}`,
      37,
      PALETTE.ink,
      { center: centered, maxLines: 8 }
    );
  }

  const kannada = (input.kannada ?? "").trim();
  if (kannada) {
    addTextBlock(
      "ಕನ್ನಡ · KANNADA",
      kannada,
      `400 25px ${fonts.kan}`,
      44,
      PALETTE.ink,
      { maxLines: 8 }
    );
  }

  // ---- Footer ------------------------------------------------------
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const footerHeight = 86;
  sections.push({
    height: footerHeight,
    draw: (ctx, y) => {
      ctx.strokeStyle = PALETTE.frameInner;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(M, y + 14);
      ctx.lineTo(W - M, y + 14);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `600 14px ${LATIN_SERIF}`;
      const note = input.engineNote
        ? `Generated by LipiSetu · ${input.engineNote}`
        : "Generated by LipiSetu";
      ctx.fillText(note, W / 2, y + 42);
      ctx.font = `400 13px ${LATIN_SERIF}`;
      ctx.fillText(dateStr, W / 2, y + 64);
    },
  });

  // ---- Compose height ---------------------------------------------
  let total = 72; // top padding inside frame
  total += sections.reduce((acc, s) => acc + s.height + blockGap, 0);
  total += 40 - blockGap; // bottom padding (remove trailing gap)

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = Math.max(total, 640);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");

  // background
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // double frame
  ctx.strokeStyle = PALETTE.frame;
  ctx.lineWidth = 3;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(30.5, 30.5, W - 61, canvas.height - 61, 18);
    ctx.stroke();
  } else {
    ctx.strokeRect(30.5, 30.5, W - 61, canvas.height - 61);
  }
  ctx.strokeStyle = PALETTE.frameInner;
  ctx.lineWidth = 1;
  ctx.strokeRect(44.5, 44.5, W - 89, canvas.height - 89);

  // draw sections
  let y = 72;
  for (const s of sections) {
    s.draw(ctx, y);
    y += s.height + blockGap;
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

/** Trigger a browser download for a data URL. */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
