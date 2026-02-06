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
import { normalizeBiomeBlocks, type ResolvedBiomeBlocks } from './blocks/BlockSelector';

export interface BiomeSamplerConfig {
  seed: number;
  /** Average biome cell size in blocks */
  biomeSize: number;
}

export interface BlendedBiomeValues {
  biome: BiomeDefinition;
  blocks: ResolvedBiomeBlocks;
  terrain: { heightOffset: number; heightScale: number; frequencyScale: number; valleyScale: number };
  caves: {
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
  };
  roads: {
    densityMult: number;
    throughCostMult: number;
    forkChanceMult: number;
    tunnelChanceMult: number;
    curveBiasMult: number;
    erosionMult: number;
  };
}

export class BiomeSampler {
  private static readonly MAX_UPHILL_BLEND_Y = 3;
  private static readonly MAX_UPHILL_TERRAIN_OFFSET = 3;
  private static readonly ADJACENT_X = new Int8Array([1, -1, 0, 0]);
  private static readonly ADJACENT_Z = new Int8Array([0, 0, 1, -1]);

  private cellularNoise: CellularNoise2D;
  private jitterNoise: Simplex2D;
  private ditherNoise: Simplex2D;  // For block dithering at boundaries
  private jitterAmount: number;
  private sortedBiomes: BiomeDefinition[];
  private weightThresholds: number[];
  private materialHeightSampler: ((x: number, z: number) => number) | null = null;

  // Pre-allocated working array to avoid per-call allocations
  private readonly _neighborData: { biome: BiomeDefinition; weight: number }[];
  private readonly _allowedNeighbor = new Uint8Array(8);
  private readonly _adjacentBiomes: (BiomeDefinition | undefined)[] = new Array(4);
  private readonly _adjacentHeights = new Int16Array(4);
  
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

  /**
   * Optional terrain-height callback used for material blending constraints.
   * When set, boundary dithering is prevented from climbing uphill too far.
   */
  setMaterialHeightSampler(sampler: ((x: number, z: number) => number) | null): void {
    this.materialHeightSampler = sampler;
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

    // If cellular sampling produced no neighbor candidates, fast path.
    if (neighborCount === 0) {
      return this.createValues(primaryBiome, 1, this._neighborData, x, z, 0);
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

    return this.createValues(primaryBiome, primaryWeight, this._neighborData, x, z, ndCount);
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
    neighborCount: number = neighbors.length
  ): BlendedBiomeValues {
    let totalWeight = primaryWeight;
    for (let i = 0; i < neighborCount; i++) totalWeight += neighbors[i].weight;
    
    const terrain = this.blendTerrain(primary, primaryWeight, neighbors, neighborCount);

    // Cave blending can be weighted independently from terrain blending.
    const primaryCaveBlend = Math.max(0, primary.caves?.blendWeight ?? 1);
    let cavePrimaryWeight = primaryWeight * primaryCaveBlend;
    let caveTotalWeight = cavePrimaryWeight;
    for (let i = 0; i < neighborCount; i++) {
      const nb = neighbors[i];
      caveTotalWeight += nb.weight * Math.max(0, nb.biome.caves?.blendWeight ?? 1);
    }
    if (caveTotalWeight <= 1e-6) {
      cavePrimaryWeight = primaryWeight;
      caveTotalWeight = totalWeight;
    }
    const caveAvg = (get: (b: BiomeDefinition) => number) => {
      let sum = get(primary) * cavePrimaryWeight;
      for (let i = 0; i < neighborCount; i++) {
        const nb = neighbors[i];
        sum += get(nb.biome) * nb.weight * Math.max(0, nb.biome.caves?.blendWeight ?? 1);
      }
      return sum / caveTotalWeight;
    };

    const caves = {
      enabled: caveAvg(b => (b.caves?.enabled ?? true) ? 1 : 0) > 0.5,
      frequency: caveAvg(b => b.caves?.frequency ?? 1),
      threshold: caveAvg(b => b.caves?.threshold ?? 0),
      wormStrength: caveAvg(b => (b.caves?.wormCaves ?? true) ? (b.caves?.wormStrength ?? 1) : 0),
      profileCenterY: caveAvg(b => b.caves?.profile?.centerY ?? 0),
      profileRange: caveAvg(b => b.caves?.profile?.range ?? 0),
      profileStrength: caveAvg(b => b.caves?.profile?.strength ?? 1),
      warpStrength: caveAvg(b => b.caves?.warp?.strength ?? 0),
      warpFrequency: caveAvg(b => b.caves?.warp?.frequency ?? 1),
      chamberChance: caveAvg(b => b.caves?.chamber?.chance ?? 0),
      chamberStrength: caveAvg(b => b.caves?.chamber?.strength ?? 0),
      chamberFrequency: caveAvg(b => b.caves?.chamber?.frequency ?? 1),
    };

    const roadAvg = (get: (b: BiomeDefinition) => number) => {
      let sum = get(primary) * primaryWeight;
      for (let i = 0; i < neighborCount; i++) {
        const nb = neighbors[i];
        sum += get(nb.biome) * nb.weight;
      }
      return sum / totalWeight;
    };
    const roads = {
      densityMult: roadAvg(b => b.roads?.densityMult ?? 1),
      throughCostMult: roadAvg(b => b.roads?.throughCostMult ?? 1),
      forkChanceMult: roadAvg(b => b.roads?.forkChanceMult ?? 1),
      tunnelChanceMult: roadAvg(b => b.roads?.tunnelChanceMult ?? 1),
      curveBiasMult: roadAvg(b => b.roads?.curveBiasMult ?? 1),
      erosionMult: roadAvg(b => b.roads?.erosionMult ?? 1),
    };
    
    // Block selection: noise-based dithering at boundaries
    const blocks = this.selectDitheredBlocks(primary, primaryWeight, neighbors, neighborCount, x, z);

    return { biome: primary, blocks, terrain, caves, roads };
  }

  private blendTerrain(
    primary: BiomeDefinition,
    primaryWeight: number,
    neighbors: { biome: BiomeDefinition; weight: number }[],
    neighborCount: number
  ): BlendedBiomeValues['terrain'] {
    const primaryOffset = primary.terrain?.heightOffset ?? 0;
    const uphillLimit = primaryOffset + BiomeSampler.MAX_UPHILL_TERRAIN_OFFSET;

    let totalWeight = primaryWeight;
    let offsetSum = primaryOffset * primaryWeight;
    let scaleSum = (primary.terrain?.heightScale ?? 1) * primaryWeight;
    let frequencySum = (primary.terrain?.frequencyScale ?? 1) * primaryWeight;
    let valleySum = (primary.terrain?.valleyScale ?? 1) * primaryWeight;

    for (let i = 0; i < neighborCount; i++) {
      const neighbor = neighbors[i];
      const neighborOffset = neighbor.biome.terrain?.heightOffset ?? 0;
      if (neighborOffset > uphillLimit) continue;

      const w = neighbor.weight;
      totalWeight += w;
      offsetSum += neighborOffset * w;
      scaleSum += (neighbor.biome.terrain?.heightScale ?? 1) * w;
      frequencySum += (neighbor.biome.terrain?.frequencyScale ?? 1) * w;
      valleySum += (neighbor.biome.terrain?.valleyScale ?? 1) * w;
    }

    return {
      heightOffset: offsetSum / totalWeight,
      heightScale: scaleSum / totalWeight,
      frequencyScale: frequencySum / totalWeight,
      valleyScale: valleySum / totalWeight,
    };
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
    z: number
  ): ResolvedBiomeBlocks {
    // If there are no neighboring cells to blend against, use primary biome.
    if (neighborCount === 0) {
      return this.normalizedBlocks(primary);
    }

    const heightAt = this.materialHeightSampler;
    const localSurfaceY = heightAt ? (heightAt(x, z) | 0) : undefined;
    const primaryOffset = primary.terrain?.heightOffset ?? 0;
    const allowedNeighbor = this._allowedNeighbor;
    let primaryAllowed = true;

    if (localSurfaceY !== undefined && heightAt) {
      for (let i = 0; i < BiomeSampler.ADJACENT_X.length; i++) {
        const nx = x + BiomeSampler.ADJACENT_X[i];
        const nz = z + BiomeSampler.ADJACENT_Z[i];
        this._adjacentBiomes[i] = this.getBiomeAt(nx, nz);
        this._adjacentHeights[i] = heightAt(nx, nz) | 0;
      }
      primaryAllowed = this.isPrimaryUphillAllowed(primary, localSurfaceY);
    }

    // Build cumulative thresholds inline (avoid allocating candidates/thresholds arrays)
    // Neighbor candidates that would require steep uphill material creep are excluded.
    const primaryBlendWeight = primaryAllowed ? primaryWeight * (primary.blendStrength ?? 1.0) : 0;
    let totalWeight = primaryBlendWeight;
    for (let i = 0; i < neighborCount; i++) {
      const neighborBiome = neighbors[i].biome;
      const neighborOffset = neighborBiome.terrain?.heightOffset ?? 0;
      const passesOffsetLimit = neighborOffset + BiomeSampler.MAX_UPHILL_TERRAIN_OFFSET >= primaryOffset;
      const canUse = localSurfaceY === undefined
        ? (passesOffsetLimit ? 1 : 0)
        : (passesOffsetLimit && this.isNeighborUphillAllowed(neighborBiome, localSurfaceY)) ? 1 : 0;

      allowedNeighbor[i] = canUse;
      if (canUse) {
        totalWeight += neighbors[i].weight * (neighborBiome.blendStrength ?? 1.0);
      }
    }
    if (totalWeight <= 1e-6) return this.normalizedBlocks(primary);

    // Sample noise and map to 0-1 range
    const noise = (this.ditherNoise.sample(x, z) + 1) * 0.5;

    // Select biome based on noise value crossing cumulative weight thresholds
    let cumulative = primaryBlendWeight / totalWeight;
    if (primaryBlendWeight > 0 && noise < cumulative) {
      return this.normalizedBlocks(primary);
    }

    let selected = primary;
    if (!primaryAllowed) {
      for (let i = 0; i < neighborCount; i++) {
        if (!allowedNeighbor[i]) continue;
        selected = neighbors[i].biome;
        break;
      }
    }
    for (let i = 0; i < neighborCount; i++) {
      if (!allowedNeighbor[i]) continue;
      const neighborBiome = neighbors[i].biome;
      cumulative += (neighbors[i].weight * (neighborBiome.blendStrength ?? 1.0)) / totalWeight;
      if (noise < cumulative) {
        selected = neighborBiome;
        break;
      }
    }

    return this.normalizedBlocks(selected);
  }

  private normalizedBlocks(biome: BiomeDefinition): ResolvedBiomeBlocks {
    return normalizeBiomeBlocks(biome.blocks);
  }

  private isPrimaryUphillAllowed(primaryBiome: BiomeDefinition, localSurfaceY: number): boolean {
    let lowestPrimaryY = 2147483647;

    for (let i = 0; i < BiomeSampler.ADJACENT_X.length; i++) {
      if (this._adjacentBiomes[i] !== primaryBiome) continue;
      const sourceY = this._adjacentHeights[i];
      if (sourceY < lowestPrimaryY) lowestPrimaryY = sourceY;
    }

    // If no adjacent primary-biome sample exists, keep primary eligible.
    return lowestPrimaryY === 2147483647 || localSurfaceY <= lowestPrimaryY + BiomeSampler.MAX_UPHILL_BLEND_Y;
  }

  private isNeighborUphillAllowed(sourceBiome: BiomeDefinition, localSurfaceY: number): boolean {
    let lowestSourceY = 2147483647;

    for (let i = 0; i < BiomeSampler.ADJACENT_X.length; i++) {
      if (this._adjacentBiomes[i] !== sourceBiome) continue;
      const sourceY = this._adjacentHeights[i];
      if (sourceY < lowestSourceY) lowestSourceY = sourceY;
    }

    return lowestSourceY !== 2147483647 && localSurfaceY <= lowestSourceY + BiomeSampler.MAX_UPHILL_BLEND_Y;
  }
}

function smoothstep(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}
