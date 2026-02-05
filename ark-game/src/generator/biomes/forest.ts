import { defineBiome } from './BiomeDefinition';

/**
 * Forest - Rolling hills with underground cave networks
 * Solid surface with rare small cave entrances
 * 
 * Blocks: grass-block-pine, dirt, mossy-cobblestone
 */
export default defineBiome({
  id: 'forest',
  name: 'Forest',
  weight: 1.0,
  
  blocks: {
    surface: 34,      // grass-block-pine (forest grass)
    subsurface: 25,   // dirt
    underground: 45,  // mossy-cobblestone (forest underground)
    subsurfaceDepth: 4,
  },
  
  terrain: {
    heightOffset: 2,
    heightScale: 0.6,      // Gentle rolling hills
    frequencyScale: 1.0,
    valleyScale: 0.0,      // No valleys - solid surface
  },

  caves: {
    enabled: true,
    frequency: 0.6,        // Small tunnel systems
    threshold: -0.08,      // Fewer caves
    wormCaves: true,
  },
  
  blendStrength: 1.0, // Neutral blending
});
