import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PNG_SRC = 'C:/Users/akash/.gemini/antigravity/brain/65e96f62-92fc-44cc-b46b-e1dfde01851e/jobshield_perfect_mark_clean.png';
const SVG_MARK_OUT = path.join(__dirname, 'apps/web/public/branding/jobshield-mark.svg');
const SVG_FAVICON_OUT = path.join(__dirname, 'apps/web/public/favicon.svg');

async function run() {
  const pngData = fs.readFileSync(PNG_SRC);
  const base64 = pngData.toString('base64');
  const dataUri = `data:image/png;base64,${base64}`;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 970" width="100%" height="100%">
  <image href="${dataUri}" x="0" y="0" width="960" height="970" />
</svg>`;

  fs.writeFileSync(SVG_MARK_OUT, svgContent);
  fs.writeFileSync(SVG_FAVICON_OUT, svgContent);

  console.log('✓ jobshield-mark.svg and favicon.svg successfully updated with embedded high-res transparent PNG!');
}

run().catch(console.error);
