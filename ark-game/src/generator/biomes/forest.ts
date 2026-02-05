import { defineBiome } from './BiomeDefinition';

/**
 * Forest - Dense ravines and hidden cave entrances
 * Moderate hills with deep cuts revealing underground
 */
export default defineBiome({
  id: 'forest',
  name: 'Forest Ravines',
  weight: 0.8,
  
  blocks: {
    surface: 33,      // grass-block
    subsurface: 25,   // dirt
    underground: 55,  // stone
    subsurfaceDepth: 5,
  },
  
  terrain: {
    heightOffset: 4,
    heightScale: 1.5,      // Rolling hills
    frequencyScale: 1.4,   // More varied features
    valleyScale: 2.5,      // Deep ravines
  },
  
  caves: {
    enabled: true,
    frequency: 1.2,
    threshold: 0.05,       // Good cave density
    wormCaves: true,
  },
});
