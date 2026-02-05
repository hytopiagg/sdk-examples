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
  maxHeight: number;
  wormFrequency: number;
  wormStrength: number;
}

/** Biome-specific cave modifiers (blended at borders) */
export interface CaveBiomeModifiers {
  enabled: boolean;
  frequency: number;
  threshold: number;
  wormStrength: number;
}

export class CaveCarver {
  private caveNoise: FBM3D;
  
  // Spaghetti tunnels - perpendicular noise pairs
  // Each pair creates a tube where BOTH values are near zero
  private spaghetti1A: Simplex3D;
  private spaghetti1B: Simplex3D;
  private spaghetti2A: Simplex3D;
  private spaghetti2B: Simplex3D;
  
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
  }
  
  /** Check if position should be carved out */
  isCarved(x: number, y: number, z: number, biome?: CaveBiomeModifiers): boolean {
    if (biome && !biome.enabled) return false;
    
    const { minHeight, maxHeight, caveThreshold, wormStrength } = this.config;
    
    if (y <= minHeight || y >= maxHeight) return false;
    
    // Depth-based fade - caves diminish near bedrock and surface
    const fadeZone = 6;
    let depthFactor = 1;
    if (y < minHeight + fadeZone) {
      depthFactor = (y - minHeight) / fadeZone;
    } else if (y > maxHeight - fadeZone) {
      depthFactor = (maxHeight - y) / fadeZone;
    }
    if (depthFactor <= 0) return false;
    
    const freqMod = biome?.frequency ?? 1;
    const effectiveThreshold = caveThreshold - (biome?.threshold ?? 0);
    const effectiveWormStrength = wormStrength * (biome?.wormStrength ?? 1);
    
    // === LARGE CAVERNS ===
    const cave = this.caveNoise.sample(x * freqMod, y * freqMod, z * freqMod);
    if (cave * depthFactor > effectiveThreshold) return true;
    
    // === SPAGHETTI TUNNELS ===
    // A tunnel exists where two perpendicular noise fields BOTH cross zero
    // The intersection creates a 1D curve through 3D space
    if (effectiveWormStrength > 0) {
      // HORIZONTAL BIAS: Scale Y up in noise space
      // y * 2 means noise cycles 2x faster in Y → tunnels ~2x flatter
      const wy = y * 2;
      
      // Simplex returns [-1, 1]. We check if BOTH noises are near zero.
      // radius² is the threshold for a² + b² (sum of squared noise values)
      // Larger radius = wider tunnel, but also more frequent
      // To get wide but sparse tunnels: large radius + low frequency
      
      // Primary tunnels: ~5-8 blocks wide
      // radius² = 0.06 means each noise must be < ~0.17 to carve
      const r1 = 0.055 * effectiveWormStrength;
      const s1a = this.spaghetti1A.sample(x, wy, z);
      const s1b = this.spaghetti1B.sample(x, wy, z);
      if (s1a * s1a + s1b * s1b < r1) return true;
      
      // Secondary tunnels: ~4-6 blocks wide, different path
      const r2 = 0.04 * effectiveWormStrength;
      const s2a = this.spaghetti2A.sample(x, wy * 1.1, z);
      const s2b = this.spaghetti2B.sample(x, wy * 1.1, z);
      if (s2a * s2a + s2b * s2b < r2) return true;
    }
    
    return false;
  }
}
