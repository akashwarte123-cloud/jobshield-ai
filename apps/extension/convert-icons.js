import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, 'assets');

const sizes = [16, 32, 48, 128];

async function convertAll() {
  for (const size of sizes) {
    const svgPath = path.join(assetsDir, `jobshield-icon-${size}.svg`);
    const pngPath = path.join(assetsDir, `jobshield-icon-${size}.png`);

    if (!fs.existsSync(svgPath)) {
      console.warn(`SVG not found: ${svgPath}`);
      continue;
    }

    const svgBuffer = fs.readFileSync(svgPath);
    await sharp(svgBuffer)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(pngPath);

    console.log(`✓ ${size}x${size} PNG written: ${pngPath}`);
  }
  console.log('\n✅ All PNG icons generated!');
}

convertAll().catch(console.error);
