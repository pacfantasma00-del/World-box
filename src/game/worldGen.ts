import { Tile, TileType } from './types';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants';

// Pseudo-random noise generator with seed
export class SimpleNoise {
  private p: number[] = [];

  constructor(seed: number = 42) {
    const permutation: number[] = [];
    for (let i = 0; i < 256; i++) {
      permutation[i] = i;
    }
    // Simple LCG shuffle
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) % 4294967296;
      const j = Math.floor((s / 4294967296) * (i + 1));
      const tmp: number = permutation[i];
      permutation[i] = permutation[j];
      permutation[j] = tmp;
    }
    this.p = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.p[i] = permutation[i & 255];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));

    return (this.lerp(v, x1, x2) + 1) / 2; // Normalize to [0, 1]
  }

  public fbm(x: number, y: number, octaves: number = 4): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

export type WorldPreset = 'continents' | 'archipelago' | 'twin_continents' | 'pangaea' | 'volcanic' | 'blank';

export function generateWorld(
  preset: WorldPreset = 'continents',
  width: number = WORLD_WIDTH,
  height: number = WORLD_HEIGHT,
  seed: number = Math.floor(Math.random() * 100000)
): Tile[][] {
  const noiseElev = new SimpleNoise(seed);
  const noiseMoist = new SimpleNoise(seed + 9999);
  const noiseTemp = new SimpleNoise(seed + 55555);

  const grid: Tile[][] = [];

  for (let y = 0; y < height; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < width; x++) {
      if (preset === 'blank') {
        row.push({
          type: 'deep_ocean',
          elevation: 0.1,
          temperature: 0.5,
          moisture: 0.5,
        });
        continue;
      }

      // Distance from center for radial island mask
      const nx = (x / width) * 2 - 1;
      const ny = (y / height) * 2 - 1;
      const distFromCenter = Math.sqrt(nx * nx + ny * ny);

      let rawElev = noiseElev.fbm(x * 0.05, y * 0.05, 5);
      const moist = noiseMoist.fbm(x * 0.04, y * 0.04, 3);
      // Latitude-based temperature: poles colder, equator hotter
      const latTemp = 1 - Math.abs(ny);
      const temp = Math.max(0, Math.min(1, latTemp * 0.7 + noiseTemp.fbm(x * 0.06, y * 0.06, 2) * 0.3));

      // Apply preset modifiers
      if (preset === 'continents') {
        // Falloff at borders
        const borderMask = Math.max(0, 1 - Math.pow(distFromCenter, 2.2));
        rawElev = rawElev * 0.7 + borderMask * 0.45;
      } else if (preset === 'archipelago') {
        rawElev = noiseElev.fbm(x * 0.09, y * 0.09, 4);
        const islandMask = Math.max(0, 1 - distFromCenter * 0.85);
        rawElev = rawElev * islandMask * 1.1;
      } else if (preset === 'twin_continents') {
        // Two focal centers
        const c1Dist = Math.sqrt(Math.pow(nx + 0.5, 2) + Math.pow(ny, 2));
        const c2Dist = Math.sqrt(Math.pow(nx - 0.5, 2) + Math.pow(ny, 2));
        const minCenterDist = Math.min(c1Dist, c2Dist);
        const mask = Math.max(0, 1 - minCenterDist * 1.4);
        rawElev = rawElev * 0.6 + mask * 0.5;
      } else if (preset === 'pangaea') {
        const mask = Math.max(0, 1 - distFromCenter * 1.5);
        rawElev = rawElev * 0.5 + mask * 0.6;
      } else if (preset === 'volcanic') {
        const peakMask = Math.max(0, 1 - distFromCenter * 1.8);
        rawElev = rawElev * 0.4 + peakMask * 0.75;
      }

      // Determine Tile Type from Elevation, Moisture, and Temperature
      let type: TileType = 'deep_ocean';

      if (rawElev < 0.32) {
        type = 'deep_ocean';
      } else if (rawElev < 0.42) {
        type = 'shallow_water';
        if (temp < 0.15) {
          type = 'ice';
        }
      } else if (rawElev < 0.46) {
        type = 'sand';
        if (temp < 0.18) {
          type = 'snow';
        }
      } else if (rawElev < 0.72) {
        // Temperate/Land
        if (temp < 0.2) {
          type = 'snow';
        } else if (moist > 0.58) {
          type = 'forest';
        } else if (moist < 0.28) {
          type = 'soil';
        } else {
          type = 'grass';
        }
      } else if (rawElev < 0.86) {
        type = 'mountain';
        if (preset === 'volcanic' && rawElev > 0.8 && distFromCenter < 0.3) {
          type = 'lava';
        }
      } else {
        type = 'snow';
        if (preset === 'volcanic' && distFromCenter < 0.25) {
          type = 'lava';
        }
      }

      row.push({
        type,
        elevation: rawElev,
        temperature: temp,
        moisture: moist,
      });
    }
    grid.push(row);
  }

  return grid;
}
