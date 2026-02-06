/**
 * World Generator Configuration
 */

export interface GeneratorConfig {
  /** Deterministic seed - same seed = identical world */
  seed: number;
  
  /** World dimensions in blocks */
  worldSize: {
    x: number;
    y: number;
    z: number;
  };
  
  /** Fallback block ID when biomes disabled (default: 33 = grass-block) */
  blockId: number;
  
  /** Biome generation settings */
  biomes: {
    /** Enable biome-based generation */
    enabled: boolean;
    /** Size of each biome region in blocks */
    size: number;
    /** Width of blend zone at biome borders */
    blendWidth: number;
  };
  
  /** Base terrain generation (biomes apply modifiers to these) */
  terrain: {
    /** Average surface height (default: 48) */
    baseHeight: number;
    /** Max height variation ±blocks (default: 12) */
    heightVariation: number;
    /** Feature frequency - lower = larger features (default: 0.003) */
    frequency: number;
    /** Detail octaves (default: 5) */
    octaves: number;
    /** Valley/river channel settings */
    valley: {
      frequency: number;
      depth: number;
    };
  };
  
  /** Base cave generation (biomes apply modifiers to these) */
  caves: {
    enabled: boolean;
    /** Frequency - lower = larger caves (default: 0.02) */
    frequency: number;
    /** Detail octaves (default: 3) */
    octaves: number;
    /** Threshold - higher = more caves (default: 0.25) */
    threshold: number;
    /** Min Y for caves (default: 5) */
    minHeight: number;
    /** Distance from surface where caves fade out (terrain-relative) */
    surfaceFadeDistance: number;
    /** Enable worm-style tunnels */
    wormCaves: boolean;
    wormFrequency: number;
    wormStrength: number;
    /** Base frequency for tunnel domain warp noise */
    warpFrequency: number;
    /** Base frequency for chamber mask noise */
    chamberFrequency: number;
  };
}

export const DEFAULT_CONFIG: GeneratorConfig = {
  seed: 12345,
  worldSize: { x: 2048, y: 128, z: 2048 },
  blockId: 33,
  biomes: {
    enabled: true,
    size: 64,
    blendWidth: 20, // Wider blend for smoother terrain transitions
  },
  terrain: {
    baseHeight: 48,
    heightVariation: 12,       // Moderate terrain variation
    frequency: 0.003,
    octaves: 5,
    valley: { frequency: 0.003, depth: 4 }, // Conservative valley depth (biomes multiply this)
  },
  caves: {
    enabled: true,
    frequency: 0.018,          // Large cavern noise frequency
    octaves: 3,
    threshold: 0.30,           // Cavern density threshold
    minHeight: 5,
    surfaceFadeDistance: 4,    // Caves fade 4 blocks below surface (terrain-relative)
    wormCaves: true,
    wormFrequency: 0.012,      // Lower = longer tunnels, more spread out
    wormStrength: 0.7,         // Reduce density of tunnel networks
    warpFrequency: 0.009,
    chamberFrequency: 0.006,
  },
};

export function mergeConfig(userConfig: Partial<GeneratorConfig>): GeneratorConfig {
  return {
    seed: userConfig.seed ?? DEFAULT_CONFIG.seed,
    worldSize: { ...DEFAULT_CONFIG.worldSize, ...userConfig.worldSize },
    blockId: userConfig.blockId ?? DEFAULT_CONFIG.blockId,
    biomes: { ...DEFAULT_CONFIG.biomes, ...userConfig.biomes },
    terrain: {
      ...DEFAULT_CONFIG.terrain,
      ...userConfig.terrain,
      valley: {
        ...DEFAULT_CONFIG.terrain.valley,
        ...userConfig.terrain?.valley,
      },
    },
    caves: { ...DEFAULT_CONFIG.caves, ...userConfig.caves },
  };
}
