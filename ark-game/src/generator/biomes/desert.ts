import { defineBiome } from './BiomeDefinition';

/**
 * Desert - Flat arid terrain with small underground tunnel systems
 * Solid surface with rare small cave openings
 * 
 * Blocks: hay-block (sandy), stone-bricks (sandstone), stone
 */
export default defineBiome({
  id: 'desert',
  name: 'Desert',
  weight: 0.8,
  
  blocks: {
    surface: 40,      // hay-block (sandy appearance)
    subsurface: 56,   // stone-bricks (sandstone-like)
    underground: 55,  // stone
    subsurfaceDepth: 3,
  },
  
  terrain: {
    heightOffset: 0,
    heightScale: 0.4,      // Flat with gentle dunes
    frequencyScale: 0.8,
    valleyScale: 0.0,      // No valleys - completely solid surface
  },
  
  caves: {
    enabled: true,
    frequency: 0.6,        // Small tight tunnels
    threshold: -0.08,      // Fewer caves (raises effective threshold)
    wormCaves: true,
  },
  
  blendStrength: 1.1,
});
