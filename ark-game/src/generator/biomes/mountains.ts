import { defineBiome } from './BiomeDefinition';

/**
 * Mountains - Extreme peaks with cliff faces and chasms
 * Dramatic vertical terrain with extensive cave networks
 */
export default defineBiome({
  id: 'mountains',
  name: 'Mountains',
  weight: 0.4,
  
  blocks: {
    surface: 55,      // stone (exposed rock)
    subsurface: 55,   // stone
    underground: 16,  // deepslate
    subsurfaceDepth: 1,
  },
  
  terrain: {
    heightOffset: 24,      // Very high peaks
    heightScale: 3.5,      // Extreme height variation
    frequencyScale: 1.8,   // Rugged, jagged terrain
    valleyScale: 4.0,      // Deep gorges between peaks
  },
  
  caves: {
    enabled: true,
    frequency: 1.5,        // Large cave systems
    threshold: 0.1,        // Many caves
    wormCaves: true,
  },
});
