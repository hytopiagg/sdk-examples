import { defineBiome } from './BiomeDefinition';

/**
 * Mountains - Massive peaks with internal cave systems
 * Mostly solid rock with some natural cave openings in cliff faces
 * 
 * Blocks: stone (exposed rock), deepslate, lava-stone (volcanic)
 */
export default defineBiome({
  id: 'mountains',
  name: 'Volcanic Mountains',
  weight: 0.5,
  
  blocks: {
    surface: [{ blockId: 55 }],      // stone (exposed mountain rock)
    subsurface: [{ blockId: 16 }],   // deepslate
    underground: [{ blockId: 44 }],  // lava-stone (volcanic core)
    subsurfaceDepth: 2,
  },
  
  terrain: {
    heightOffset: 40,      // Very high peaks
    heightScale: 2.5,      // Large rolling variation
    frequencyScale: 1.3,   // Natural mountain ridges
    valleyScale: 0.5,      // Valleys between peaks
  },

  caves: {
    enabled: true,
    frequency: 0.78,       // Lower frequency for larger cave volumes
    threshold: 0.16,       // Much more cave carving
    wormCaves: true,
    wormStrength: 1.05,
    blendWeight: 1.35,
    profile: {
      centerY: 72,
      range: 28,
      strength: 0.65,
    },
    warp: {
      strength: 1.1,
      frequency: 0.6,
    },
    chamber: {
      chance: 0.24,
      strength: 1.8,
      frequency: 0.95,
    },
    speleothems: {
      enabled: true,
      blocks: [
        { blockId: 28, weight: 0.65 }, // deepslate spikes
        { blockId: 29, weight: 0.35 }, // stone spikes
      ],
      density: 0.05,
      minLength: 1,
      maxLength: 8,
      stalactites: true,
      stalagmites: true,
    },
  },

  roads: {
    densityMult: 0.65,
    throughCostMult: 1.35,
    forkChanceMult: 0.75,
    tunnelChanceMult: 1.6,
    curveBiasMult: 0.8,
  },
  
  // Low blendStrength: mountain blocks yield to neighbor biomes at boundaries
  // This prevents mountain stone from dominating the transition zone
  blendStrength: 0.4,
});
