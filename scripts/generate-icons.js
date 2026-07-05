/**
 * scripts/generate-icons.js
 * Resize logo.png → tất cả kích thước PWA chuẩn
 * Chạy: node scripts/generate-icons.js
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '../public/logo.png');
const OUT = path.join(__dirname, '../public/icons');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  for (const size of SIZES) {
    const dest = path.join(OUT, `icon-${size}x${size}.png`);
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(dest);
    console.log(`✅ ${size}x${size} → ${dest}`);
  }

  // Maskable icons — thêm padding 20% để safe zone hiển thị đúng
  for (const size of [192, 512]) {
    const dest = path.join(OUT, `icon-maskable-${size}x${size}.png`);
    const inner = Math.round(size * 0.6); // icon chiếm 60% để padding 20% mỗi bên
    await sharp(SRC)
      .resize(inner, inner, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .extend({
        top: Math.round((size - inner) / 2),
        bottom: Math.round((size - inner) / 2),
        left: Math.round((size - inner) / 2),
        right: Math.round((size - inner) / 2),
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toFile(dest);
    console.log(`✅ maskable-${size}x${size} → ${dest}`);
  }

  // Apple Touch Icon (180x180)
  const appleIcon = path.join(__dirname, '../public/apple-touch-icon.png');
  await sharp(SRC)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(appleIcon);
  console.log(`✅ apple-touch-icon.png (180x180)`);

  console.log('\n🎉 Tất cả icons đã được tạo trong public/icons/');
}

main().catch(err => { console.error('❌ Lỗi:', err); process.exit(1); });
