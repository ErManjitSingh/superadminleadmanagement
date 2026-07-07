// Utilities to derive a tenant sidebar color from an uploaded logo.

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;
}

export function hexToRgb(hex) {
  const raw = String(hex || '').replace('#', '').trim();
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const n = parseInt(full || '000000', 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function darken({ r, g, b }, factor = 0.3) {
  return { r: r * (1 - factor), g: g * (1 - factor), b: b * (1 - factor) };
}

function luminance({ r, g, b }) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Load an image (data URL or URL) and return its dominant, vivid color as hex.
 * Ignores transparent, near-white and near-black pixels; favours saturated tones.
 */
export function getDominantColor(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 48;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const buckets = new Map();
        let best = null;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 125) continue;
          const mx = Math.max(r, g, b);
          const mn = Math.min(r, g, b);
          if (mx > 240 && mn > 240) continue; // near white
          if (mx < 18) continue; // near black
          const sat = mx === 0 ? 0 : (mx - mn) / mx;
          const key = `${r >> 4},${g >> 4},${b >> 4}`;
          const prev = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0, score: 0 };
          prev.r += r;
          prev.g += g;
          prev.b += b;
          prev.n += 1;
          prev.score += 1 + sat * 3; // favour saturated pixels
          buckets.set(key, prev);
          if (!best || prev.score > best.score) best = prev;
        }

        if (!best || !best.n) {
          reject(new Error('Could not detect a color'));
          return;
        }
        resolve(rgbToHex(best.r / best.n, best.g / best.n, best.b / best.n));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}

/**
 * Build a sidebar-friendly dark gradient from a base hex color.
 * Light colors are darkened first so white sidebar text stays readable.
 */
export function sidebarGradientFromHex(hex) {
  let rgb = hexToRgb(hex);
  const lum = luminance(rgb);
  if (lum > 0.55) rgb = darken(rgb, 0.55);
  else if (lum > 0.4) rgb = darken(rgb, 0.35);

  const s = (c) => rgbToHex(c.r, c.g, c.b);
  const top = darken(rgb, 0.12);
  const mid = darken(rgb, 0.42);
  const bot = darken(rgb, 0.62);
  return `linear-gradient(180deg, ${s(top)} 0%, ${s(mid)} 55%, ${s(bot)} 100%)`;
}
