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
 * Creates a GenerationContext with proper block deduplication
 */
export function createContext(
  config: GeneratorConfig,
  terrain: TerrainSampler,
  caves: CaveCarver,
  biomes: BiomeSampler | null
): GenerationContext {
  const blocks = new Map<number, BlockPlacement[]>();
  const added = new Set<number>();
  const { worldSize } = config;
  const stride = worldSize.x * worldSize.z;
  
  return {
    config,
    terrain,
    caves,
    biomes,
    blocks,
    
    addBlock(blockId: number, x: number, y: number, z: number) {
      if (y < 0 || y >= worldSize.y) return;
      const key = x + z * worldSize.x + y * stride;
      if (added.has(key)) return;
      added.add(key);
      
      let list = blocks.get(blockId);
      if (!list) {
        list = [];
        blocks.set(blockId, list);
      }
      list.push({ globalCoordinate: { x, y, z } });
    },
    
    hasBlock(x: number, y: number, z: number): boolean {
      const key = x + z * worldSize.x + y * stride;
      return added.has(key);
    },
    
    getBiomeAt(x: number, z: number) {
      return biomes?.getBlendedValues(x, z);
    },
    
    getCaveModifiersAt(x: number, z: number) {
      const biome = biomes?.getBlendedValues(x, z);
      if (!biome) return undefined;
      return {
        enabled: biome.caves.enabled,
        frequency: biome.caves.frequency,
        threshold: biome.caves.threshold,
        wormStrength: biome.caves.wormStrength,
      };
    },
  };
}

