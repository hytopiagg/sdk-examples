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
    surface: 33,      // grass-block (standard grass)
    subsurface: 25,   // dirt
    underground: 55,  // stone
    subsurfaceDepth: 4,
  },
  
  terrain: {
    heightOffset: 0,
    heightScale: 0.3,      // Very flat plains
    frequencyScale: 0.7,
    valleyScale: 0.0,      // No valleys - completely solid surface
  },
  
  caves: {
    enabled: true,
    frequency: 0.6,        // Small underground tunnels
    threshold: -0.1,       // Very few caves (highest effective threshold)
    wormCaves: true,
  },
  
  blendStrength: 1.3,
});
