/**
 * Generator Passes
 * 
 * Multi-pass generation system. Passes execute in order,
 * each building on the results of previous passes.
 */

export { GeneratorPass, GenerationContext, createContext } from './GeneratorPass';
export { TerrainPass } from './TerrainPass';

// Future passes will be added here:
// export { WaterPass } from './WaterPass';
// export { SmoothingPass } from './SmoothingPass';
// export { StructurePass } from './StructurePass';
// export { DecorationPass } from './DecorationPass';

