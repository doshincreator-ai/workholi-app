/**
 * kiwilog アイコン生成スクリプト
 * 使い方: node scripts/generate-icons.js
 */

const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// ── デザイン定数 ──────────────────────────────────────────────
const GREEN      = '#16a34a';
const GREEN_DARK = '#15803d';
const GREEN_LIGHT= '#dcfce7';
const WHITE      = '#ffffff';

// ── SVG 定義 ────────────────────────────────────────────────────

/**
 * メインアイコン SVG（1024×1024）
 * デザイン: グリーン背景 + 飛行機（Material Icons "flight" パス）+ 右下に時計
 * WorkHoli = 旅（飛行機）× 勤務（時計）
 */
function mainIconSvg(size) {
  const s = size;
  const rounding = s * 0.22;

  // Material Icons "flight" (viewBox 0 0 24 24) を 右上45°に回転して中央に配置
  // オリジナルパス: M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z
  // スケール: 24 -> size*0.55 = iconSize
  const iconSize = s * 0.55;
  const iconScale = iconSize / 24;
  const iconCx = s * 0.43;
  const iconCy = s * 0.43;

  // 時計（右下）
  const clkx = s * 0.73;
  const clky = s * 0.73;
  const clkr = s * 0.135;
  // 時針 10時方向 (210度)
  const hx = (clkx + clkr * Math.cos(210 * Math.PI/180) * 0.62).toFixed(1);
  const hy = (clky + clkr * Math.sin(210 * Math.PI/180) * 0.62).toFixed(1);
  // 分針 12時方向 (270度 = 真上)
  const mx = (clkx + clkr * Math.cos(270 * Math.PI/180) * 0.80).toFixed(1);
  const my = (clky + clkr * Math.sin(270 * Math.PI/180) * 0.80).toFixed(1);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${GREEN}"/>
      <stop offset="100%" stop-color="${GREEN_DARK}"/>
    </linearGradient>
  </defs>

  <!-- 背景 -->
  <rect width="${s}" height="${s}" rx="${rounding}" ry="${rounding}" fill="url(#bg)"/>

  <!-- 飛行機 (Material Icons "flight", 45°回転, 中央配置) -->
  <g transform="translate(${iconCx}, ${iconCy}) rotate(-45) scale(${iconScale}) translate(-12,-12)">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="${WHITE}"/>
  </g>

  <!-- 時計（右下） -->
  <circle cx="${clkx}" cy="${clky}" r="${clkr * 1.2}" fill="${WHITE}" opacity="0.12"/>
  <circle cx="${clkx}" cy="${clky}" r="${clkr}" fill="none" stroke="${WHITE}" stroke-width="${s * 0.022}"/>
  <line x1="${clkx}" y1="${clky}" x2="${hx}" y2="${hy}"
        stroke="${WHITE}" stroke-width="${s * 0.028}" stroke-linecap="round"/>
  <line x1="${clkx}" y1="${clky}" x2="${mx}" y2="${my}"
        stroke="${WHITE}" stroke-width="${s * 0.020}" stroke-linecap="round"/>
  <circle cx="${clkx}" cy="${clky}" r="${s * 0.013}" fill="${WHITE}"/>
</svg>`;
}

/**
 * Adaptive Icon 前景 SVG（1024×1024、中央 72% に収まるよう小さめ）
 * メインアイコンと同じデザインだが透明背景
 */
function adaptiveForegroundSvg(size) {
  // メインアイコンのSVGを透明背景版として再利用（背景rect を取り除く）
  const inner = mainIconSvg(size)
    .replace('<rect width="' + size + '" height="' + size + '"', '<rect width="0" height="0"');
  return inner;
}

/**
 * Adaptive Icon 背景 SVG（単色）
 */
function adaptiveBackgroundSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${GREEN}"/>
      <stop offset="100%" stop-color="${GREEN_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
</svg>`;
}

/**
 * Adaptive Icon モノクロ SVG
 */
function adaptiveMonochromeSvg(size) {
  return adaptiveForegroundSvg(size); // 同じシルエットをモノクロとして使用
}

/**
 * スプラッシュアイコン SVG（円形、透明背景）
 */
function splashIconSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${GREEN}"/>
      <stop offset="100%" stop-color="${GREEN_DARK}"/>
    </linearGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#bg)"/>
  ${mainIconSvg(size)
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
    .replace(/<defs>[\s\S]*?<\/defs>/, '')
    .replace(/<rect[^>]*fill="url\(#bg\)"[^>]*\/>/, '')
  }
</svg>`;
}

// ── PNG 生成関数 ─────────────────────────────────────────────────

function svgToPng(svgString, outputPath, scale = 1) {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: 'original' },
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(outputPath, png);
  console.log(`✓ ${path.relative(process.cwd(), outputPath)} (${png.length} bytes)`);
}

// ── 実行 ─────────────────────────────────────────────────────────

console.log('🎨 kiwilog アイコン生成中...\n');

// icon.png (1024×1024)
svgToPng(mainIconSvg(1024), path.join(assetsDir, 'icon.png'));

// android-icon-foreground.png (1024×1024, 透明背景)
svgToPng(adaptiveForegroundSvg(1024), path.join(assetsDir, 'android-icon-foreground.png'));

// android-icon-background.png (1024×1024)
svgToPng(adaptiveBackgroundSvg(1024), path.join(assetsDir, 'android-icon-background.png'));

// android-icon-monochrome.png (1024×1024)
svgToPng(adaptiveMonochromeSvg(1024), path.join(assetsDir, 'android-icon-monochrome.png'));

// splash-icon.png (500×500)
svgToPng(mainIconSvg(500), path.join(assetsDir, 'splash-icon.png'));

// favicon.png (48×48)
svgToPng(mainIconSvg(48), path.join(assetsDir, 'favicon.png'));

// Google Play ストア掲載用 512×512
svgToPng(mainIconSvg(512), path.join(assetsDir, 'google-play-icon-512.png'));

console.log('\n✅ 完了！');
console.log('   Google Play 掲載アイコン: assets/google-play-icon-512.png (512×512)');
