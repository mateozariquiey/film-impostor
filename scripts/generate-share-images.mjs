// Dibuja la imagen para compartir de cada idioma, con el mismo aspecto que la app en tema oscuro.
// No forma parte de la compilación: se ejecuta a mano (`node scripts/generate-share-images.mjs`) si
// cambia el lema o la marca, y necesita conexión para descargar Archivo.
import { chromium } from "@playwright/test";

const TAGLINES = {
  "src/app/(es)": { lang: "es", text: "Todos ven la misma película, menos uno." },
  "src/app/en": { lang: "en", text: "All but one see the same movie." },
};

const html = ({ lang, text }) => `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { position: relative; width: 1200px; height: 630px; overflow: hidden; background: #000; color: #fff; font-family: Archivo, sans-serif; }
  h1 { position: absolute; left: 72px; top: 56px; font-size: 248px; line-height: 0.9; font-weight: 800; font-stretch: 62%; letter-spacing: -0.012em; }
  p { position: absolute; left: 76px; bottom: 58px; font-size: 42px; line-height: 1.2; }
  .huecos { position: absolute; right: 76px; top: 76px; display: flex; gap: 12px; }
  .huecos i { width: 44px; height: 66px; background: #fff; }
  .huecos i:last-child { background: #3f6ff2; }
</style></head>
<body><h1>Film<br>Impostor</h1><div class="huecos"><i></i><i></i><i></i><i></i><i></i></div><p>${text}</p></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [dir, tagline] of Object.entries(TAGLINES)) {
  await page.setContent(html(tagline), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  for (const name of ["opengraph-image.png", "twitter-image.png"]) {
    await page.screenshot({ path: `${dir}/${name}` });
  }
}
await browser.close();
