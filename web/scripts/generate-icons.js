// Simple script to generate extension icons using Canvas
const fs = require('fs');
const path = require('path');

// For a real extension, use proper design tools or hire a designer
// This creates simple placeholder icons with the ZetaPay branding

const sizes = [16, 48, 128];
const colors = {
  primary: '#667eea',
  secondary: '#764ba2',
};

console.log('Generating placeholder icons...');
console.log('Note: For production, replace these with professionally designed icons.');

// Create a simple SVG template
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        fill="white" font-family="Arial, sans-serif" font-weight="bold" 
        font-size="${size * 0.5}">Z</text>
</svg>`;

const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = createSVG(size);
  fs.writeFileSync(path.join(imagesDir, `icon${size}.svg`), svg);
  console.log(`✓ Created icon${size}.svg`);
});

console.log('\nTo convert SVG to PNG, use an online tool or imagemagick:');
console.log('  convert icon16.svg icon16.png');
console.log('  convert icon48.svg icon48.png');
console.log('  convert icon128.svg icon128.png');
console.log('\nOr manually convert using: https://cloudconvert.com/svg-to-png');
