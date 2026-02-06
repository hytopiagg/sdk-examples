import { defineBiome } from './BiomeDefinition';

/**
 * Ocean - Deep water basins with occasional small island tops.
 *
 * Surface blocks are height-conditioned so deep floor stays rocky/sandy,
 * shallow areas form beaches, and only rare high points become grassy islands.
 */
export default defineBiome({
  id: 'ocean',
  name: 'Ocean',
  weight: 0.3,

  blocks: {
    // Deep floor -> shallow sand -> rare grassy island tops
    surface: [
      { blockId: 56, maxY: 36, weight: 1.0 }, // stone-bricks (deeper seafloor)
      { blockId: 40, minY: 37, maxY: 39, weight: 1.0 }, // sandy shallows / beaches
      { blockId: 33, minY: 40, weight: 1.0 }, // rare island tops above sea level
    ],
    subsurface: [
      { blockId: 56, minDepth: 1, maxDepth: 3, weight: 0.8 },
      { blockId: 25, minDepth: 1, maxDepth: 3, weight: 0.2 },
    ],
    underground: [{ blockId: 55 }],
    subsurfaceDepth: 3,
  },

  terrain: {
    heightOffset: -20, // Deep basin relative to world base terrain
    heightScale: 1.9,  // Rare peaks can rise into small islands
    frequencyScale: 0.85,
    valleyScale: 0.0,  // Avoid canyon-style carving; keep broad basins
  },

  caves: {
    enabled: false,
  },

  roads: {
    densityMult: 0.45,
    throughCostMult: 2.2,
    forkChanceMult: 0.5,
    tunnelChanceMult: 0.5,
    curveBiasMult: 1.0,
  },

  liquids: {
    surface: {
      blockId: 57, // water
      level: 39,   // Ocean surface level
    },
  },

  // Let neighboring land materials win at coastlines.
  blendStrength: 0.7,
});
