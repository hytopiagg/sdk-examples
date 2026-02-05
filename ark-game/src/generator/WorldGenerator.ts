/**
 * WorldGenerator - Multi-pass procedural world generation
 * 
 * Generation happens in ordered passes, each building on previous results:
 * 1. Terrain - Surface, subsurface, caves
 * 2. Blending - Smooth biome transitions, seal gaps
 * 3. Crater - Surface impact carving + contact effects
 * 4. Liquid - Water, lava based on biome config
 * 5. (Future) Structures - Buildings, ruins
 * 6. (Future) Decoration - Trees, plants, details
 */

import type { BlockPlacement, Vector3Like } from 'hytopia';
import { TerrainSampler } from './noise/TerrainSampler';
import { CaveCarver } from './noise/CaveCarver';
import { BiomeSampler } from './BiomeSampler';
import { mergeConfig } from './GeneratorConfig';
import type { GeneratorConfig } from './GeneratorConfig';
import type { GeneratorPass } from './passes';
import { createContext } from './passes';
import { TerrainPass } from './passes/TerrainPass';
import { BlendingPass } from './passes/BlendingPass';
import { CraterPass } from './passes/CraterPass';
import { LiquidPass } from './passes/LiquidPass';

export interface GeneratorResult {
  blocks: { [blockTypeId: number]: BlockPlacement[] };
  spawnPoint: Vector3Like;
  stats: {
    totalBlocks: number;
    generationTimeMs: number;
  };
}

export default class WorldGenerator {
  private config: GeneratorConfig;
  private terrain: TerrainSampler;
  private caves: CaveCarver;
  private biomes: BiomeSampler | null;
  private passes: GeneratorPass[];
  
  constructor(config: Partial<GeneratorConfig> = {}) {
    this.config = mergeConfig(config);
    
    // Create biome sampler if enabled
    this.biomes = this.config.biomes.enabled
      ? new BiomeSampler({
          seed: this.config.seed,
          biomeSize: this.config.biomes.size,
          blendWidth: this.config.biomes.blendWidth,
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
    });
    
    // Configure generation passes
    this.passes = [
      new TerrainPass(),
      new BlendingPass(),
      new CraterPass(),
      new LiquidPass(),
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

    return {
      blocks,
      spawnPoint: this.findSpawnPoint(),
      stats: {
        totalBlocks,
        generationTimeMs: totalTime,
      },
    };
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
    
    // Determine block type
    const surfaceBlock = biome?.blocks.surface ?? this.config.blockId;
    const subsurfaceBlock = biome?.blocks.subsurface ?? surfaceBlock;
    const undergroundBlock = biome?.blocks.underground ?? subsurfaceBlock;
    const subsurfaceDepth = biome?.blocks.subsurfaceDepth ?? 4;
    
    const depthFromSurface = Math.floor(surfaceY) - y;
    if (depthFromSurface <= 1) return surfaceBlock;
    if (depthFromSurface <= subsurfaceDepth) return subsurfaceBlock;
    return undergroundBlock;
  }
  
  /** Get the biome at a position */
  getBiomeAt(x: number, z: number) {
    return this.biomes?.getBiomeAt(x, z) ?? null;
  }
  
  getConfig(): GeneratorConfig {
    return this.config;
  }
}

export type { GeneratorConfig } from './GeneratorConfig';
export { DEFAULT_CONFIG, mergeConfig } from './GeneratorConfig';
