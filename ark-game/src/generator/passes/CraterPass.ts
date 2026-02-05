/**
 * Crater Pass - Deterministic spherical-cap impact carving
 *
 * Biomes opt in via `biome.craters`. Each crater is sampled on a jittered grid,
 * then carved as a sphere contact cap from local surface height downward.
 */

import type { GenerationContext, GeneratorPass } from './GeneratorPass';

interface CraterImpact {
  x: number;
  z: number;
  radius: number;
  depth: number;
  impactBlockId?: number;
  impactRadius: number;
}

const HASH_A = 374761393;
const HASH_B = 668265263;
const HASH_C = 1274126177;
const HASH_MAX = 0x7fffffff;

function hash2(seed: number, x: number, z: number): number {
  let h = (seed + x * HASH_A + z * HASH_B) | 0;
  h = ((h ^ (h >>> 13)) * HASH_C) | 0;
  return h;
}

function rand01(h: number): number {
  return (h & HASH_MAX) / HASH_MAX;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function jitter(base: number, amount: number, rnd: number): number {
  const spread = Math.max(0, amount);
  return base * (1 + (rnd * 2 - 1) * spread);
}

export class CraterPass implements GeneratorPass {
  readonly name = 'crater';

  execute(ctx: GenerationContext): void {
    const impacts: CraterImpact[] = [];
    this.collectImpacts(ctx, impacts);

    for (let i = 0; i < impacts.length; i++) {
      this.applyImpact(ctx, impacts[i]);
    }
  }

  private collectImpacts(ctx: GenerationContext, out: CraterImpact[]): void {
    if (!ctx.biomes) return;
    const { x: sizeX, z: sizeZ } = ctx.config.worldSize;
    const seed = (ctx.config.seed ^ 0x5f3759df) | 0;

    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const primary = ctx.getBiomeAt(x, z)?.biome;
        const crater = primary?.craters;
        if (!crater) continue;

        const spacing = Math.max(8, crater.spacing | 0);
        const cellX = (x / spacing) | 0;
        const cellZ = (z / spacing) | 0;

        const centerX = cellX * spacing + this.cellOffset(seed + 101, cellX, cellZ, spacing);
        const centerZ = cellZ * spacing + this.cellOffset(seed + 202, cellX, cellZ, spacing);
        if (x !== centerX || z !== centerZ) continue;

        if (centerX < 0 || centerX >= sizeX || centerZ < 0 || centerZ >= sizeZ) continue;

        // Re-check at center to avoid borrowing crater config from neighboring cells.
        const centerBiome = ctx.getBiomeAt(centerX, centerZ)?.biome;
        const centerCrater = centerBiome?.craters;
        if (!centerCrater) continue;

        if (rand01(hash2(seed + 303, cellX, cellZ)) > clamp01(centerCrater.chance)) continue;

        const diameter = jitter(
          centerCrater.diameter,
          centerCrater.diameterJitter ?? 0.25,
          rand01(hash2(seed + 404, cellX, cellZ))
        );
        if (diameter < 4) continue;

        const radius = diameter * 0.5;
        const depthBase = radius * Math.max(0.05, centerCrater.depthRatio ?? 0.4);
        const depth = Math.max(
          1,
          jitter(depthBase, centerCrater.depthJitter ?? 0.2, rand01(hash2(seed + 505, cellX, cellZ)))
        );

        out.push({
          x: centerX,
          z: centerZ,
          radius,
          depth: Math.min(depth, radius * 0.98),
          impactBlockId: centerCrater.impactBlockId,
          impactRadius: clamp01(centerCrater.impactRadius ?? 0.35),
        });
      }
    }
  }

  private cellOffset(seed: number, cellX: number, cellZ: number, spacing: number): number {
    // Keep impact centers away from cell edges for smoother crater continuity.
    const margin = Math.max(1, Math.floor(spacing * 0.15));
    const usable = Math.max(1, spacing - margin * 2);
    return margin + ((rand01(hash2(seed, cellX, cellZ)) * usable) | 0);
  }

  private applyImpact(ctx: GenerationContext, impact: CraterImpact): void {
    const { x: sizeX, z: sizeZ } = ctx.config.worldSize;
    const radiusSq = impact.radius * impact.radius;
    const scorchRadiusSq = radiusSq * impact.impactRadius * impact.impactRadius;

    // Sphere radius derived from crater rim radius + target depth:
    // R = (a^2 + d^2) / (2d), where a is rim radius.
    const sphereRadius = (radiusSq + impact.depth * impact.depth) / (2 * impact.depth);
    const sphereCenterYOffset = sphereRadius - impact.depth;
    const sphereRadiusSq = sphereRadius * sphereRadius;

    const minX = Math.max(0, Math.floor(impact.x - impact.radius));
    const maxX = Math.min(sizeX - 1, Math.ceil(impact.x + impact.radius));
    const minZ = Math.max(0, Math.floor(impact.z - impact.radius));
    const maxZ = Math.min(sizeZ - 1, Math.ceil(impact.z + impact.radius));

    for (let x = minX; x <= maxX; x++) {
      const dx = x - impact.x;
      for (let z = minZ; z <= maxZ; z++) {
        const dz = z - impact.z;
        const distSq = dx * dx + dz * dz;
        if (distSq > radiusSq) continue;

        const capDepth = Math.sqrt(Math.max(0, sphereRadiusSq - distSq)) - sphereCenterYOffset;
        if (capDepth <= 0) continue;

        const surfaceY = ctx.terrain.getBaseHeight(x, z) | 0;
        const floorY = Math.max(0, surfaceY - Math.floor(capDepth));

        for (let y = surfaceY; y > floorY; y--) {
          if (ctx.hasBlock(x, y, z)) ctx.removeBlock(x, y, z);
        }

        if (impact.impactBlockId && distSq <= scorchRadiusSq) {
          this.paintImpact(ctx, impact.impactBlockId, x, floorY, z);
        }
      }
    }
  }

  private paintImpact(ctx: GenerationContext, blockId: number, x: number, floorY: number, z: number): void {
    const minY = Math.max(0, floorY - 3);
    for (let y = floorY; y >= minY; y--) {
      if (ctx.hasBlock(x, y, z)) {
        ctx.setBlock(blockId, x, y, z);
        return;
      }
    }
  }
}
