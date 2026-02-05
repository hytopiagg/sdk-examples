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
    /** Max Y for caves (default: 40) */
    fadeHeight: number;
    /** Enable worm-style tunnels */
    wormCaves: boolean;
    wormFrequency: number;
    wormStrength: number;
  };
}

export const DEFAULT_CONFIG: GeneratorConfig = {
  seed: 12345,
  worldSize: { x: 512, y: 128, z: 512 },
  blockId: 33,
  biomes: {
    enabled: true,
    size: 64,
    blendWidth: 12,
  },
  terrain: {
    baseHeight: 48,
    heightVariation: 16,       // More dramatic terrain
    frequency: 0.003,
    octaves: 5,
    valley: { frequency: 0.003, depth: 12 }, // Deeper valleys for canyons
  },
  caves: {
    enabled: true,
    frequency: 0.018,          // Slightly larger caves
    octaves: 3,
    threshold: 0.22,           // Slightly more caves
    minHeight: 5,
    fadeHeight: 55,            // Caves can reach near surface
    wormCaves: true,
    wormFrequency: 0.008,      // Longer worm tunnels
    wormStrength: 0.5,         // Stronger worm caves
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
