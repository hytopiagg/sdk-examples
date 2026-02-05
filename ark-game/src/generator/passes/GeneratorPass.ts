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

  /** Remove a block at position (if present) */
  removeBlock(x: number, y: number, z: number): void;

  /** Force a block at position (replaces existing block if needed) */
  setBlock(blockId: number, x: number, y: number, z: number): void;

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

  /**
   * Finalize grouped block placements after all passes complete.
   * Applies removals/replacements if any mutating pass ran.
   */
  finalizeBlocks(): { blocks: { [blockTypeId: number]: BlockPlacement[] }; totalBlocks: number };
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
  const removedBits = new Uint32Array(bitsetWords);
  const carvedBits = new Uint32Array(bitsetWords);
  const replacedBlocks = new Map<number, number>();
  let hasMutations = false;

  // Dense cache by x/z index avoids Map/hash overhead in hot paths.
  const biomeCache = biomes
    ? new Array<BlendedBiomeValues | undefined>(worldSize.x * worldSize.z)
    : null;

  const toKey = (x: number, y: number, z: number) => x + z * worldSize.x + y * stride;
  const inBounds = (x: number, y: number, z: number) =>
    x >= 0 && x < worldSize.x && z >= 0 && z < worldSize.z && y >= 0 && y < worldSize.y;

  const pushPlacement = (target: Map<number, BlockPlacement[]>, blockId: number, x: number, y: number, z: number) => {
    let list = target.get(blockId);
    if (!list) {
      list = [];
      target.set(blockId, list);
    }
    list.push({ globalCoordinate: { x, y, z } });
  };

  const getBiomeCached = (x: number, z: number): BlendedBiomeValues | undefined => {
    if (!biomes || !biomeCache) return undefined;

    const key = x + z * worldSize.x;
    let cached = biomeCache[key];
    if (!cached) {
      cached = biomes.getBlendedValues(x, z);
      biomeCache[key] = cached;
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
      if (!inBounds(x, y, z)) return;
      const key = toKey(x, y, z);
      const word = key >>> 5;
      const bit = 1 << (key & 31);
      const hasAdded = !!(addedBits[word] & bit);
      const isRemoved = !!(removedBits[word] & bit);

      // A forced replacement takes precedence over regular adds.
      if (replacedBlocks.has(key)) return;

      if (hasAdded && !isRemoved) return;

      if (hasAdded && isRemoved) {
        replacedBlocks.set(key, blockId);
        hasMutations = true;
        return;
      }

      if (isRemoved) removedBits[word] &= ~bit;
      addedBits[word] |= bit;
      pushPlacement(blocks, blockId, x, y, z);
    },

    removeBlock(x: number, y: number, z: number) {
      if (!inBounds(x, y, z)) return;
      const key = toKey(x, y, z);
      const word = key >>> 5;
      const bit = 1 << (key & 31);
      const hadReplacement = replacedBlocks.delete(key);
      const hadAdded = !!(addedBits[word] & bit);
      if (!hadReplacement && !hadAdded) return;
      removedBits[word] |= bit;
      hasMutations = true;
    },

    setBlock(blockId: number, x: number, y: number, z: number) {
      if (!inBounds(x, y, z)) return;
      const key = toKey(x, y, z);
      const word = key >>> 5;
      const bit = 1 << (key & 31);
      if (addedBits[word] & bit) removedBits[word] |= bit;
      replacedBlocks.set(key, blockId);
      hasMutations = true;
    },

    hasBlock(x: number, y: number, z: number): boolean {
      if (!inBounds(x, y, z)) return false;
      const key = toKey(x, y, z);
      if (replacedBlocks.has(key)) return true;
      const word = key >>> 5;
      const bit = 1 << (key & 31);
      if (removedBits[word] & bit) return false;
      return !!(addedBits[word] & bit);
    },

    getBiomeAt: getBiomeCached,

    getCaveModifiersAt(x: number, z: number) {
      return getBiomeCached(x, z)?.caves;
    },

    isCarved(x: number, y: number, z: number, biome: CaveBiomeModifiers | undefined, surfaceY: number): boolean {
      // Bounds check: TerrainPass neighbor checks can pass out-of-bounds coords
      if (x < 0 || x >= worldSize.x || z < 0 || z >= worldSize.z || y < 0 || y >= worldSize.y) return false;
      const key = toKey(x, y, z);
      if (carvedBits[key >>> 5] & (1 << (key & 31))) return true;
      const result = caves.isCarved(x, y, z, biome, surfaceY);
      if (result) carvedBits[key >>> 5] |= 1 << (key & 31);
      return result;
    },

    finalizeBlocks() {
      // Fast path: no mutating pass ran.
      if (!hasMutations) {
        const out: { [blockTypeId: number]: BlockPlacement[] } = {};
        let totalBlocks = 0;
        blocks.forEach((placements, blockId) => {
          out[blockId] = placements;
          totalBlocks += placements.length;
        });
        return { blocks: out, totalBlocks };
      }

      const finalized = new Map<number, BlockPlacement[]>();
      let totalBlocks = 0;

      blocks.forEach((placements, blockId) => {
        for (let i = 0; i < placements.length; i++) {
          const c = placements[i].globalCoordinate;
          const key = toKey(c.x, c.y, c.z);
          if (replacedBlocks.has(key)) continue;
          const word = key >>> 5;
          const bit = 1 << (key & 31);
          if (removedBits[word] & bit) continue;
          pushPlacement(finalized, blockId, c.x, c.y, c.z);
          totalBlocks++;
        }
      });

      replacedBlocks.forEach((blockId, key) => {
        const y = (key / stride) | 0;
        const rem = key - y * stride;
        const z = (rem / worldSize.x) | 0;
        const x = rem - z * worldSize.x;
        pushPlacement(finalized, blockId, x, y, z);
        totalBlocks++;
      });

      const out: { [blockTypeId: number]: BlockPlacement[] } = {};
      finalized.forEach((placements, blockId) => {
        out[blockId] = placements;
      });
      return { blocks: out, totalBlocks };
    },
  };
}
