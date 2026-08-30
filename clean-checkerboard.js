import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = 'C:/Users/akash/.gemini/antigravity/brain/65e96f62-92fc-44cc-b46b-e1dfde01851e/jobshield_perfect_mark_1786439900866.jpg';
const OUT = 'C:/Users/akash/.gemini/antigravity/brain/65e96f62-92fc-44cc-b46b-e1dfde01851e/jobshield_perfect_mark_clean.png';

async function clean() {
  const image = sharp(SRC);
  const { data, info } = await image
    .ensureAlpha() // Make sure we have 4 channels (RGBA)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const outputBuffer = Buffer.alloc(width * height * 4);

  // We want to make the checkerboard background transparent.
  // The checkerboard consists of white (approx 255, 255, 255) and gray (approx 204, 204, 204) squares.
  // The shield is teal (high green/blue, low red) and dark charcoal.
  // Let's do a flood fill or simple coordinate-based check, or color-based check.
  // Let's check color-based first:
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const outIdx = (y * width + x) * 4;

      // Check if it's the checkered background:
      // Typically r, g, b are very close to each other (grayscale) and brightness is high.
      const isGrayscale = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15;
      const brightness = (r + g + b) / 3;

      // The background checkerboard has gray squares around 200-210, white around 255.
      // The shield inner charcoal is very dark (r < 40, g < 40, b < 40), which might also be grayscale, but brightness is very low.
      if (isGrayscale && brightness > 100) {
        // Make it fully transparent
        outputBuffer[outIdx] = 0;
        outputBuffer[outIdx + 1] = 0;
        outputBuffer[outIdx + 2] = 0;
        outputBuffer[outIdx + 3] = 0;
      } else {
        // Keep the original pixel
        outputBuffer[outIdx] = r;
        outputBuffer[outIdx + 1] = g;
        outputBuffer[outIdx + 2] = b;
        outputBuffer[outIdx + 3] = 255;
      }
    }
  }

  await sharp(outputBuffer, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
  .png()
  .toFile(OUT);

  console.log('✓ Cleaned background image written to:', OUT);
}

clean().catch(console.error);
