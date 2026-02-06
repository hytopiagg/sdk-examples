import type {
  BiomeBlockLayerConfig,
  BiomeBlockOption,
  BiomeBlocks,
} from '../biomes/BiomeDefinition';

export interface ResolvedBiomeBlocks {
  surface: BiomeBlockLayerConfig;
  subsurface: BiomeBlockLayerConfig;
  underground: BiomeBlockLayerConfig;
  subsurfaceDepth: number;
}

const HASH_A = 374761393;
const HASH_B = 668265263;
const HASH_C = 1274126177;
const HASH_MAX = 0x7fffffff;

function hash4(seed: number, x: number, y: number, z: number): number {
  let h = (seed + x * HASH_A + z * HASH_B + y * 3266489917) | 0;
  h = ((h ^ (h >>> 13)) * HASH_C) | 0;
  return h;
}

function rand01(h: number): number {
  return (h & HASH_MAX) / HASH_MAX;
}

function optionWeight(option: BiomeBlockOption): number {
  const weight = option.weight ?? 1;
  return weight > 0 ? weight : 0;
}

function optionMatches(option: BiomeBlockOption, y: number, depth: number): boolean {
  if (option.minY !== undefined && y < option.minY) return false;
  if (option.maxY !== undefined && y > option.maxY) return false;
  if (option.minDepth !== undefined && depth < option.minDepth) return false;
  if (option.maxDepth !== undefined && depth > option.maxDepth) return false;
  return true;
}

export function normalizeBiomeBlocks(blocks: BiomeBlocks): ResolvedBiomeBlocks {
  const surface = blocks.surface;
  const subsurface = blocks.subsurface ?? surface;
  const underground = blocks.underground ?? subsurface;
  return {
    surface,
    subsurface,
    underground,
    subsurfaceDepth: blocks?.subsurfaceDepth ?? 4,
  };
}

function layerForDepth(blocks: ResolvedBiomeBlocks, depth: number): BiomeBlockLayerConfig {
  if (depth <= 0) return blocks.surface;
  if (depth <= blocks.subsurfaceDepth) return blocks.subsurface;
  return blocks.underground;
}

function resolveLayerBlock(layer: BiomeBlockLayerConfig, seed: number, x: number, y: number, z: number, depth: number): number {
  if (layer.length === 0) return 0;

  let totalWeight = 0;
  let hasEligible = false;
  for (let i = 0; i < layer.length; i++) {
    const option = layer[i];
    if (!optionMatches(option, y, depth)) continue;
    const w = optionWeight(option);
    if (w <= 0) continue;
    totalWeight += w;
    hasEligible = true;
  }

  if (!hasEligible || totalWeight <= 0) return layer[0].blockId;

  const target = rand01(hash4(seed, x, y, z)) * totalWeight;
  let cumulative = 0;
  let lastEligible = layer[0].blockId;

  for (let i = 0; i < layer.length; i++) {
    const option = layer[i];
    if (!optionMatches(option, y, depth)) continue;
    const w = optionWeight(option);
    if (w <= 0) continue;
    cumulative += w;
    lastEligible = option.blockId;
    if (target <= cumulative) return option.blockId;
  }

  return lastEligible;
}

export function resolveBiomeBlock(
  blocks: ResolvedBiomeBlocks,
  seed: number,
  x: number,
  y: number,
  z: number,
  depth: number
): number {
  return resolveLayerBlock(layerForDepth(blocks, depth), seed, x, y, z, depth);
}
