import { defineBiome } from './BiomeDefinition';

/**
 * Wasteland - Crater-scarred terrain with collapsed tunnels
 * Post-apocalyptic landscape with exposed underground
 */
export default defineBiome({
  id: 'wasteland',
  name: 'Wasteland',
  weight: 0.5,
  
  blocks: {
    surface: 25,      // dirt (dead earth)
    subsurface: 14,   // cobbled-deepslate
    underground: 16,  // deepslate
    subsurfaceDepth: 2,
  },
  
  terrain: {
    heightOffset: -6,      // Lower terrain - more exposure
    heightScale: 2.0,      // Dramatic craters
    frequencyScale: 1.6,   // Chaotic terrain
    valleyScale: 3.5,      // Deep impact craters
  },
  
  caves: {
    enabled: true,
    frequency: 1.4,        // Large collapsed areas
    threshold: 0.12,       // Lots of caves (structural damage)
    wormCaves: true,
  },
});
