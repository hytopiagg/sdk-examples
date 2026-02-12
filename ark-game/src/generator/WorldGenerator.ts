/**
 * WorldGenerator - Multi-pass procedural world generation
 * 
 * Generation happens in ordered passes, each building on previous results:
 * 1. Terrain - Surface, subsurface, caves
 * 2. Blending - Smooth biome transitions, seal gaps
 * 3. Speleothem - Cave stalactite/stalagmite decoration
 * 4. Liquid - Water, lava based on biome config
 * 5. Road - Global road network (bridges + tunnels)
 * 6. Crater - Surface impact carving + contact effects (can destroy roads)
 * 7. Liquid Refill - Surface liquid refill after crater carving
 * 8. (Future) Structures - Buildings, ruins
 * 9. (Future) Decoration - Trees, plants, details
 */

import type { BlockPlacement, Vector3Like } from 'hytopia';
import { TerrainSampler } from './noise/TerrainSampler';
import { CaveCarver } from './noise/CaveCarver';
import { BiomeSampler } from './BiomeSampler';
import { mergeConfig } from './GeneratorConfig';
import type { GeneratorConfig } from './GeneratorConfig';
import { resolveBiomeBlock } from './blocks/BlockSelector';
import type { GeneratorPass } from './passes';
import { createContext } from './passes';
import { TerrainPass } from './passes/TerrainPass';
import { BlendingPass } from './passes/BlendingPass';
import { SpeleothemPass } from './passes/SpeleothemPass';
import { LiquidPass } from './passes/LiquidPass';
import { RoadPass } from './passes/RoadPass';
import { CraterPass } from './passes/CraterPass';

export interface GeneratorResult {
  blocks: { [blockTypeId: number]: BlockPlacement[] };
  spawnPoint: Vector3Like;
  stats: {
    totalBlocks: number;
    generationTimeMs: number;
  };
}

export interface GeneratorChunkResult {
  chunkX: number;
  chunkY: number;
  chunkZ: number;
  chunkSize: number;
  blocks: { [blockTypeId: number]: BlockPlacement[] };
  totalBlocks: number;
}

interface ChunkBucket {
  blocks: { [blockTypeId: number]: BlockPlacement[] };
  totalBlocks: number;
}

interface ChunkIndex {
  chunkSize: number;
  buckets: Map<string, ChunkBucket>;
}

export default class WorldGenerator {
  private config: GeneratorConfig;
  private terrain: TerrainSampler;
  private caves: CaveCarver;
  private biomes: BiomeSampler | null;
  private passes: GeneratorPass[];
  private lastResult: GeneratorResult | null = null;
  private chunkIndices = new Map<number, ChunkIndex>();
  
  constructor(config: Partial<GeneratorConfig> = {}) {
    this.config = mergeConfig(config);
    
    // Create biome sampler if enabled
    this.biomes = this.config.biomes.enabled
      ? new BiomeSampler({
          seed: this.config.seed,
          biomeSize: this.config.biomes.size,
        })
      : null;
    
    // Create terrain sampler with biome awareness and gradient-based smoothing
    this.terrain = new TerrainSampler({
      seed: this.config.seed,
      worldSizeX: this.config.worldSize.x,
      worldSizeZ: this.config.worldSize.z,
      baseHeight: this.config.terrain.baseHeight,
      heightVariation: this.config.terrain.heightVariation,
      terrainFrequency: this.config.terrain.frequency,
      terrainOctaves: this.config.terrain.octaves,
      valleyFrequency: this.config.terrain.valley.frequency,
      valleyDepth: this.config.terrain.valley.depth,
      biomeSampler: this.biomes ?? undefined,
      // Blend width for gradient-based height smoothing
      blendWidth: this.config.biomes.enabled ? this.config.biomes.blendWidth : undefined,
    });

    // Constrain material dithering by real terrain elevation (downhill-biased).
    this.biomes?.setMaterialHeightSampler((x, z) => this.terrain.getBaseHeight(x, z));
    
    // Create cave carver
    this.caves = new CaveCarver({
      seed: this.config.seed,
      caveFrequency: this.config.caves.frequency,
      caveOctaves: this.config.caves.octaves,
      caveThreshold: this.config.caves.threshold,
      minHeight: this.config.caves.minHeight,
      surfaceFadeDistance: this.config.caves.surfaceFadeDistance,
      wormFrequency: this.config.caves.wormFrequency,
      wormStrength: this.config.caves.wormCaves ? this.config.caves.wormStrength : 0,
      warpFrequency: this.config.caves.warpFrequency,
      chamberFrequency: this.config.caves.chamberFrequency,
    });
    
    // Configure generation passes
    this.passes = [
      new TerrainPass(),
      new BlendingPass(),
      new SpeleothemPass(),
      new LiquidPass(),
      new RoadPass(),
      new CraterPass(),
      new LiquidPass('surfaceRefill'),
      // Future passes:
      // new StructurePass(),
      // new DecorationPass(),
    ];
  }
  
  /**
   * Generate world by executing all passes in order
   */
  generate(): GeneratorResult {
    const { worldSize } = this.config;
    const startTime = performance.now();
    
    console.log(`[Generator] Starting ${worldSize.x}×${worldSize.z} world (seed: ${this.config.seed})`);
    
    // Create shared context for all passes
    const ctx = createContext(this.config, this.terrain, this.caves, this.biomes);
    
    // Execute passes in order with timing
    for (const pass of this.passes) {
      const passStart = performance.now();
      pass.execute(ctx);
      console.log(`[Generator] ${pass.name} pass: ${(performance.now() - passStart).toFixed(0)}ms`);
    }
    
    const { blocks, totalBlocks } = ctx.finalizeBlocks();
    
    const totalTime = performance.now() - startTime;
    console.log(`[Generator] Complete: ${totalBlocks.toLocaleString()} blocks in ${totalTime.toFixed(0)}ms`);

    const result: GeneratorResult = {
      blocks,
      spawnPoint: this.findSpawnPoint(),
      stats: {
        totalBlocks,
        generationTimeMs: totalTime,
      },
    };

    this.lastResult = result;
    this.chunkIndices.clear();
    return result;
  }

  /**
   * Get a generated cubic chunk by chunk coordinates from the latest snapshot.
   * Call generate() first to create/update the snapshot.
   */
  generateChunk(chunkX: number, chunkY: number, chunkZ: number, chunkSize = 16): GeneratorChunkResult {
    const size = this.normalizeChunkSize(chunkSize);
    const ix = chunkX | 0;
    const iy = chunkY | 0;
    const iz = chunkZ | 0;
    const index = this.getChunkIndex(size);
    const bucket = index.buckets.get(this.chunkKey(ix, iy, iz));

    if (!bucket) {
      return { chunkX: ix, chunkY: iy, chunkZ: iz, chunkSize: size, blocks: {}, totalBlocks: 0 };
    }

    return {
      chunkX: ix,
      chunkY: iy,
      chunkZ: iz,
      chunkSize: size,
      blocks: bucket.blocks,
      totalBlocks: bucket.totalBlocks,
    };
  }

  /** Convenience wrapper to resolve chunk by world coordinate. */
  generateChunkAtWorldPosition(x: number, y: number, z: number, chunkSize = 16): GeneratorChunkResult {
    const size = this.normalizeChunkSize(chunkSize);
    const chunkX = Math.floor(x / size);
    const chunkY = Math.floor(y / size);
    const chunkZ = Math.floor(z / size);
    return this.generateChunk(chunkX, chunkY, chunkZ, size);
  }

  /** Get all chunks in a cubic radius around a world coordinate. */
  generateChunksAroundWorldPosition(
    x: number,
    y: number,
    z: number,
    radiusChunks: number,
    chunkSize = 16
  ): GeneratorChunkResult[] {
    const size = this.normalizeChunkSize(chunkSize);
    const radius = Math.max(0, radiusChunks | 0);
    const centerX = Math.floor(x / size);
    const centerY = Math.floor(y / size);
    const centerZ = Math.floor(z / size);
    const out: GeneratorChunkResult[] = [];

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dz = -radius; dz <= radius; dz++) {
        for (let dx = -radius; dx <= radius; dx++) {
          out.push(this.generateChunk(centerX + dx, centerY + dy, centerZ + dz, size));
        }
      }
    }

    return out;
  }
  
  private findSpawnPoint(): Vector3Like {
    const cx = Math.floor(this.config.worldSize.x / 2);
    const cz = Math.floor(this.config.worldSize.z / 2);
    return { x: cx, y: this.getTerrainHeight(cx, cz) + 2, z: cz };
  }
  
  /** Get terrain height at x,z */
  getTerrainHeight(x: number, z: number): number {
    return Math.floor(this.terrain.getBaseHeight(x, z));
  }
  
  /**
   * Get block at any coordinate - deterministic lookup
   * Returns blockId if solid, null if air
   */
  getBlockAt(x: number, y: number, z: number): number | null {
    const { worldSize, caves: caveConfig } = this.config;
    
    if (x < 0 || x >= worldSize.x || z < 0 || z >= worldSize.z || y < 0 || y >= worldSize.y) {
      return null;
    }
    
    const surfaceY = this.terrain.getBaseHeight(x, z);
    if (y >= surfaceY) return null;
    
    // Get biome-blended cave modifiers
    const biome = this.biomes?.getBlendedValues(x, z);
    const caveModifiers = biome?.caves;
    
    const cavesEnabled = caveConfig.enabled && (caveModifiers?.enabled ?? true);
    // Pass surfaceY so caves can extend into mountains (terrain-relative)
    if (cavesEnabled && this.caves.isCarved(x, y, z, caveModifiers, surfaceY | 0)) return null;
    
    const depthFromSurface = Math.floor(surfaceY) - y;
    const selectorDepth = depthFromSurface <= 1 ? 0 : depthFromSurface;
    return biome?.blocks
      ? resolveBiomeBlock(biome.blocks, this.config.seed, x, y, z, selectorDepth)
      : this.config.blockId;
  }
  
  /** Get the biome at a position */
  getBiomeAt(x: number, z: number) {
    return this.biomes?.getBiomeAt(x, z) ?? null;
  }
  
  getConfig(): GeneratorConfig {
    return this.config;
  }

  private getResultOrThrow(): GeneratorResult {
    if (this.lastResult) return this.lastResult;
    throw new Error('[Generator] No snapshot available. Call generate() before requesting chunks.');
  }

  private normalizeChunkSize(chunkSize: number): number {
    if (!Number.isFinite(chunkSize)) return 16;
    return Math.max(1, chunkSize | 0);
  }

  private chunkKey(chunkX: number, chunkY: number, chunkZ: number): string {
    return `${chunkX},${chunkY},${chunkZ}`;
  }

  private getChunkIndex(chunkSize: number): ChunkIndex {
    const cached = this.chunkIndices.get(chunkSize);
    if (cached) return cached;

    const result = this.getResultOrThrow();
    const buckets = new Map<string, ChunkBucket>();

    const blockIds = Object.keys(result.blocks);
    for (let i = 0; i < blockIds.length; i++) {
      const blockId = Number(blockIds[i]);
      const placements = result.blocks[blockId];
      if (!placements || placements.length === 0) continue;

      for (let j = 0; j < placements.length; j++) {
        const p = placements[j].globalCoordinate;
        const cx = Math.floor(p.x / chunkSize);
        const cy = Math.floor(p.y / chunkSize);
        const cz = Math.floor(p.z / chunkSize);
        const key = this.chunkKey(cx, cy, cz);
        let bucket = buckets.get(key);
        if (!bucket) {
          bucket = { blocks: {}, totalBlocks: 0 };
          buckets.set(key, bucket);
        }
        let chunkList = bucket.blocks[blockId];
        if (!chunkList) {
          chunkList = [];
          bucket.blocks[blockId] = chunkList;
        }
        chunkList.push(placements[j]);
        bucket.totalBlocks++;
      }
    }

    const index: ChunkIndex = { chunkSize, buckets };
    this.chunkIndices.set(chunkSize, index);
    return index;
  }
}

export type { GeneratorConfig } from './GeneratorConfig';
export { DEFAULT_CONFIG, mergeConfig } from './GeneratorConfig';
