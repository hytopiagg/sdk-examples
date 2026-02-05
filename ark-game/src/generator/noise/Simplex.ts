/**
 * OpenSimplex2 noise - produces smooth, uniform noise
 */

const GRAD2 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

const GRAD3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const F3 = 1 / 3;
const G3 = 1 / 6;

function createPermutation(seed: number): Uint8Array {
  const perm = new Uint8Array(512);
  const source = new Uint8Array(256);
  
  for (let i = 0; i < 256; i++) source[i] = i;
  
  let s = seed >>> 0;
  for (let i = 255; i >= 0; i--) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const r = (s >>> 0) % (i + 1);
    perm[i] = perm[i + 256] = source[r];
    source[r] = source[i];
  }
  
  return perm;
}

export class Simplex2D {
  private perm: Uint8Array;
  private freq: number;
  
  constructor(seed: number, frequency = 1) {
    this.perm = createPermutation(seed);
    this.freq = frequency;
  }
  
  sample(x: number, z: number): number {
    x *= this.freq;
    z *= this.freq;
    
    const s = (x + z) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(z + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t);
    const y0 = z - (j - t);
    
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    
    const ii = i & 255;
    const jj = j & 255;
    const perm = this.perm;
    
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      const gi = perm[ii + perm[jj]] & 7;
      n += t0 * t0 * (GRAD2[gi][0] * x0 + GRAD2[gi][1] * y0);
    }
    
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      const gi = perm[ii + i1 + perm[jj + j1]] & 7;
      n += t1 * t1 * (GRAD2[gi][0] * x1 + GRAD2[gi][1] * y1);
    }
    
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      const gi = perm[ii + 1 + perm[jj + 1]] & 7;
      n += t2 * t2 * (GRAD2[gi][0] * x2 + GRAD2[gi][1] * y2);
    }
    
    return 70 * n;
  }
}

export class Simplex3D {
  private perm: Uint8Array;
  private freq: number;
  
  constructor(seed: number, frequency = 1) {
    this.perm = createPermutation(seed);
    this.freq = frequency;
  }
  
  sample(x: number, y: number, z: number): number {
    x *= this.freq;
    y *= this.freq;
    z *= this.freq;
    
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const z0 = z - (k - t);
    
    let i1: number, j1: number, k1: number, i2: number, j2: number, k2: number;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
    
    const ii = i & 255, jj = j & 255, kk = k & 255;
    const perm = this.perm;
    
    let n = 0;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 >= 0) {
      t0 *= t0;
      const gi = perm[ii + perm[jj + perm[kk]]] % 12;
      n += t0 * t0 * (GRAD3[gi][0] * x0 + GRAD3[gi][1] * y0 + GRAD3[gi][2] * z0);
    }
    
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 >= 0) {
      t1 *= t1;
      const gi = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
      n += t1 * t1 * (GRAD3[gi][0] * x1 + GRAD3[gi][1] * y1 + GRAD3[gi][2] * z1);
    }
    
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 >= 0) {
      t2 *= t2;
      const gi = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
      n += t2 * t2 * (GRAD3[gi][0] * x2 + GRAD3[gi][1] * y2 + GRAD3[gi][2] * z2);
    }
    
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 >= 0) {
      t3 *= t3;
      const gi = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;
      n += t3 * t3 * (GRAD3[gi][0] * x3 + GRAD3[gi][1] * y3 + GRAD3[gi][2] * z3);
    }
    
    return 32 * n;
  }
}

/** Fractional Brownian Motion - layered noise for natural terrain */
export class FBM2D {
  private samplers: Simplex2D[];
  private weights: number[];
  private norm: number;
  
  constructor(seed: number, frequency: number, octaves: number, lacunarity = 2, gain = 0.5) {
    this.samplers = [];
    this.weights = [];
    this.norm = 0;
    
    let freq = frequency;
    let amp = 1;
    for (let i = 0; i < octaves; i++) {
      this.samplers.push(new Simplex2D(seed + i * 31337, freq));
      this.weights.push(amp);
      this.norm += amp;
      freq *= lacunarity;
      amp *= gain;
    }
  }
  
  sample(x: number, z: number): number {
    let sum = 0;
    for (let i = 0; i < this.samplers.length; i++) {
      sum += this.samplers[i].sample(x, z) * this.weights[i];
    }
    return sum / this.norm;
  }
}

export class FBM3D {
  private samplers: Simplex3D[];
  private weights: number[];
  private norm: number;
  
  constructor(seed: number, frequency: number, octaves: number, lacunarity = 2, gain = 0.5) {
    this.samplers = [];
    this.weights = [];
    this.norm = 0;
    
    let freq = frequency;
    let amp = 1;
    for (let i = 0; i < octaves; i++) {
      this.samplers.push(new Simplex3D(seed + i * 31337, freq));
      this.weights.push(amp);
      this.norm += amp;
      freq *= lacunarity;
      amp *= gain;
    }
  }
  
  sample(x: number, y: number, z: number): number {
    let sum = 0;
    for (let i = 0; i < this.samplers.length; i++) {
      sum += this.samplers[i].sample(x, y, z) * this.weights[i];
    }
    return sum / this.norm;
  }
}
