/**
 * TerrainSampler - 2D heightmap-based terrain generation with biome support
 * 
 * Pre-computes a heightmap for the entire world on construction,
 * applying biome modifiers for smooth terrain transitions.
 */

import { FBM2D, Simplex2D } from './Simplex';
import { BiomeSampler } from '../BiomeSampler';

export interface TerrainSamplerConfig {
  seed: number;
  worldSizeX: number;
  worldSizeZ: number;
  baseHeight: number;
  heightVariation: number;
  terrainFrequency: number;
  terrainOctaves: number;
  valleyFrequency: number;
  valleyDepth: number;
  biomeSampler?: BiomeSampler;
}

export class TerrainSampler {
  private heightmap: Float32Array;
  private sizeX: number;
  private sizeZ: number;
  
  constructor(config: TerrainSamplerConfig) {
    const { worldSizeX, worldSizeZ } = config;
    this.sizeX = worldSizeX;
    this.sizeZ = worldSizeZ;
    this.heightmap = new Float32Array(worldSizeX * worldSizeZ);
    this.computeHeightmap(config);
  }
  
  private computeHeightmap(config: TerrainSamplerConfig): void {
    const { 
      seed, worldSizeX, worldSizeZ, baseHeight, heightVariation, 
      terrainFrequency, terrainOctaves, valleyFrequency, valleyDepth, biomeSampler 
    } = config;
    
    // Build noise samplers (only needed during construction)
    const elevationNoise = new FBM2D(seed, terrainFrequency, terrainOctaves, 2.0, 0.45);
    const valleyNoise = new FBM2D(seed + 55555, valleyFrequency, 3, 2.2, 0.4);
    const ridgeNoise = new Simplex2D(seed + 77777, terrainFrequency * 0.7);
    
    for (let x = 0; x < worldSizeX; x++) {
      for (let z = 0; z < worldSizeZ; z++) {
        // Get biome modifiers if sampler provided
        let heightOffset = 0, heightScale = 1, valleyScale = 1;
        if (biomeSampler) {
          const blended = biomeSampler.getBlendedValues(x, z);
          heightOffset = blended.terrain.heightOffset;
          heightScale = blended.terrain.heightScale;
          valleyScale = blended.terrain.valleyScale;
        }
        
        // Compute terrain height
        const baseNoise = elevationNoise.sample(x, z);
        const effectiveVariation = heightVariation * heightScale;
        const valleyCarve = (1 - Math.pow(Math.abs(valleyNoise.sample(x, z)), 0.7)) * valleyDepth * valleyScale;
        const ridgeBonus = Math.max(0, baseNoise) * Math.abs(ridgeNoise.sample(x, z)) * 0.15 * effectiveVariation;
        
        let height = (baseHeight + heightOffset) + baseNoise * effectiveVariation - valleyCarve + ridgeBonus;
        
        // Squash extremes
        const targetBase = baseHeight + heightOffset;
        const deviation = height - targetBase;
        const maxDev = effectiveVariation * 0.8;
        if (Math.abs(deviation) > maxDev) {
          height = targetBase + Math.sign(deviation) * (maxDev + (Math.abs(deviation) - maxDev) * 0.4);
        }
        
        this.heightmap[x * worldSizeZ + z] = height;
      }
    }
  }
  
  /** Get terrain height at x,z (clamped to bounds) */
  getBaseHeight(x: number, z: number): number {
    const ix = Math.max(0, Math.min(this.sizeX - 1, x | 0));
    const iz = Math.max(0, Math.min(this.sizeZ - 1, z | 0));
    return this.heightmap[ix * this.sizeZ + iz];
  }
}
