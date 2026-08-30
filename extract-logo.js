import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC = 'C:/Users/akash/.gemini/antigravity/brain/65e96f62-92fc-44cc-b46b-e1dfde01851e/.user_uploaded/media_1786437036213.jpg';
const EXT_ASSETS = path.join(__dirname, 'apps/extension/assets');
const WEB_BRANDING = path.join(__dirname, 'apps/web/public/branding');

// Shield occupies roughly the center of the 1024×576 hero image.
// Measured from the image: shield left≈382, top≈42, right≈645, bottom≈352
// Add a small padding so the glow is included.
const CROP = { left: 365, top: 30, width: 295, height: 330 };

async function run() {
  // --- Extension icon PNGs (Chrome Manifest V3 requires PNG) ---
  const extSizes = [16, 32, 48, 128];
  for (const s of extSizes) {
    const out = path.join(EXT_ASSETS, `jobshield-icon-${s}.png`);
    await sharp(SRC)
      .extract(CROP)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`✓ Extension ${s}×${s} → ${out}`);
  }

  // --- Popup mark PNG (for <img> use in popup header) ---
  const markOut = path.join(EXT_ASSETS, 'jobshield-mark.png');
  await sharp(SRC)
    .extract(CROP)
    .resize(64, 72, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(markOut);
  console.log(`✓ Popup mark 64×72 → ${markOut}`);

  // --- Web branding: mark PNG (for favicon + small UI) ---
  const webMarkOut = path.join(WEB_BRANDING, 'jobshield-mark.png');
  await sharp(SRC)
    .extract(CROP)
    .resize(128, 144, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(webMarkOut);
  console.log(`✓ Web mark 128×144 → ${webMarkOut}`);

  // --- Web branding: hero PNG (full original, just cropped to shield) ---
  const heroOut = path.join(WEB_BRANDING, 'jobshield-hero.png');
  await sharp(SRC)
    .extract(CROP)
    .resize(512, 574, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 6 })
    .toFile(heroOut);
  console.log(`✓ Hero 512×574 → ${heroOut}`);

  console.log('\n✅ All real logo assets extracted!');
}

run().catch(console.error);
