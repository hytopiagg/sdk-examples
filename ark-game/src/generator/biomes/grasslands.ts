import { defineBiome } from './BiomeDefinition';

/**
 * Grasslands - Flat open plains with underground tunnel systems
 * Solid surface - caves only accessible through rare openings
 * 
 * Blocks: grass-block, dirt, stone
 */
export default defineBiome({
  id: 'grasslands',
  name: 'Grasslands',
  weight: 1.0,
  
  blocks: {
    surface: [{ blockId: 33 }],      // grass-block (standard grass)
    subsurface: [{ blockId: 25 }],   // dirt
    underground: [{ blockId: 55 }],  // stone
    subsurfaceDepth: 4,
  },
  
  terrain: {
    heightOffset: -6,          // Lower basin - creates natural lake beds
    heightScale: 0.6,          // More variation for pond depressions
    frequencyScale: 0.7,
    valleyScale: 0.0,          // No valleys - completely solid surface
  },
  
  caves: {
    enabled: true,
    frequency: 0.6,        // Small underground tunnels
    threshold: -0.1,       // Very few caves (highest effective threshold)
    wormCaves: true,
    wormStrength: 0.85,
    blendWeight: 0.9,
    profile: {
      centerY: 24,
      range: 16,
      strength: 0.9,
    },
    warp: {
      strength: 0.8,
      frequency: 0.9,
    },
    chamber: {
      chance: 0.03,
      strength: 0.45,
      frequency: 1.1,
    },
  },

  roads: {
    densityMult: 1.2,
    throughCostMult: 0.85,
    forkChanceMult: 1.15,
    tunnelChanceMult: 0.75,
    curveBiasMult: 0.95,
  },
  
  liquids: {
    // Ponds in low areas - level must stay below other biomes' terrain minimums
    // Desert min ~43, Forest min ~43, so 38 is safe
    surface: {
      blockId: 57,         // water
      level: 38,           // Fill depressions below Y=38
    },
    // Underground water pools - below Wasteland lava (Y=15) so lava dominates there
    underground: {
      blockId: 57,         // water
      level: 12,           // Water in deepest caves only
    },
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
  
  blendStrength: 1.3,
});
