#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const EXTENSION_DIR = path.join(ROOT_DIR, 'extension-build');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

console.log('🚀 Building ZetaPay Browser Extension...\n');

// Step 1: Clean previous builds
console.log('1️⃣  Cleaning previous builds...');
if (fs.existsSync(OUT_DIR)) {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
}
if (fs.existsSync(EXTENSION_DIR)) {
  fs.rmSync(EXTENSION_DIR, { recursive: true, force: true });
}
console.log('✓ Clean complete\n');

// Step 2: Build Next.js app
console.log('2️⃣  Building Next.js app...');
try {
  execSync('yarn build', { cwd: ROOT_DIR, stdio: 'inherit' });
  console.log('✓ Next.js build complete\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Create extension directory structure
console.log('3️⃣  Creating extension directory...');
fs.mkdirSync(EXTENSION_DIR, { recursive: true });

// Copy Next.js output
console.log('   Copying Next.js output...');
copyRecursive(OUT_DIR, EXTENSION_DIR);

// Copy extension-specific files
console.log('   Copying extension files...');
const extensionFiles = ['manifest.json', 'background.js', 'content.js'];
extensionFiles.forEach(file => {
  const src = path.join(PUBLIC_DIR, file);
  const dest = path.join(EXTENSION_DIR, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`   ✓ ${file}`);
  }
});

// Copy images
console.log('   Copying images...');
const imagesDir = path.join(PUBLIC_DIR, 'images');
const destImagesDir = path.join(EXTENSION_DIR, 'images');
if (fs.existsSync(imagesDir)) {
  copyRecursive(imagesDir, destImagesDir);
}

console.log('✓ Extension directory created\n');

// Step 4: Update manifest for production
console.log('4️⃣  Updating manifest...');
const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.version = require('../package.json').version;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✓ Manifest updated\n');

// Step 5: Create zip package
console.log('5️⃣  Creating extension package...');
const zipName = `zetapay-extension-v${manifest.version}.zip`;
const zipPath = path.join(ROOT_DIR, zipName);

try {
  // Remove existing zip
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  
  // Create zip using PowerShell on Windows
  const psCommand = `Compress-Archive -Path "${EXTENSION_DIR}\\*" -DestinationPath "${zipPath}"`;
  execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });
  console.log(`✓ Package created: ${zipName}\n`);
} catch (error) {
  console.error('❌ Failed to create zip:', error.message);
  console.log('💡 You can manually zip the extension-build folder\n');
}

// Step 6: Print summary
console.log('✅ Build complete!\n');
console.log('📦 Extension files: ' + EXTENSION_DIR);
console.log('📦 Package: ' + zipPath);
console.log('\n📋 Next steps:');
console.log('   1. Test the extension by loading unpacked from: ' + EXTENSION_DIR);
console.log('   2. Convert SVG icons to PNG (see scripts/generate-icons.js output)');
console.log('   3. Review and update privacy policy');
console.log('   4. Upload to Chrome Web Store: https://chrome.google.com/webstore/devconsole');
console.log('   5. Upload to Firefox Add-ons: https://addons.mozilla.org/developers/\n');

// Helper function
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
