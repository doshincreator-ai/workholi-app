/**
 * ロゴ画像からアプリアイコンを生成するスクリプト
 * 使い方: node scripts/use-logo.js <ロゴ画像のパス>
 * 例: node scripts/use-logo.js "C:\Users\user-laptop\Downloads\ChatGPT Image 2026年3月27日 08_09_17.png"
 */

const { Jimp } = require('jimp');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const sourcePath = process.argv[2];

if (!sourcePath) {
  console.error('使い方: node scripts/use-logo.js <ロゴ画像のパス>');
  process.exit(1);
}

const GREEN = 0x16a34aff;

async function main() {
  console.log('🎨 ロゴ画像からアイコンを生成中...\n');

  const logo = await Jimp.read(sourcePath);
  console.log(`元画像: ${logo.width}x${logo.height}`);

  // icon.png (1024×1024) - 白背景にロゴをセンタリング
  const icon = new Jimp({ width: 1024, height: 1024, color: 0xffffffff });
  const logoForIcon = logo.clone().resize({ w: 900, h: 900 });
  icon.composite(logoForIcon, 62, 62);
  await icon.write(path.join(assetsDir, 'icon.png'));
  console.log('✓ assets/icon.png (1024×1024)');

  // splash-icon.png (500×500) - 白背景
  const splash = new Jimp({ width: 500, height: 500, color: 0xffffffff });
  const logoForSplash = logo.clone().resize({ w: 440, h: 440 });
  splash.composite(logoForSplash, 30, 30);
  await splash.write(path.join(assetsDir, 'splash-icon.png'));
  console.log('✓ assets/splash-icon.png (500×500)');

  // favicon.png (48×48)
  const favicon = logo.clone().resize({ w: 48, h: 48 });
  await favicon.write(path.join(assetsDir, 'favicon.png'));
  console.log('✓ assets/favicon.png (48×48)');

  // google-play-icon-512.png (512×512)
  const gplay = new Jimp({ width: 512, height: 512, color: 0xffffffff });
  const logoForGplay = logo.clone().resize({ w: 460, h: 460 });
  gplay.composite(logoForGplay, 26, 26);
  await gplay.write(path.join(assetsDir, 'google-play-icon-512.png'));
  console.log('✓ assets/google-play-icon-512.png (512×512)');

  // android-icon-foreground.png (1024×1024) - 透明背景
  const fg = new Jimp({ width: 1024, height: 1024, color: 0x00000000 });
  const logoForFg = logo.clone().resize({ w: 720, h: 720 });
  fg.composite(logoForFg, 152, 152);
  await fg.write(path.join(assetsDir, 'android-icon-foreground.png'));
  console.log('✓ assets/android-icon-foreground.png (1024×1024)');

  // android-icon-background.png (1024×1024) - 白背景
  const bg = new Jimp({ width: 1024, height: 1024, color: 0xffffffff });
  await bg.write(path.join(assetsDir, 'android-icon-background.png'));
  console.log('✓ assets/android-icon-background.png (1024×1024)');

  // android-icon-monochrome.png (1024×1024) - グレースケール
  const mono = new Jimp({ width: 1024, height: 1024, color: 0xffffffff });
  const logoForMono = logo.clone().resize({ w: 720, h: 720 }).greyscale();
  mono.composite(logoForMono, 152, 152);
  await mono.write(path.join(assetsDir, 'android-icon-monochrome.png'));
  console.log('✓ assets/android-icon-monochrome.png (1024×1024)');

  console.log('\n✅ 完了！');
}

main().catch((e) => { console.error(e); process.exit(1); });
