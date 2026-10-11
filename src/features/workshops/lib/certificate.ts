"use client";

import { CERTIFICATE } from "@/features/workshops/lib/certificate-config";

export interface CertificateData {
  fullName: string;
  title: string;
  typeLabel: string;
  presenterName: string;
  /** Already formatted dd/mm/yyyy. */
  date: string;
}

interface Segment {
  text: string;
  bold?: boolean;
  color?: string;
  /** Latin digits / slashes: drawn left-to-right so "12/09/2026" keeps its order. */
  ltr?: boolean;
}

const C = CERTIFICATE;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

// next/font renames the family (e.g. "__Tajawal_a1b2c3"); read the real one.
const fontFamily = () => getComputedStyle(document.body).fontFamily;

const font = (family: string, size: number, bold?: boolean) => `${bold ? 700 : 400} ${size}px ${family}`;

function fitFontSize(ctx: CanvasRenderingContext2D, family: string, text: string, start: number, min: number, maxWidth: number) {
  let size = start;
  ctx.font = font(family, size, true);
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = font(family, size, true);
  }
  return size;
}

// Draws segments as one right-to-left line centred on `centerX`: the first
// segment is the rightmost one, as in the original design.
// A line wider than the panel (e.g. a long presenter name) shrinks to fit instead of overflowing.
function drawRtlLine(ctx: CanvasRenderingContext2D, family: string, requestedSize: number, segments: Segment[], y: number) {
  const measure = (size: number) => {
    ctx.font = font(family, size);
    const gap = ctx.measureText(" ").width;
    const widths = segments.map((segment) => {
      ctx.font = font(family, size, segment.bold);
      return ctx.measureText(segment.text).width;
    });
    return { gap, widths, total: widths.reduce((sum, w) => sum + w, 0) + gap * (segments.length - 1) };
  };

  let size = requestedSize;
  let { gap, widths, total } = measure(size);
  if (total > C.maxTextWidth) {
    size = Math.floor((size * C.maxTextWidth) / total);
    ({ gap, widths, total } = measure(size));
  }

  let x = C.centerX + total / 2;
  segments.forEach((segment, i) => {
    ctx.font = font(family, size, segment.bold);
    ctx.fillStyle = segment.color ?? C.colors.ink;
    ctx.direction = segment.ltr ? "ltr" : "rtl";
    ctx.textAlign = "right";
    ctx.fillText(segment.text, x, y);
    x -= widths[i]! + gap;
  });
}

// Splits a long title into two balanced lines when it doesn't fit on one.
function splitTitle(ctx: CanvasRenderingContext2D, family: string, title: string): string[] {
  ctx.font = font(family, C.workshopTitle.fontSize, true);
  if (ctx.measureText(title).width <= C.maxTextWidth) return [title];
  const words = title.split(" ");
  let best = [title];
  let bestWidth = Infinity;
  for (let i = 1; i < words.length; i++) {
    const lines = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    if (widest < bestWidth) {
      best = lines;
      bestWidth = widest;
    }
  }
  return best;
}

async function renderCertificate(data: CertificateData): Promise<HTMLCanvasElement> {
  const family = fontFamily();
  const allText = `${data.fullName}${data.title}${data.typeLabel}${data.presenterName}${data.date}${C.closingText}حضر/ت ضمن مبادرتنا البيئيةبعنوانبتقديمبتاريخ0123456789/ `;
  const [template] = await Promise.all([
    loadImage(C.templateSrc),
    document.fonts.load(font(family, 100, true), allText),
    document.fonts.load(font(family, 100, false), allText),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = C.width;
  canvas.height = C.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");
  ctx.drawImage(template, 0, 0, C.width, C.height);

  // Attendee name: shrinks to fit rather than clipping.
  const nameSize = fitFontSize(ctx, family, data.fullName, C.name.fontSize, C.name.minFontSize, C.maxTextWidth);
  ctx.font = font(family, nameSize, true);
  ctx.fillStyle = C.colors.mauve;
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillText(data.fullName, C.centerX, C.name.y);

  const p = C.paragraph;
  let y: number = p.firstLineY;
  drawRtlLine(ctx, family, p.fontSize, [{ text: "حضر/ت ضمن مبادرتنا البيئية" }, { text: data.typeLabel, bold: true }, { text: "بعنوان" }], y);

  const titleLines = splitTitle(ctx, family, data.title);
  const longestTitleLine = titleLines.reduce((a, b) => (a.length >= b.length ? a : b));
  const titleSize = fitFontSize(ctx, family, longestTitleLine, C.workshopTitle.fontSize, 64, C.maxTextWidth);

  // A two-line title tightens the spacing so the closing line stays above the logo.
  const twoLines = titleLines.length > 1;
  const gap = twoLines ? p.lineGap * 0.82 : p.lineGap;
  const titleLineHeight = twoLines ? C.workshopTitle.lineHeight * 0.87 : C.workshopTitle.lineHeight;
  y += gap;
  titleLines.forEach((line, i) => {
    if (i > 0) y += titleLineHeight;
    drawRtlLine(ctx, family, titleSize, [{ text: line, bold: true, color: C.colors.mauve }], y);
  });

  y += gap;
  drawRtlLine(ctx, family, p.fontSize, [{ text: "بتقديم" }, { text: data.presenterName, bold: true }, { text: "بتاريخ" }, { text: data.date, ltr: true }], y);

  y += gap;
  drawRtlLine(ctx, family, p.fontSize, [{ text: C.closingText }], y);

  return canvas;
}

function save(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function downloadCertificatePng(data: CertificateData) {
  const canvas = await renderCertificate(data);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not encode the certificate image");
  const url = URL.createObjectURL(blob);
  save(url, `شهادة حضور - ${data.fullName}.png`);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function downloadCertificatePdf(data: CertificateData) {
  const [canvas, { jsPDF }] = await Promise.all([renderCertificate(data), import("jspdf")]);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 297, 210);
  pdf.save(`شهادة حضور - ${data.fullName}.pdf`);
}
