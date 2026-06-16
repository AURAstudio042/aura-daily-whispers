import { toPng } from "html-to-image";

const STORY_W = 1080;
const STORY_H = 1920;

async function nodeToStoryBlob(node: HTMLElement, title?: string): Promise<Blob> {
  // Render node to PNG dataURL at high pixel ratio
  const rect = node.getBoundingClientRect();
  const pixelRatio = Math.min(3, Math.max(2, STORY_W / Math.max(rect.width, 1)));

  const dataUrl = await toPng(node, {
    pixelRatio,
    backgroundColor: "#0a0714",
    cacheBust: true,
    skipFonts: false,
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, STORY_H);
  grad.addColorStop(0, "#1a0d2e");
  grad.addColorStop(0.5, "#0a0714");
  grad.addColorStop(1, "#160b24");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // Soft glow
  const glow = ctx.createRadialGradient(STORY_W / 2, 300, 0, STORY_W / 2, 300, 700);
  glow.addColorStop(0, "rgba(139,92,246,0.35)");
  glow.addColorStop(1, "rgba(139,92,246,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // Title (optional)
  if (title) {
    ctx.fillStyle = "rgba(183,148,212,0.9)";
    ctx.font = "300 28px ui-sans-serif, system-ui, -apple-system, Segoe UI";
    ctx.textAlign = "center";
    const letters = title.toUpperCase().split("").join(" · ");
    ctx.fillText(letters, STORY_W / 2, 180);
  }

  // Fit image into story area with padding
  const padX = 80;
  const topY = title ? 240 : 160;
  const bottomReserve = 220; // for watermark
  const maxW = STORY_W - padX * 2;
  const maxH = STORY_H - topY - bottomReserve;
  const scale = Math.min(maxW / img.width, maxH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = (STORY_W - drawW) / 2;
  const dy = topY + (maxH - drawH) / 2;

  // Rounded clip + soft shadow
  const radius = 32;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  roundRectPath(ctx, dx, dy, drawW, drawH, radius);
  ctx.fillStyle = "#0a0714";
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRectPath(ctx, dx, dy, drawW, drawH, radius);
  ctx.clip();
  ctx.drawImage(img, dx, dy, drawW, drawH);
  ctx.restore();

  // Watermark
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "300 44px ui-serif, Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.fillText("— AURA ✨", STORY_W / 2, STORY_H - 110);
  ctx.fillStyle = "rgba(183,148,212,0.7)";
  ctx.font = "300 22px ui-sans-serif, system-ui";
  ctx.fillText("günlük ritüelin", STORY_W / 2, STORY_H - 70);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob failed"))), "image/png", 0.95)
  );
  return blob;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function shareNodeAsStory(
  node: HTMLElement | null,
  opts: { title?: string; text?: string; filename?: string } = {},
): Promise<void> {
  if (!node) return;
  const blob = await nodeToStoryBlob(node, opts.title);
  const filename = opts.filename ?? "aura.png";
  const file = new File([blob], filename, { type: "image/png" });

  const nav: any = typeof navigator !== "undefined" ? navigator : null;
  if (nav?.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({
        files: [file],
        title: "AURA",
        text: opts.text ?? "— AURA ✨",
      });
      return;
    } catch (e: any) {
      if (e?.name === "AbortError") return;
    }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
