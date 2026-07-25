const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourcePath = path.resolve(__dirname, '../assets/logo.png');
const iconsDir = path.resolve(__dirname, 'public/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generating PWA icons from:', sourcePath);

  // 1. Standard 192x192
  await sharp(sourcePath)
    .resize(192, 192)
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  // 2. Standard 512x512
  await sharp(sourcePath)
    .resize(512, 512)
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  // 3. Maskable 512x512 (Logo 410x410 centered in 512x512 canvas with #16a34a background)
  const maskableLogo = await sharp(sourcePath).resize(410, 410).toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 22, g: 163, b: 74, alpha: 1 }
    }
  })
    .composite([{ input: maskableLogo, gravity: 'center' }])
    .toFile(path.join(iconsDir, 'icon-maskable-512.png'));
  console.log('Created icon-maskable-512.png');

  // 4. Apple Touch Icon 180x180 (Logo on opaque #16a34a background)
  const appleLogo = await sharp(sourcePath).resize(180, 180).toBuffer();
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 22, g: 163, b: 74, alpha: 1 }
    }
  })
    .composite([{ input: appleLogo, gravity: 'center' }])
    .toFile(path.join(iconsDir, 'icon-180-apple.png'));
  console.log('Created icon-180-apple.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
