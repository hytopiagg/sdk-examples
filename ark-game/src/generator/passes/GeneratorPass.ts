/**
 * Generator Pass System
 * 
 * Passes operate sequentially on a shared GenerationContext.
 * Each pass can read previous results and add/modify blocks.
 */

import type { BlockPlacement } from 'hytopia';
import type { GeneratorConfig } from '../GeneratorConfig';
import type { TerrainSampler } from '../noise/TerrainSampler';
import type { CaveCarver } from '../noise/CaveCarver';
import type { BiomeSampler, BlendedBiomeValues } from '../BiomeSampler';
import type { CaveBiomeModifiers } from '../noise/CaveCarver';

/**
 * Shared state passed between generation passes
 */
export interface GenerationContext {
  readonly config: GeneratorConfig;
  readonly terrain: TerrainSampler;
  readonly caves: CaveCarver;
  readonly biomes: BiomeSampler | null;

  /** Blocks grouped by type ID */
  readonly blocks: Map<number, BlockPlacement[]>;

  /** Add a block (with deduplication) */
  addBlock(blockId: number, x: number, y: number, z: number): void;

  /** Check if a position already has a block */
  hasBlock(x: number, y: number, z: number): boolean;

  /** Get biome values at position */
  getBiomeAt(x: number, z: number): BlendedBiomeValues | undefined;

  /** Get cave modifiers at position */
  getCaveModifiersAt(x: number, z: number): CaveBiomeModifiers | undefined;

  /**
   * Check if a position is carved (with cross-pass caching).
   * Carved results are memoized so subsequent passes skip 3D noise recomputation.
   */
  isCarved(x: number, y: number, z: number, biome: CaveBiomeModifiers | undefined, surfaceY: number): boolean;
}

/**
 * A single generation pass
 */
export interface GeneratorPass {
  /** Pass name for logging/debugging */
  readonly name: string;
  
  /** Execute this pass on the generation context */
  execute(ctx: GenerationContext): void;
}

/**
 * Creates a GenerationContext with proper block deduplication and biome caching
 */
export function createContext(
  config: GeneratorConfig,
  terrain: TerrainSampler,
  caves: CaveCarver,
  biomes: BiomeSampler | null
): GenerationContext {
  const blocks = new Map<number, BlockPlacement[]>();
  const { worldSize } = config;
  const stride = worldSize.x * worldSize.z;

  // Bitset for block deduplication and carved cache.
  // Uint32Array bitsets replace Sets to avoid JSC's ~16.7M entry limit.
  // For 512×128×512: 33.5M bits = ~4MB per bitset (vs hundreds of MB for Set).
  const totalPositions = worldSize.x * worldSize.y * worldSize.z;
  const bitsetWords = (totalPositions + 31) >>> 5;
  const addedBits = new Uint32Array(bitsetWords);
  const carvedBits = new Uint32Array(bitsetWords);

  // Cache biome values - major performance win (getBlendedValues is expensive)
  const biomeCache = new Map<number, BlendedBiomeValues>();

  // Reusable cave modifiers object to avoid allocations
  const cachedCaveModifiers: CaveBiomeModifiers = { enabled: true, frequency: 1, threshold: 0, wormStrength: 1 };

  const getBiomeCached = (x: number, z: number): BlendedBiomeValues | undefined => {
    if (!biomes) return undefined;
    const key = x + z * worldSize.x;
    let cached = biomeCache.get(key);
    if (!cached) {
      cached = biomes.getBlendedValues(x, z);
      biomeCache.set(key, cached);
    }
    return cached;
  };

  return {
    config,
    terrain,
    caves,
    biomes,
    blocks,

    addBlock(blockId: number, x: number, y: number, z: number) {
      if (y < 0 || y >= worldSize.y) return;
      const key = x + z * worldSize.x + y * stride;
      if (addedBits[key >>> 5] & (1 << (key & 31))) return;
      addedBits[key >>> 5] |= 1 << (key & 31);

      let list = blocks.get(blockId);
      if (!list) {
        list = [];
        blocks.set(blockId, list);
      }
      list.push({ globalCoordinate: { x, y, z } });
    },

    hasBlock(x: number, y: number, z: number): boolean {
      const key = x + z * worldSize.x + y * stride;
      return !!(addedBits[key >>> 5] & (1 << (key & 31)));
    },

    getBiomeAt: getBiomeCached,

    getCaveModifiersAt(x: number, z: number) {
      const biome = getBiomeCached(x, z);
      if (!biome) return undefined;
      cachedCaveModifiers.enabled = biome.caves.enabled;
      cachedCaveModifiers.frequency = biome.caves.frequency;
      cachedCaveModifiers.threshold = biome.caves.threshold;
      cachedCaveModifiers.wormStrength = biome.caves.wormStrength;
      return cachedCaveModifiers;
    },

    isCarved(x: number, y: number, z: number, biome: CaveBiomeModifiers | undefined, surfaceY: number): boolean {
      // Bounds check: TerrainPass neighbor checks can pass out-of-bounds coords
      if (x < 0 || x >= worldSize.x || z < 0 || z >= worldSize.z || y < 0 || y >= worldSize.y) return false;
      const key = x + z * worldSize.x + y * stride;
      if (carvedBits[key >>> 5] & (1 << (key & 31))) return true;
      const result = caves.isCarved(x, y, z, biome, surfaceY);
      if (result) carvedBits[key >>> 5] |= 1 << (key & 31);
      return result;
    },
  };
}

