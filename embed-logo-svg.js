import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PNG_SRC = 'C:/Users/akash/.gemini/antigravity/brain/65e96f62-92fc-44cc-b46b-e1dfde01851e/jobshield_perfect_mark_clean.png';
const SVG_LOGO_OUT = path.join(__dirname, 'apps/web/public/branding/jobshield-logo.svg');

async function run() {
  const pngData = fs.readFileSync(PNG_SRC);
  const base64 = pngData.toString('base64');
  const dataUri = `data:image/png;base64,${base64}`;

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" fill="none">
  <!-- Embedded pixel-perfect shield mark -->
  <image href="${dataUri}" x="15" y="10" width="150" height="150" />

  <!-- JOB in teal -->
  <text x="185" y="92" font-family="'Arial Black', 'Helvetica Neue', 'Impact', sans-serif" font-weight="900" font-size="56" fill="#3CFFD0" letter-spacing="-2">JOB</text>
  <!-- SHIELD in white -->
  <text x="185" y="148" font-family="'Arial Black', 'Helvetica Neue', 'Impact', sans-serif" font-weight="900" font-size="56" fill="#FFFFFF" letter-spacing="-2">SHIELD</text>

  <!-- Tagline -->
  <text x="185" y="174" font-family="'Arial', 'Helvetica Neue', sans-serif" font-weight="500" font-size="13" fill="rgba(180,220,215,0.8)" letter-spacing="2.5">PROTECTING YOUR PROFESSIONAL FUTURE</text>
</svg>`;

  fs.writeFileSync(SVG_LOGO_OUT, svgContent);

  console.log('✓ jobshield-logo.svg successfully updated with embedded high-res transparent PNG!');
}

run().catch(console.error);
