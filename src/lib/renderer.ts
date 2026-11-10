import { describeScene, options } from "./scene";
import type { SceneSettings } from "./scene";
import { assetUrl } from "./assets";

const images = new Map<string, Promise<HTMLImageElement>>();
export function getImage(name: string) {
  if (!images.has(name))
    images.set(
      name,
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => {
          images.delete(name);
          reject(new Error("Не удалось загрузить изображение сцены."));
        };
        image.src = assetUrl(`media/${name}.webp`);
      }),
    );
  return images.get(name)!;
}
export const environments = [
  "theatre",
  "room",
  "street",
  "corridor",
  "aliza-portrait",
];
export async function drawScene(canvas: HTMLCanvasElement, s: SceneSettings) {
  const source =
    s.environment === 0
      ? ["theatre", "medium", "close"][s.shot]
      : environments[s.environment];
  const image = await getImage(source);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Браузер не поддерживает Canvas.");
  const w = canvas.width,
    h = canvas.height;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, w, h);
  const lightFilters = [
    "saturate(.48) brightness(.73) contrast(1.08)",
    "sepia(.2) saturate(.85) brightness(1.08)",
    "saturate(.42) contrast(1.6) brightness(.9)",
    "saturate(.25) brightness(.7) contrast(1.25)",
  ];
  const genreFilters = [
    "",
    " contrast(1.22) saturate(.6)",
    " brightness(1.13) contrast(.87)",
    " grayscale(.9) contrast(1.15)",
  ];
  ctx.filter = lightFilters[s.light] + genreFilters[s.genre];
  const zoom =
    (s.environment === 0 ? 1 : [1, 1.32, 1.75][s.shot]) *
    (s.composition === 0 ? 1.35 : 1);
  let iw = w * zoom,
    ih = (iw * image.height) / image.width;
  if (ih < h) {
    ih = h;
    iw = (ih * image.width) / image.height;
  }
  let dx = s.composition === 0 ? w * 0.5 - iw * 0.76 : w - iw;
  // Cover the canvas while bringing the focal area toward the centre.
  dx = Math.max(w - iw, Math.min(0, dx));
  let dy = (h - ih) * 0.4;
  if (s.composition === 2) {
    iw = w * 0.85;
    ih = (iw * image.height) / image.width;
    dx = w * 0.15;
    dy = (h - ih) / 2;
  }
  ctx.drawImage(image, dx, dy, iw, ih);
  ctx.filter = "none";
  if (s.composition === 2) {
    const blend = ctx.createLinearGradient(w * 0.2, 0, w * 0.5, 0);
    blend.addColorStop(0, "#09090b");
    blend.addColorStop(1, "transparent");
    ctx.fillStyle = blend;
    ctx.fillRect(0, 0, w * 0.5, h);
  }
  ctx.globalCompositeOperation = "screen";
  const colors = [
    "rgba(43,90,140,.22)",
    "rgba(170,102,40,.12)",
    "rgba(240,224,193,.04)",
    "rgba(210,5,17,.48)",
  ];
  ctx.fillStyle = colors[s.light];
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  const shadow = ctx.createLinearGradient(0, 0, w, h);
  shadow.addColorStop(0, s.light === 2 ? "rgba(0,0,0,.75)" : "rgba(0,0,0,.12)");
  shadow.addColorStop(0.65, "transparent");
  shadow.addColorStop(1, s.light === 3 ? "rgba(22,0,0,.7)" : "rgba(0,0,0,.12)");
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, w, h);
  const moodAlpha = [0.65, 0.36, 0.12, 0.8][s.mood];
  const vignette = ctx.createRadialGradient(
    w * 0.65,
    h * 0.42,
    h * 0.1,
    w * 0.5,
    h * 0.5,
    w * 0.65,
  );
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, `rgba(0,0,0,${moodAlpha})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  if (s.mood === 1) {
    ctx.fillStyle = "rgba(180,155,119,.09)";
    ctx.fillRect(0, 0, w, h);
  }
  if (s.mood === 3) {
    ctx.fillStyle = "rgba(80,0,0,.12)";
    ctx.fillRect(0, 0, w, h);
  }
  const bars = [h * 0.045, h * 0.09, h * 0.025, h * 0.115][s.genre];
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, w, bars);
  ctx.fillRect(0, h - bars, w, bars);
  ctx.restore();
}
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  line: number,
) {
  let current = "";
  for (const word of text.split(" ")) {
    const next = `${current}${word} `;
    if (ctx.measureText(next).width > width && current) {
      ctx.fillText(current.trim(), x, y);
      current = `${word} `;
      y += line;
    } else current = next;
  }
  ctx.fillText(current.trim(), x, y);
  return y;
}
export async function exportPoster(settings: SceneSettings): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 900;
  await drawScene(canvas, settings);
  const poster = document.createElement("canvas");
  poster.width = 1600;
  poster.height = 1320;
  const ctx = poster.getContext("2d")!;
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, 1600, 1320);
  ctx.drawImage(canvas, 0, 0);
  const { title, description } = describeScene(settings);
  ctx.fillStyle = "#b9b5af";
  ctx.font = '18px "Manrope Variable", sans-serif';
  ctx.fillText("РЕЖИССЁРСКИЙ ЭТЮД / ПО ТУ СТОРОНУ КАДРА", 64, 955);
  ctx.fillStyle = "#f1eee7";
  ctx.font = '42px "Unbounded Variable", sans-serif';
  ctx.fillText(title.toUpperCase(), 64, 1025);
  ctx.fillStyle = "#b9b5af";
  ctx.font = '20px "Manrope Variable", sans-serif';
  const line = `${options.genre[settings.genre]} · ${options.light[settings.light]} · ${options.shot[settings.shot]} план · ${options.mood[settings.mood]} · ${options.composition[settings.composition]}`;
  ctx.fillText(line, 64, 1074);
  wrapText(ctx, description, 64, 1120, 1450, 30);
  ctx.font = '16px "Manrope Variable", sans-serif';
  ctx.fillText(
    "Создано в режиссёрской лаборатории проекта «По ту сторону кадра» · Автор проекта — Ализа · 2026",
    64,
    1280,
  );
  return new Promise((resolve, reject) =>
    poster.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Не удалось создать PNG.")),
      "image/png",
    ),
  );
}
