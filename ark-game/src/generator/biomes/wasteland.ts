import { defineBiome } from './BiomeDefinition';

/**
 * Wasteland - Post-apocalyptic terrain with exposed caverns and canyons
 * Dramatic surface damage revealing underground systems
 * 
 * Blocks: cobbled-deepslate (cracked), black-concrete (charred), coal-ore (burned)
 */
export default defineBiome({
  id: 'wasteland',
  name: 'Wasteland',
  weight: 0.6,
  
  blocks: {
    surface: [{ blockId: 14 }],      // cobbled-deepslate (cracked wasteland surface)
    subsurface: [{ blockId: 6 }],
    underground: [{ blockId: 13 }],  // coal-ore (burned underground)
    subsurfaceDepth: 2,
  },
  
  terrain: {
    heightOffset: -6,      // Sunken terrain - exposes cave layer
    heightScale: 1.8,      // Chaotic terrain variation
    frequencyScale: 1.6,   // Irregular features
    valleyScale: 4.0,      // Deep canyons (4 * base 4 = 16 block valleys)
  },
  
  caves: {
    enabled: true,
    frequency: 1.4,        // Large cavern systems
    threshold: 0.15,       // Much more caves (lowers effective threshold)
    wormCaves: true,
    wormStrength: 1.3,
    blendWeight: 1.6,
    profile: {
      centerY: 22,
      range: 26,
      strength: 0.5,
    },
    warp: {
      strength: 2.4,
      frequency: 1.1,
    },
    chamber: {
      chance: 0.16,
      strength: 1.15,
      frequency: 1.35,
    },
    speleothems: {
      enabled: true,
      blocks: [
        { blockId: 28, weight: 0.7 }, // cobbled-deepslate
        { blockId: 29, weight: 0.3 },  // black-concrete
      ],
      density: 0.02,
      minLength: 1,
      maxLength: 7,
      stalactites: true,
      stalagmites: true,
    },
  },

  roads: {
    densityMult: 0.95,
    throughCostMult: 1.1,
    forkChanceMult: 1.2,
    tunnelChanceMult: 1.25,
    curveBiasMult: 1.2,
  },

  craters: {
    spacing: 80,
    chance: 0.55,
    diameter: 22,
    diameterJitter: 0.45,
    depthRatio: 0.4,
    depthJitter: 0.3,
    impactBlockId: 51,     // crater impact floor/contact
    impactRadius: 0.38,
    debris: {
      amount: 0.2,
      maxDiameter: 52,
      blockId: 14,          // cobbled-deepslate ejecta
    },
  },
  
  liquids: {
    // Lava pools in deep caves
    underground: {
      blockId: 43,         // lava
      level: 15,           // Only in deep caves (Y <= 15)
    },
  },
  
  blendStrength: 1.2,
});
