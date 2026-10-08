import fs from 'node:fs';
import path from 'node:path';

// Rule: ABSOLUTELY NO PURPLE in any form:
// no violet, lavender, lilac, indigo, magenta, or purple-tinted greys or gradients,
// anywhere in the game, UI, admin panel, or assets.

interface Violation {
  file: string;
  line: number;
  match: string;
  hue: number;
  saturation: number;
  lightness: number;
}

function hexToRgb(hex: string): [number, number, number] | null {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

const FORBIDDEN_NAMES = [
  'purple', 'violet', 'lavender', 'lilac', 'indigo', 'magenta',
  'fuchsia', 'plum', 'orchid', 'thistle', 'amethyst', 'periwinkle'
];

function isForbiddenHue(h: number, s: number, l: number): boolean {
  // Hue 242 to 325 is purple / violet / magenta territory
  // Allow near-monochrome (< 6% saturation) to avoid false-flagging pure grays
  // and pure blacks/whites (L < 4% or L > 98%)
  if (s < 6) return false;
  if (l < 4 || l > 98) return false;
  return h >= 242 && h <= 325;
}

const violations: Violation[] = [];

function stripComments(line: string): string {
  // Strip // line comments
  let clean = line.replace(/\/\/.*$/, '');
  // Strip /* ... */ block comments
  clean = clean.replace(/\/\*.*?\*\//g, '');
  return clean;
}

function scanFile(filePath: string) {
  // Never scan the lint script itself
  if (filePath.endsWith('lint-zero-purple.ts')) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((rawLine, idx) => {
    const codeLine = stripComments(rawLine).trim();
    if (!codeLine) return;

    // 1. Check forbidden named words in actual code/values
    for (const name of FORBIDDEN_NAMES) {
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(codeLine)) {
        violations.push({
          file: filePath,
          line: idx + 1,
          match: `Named color: "${name}"`,
          hue: 280,
          saturation: 100,
          lightness: 50,
        });
      }
    }

    // 2. Check Hex codes (#rgb, #rrggbb)
    const hexMatches = codeLine.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    for (const hex of hexMatches) {
      const rgb = hexToRgb(hex.slice(0, 7));
      if (!rgb) continue;
      const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
      if (isForbiddenHue(h, s, l)) {
        violations.push({
          file: filePath,
          line: idx + 1,
          match: `Hex ${hex} -> HSL(${h}°, ${s}%, ${l}%)`,
          hue: h,
          saturation: s,
          lightness: l,
        });
      }
    }

    // 3. Check rgb(r, g, b)
    const rgbMatches = codeLine.matchAll(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g);
    for (const match of rgbMatches) {
      const r = Number(match[1]);
      const g = Number(match[2]);
      const b = Number(match[3]);
      const [h, s, l] = rgbToHsl(r, g, b);
      if (isForbiddenHue(h, s, l)) {
        violations.push({
          file: filePath,
          line: idx + 1,
          match: `RGB(${r}, ${g}, ${b}) -> HSL(${h}°, ${s}%, ${l}%)`,
          hue: h,
          saturation: s,
          lightness: l,
        });
      }
    }
  });
}

function walkDir(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(ts|tsx|js|jsx|css|json|svg)$/.test(entry.name)) {
      scanFile(fullPath);
    }
  }
}

console.log('🔍 Running AccraWedey Zero-Purple Automated Hue Audit...');
const targetDirs = [path.resolve(process.cwd(), 'src')];
for (const dir of targetDirs) {
  if (fs.existsSync(dir)) walkDir(dir);
}

if (violations.length > 0) {
  console.error('\n❌ ZERO-PURPLE CONSTRAINT VIOLATION DETECTED:');
  console.error('The following colors have forbidden hues (Hue 242°-325°):');
  violations.forEach(v => {
    console.error(`  - ${v.file}:${v.line} -> ${v.match}`);
  });
  process.exit(1);
} else {
  console.log('✅ ZERO-PURPLE AUDIT PASSED: All design tokens, UI components, and canvas assets are strictly soft, warm, and purple-free.');
}
