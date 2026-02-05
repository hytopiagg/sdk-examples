/**
 * Liquid Pass - Fills contained basins with liquids
 * 
 * Uses flood-fill to find enclosed depressions and fills them to the
 * containment height (lowest point where liquid would spill out).
 * 
 * Two liquid types per biome:
 * - Surface: Fills terrain depressions (lakes, ponds)
 * - Underground: Fills enclosed cave floors (lava pools, underground lakes)
 */

import type { GeneratorPass, GenerationContext } from './GeneratorPass';

export class LiquidPass implements GeneratorPass {
  readonly name = 'liquid';
  
  execute(ctx: GenerationContext): void {
    const { x: sizeX, z: sizeZ } = ctx.config.worldSize;
    const { caves: caveConfig } = ctx.config;
    
    // Track which columns have been processed for surface liquid
    const surfaceVisited = new Set<number>();
    
    // Process surface liquids with flood-fill basin detection
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const key = x * sizeZ + z;
        if (surfaceVisited.has(key)) continue;
        
        const biome = ctx.getBiomeAt(x, z);
        if (!biome?.liquids.surface) continue;
        
        const surfaceY = ctx.terrain.getBaseHeight(x, z) | 0;
        const liquidLevel = Math.round(biome.liquids.surface.level);
        
        // Only start flood-fill from columns that could hold liquid
        if (surfaceY >= liquidLevel) {
          surfaceVisited.add(key);
          continue;
        }
        
        // Flood-fill to find the basin and its containment height
        this.fillSurfaceBasin(ctx, x, z, surfaceVisited);
      }
    }
    
    // Process underground liquids (simpler - just fill cave floors)
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const biome = ctx.getBiomeAt(x, z);
        if (!biome?.liquids.underground) continue;
        
        const caveModifiers = ctx.getCaveModifiersAt(x, z);
        const cavesEnabled = caveConfig.enabled && (caveModifiers?.enabled ?? true);
        if (!cavesEnabled) continue;
        
        this.fillUndergroundLiquid(ctx, x, z, biome.liquids.underground, caveModifiers);
      }
    }
  }
  
  /**
   * Flood-fill to find a surface basin and fill it to containment height
   * 
   * Key insight: Use a CONSISTENT liquid level for the entire basin search,
   * then blend the actual fill at boundaries. This prevents artificial edges
   * where blended liquid levels create false "rims".
   */
  private fillSurfaceBasin(
    ctx: GenerationContext,
    startX: number,
    startZ: number,
    visited: Set<number>
  ): void {
    const { x: sizeX, z: sizeZ, y: sizeY } = ctx.config.worldSize;
    
    // Get liquid config from starting position
    const startBiome = ctx.getBiomeAt(startX, startZ);
    if (!startBiome?.liquids.surface) return;
    
    const liquidBlockId = startBiome.liquids.surface.blockId;
    const searchLevel = Math.round(startBiome.liquids.surface.level);
    
    // Flood-fill to find all connected columns in this potential basin
    // Use the STARTING biome's level for basin detection (prevents boundary artifacts)
    const basinColumns: Array<{ x: number; z: number; surfaceY: number; fillLevel: number }> = [];
    const queue: Array<[number, number]> = [[startX, startZ]];
    let spillHeight = searchLevel; // Lowest edge where liquid would escape
    
    while (queue.length > 0) {
      const [x, z] = queue.pop()!;
      const key = x * sizeZ + z;
      
      if (visited.has(key)) continue;
      if (x < 0 || x >= sizeX || z < 0 || z >= sizeZ) {
        // World edge = liquid escapes
        spillHeight = -Infinity;
        continue;
      }
      
      visited.add(key);
      
      const surfaceY = ctx.terrain.getBaseHeight(x, z) | 0;
      
      // Use consistent search level for basin detection
      // This prevents blended levels from creating false edges
      if (surfaceY >= searchLevel) {
        // This column is terrain that contains the basin
        // Update spill height if this is a low point in the rim
        spillHeight = Math.min(spillHeight, surfaceY);
      } else {
        // This column is part of the basin
        // Get the BLENDED liquid level for actual fill height
        const biome = ctx.getBiomeAt(x, z);
        const columnFillLevel = biome?.liquids.surface 
          ? Math.round(biome.liquids.surface.level) 
          : 0;
        
        basinColumns.push({ x, z, surfaceY, fillLevel: columnFillLevel });
        
        // Continue flood-fill to neighbors
        queue.push([x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]);
      }
    }
    
    // If basin has no containment (spills to world edge or below ground), skip
    if (spillHeight <= 0 || basinColumns.length === 0) return;
    
    // Calculate global spill constraint
    const maxFill = spillHeight - 1;
    
    for (const { x, z, surfaceY, fillLevel } of basinColumns) {
      // Fill up to minimum of: column's blended level, spill height, search level
      const columnMax = Math.min(fillLevel, maxFill, searchLevel);
      
      // Fill from just above terrain up to fill level
      for (let y = surfaceY + 1; y <= columnMax && y < sizeY; y++) {
        if (!ctx.hasBlock(x, y, z)) {
          ctx.addBlock(liquidBlockId, x, y, z);
        }
      }
    }
  }
  
  /**
   * Fill underground liquid in cave floors (contained by cave walls/floor)
   */
  private fillUndergroundLiquid(
    ctx: GenerationContext,
    x: number,
    z: number,
    liquid: { blockId: number; level: number },
    caveModifiers: { enabled: boolean; frequency: number; threshold: number; wormStrength: number } | undefined
  ): void {
    const { caves: caveConfig } = ctx.config;
    const surfaceY = ctx.terrain.getBaseHeight(x, z) | 0;
    const liquidLevel = Math.round(liquid.level);
    
    // Scan down from liquid level to find cave floor
    for (let y = Math.min(liquidLevel, surfaceY - 1); y >= caveConfig.minHeight; y--) {
      // Skip if already has a block
      if (ctx.hasBlock(x, y, z)) continue;
      
      // Check if this is cave air (pass surfaceY for terrain-relative caves)
      if (!ctx.caves.isCarved(x, y, z, caveModifiers, surfaceY)) continue;
      
      // Check if there's a floor below (either solid or already liquid)
      const hasFloor = y === caveConfig.minHeight || 
                       ctx.hasBlock(x, y - 1, z) || 
                       !ctx.caves.isCarved(x, y - 1, z, caveModifiers, surfaceY);
      
      if (hasFloor) {
        // Fill upward from floor until we hit ceiling or liquid level
        for (let fillY = y; fillY <= liquidLevel && fillY < surfaceY; fillY++) {
          if (ctx.hasBlock(x, fillY, z)) break;
          if (!ctx.caves.isCarved(x, fillY, z, caveModifiers, surfaceY)) break;
          ctx.addBlock(liquid.blockId, x, fillY, z);
        }
        break; // Done with this column
      }
    }
  }
}
