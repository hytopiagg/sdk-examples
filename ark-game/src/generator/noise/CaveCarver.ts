/**
 * CaveCarver - 3D cave generation with large caverns + thin spaghetti tunnels
 * 
 * Two distinct systems:
 * - Large caverns: FBM noise creates wide chambers
 * - Spaghetti tunnels: Perpendicular noise intersection creates thin passages
 * 
 * Spaghetti math: A tunnel exists where TWO independent noise values are both ~0.
 * The intersection of two 2D surfaces in 3D space creates a 1D curve (tunnel).
 */

import { FBM3D, Simplex3D } from './Simplex';

export interface CaveCarverConfig {
  seed: number;
  caveFrequency: number;
  caveOctaves: number;
  caveThreshold: number;
  minHeight: number;
  /** Distance from surface where caves begin to fade (terrain-relative) */
  surfaceFadeDistance: number;
  wormFrequency: number;
  wormStrength: number;
  warpFrequency: number;
  chamberFrequency: number;
}

/** Biome-specific cave modifiers (blended at borders) */
export interface CaveBiomeModifiers {
  enabled: boolean;
  frequency: number;
  threshold: number;
  wormStrength: number;
  profileCenterY: number;
  profileRange: number;
  profileStrength: number;
  warpStrength: number;
  warpFrequency: number;
  chamberChance: number;
  chamberStrength: number;
  chamberFrequency: number;
}

export class CaveCarver {
  private caveNoise: FBM3D;
  
  // Spaghetti tunnels - perpendicular noise pairs
  // Each pair creates a tube where BOTH values are near zero
  private spaghetti1A: Simplex3D;
  private spaghetti1B: Simplex3D;
  private spaghetti2A: Simplex3D;
  private spaghetti2B: Simplex3D;
  private warpX: Simplex3D;
  private warpZ: Simplex3D;
  private chamberMask: Simplex3D;
  
  private config: CaveCarverConfig;
  
  constructor(config: CaveCarverConfig) {
    this.config = config;
    
    // Large cavern noise
    this.caveNoise = new FBM3D(
      config.seed + 777777,
      config.caveFrequency,
      config.caveOctaves,
      2.0,
      0.5
    );
    
    // Spaghetti tunnels - two independent layers with different seeds
    // Lower frequency = longer straight sections before turning
    const wf = config.wormFrequency;
    
    // Primary spaghetti network
    this.spaghetti1A = new Simplex3D(config.seed + 888880, wf);
    this.spaghetti1B = new Simplex3D(config.seed + 888881, wf);
    
    // Secondary network (different seed, slightly different frequency)
    this.spaghetti2A = new Simplex3D(config.seed + 999990, wf * 1.3);
    this.spaghetti2B = new Simplex3D(config.seed + 999991, wf * 1.3);

    // Tunnel domain warp + chamber pulse fields
    this.warpX = new Simplex3D(config.seed + 123450, 1);
    this.warpZ = new Simplex3D(config.seed + 123451, 1);
    this.chamberMask = new Simplex3D(config.seed + 123452, 1);
  }
  
  /** 
   * Check if position should be carved out
   * @param surfaceY - Local terrain surface height (caves extend into mountains)
   */
  isCarved(x: number, y: number, z: number, biome?: CaveBiomeModifiers, surfaceY?: number): boolean {
    if (biome && !biome.enabled) return false;
    
    const { minHeight, surfaceFadeDistance, caveThreshold, wormStrength } = this.config;

    // Terrain-relative max height: caves can go up into mountains
    // surfaceY defaults to a reasonable value if not provided
    const localMaxHeight = (surfaceY ?? 64) - surfaceFadeDistance;

    if (y <= minHeight || y >= localMaxHeight) return false;

    // Depth-based fade - caves diminish near bedrock and near surface
    const bottomFadeZone = 6;
    const surfaceFadeZone = 6;
    let depthFactor = 1;
    if (y < minHeight + bottomFadeZone) {
      depthFactor = (y - minHeight) / bottomFadeZone;
    } else if (surfaceFadeZone > 0 && y > localMaxHeight - surfaceFadeZone) {
      depthFactor = (localMaxHeight - y) / surfaceFadeZone;
    }
    if (depthFactor <= 0) return false;
    
    const freqMod = biome?.frequency ?? 1;
    const effectiveThreshold = caveThreshold - (biome?.threshold ?? 0);
    const effectiveWormStrength = wormStrength * (biome?.wormStrength ?? 1);
    const profileRange = biome?.profileRange ?? 0;

    let carveFactor = depthFactor;
    if (profileRange > 0) {
      const center = biome?.profileCenterY ?? ((minHeight + localMaxHeight) * 0.5);
      const profileStrength = clamp01(biome?.profileStrength ?? 1);
      const dy = Math.abs(y - center) / profileRange;
      const inside = 1 - Math.max(0, Math.min(1, dy));
      const profileBell = inside * inside * (3 - 2 * inside);
      carveFactor *= 1 + (profileBell - 1) * profileStrength;
      if (carveFactor <= 0) return false;
    }

    let chamberBoost = 0;
    const chamberChance = clamp01(biome?.chamberChance ?? 0);
    const chamberStrength = Math.max(0, biome?.chamberStrength ?? 0);
    if (chamberChance > 0 && chamberStrength > 0) {
      const chamberFreq = this.config.chamberFrequency * (biome?.chamberFrequency ?? 1);
      if (chamberFreq > 0) {
        const cm = this.chamberMask.sample(x * chamberFreq, y * chamberFreq, z * chamberFreq);
        const trigger = 1 - (chamberChance * 2);
        if (cm > trigger) {
          chamberBoost = ((cm - trigger) / Math.max(1e-6, 1 - trigger)) * chamberStrength;
        }
      }
    }
    carveFactor *= 1 + chamberBoost;
    
    // === LARGE CAVERNS ===
    const cave = this.caveNoise.sample(x * freqMod, y * freqMod, z * freqMod);
    if (cave * carveFactor > effectiveThreshold) return true;
    
    // === SPAGHETTI TUNNELS ===
    // A tunnel exists where two perpendicular noise fields BOTH cross zero
    // The intersection creates a 1D curve through 3D space
    if (effectiveWormStrength > 0) {
      const warpStrength = Math.max(0, biome?.warpStrength ?? 0);
      let tx = x;
      let tz = z;
      if (warpStrength > 0) {
        const warpFreq = this.config.warpFrequency * (biome?.warpFrequency ?? 1);
        if (warpFreq > 0) {
          const wx = x * warpFreq;
          const wy = y * warpFreq * 0.6;
          const wz = z * warpFreq;
          tx += this.warpX.sample(wx, wy, wz) * warpStrength;
          tz += this.warpZ.sample(wx + 1000, wy, wz + 1000) * warpStrength;
        }
      }

      // HORIZONTAL BIAS: Scale Y up in noise space
      // y * 2 means noise cycles 2x faster in Y → tunnels ~2x flatter
      const wy = y * 2;
      
      // Simplex returns [-1, 1]. We check if BOTH noises are near zero.
      // radius² is the threshold for a² + b² (sum of squared noise values)
      // Larger radius = wider tunnel, but also more frequent
      // To get wide but sparse tunnels: large radius + low frequency
      
      // Primary tunnels: ~5-8 blocks wide
      // radius² = 0.06 means each noise must be < ~0.17 to carve
      const wormBoost = 1 + chamberBoost * 0.75;
      const r1 = 0.055 * effectiveWormStrength * wormBoost;
      const s1a = this.spaghetti1A.sample(tx, wy, tz);
      const s1b = this.spaghetti1B.sample(tx, wy, tz);
      if (s1a * s1a + s1b * s1b < r1) return true;
      
      // Secondary tunnels: ~4-6 blocks wide, different path
      const r2 = 0.04 * effectiveWormStrength * wormBoost;
      const s2a = this.spaghetti2A.sample(tx, wy * 1.1, tz);
      const s2b = this.spaghetti2B.sample(tx, wy * 1.1, tz);
      if (s2a * s2a + s2b * s2b < r2) return true;
    }
    
    return false;
  }
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}
