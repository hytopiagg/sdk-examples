/**
 * Biome Registry
 * 
 * Central export for all biome definitions.
 * Add new biomes by importing them here.
 */

export type {
  BiomeDefinition,
  BiomeBlockOption,
  BiomeBlockLayerConfig,
  BiomeBlocks,
  BiomeTerrainConfig,
  BiomeCaveConfig,
  BiomeCraterConfig,
} from './BiomeDefinition';
export { defineBiome } from './BiomeDefinition';

// Import all biomes
import grasslands from './grasslands';
import desert from './desert';
import mountains from './mountains';
import forest from './forest';
import wasteland from './wasteland';
import ocean from './ocean';

/** All registered biomes */
export const BIOMES = {
  grasslands,
  desert,
  mountains,
  forest,
  wasteland,
  ocean,
} as const;

/** Array of all biomes for iteration */
export const ALL_BIOMES = Object.values(BIOMES);

/** Get biome by ID */
export function getBiome(id: string) {
  return ALL_BIOMES.find(b => b.id === id);
}

/** Calculate total weight of all biomes (for probability calculations) */
export function getTotalWeight(): number {
  return ALL_BIOMES.reduce((sum, b) => sum + b.weight, 0);
}

// Re-export individual biomes for direct import
export { grasslands, desert, mountains, forest, wasteland, ocean };
