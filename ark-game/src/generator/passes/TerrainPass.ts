/**
 * Terrain Pass - First generation pass
 * 
 * Generates the solid terrain structure:
 * - Surface blocks
 * - Subsurface layers
 * - Cliff face filling
 * - Cave boundaries
 */

import type { GeneratorPass, GenerationContext } from './GeneratorPass';

export class TerrainPass implements GeneratorPass {
  readonly name = 'terrain';
  
  execute(ctx: GenerationContext): void {
    const { x: sizeX, z: sizeZ } = ctx.config.worldSize;
    
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        this.generateColumn(ctx, x, z);
      }
    }
  }
  
  private generateColumn(ctx: GenerationContext, x: number, z: number): void {
    const { config, terrain, caves } = ctx;
    const { worldSize, caves: caveConfig } = config;
    
    const surfaceY = terrain.getBaseHeight(x, z) | 0;
    const biome = ctx.getBiomeAt(x, z);
    
    // Extract cave modifiers from already-fetched biome (avoids duplicate lookup)
    const caveModifiers = biome ? {
      enabled: biome.caves.enabled,
      frequency: biome.caves.frequency,
      threshold: biome.caves.threshold,
      wormStrength: biome.caves.wormStrength,
    } : undefined;
    
    // Block types from biome
    const surfaceBlock = biome?.blocks.surface ?? config.blockId;
    const subsurfaceBlock = biome?.blocks.subsurface ?? surfaceBlock;
    const undergroundBlock = biome?.blocks.underground ?? subsurfaceBlock;
    const subsurfaceDepth = biome?.blocks.subsurfaceDepth ?? 4;
    
    const cavesEnabled = caveConfig.enabled && (caveModifiers?.enabled ?? true);
    
    // Surface block
    if (!cavesEnabled || !caves.isCarved(x, surfaceY, z, caveModifiers)) {
      ctx.addBlock(surfaceBlock, x, surfaceY, z);
    }
    
    // Subsurface buffer
    const belowY = surfaceY - 1;
    if (belowY >= 0 && (!cavesEnabled || !caves.isCarved(x, belowY, z, caveModifiers))) {
      const blockId = belowY >= surfaceY - subsurfaceDepth ? subsurfaceBlock : undergroundBlock;
      ctx.addBlock(blockId, x, belowY, z);
    }
    
    // Fill exposed cliff faces
    let lowestNeighbor = surfaceY;
    if (x > 0) lowestNeighbor = Math.min(lowestNeighbor, terrain.getBaseHeight(x - 1, z) | 0);
    if (x < worldSize.x - 1) lowestNeighbor = Math.min(lowestNeighbor, terrain.getBaseHeight(x + 1, z) | 0);
    if (z > 0) lowestNeighbor = Math.min(lowestNeighbor, terrain.getBaseHeight(x, z - 1) | 0);
    if (z < worldSize.z - 1) lowestNeighbor = Math.min(lowestNeighbor, terrain.getBaseHeight(x, z + 1) | 0);
    
    for (let y = Math.max(0, lowestNeighbor); y < surfaceY - 1; y++) {
      if (cavesEnabled && caves.isCarved(x, y, z, caveModifiers)) continue;
      const depthFromSurface = surfaceY - y;
      const blockId = depthFromSurface <= subsurfaceDepth ? subsurfaceBlock : undergroundBlock;
      ctx.addBlock(blockId, x, y, z);
    }
    
    // Cave boundaries
    if (cavesEnabled) {
      const minY = config.caves.minHeight;
      const maxY = Math.min(surfaceY - 2, config.caves.fadeHeight);
      
      for (let y = minY; y <= maxY; y++) {
        if (caves.isCarved(x, y, z, caveModifiers)) continue;
        
        if (this.adjacentToCave(ctx, x, y, z, surfaceY)) {
          const depthFromSurface = surfaceY - y;
          const blockId = depthFromSurface <= subsurfaceDepth ? subsurfaceBlock : undergroundBlock;
          ctx.addBlock(blockId, x, y, z);
        }
      }
    }
  }
  
  private adjacentToCave(ctx: GenerationContext, x: number, y: number, z: number, surfaceY: number): boolean {
    return this.isCaveAir(ctx, x - 1, y, z, surfaceY) ||
           this.isCaveAir(ctx, x + 1, y, z, surfaceY) ||
           this.isCaveAir(ctx, x, y - 1, z, surfaceY) ||
           this.isCaveAir(ctx, x, y + 1, z, surfaceY) ||
           this.isCaveAir(ctx, x, y, z - 1, surfaceY) ||
           this.isCaveAir(ctx, x, y, z + 1, surfaceY);
  }
  
  private isCaveAir(ctx: GenerationContext, x: number, y: number, z: number, surfaceY: number): boolean {
    if (y < 0 || y >= surfaceY) return false;
    const { caves: caveConfig } = ctx.config;
    if (y < caveConfig.minHeight || y >= caveConfig.fadeHeight) return false;
    
    const caveModifiers = ctx.getCaveModifiersAt(x, z);
    const cavesEnabled = caveConfig.enabled && (caveModifiers?.enabled ?? true);
    if (!cavesEnabled) return false;
    
    return ctx.caves.isCarved(x, y, z, caveModifiers);
  }
}

