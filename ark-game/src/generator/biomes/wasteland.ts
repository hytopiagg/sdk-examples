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
    surface: 14,      // cobbled-deepslate (cracked wasteland surface)
    subsurface: 5,    // black-concrete (charred/burned layer)
    underground: 13,  // coal-ore (burned underground)
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
  },

  craters: {
    spacing: 80,
    chance: 0.55,
    diameter: 22,
    diameterJitter: 0.45,
    depthRatio: 0.4,
    depthJitter: 0.3,
    impactBlockId: 5,      // black-concrete scorched contact
    impactRadius: 0.38,
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
