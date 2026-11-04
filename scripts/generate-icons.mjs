// Dibuja los PNG de la app a partir de src/app/icon.svg. Se ejecuta a mano (`node scripts/generate-icons.mjs`) si cambia el icono.
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const svg = await readFile(new URL("../src/app/icon.svg", import.meta.url), "utf8");
const sizes = [
  { path: "public/icons/icon-192.png", size: 192, inset: 0 },
  { path: "public/icons/icon-512.png", size: 512, inset: 0 },
  { path: "src/app/apple-icon.png", size: 180, inset: 0 },
  // Android recorta hasta un 20% por los bordes en los iconos adaptables.
  { path: "public/icons/maskable-512.png", size: 512, inset: 0.14 },
];

const browser = await chromium.launch();
for (const { path, size, inset } of sizes) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const padding = Math.round(size * inset);
  await page.setContent(
    `<!doctype html><body style="margin:0;background:#000;padding:${padding}px;box-sizing:border-box;width:${size}px;height:${size}px">` +
      svg.replace('width="64" height="64"', `width="${size - padding * 2}" height="${size - padding * 2}"`),
  );
  await page.screenshot({ path });
  await page.close();
}
await browser.close();
