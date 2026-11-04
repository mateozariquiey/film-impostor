// Escribe public/sw.js después de `next build`: el service worker necesita la lista exacta de los
// archivos con hash de esa compilación para poder guardarlos todos de una vez, antes de la primera
// recarga sin conexión. Sin dependencias: solo hay una página y todo lo que usa es estático.
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const nextDir = join(root, ".next");

async function listFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

const toUrl = (file, base) => "/" + relative(base, file).split(sep).map(encodeURIComponent).join("/");

const buildId = (await readFile(join(nextDir, "BUILD_ID"), "utf8")).trim();
const nextStatic = await listFiles(join(nextDir, "static"));
const publicFiles = await listFiles(join(root, "public", "icons"));

const urls = [
  "/",
  "/en",
  "/manifest.webmanifest",
  "/en/manifest.webmanifest",
  "/icon.svg",
  "/apple-icon.png",
  ...publicFiles.map((file) => toUrl(file, join(root, "public"))),
  ...nextStatic.map((file) => `/_next/static/${toUrl(file, join(nextDir, "static")).slice(1)}`),
];

const template = await readFile(join(root, "scripts", "sw.template.js"), "utf8");
const sw = template
  .replace("__VERSION__", buildId)
  .replace('"__URLS__"', JSON.stringify(urls));

await writeFile(join(root, "public", "sw.js"), sw);
console.log(`public/sw.js: ${urls.length} archivos para funcionar sin conexión (${buildId})`);
