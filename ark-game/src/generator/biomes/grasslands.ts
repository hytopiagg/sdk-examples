import { defineBiome } from './BiomeDefinition';

/**
 * Grasslands - Rolling hills with occasional sinkholes
 * Moderate terrain with some surface cave openings
 */
export default defineBiome({
  id: 'grasslands',
  name: 'Grasslands',
  weight: 1.0,
  
  blocks: {
    surface: 33,      // grass-block
    subsurface: 25,   // dirt
    underground: 55,  // stone
    subsurfaceDepth: 4,
  },
  
  terrain: {
    heightOffset: 0,
    heightScale: 1.2,      // Slightly more varied
    frequencyScale: 1.0,
    valleyScale: 1.5,      // Deeper valleys can expose caves
  },
  
  caves: {
    enabled: true,
    frequency: 1.0,
    threshold: 0.02,       // Slightly more caves
    wormCaves: true,
  },
});
