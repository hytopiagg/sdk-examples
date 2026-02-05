import { defineBiome } from './BiomeDefinition';

/**
 * Desert - Eroded badlands with deep canyons
 * Dramatic elevation changes with exposed cave systems
 */
export default defineBiome({
  id: 'desert',
  name: 'Desert Badlands',
  weight: 0.6,
  
  blocks: {
    surface: 56,      // stone-bricks (weathered)
    subsurface: 55,   // stone
    underground: 16,  // deepslate
    subsurfaceDepth: 2,
  },
  
  terrain: {
    heightOffset: -8,      // Lower base - more cave exposure
    heightScale: 1.8,      // Dramatic mesas and canyons
    frequencyScale: 1.5,   // More jagged features
    valleyScale: 3.0,      // Deep canyon cuts
  },
  
  caves: {
    enabled: true,
    frequency: 1.3,        // Larger cave chambers
    threshold: 0.08,       // More caves (erosion)
    wormCaves: true,
  },
});
