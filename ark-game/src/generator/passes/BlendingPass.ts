/**
 * Blending Pass - Fills terrain gaps and seals holes
 * 
 * Runs after TerrainPass to fill height transitions and seal cave openings.
 * Works with organic Voronoi-based biomes (no grid dependency).
 */

import type { GeneratorPass, GenerationContext } from './GeneratorPass';
import type { BlendedBiomeValues } from '../BiomeSampler';

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
    const { terrain, caves, config } = ctx;
    const { worldSize, caves: caveConfig, biomes: biomeConfig } = config;
    
    const surfaceY = terrain.getBaseHeight(x, z) | 0;
    const biome = ctx.getBiomeAt(x, z);
    const blocks = this.getBlocks(biome, config.blockId);
    const caveModifiers = biome ? {
      enabled: biome.caves.enabled,
      frequency: biome.caves.frequency,
      threshold: biome.caves.threshold,
      wormStrength: biome.caves.wormStrength,
    } : undefined;
    const cavesEnabled = caveConfig.enabled && (caveModifiers?.enabled ?? true);
    
    // Find lowest neighbor surface (check immediate + blend distance)
    const bd = biomeConfig.blendWidth;
    let lowest = surfaceY;
    const checkNeighbor = (nx: number, nz: number) => {
      if (nx >= 0 && nx < worldSize.x && nz >= 0 && nz < worldSize.z) {
        lowest = Math.min(lowest, terrain.getBaseHeight(nx, nz) | 0);
      }
    };
    checkNeighbor(x - 1, z); checkNeighbor(x + 1, z);
    checkNeighbor(x, z - 1); checkNeighbor(x, z + 1);
    checkNeighbor(x - bd, z); checkNeighbor(x + bd, z);
    checkNeighbor(x, z - bd); checkNeighbor(x, z + bd);
    
    // Fill height gaps if significant difference exists
    if (surfaceY - lowest >= 2) {
      for (let y = Math.max(0, lowest); y <= surfaceY; y++) {
        if (ctx.hasBlock(x, y, z)) continue;
        if (cavesEnabled && y >= caveConfig.minHeight && y < caveConfig.fadeHeight && caves.isCarved(x, y, z, caveModifiers)) continue;
        ctx.addBlock(this.blockForDepth(surfaceY - y, blocks), x, y, z);
      }
    }
    
    // Seal any remaining holes
    let hasFloor = false;
    for (let y = 0; y <= surfaceY; y++) {
      if (ctx.hasBlock(x, y, z)) { hasFloor = true; continue; }
      
      const isCaveAir = cavesEnabled && y >= caveConfig.minHeight && y < caveConfig.fadeHeight && caves.isCarved(x, y, z, caveModifiers);
      if (isCaveAir) {
        if (!hasFloor) { ctx.addBlock(blocks.underground, x, 0, z); hasFloor = true; }
        continue;
      }
      
      ctx.addBlock(this.blockForDepth(surfaceY - y, blocks), x, y, z);
      hasFloor = true;
    }
  }
  
  private getBlocks(biome: BlendedBiomeValues | undefined, fallback: number) {
    return {
      surface: biome?.blocks.surface ?? fallback,
      subsurface: biome?.blocks.subsurface ?? biome?.blocks.surface ?? fallback,
      underground: biome?.blocks.underground ?? biome?.blocks.surface ?? fallback,
      depth: biome?.blocks.subsurfaceDepth ?? 4,
    };
  }
  
  private blockForDepth(depth: number, blocks: ReturnType<typeof this.getBlocks>): number {
    return depth <= 0 ? blocks.surface : depth <= blocks.depth ? blocks.subsurface : blocks.underground;
  }
}
