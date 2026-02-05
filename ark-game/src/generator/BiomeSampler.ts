/**
 * BiomeSampler - Deterministic biome selection and blending
 * 
 * Assigns biomes to fixed-size regions. Provides smooth blending
 * at biome borders for natural terrain and cave transitions.
 */

import { Simplex2D } from './noise/Simplex';
import { BiomeDefinition, ALL_BIOMES, getTotalWeight } from './biomes';

export interface BiomeSamplerConfig {
  seed: number;
  biomeSize: number;
  blendWidth: number;
}

export interface BlendedBiomeValues {
  biome: BiomeDefinition;
  blocks: { surface: number; subsurface: number; underground: number; subsurfaceDepth: number };
  terrain: { heightOffset: number; heightScale: number; frequencyScale: number; valleyScale: number };
  caves: { enabled: boolean; frequency: number; threshold: number; wormStrength: number };
}

export class BiomeSampler {
  private biomeSize: number;
  private blendWidth: number;
  private biomeNoise: Simplex2D;
  private sortedBiomes: BiomeDefinition[];
  private weightThresholds: number[];
  
  constructor(config: BiomeSamplerConfig) {
    this.biomeSize = config.biomeSize;
    this.blendWidth = config.blendWidth;
    this.biomeNoise = new Simplex2D(config.seed + 111111, 1 / config.biomeSize);
    
    // Pre-sort biomes by weight and compute cumulative thresholds
    this.sortedBiomes = [...ALL_BIOMES].sort((a, b) => b.weight - a.weight);
    const totalWeight = getTotalWeight();
    this.weightThresholds = [];
    let cumulative = 0;
    for (const biome of this.sortedBiomes) {
      cumulative += biome.weight / totalWeight;
      this.weightThresholds.push(cumulative);
    }
  }
  
  /** Get the primary biome at a position (no blending) */
  getBiomeAt(x: number, z: number): BiomeDefinition {
    return this.getBiomeForCell(Math.floor(x / this.biomeSize), Math.floor(z / this.biomeSize));
  }
  
  /** Get blended biome values at a position */
  getBlendedValues(x: number, z: number): BlendedBiomeValues {
    const { biomeSize, blendWidth } = this;
    const cellX = Math.floor(x / biomeSize);
    const cellZ = Math.floor(z / biomeSize);
    const localX = x - cellX * biomeSize;
    const localZ = z - cellZ * biomeSize;
    
    const primaryBiome = this.getBiomeForCell(cellX, cellZ);
    
    // Check proximity to edges
    const nearLeft = localX < blendWidth;
    const nearRight = localX >= biomeSize - blendWidth;
    const nearTop = localZ < blendWidth;
    const nearBottom = localZ >= biomeSize - blendWidth;
    
    // Fast path: not near any edge
    if (!nearLeft && !nearRight && !nearTop && !nearBottom) {
      return this.createValues(primaryBiome, 1, []);
    }
    
    // Collect neighbors with blend weights
    const neighbors: { biome: BiomeDefinition; weight: number }[] = [];
    
    if (nearLeft) neighbors.push({ biome: this.getBiomeForCell(cellX - 1, cellZ), weight: smoothstep(1 - localX / blendWidth) * 0.5 });
    if (nearRight) neighbors.push({ biome: this.getBiomeForCell(cellX + 1, cellZ), weight: smoothstep(1 - (biomeSize - localX) / blendWidth) * 0.5 });
    if (nearTop) neighbors.push({ biome: this.getBiomeForCell(cellX, cellZ - 1), weight: smoothstep(1 - localZ / blendWidth) * 0.5 });
    if (nearBottom) neighbors.push({ biome: this.getBiomeForCell(cellX, cellZ + 1), weight: smoothstep(1 - (biomeSize - localZ) / blendWidth) * 0.5 });
    
    // Corner blending
    if (nearLeft && nearTop) neighbors.push({ biome: this.getBiomeForCell(cellX - 1, cellZ - 1), weight: smoothstep(1 - Math.min(localX, localZ) / blendWidth) * 0.25 });
    if (nearRight && nearTop) neighbors.push({ biome: this.getBiomeForCell(cellX + 1, cellZ - 1), weight: smoothstep(1 - Math.min(biomeSize - localX, localZ) / blendWidth) * 0.25 });
    if (nearLeft && nearBottom) neighbors.push({ biome: this.getBiomeForCell(cellX - 1, cellZ + 1), weight: smoothstep(1 - Math.min(localX, biomeSize - localZ) / blendWidth) * 0.25 });
    if (nearRight && nearBottom) neighbors.push({ biome: this.getBiomeForCell(cellX + 1, cellZ + 1), weight: smoothstep(1 - Math.min(biomeSize - localX, biomeSize - localZ) / blendWidth) * 0.25 });
    
    const neighborWeight = neighbors.reduce((sum, n) => sum + n.weight, 0);
    return this.createValues(primaryBiome, Math.max(0.01, 1 - neighborWeight), neighbors);
  }
  
  private getBiomeForCell(cellX: number, cellZ: number): BiomeDefinition {
    const noise = (this.biomeNoise.sample((cellX + 0.5) * this.biomeSize, (cellZ + 0.5) * this.biomeSize) + 1) * 0.5;
    for (let i = 0; i < this.weightThresholds.length; i++) {
      if (noise < this.weightThresholds[i]) return this.sortedBiomes[i];
    }
    return this.sortedBiomes[this.sortedBiomes.length - 1];
  }
  
  private createValues(primary: BiomeDefinition, primaryWeight: number, neighbors: { biome: BiomeDefinition; weight: number }[]): BlendedBiomeValues {
    const blocks = {
      surface: primary.blocks.surface,
      subsurface: primary.blocks.subsurface ?? primary.blocks.surface,
      underground: primary.blocks.underground ?? primary.blocks.surface,
      subsurfaceDepth: primary.blocks.subsurfaceDepth ?? 4,
    };
    
    // Blend numeric values
    const totalWeight = primaryWeight + neighbors.reduce((s, n) => s + n.weight, 0);
    const blend = <T>(get: (b: BiomeDefinition) => T, combine: (acc: number, val: T, w: number) => number, init: number) => {
      let result = combine(init, get(primary), primaryWeight);
      for (const { biome, weight } of neighbors) result = combine(result, get(biome), weight);
      return result / totalWeight;
    };
    
    const terrain = {
      heightOffset: blend(b => b.terrain?.heightOffset ?? 0, (a, v, w) => a + v * w, 0),
      heightScale: blend(b => b.terrain?.heightScale ?? 1, (a, v, w) => a + v * w, 0),
      frequencyScale: blend(b => b.terrain?.frequencyScale ?? 1, (a, v, w) => a + v * w, 0),
      valleyScale: blend(b => b.terrain?.valleyScale ?? 1, (a, v, w) => a + v * w, 0),
    };
    
    const caves = {
      enabled: blend(b => (b.caves?.enabled ?? true) ? 1 : 0, (a, v, w) => a + v * w, 0) > 0.5,
      frequency: blend(b => b.caves?.frequency ?? 1, (a, v, w) => a + v * w, 0),
      threshold: blend(b => b.caves?.threshold ?? 0, (a, v, w) => a + v * w, 0),
      wormStrength: blend(b => (b.caves?.wormCaves ?? true) ? 1 : 0, (a, v, w) => a + v * w, 0),
    };
    
    return { biome: primary, blocks, terrain, caves };
  }
}

function smoothstep(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}
