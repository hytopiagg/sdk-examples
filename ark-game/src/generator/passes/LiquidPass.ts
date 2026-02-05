/**
 * Liquid Pass - Terrain-contained fill with uniform levels
 *
 * Both surface and underground liquids use BFS propagation seeded from
 * liquid-biome columns. Each column gets the source biome's exact level
 * (not blended), so surfaces are perfectly flat. Liquid spreads past biome
 * boundaries — terrain (surface) and cave walls (underground) act as the
 * natural containers.
 */

import type { GeneratorPass, GenerationContext } from './GeneratorPass';

const DX = [1, -1, 0, 0];
const DZ = [0, 0, 1, -1];

export class LiquidPass implements GeneratorPass {
  readonly name = 'liquid';

  execute(ctx: GenerationContext): void {
    const { x: sizeX, y: sizeY, z: sizeZ } = ctx.config.worldSize;
    const { caves: caveConfig } = ctx.config;

    this.fillSurfaceLiquids(ctx, sizeX, sizeY, sizeZ);
    this.fillUndergroundLiquids(ctx, sizeX, sizeZ, caveConfig);
  }

  /**
   * Terrain-contained surface liquid fill.
   *
   * 1. Seed every column whose primary biome has surface liquid with its exact level.
   * 2. BFS outward: propagate to neighbors where terrain height < liquid level,
   *    regardless of biome boundaries. Terrain is the container.
   * 3. Fill all marked columns.
   */
  private fillSurfaceLiquids(
    ctx: GenerationContext, sizeX: number, sizeY: number, sizeZ: number
  ): void {
    const totalColumns = sizeX * sizeZ;
    const liquidLevel = new Uint8Array(totalColumns);
    const liquidBlock = new Uint8Array(totalColumns);
    const queue: number[] = [];
    let head = 0;

    // Seed: columns whose primary biome has surface liquid
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const biome = ctx.getBiomeAt(x, z)?.biome;
        if (!biome?.liquids?.surface) continue;

        const idx = x * sizeZ + z;
        const level = biome.liquids.surface.level;
        liquidLevel[idx] = level;
        liquidBlock[idx] = biome.liquids.surface.blockId;

        const surfaceY = ctx.terrain.getBaseHeight(x, z) | 0;
        if (surfaceY < level) {
          queue.push(x, z);
        }
      }
    }

    // Propagate: spread to neighbors where terrain is below the liquid level
    while (head < queue.length) {
      const x = queue[head++];
      const z = queue[head++];
      const idx = x * sizeZ + z;
      const level = liquidLevel[idx];

      for (let d = 0; d < 4; d++) {
        const nx = x + DX[d];
        const nz = z + DZ[d];
        if (nx < 0 || nx >= sizeX || nz < 0 || nz >= sizeZ) continue;

        const nIdx = nx * sizeZ + nz;
        if (liquidLevel[nIdx] > 0) continue;

        const surfaceY = ctx.terrain.getBaseHeight(nx, nz) | 0;
        if (surfaceY >= level) continue;

        liquidLevel[nIdx] = level;
        liquidBlock[nIdx] = liquidBlock[idx];
        queue.push(nx, nz);
      }
    }

    // Fill marked columns
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const idx = x * sizeZ + z;
        const level = liquidLevel[idx];
        if (level === 0) continue;

        const surfaceY = ctx.terrain.getBaseHeight(x, z) | 0;
        if (surfaceY >= level) continue;

        const blockId = liquidBlock[idx];
        for (let y = surfaceY + 1; y <= level && y < sizeY; y++) {
          if (!ctx.hasBlock(x, y, z)) {
            ctx.addBlock(blockId, x, y, z);
          }
        }
      }
    }
  }

  /**
   * Underground liquid fill with BFS propagation.
   *
   * 1. Seed from columns whose primary biome has underground liquid.
   * 2. BFS outward to neighbors where caves are enabled and surface is
   *    above the liquid level (so caves can exist at that depth).
   * 3. Fill all carved space from minHeight to liquidLevel in marked columns.
   *
   * This ensures caves that cross biome boundaries are fully filled,
   * while cave walls provide natural containment.
   */
  private fillUndergroundLiquids(
    ctx: GenerationContext,
    sizeX: number,
    sizeZ: number,
    caveConfig: GenerationContext['config']['caves']
  ): void {
    if (!caveConfig.enabled) return;

    const totalColumns = sizeX * sizeZ;
    const ugLevel = new Uint8Array(totalColumns);
    const ugBlock = new Uint8Array(totalColumns);
    const queue: number[] = [];
    let head = 0;

    // Seed: columns whose primary biome has underground liquid + caves enabled
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const blended = ctx.getBiomeAt(x, z);
        if (!blended) continue;
        if (!blended.biome.liquids?.underground) continue;

        const cm = ctx.getCaveModifiersAt(x, z);
        if (!(cm?.enabled ?? true)) continue;

        const idx = x * sizeZ + z;
        ugLevel[idx] = blended.biome.liquids.underground.level;
        ugBlock[idx] = blended.biome.liquids.underground.blockId;
        queue.push(x, z);
      }
    }

    // Propagate: spread to neighbors where caves can exist at the liquid depth
    while (head < queue.length) {
      const x = queue[head++];
      const z = queue[head++];
      const idx = x * sizeZ + z;
      const level = ugLevel[idx];

      for (let d = 0; d < 4; d++) {
        const nx = x + DX[d];
        const nz = z + DZ[d];
        if (nx < 0 || nx >= sizeX || nz < 0 || nz >= sizeZ) continue;

        const nIdx = nx * sizeZ + nz;
        if (ugLevel[nIdx] > 0) continue;

        // Caves need enabled + surface above liquid level for vertical space
        const cm = ctx.getCaveModifiersAt(nx, nz);
        if (!(cm?.enabled ?? true)) continue;

        const nSurfaceY = ctx.terrain.getBaseHeight(nx, nz) | 0;
        if (nSurfaceY <= level) continue;

        ugLevel[nIdx] = level;
        ugBlock[nIdx] = ugBlock[idx];
        queue.push(nx, nz);
      }
    }

    // Fill carved space in marked columns
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const idx = x * sizeZ + z;
        const level = ugLevel[idx];
        if (level === 0) continue;

        const caveModifiers = ctx.getCaveModifiersAt(x, z);
        const surfaceY = ctx.terrain.getBaseHeight(x, z) | 0;
        const maxY = Math.min(level, surfaceY - caveConfig.surfaceFadeDistance);
        const blockId = ugBlock[idx];

        for (let y = caveConfig.minHeight; y <= maxY; y++) {
          if (ctx.hasBlock(x, y, z)) continue;
          if (ctx.isCarved(x, y, z, caveModifiers, surfaceY)) {
            ctx.addBlock(blockId, x, y, z);
          }
        }
      }
    }
  }
}
