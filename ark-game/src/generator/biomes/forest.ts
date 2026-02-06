import { defineBiome } from './BiomeDefinition';

/**
 * Forest - Rolling hills with underground cave networks
 * Solid surface with rare small cave entrances
 * 
 * Blocks: grass-block-pine, dirt, mossy-cobblestone
 */
export default defineBiome({
  id: 'forest',
  name: 'Forest',
  weight: 1.0,
  
  blocks: {
    surface: [{ blockId: 34 }],      // grass-block-pine (forest grass)
    subsurface: [{ blockId: 25 }],   // dirt
    underground: [{ blockId: 45 }],  // mossy-cobblestone (forest underground)
    subsurfaceDepth: 4,
  },
  
  terrain: {
    heightOffset: 2,
    heightScale: 0.6,      // Gentle rolling hills
    frequencyScale: 1.0,
    valleyScale: 0.0,      // No valleys - solid surface
  },

  caves: {
    enabled: true,
    frequency: 0.65,       // Small tunnel systems
    threshold: -0.08,      // Fewer caves
    wormCaves: true,
    wormStrength: 0.95,
    blendWeight: 1.0,
    profile: {
      centerY: 34,
      range: 18,
      strength: 0.65,
    },
    warp: {
      strength: 1.2,
      frequency: 1.0,
    },
    chamber: {
      chance: 0.05,
      strength: 0.55,
      frequency: 0.9,
    },
    speleothems: {
      enabled: true,
      blockId: 28, // mossy-cobblestone
      density: 0.04,
      minLength: 1,
      maxLength: 5,
      stalactites: true,
      stalagmites: true,
    },
  },

  roads: {
    densityMult: 1.0,
    throughCostMult: 1.0,
    forkChanceMult: 1.0,
    tunnelChanceMult: 0.9,
    curveBiasMult: 1.1,
  },
  
  craters: {
    spacing: 20,
    chance: 0.2,
    diameter: 16,
    diameterJitter: 0.4,
    depthRatio: 2,
    depthJitter: 0.5,
    impactBlockId: 51,     // crater impact floor/contact
    impactRadius: 0.75,
    debris: {
      amount: 0.12,
      maxDiameter: 30,
      blockId: 25,         // dirt ejecta
    },
  },

  blendStrength: 1.0, // Neutral blending
});
