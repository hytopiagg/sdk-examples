/**
 * Generator Passes
 * 
 * Multi-pass generation system. Passes execute in order:
 * 1. Terrain - Surface, subsurface, cliff filling, cave boundaries
 * 2. Blending - Fill height gaps, seal holes at biome transitions
 * 3. Crater - Biome-driven impact carving + contact block replacement
 * 4. Speleothem - Cave stalactites/stalagmites (biome cave opt-in)
 * 5. Liquid - Surface water (lakes) and underground liquid (lava pools)
 */

// Core types
export type { GeneratorPass, GenerationContext } from './GeneratorPass';
export { createContext } from './GeneratorPass';

// Passes (execution order)
export { TerrainPass } from './TerrainPass';
export { BlendingPass } from './BlendingPass';
export { CraterPass } from './CraterPass';
export { SpeleothemPass } from './SpeleothemPass';
export { LiquidPass } from './LiquidPass';
