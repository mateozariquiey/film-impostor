// Dibuja la imagen para compartir de cada idioma, con el mismo aspecto que la app en tema oscuro.
// No forma parte de la compilación: se ejecuta a mano (`node scripts/generate-share-images.mjs`) si
// cambia el lema o la marca, y necesita conexión para descargar Chivo.
import { chromium } from "@playwright/test";

const TAGLINES = {
  "src/app/(es)": { lang: "es", text: "Todos ven la misma película, menos uno." },
  "src/app/en": { lang: "en", text: "All but one see the same movie." },
};

const html = ({ lang, text }) => `<!doctype html>
<html lang="${lang}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Chivo:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { position: relative; width: 1200px; height: 630px; overflow: hidden; background: #1b2220; color: #eeeae0; font-family: Chivo; }
  h1 { position: absolute; left: 80px; top: 72px; font-size: 150px; line-height: 0.98; font-weight: 600; letter-spacing: -0.032em; }
  p { position: absolute; left: 80px; top: 503px; font-size: 45px; line-height: 1.2; }
  .puntos { position: absolute; right: 80px; top: 96px; display: flex; gap: 20px; }
  .puntos i { width: 34px; height: 34px; border-radius: 50%; background: currentColor; }
  .puntos i:last-child { background: none; border: 7px solid #d4a44c; }
</style></head>
<body><h1>Film<br>Impostor</h1><div class="puntos"><i></i><i></i><i></i><i></i><i></i></div><p>${text}</p></body></html>`;

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
