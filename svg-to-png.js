import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SVG_SRC = path.join(__dirname, 'apps/web/public/branding/jobshield-mark.svg');
const EXT_ASSETS = path.join(__dirname, 'apps/extension/assets');
const WEB_BRANDING = path.join(__dirname, 'apps/web/public/branding');

const svgBuf = fs.readFileSync(SVG_SRC);

async function exportPng(outPath, size, height) {
  await sharp(svgBuf)
    .resize(size, height ?? size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`✓ ${size}x${height ?? size} → ${path.basename(outPath)}`);
}

async function run() {
  // Extension action icons (square, Chrome requires PNG)
  await exportPng(path.join(EXT_ASSETS, 'jobshield-icon-16.png'), 16);
  await exportPng(path.join(EXT_ASSETS, 'jobshield-icon-32.png'), 32);
  await exportPng(path.join(EXT_ASSETS, 'jobshield-icon-48.png'), 48);
  await exportPng(path.join(EXT_ASSETS, 'jobshield-icon-128.png'), 128);

  // Popup header mark (slightly taller than square to preserve shield proportions)
  await exportPng(path.join(EXT_ASSETS, 'jobshield-mark.png'), 60, 69);

  // Web branding PNG
  await exportPng(path.join(WEB_BRANDING, 'jobshield-mark.png'), 200, 230);

  console.log('\n✅ All PNGs exported from the vector SVG!');
}

run().catch(console.error);
