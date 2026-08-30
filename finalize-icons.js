import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use the cleaned transparent AI-generated faithful recreation
const SRC = 'C:/Users/akash/.gemini/antigravity/brain/65e96f62-92fc-44cc-b46b-e1dfde01851e/jobshield_perfect_mark_clean.png';

const EXT_ASSETS = path.join(__dirname, 'apps/extension/assets');
const WEB_BRANDING = path.join(__dirname, 'apps/web/public/branding');

// The generated image is square 1024x1024, shield is centered with transparent padding
// Crop slightly to tighten around the shield (remove excess white/transparent border)
const CROP = { left: 30, top: 20, width: 960, height: 970 };

async function exportAt(outPath, size) {
  await sharp(SRC)
    .extract(CROP)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`✓ ${size}×${size} → ${path.relative(path.join(__dirname), outPath)}`);
}

async function run() {
  // Extension chrome action icons
  await exportAt(path.join(EXT_ASSETS, 'jobshield-icon-16.png'),  16);
  await exportAt(path.join(EXT_ASSETS, 'jobshield-icon-32.png'),  32);
  await exportAt(path.join(EXT_ASSETS, 'jobshield-icon-48.png'),  48);
  await exportAt(path.join(EXT_ASSETS, 'jobshield-icon-128.png'), 128);

  // Popup header mark
  await exportAt(path.join(EXT_ASSETS, 'jobshield-mark.png'), 64);

  // Web branding
  await exportAt(path.join(WEB_BRANDING, 'jobshield-mark.png'), 256);

  console.log('\n✅ All icons generated from the faithful mark recreation!');
}

run().catch(console.error);
