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

const DX = new Int8Array([1, -1, 0, 0]);
const DZ = new Int8Array([0, 0, 1, -1]);

type LiquidPassMode = 'full' | 'surfaceRefill';

export class LiquidPass implements GeneratorPass {
  readonly name: string;

  constructor(private readonly mode: LiquidPassMode = 'full') {
    this.name = mode === 'surfaceRefill' ? 'liquid-refill' : 'liquid';
  }

  execute(ctx: GenerationContext): void {
    const { x: sizeX, y: sizeY, z: sizeZ } = ctx.config.worldSize;
    const refillBelowSurface = this.mode === 'surfaceRefill';

    this.fillSurfaceLiquids(ctx, sizeX, sizeY, sizeZ, refillBelowSurface);
    if (refillBelowSurface) return;

    this.fillUndergroundLiquids(ctx, sizeX, sizeZ, ctx.config.caves);
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
    ctx: GenerationContext,
    sizeX: number,
    sizeY: number,
    sizeZ: number,
    refillBelowSurface: boolean
  ): void {
    const terrain = ctx.terrain;
    const totalColumns = sizeX * sizeZ;
    const surfaceHeights = new Int16Array(totalColumns);
    const liquidLevel = new Uint16Array(totalColumns);
    const liquidBlock = new Uint8Array(totalColumns);
    const queueX = new Int32Array(totalColumns);
    const queueZ = new Int32Array(totalColumns);
    let head = 0, tail = 0;

    // Seed: columns whose primary biome has surface liquid
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const idx = x * sizeZ + z;
        const surfaceY = terrain.getBaseHeight(x, z) | 0;
        surfaceHeights[idx] = surfaceY;

        const biome = ctx.getBiomeAt(x, z)?.biome;
        if (!biome?.liquids?.surface) continue;

        const level = biome.liquids.surface.level;
        liquidLevel[idx] = level;
        liquidBlock[idx] = biome.liquids.surface.blockId;

        if (surfaceY < level) {
          queueX[tail] = x;
          queueZ[tail] = z;
          tail++;
        }
      }
    }

    // Propagate: spread to neighbors where terrain is below the liquid level
    while (head < tail) {
      const x = queueX[head];
      const z = queueZ[head];
      head++;
      const idx = x * sizeZ + z;
      const level = liquidLevel[idx];

      for (let d = 0; d < 4; d++) {
        const nx = x + DX[d];
        const nz = z + DZ[d];
        if (nx < 0 || nx >= sizeX || nz < 0 || nz >= sizeZ) continue;

        const nIdx = nx * sizeZ + nz;
        if (liquidLevel[nIdx] > 0) continue;

        const surfaceY = surfaceHeights[nIdx];
        if (surfaceY >= level) continue;

        liquidLevel[nIdx] = level;
        liquidBlock[nIdx] = liquidBlock[idx];
        queueX[tail] = nx;
        queueZ[tail] = nz;
        tail++;
      }
    }

    this.relaxSurfaceLevelTransitions(sizeX, sizeZ, surfaceHeights, liquidLevel);

    // Fill marked columns
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const idx = x * sizeZ + z;
        const level = liquidLevel[idx];
        if (level === 0) continue;

        const surfaceY = surfaceHeights[idx];
        if (surfaceY >= level) continue;

        const blockId = liquidBlock[idx];
        if (!refillBelowSurface) {
          for (let y = surfaceY + 1; y <= level && y < sizeY; y++) {
            if (!ctx.hasBlock(x, y, z)) {
              ctx.addBlock(blockId, x, y, z);
            }
          }
        }

        if (!refillBelowSurface) continue;
        if (surfaceY < 0 || surfaceY >= sizeY) continue;
        if (ctx.hasBlock(x, surfaceY, z)) continue;

        // Post-crater refill: if a liquid column has opened below the terrain
        // surface, backfill contiguous air downward until support is reached.
        const liquidTopY = Math.min(level, sizeY - 1);
        if (liquidTopY <= surfaceY) continue;
        if (!ctx.hasBlock(x, surfaceY + 1, z)) continue;

        for (let y = surfaceY; y >= 0; y--) {
          if (ctx.hasBlock(x, y, z)) break;
          ctx.addBlock(blockId, x, y, z);
        }
      }
    }
  }

  /**
   * Smooth steep liquid-to-liquid level discontinuities into short ramps.
   * This preserves mostly-flat bodies while removing jarring vertical liquid walls
   * where different biome liquid levels meet.
   */
  private relaxSurfaceLevelTransitions(
    sizeX: number,
    sizeZ: number,
    surfaceHeights: Int16Array,
    liquidLevel: Uint16Array
  ): void {
    this.relaxLevelTransitions(sizeX, sizeZ, liquidLevel, surfaceHeights, 0);
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

    const terrain = ctx.terrain;
    const totalColumns = sizeX * sizeZ;
    const surfaceHeights = new Int16Array(totalColumns);
    const ugLevel = new Uint16Array(totalColumns);
    const ugBlock = new Uint8Array(totalColumns);
    const queueX = new Int32Array(totalColumns);
    const queueZ = new Int32Array(totalColumns);
    let head = 0, tail = 0;

    // Seed: columns whose primary biome has underground liquid + caves enabled
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const idx = x * sizeZ + z;
        surfaceHeights[idx] = terrain.getBaseHeight(x, z) | 0;

        const blended = ctx.getBiomeAt(x, z);
        if (!blended) continue;
        if (!blended.biome.liquids?.underground) continue;

        const cm = ctx.getCaveModifiersAt(x, z);
        if (!(cm?.enabled ?? true)) continue;

        ugLevel[idx] = blended.biome.liquids.underground.level;
        ugBlock[idx] = blended.biome.liquids.underground.blockId;
        queueX[tail] = x;
        queueZ[tail] = z;
        tail++;
      }
    }

    // Propagate: spread to neighbors where caves can exist at the liquid depth
    while (head < tail) {
      const x = queueX[head];
      const z = queueZ[head];
      head++;
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

        const nSurfaceY = surfaceHeights[nIdx];
        if (nSurfaceY <= level) continue;

        ugLevel[nIdx] = level;
        ugBlock[nIdx] = ugBlock[idx];
        queueX[tail] = nx;
        queueZ[tail] = nz;
        tail++;
      }
    }

    this.relaxUndergroundLevelTransitions(sizeX, sizeZ, ugLevel, caveConfig.minHeight);

    // Fill carved space in marked columns
    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const idx = x * sizeZ + z;
        const level = ugLevel[idx];
        if (level === 0) continue;

        const caveModifiers = ctx.getCaveModifiersAt(x, z);
        const surfaceY = surfaceHeights[idx];
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

  /**
   * Underground counterpart to surface transition relaxation.
   * Removes sharp liquid height walls by limiting adjacent liquid columns
   * to at most a 1-block level difference.
   */
  private relaxUndergroundLevelTransitions(
    sizeX: number,
    sizeZ: number,
    liquidLevel: Uint16Array,
    minLevel: number
  ): void {
    this.relaxLevelTransitions(sizeX, sizeZ, liquidLevel, undefined, minLevel);
  }

  /**
   * Shared liquid transition relaxation.
   * If `surfaceHeights` is provided, each column uses `surfaceY + 1` as min level.
   * Otherwise a constant min level is used.
   */
  private relaxLevelTransitions(
    sizeX: number,
    sizeZ: number,
    liquidLevel: Uint16Array,
    surfaceHeights: Int16Array | undefined,
    constantMinLevel: number
  ): void {
    const totalColumns = liquidLevel.length;
    const queue = new Int32Array(totalColumns);
    const queued = new Uint8Array(totalColumns);
    let queueHead = 0;
    let queueTail = 0;
    let queueCount = 0;

    const enqueue = (idx: number) => {
      if (queued[idx]) return;
      queued[idx] = 1;
      queue[queueTail] = idx;
      queueTail = queueTail + 1 === totalColumns ? 0 : queueTail + 1;
      queueCount++;
    };

    const needsRelax = (idx: number): boolean => {
      const current = liquidLevel[idx];
      if (current === 0) return false;

      const x = (idx / sizeZ) | 0;
      const z = idx - x * sizeZ;

      if (x > 0) {
        const n = liquidLevel[idx - sizeZ];
        if (n > 0 && current > n + 1) return true;
      }
      if (x < sizeX - 1) {
        const n = liquidLevel[idx + sizeZ];
        if (n > 0 && current > n + 1) return true;
      }
      if (z > 0) {
        const n = liquidLevel[idx - 1];
        if (n > 0 && current > n + 1) return true;
      }
      if (z < sizeZ - 1) {
        const n = liquidLevel[idx + 1];
        if (n > 0 && current > n + 1) return true;
      }
      return false;
    };

    for (let idx = 0; idx < totalColumns; idx++) {
      if (needsRelax(idx)) enqueue(idx);
    }

    while (queueCount > 0) {
      const idx = queue[queueHead];
      queueHead = queueHead + 1 === totalColumns ? 0 : queueHead + 1;
      queueCount--;
      queued[idx] = 0;

      const current = liquidLevel[idx];
      if (current === 0) continue;

      const x = (idx / sizeZ) | 0;
      const z = idx - x * sizeZ;
      let target = current;

      if (x > 0) {
        const n = liquidLevel[idx - sizeZ];
        if (n > 0 && target > n + 1) target = n + 1;
      }
      if (x < sizeX - 1) {
        const n = liquidLevel[idx + sizeZ];
        if (n > 0 && target > n + 1) target = n + 1;
      }
      if (z > 0) {
        const n = liquidLevel[idx - 1];
        if (n > 0 && target > n + 1) target = n + 1;
      }
      if (z < sizeZ - 1) {
        const n = liquidLevel[idx + 1];
        if (n > 0 && target > n + 1) target = n + 1;
      }

      const minLevel = surfaceHeights ? surfaceHeights[idx] + 1 : constantMinLevel;
      if (target < minLevel) target = minLevel;
      if (target >= current) continue;

      liquidLevel[idx] = target;

      enqueue(idx);
      if (x > 0 && liquidLevel[idx - sizeZ] > 0) enqueue(idx - sizeZ);
      if (x < sizeX - 1 && liquidLevel[idx + sizeZ] > 0) enqueue(idx + sizeZ);
      if (z > 0 && liquidLevel[idx - 1] > 0) enqueue(idx - 1);
      if (z < sizeZ - 1 && liquidLevel[idx + 1] > 0) enqueue(idx + 1);
    }
  }
}
