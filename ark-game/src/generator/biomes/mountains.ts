import { defineBiome } from './BiomeDefinition';

/**
 * Mountains - Massive peaks with internal cave systems
 * Mostly solid rock with some natural cave openings in cliff faces
 * 
 * Blocks: stone (exposed rock), deepslate, lava-stone (volcanic)
 */
export default defineBiome({
  id: 'mountains',
  name: 'Volcanic Mountains',
  weight: 0.5,
  
  blocks: {
    surface: 55,      // stone (exposed mountain rock)
    subsurface: 16,   // deepslate
    underground: 44,  // lava-stone (volcanic core)
    subsurfaceDepth: 2,
  },
  
  terrain: {
    heightOffset: 40,      // Very high peaks
    heightScale: 2.5,      // Large rolling variation
    frequencyScale: 1.3,   // Natural mountain ridges
    valleyScale: 0.5,      // Valleys between peaks
  },

  caves: {
    enabled: true,
    frequency: 0.8,        // Medium internal tunnels
    threshold: -0.05,      // Fewer caves
    wormCaves: true,
  },
  
  // Low blendStrength: mountain blocks yield to neighbor biomes at boundaries
  // This prevents mountain stone from dominating the transition zone
  blendStrength: 0.4,
});
