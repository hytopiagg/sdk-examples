/**
 * Cellular (Voronoi) Noise - Creates organic cell-like regions
 * 
 * Inspired by Terra's CellularSampler. Each cell has a jittered center point,
 * and we track both the closest cell (for biome assignment) and the distance
 * to cell boundaries (for blending).
 */

/** Simple hash function for deterministic jitter */
function hash2D(seed: number, x: number, z: number): number {
  let h = seed + x * 374761393 + z * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return h;
}

/** Convert hash to float in range [0, 1) */
function hashToFloat(hash: number): number {
  return (hash & 0x7fffffff) / 0x7fffffff;
}

export interface CellInfo {
  cellId: number;
  distance1: number;
  distance2: number;
  /** Blend factor: 0 = at cell center, 1 = at cell boundary */
  edgeFactor: number;
}

export class CellularNoise2D {
  private seed: number;
  private cellSize: number;
  private invSize: number; // Pre-computed for hot path
  private jitter: number;

  // Pre-allocated working arrays to avoid per-call allocations
  private readonly _cells: { id: number; dist: number }[];
  private readonly _resultNeighbors: CellInfo[];

  constructor(seed: number, cellSize: number, jitter = 0.8) {
    this.seed = seed;
    this.cellSize = cellSize;
    this.invSize = 1 / cellSize;
    this.jitter = Math.max(0, Math.min(1, jitter));

    this._cells = Array.from({ length: 9 }, () => ({ id: 0, dist: 0 }));
    this._resultNeighbors = Array.from({ length: 8 }, () => ({
      cellId: 0, distance1: 0, distance2: 0, edgeFactor: 0,
    }));
  }
  
  /** Get cell information at world coordinates */
  sample(x: number, z: number): CellInfo {
    const cellX = x * this.invSize;
    const cellZ = z * this.invSize;
    const cellXi = cellX | 0;
    const cellZi = cellZ | 0;
    
    let minDist1 = Infinity, minDist2 = Infinity, closestId = 0;
    
    // Check 3x3 neighborhood
    for (let dx = -1; dx <= 1; dx++) {
      const nx = cellXi + dx;
      for (let dz = -1; dz <= 1; dz++) {
        const nz = cellZi + dz;
        const h1 = hash2D(this.seed, nx, nz);
        const h2 = hash2D(this.seed + 1, nx, nz);
        const px = nx + 0.5 + (hashToFloat(h1) - 0.5) * this.jitter;
        const pz = nz + 0.5 + (hashToFloat(h2) - 0.5) * this.jitter;
        const distSq = (cellX - px) ** 2 + (cellZ - pz) ** 2;
        
        if (distSq < minDist1) {
          minDist2 = minDist1;
          minDist1 = distSq;
          closestId = h1;
        } else if (distSq < minDist2) {
          minDist2 = distSq;
        }
      }
    }
    
    const d1 = Math.sqrt(minDist1), d2 = Math.sqrt(minDist2);
    return {
      cellId: closestId,
      distance1: d1 * this.cellSize,
      distance2: d2 * this.cellSize,
      edgeFactor: 1 - Math.min(1, (d2 - d1) / 0.5),
    };
  }
  
  /** Get neighboring cells for blending (reuses pre-allocated arrays) */
  sampleWithNeighbors(x: number, z: number): { primary: CellInfo; neighbors: CellInfo[]; neighborCount: number } {
    const cellX = x * this.invSize;
    const cellZ = z * this.invSize;
    const cellXi = cellX | 0;
    const cellZi = cellZ | 0;

    // Fill pre-allocated cells array
    const cells = this._cells;
    let idx = 0;
    for (let dx = -1; dx <= 1; dx++) {
      const nx = cellXi + dx;
      for (let dz = -1; dz <= 1; dz++) {
        const nz = cellZi + dz;
        const h1 = hash2D(this.seed, nx, nz);
        const h2 = hash2D(this.seed + 1, nx, nz);
        const px = nx + 0.5 + (hashToFloat(h1) - 0.5) * this.jitter;
        const pz = nz + 0.5 + (hashToFloat(h2) - 0.5) * this.jitter;
        const c = cells[idx++];
        c.id = h1;
        c.dist = Math.sqrt((cellX - px) ** 2 + (cellZ - pz) ** 2);
      }
    }

    // In-place insertion sort (fast for n=9)
    for (let i = 1; i < 9; i++) {
      const tmp = cells[i];
      const tmpDist = tmp.dist;
      let j = i - 1;
      while (j >= 0 && cells[j].dist > tmpDist) {
        cells[j + 1] = cells[j];
        j--;
      }
      cells[j + 1] = tmp;
    }

    const d1 = cells[0].dist, d2 = cells[1].dist;
    const primary: CellInfo = {
      cellId: cells[0].id,
      distance1: d1 * this.cellSize,
      distance2: d2 * this.cellSize,
      edgeFactor: 1 - Math.min(1, (d2 - d1) / 0.5),
    };

    // Fill pre-allocated neighbors array
    const neighbors = this._resultNeighbors;
    const threshold = d1 * 1.5;
    let neighborCount = 0;

    for (let i = 1; i < 9 && cells[i].dist < threshold; i++) {
      const d = cells[i].dist;
      const d2n = i + 1 < 9 ? cells[i + 1].dist : d * 2;
      const n = neighbors[neighborCount++];
      n.cellId = cells[i].id;
      n.distance1 = d * this.cellSize;
      n.distance2 = d2n * this.cellSize;
      n.edgeFactor = 1 - Math.min(1, (d2n - d) / 0.5);
    }

    return { primary, neighbors, neighborCount };
  }
}

