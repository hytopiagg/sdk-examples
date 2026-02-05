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

    // Pre-compute biome modifiers on a sparse grid and interpolate.
    // Biome values change slowly (biome cells ~128 blocks), so sampling every
    // STEP blocks and bilinearly interpolating is nearly lossless.
    const STEP = 4;

    // Sparse grid dimensions (ceil to cover edges)
    const gridW = Math.ceil(worldSizeX / STEP) + 1;
    const gridH = Math.ceil(worldSizeZ / STEP) + 1;

    // Sparse biome modifier grids (only allocated when biomes are enabled)
    const biomeGrid = biomeSampler ? {
      offset: new Float32Array(gridW * gridH),
      scale: new Float32Array(gridW * gridH),
      valley: new Float32Array(gridW * gridH),
    } : null;

    if (biomeSampler && biomeGrid) {
      for (let gx = 0; gx < gridW; gx++) {
        const wx = Math.min(gx * STEP, worldSizeX - 1);
        for (let gz = 0; gz < gridH; gz++) {
          const wz = Math.min(gz * STEP, worldSizeZ - 1);
          const blended = biomeSampler.getBlendedValues(wx, wz);
          const i = gx * gridH + gz;
          biomeGrid.offset[i] = blended.terrain.heightOffset;
          biomeGrid.scale[i] = blended.terrain.heightScale;
          biomeGrid.valley[i] = blended.terrain.valleyScale;
        }
      }
    }

    for (let x = 0; x < worldSizeX; x++) {
      for (let z = 0; z < worldSizeZ; z++) {
        // Bilinearly interpolate biome modifiers from sparse grid
        let heightOffset = 0, heightScale = 1, valleyScale = 1;
        if (biomeGrid) {
          const gxf = x / STEP;
          const gzf = z / STEP;
          const gx0 = gxf | 0;
          const gz0 = gzf | 0;
          const gx1 = Math.min(gx0 + 1, gridW - 1);
          const gz1 = Math.min(gz0 + 1, gridH - 1);
          const fx = gxf - gx0;
          const fz = gzf - gz0;

          const i00 = gx0 * gridH + gz0;
          const i10 = gx1 * gridH + gz0;
          const i01 = gx0 * gridH + gz1;
          const i11 = gx1 * gridH + gz1;

          const w00 = (1 - fx) * (1 - fz);
          const w10 = fx * (1 - fz);
          const w01 = (1 - fx) * fz;
          const w11 = fx * fz;

          heightOffset = biomeGrid.offset[i00] * w00 + biomeGrid.offset[i10] * w10 + biomeGrid.offset[i01] * w01 + biomeGrid.offset[i11] * w11;
          heightScale = biomeGrid.scale[i00] * w00 + biomeGrid.scale[i10] * w10 + biomeGrid.scale[i01] * w01 + biomeGrid.scale[i11] * w11;
          valleyScale = biomeGrid.valley[i00] * w00 + biomeGrid.valley[i10] * w10 + biomeGrid.valley[i01] * w01 + biomeGrid.valley[i11] * w11;
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
   * Smooth steep height transitions globally using separable 1D passes.
   * Two 1D passes (horizontal + vertical) replace the O(r²) circular kernel
   * with O(r) per pixel, giving ~radius× speedup.
   * Gradient gating still applies: only steep areas get smoothed.
   */
  private smoothSteepTransitions(blendWidth: number): void {
    const { sizeX, sizeZ, heightmap } = this;

    const passes = 3;
    const smoothRadius = Math.ceil(blendWidth * 0.5);
    const radiusNorm = smoothRadius + 1;
    const steepThreshold = 3;

    // Pre-compute 1D kernel weights (linear falloff, same as before)
    const kernelWeights = new Float32Array(smoothRadius + 1);
    for (let d = 0; d <= smoothRadius; d++) {
      kernelWeights[d] = 1 - d / radiusNorm;
    }

    // Temp buffer for intermediate results and steepness mask
    const temp = new Float32Array(sizeX * sizeZ);
    const steepStrength = new Float32Array(sizeX * sizeZ);

    for (let pass = 0; pass < passes; pass++) {
      // Compute gradient-based smoothing strength for each position
      for (let x = 0; x < sizeX; x++) {
        for (let z = 0; z < sizeZ; z++) {
          const idx = x * sizeZ + z;
          const centerH = heightmap[idx];
          let maxDiff = 0;
          if (x > 0) maxDiff = Math.max(maxDiff, Math.abs(centerH - heightmap[(x - 1) * sizeZ + z]));
          if (x < sizeX - 1) maxDiff = Math.max(maxDiff, Math.abs(centerH - heightmap[(x + 1) * sizeZ + z]));
          if (z > 0) maxDiff = Math.max(maxDiff, Math.abs(centerH - heightmap[idx - 1]));
          if (z < sizeZ - 1) maxDiff = Math.max(maxDiff, Math.abs(centerH - heightmap[idx + 1]));
          steepStrength[idx] = maxDiff < steepThreshold ? 0 : 0.4 + Math.min(1, (maxDiff - steepThreshold) / 10) * 0.4;
        }
      }

      // Horizontal pass: blur along Z axis
      for (let x = 0; x < sizeX; x++) {
        const rowBase = x * sizeZ;
        for (let z = 0; z < sizeZ; z++) {
          const idx = rowBase + z;
          if (steepStrength[idx] === 0) { temp[idx] = heightmap[idx]; continue; }

          let sum = 0, wSum = 0;
          const zMin = Math.max(0, z - smoothRadius);
          const zMax = Math.min(sizeZ - 1, z + smoothRadius);
          for (let nz = zMin; nz <= zMax; nz++) {
            const w = kernelWeights[Math.abs(nz - z)];
            sum += heightmap[rowBase + nz] * w;
            wSum += w;
          }
          const smoothed = sum / wSum;
          temp[idx] = heightmap[idx] + (smoothed - heightmap[idx]) * steepStrength[idx];
        }
      }

      // Vertical pass: blur along X axis using temp as source
      for (let x = 0; x < sizeX; x++) {
        for (let z = 0; z < sizeZ; z++) {
          const idx = x * sizeZ + z;
          if (steepStrength[idx] === 0) { heightmap[idx] = temp[idx]; continue; }

          let sum = 0, wSum = 0;
          const xMin = Math.max(0, x - smoothRadius);
          const xMax = Math.min(sizeX - 1, x + smoothRadius);
          for (let nx = xMin; nx <= xMax; nx++) {
            const w = kernelWeights[Math.abs(nx - x)];
            sum += temp[nx * sizeZ + z] * w;
            wSum += w;
          }
          const smoothed = sum / wSum;
          heightmap[idx] = temp[idx] + (smoothed - temp[idx]) * steepStrength[idx];
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
