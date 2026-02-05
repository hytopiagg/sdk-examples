/**
 * BiomeSampler - Deterministic biome selection with organic Voronoi-based regions
 * 
 * Uses cellular noise (like Terra) to create natural, irregular biome shapes
 * instead of grid-aligned squares. Provides smooth blending at boundaries.
 * 
 * Block selection uses the DOMINANT biome (highest weight) at each position,
 * not random dithering - this creates natural transitions that follow terrain.
 */

import { CellularNoise2D, CellInfo } from './noise/Cellular';
import { Simplex2D } from './noise/Simplex';
import { BiomeDefinition, ALL_BIOMES, getTotalWeight } from './biomes';

export interface BiomeSamplerConfig {
  seed: number;
  /** Average biome cell size in blocks */
  biomeSize: number;
  /** Width of blend zone at biome borders (in blocks) */
  blendWidth: number;
}

export interface BlendedBiomeValues {
  biome: BiomeDefinition;
  blocks: { surface: number; subsurface: number; underground: number; subsurfaceDepth: number };
  terrain: { heightOffset: number; heightScale: number; frequencyScale: number; valleyScale: number };
  caves: { enabled: boolean; frequency: number; threshold: number; wormStrength: number };
}

export class BiomeSampler {
  private cellularNoise: CellularNoise2D;
  private jitterNoise: Simplex2D;
  private jitterAmount: number;
  private sortedBiomes: BiomeDefinition[];
  private weightThresholds: number[];
  
  constructor(config: BiomeSamplerConfig) {
    // Cellular noise for organic Voronoi-based biome regions (jitter 0.7 = irregular but not chaotic)
    this.cellularNoise = new CellularNoise2D(config.seed + 111111, config.biomeSize, 0.7);
    
    // Coordinate jitter for even more organic boundaries (like Terra's mutator)
    this.jitterNoise = new Simplex2D(config.seed + 222222, 0.01);
    this.jitterAmount = config.biomeSize * 0.15;
    
    // Pre-sort biomes and compute cumulative weight thresholds
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
    const [jx, jz] = this.applyJitter(x, z);
    return this.getBiomeForCell(this.cellularNoise.sample(jx, jz));
  }
  
  /** Get blended biome values at a position */
  getBlendedValues(x: number, z: number): BlendedBiomeValues {
    const [jx, jz] = this.applyJitter(x, z);
    const { primary, neighbors } = this.cellularNoise.sampleWithNeighbors(jx, jz);
    
    const primaryBiome = this.getBiomeForCell(primary);
    
    // If we're far from any edge (edgeFactor close to 0), fast path
    if (primary.edgeFactor < 0.1 || neighbors.length === 0) {
      return this.createValues(primaryBiome, 1, []);
    }
    
    // Convert neighbor cell info to biome weights based on distance
    const neighborData: { biome: BiomeDefinition; weight: number }[] = [];
    
    for (const neighbor of neighbors) {
      const biome = this.getBiomeForCell(neighbor);
      
      // Weight is based on how close we are to this neighbor's cell
      // Use inverse distance ratio: closer neighbors get more weight
      const distRatio = primary.distance1 / neighbor.distance1;
      const weight = smoothstep(distRatio) * primary.edgeFactor;
      
      if (weight > 0.01) {
        neighborData.push({ biome, weight });
      }
    }
    
    // Primary weight decreases as we approach boundaries
    const primaryWeight = Math.max(0.01, 1 - primary.edgeFactor * 0.8);
    
    return this.createValues(primaryBiome, primaryWeight, neighborData);
  }
  
  /** Apply coordinate jitter for organic boundaries */
  private applyJitter(x: number, z: number): [number, number] {
    return [
      x + this.jitterNoise.sample(x, z) * this.jitterAmount,
      z + this.jitterNoise.sample(x + 1000, z + 1000) * this.jitterAmount,
    ];
  }
  
  /**
   * Get biome for a cellular noise cell
   * Uses cell ID hash to deterministically select from weighted biomes
   */
  private getBiomeForCell(cell: CellInfo): BiomeDefinition {
    // Normalize cell ID to 0-1 range
    const normalized = ((cell.cellId & 0x7fffffff) / 0x7fffffff);
    
    for (let i = 0; i < this.weightThresholds.length; i++) {
      if (normalized < this.weightThresholds[i]) {
        return this.sortedBiomes[i];
      }
    }
    return this.sortedBiomes[this.sortedBiomes.length - 1];
  }
  
  private createValues(
    primary: BiomeDefinition, 
    primaryWeight: number, 
    neighbors: { biome: BiomeDefinition; weight: number }[]
  ): BlendedBiomeValues {
    const totalWeight = primaryWeight + neighbors.reduce((s, n) => s + n.weight, 0);
    
    // Weighted average helper
    const avg = (get: (b: BiomeDefinition) => number) => {
      let sum = get(primary) * primaryWeight;
      for (const { biome, weight } of neighbors) sum += get(biome) * weight;
      return sum / totalWeight;
    };
    
    const terrain = {
      heightOffset: avg(b => b.terrain?.heightOffset ?? 0),
      heightScale: avg(b => b.terrain?.heightScale ?? 1),
      frequencyScale: avg(b => b.terrain?.frequencyScale ?? 1),
      valleyScale: avg(b => b.terrain?.valleyScale ?? 1),
    };
    
    const caves = {
      enabled: avg(b => (b.caves?.enabled ?? true) ? 1 : 0) > 0.5,
      frequency: avg(b => b.caves?.frequency ?? 1),
      threshold: avg(b => b.caves?.threshold ?? 0),
      wormStrength: avg(b => (b.caves?.wormCaves ?? true) ? 1 : 0),
    };
    
    // Block selection: use dominant biome (highest adjusted weight)
    const blocks = this.selectDominantBlocks(primary, primaryWeight, neighbors);
    
    return { biome: primary, blocks, terrain, caves };
  }
  
  /**
   * Select blocks from the DOMINANT biome at this position
   * No random dithering - blocks follow the biome that "owns" this position
   */
  private selectDominantBlocks(
    primary: BiomeDefinition,
    primaryWeight: number,
    neighbors: { biome: BiomeDefinition; weight: number }[]
  ): { surface: number; subsurface: number; underground: number; subsurfaceDepth: number } {
    // Apply blendStrength to weights
    const primaryAdjusted = primaryWeight * (primary.blendStrength ?? 1.0);
    
    // Find dominant biome (highest adjusted weight)
    let dominant = primary;
    let dominantWeight = primaryAdjusted;
    
    for (const { biome, weight } of neighbors) {
      const adjusted = weight * (biome.blendStrength ?? 1.0);
      if (adjusted > dominantWeight) {
        dominant = biome;
        dominantWeight = adjusted;
      }
    }
    
    // Use dominant biome's blocks
    return {
      surface: dominant.blocks.surface,
      subsurface: dominant.blocks.subsurface ?? dominant.blocks.surface,
      underground: dominant.blocks.underground ?? dominant.blocks.surface,
      subsurfaceDepth: dominant.blocks.subsurfaceDepth ?? 4,
    };
  }
}

function smoothstep(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}
