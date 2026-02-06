/**
 * Blending Pass - Fills terrain gaps and seals holes
 * 
 * Runs after TerrainPass to fill height transitions and seal cave openings.
 * Works with organic Voronoi-based biomes (no grid dependency).
 */

import type { GeneratorPass, GenerationContext } from './GeneratorPass';
import { resolveBiomeBlock } from '../blocks/BlockSelector';

export class BlendingPass implements GeneratorPass {
  readonly name = 'blending';
  
  execute(ctx: GenerationContext): void {
    const { x: sizeX, z: sizeZ } = ctx.config.worldSize;
    
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        this.processColumn(ctx, x, z);
      }
    }
  }
  
  private processColumn(ctx: GenerationContext, x: number, z: number): void {
    const { terrain, config } = ctx;
    const { worldSize, caves: caveConfig, biomes: biomeConfig } = config;

    const surfaceY = terrain.getBaseHeight(x, z) | 0;
    const biome = ctx.getBiomeAt(x, z);
    const blocks = biome?.blocks;
    const fallbackBlock = config.blockId;
    const { seed } = config;
    const blockAt = (y: number, depth: number): number => (
      blocks ? resolveBiomeBlock(blocks, seed, x, y, z, depth) : fallbackBlock
    );
    const caveModifiers = biome?.caves;
    const cavesEnabled = caveConfig.enabled && (caveModifiers?.enabled ?? true);

    // Find lowest neighbor surface (check immediate + blend distance)
    const bd = biomeConfig.blendWidth;
    let lowest = surfaceY;
    const maxX = worldSize.x - 1;
    const maxZ = worldSize.z - 1;
    if (x > 0) lowest = Math.min(lowest, terrain.getBaseHeight(x - 1, z) | 0);
    if (x < maxX) lowest = Math.min(lowest, terrain.getBaseHeight(x + 1, z) | 0);
    if (z > 0) lowest = Math.min(lowest, terrain.getBaseHeight(x, z - 1) | 0);
    if (z < maxZ) lowest = Math.min(lowest, terrain.getBaseHeight(x, z + 1) | 0);

    const left = x - bd;
    const right = x + bd;
    const back = z - bd;
    const front = z + bd;
    if (left >= 0) lowest = Math.min(lowest, terrain.getBaseHeight(left, z) | 0);
    if (right <= maxX) lowest = Math.min(lowest, terrain.getBaseHeight(right, z) | 0);
    if (back >= 0) lowest = Math.min(lowest, terrain.getBaseHeight(x, back) | 0);
    if (front <= maxZ) lowest = Math.min(lowest, terrain.getBaseHeight(x, front) | 0);

    // Terrain-relative cave bounds
    const minCaveY = caveConfig.minHeight;
    const localMaxCaveY = surfaceY - caveConfig.surfaceFadeDistance;

    // Fill height gaps if significant difference exists
    if (surfaceY - lowest >= 2) {
      for (let y = Math.max(0, lowest); y <= surfaceY; y++) {
        if (ctx.hasBlock(x, y, z)) continue;
        // Use cached cave results — TerrainPass already computed most of these
        if (cavesEnabled && y >= minCaveY && y < localMaxCaveY && ctx.isCarved(x, y, z, caveModifiers, surfaceY)) continue;
        ctx.addBlock(blockAt(y, surfaceY - y), x, y, z);
      }
    }

    // Seal any remaining holes
    let hasFloor = false;
    for (let y = 0; y <= surfaceY; y++) {
      if (ctx.hasBlock(x, y, z)) { hasFloor = true; continue; }

      const isCaveAir = cavesEnabled && y >= minCaveY && y < localMaxCaveY && ctx.isCarved(x, y, z, caveModifiers, surfaceY);
      if (isCaveAir) {
        if (!hasFloor) { ctx.addBlock(blockAt(0, surfaceY), x, 0, z); hasFloor = true; }
        continue;
      }

      ctx.addBlock(blockAt(y, surfaceY - y), x, y, z);
      hasFloor = true;
    }
  }
}
