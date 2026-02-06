/**
 * Generator Passes
 * 
 * Multi-pass generation system. Passes execute in order:
 * 1. Terrain - Surface, subsurface, cliff filling, cave boundaries
 * 2. Blending - Fill height gaps, seal holes at biome transitions
 * 3. Speleothem - Cave stalactites/stalagmites (biome cave opt-in)
 * 4. Liquid - Surface water (lakes) and underground liquid (lava pools)
 * 5. Road - Global road network (tunnels through terrain, bridges over water)
 * 6. Crater - Biome-driven impact carving + contact block replacement
 */

// Core types
export type { GeneratorPass, GenerationContext } from './GeneratorPass';
export { createContext } from './GeneratorPass';

// Passes (execution order)
export { TerrainPass } from './TerrainPass';
export { BlendingPass } from './BlendingPass';
export { SpeleothemPass } from './SpeleothemPass';
export { LiquidPass } from './LiquidPass';
export { RoadPass } from './RoadPass';
export { CraterPass } from './CraterPass';
