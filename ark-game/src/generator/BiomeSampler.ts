/**
 * BiomeSampler - Deterministic biome selection with organic Voronoi-based regions
 * 
 * Uses cellular noise (like Terra) to create natural, irregular biome shapes
 * instead of grid-aligned squares. Provides smooth blending at boundaries.
 * 
 * Block selection uses noise-based dithering at boundaries (like Terra's blend.sampler)
 * to create natural, organic transitions between biome block types.
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
  private ditherNoise: Simplex2D;  // For block dithering at boundaries
  private jitterAmount: number;
  private sortedBiomes: BiomeDefinition[];
  private weightThresholds: number[];

  // Pre-allocated working array to avoid per-call allocations
  private readonly _neighborData: { biome: BiomeDefinition; weight: number }[];
  
  constructor(config: BiomeSamplerConfig) {
    // Cellular noise for organic Voronoi-based biome regions (jitter 0.7 = irregular but not chaotic)
    this.cellularNoise = new CellularNoise2D(config.seed + 111111, config.biomeSize, 0.7);
    
    // Coordinate jitter for even more organic boundaries (like Terra's mutator)
    this.jitterNoise = new Simplex2D(config.seed + 222222, 0.01);
    this.jitterAmount = config.biomeSize * 0.15;
    
    // Dither noise for block selection at boundaries (like Terra's blend.sampler)
    // Higher frequency creates finer-grained dithering pattern
    this.ditherNoise = new Simplex2D(config.seed + 333333, 0.15);
    
    // Pre-allocate neighbor data array (max 8 neighbors from cellular noise)
    this._neighborData = Array.from({ length: 8 }, () => ({ biome: null as any, weight: 0 }));

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
    const { primary, neighbors, neighborCount } = this.cellularNoise.sampleWithNeighbors(jx, jz);

    const primaryBiome = this.getBiomeForCell(primary);

    // If we're far from any edge (edgeFactor close to 0), fast path
    if (primary.edgeFactor < 0.1 || neighborCount === 0) {
      return this.createValues(primaryBiome, 1, this._neighborData, x, z, 0, 0);
    }

    // Convert neighbor cell info to biome weights based on distance
    let ndCount = 0;

    for (let i = 0; i < neighborCount; i++) {
      const neighbor = neighbors[i];
      const biome = this.getBiomeForCell(neighbor);

      // Weight is based on how close we are to this neighbor's cell
      // Use inverse distance ratio: closer neighbors get more weight
      const distRatio = primary.distance1 / neighbor.distance1;
      const weight = smoothstep(distRatio) * primary.edgeFactor;

      if (weight > 0.01) {
        const nd = this._neighborData[ndCount++];
        nd.biome = biome;
        nd.weight = weight;
      }
    }

    // Primary weight decreases as we approach boundaries
    const primaryWeight = Math.max(0.01, 1 - primary.edgeFactor * 0.8);

    return this.createValues(primaryBiome, primaryWeight, this._neighborData, x, z, primary.edgeFactor, ndCount);
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
    neighbors: { biome: BiomeDefinition; weight: number }[],
    x: number,
    z: number,
    edgeFactor: number,
    neighborCount: number = neighbors.length
  ): BlendedBiomeValues {
    let totalWeight = primaryWeight;
    for (let i = 0; i < neighborCount; i++) totalWeight += neighbors[i].weight;

    // Weighted average helper
    const avg = (get: (b: BiomeDefinition) => number) => {
      let sum = get(primary) * primaryWeight;
      for (let i = 0; i < neighborCount; i++) sum += get(neighbors[i].biome) * neighbors[i].weight;
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
    
    // Block selection: noise-based dithering at boundaries
    const blocks = this.selectDitheredBlocks(primary, primaryWeight, neighbors, neighborCount, x, z, edgeFactor);

    return { biome: primary, blocks, terrain, caves };
  }
  
  /**
   * Select blocks using noise-based dithering at boundaries (like Terra's blend.sampler)
   * Creates organic, natural-looking transitions between biome block types
   */
  private selectDitheredBlocks(
    primary: BiomeDefinition,
    primaryWeight: number,
    neighbors: { biome: BiomeDefinition; weight: number }[],
    neighborCount: number,
    x: number,
    z: number,
    edgeFactor: number
  ): { surface: number; subsurface: number; underground: number; subsurfaceDepth: number } {
    // If not at a boundary or no neighbors, use primary biome
    if (edgeFactor < 0.1 || neighborCount === 0) {
      return {
        surface: primary.blocks.surface,
        subsurface: primary.blocks.subsurface ?? primary.blocks.surface,
        underground: primary.blocks.underground ?? primary.blocks.surface,
        subsurfaceDepth: primary.blocks.subsurfaceDepth ?? 4,
      };
    }

    // Build cumulative thresholds inline (avoid allocating candidates/thresholds arrays)
    let totalWeight = primaryWeight * (primary.blendStrength ?? 1.0);
    for (let i = 0; i < neighborCount; i++) {
      totalWeight += neighbors[i].weight * (neighbors[i].biome.blendStrength ?? 1.0);
    }

    // Sample noise and map to 0-1 range
    const noise = (this.ditherNoise.sample(x, z) + 1) * 0.5;

    // Select biome based on noise value crossing cumulative weight thresholds
    let cumulative = (primaryWeight * (primary.blendStrength ?? 1.0)) / totalWeight;
    if (noise < cumulative) {
      return {
        surface: primary.blocks.surface,
        subsurface: primary.blocks.subsurface ?? primary.blocks.surface,
        underground: primary.blocks.underground ?? primary.blocks.surface,
        subsurfaceDepth: primary.blocks.subsurfaceDepth ?? 4,
      };
    }

    let selected = primary;
    for (let i = 0; i < neighborCount; i++) {
      cumulative += (neighbors[i].weight * (neighbors[i].biome.blendStrength ?? 1.0)) / totalWeight;
      if (noise < cumulative) {
        selected = neighbors[i].biome;
        break;
      }
    }

    return {
      surface: selected.blocks.surface,
      subsurface: selected.blocks.subsurface ?? selected.blocks.surface,
      underground: selected.blocks.underground ?? selected.blocks.surface,
      subsurfaceDepth: selected.blocks.subsurfaceDepth ?? 4,
    };
  }
}

function smoothstep(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}
