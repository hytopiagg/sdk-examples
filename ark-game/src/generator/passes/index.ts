/**
 * Generator Passes
 * 
 * Multi-pass generation system. Passes execute in order:
 * 1. Terrain - Surface, subsurface, cliff filling, cave boundaries
 * 2. Blending - Fill height gaps, seal holes at biome transitions
 * 3. Liquid - Surface water (lakes) and underground liquid (lava pools)
 */

// Core types
export { GeneratorPass, GenerationContext, createContext } from './GeneratorPass';

// Passes (execution order)
export { TerrainPass } from './TerrainPass';
export { BlendingPass } from './BlendingPass';
export { LiquidPass } from './LiquidPass';
