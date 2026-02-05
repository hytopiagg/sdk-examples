/**
 * TerrainSampler - 2D heightmap-based terrain generation with biome support
 * 
 * Pre-computes a heightmap for the entire world on construction,
 * applying biome modifiers and smoothing for natural terrain transitions.
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
  /** Blend width for height smoothing at steep transitions */
  blendWidth?: number;
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
    
    // Apply gradient-based height smoothing to eliminate steep transitions
    if (config.blendWidth) {
      this.smoothSteepTransitions(config.blendWidth);
    }
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
        
        this.heightmap[x * this.sizeZ + z] = height;
      }
    }
  }
  
  /**
   * Smooth steep height transitions globally
   * Uses gradient-aware smoothing - stronger where height changes are steeper
   * Works with organic Voronoi biomes (no grid dependency)
   */
  private smoothSteepTransitions(blendWidth: number): void {
    const { sizeX, sizeZ, heightmap } = this;
    
    // Create a copy for reading while we write
    const original = new Float32Array(heightmap);
    
    const passes = 3;
    const smoothRadius = Math.ceil(blendWidth * 0.5);
    const radiusSq = smoothRadius * smoothRadius;
    const radiusNorm = smoothRadius + 1;
    
    // Threshold for what counts as a "steep" gradient (blocks per 1 block distance)
    const steepThreshold = 3;
    
    for (let pass = 0; pass < passes; pass++) {
      const source = pass === 0 ? original : heightmap;
      
      for (let x = 0; x < sizeX; x++) {
        for (let z = 0; z < sizeZ; z++) {
          const centerH = source[x * sizeZ + z];
          
          // Measure local gradient (max height difference from immediate neighbors)
          let maxDiff = 0;
          if (x > 0) maxDiff = Math.max(maxDiff, Math.abs(centerH - source[(x-1) * sizeZ + z]));
          if (x < sizeX-1) maxDiff = Math.max(maxDiff, Math.abs(centerH - source[(x+1) * sizeZ + z]));
          if (z > 0) maxDiff = Math.max(maxDiff, Math.abs(centerH - source[x * sizeZ + (z-1)]));
          if (z < sizeZ-1) maxDiff = Math.max(maxDiff, Math.abs(centerH - source[x * sizeZ + (z+1)]));
          
          // Only smooth steep areas
          if (maxDiff < steepThreshold) continue;
          
          // Smoothing strength based on gradient steepness
          const gradientFactor = Math.min(1, (maxDiff - steepThreshold) / 10);
          const smoothStrength = 0.4 + gradientFactor * 0.4;
          
          let sum = 0;
          let weightSum = 0;
          
          for (let dx = -smoothRadius; dx <= smoothRadius; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= sizeX) continue;
            
            for (let dz = -smoothRadius; dz <= smoothRadius; dz++) {
              const nz = z + dz;
              if (nz < 0 || nz >= sizeZ) continue;
              
              const distSq = dx * dx + dz * dz;
              if (distSq > radiusSq) continue;
              
              const weight = 1 - Math.sqrt(distSq) / radiusNorm;
              sum += source[nx * sizeZ + nz] * weight;
              weightSum += weight;
            }
          }
          
          if (weightSum > 0) {
            heightmap[x * sizeZ + z] = centerH + (sum / weightSum - centerH) * smoothStrength;
          }
        }
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
