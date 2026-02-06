import { defineBiome } from './BiomeDefinition';

/**
 * Desert - Flat arid terrain with small underground tunnel systems
 * Solid surface with rare small cave openings
 * 
 * Blocks: hay-block (sandy), stone-bricks (sandstone), stone
 */
export default defineBiome({
  id: 'desert',
  name: 'Desert',
  weight: 0.8,
  
  blocks: {
    surface: [{ blockId: 40 }],      // hay-block (sandy appearance)
    subsurface: [{ blockId: 56 }],   // stone-bricks (sandstone-like)
    underground: [{ blockId: 55 }],  // stone
    subsurfaceDepth: 3,
  },
  
  terrain: {
    heightOffset: 0,
    heightScale: 0.4,      // Flat with gentle dunes
    frequencyScale: 0.8,
    valleyScale: 0.0,      // No valleys - completely solid surface
  },
  
  caves: {
    enabled: true,
    frequency: 0.55,       // Small tight tunnels
    threshold: -0.08,      // Fewer caves (raises effective threshold)
    wormCaves: true,
    wormStrength: 0.8,
    blendWeight: 1.25,
    profile: {
      centerY: 30,
      range: 12,
      strength: 0.8,
    },
    warp: {
      strength: 1.8,
      frequency: 1.25,
    },
    chamber: {
      chance: 0.02,
      strength: 0.35,
      frequency: 0.8,
    },
    speleothems: {
      enabled: true,
      blockId: 28, // sandstone-like
      density: 0.05,
      minLength: 1,
      maxLength: 4,
      stalactites: true,
      stalagmites: false,
    },
  },

  roads: {
    densityMult: 0.85,
    throughCostMult: 0.95,
    forkChanceMult: 0.85,
    tunnelChanceMult: 0.6,
    curveBiasMult: 0.9,
  },
  
  blendStrength: 1.1,
});
