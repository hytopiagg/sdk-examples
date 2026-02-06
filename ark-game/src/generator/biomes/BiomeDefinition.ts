/**
 * Biome Definition - Configuration for a single biome type
 * 
 * Each biome can override terrain generation, cave behavior,
 * and block types. Unspecified values inherit from world defaults.
 */

export interface BiomeBlockOption {
  /** Block ID to place when this option is selected */
  blockId: number;
  /** Relative weight used among eligible options (default: 1) */
  weight?: number;
  /** Optional absolute Y minimum (inclusive) */
  minY?: number;
  /** Optional absolute Y maximum (inclusive) */
  maxY?: number;
  /** Optional depth from surface minimum (inclusive) */
  minDepth?: number;
  /** Optional depth from surface maximum (inclusive) */
  maxDepth?: number;
}

export type BiomeBlockLayerConfig = BiomeBlockOption[];

export interface BiomeBlocks {
  /** Surface layer block(s) (grass, sand, etc.) */
  surface: BiomeBlockLayerConfig;
  /** Block(s) just below surface (dirt, sandstone, etc.) */
  subsurface?: BiomeBlockLayerConfig;
  /** Deep underground block(s) (stone, etc.) */
  underground?: BiomeBlockLayerConfig;
  /** Depth of subsurface layer before underground begins */
  subsurfaceDepth?: number;
}

export interface BiomeTerrainConfig {
  /** Average surface height offset from world default */
  heightOffset?: number;
  /** Height variation multiplier (1.0 = default) */
  heightScale?: number;
  /** Terrain frequency multiplier (1.0 = default) */
  frequencyScale?: number;
  /** Valley depth multiplier (1.0 = default, 0 = no valleys) */
  valleyScale?: number;
}

export interface BiomeCaveConfig {
  /** Enable/disable caves in this biome */
  enabled?: boolean;
  /** Cave frequency multiplier (1.0 = default, higher = larger caves) */
  frequency?: number;
  /** Threshold adjustment (-0.1 = fewer caves, +0.1 = more caves) */
  threshold?: number;
  /** Enable worm-style tunnel caves */
  wormCaves?: boolean;
  /** Worm tunnel density multiplier (1.0 = default) */
  wormStrength?: number;
  /** Blend influence for cave parameters near biome borders */
  blendWeight?: number;
  /** Vertical cave profile: concentrates caves around centerY +/- range */
  profile?: {
    centerY: number;
    range: number;
    /** 0 = disabled profile, 1 = full profile (default: 1) */
    strength?: number;
  };
  /** Domain warp for spaghetti tunnels */
  warp?: {
    /** Warp amplitude in blocks */
    strength: number;
    /** Frequency multiplier for warp field (default: 1) */
    frequency?: number;
  };
  /** Rare chamber boost mask */
  chamber?: {
    /** Fraction (0-1) of space that receives chamber boost */
    chance: number;
    /** Chamber boost strength multiplier */
    strength: number;
    /** Frequency multiplier for chamber mask (default: 1) */
    frequency?: number;
  };
  /** Speleothem decoration (stalactites/stalagmites) in carved cave air */
  speleothems?: {
    /** Enable speleothem generation for this biome */
    enabled?: boolean;
    /** Single block ID used for formations */
    blockId?: number;
    /** Weighted block options (used instead of blockId when provided) */
    blocks?: { blockId: number; weight?: number }[];
    /** Spawn chance per eligible anchor point (0-1, default: 0.06) */
    density?: number;
    /** Minimum formation length in blocks (default: 1) */
    minLength?: number;
    /** Maximum formation length in blocks (default: 4) */
    maxLength?: number;
    /** Generate hanging stalactites (default: true) */
    stalactites?: boolean;
    /** Generate rising stalagmites (default: true) */
    stalagmites?: boolean;
  };
}

export interface BiomeRoadConfig {
  /**
   * Local multiplier for how likely road hubs/nodes are to be placed here.
   * >1 tends to create denser local road patterns, <1 sparser.
   */
  densityMult?: number;
  /**
   * Traversal cost multiplier used by road graph routing.
   * >1 discourages roads through this biome, <1 attracts them.
   */
  throughCostMult?: number;
  /**
   * Local multiplier for branch/fork creation frequency.
   */
  forkChanceMult?: number;
  /**
   * Local multiplier for tunnel likelihood/depth.
   */
  tunnelChanceMult?: number;
  /**
   * Local multiplier for gentle road curvature amplitude.
   */
  curveBiasMult?: number;
  /**
   * Local multiplier for road erosion severity.
   * >1 increases wear/destruction, <1 preserves roads in this biome.
   */
  erosionMult?: number;
}

export interface BiomeLiquidConfig {
  /** 
   * Surface liquid (fills air gaps at/below surfaceLevel)
   * Used for oceans, lakes, rivers
   */
  surface?: {
    /** Block ID for surface liquid (e.g., 57 = water) */
    blockId: number;
    /** Y level at/below which surface liquid fills air gaps */
    level: number;
  };
  
  /**
   * Underground liquid (fills cave air at/below undergroundLevel)
   * Used for lava pools, underground lakes
   */
  underground?: {
    /** Block ID for underground liquid (e.g., 43 = lava, 57 = water) */
    blockId: number;
    /** Y level at/below which underground liquid fills cave air */
    level: number;
  };
}

export interface BiomeCraterConfig {
  /** Average spacing between crater candidates (in blocks) */
  spacing: number;
  /** Probability (0-1) that a candidate cell spawns a crater */
  chance: number;
  /** Base crater diameter (in blocks) */
  diameter: number;
  /** Relative diameter jitter (0-1, default: 0.25) */
  diameterJitter?: number;
  /** Crater depth as a fraction of radius (default: 0.4) */
  depthRatio?: number;
  /** Relative depth jitter (0-1, default: 0.2) */
  depthJitter?: number;
  /** Optional block to paint near impact contact point */
  impactBlockId?: number;
  /** Contact paint radius as a fraction of crater radius (default: 0.35) */
  impactRadius?: number;
  /** Optional ejection debris around crater rim */
  debris?: {
    /** Debris density (0-1) in the ejection ring */
    amount: number;
    /** Max spread diameter from crater center (in blocks) */
    maxDiameter: number;
    /** Block ID used for ejected debris */
    blockId: number;
  };
}

export interface BiomeDefinition {
  /** Unique biome identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Selection weight (higher = more common). Default biomes use 1.0 */
  weight: number;
  
  /** Block configuration for this biome */
  blocks: BiomeBlocks;
  
  /** Terrain generation overrides */
  terrain?: BiomeTerrainConfig;
  
  /** Cave generation overrides */
  caves?: BiomeCaveConfig;

  /** Road generation overrides */
  roads?: BiomeRoadConfig;
  
  /** Liquid generation (water, lava) */
  liquids?: BiomeLiquidConfig;

  /** Optional impact crater generation for this biome */
  craters?: BiomeCraterConfig;
  
  /** 
   * Block blend strength at borders (0.0 - 2.0, default 1.0)
   * Higher values make this biome's blocks spread further into neighbors
   * Lower values make this biome accept more neighbor blocks
   */
  blendStrength?: number;
}

/**
 * Helper to create a biome definition with type safety
 */
export function defineBiome(biome: BiomeDefinition): BiomeDefinition {
  return biome;
}
