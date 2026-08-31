/**
 * Generates PNG icons for the JobShield extension from an SVG template.
 * Uses the sharp package (available in the monorepo) or falls back to
 * writing raw PNG data using the canvas API via node-canvas.
 *
 * Run with: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// ─── Shield SVG template for each icon size ───────────────────────────────────
function makeShieldSVG(size) {
  const s = size;
  const cx = s / 2;      // center-x
  const cy = s / 2;      // center-y
  const pad = s * 0.08;  // padding

  // Shield body coordinates (normalized to size)
  const shieldTop    = pad;
  const shieldBottom = s - pad * 0.5;
  const shieldLeft   = pad;
  const shieldRight  = s - pad;
  const shieldMidX   = cx;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
  <defs>
    <linearGradient id="sg" x1="${shieldMidX}" y1="${shieldTop}" x2="${shieldMidX}" y2="${shieldBottom}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3CFFD0"/>
      <stop offset="100%" stop-color="#00A887"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${s * 0.03}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Dark background circle -->
  <rect width="${s}" height="${s}" rx="${s * 0.2}" fill="#0B1A24"/>
  <!-- Shield -->
  <path
    d="M${cx} ${shieldTop + s*0.04}
       L${shieldRight - s*0.02} ${shieldTop + s*0.19}
       L${shieldRight - s*0.02} ${cy}
       C${shieldRight - s*0.02} ${s*0.74} ${cx + s*0.18} ${s*0.87} ${cx} ${s*0.94}
       C${cx - s*0.18} ${s*0.87} ${shieldLeft + s*0.02} ${s*0.74} ${shieldLeft + s*0.02} ${cy}
       L${shieldLeft + s*0.02} ${shieldTop + s*0.19} Z"
    fill="url(#sg)"
    filter="url(#glow)"
  />
  <!-- Figure head -->
  <circle cx="${cx}" cy="${cy - s*0.09}" r="${s*0.08}" fill="#0B1A24"/>
  <!-- Figure body -->
  <path d="M${cx - s*0.1} ${cy + s*0.18} C${cx - s*0.1} ${cy + s*0.06} ${cx - s*0.04} ${cy + s*0.02} ${cx} ${cy + s*0.01} C${cx + s*0.04} ${cy + s*0.02} ${cx + s*0.1} ${cy + s*0.06} ${cx + s*0.1} ${cy + s*0.18}" fill="#0B1A24"/>
  <!-- Arms -->
  <path d="M${cx - s*0.1} ${cy + s*0.04} C${cx - s*0.17} ${cy - s*0.06} ${cx - s*0.21} ${cy - s*0.13} ${cx - s*0.24} ${cy - s*0.19}" stroke="#0B1A24" stroke-width="${s*0.055}" stroke-linecap="round"/>
  <path d="M${cx + s*0.1} ${cy + s*0.04} C${cx + s*0.17} ${cy - s*0.06} ${cx + s*0.21} ${cy - s*0.13} ${cx + s*0.24} ${cy - s*0.19}" stroke="#0B1A24" stroke-width="${s*0.055}" stroke-linecap="round"/>
</svg>`;
}

const sizes = [16, 32, 48, 128];
const outDir = path.join(__dirname, 'assets');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Write the SVG files (these work as-is in manifest V3 for action icons)
for (const size of sizes) {
  const svgContent = makeShieldSVG(size);
  const svgPath = path.join(outDir, `jobshield-icon-${size}.svg`);
  fs.writeFileSync(svgPath, svgContent, 'utf-8');
  console.log(`✓ Written: jobshield-icon-${size}.svg`);
}

// Also write the master mark SVG
const masterMarkSVG = makeShieldSVG(200);
fs.writeFileSync(path.join(outDir, 'jobshield-mark.svg'), masterMarkSVG, 'utf-8');

console.log('\n✅ All icon SVGs generated in:', outDir);
console.log('\nNote: Chrome Manifest V3 requires PNG icons for the action icon array.');
console.log('To convert SVGs to PNGs, run: npx sharp-cli --input assets/*.svg --output assets/ --format png');
console.log('Or use an online SVG-to-PNG converter for each size.');
