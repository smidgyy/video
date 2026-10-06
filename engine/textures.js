// Deterministic procedural textures (Canvas 2D, seeded). Generated once at load, returned as data URLs or canvases.
// Nothing here depends on time; animation comes from how the film positions/blends these at seek(t).
import { rng } from './motion.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// Film grain tile: luminance noise with a soft gaussian-ish distribution. `frames` variants for temporal grain.
export function grainTiles({ size = 256, frames = 8, seed = 1, contrast = 1 } = {}) {
  const out = [];
  for (let f = 0; f < frames; f++) {
    const r = rng(seed * 7919 + f * 104729);
    const c = canvas(size, size), g = c.getContext('2d');
    const img = g.createImageData(size, size);
    for (let i = 0; i < size * size; i++) {
      const v = (r() + r() + r() + r() - 2) * 0.5 * contrast; // ~gaussian in [-1,1]
      const l = Math.max(0, Math.min(255, 128 + v * 127));
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = l;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    out.push(c.toDataURL('image/png'));
  }
  return out;
}

// Dust & hairline scratches on transparent background (for lens / glass surfaces).
export function dustLayer({ w = 1920, h = 1080, seed = 3, specks = 260, hairs = 26, alpha = 0.5 } = {}) {
  const r = rng(seed);
  const c = canvas(w, h), g = c.getContext('2d');
  for (let i = 0; i < specks; i++) {
    const x = r() * w, y = r() * h, rad = 0.4 + r() * r() * 2.2;
    g.fillStyle = `rgba(255,255,255,${(0.08 + r() * 0.5) * alpha})`;
    g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  g.lineCap = 'round';
  for (let i = 0; i < hairs; i++) {
    let x = r() * w, y = r() * h;
    g.strokeStyle = `rgba(255,255,255,${(0.05 + r() * 0.18) * alpha})`;
    g.lineWidth = 0.5 + r() * 0.7;
    g.beginPath(); g.moveTo(x, y);
    const n = 6 + Math.floor(r() * 10), a0 = r() * Math.PI * 2;
    for (let k = 0; k < n; k++) { x += Math.cos(a0 + (r() - 0.5) * 0.8) * (3 + r() * 9); y += Math.sin(a0 + (r() - 0.5) * 0.8) * (3 + r() * 9); g.lineTo(x, y); }
    g.stroke();
  }
  return c.toDataURL('image/png');
}

// Matte graphite surface: low-frequency value noise + fine micro texture, tinted to the site's ink palette.
export function graphite({ w = 1024, h = 1024, seed = 5, base = [10, 10, 12], amp = 7, fine = 4 } = {}) {
  const r = rng(seed);
  const c = canvas(w, h), g = c.getContext('2d');
  const img = g.createImageData(w, h);
  const G = 32, grid = [];
  for (let i = 0; i < (G + 1) * (G + 1); i++) grid.push(r());
  const lerp = (a, b, k) => a + (b - a) * k;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx = (x / w) * G, gy = (y / h) * G, ix = Math.floor(gx), iy = Math.floor(gy);
      const fx = gx - ix, fy = gy - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = grid[iy * (G + 1) + ix], b = grid[iy * (G + 1) + ix + 1], c2 = grid[(iy + 1) * (G + 1) + ix], d = grid[(iy + 1) * (G + 1) + ix + 1];
      const low = lerp(lerp(a, b, sx), lerp(c2, d, sx), sy) - 0.5;
      const v = low * amp + (r() - 0.5) * fine;
      const i = (y * w + x) * 4;
      img.data[i] = base[0] + v; img.data[i + 1] = base[1] + v; img.data[i + 2] = base[2] + v * 1.1; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL('image/png');
}

// Halftone dot field rendered from an arbitrary luminance function lum(u,v) in [0,1].
export function halftone({ w = 960, h = 540, cell = 9, angle = 0.26, seed = 9, color = '#d4ff3f', lum = () => 0.5, jitter = 0.12 } = {}) {
  const r = rng(seed);
  const c = canvas(w, h), g = c.getContext('2d');
  g.fillStyle = color;
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const R = Math.hypot(w, h);
  for (let a = -R; a < R; a += cell) {
    for (let b = -R; b < R; b += cell) {
      const x = w / 2 + a * ca - b * sa, y = h / 2 + a * sa + b * ca;
      if (x < -cell || y < -cell || x > w + cell || y > h + cell) continue;
      const l = Math.max(0, Math.min(1, lum(x / w, y / h) + (r() - 0.5) * jitter));
      const rad = (cell * 0.5) * Math.sqrt(l);
      if (rad < 0.25) continue;
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    }
  }
  return c.toDataURL('image/png');
}

// Print misregistration helper: returns small deterministic offsets per layer index.
export function misregister(seed, n = 3, mag = 1.6) {
  const r = rng(seed);
  return Array.from({ length: n }, () => [(r() - 0.5) * 2 * mag, (r() - 0.5) * 2 * mag]);
}

export function toCanvas(dataUrl) {
  const img = new Image();
  img.src = dataUrl;
  return img.decode().then(() => img);
}
