/**
 * CaveCarver - 3D noise-based cave carving with biome blending
 * 
 * Uses consistent world-wide noise for cave shapes.
 * Biome parameters (threshold, frequency, worm strength) blend smoothly
 * at borders for natural cave transitions between biomes.
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
  frequency: number;      // Multiplier for cave size (1.0 = default)
  threshold: number;      // Offset to threshold (-0.1 fewer, +0.1 more caves)
  wormStrength: number;   // 0-1 blend for worm caves
}

export class CaveCarver {
  private caveNoise: FBM3D;
  private wormNoiseA: Simplex3D;
  private wormNoiseB: Simplex3D;
  private config: CaveCarverConfig;
  
  constructor(config: CaveCarverConfig) {
    this.config = config;
    
    this.caveNoise = new FBM3D(
      config.seed + 777777,
      config.caveFrequency,
      config.caveOctaves,
      2.0,
      0.5
    );
    
    this.wormNoiseA = new Simplex3D(config.seed + 888888, config.wormFrequency);
    this.wormNoiseB = new Simplex3D(config.seed + 999999, config.wormFrequency);
  }
  
  /** 
   * Check if position should be carved out
   * @param biome Optional biome modifiers for smooth transitions
   */
  isCarved(x: number, y: number, z: number, biome?: CaveBiomeModifiers): boolean {
    // If biome explicitly disables caves
    if (biome && !biome.enabled) return false;
    
    const { minHeight, maxHeight, caveThreshold, wormStrength } = this.config;
    
    // Hard bounds
    if (y <= minHeight || y >= maxHeight) return false;
    
    // Depth-based fade
    let depthFactor = 1;
    const fadeZone = 8;
    
    if (y < minHeight + fadeZone) {
      depthFactor = (y - minHeight) / fadeZone;
    } else if (y > maxHeight - fadeZone) {
      depthFactor = (maxHeight - y) / fadeZone;
    }
    
    if (depthFactor <= 0) return false;
    
    // Apply biome frequency scaling to coordinates (affects cave size)
    const freqMod = biome?.frequency ?? 1;
    const sx = x * freqMod;
    const sy = y * freqMod;
    const sz = z * freqMod;
    
    // Main cave noise
    const cave = this.caveNoise.sample(sx, sy, sz);
    
    // Worm caves with biome-blended strength
    let worm = 0;
    const effectiveWormStrength = wormStrength * (biome?.wormStrength ?? 1);
    if (effectiveWormStrength > 0) {
      const a = this.wormNoiseA.sample(x, y * 0.7, z);
      const b = this.wormNoiseB.sample(x, y * 0.7, z);
      const dist = a * a + b * b;
      worm = Math.max(0, 0.15 - dist) * 5;
    }
    
    // Apply biome threshold offset (affects cave density)
    const effectiveThreshold = caveThreshold - (biome?.threshold ?? 0);
    
    const combined = (cave + worm * effectiveWormStrength) * depthFactor;
    return combined > effectiveThreshold;
  }
}
