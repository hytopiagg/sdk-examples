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
    
    // Surface block (pass surfaceY for terrain-relative caves)
    if (!cavesEnabled || !caves.isCarved(x, surfaceY, z, caveModifiers, surfaceY)) {
      ctx.addBlock(surfaceBlock, x, surfaceY, z);
    }
    
    // Subsurface buffer
    const belowY = surfaceY - 1;
    if (belowY >= 0 && (!cavesEnabled || !caves.isCarved(x, belowY, z, caveModifiers, surfaceY))) {
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
      if (cavesEnabled && caves.isCarved(x, y, z, caveModifiers, surfaceY)) continue;
      const depthFromSurface = surfaceY - y;
      const blockId = depthFromSurface <= subsurfaceDepth ? subsurfaceBlock : undergroundBlock;
      ctx.addBlock(blockId, x, y, z);
    }
    
    // Cave boundaries - now terrain-relative
    if (cavesEnabled) {
      const minY = config.caves.minHeight;
      // Caves can now extend into mountains (maxY based on local surface)
      const maxY = surfaceY - config.caves.surfaceFadeDistance;
      
      for (let y = minY; y <= maxY; y++) {
        if (caves.isCarved(x, y, z, caveModifiers, surfaceY)) continue;
        
        if (this.adjacentToCave(ctx, x, y, z)) {
          const depthFromSurface = surfaceY - y;
          const blockId = depthFromSurface <= subsurfaceDepth ? subsurfaceBlock : undergroundBlock;
          ctx.addBlock(blockId, x, y, z);
        }
      }
    }
  }
  
  private adjacentToCave(ctx: GenerationContext, x: number, y: number, z: number): boolean {
    return this.isCaveAir(ctx, x - 1, y, z) ||
           this.isCaveAir(ctx, x + 1, y, z) ||
           this.isCaveAir(ctx, x, y - 1, z) ||
           this.isCaveAir(ctx, x, y + 1, z) ||
           this.isCaveAir(ctx, x, y, z - 1) ||
           this.isCaveAir(ctx, x, y, z + 1);
  }
  
  /** Check if position is cave air (uses position's own terrain height) */
  private isCaveAir(ctx: GenerationContext, x: number, y: number, z: number): boolean {
    const surfaceY = ctx.terrain.getBaseHeight(x, z) | 0;
    if (y < 0 || y >= surfaceY) return false;
    
    const { caves: caveConfig } = ctx.config;
    const localMaxY = surfaceY - caveConfig.surfaceFadeDistance;
    if (y < caveConfig.minHeight || y >= localMaxY) return false;
    
    const caveModifiers = ctx.getCaveModifiersAt(x, z);
    if (!caveConfig.enabled || !(caveModifiers?.enabled ?? true)) return false;
    
    return ctx.caves.isCarved(x, y, z, caveModifiers, surfaceY);
  }
}

