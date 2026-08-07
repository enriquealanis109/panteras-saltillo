/**
 * Genera el PDF del Manual del Coordinador (Panteras Saltillo) — Módulo de Cobros
 * Renderiza scripts/manual-coordinador-cobros.html con Puppeteer (Chromium local de Playwright).
 * Ejecutar: node scripts/generar-manual-pdf.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname, extname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const TEMPLATE = join(__dir, "manual-coordinador-cobros.html");
const OUT = join(ROOT, "public", "manual-coordinador.pdf");
const ASSETS = join(ROOT, "manual-assets", "cobros");

function findChromium() {
  const playwrightDir = join(
    process.env.LOCALAPPDATA || "",
    "ms-playwright"
  );
  if (!existsSync(playwrightDir)) return null;
  const dirs = execSync(`dir /b "${playwrightDir}"`, { shell: "cmd.exe" })
    .toString()
    .split(/\r?\n/)
    .filter((d) => d.startsWith("chromium-"))
    .sort()
    .reverse();
  for (const d of dirs) {
    const exe = join(playwrightDir, d, "chrome-win64", "chrome.exe");
    if (existsSync(exe)) return exe;
  }
  return null;
}

function toDataUri(path) {
  if (!existsSync(path)) return null;
  const ext = extname(path).slice(1).toLowerCase();
  const mime = ext === "jpg" ? "jpeg" : ext;
  const buf = readFileSync(path);
  return `data:image/${mime};base64,${buf.toString("base64")}`;
}

// Construye un grid de capturas a partir de una lista de { file, caption }.
// Omite las que no existan. Si ninguna existe, regresa cadena vacía.
function screenGrid(items, cols = 2) {
  const found = items
    .map((it) => ({ ...it, src: toDataUri(join(ASSETS, it.file)) }))
    .filter((it) => it.src);
  if (found.length === 0) return "";
  const colsClass = cols === 1 ? "one" : cols === 2 ? "two" : "";
  const cells = found
    .map(
      (it) => `
    <div class="screen">
      <img src="${it.src}" alt="${it.caption}" />
      <div class="screen-caption">${it.caption}</div>
    </div>`
    )
    .join("");
  return `<div class="screens ${colsClass}">${cells}</div>`;
}

let html = readFileSync(TEMPLATE, "utf-8");

const logoPanteras = toDataUri(join(ROOT, "public", "icon-192.png"));
const logoFlowra = toDataUri(
  join(ROOT, "..", "flowra-landing", "public", "icon-512.png")
);

html = html.replaceAll("{{LOGO_PANTERAS}}", logoPanteras || "");
html = html.replaceAll("{{LOGO_FLOWRA}}", logoFlowra || "");

html = html.replace(
  "{{SCREENS_PANEL}}",
  screenGrid(
    [
      { file: "01-login.jpeg", caption: "Pantalla de inicio de sesión" },
      { file: "02-dashboard.jpeg", caption: "Panel principal del coordinador" },
    ],
    2
  )
);

html = html.replace(
  "{{SCREENS_CONCEPTO_1}}",
  screenGrid([{ file: "03-tabla-jugadores.jpeg", caption: "Tabla de cobros de la categoría" }], 1)
);

html = html.replace(
  "{{SCREENS_CONCEPTO_2}}",
  screenGrid(
    [
      { file: "04-nuevo-concepto.jpeg", caption: "Modal Nuevo concepto" },
      { file: "05-nuevo-concepto-monto.jpeg", caption: "Concepto con monto por jugador" },
    ],
    2
  )
);

html = html.replace(
  "{{SCREENS_CONCEPTO_3}}",
  screenGrid([{ file: "06-tabla-concepto-creado.jpeg", caption: "Concepto creado en la tabla" }], 1)
);

html = html.replace(
  "{{SCREENS_PRIMER_PAGO}}",
  screenGrid([{ file: "07-modal-primer-pago.jpeg", caption: "Registrar el primer pago" }], 1)
);

html = html.replace(
  "{{SCREENS_ABONO}}",
  screenGrid([{ file: "08-modal-abono.jpeg", caption: "Agregar un abono adicional" }], 1)
);

html = html.replace("{{SCREENS_RESUMEN}}", "");

html = html.replace(
  "{{SCREENS_COMPARTIR}}",
  screenGrid(
    [
      { file: "09-resumen-boton-png.jpeg", caption: "Botón Imagen PNG en el resumen" },
      { file: "10-compartir-whatsapp.jpeg", caption: "Menú para compartir por WhatsApp" },
    ],
    2
  )
);

html = html.replace(
  "{{SCREENS_EJEMPLO}}",
  screenGrid(
    [{ file: "ejemplo-imagen-whatsapp.png", caption: "Ejemplo de imagen generada para WhatsApp" }],
    1
  )
);

const chromiumPath = findChromium();
if (!chromiumPath) {
  console.error("No se encontró Chromium de Playwright. Instala con: npx playwright install chromium");
  process.exit(1);
}

const { default: puppeteer } = await import("puppeteer-core");
const browser = await puppeteer.launch({ executablePath: chromiumPath, headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle0" });
await page.pdf({
  path: OUT,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
});
await browser.close();

console.log(`PDF generado: ${OUT}`);
