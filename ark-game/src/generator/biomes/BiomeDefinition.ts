/**
 * Biome Definition - Configuration for a single biome type
 * 
 * Each biome can override terrain generation, cave behavior,
 * and block types. Unspecified values inherit from world defaults.
 */

export interface BiomeBlocks {
  /** Surface layer block (grass, sand, etc.) */
  surface: number;
  /** Block just below surface (dirt, sandstone, etc.) */
  subsurface?: number;
  /** Deep underground block (stone, etc.) */
  underground?: number;
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
  
  /** Liquid generation (water, lava) */
  liquids?: BiomeLiquidConfig;
  
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
