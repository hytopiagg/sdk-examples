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
import { resolveBiomeBlock } from '../blocks/BlockSelector';

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
    const { config, terrain } = ctx;
    const { worldSize, caves: caveConfig } = config;

    const surfaceY = terrain.getBaseHeight(x, z) | 0;
    const biome = ctx.getBiomeAt(x, z);

    const caveModifiers = biome?.caves;
    const blocks = biome?.blocks;
    const fallbackBlock = config.blockId;
    const { seed } = config;
    const blockAt = (y: number, depth: number): number => (
      blocks ? resolveBiomeBlock(blocks, seed, x, y, z, depth) : fallbackBlock
    );

    const cavesEnabled = caveConfig.enabled && (caveModifiers?.enabled ?? true);

    // Surface block
    if (!cavesEnabled || !ctx.isCarved(x, surfaceY, z, caveModifiers, surfaceY)) {
      ctx.addBlock(blockAt(surfaceY, 0), x, surfaceY, z);
    }

    // Subsurface buffer
    const belowY = surfaceY - 1;
    if (belowY >= 0 && (!cavesEnabled || !ctx.isCarved(x, belowY, z, caveModifiers, surfaceY))) {
      const blockId = blockAt(belowY, surfaceY - belowY);
      ctx.addBlock(blockId, x, belowY, z);
    }

    // Fill exposed cliff faces
    let lowestNeighbor = surfaceY;
    if (x > 0) lowestNeighbor = Math.min(lowestNeighbor, terrain.getBaseHeight(x - 1, z) | 0);
    if (x < worldSize.x - 1) lowestNeighbor = Math.min(lowestNeighbor, terrain.getBaseHeight(x + 1, z) | 0);
    if (z > 0) lowestNeighbor = Math.min(lowestNeighbor, terrain.getBaseHeight(x, z - 1) | 0);
    if (z < worldSize.z - 1) lowestNeighbor = Math.min(lowestNeighbor, terrain.getBaseHeight(x, z + 1) | 0);

    for (let y = Math.max(0, lowestNeighbor); y < surfaceY - 1; y++) {
      if (cavesEnabled && ctx.isCarved(x, y, z, caveModifiers, surfaceY)) continue;
      const blockId = blockAt(y, surfaceY - y);
      ctx.addBlock(blockId, x, y, z);
    }

    // Cave boundaries: scan column for carved Y levels, then check adjacency.
    // Vertical adjacency uses a bitfield (free). Horizontal adjacency uses
    // ctx.isCarved which caches results across columns and passes.
    if (cavesEnabled) {
      const minY = caveConfig.minHeight;
      const maxY = surfaceY - caveConfig.surfaceFadeDistance;

      // First pass: identify carved Y levels in this column and mark them
      // Use a compact bitfield (Uint32Array) for fast lookup
      const rangeSize = maxY - minY + 1;
      if (rangeSize > 0) {
        const wordCount = ((rangeSize + 31) >>> 5);
        // Reuse static buffer if large enough, otherwise allocate
        const carvedBits = TerrainPass._getCarvedBits(wordCount);

        // Clear the bits we'll use
        for (let i = 0; i < wordCount; i++) carvedBits[i] = 0;

        for (let y = minY; y <= maxY; y++) {
          if (ctx.isCarved(x, y, z, caveModifiers, surfaceY)) {
            carvedBits[(y - minY) >>> 5] |= 1 << ((y - minY) & 31);
          }
        }

        // Second pass: for non-carved positions, check adjacency.
        for (let y = minY; y <= maxY; y++) {
          const bit = (y - minY);
          // Skip if this position is carved
          if (carvedBits[bit >>> 5] & (1 << (bit & 31))) continue;

          // Check vertical adjacency first (free — uses our bitfield)
          const above = y + 1 - minY;
          const below = y - 1 - minY;
          const adjAbove = above >= 0 && above < rangeSize && (carvedBits[above >>> 5] & (1 << (above & 31)));
          const adjBelow = below >= 0 && below < rangeSize && (carvedBits[below >>> 5] & (1 << (below & 31)));

          if (adjAbove || adjBelow || this.hasHorizontalCaveNeighbor(ctx, x, y, z)) {
            const blockId = blockAt(y, surfaceY - y);
            ctx.addBlock(blockId, x, y, z);
          }
        }
      }
    }
  }

  // Static buffer for carved bits to avoid repeated allocation
  private static _carvedBitsBuffer = new Uint32Array(16);
  private static _getCarvedBits(wordCount: number): Uint32Array {
    if (wordCount > TerrainPass._carvedBitsBuffer.length) {
      TerrainPass._carvedBitsBuffer = new Uint32Array(wordCount);
    }
    return TerrainPass._carvedBitsBuffer;
  }

  /** Check only horizontal neighbors for cave air (avoids redundant Y checks) */
  private hasHorizontalCaveNeighbor(ctx: GenerationContext, x: number, y: number, z: number): boolean {
    return this.isCaveAir(ctx, x - 1, y, z) ||
           this.isCaveAir(ctx, x + 1, y, z) ||
           this.isCaveAir(ctx, x, y, z - 1) ||
           this.isCaveAir(ctx, x, y, z + 1);
  }

  /** Check if position is cave air (uses position's own terrain height, with caching) */
  private isCaveAir(ctx: GenerationContext, x: number, y: number, z: number): boolean {
    const { caves: caveConfig } = ctx.config;
    const surfaceY = ctx.terrain.getBaseHeight(x, z) | 0;
    if (y < 0 || y >= surfaceY) return false;
    if (y < caveConfig.minHeight) return false;

    const caveModifiers = ctx.getCaveModifiersAt(x, z);
    if (!caveConfig.enabled || !(caveModifiers?.enabled ?? true)) return false;

    const localMaxY = surfaceY - caveConfig.surfaceFadeDistance;
    if (y >= localMaxY) return false;

    return ctx.isCarved(x, y, z, caveModifiers, surfaceY);
  }
}
