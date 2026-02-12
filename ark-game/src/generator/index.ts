/**
 * Procedural World Generator
 * 
 * Generates only visible blocks (surface + cave boundaries).
 * Full terrain is deterministic - use getBlockAt() for on-demand queries.
 * 
 * @example
 * ```typescript
 * import { WorldGenerator, BIOMES } from './src/generator';
 * 
 * const generator = new WorldGenerator({
 *   seed: Date.now(),
 *   worldSize: { x: 512, y: 128, z: 512 },
 * });
 * 
 * // Initial generation (visible blocks only)
 * const result = generator.generate();
 * world.chunkLattice.initializeBlocks(result.blocks);
 * 
 * // On-demand: when a block is mined, get what's behind it
 * const blockBehind = generator.getBlockAt(x, y, z);
 * if (blockBehind !== null) {
 *   world.chunkLattice.setBlock({ x, y, z }, blockBehind);
 * }
 * 
 * // Access biome definitions
 * console.log(BIOMES.mountains.terrain?.heightScale); // 2.0
 * ```
 */

export { default as WorldGenerator, type GeneratorResult, type GeneratorChunkResult } from './WorldGenerator';
export type { GeneratorConfig } from './GeneratorConfig';
export { DEFAULT_CONFIG, mergeConfig } from './GeneratorConfig';
export { BiomeSampler, type BiomeSamplerConfig, type BlendedBiomeValues } from './BiomeSampler';
export * from './noise';
export * from './biomes';
export * from './passes';
