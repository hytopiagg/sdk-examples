/**
 * Generator Passes
 * 
 * Multi-pass generation system. Passes execute in order,
 * each building on the results of previous passes.
 */

export { GeneratorPass, GenerationContext, createContext } from './GeneratorPass';
export { TerrainPass } from './TerrainPass';
export { BlendingPass } from './BlendingPass';

// Future passes will be added here:
// export { WaterPass } from './WaterPass';
// export { StructurePass } from './StructurePass';
// export { DecorationPass } from './DecorationPass';

