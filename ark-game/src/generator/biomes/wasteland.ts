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
    heightOffset: -12,     // Very sunken - exposes cave layer
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
  
  blendStrength: 1.2,
});
