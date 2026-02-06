/**
 * Speleothem Pass - Cave stalactite/stalagmite decoration.
 *
 * Biomes opt in via `biome.caves.speleothems`. Formations are deterministic
 * and placed only from solid cave anchors into carved air.
 *
 * Execution order: after terrain/blending/craters, before liquids.
 */

import type { GenerationContext, GeneratorPass } from './GeneratorPass';
import type { BiomeCaveConfig } from '../biomes/BiomeDefinition';
import type { CaveBiomeModifiers } from '../noise/CaveCarver';

const HASH_A = 374761393;
const HASH_B = 668265263;
const HASH_C = 1274126177;
const HASH_D = 2246822519;
const HASH_MAX = 0x7fffffff;

interface SpeleothemBlock {
  blockId: number;
  weight: number;
}

interface ResolvedSpeleothemConfig {
  density: number;
  minLength: number;
  maxLength: number;
  stalactites: boolean;
  stalagmites: boolean;
  blocks: SpeleothemBlock[];
  totalWeight: number;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function hash4(seed: number, x: number, y: number, z: number, salt: number): number {
  let h = (seed + x * HASH_A + y * HASH_B + z * HASH_C + salt * HASH_D) | 0;
  h = ((h ^ (h >>> 13)) * HASH_C) | 0;
  return h;
}

function rand01(h: number): number {
  return (h & HASH_MAX) / HASH_MAX;
}

export class SpeleothemPass implements GeneratorPass {
  readonly name = 'speleothem';

  execute(ctx: GenerationContext): void {
    const { worldSize, caves: caveConfig, seed } = ctx.config;
    if (!caveConfig.enabled || !ctx.biomes) return;

    const resolvedByBiome = new Map<string, ResolvedSpeleothemConfig | null>();
    const passSeed = (seed ^ 0x4c11db7) | 0;

    for (let x = 0; x < worldSize.x; x++) {
      for (let z = 0; z < worldSize.z; z++) {
        const blended = ctx.getBiomeAt(x, z);
        if (!blended) continue;

        const biome = blended.biome;
        let resolved = resolvedByBiome.get(biome.id);
        if (resolved === undefined) {
          resolved = this.resolveConfig(biome.caves?.speleothems);
          resolvedByBiome.set(biome.id, resolved);
        }
        if (!resolved) continue;

        const caveModifiers = blended.caves;
        if (!(caveModifiers?.enabled ?? true)) continue;

        const surfaceY = ctx.terrain.getBaseHeight(x, z) | 0;
        const minY = Math.max(1, caveConfig.minHeight + 1);
        const maxY = Math.min(worldSize.y - 2, surfaceY - caveConfig.surfaceFadeDistance - 1);
        if (maxY < minY) continue;

        for (let y = minY; y <= maxY; y++) {
          if (ctx.hasBlock(x, y, z)) continue;
          const canStalactite = resolved.stalactites && ctx.hasBlock(x, y + 1, z);
          const canStalagmite = resolved.stalagmites && ctx.hasBlock(x, y - 1, z);
          if (!canStalactite && !canStalagmite) continue;
          if (!ctx.isCarved(x, y, z, caveModifiers, surfaceY)) continue;

          let occupied = false;
          if (canStalactite) {
            const h = hash4(passSeed, x, y, z, 11);
            if (rand01(h) < resolved.density) {
              occupied = this.growFormation(ctx, x, y, z, -1, surfaceY, caveModifiers, resolved, h);
            }
          }

          if (canStalagmite && !occupied) {
            const h = hash4(passSeed, x, y, z, 29);
            if (rand01(h) < resolved.density) {
              this.growFormation(ctx, x, y, z, 1, surfaceY, caveModifiers, resolved, h);
            }
          }
        }
      }
    }
  }

  private resolveConfig(
    config: BiomeCaveConfig['speleothems']
  ): ResolvedSpeleothemConfig | null {
    if (!config || config.enabled === false) return null;

    const blocks: SpeleothemBlock[] = [];
    if (Array.isArray(config.blocks) && config.blocks.length > 0) {
      for (let i = 0; i < config.blocks.length; i++) {
        const opt = config.blocks[i];
        const weight = opt.weight ?? 1;
        if (weight <= 0) continue;
        blocks.push({ blockId: opt.blockId, weight });
      }
    } else if (config.blockId !== undefined) {
      blocks.push({ blockId: config.blockId, weight: 1 });
    }

    if (blocks.length === 0) return null;

    let totalWeight = 0;
    for (let i = 0; i < blocks.length; i++) totalWeight += blocks[i].weight;
    if (totalWeight <= 0) return null;

    const density = clamp01(config.density ?? 0.06);
    if (density <= 0) return null;

    const minLength = Math.max(1, (config.minLength ?? 1) | 0);
    const maxLength = Math.max(minLength, (config.maxLength ?? 4) | 0);
    const stalactites = config.stalactites ?? true;
    const stalagmites = config.stalagmites ?? true;
    if (!stalactites && !stalagmites) return null;

    return { density, minLength, maxLength, stalactites, stalagmites, blocks, totalWeight };
  }

  private growFormation(
    ctx: GenerationContext,
    x: number,
    y: number,
    z: number,
    dy: -1 | 1,
    surfaceY: number,
    caveModifiers: CaveBiomeModifiers | undefined,
    config: ResolvedSpeleothemConfig,
    hash: number
  ): boolean {
    const span = config.maxLength - config.minLength + 1;
    const length = config.minLength + ((((hash >>> 1) & HASH_MAX) % span) | 0);
    const blockId = this.selectBlock(config, hash >>> 3);
    let placed = false;

    for (let i = 0; i < length; i++) {
      const ty = y + i * dy;
      if (ty <= 0 || ty >= ctx.config.worldSize.y - 1) break;
      if (ctx.hasBlock(x, ty, z)) break;
      if (!ctx.isCarved(x, ty, z, caveModifiers, surfaceY)) break;
      ctx.addBlock(blockId, x, ty, z);
      placed = true;
    }
    return placed;
  }

  private selectBlock(config: ResolvedSpeleothemConfig, hash: number): number {
    if (config.blocks.length === 1) return config.blocks[0].blockId;
    const target = rand01(hash) * config.totalWeight;
    let acc = 0;
    for (let i = 0; i < config.blocks.length; i++) {
      acc += config.blocks[i].weight;
      if (target <= acc) return config.blocks[i].blockId;
    }
    return config.blocks[config.blocks.length - 1].blockId;
  }
}
