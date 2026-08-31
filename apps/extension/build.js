import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to recursively copy directories
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

function processFile(distName, rootName) {
  const sourceFile = path.join(__dirname, 'dist', distName);
  const targetFile = path.join(__dirname, '../../extension', rootName);

  if (fs.existsSync(sourceFile)) {
    let content = fs.readFileSync(sourceFile, 'utf8');
    // Strip export {}; and module decorations for Chrome extension compatibility
    content = content.replace(/export\s*\{\s*\}\s*;?/g, '');
    
    // Inject API Base URL placeholder replacement
    const rawApiUrl = process.env.EXTENSION_API_URL || process.env.VITE_API_URL;
    const targetApiUrl = (rawApiUrl && rawApiUrl.trim()) 
      ? rawApiUrl.trim() 
      : (process.env.NODE_ENV === 'production' ? '/api/v1' : 'http://localhost:8000/api/v1');

    content = content.replace(/__JOBSHIELD_API_URL__/g, targetApiUrl.replace(/\/+$/, ''));

    // Ensure target folder exists
    const targetDir = path.dirname(targetFile);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log(`✓ Processed and copied dist/${distName} → extension/${rootName}`);
  } else {
    console.error(`Error: dist/${distName} not found`);
    process.exit(1);
  }
}

// 1. Process and copy JavaScript scripts with export stripping
processFile('content.js', 'content.js');
processFile('background.js', 'background.js');
processFile('popup.js', 'popup.js');

// 2. Process and flat-copy popup.html
const popupHtmlSrc = path.join(__dirname, 'src/popup.html');
const popupHtmlDest = path.join(__dirname, '../../extension/popup.html');
if (fs.existsSync(popupHtmlSrc)) {
  let html = fs.readFileSync(popupHtmlSrc, 'utf8');
  // Rewrite script path to refer to the flat structure
  html = html.replace('../dist/popup.js', 'popup.js');
  fs.writeFileSync(popupHtmlDest, html, 'utf8');
  console.log(`✓ Synchronized and rewritten popup.html → extension/popup.html`);
} else {
  console.error('Error: src/popup.html not found');
  process.exit(1);
}

// 3. Process and flat-copy manifest.json
const manifestSrc = path.join(__dirname, 'manifest.json');
const manifestDest = path.join(__dirname, '../../extension/manifest.json');
if (fs.existsSync(manifestSrc)) {
  let manifestRaw = fs.readFileSync(manifestSrc, 'utf8');
  let manifest = JSON.parse(manifestRaw);
  
  // Adjust paths in the manifest structure
  if (manifest.background && manifest.background.service_worker) {
    manifest.background.service_worker = 'background.js';
  }
  if (manifest.content_scripts) {
    manifest.content_scripts.forEach(script => {
      if (script.js) {
        script.js = script.js.map(jsFile => jsFile === 'dist/content.js' ? 'content.js' : jsFile);
      }
    });
  }
  if (manifest.action && manifest.action.default_popup) {
    manifest.action.default_popup = 'popup.html';
  }

  fs.writeFileSync(manifestDest, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`✓ Synchronized and rewritten manifest.json → extension/manifest.json`);
} else {
  console.error('Error: manifest.json not found');
  process.exit(1);
}

// 4. Synchronize assets directory
const assetsSrc = path.join(__dirname, 'assets');
const assetsDest = path.join(__dirname, '../../extension/assets');
if (fs.existsSync(assetsSrc)) {
  copyFolderSync(assetsSrc, assetsDest);
  console.log('✓ Synchronized assets folder → extension/assets/');
} else {
  console.log('No assets folder found to copy.');
}

// 5. Package into ZIP for user distribution
try {
  const packageScript = path.join(__dirname, '../../scripts/package_extension.py');
  execSync(`python "${packageScript}"`, { stdio: 'inherit' });
} catch (e) {
  console.warn('Warning: Could not automatically package extension ZIP via Python:', e.message);
}

console.log('🎉 Extension build and root synchronization complete!');
