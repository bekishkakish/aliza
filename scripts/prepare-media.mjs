import sharp from "sharp";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
const root = process.cwd();
await mkdir(".asset-sources", { recursive: true });
await mkdir("public/media", { recursive: true });
for (const file of await readdir(".asset-sources")) {
  if (!file.endsWith(".png")) continue;
  const name = path.parse(file).name;
  await sharp(`.asset-sources/${file}`)
    .webp({ quality: 84 })
    .toFile(`public/media/${name}.webp`);
  await sharp(`.asset-sources/${file}`)
    .resize({ width: 768 })
    .webp({ quality: 80 })
    .toFile(`public/media/${name}-768.webp`);
}
await sharp(".asset-sources/aliza-portrait.png")
  .grayscale()
  .webp({ quality: 84 })
  .toFile("public/media/aliza-credits.webp");
await sharp(".asset-sources/aliza-portrait.png")
  .grayscale()
  .resize({ width: 768 })
  .webp({ quality: 80 })
  .toFile("public/media/aliza-credits-768.webp");
const svg = Buffer.from(
  '<svg width="1200" height="630"><rect width="1200" height="630" fill="#09090b" fill-opacity=".4"/><text x="65" y="240" font-family="sans-serif" font-size="64" font-weight="bold" fill="#f1eee7">ПО ТУ СТОРОНУ</text><text x="65" y="330" font-family="sans-serif" font-size="76" font-weight="bold" fill="#f1eee7">КАДРА</text><text x="68" y="420" font-family="sans-serif" font-size="24" fill="#ccc8c0">Искусство видеть то, что скрыто</text><rect x="68" y="475" width="52" height="4" fill="#a71926"/></svg>',
);
await sharp(".asset-sources/theatre.png")
  .resize(1200, 630)
  .composite([{ input: svg }])
  .jpeg({ quality: 88 })
  .toFile("public/social.jpg");
console.log("Prepared local optimized media in", root);
