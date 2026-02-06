/**
 * Road Pass - Global road network generation.
 *
 * Builds a sparse deterministic road graph from hub nodes, then connects
 * edges using smooth curved paths. Road elevation is grade-limited and
 * mostly independent from local terrain so steep relief becomes tunnels
 * while water crossings become bridges.
 */

import type { GenerationContext, GeneratorPass } from './GeneratorPass';

const ROAD_BLOCK_ID = 5;
const ROAD_STRIPE_BLOCK_ID = 58;
const ROAD_WALL_BLOCK_ID = 11;
const TUNNEL_HEIGHT = 6;
const ROAD_CLEARANCE = TUNNEL_HEIGHT - 1;
const FLUID_SCAN_HEIGHT = 24;
const NODE_MARGIN = 24;
const MIN_STRAIGHT_FOR_SLOPE = 4;
const SLOPE_CURVE_GUARD = 2;
const ELEVATION_STEP_SPACING = 3;
const STRIPE_PERIOD = 3;
const BRIDGE_SUPPORT_SPACING = 9;
const BRIDGE_SUPPORT_HALF_SIZE = 1;
const TURN_ARC_RADIUS = 14;
const FORK_TURN_ARC_RADIUS = 10;
const TURN_ARC_MIN_RADIUS = 2;
const CHAIN_HARD_BACKTRACK_COS = 0.05;
const FORK_HARD_BACKTRACK_COS = 0.15;
const SIDE_DX = new Int8Array([1, -1, 0, 0]);
const SIDE_DZ = new Int8Array([0, 0, 1, -1]);
const ROAD_Y_UNSET = -32768;
const ROAD_INTERSECTION_VERTICAL_GAP = TUNNEL_HEIGHT;
const ROAD_JUNCTION_Y_TOLERANCE = 1;
const NODE_FILLET_TRIGGER_COS = 0.7;
const NODE_FILLET_TRIM_RATIO = 0.16;
const NODE_FILLET_MIN_RADIUS = 2;
const NODE_FILLET_MAX_RADIUS = 10;

const HASH_A = 374761393;
const HASH_B = 668265263;
const HASH_C = 1274126177;
const HASH_MAX = 0x7fffffff;

function hash3(seed: number, a: number, b: number, salt: number): number {
  let h = (seed + a * HASH_A + b * HASH_B + salt * HASH_C) | 0;
  h = ((h ^ (h >>> 13)) * HASH_C) | 0;
  return h;
}

function rand01(h: number): number {
  return (h & HASH_MAX) / HASH_MAX;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function smoothstep01(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

interface RoadNode {
  x: number;
  z: number;
  y: number;
  biome: RoadBiomeInfluence;
}

interface RoadBiomeInfluence {
  density: number;
  throughCost: number;
  fork: number;
  tunnel: number;
  curve: number;
}

interface EdgeTunnelProfile {
  startT: number;
  endT: number;
  depth: number;
}

interface RoadEdge {
  a: number;
  b: number;
  seed: number;
  curveBias: number;
  isFork: boolean;
  tunnel?: EdgeTunnelProfile;
}

interface RoadSettings {
  enabled: boolean;
  density: number;
  width: number;
  halfWidth: number;
  forkChance: number;
  tunnelChance: number;
  tunnelDepth: number;
  tunnelSpan: number;
  undergroundForkChance: number;
  erosion: {
    enabled: boolean;
    deckChance: number;
    wallChance: number;
    patchScale: number;
    patchThreshold: number;
  };
}

interface ColumnData {
  sizeZ: number;
  surface: Int16Array;
  liquidFloor: Int16Array;
}

interface StripePlacement {
  x: number;
  y: number;
  z: number;
}

interface RoadPlacementState {
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  stride: number;
  roadVoxels: Set<number>;
  centerlineVoxels: Set<number>;
  bridgeCenterline: Map<number, 0 | 1>;
  supportAnchors: Set<number>;
  roadColumns: Map<number, number[]>;
  wallVoxels: Set<number>;
  roofCandidates: Set<number>;
  wallCandidates: Set<number>;
}

interface NodeFillet {
  nodeIndex: number;
  neighborA: number;
  neighborB: number;
  radius: number;
}

export class RoadPass implements GeneratorPass {
  readonly name = 'road';

  execute(ctx: GenerationContext): void {
    const { x: sizeX, y: sizeY, z: sizeZ } = ctx.config.worldSize;
    if (sizeX < 32 || sizeZ < 32 || sizeY < 8) return;

    const settings = this.resolveSettings(ctx);
    if (!settings.enabled) return;

    const seed = (ctx.config.seed ^ 0x6a09e667) | 0;
    const columns = this.buildColumnData(ctx);
    const biomeCache = new Map<number, RoadBiomeInfluence>();
    const nodes = this.buildNodes(ctx, columns, seed, settings, biomeCache);
    if (nodes.length < 2) return;

    const edges = this.buildRoadGraph(ctx, columns, nodes, seed, settings, biomeCache);
    const filletPlan = this.planNodeFillets(nodes, edges);
    const stripes: StripePlacement[] = [];
    const centerlineY = new Int16Array(sizeX * sizeZ);
    centerlineY.fill(ROAD_Y_UNSET);
    const state: RoadPlacementState = {
      sizeX,
      sizeY,
      sizeZ,
      stride: sizeX * sizeZ,
      roadVoxels: new Set<number>(),
      centerlineVoxels: new Set<number>(),
      bridgeCenterline: new Map<number, 0 | 1>(),
      supportAnchors: new Set<number>(),
      roadColumns: new Map<number, number[]>(),
      wallVoxels: new Set<number>(),
      roofCandidates: new Set<number>(),
      wallCandidates: new Set<number>(),
    };

    let stripeOffset = 0;
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      stripeOffset += this.drawCurvedEdge(
        ctx,
        columns,
        nodes[edge.a],
        nodes[edge.b],
        edge,
        filletPlan.edgeStartTrim[i],
        filletPlan.edgeEndTrim[i],
        stripes,
        centerlineY,
        stripeOffset,
        state,
        settings
      );
    }

    for (let i = 0; i < filletPlan.fillets.length; i++) {
      const fillet = filletPlan.fillets[i];
      stripeOffset += this.drawNodeFillet(
        ctx,
        columns,
        nodes[fillet.nodeIndex],
        nodes[fillet.neighborA],
        nodes[fillet.neighborB],
        fillet.radius,
        stripes,
        centerlineY,
        stripeOffset,
        state,
        settings
      );
    }

    this.pruneDetachedRoadVoxels(ctx, state);
    this.commitTunnelWalls(ctx, columns, state);
    this.commitRoadDeck(ctx, columns, state, stripes, settings);
    this.applyErosion(ctx, state, seed, settings);
  }

  private pruneDetachedRoadVoxels(ctx: GenerationContext, state: RoadPlacementState): void {
    if (state.roadVoxels.size === 0 || state.centerlineVoxels.size === 0) return;

    const combined = new Set<number>(state.roadVoxels);
    state.centerlineVoxels.forEach((key) => {
      combined.add(key);
    });

    const reachable = new Set<number>();
    const stack: number[] = [];
    state.centerlineVoxels.forEach((key) => {
      if (!combined.has(key) || reachable.has(key)) return;
      reachable.add(key);
      stack.push(key);
    });

    while (stack.length > 0) {
      const key = stack.pop()!;
      const y = (key / state.stride) | 0;
      const rem = key - y * state.stride;
      const z = (rem / state.sizeX) | 0;
      const x = rem - z * state.sizeX;

      for (let d = 0; d < 4; d++) {
        const nx = x + SIDE_DX[d];
        const nz = z + SIDE_DZ[d];
        if (nx < 0 || nx >= state.sizeX || nz < 0 || nz >= state.sizeZ) continue;

        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= state.sizeY) continue;

          const nKey = this.toVoxelKey(state, nx, ny, nz);
          if (!combined.has(nKey) || reachable.has(nKey)) continue;
          reachable.add(nKey);
          stack.push(nKey);
        }
      }
    }

    const orphaned: number[] = [];
    state.roadVoxels.forEach((key) => {
      if (!reachable.has(key)) orphaned.push(key);
    });

    for (let i = 0; i < orphaned.length; i++) {
      const key = orphaned[i];
      const y = (key / state.stride) | 0;
      const rem = key - y * state.stride;
      const z = (rem / state.sizeX) | 0;
      const x = rem - z * state.sizeX;
      if (ctx.hasBlock(x, y, z)) ctx.removeBlock(x, y, z);
      this.removeRoadVoxel(state, x, y, z);
    }
  }

  private resolveSettings(ctx: GenerationContext): RoadSettings {
    const roads = ctx.config.roads;

    let width = clamp(Math.round(roads.width), 3, 13) | 0;
    if ((width & 1) === 0) width += 1;

    const density = clamp(roads.density, 0.45, 2.5);
    const forkChance = clamp(roads.forkChance, 0, 0.95);
    const tunnelChance = clamp(roads.tunnelChance, 0, 1);
    const tunnelSpan = clamp(roads.tunnelSpan, 0.2, 0.9);
    const undergroundForkChance = clamp(roads.undergroundForkChance, 0, 1);
    const maxDepth = Math.max(4, ctx.config.worldSize.y - 12);
    const tunnelDepth = clamp(Math.round(roads.tunnelDepth), 4, maxDepth) | 0;
    const erosion = roads.erosion;

    return {
      enabled: roads.enabled,
      density,
      width,
      halfWidth: (width - 1) >> 1,
      forkChance,
      tunnelChance,
      tunnelDepth,
      tunnelSpan,
      undergroundForkChance,
      erosion: {
        enabled: erosion.enabled,
        deckChance: clamp(erosion.deckChance, 0, 1),
        wallChance: clamp(erosion.wallChance, 0, 1),
        patchScale: Math.max(6, Math.round(erosion.patchScale)),
        patchThreshold: clamp(erosion.patchThreshold, 0, 0.98),
      },
    };
  }

  private buildColumnData(ctx: GenerationContext): ColumnData {
    const { x: sizeX, y: sizeY, z: sizeZ } = ctx.config.worldSize;
    const maxY = sizeY - 2;
    const surface = new Int16Array(sizeX * sizeZ);
    const liquidFloor = new Int16Array(sizeX * sizeZ);

    for (let x = 0; x < sizeX; x++) {
      for (let z = 0; z < sizeZ; z++) {
        const idx = x * sizeZ + z;
        const s = clamp(ctx.terrain.getBaseHeight(x, z) | 0, 0, maxY);
        surface[idx] = s;

        let top = s;
        const scanTop = Math.min(maxY, s + FLUID_SCAN_HEIGHT);
        for (let y = s + 1; y <= scanTop; y++) {
          if (!ctx.hasBlock(x, y, z)) break;
          top = y;
        }

        liquidFloor[idx] = top > s ? top + 1 : 1;
      }
    }

    return { sizeZ, surface, liquidFloor };
  }

  private sampleRoadBiome(
    ctx: GenerationContext,
    cache: Map<number, RoadBiomeInfluence>,
    x: number,
    z: number
  ): RoadBiomeInfluence {
    const key = x * ctx.config.worldSize.z + z;
    const cached = cache.get(key);
    if (cached) return cached;

    const roads = ctx.getBiomeAt(x, z)?.roads;
    const sampled: RoadBiomeInfluence = {
      density: clamp(roads?.densityMult ?? 1, 0.35, 2.5),
      throughCost: clamp(roads?.throughCostMult ?? 1, 0.35, 3.5),
      fork: clamp(roads?.forkChanceMult ?? 1, 0.2, 2.5),
      tunnel: clamp(roads?.tunnelChanceMult ?? 1, 0.25, 2.5),
      curve: clamp(roads?.curveBiasMult ?? 1, 0.4, 2.2),
    };
    cache.set(key, sampled);
    return sampled;
  }

  private estimateEdgeMetric(
    ctx: GenerationContext,
    columns: ColumnData,
    biomeCache: Map<number, RoadBiomeInfluence>,
    a: RoadNode,
    b: RoadNode
  ): number {
    const { x: sizeX, z: sizeZ } = ctx.config.worldSize;
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 1) return 0;

    const samples = Math.max(6, Math.ceil(dist / 12));
    let throughCostSum = 0;
    let slopeSum = 0;
    let waterSum = 0;

    let prevIdx = clamp(Math.round(a.x), 0, sizeX - 1) * columns.sizeZ + clamp(Math.round(a.z), 0, sizeZ - 1);

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const x = clamp(Math.round(a.x + dx * t), 0, sizeX - 1);
      const z = clamp(Math.round(a.z + dz * t), 0, sizeZ - 1);
      const idx = x * columns.sizeZ + z;
      const biome = this.sampleRoadBiome(ctx, biomeCache, x, z);
      throughCostSum += biome.throughCost;

      if (i > 0) {
        slopeSum += Math.abs(columns.surface[idx] - columns.surface[prevIdx]);
        const waterDepth = columns.liquidFloor[idx] - columns.surface[idx] - 1;
        if (waterDepth > 0) waterSum += waterDepth;
      }

      prevIdx = idx;
    }

    const avgThroughCost = throughCostSum / (samples + 1);
    const avgSlope = slopeSum / Math.max(1, samples);
    const avgWater = waterSum / Math.max(1, samples);

    return dist * avgThroughCost * (1 + avgSlope * 0.04 + avgWater * 0.08);
  }

  private buildNodes(
    ctx: GenerationContext,
    columns: ColumnData,
    seed: number,
    settings: RoadSettings,
    biomeCache: Map<number, RoadBiomeInfluence>
  ): RoadNode[] {
    const { x: sizeX, y: sizeY, z: sizeZ } = ctx.config.worldSize;
    const maxY = sizeY - 2;
    const minDim = Math.min(sizeX, sizeZ);

    const baseTarget = clamp(Math.round(minDim / 360) + 2, 2, 4);
    const targetCount = clamp(Math.round(baseTarget * settings.density), 2, 10) | 0;

    const spacingScale = 1 / Math.sqrt(settings.density);
    const minDist = Math.max(36, Math.floor(minDim * 0.22 * spacingScale));
    const baseRoadY = clamp((ctx.config.terrain.baseHeight | 0) - 2, 2, maxY);
    const preferredSurfaceMax = ctx.config.terrain.baseHeight + ctx.config.terrain.heightVariation * 0.75;
    const nodes: RoadNode[] = [];

    const candidateY = (x: number, z: number, i: number): number => {
      const idx = x * columns.sizeZ + z;
      const jitter = (rand01(hash3(seed, i, idx, 19)) * 2 - 1) * 3;
      const corridor = baseRoadY + jitter;
      return clamp(Math.max(columns.liquidFloor[idx], Math.round(corridor)), 1, maxY);
    };

    const farEnough = (x: number, z: number, spacing: number): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        const dx = nodes[i].x - x;
        const dz = nodes[i].z - z;
        const nodeSpacing = Math.max(24, Math.floor(minDist / Math.sqrt(nodes[i].biome.density)));
        const pairSpacing = ((spacing + nodeSpacing) * 0.5) | 0;
        if (dx * dx + dz * dz < pairSpacing * pairSpacing) return false;
      }
      return true;
    };

    const attempts = targetCount * 32;
    const spanX = Math.max(1, sizeX - NODE_MARGIN * 2);
    const spanZ = Math.max(1, sizeZ - NODE_MARGIN * 2);

    for (let i = 0; i < attempts && nodes.length < targetCount; i++) {
      const x = NODE_MARGIN + ((rand01(hash3(seed, i, 7, 1)) * spanX) | 0);
      const z = NODE_MARGIN + ((rand01(hash3(seed, i, 11, 2)) * spanZ) | 0);
      const biome = this.sampleRoadBiome(ctx, biomeCache, x, z);
      const spacing = Math.max(24, Math.floor(minDist / Math.sqrt(biome.density)));
      if (!farEnough(x, z, spacing)) continue;

      const idx = x * columns.sizeZ + z;
      const s = columns.surface[idx];
      if (s > preferredSurfaceMax && rand01(hash3(seed, i, 13, 3)) > 0.18) continue;
      if (biome.density < 1 && rand01(hash3(seed, i, 17, 5)) > biome.density) continue;

      nodes.push({ x, z, y: candidateY(x, z, i), biome });
    }

    if (nodes.length < 2) {
      const fallback = [
        { x: Math.floor(sizeX * 0.2), z: Math.floor(sizeZ * 0.3) },
        { x: Math.floor(sizeX * 0.8), z: Math.floor(sizeZ * 0.7) },
        { x: Math.floor(sizeX * 0.3), z: Math.floor(sizeZ * 0.8) },
        { x: Math.floor(sizeX * 0.7), z: Math.floor(sizeZ * 0.2) },
      ];
      for (let i = 0; i < fallback.length && nodes.length < 2; i++) {
        const x = clamp(fallback[i].x, 0, sizeX - 1);
        const z = clamp(fallback[i].z, 0, sizeZ - 1);
        const biome = this.sampleRoadBiome(ctx, biomeCache, x, z);
        const spacing = Math.max(24, Math.floor(minDist / Math.sqrt(biome.density)));
        if (!farEnough(x, z, spacing) && nodes.length > 0) continue;
        nodes.push({ x, z, y: candidateY(x, z, attempts + i), biome });
      }
    }

    return nodes;
  }

  private buildRoadGraph(
    ctx: GenerationContext,
    columns: ColumnData,
    nodes: RoadNode[],
    seed: number,
    settings: RoadSettings,
    biomeCache: Map<number, RoadBiomeInfluence>
  ): RoadEdge[] {
    const n = nodes.length;
    const edges: RoadEdge[] = [];
    if (n < 2) return edges;

    const key = (a: number, b: number) => (a < b ? (a << 16) | b : (b << 16) | a);
    const distSq = (a: number, b: number) => {
      const dx = nodes[a].x - nodes[b].x;
      const dz = nodes[a].z - nodes[b].z;
      return dx * dx + dz * dz;
    };
    const metricCache = new Map<number, number>();
    const metric = (a: number, b: number) => {
      const k = key(a, b);
      const cached = metricCache.get(k);
      if (cached !== undefined) return cached;
      const value = this.estimateEdgeMetric(ctx, columns, biomeCache, nodes[a], nodes[b]);
      metricCache.set(k, value);
      return value;
    };

    const linked = new Set<number>();
    const order: number[] = [];
    const used = new Uint8Array(n);
    const turnCos = (ax: number, az: number, bx: number, bz: number): number => {
      const lenA = Math.hypot(ax, az);
      const lenB = Math.hypot(bx, bz);
      if (lenA <= 1e-6 || lenB <= 1e-6) return 1;
      return clamp((ax * bx + az * bz) / (lenA * lenB), -1, 1);
    };

    const addEdge = (a: number, b: number, salt: number, forceTunnel: boolean, isFork: boolean): boolean => {
      if (a === b) return false;
      const k = key(a, b);
      if (linked.has(k)) return false;
      linked.add(k);
      const edgeSeed = hash3(seed, a, b, salt);
      const d = Math.sqrt(distSq(a, b));
      const tunnelBias = (nodes[a].biome.tunnel + nodes[b].biome.tunnel) * 0.5;
      const curveBias = (nodes[a].biome.curve + nodes[b].biome.curve) * 0.5;
      const tunnel = this.createTunnelProfile(edgeSeed, d, settings, forceTunnel, tunnelBias);
      edges.push({ a, b, seed: edgeSeed, curveBias, isFork, tunnel });
      return true;
    };

    const connectionTurnPenalty = (from: number, to: number): number => {
      const tx = nodes[to].x - nodes[from].x;
      const tz = nodes[to].z - nodes[from].z;
      let penalty = 1;
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        let other = -1;
        if (edge.a === from) other = edge.b;
        else if (edge.b === from) other = edge.a;
        if (other < 0) continue;

        const ox = nodes[other].x - nodes[from].x;
        const oz = nodes[other].z - nodes[from].z;
        const cos = turnCos(tx, tz, ox, oz);
        if (cos < -0.55) penalty *= 4.5;
        else if (cos < -0.3) penalty *= 2.4;
        else if (cos < 0.05) penalty *= 1.35;
      }
      return penalty;
    };
    const connectionShapePenalty = (a: number, b: number): number =>
      connectionTurnPenalty(a, b) * connectionTurnPenalty(b, a);

    const isHardBacktrackConnection = (from: number, to: number, thresholdCos: number): boolean => {
      const tx = nodes[to].x - nodes[from].x;
      const tz = nodes[to].z - nodes[from].z;
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        let other = -1;
        if (edge.a === from) other = edge.b;
        else if (edge.b === from) other = edge.a;
        if (other < 0) continue;

        const ox = nodes[other].x - nodes[from].x;
        const oz = nodes[other].z - nodes[from].z;
        if (turnCos(tx, tz, ox, oz) < thresholdCos) return true;
      }
      return false;
    };
    const isBranchBacktrack = (from: number, to: number): boolean =>
      isHardBacktrackConnection(from, to, FORK_HARD_BACKTRACK_COS) ||
      isHardBacktrackConnection(to, from, FORK_HARD_BACKTRACK_COS);

    const pickBranchTarget = (
      from: number,
      excludeA: number,
      excludeB: number,
      minDistSq: number | undefined
    ): number => {
      let best = -1;
      let bestCost = Number.POSITIVE_INFINITY;
      let bestFallback = -1;
      let bestFallbackCost = Number.POSITIVE_INFINITY;

      for (let i = 0; i < n; i++) {
        if (i === from || i === excludeA || i === excludeB) continue;
        if (linked.has(key(from, i))) continue;
        if (minDistSq !== undefined && distSq(from, i) < minDistSq) continue;

        const cost = metric(from, i) * connectionShapePenalty(from, i);
        if (isBranchBacktrack(from, i)) {
          if (cost < bestFallbackCost) {
            bestFallbackCost = cost;
            bestFallback = i;
          }
          continue;
        }
        if (cost < bestCost) {
          bestCost = cost;
          best = i;
        }
      }

      return best >= 0 ? best : bestFallback;
    };

    // Build a low-degree backbone chain to avoid grid-like crossings.
    let start = 0;
    for (let i = 1; i < n; i++) {
      if (nodes[i].x < nodes[start].x) start = i;
    }
    used[start] = 1;
    order.push(start);

    while (order.length < n) {
      const current = order[order.length - 1];
      const prev = order.length > 1 ? order[order.length - 2] : -1;
      let best = -1;
      let bestScore = Number.POSITIVE_INFINITY;
      let bestHardBacktrack = -1;
      let bestHardBacktrackScore = Number.POSITIVE_INFINITY;

      for (let i = 0; i < n; i++) {
        if (used[i]) continue;
        let score = metric(current, i);
        if (prev >= 0) {
          const ax = nodes[current].x - nodes[prev].x;
          const az = nodes[current].z - nodes[prev].z;
          const bx = nodes[i].x - nodes[current].x;
          const bz = nodes[i].z - nodes[current].z;
          const cos = turnCos(ax, az, bx, bz);
          const turnPenalty = 1 - cos;
          score *= 1 + turnPenalty * 3.2;
          if (cos < 0.45) score *= 2.4;
          if (cos < 0.15) score *= 2.2;
          if (cos < CHAIN_HARD_BACKTRACK_COS) {
            if (score < bestHardBacktrackScore) {
              bestHardBacktrackScore = score;
              bestHardBacktrack = i;
            }
            continue;
          }
        }
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }

      if (best < 0) best = bestHardBacktrack;
      if (best < 0) break;
      used[best] = 1;
      order.push(best);
    }

    for (let i = 0; i + 1 < order.length; i++) {
      addEdge(order[i], order[i + 1], 41, false, false);
    }

    // Occasional surface branch for non-linear topology.
    const avgForkBias = nodes.reduce((sum, node) => sum + node.biome.fork, 0) / n;
    const forkChance = clamp(settings.forkChance * avgForkBias, 0, 0.98);
    if (n >= 4 && rand01(hash3(seed, n, order.length, 57)) < forkChance) {
      const forkAt = 1 + ((rand01(hash3(seed, n, 11, 59)) * (order.length - 2)) | 0);
      const from = order[forkAt];
      const best = pickBranchTarget(from, order[forkAt - 1], order[forkAt + 1], undefined);
      if (best >= 0) addEdge(from, best, 61, false, true);
    }

    // Rare forced-underground branch.
    const avgTunnelBias = nodes.reduce((sum, node) => sum + node.biome.tunnel, 0) / n;
    const undergroundForkChance = clamp(settings.undergroundForkChance * avgForkBias * avgTunnelBias, 0, 1);
    if (n >= 3 && rand01(hash3(seed, n, order.length, 67)) < undergroundForkChance) {
      const fromIdx = order.length > 2
        ? 1 + ((rand01(hash3(seed, n, 17, 69)) * (order.length - 2)) | 0)
        : 0;
      const from = order[fromIdx];

      const minBranchDistSq = 72 * 72;
      let best = pickBranchTarget(from, -1, -1, minBranchDistSq);
      if (best < 0) best = pickBranchTarget(from, -1, -1, undefined);
      if (best >= 0) addEdge(from, best, 73, true, true);
    }

    // Extend terminal roads to world bounds so finite worlds still produce
    // plausible through-roads for future infinite/chunked generation.
    if (edges.length > 0) {
      const sizeX = ctx.config.worldSize.x;
      const sizeZ = ctx.config.worldSize.z;
      const maxY = ctx.config.worldSize.y - 2;
      const cx = (sizeX - 1) * 0.5;
      const cz = (sizeZ - 1) * 0.5;

      const degree = new Int16Array(nodes.length);
      const adjacency = Array.from({ length: n }, () => [] as number[]);
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        degree[edge.a]++;
        degree[edge.b]++;
        if (edge.a < n && edge.b < n) {
          adjacency[edge.a].push(edge.b);
          adjacency[edge.b].push(edge.a);
        }
      }

      const terminals: number[] = [];
      for (let i = 0; i < n; i++) {
        if (degree[i] === 1) terminals.push(i);
      }

      const outwardScore = (idx: number) => {
        const node = nodes[idx];
        const nx = Math.abs(node.x - cx) / Math.max(1, cx);
        const nz = Math.abs(node.z - cz) / Math.max(1, cz);
        return nx > nz ? nx : nz;
      };
      terminals.sort((a, b) => outwardScore(b) - outwardScore(a));

      const forcedSide = new Map<number, 0 | 1 | 2 | 3>();
      if (order.length >= 2) {
        const a = order[0];
        const b = order[order.length - 1];
        if (a !== b) {
          const na = nodes[a];
          const nb = nodes[b];
          if (Math.abs(nb.x - na.x) >= Math.abs(nb.z - na.z)) {
            if (na.x <= nb.x) {
              forcedSide.set(a, 0);
              forcedSide.set(b, 1);
            } else {
              forcedSide.set(a, 1);
              forcedSide.set(b, 0);
            }
          } else if (na.z <= nb.z) {
            forcedSide.set(a, 2);
            forcedSide.set(b, 3);
          } else {
            forcedSide.set(a, 3);
            forcedSide.set(b, 2);
          }
        }
      }

      const usedBoundaryCols = new Set<number>();
      const claimBoundary = (tx: number, tz: number) => {
        let x = tx;
        let z = tz;
        let key = x * sizeZ + z;
        if (!usedBoundaryCols.has(key)) return { x, z, key };

        if (x === 0 || x === sizeX - 1) {
          for (let radius = 1; radius < sizeZ; radius++) {
            const low = z - radius;
            if (low >= 0) {
              key = x * sizeZ + low;
              if (!usedBoundaryCols.has(key)) return { x, z: low, key };
            }
            const high = z + radius;
            if (high < sizeZ) {
              key = x * sizeZ + high;
              if (!usedBoundaryCols.has(key)) return { x, z: high, key };
            }
          }
        } else {
          for (let radius = 1; radius < sizeX; radius++) {
            const low = x - radius;
            if (low >= 0) {
              key = low * sizeZ + z;
              if (!usedBoundaryCols.has(key)) return { x: low, z, key };
            }
            const high = x + radius;
            if (high < sizeX) {
              key = high * sizeZ + z;
              if (!usedBoundaryCols.has(key)) return { x: high, z, key };
            }
          }
        }

        return { x, z, key };
      };

      const sources: number[] = [];
      const seenSources = new Set<number>();
      const pushSource = (idx: number) => {
        if (idx < 0 || idx >= n) return;
        if (seenSources.has(idx)) return;
        seenSources.add(idx);
        sources.push(idx);
      };

      if (order.length >= 2) {
        pushSource(order[0]);
        pushSource(order[order.length - 1]);
      }
      for (let i = 0; i < terminals.length; i++) {
        pushSource(terminals[i]);
      }

      for (let i = 0; i < sources.length; i++) {
        const from = sources[i];
        const node = nodes[from];

        let vx = node.x - cx;
        let vz = node.z - cz;
        if (adjacency[from].length > 0) {
          const neighbor = nodes[adjacency[from][0]];
          vx = node.x - neighbor.x;
          vz = node.z - neighbor.z;
        }

        let tx: number;
        let tz: number;
        const side = forcedSide.get(from);
        if (side === 0 || side === 1) {
          tx = side === 0 ? 0 : sizeX - 1;
          const slope = Math.abs(vx) > 0.001 ? vz / vx : 0;
          tz = clamp(Math.round(node.z + (tx - node.x) * slope), 0, sizeZ - 1);
        } else if (side === 2 || side === 3) {
          tz = side === 2 ? 0 : sizeZ - 1;
          const slope = Math.abs(vz) > 0.001 ? vx / vz : 0;
          tx = clamp(Math.round(node.x + (tz - node.z) * slope), 0, sizeX - 1);
        } else if (Math.abs(vx) >= Math.abs(vz)) {
          const dirX = vx !== 0 ? vx : node.x - cx;
          tx = dirX >= 0 ? sizeX - 1 : 0;
          const slope = Math.abs(vx) > 0.001 ? vz / vx : 0;
          tz = clamp(Math.round(node.z + (tx - node.x) * slope), 0, sizeZ - 1);
        } else {
          const dirZ = vz !== 0 ? vz : node.z - cz;
          tz = dirZ >= 0 ? sizeZ - 1 : 0;
          const slope = Math.abs(vz) > 0.001 ? vx / vz : 0;
          tx = clamp(Math.round(node.x + (tz - node.z) * slope), 0, sizeX - 1);
        }

        // If forced-side projection backtracks against the current terminal
        // direction, recompute from pure outward heading.
        const ex = tx - node.x;
        const ez = tz - node.z;
        if (turnCos(vx, vz, ex, ez) < 0.25) {
          if (Math.abs(vx) >= Math.abs(vz)) {
            const dirX = vx !== 0 ? vx : node.x - cx;
            tx = dirX >= 0 ? sizeX - 1 : 0;
            const slope = Math.abs(vx) > 0.001 ? vz / vx : 0;
            tz = clamp(Math.round(node.z + (tx - node.x) * slope), 0, sizeZ - 1);
          } else {
            const dirZ = vz !== 0 ? vz : node.z - cz;
            tz = dirZ >= 0 ? sizeZ - 1 : 0;
            const slope = Math.abs(vz) > 0.001 ? vx / vz : 0;
            tx = clamp(Math.round(node.x + (tz - node.z) * slope), 0, sizeX - 1);
          }
        }

        const claimed = claimBoundary(tx, tz);
        tx = claimed.x;
        tz = claimed.z;
        if (node.x === tx && node.z === tz) continue;

        const colIdx = tx * columns.sizeZ + tz;
        const y = clamp(Math.max(columns.liquidFloor[colIdx], node.y), 1, maxY);
        const biome = this.sampleRoadBiome(ctx, biomeCache, tx, tz);
        const to = nodes.length;
        nodes.push({ x: tx, z: tz, y, biome });
        if (!addEdge(from, to, 83 + i * 11, false, false)) {
          nodes.pop();
          continue;
        }
        usedBoundaryCols.add(claimed.key);
      }
    }

    return edges;
  }

  private createTunnelProfile(
    edgeSeed: number,
    dist: number,
    settings: RoadSettings,
    forceTunnel: boolean,
    tunnelBias: number
  ): EdgeTunnelProfile | undefined {
    const bias = clamp(tunnelBias, 0.35, 2.5);
    const longEnough = dist >= 42;
    if (!forceTunnel) {
      if (!longEnough) return undefined;
      const tunnelChance = clamp(settings.tunnelChance * bias, 0, 1);
      if (rand01(hash3(edgeSeed, 3, 5, 79)) >= tunnelChance) return undefined;
    }

    const spanJitter = (rand01(hash3(edgeSeed, 7, 9, 83)) * 2 - 1) * 0.12;
    const spanBase = settings.tunnelSpan * clamp(0.85 + (bias - 1) * 0.45, 0.55, 1.45);
    const span = clamp(spanBase + spanJitter, 0.2, 0.92);
    const centerJitter = (rand01(hash3(edgeSeed, 11, 13, 89)) * 2 - 1) * 0.15;
    const center = clamp(0.5 + centerJitter, 0.2, 0.8);
    const half = span * 0.5;
    const startT = clamp(center - half, 0.04, 0.86);
    const endT = clamp(center + half, 0.14, 0.96);
    if (endT - startT < 0.12) return undefined;

    const depthBias = clamp(0.85 + (bias - 1) * 0.5, 0.6, 1.6);
    const depthMul = (0.75 + rand01(hash3(edgeSeed, 17, 19, 97)) * 0.7) * depthBias;
    const depth = Math.max(4, Math.round(settings.tunnelDepth * depthMul));
    return { startT, endT, depth };
  }

  private drawCurvedEdge(
    ctx: GenerationContext,
    columns: ColumnData,
    a: RoadNode,
    b: RoadNode,
    edge: RoadEdge,
    startTrim: number,
    endTrim: number,
    stripes: StripePlacement[],
    centerlineY: Int16Array,
    stripeOffset: number,
    state: RoadPlacementState,
    settings: RoadSettings
  ): number {
    const { x: sizeX, z: sizeZ } = ctx.config.worldSize;
    const rawDx = b.x - a.x;
    const rawDz = b.z - a.z;
    const rawDist = Math.hypot(rawDx, rawDz);
    if (rawDist < 8) return 0;

    const pathX: number[] = [];
    const pathZ: number[] = [];

    const start = this.trimmedPointToward(a, b, startTrim, sizeX, sizeZ);
    const end = this.trimmedPointToward(b, a, endTrim, sizeX, sizeZ);
    const startX = start.x;
    const startZ = start.z;
    const endX = end.x;
    const endZ = end.z;
    if (startX === endX && startZ === endZ) return 0;
    const dx = endX - startX;
    const dz = endZ - startZ;
    const dist = Math.hypot(dx, dz);
    if (dist < 4) return 0;
    pathX.push(startX);
    pathZ.push(startZ);

    if (edge.tunnel) {
      const preferX = rand01(hash3(edge.seed, startX, endZ, 75)) < 0.5;
      this.connectAxisOrdered(pathX, pathZ, endX, endZ, preferX);
    } else {
      const invDist = 1 / dist;
      const midX = (startX + endX) * 0.5;
      const midZ = (startZ + endZ) * 0.5;
      const perpX = -dz * invDist;
      const perpZ = dx * invDist;
      const curveBias = clamp(edge.curveBias, 0.45, 2.2);
      const curveLimit = Math.min(20, dist * (0.09 + curveBias * 0.03));
      const curveMag = (rand01(hash3(edge.seed, a.x, b.z, 71)) * 2 - 1) * curveLimit;
      const safeMargin = Math.max(settings.halfWidth + 2, NODE_MARGIN);
      const ctrlX = clamp(midX + perpX * curveMag, safeMargin, sizeX - 1 - safeMargin);
      const ctrlZ = clamp(midZ + perpZ * curveMag, safeMargin, sizeZ - 1 - safeMargin);

      const samples = Math.max(20, Math.ceil(dist * 1.5));
      for (let i = 1; i <= samples; i++) {
        const t = i / samples;
        const omt = 1 - t;
        const fx = omt * omt * startX + 2 * omt * t * ctrlX + t * t * endX;
        const fz = omt * omt * startZ + 2 * omt * t * ctrlZ + t * t * endZ;
        const tx = clamp(Math.round(fx), 0, sizeX - 1);
        const tz = clamp(Math.round(fz), 0, sizeZ - 1);
        this.connectCardinal(pathX, pathZ, tx, tz);
      }
    }
    const targetArcRadius = edge.isFork ? FORK_TURN_ARC_RADIUS : TURN_ARC_RADIUS;
    this.smoothRightAngleTurns(pathX, pathZ, targetArcRadius, TURN_ARC_MIN_RADIUS);

    return this.paintRoadPath(
      ctx,
      columns,
      pathX,
      pathZ,
      a.y,
      b.y,
      edge.tunnel,
      edge.isFork,
      false,
      stripes,
      centerlineY,
      stripeOffset,
      state,
      settings
    );
  }

  private drawNodeFillet(
    ctx: GenerationContext,
    columns: ColumnData,
    node: RoadNode,
    neighborA: RoadNode,
    neighborB: RoadNode,
    radius: number,
    stripes: StripePlacement[],
    centerlineY: Int16Array,
    stripeOffset: number,
    state: RoadPlacementState,
    settings: RoadSettings
  ): number {
    const { x: sizeX, z: sizeZ } = ctx.config.worldSize;
    const start = this.trimmedPointToward(node, neighborA, radius, sizeX, sizeZ);
    const end = this.trimmedPointToward(node, neighborB, radius, sizeX, sizeZ);
    if (start.x === end.x && start.z === end.z) return 0;

    const pathX: number[] = [start.x];
    const pathZ: number[] = [start.z];
    const samples = Math.max(10, radius * 3);
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const omt = 1 - t;
      const fx = omt * omt * start.x + 2 * omt * t * node.x + t * t * end.x;
      const fz = omt * omt * start.z + 2 * omt * t * node.z + t * t * end.z;
      const tx = clamp(Math.round(fx), 0, sizeX - 1);
      const tz = clamp(Math.round(fz), 0, sizeZ - 1);
      this.connectCardinal(pathX, pathZ, tx, tz);
    }
    this.smoothRightAngleTurns(pathX, pathZ, Math.max(radius, TURN_ARC_RADIUS), TURN_ARC_MIN_RADIUS);
    return this.paintRoadPath(
      ctx,
      columns,
      pathX,
      pathZ,
      node.y,
      node.y,
      undefined,
      true,
      true,
      stripes,
      centerlineY,
      stripeOffset,
      state,
      settings
    );
  }

  private trimmedPointToward(
    from: RoadNode,
    toward: RoadNode,
    trim: number,
    sizeX: number,
    sizeZ: number
  ): { x: number; z: number } {
    if (trim <= 0) {
      return {
        x: clamp(Math.round(from.x), 0, sizeX - 1),
        z: clamp(Math.round(from.z), 0, sizeZ - 1),
      };
    }

    const dx = toward.x - from.x;
    const dz = toward.z - from.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 1e-6) {
      return {
        x: clamp(Math.round(from.x), 0, sizeX - 1),
        z: clamp(Math.round(from.z), 0, sizeZ - 1),
      };
    }

    const t = clamp(trim / dist, 0, 0.45);
    return {
      x: clamp(Math.round(from.x + dx * t), 0, sizeX - 1),
      z: clamp(Math.round(from.z + dz * t), 0, sizeZ - 1),
    };
  }

  private connectAxisOrdered(
    pathX: number[],
    pathZ: number[],
    tx: number,
    tz: number,
    preferX: boolean
  ): void {
    let x = pathX[pathX.length - 1];
    let z = pathZ[pathZ.length - 1];

    const push = () => {
      const last = pathX.length - 1;
      if (pathX[last] === x && pathZ[last] === z) return;
      pathX.push(x);
      pathZ.push(z);
    };

    if (preferX) {
      while (x !== tx) {
        x += tx > x ? 1 : -1;
        push();
      }
      while (z !== tz) {
        z += tz > z ? 1 : -1;
        push();
      }
    } else {
      while (z !== tz) {
        z += tz > z ? 1 : -1;
        push();
      }
      while (x !== tx) {
        x += tx > x ? 1 : -1;
        push();
      }
    }
  }

  private connectCardinal(pathX: number[], pathZ: number[], tx: number, tz: number): void {
    let x = pathX[pathX.length - 1];
    let z = pathZ[pathZ.length - 1];

    while (x !== tx || z !== tz) {
      const dx = tx - x;
      const dz = tz - z;
      if (dx !== 0 && (dz === 0 || Math.abs(dx) > Math.abs(dz))) {
        x += dx > 0 ? 1 : -1;
      } else if (dz !== 0) {
        z += dz > 0 ? 1 : -1;
      } else {
        x += dx > 0 ? 1 : -1;
      }

      const last = pathX.length - 1;
      if (pathX[last] === x && pathZ[last] === z) continue;

      // Collapse A->B->A oscillation produced by rounded curved samples.
      if (last > 0 && pathX[last - 1] === x && pathZ[last - 1] === z) {
        pathX.pop();
        pathZ.pop();
        continue;
      }

      pathX.push(x);
      pathZ.push(z);
    }
  }

  private smoothRightAngleTurns(
    pathX: number[],
    pathZ: number[],
    targetRadius: number,
    minRadius: number
  ): void {
    const n = pathX.length;
    if (n < 5) return;

    type Replacement = { start: number; corner: number; end: number; samples: number };
    const reps: Replacement[] = [];
    let lastEnd = 0;

    const dirAt = (i: number) => {
      const dx = pathX[i + 1] - pathX[i];
      const dz = pathZ[i + 1] - pathZ[i];
      return { dx, dz };
    };

    for (let i = 1; i + 1 < n - 1; i++) {
      const inDir = { dx: pathX[i] - pathX[i - 1], dz: pathZ[i] - pathZ[i - 1] };
      const outDir = { dx: pathX[i + 1] - pathX[i], dz: pathZ[i + 1] - pathZ[i] };
      if (inDir.dx === outDir.dx && inDir.dz === outDir.dz) continue;
      if (inDir.dx !== 0 && outDir.dx !== 0) continue;
      if (inDir.dz !== 0 && outDir.dz !== 0) continue;

      let inLen = 1;
      for (let e = i - 2; e >= 0; e--) {
        const d = dirAt(e);
        if (d.dx !== inDir.dx || d.dz !== inDir.dz) break;
        inLen++;
      }

      let outLen = 1;
      for (let e = i + 1; e < n - 1; e++) {
        const d = dirAt(e);
        if (d.dx !== outDir.dx || d.dz !== outDir.dz) break;
        outLen++;
      }

      const radius = Math.min(targetRadius, inLen, outLen);
      if (radius < minRadius) continue;
      const start = i - radius;
      const end = i + radius;
      if (start <= lastEnd) continue;
      const samples = Math.max(8, radius * 2);
      reps.push({ start, corner: i, end, samples });
      lastEnd = end;
      i = end - 1;
    }

    if (reps.length === 0) return;

    const nextX: number[] = [pathX[0]];
    const nextZ: number[] = [pathZ[0]];
    let cursor = 0;

    for (let r = 0; r < reps.length; r++) {
      const rep = reps[r];
      for (let i = cursor + 1; i <= rep.start; i++) {
        this.connectCardinal(nextX, nextZ, pathX[i], pathZ[i]);
      }

      const sx = pathX[rep.start];
      const sz = pathZ[rep.start];
      const cx = pathX[rep.corner];
      const cz = pathZ[rep.corner];
      const ex = pathX[rep.end];
      const ez = pathZ[rep.end];

      for (let i = 1; i <= rep.samples; i++) {
        const t = i / rep.samples;
        const omt = 1 - t;
        const fx = omt * omt * sx + 2 * omt * t * cx + t * t * ex;
        const fz = omt * omt * sz + 2 * omt * t * cz + t * t * ez;
        this.connectCardinal(nextX, nextZ, Math.round(fx), Math.round(fz));
      }
      cursor = rep.end;
    }

    for (let i = cursor + 1; i < n; i++) {
      this.connectCardinal(nextX, nextZ, pathX[i], pathZ[i]);
    }

    pathX.length = 0;
    pathZ.length = 0;
    for (let i = 0; i < nextX.length; i++) {
      pathX.push(nextX[i]);
      pathZ.push(nextZ[i]);
    }
  }

  private paintRoadPath(
    ctx: GenerationContext,
    columns: ColumnData,
    pathX: number[],
    pathZ: number[],
    startY: number,
    endY: number,
    tunnel: EdgeTunnelProfile | undefined,
    isFork: boolean,
    allowWideMerge: boolean,
    stripes: StripePlacement[],
    centerlineY: Int16Array,
    stripeOffset: number,
    state: RoadPlacementState,
    settings: RoadSettings
  ): number {
    const maxY = ctx.config.worldSize.y - 2;
    const total = pathX.length - 1;
    if (total < 0) return 0;
    if (pathX.length === 1) {
      const y = clamp(Math.round(startY), 1, maxY);
      this.paintRoadCrossSection(ctx, columns, pathX[0], y, pathZ[0], true, state, settings);
      stripes.push({ x: pathX[0], y, z: pathZ[0] });
      return 1;
    }

    const segCount = pathX.length - 1;
    const segDir = new Int8Array(segCount);
    const backRun = new Int16Array(segCount);
    const forwardRun = new Int16Array(segCount);
    for (let s = 0; s < segCount; s++) {
      const dx = pathX[s + 1] - pathX[s];
      const dz = pathZ[s + 1] - pathZ[s];
      segDir[s] = dx > 0 ? 1 : dx < 0 ? 2 : dz > 0 ? 3 : 4;
      backRun[s] = 1;
      if (s > 0 && segDir[s] === segDir[s - 1]) {
        backRun[s] = backRun[s - 1] + 1;
      }
    }
    for (let s = segCount - 1; s >= 0; s--) {
      forwardRun[s] = 1;
      if (s + 1 < segCount && segDir[s] === segDir[s + 1]) {
        forwardRun[s] = forwardRun[s + 1] + 1;
      }
    }

    const plannedY = new Int16Array(pathX.length);
    const plannedAlongX = new Uint8Array(pathX.length);
    let currentY = clamp(Math.round(startY), 1, maxY);
    let lastStep = -999999;

    for (let i = 0; i < pathX.length; i++) {
      const x = pathX[i];
      const z = pathZ[i];
      const idx = x * columns.sizeZ + z;
      const presetY = centerlineY[idx];
      const t = total > 0 ? i / total : 0;
      const tunnelOffset = this.tunnelOffsetAt(t, tunnel);
      const liquidFloorY = columns.liquidFloor[idx];
      const allowMerge = allowWideMerge || this.isJunctionWindow(i, total, isFork, settings);

      if (presetY !== ROAD_Y_UNSET && allowMerge) {
        currentY = presetY;
        if (tunnelOffset >= -0.01 && currentY < liquidFloorY) {
          currentY = liquidFloorY;
        }
      } else {
        const gradeY = startY + (endY - startY) * t;

        let desiredY = gradeY + tunnelOffset;
        if (tunnelOffset < -0.01) {
          const tunnelCapY = columns.surface[idx] - (ROAD_CLEARANCE + 1);
          desiredY = Math.min(desiredY, tunnelCapY);
        } else {
          desiredY = Math.max(desiredY, liquidFloorY);
        }

        const targetY = clamp(Math.round(desiredY), 1, maxY);
        const canSlope = this.canSlopeAt(segDir, backRun, forwardRun, i);

        if (canSlope && i - lastStep >= ELEVATION_STEP_SPACING) {
          if (targetY > currentY) {
            currentY++;
            lastStep = i;
          } else if (targetY < currentY) {
            currentY--;
            lastStep = i;
          }
        }
      }

      const roadY = currentY;
      const alongX = this.isAlongX(pathX, pathZ, i);
      if (this.hasCrossSectionConflict(state, x, z, roadY, alongX, allowMerge, settings)) {
        return 0;
      }
      plannedY[i] = roadY;
      plannedAlongX[i] = alongX ? 1 : 0;
    }

    for (let i = 0; i < pathX.length; i++) {
      const x = pathX[i];
      const z = pathZ[i];
      const idx = x * columns.sizeZ + z;
      const roadY = plannedY[i];
      const alongX = plannedAlongX[i] === 1;
      const allowMerge = allowWideMerge || this.isJunctionWindow(i, total, isFork, settings);
      if (centerlineY[idx] === ROAD_Y_UNSET || allowMerge) {
        centerlineY[idx] = roadY;
      }
      const centerKey = this.toVoxelKey(state, x, roadY, z);
      state.centerlineVoxels.add(centerKey);
      if (roadY > columns.surface[idx] + 1) {
        state.bridgeCenterline.set(centerKey, alongX ? 1 : 0);
      }
      if ((i % BRIDGE_SUPPORT_SPACING) === 0 && roadY > columns.surface[idx] + 1) {
        state.supportAnchors.add(centerKey);
      }
      this.paintRoadCrossSection(ctx, columns, x, roadY, z, alongX, state, settings);

      const stripeIndex = stripeOffset + i;
      const stripeOn = stripeIndex % STRIPE_PERIOD === 0;
      if (stripeOn) stripes.push({ x, y: roadY, z });
    }

    return pathX.length;
  }

  private tunnelOffsetAt(t: number, tunnel: EdgeTunnelProfile | undefined): number {
    if (!tunnel) return 0;
    if (t <= tunnel.startT || t >= tunnel.endT) return 0;

    const u = (t - tunnel.startT) / (tunnel.endT - tunnel.startT);
    const bell = Math.sin(u * Math.PI);
    return -tunnel.depth * bell;
  }

  private canSlopeAt(
    segDir: Int8Array,
    backRun: Int16Array,
    forwardRun: Int16Array,
    i: number
  ): boolean {
    const prevSeg = i - 1;
    const nextSeg = i;
    if (prevSeg < 0 || nextSeg >= segDir.length) return false;

    const dir = segDir[nextSeg];
    if (segDir[prevSeg] !== dir) return false;
    if (backRun[prevSeg] < MIN_STRAIGHT_FOR_SLOPE || forwardRun[nextSeg] < MIN_STRAIGHT_FOR_SLOPE) return false;

    const from = Math.max(0, prevSeg - SLOPE_CURVE_GUARD);
    const to = Math.min(segDir.length - 1, nextSeg + SLOPE_CURVE_GUARD);
    for (let s = from; s <= to; s++) {
      if (segDir[s] !== dir) return false;
    }
    return true;
  }

  private isAlongX(pathX: number[], pathZ: number[], i: number): boolean {
    if (i + 1 < pathX.length) return pathX[i + 1] !== pathX[i];
    if (i > 0) return pathX[i] !== pathX[i - 1];
    return true;
  }

  private planNodeFillets(
    nodes: RoadNode[],
    edges: RoadEdge[]
  ): { edgeStartTrim: Int16Array; edgeEndTrim: Int16Array; fillets: NodeFillet[] } {
    const edgeStartTrim = new Int16Array(edges.length);
    const edgeEndTrim = new Int16Array(edges.length);
    const fillets: NodeFillet[] = [];

    const adjacency = Array.from({ length: nodes.length }, () => [] as Array<{ edge: number; neighbor: number }>);
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      adjacency[edge.a].push({ edge: i, neighbor: edge.b });
      adjacency[edge.b].push({ edge: i, neighbor: edge.a });
    }

    const turnCos = (ax: number, az: number, bx: number, bz: number): number => {
      const lenA = Math.hypot(ax, az);
      const lenB = Math.hypot(bx, bz);
      if (lenA <= 1e-6 || lenB <= 1e-6) return 1;
      return clamp((ax * bx + az * bz) / (lenA * lenB), -1, 1);
    };

    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
      const links = adjacency[nodeIndex];
      if (links.length !== 2) continue;

      const node = nodes[nodeIndex];
      const a = nodes[links[0].neighbor];
      const b = nodes[links[1].neighbor];
      const ax = a.x - node.x;
      const az = a.z - node.z;
      const bx = b.x - node.x;
      const bz = b.z - node.z;
      const cos = turnCos(ax, az, bx, bz);
      if (cos > NODE_FILLET_TRIGGER_COS) continue;

      const distA = Math.hypot(ax, az);
      const distB = Math.hypot(bx, bz);
      let radius = Math.floor(Math.min(distA, distB) * NODE_FILLET_TRIM_RATIO);
      radius = Math.min(radius, NODE_FILLET_MAX_RADIUS);
      radius = Math.min(radius, Math.floor(distA * 0.45), Math.floor(distB * 0.45));
      if (radius < NODE_FILLET_MIN_RADIUS) continue;

      const linkA = links[0];
      const linkB = links[1];

      if (edges[linkA.edge].a === nodeIndex) edgeStartTrim[linkA.edge] = Math.max(edgeStartTrim[linkA.edge], radius);
      else edgeEndTrim[linkA.edge] = Math.max(edgeEndTrim[linkA.edge], radius);

      if (edges[linkB.edge].a === nodeIndex) edgeStartTrim[linkB.edge] = Math.max(edgeStartTrim[linkB.edge], radius);
      else edgeEndTrim[linkB.edge] = Math.max(edgeEndTrim[linkB.edge], radius);

      fillets.push({
        nodeIndex,
        neighborA: linkA.neighbor,
        neighborB: linkB.neighbor,
        radius,
      });
    }

    return { edgeStartTrim, edgeEndTrim, fillets };
  }

  private isJunctionWindow(i: number, total: number, isFork: boolean, settings: RoadSettings): boolean {
    const terminalWindow = Math.max(settings.width, settings.halfWidth + 4);
    if (i <= terminalWindow || i >= total - terminalWindow) return true;
    if (!isFork) return false;
    const forkWindow = terminalWindow + settings.halfWidth + 3;
    return i <= forkWindow || i >= total - forkWindow;
  }

  private hasCrossSectionConflict(
    state: RoadPlacementState,
    centerX: number,
    centerZ: number,
    roadY: number,
    alongX: boolean,
    allowMerge: boolean,
    settings: RoadSettings
  ): boolean {
    for (let o = -settings.halfWidth; o <= settings.halfWidth; o++) {
      const x = alongX ? centerX : centerX + o;
      const z = alongX ? centerZ + o : centerZ;
      if (x < 0 || x >= state.sizeX || z < 0 || z >= state.sizeZ) continue;

      const ys = state.roadColumns.get(this.toColumnKey(state, x, z));
      if (!ys) continue;
      for (let i = 0; i < ys.length; i++) {
        const delta = Math.abs(ys[i] - roadY);
        if (delta >= ROAD_INTERSECTION_VERTICAL_GAP) continue;
        if (allowMerge && delta <= ROAD_JUNCTION_Y_TOLERANCE) continue;
        return true;
      }
    }
    return false;
  }

  private paintRoadCrossSection(
    ctx: GenerationContext,
    columns: ColumnData,
    centerX: number,
    roadY: number,
    centerZ: number,
    alongX: boolean,
    state: RoadPlacementState,
    settings: RoadSettings
  ): void {
    const { x: sizeX, y: sizeY, z: sizeZ } = ctx.config.worldSize;
    const clearTop = Math.min(sizeY - 1, roadY + ROAD_CLEARANCE);
    const spanX: number[] = [];
    const spanZ: number[] = [];
    const spanKeys = new Set<number>();

    for (let o = -settings.halfWidth; o <= settings.halfWidth; o++) {
      const x = alongX ? centerX : centerX + o;
      const z = alongX ? centerZ + o : centerZ;
      if (x < 0 || x >= sizeX || z < 0 || z >= sizeZ) continue;
      spanX.push(x);
      spanZ.push(z);
      spanKeys.add(x * sizeZ + z);
    }

    if (spanX.length === 0) return;

    let cutThroughTerrain = false;
    for (let i = 0; i < spanX.length && !cutThroughTerrain; i++) {
      const x = spanX[i];
      const z = spanZ[i];
      for (let y = roadY; y <= clearTop; y++) {
        if (!ctx.hasBlock(x, y, z)) continue;
        cutThroughTerrain = true;
        break;
      }
    }

    for (let i = 0; i < spanX.length; i++) {
      const x = spanX[i];
      const z = spanZ[i];

      for (let y = roadY; y <= clearTop; y++) {
        if (ctx.hasBlock(x, y, z)) ctx.removeBlock(x, y, z);
        this.removeRoadVoxel(state, x, y, z);
      }
      ctx.setBlock(ROAD_BLOCK_ID, x, roadY, z);
      this.addRoadVoxel(state, x, roadY, z);
    }

    for (let i = 0; i < spanX.length; i++) {
      const x = spanX[i];
      const z = spanZ[i];

      for (let y = roadY; y <= clearTop; y++) {
        for (let d = 0; d < 4; d++) {
          const nx = x + SIDE_DX[d];
          const nz = z + SIDE_DZ[d];
          if (nx < 0 || nx >= sizeX || nz < 0 || nz >= sizeZ) continue;

          const nKey = nx * sizeZ + nz;
          if (spanKeys.has(nKey)) continue;
          if (!ctx.hasBlock(nx, y, nz)) continue;

          if (!this.isWithinTerrainOrLiquid(columns, nx, nz, y)) continue;

          if (y === roadY) {
            const sideHasOverhead = y + 1 < sizeY && ctx.hasBlock(nx, y + 1, nz);
            if (!cutThroughTerrain && !sideHasOverhead) continue;
          }

          state.wallCandidates.add(this.toVoxelKey(state, nx, y, nz));
        }
      }
    }

    const roofY = clearTop + 1;
    if (cutThroughTerrain && roofY < sizeY) {
      for (let i = 0; i < spanX.length; i++) {
        const x = spanX[i];
        const z = spanZ[i];
        if (!this.isWithinTerrainOrLiquid(columns, x, z, roofY)) continue;
        state.roofCandidates.add(this.toVoxelKey(state, x, roofY, z));
      }
    }
  }

  private toColumnKey(state: RoadPlacementState, x: number, z: number): number {
    return x * state.sizeZ + z;
  }

  private toVoxelKey(state: RoadPlacementState, x: number, y: number, z: number): number {
    return x + z * state.sizeX + y * state.stride;
  }

  private setRoadWallBlock(
    ctx: GenerationContext,
    state: RoadPlacementState,
    x: number,
    y: number,
    z: number
  ): void {
    ctx.setBlock(ROAD_WALL_BLOCK_ID, x, y, z);
    state.wallVoxels.add(this.toVoxelKey(state, x, y, z));
  }

  private isWithinTerrainOrLiquid(columns: ColumnData, x: number, z: number, y: number): boolean {
    const idx = x * columns.sizeZ + z;
    return y <= columns.surface[idx] || y < columns.liquidFloor[idx];
  }

  private addRoadVoxel(state: RoadPlacementState, x: number, y: number, z: number): void {
    const key = this.toVoxelKey(state, x, y, z);
    if (state.roadVoxels.has(key)) return;
    state.roadVoxels.add(key);

    const colKey = this.toColumnKey(state, x, z);
    const ys = state.roadColumns.get(colKey);
    if (!ys) {
      state.roadColumns.set(colKey, [y]);
      return;
    }

    for (let i = 0; i < ys.length; i++) {
      if (ys[i] === y) return;
    }
    ys.push(y);
  }

  private removeRoadVoxel(state: RoadPlacementState, x: number, y: number, z: number): void {
    const key = this.toVoxelKey(state, x, y, z);
    if (!state.roadVoxels.delete(key)) return;

    const colKey = this.toColumnKey(state, x, z);
    const ys = state.roadColumns.get(colKey);
    if (!ys) return;

    for (let i = 0; i < ys.length; i++) {
      if (ys[i] !== y) continue;
      ys[i] = ys[ys.length - 1];
      ys.pop();
      break;
    }

    if (ys.length === 0) state.roadColumns.delete(colKey);
  }

  private hasRoadInColumn(
    state: RoadPlacementState,
    x: number,
    z: number,
    y: number,
    maxDelta: number
  ): boolean {
    const ys = state.roadColumns.get(this.toColumnKey(state, x, z));
    if (!ys) return false;
    for (let i = 0; i < ys.length; i++) {
      const roadY = ys[i];
      if (y >= roadY && y <= roadY + maxDelta) return true;
    }
    return false;
  }

  private hasRoadSupportForWall(
    state: RoadPlacementState,
    x: number,
    y: number,
    z: number
  ): boolean {
    if (this.hasRoadInColumn(state, x, z, y, ROAD_CLEARANCE + 1)) return true;

    for (let d = 0; d < 4; d++) {
      const nx = x + SIDE_DX[d];
      const nz = z + SIDE_DZ[d];
      if (nx < 0 || nx >= state.sizeX || nz < 0 || nz >= state.sizeZ) continue;
      if (this.hasRoadInColumn(state, nx, nz, y, ROAD_CLEARANCE)) return true;
    }

    return false;
  }

  private touchesRoadOnBothAxes(
    state: RoadPlacementState,
    x: number,
    y: number,
    z: number,
    maxDelta: number
  ): boolean {
    let hasX = false;
    let hasZ = false;
    for (let d = 0; d < 4; d++) {
      const nx = x + SIDE_DX[d];
      const nz = z + SIDE_DZ[d];
      if (nx < 0 || nx >= state.sizeX || nz < 0 || nz >= state.sizeZ) continue;
      if (!this.hasRoadInColumn(state, nx, nz, y, maxDelta)) continue;
      if (SIDE_DX[d] !== 0) hasX = true;
      else hasZ = true;
      if (hasX && hasZ) return true;
    }
    return false;
  }

  private hasSteepAdjacentCenterlineStripe(
    state: RoadPlacementState,
    x: number,
    y: number,
    z: number
  ): boolean {
    for (let d = 0; d < 4; d++) {
      const nx = x + SIDE_DX[d];
      const nz = z + SIDE_DZ[d];
      if (nx < 0 || nx >= state.sizeX || nz < 0 || nz >= state.sizeZ) continue;

      const ys = state.roadColumns.get(this.toColumnKey(state, nx, nz));
      if (!ys) continue;

      for (let i = 0; i < ys.length; i++) {
        const ny = ys[i];
        if (Math.abs(ny - y) <= 1) continue;
        if (!state.centerlineVoxels.has(this.toVoxelKey(state, nx, ny, nz))) continue;
        return true;
      }
    }
    return false;
  }

  private commitTunnelWalls(
    ctx: GenerationContext,
    columns: ColumnData,
    state: RoadPlacementState
  ): void {
    // Roof candidates are explicit tunnel caps and should always resolve to
    // wall blocks when they are in terrain/liquid envelope.
    state.roofCandidates.forEach((key) => {
      const y = (key / state.stride) | 0;
      const rem = key - y * state.stride;
      const z = (rem / state.sizeX) | 0;
      const x = rem - z * state.sizeX;

      if (state.roadVoxels.has(key)) return;
      if (!this.isWithinTerrainOrLiquid(columns, x, z, y)) return;
      if (!this.hasRoadSupportForWall(state, x, y, z)) return;
      this.setRoadWallBlock(ctx, state, x, y, z);
    });

    state.wallCandidates.forEach((key) => {
      if (state.roofCandidates.has(key)) return;
      const y = (key / state.stride) | 0;
      const rem = key - y * state.stride;
      const z = (rem / state.sizeX) | 0;
      const x = rem - z * state.sizeX;

      if (!ctx.hasBlock(x, y, z)) return;
      if (state.roadVoxels.has(key)) return;

      if (!this.isWithinTerrainOrLiquid(columns, x, z, y)) return;
      if (!this.hasRoadSupportForWall(state, x, y, z)) return;
      const cIdx = x * columns.sizeZ + z;
      const inLiquidEnvelope = y > columns.surface[cIdx] && y < columns.liquidFloor[cIdx];
      if (!inLiquidEnvelope && this.touchesRoadOnBothAxes(state, x, y, z, ROAD_CLEARANCE + 1)) return;

      this.setRoadWallBlock(ctx, state, x, y, z);
    });
  }

  private commitRoadDeck(
    ctx: GenerationContext,
    columns: ColumnData,
    state: RoadPlacementState,
    stripes: StripePlacement[],
    settings: RoadSettings
  ): void {
    const finalRoadKeys = new Set<number>(state.roadVoxels);
    state.centerlineVoxels.forEach((key) => finalRoadKeys.add(key));

    finalRoadKeys.forEach((key) => {
      const y = (key / state.stride) | 0;
      const rem = key - y * state.stride;
      const z = (rem / state.sizeX) | 0;
      const x = rem - z * state.sizeX;
      ctx.setBlock(ROAD_BLOCK_ID, x, y, z);
    });

    // Keep a dedicated support base directly under every road deck voxel.
    finalRoadKeys.forEach((key) => {
      const y = (key / state.stride) | 0;
      if (y <= 0) return;
      const rem = key - y * state.stride;
      const z = (rem / state.sizeX) | 0;
      const x = rem - z * state.sizeX;
      const underY = y - 1;
      const underKey = this.toVoxelKey(state, x, underY, z);
      if (finalRoadKeys.has(underKey)) return;
      this.setRoadWallBlock(ctx, state, x, underY, z);
    });

    // For elevated roads, place periodic 3x3 support columns down to terrain surface.
    state.supportAnchors.forEach((key) => {
      const y = (key / state.stride) | 0;
      if (y <= 0) return;
      const rem = key - y * state.stride;
      const z = (rem / state.sizeX) | 0;
      const x = rem - z * state.sizeX;
      const topY = y - 1;

      for (let ox = -BRIDGE_SUPPORT_HALF_SIZE; ox <= BRIDGE_SUPPORT_HALF_SIZE; ox++) {
        const px = x + ox;
        if (px < 0 || px >= state.sizeX) continue;
        for (let oz = -BRIDGE_SUPPORT_HALF_SIZE; oz <= BRIDGE_SUPPORT_HALF_SIZE; oz++) {
          const pz = z + oz;
          if (pz < 0 || pz >= state.sizeZ) continue;

          const surfaceY = columns.surface[px * columns.sizeZ + pz];
          if (topY < surfaceY) continue;

          for (let py = topY; py >= surfaceY; py--) {
            const pKey = this.toVoxelKey(state, px, py, pz);
            if (finalRoadKeys.has(pKey)) continue;
            this.setRoadWallBlock(ctx, state, px, py, pz);
          }
        }
      }
    });

    // Elevated bridge spans get a wider block-11 base and side parapets.
    const bridgeHalfWidth = settings.halfWidth + 1;
    state.bridgeCenterline.forEach((alongXFlag, key) => {
      const roadY = (key / state.stride) | 0;
      const rem = key - roadY * state.stride;
      const centerZ = (rem / state.sizeX) | 0;
      const centerX = rem - centerZ * state.sizeX;
      const alongX = alongXFlag === 1;

      const underY = roadY - 1;
      if (underY >= 0) {
        for (let o = -bridgeHalfWidth; o <= bridgeHalfWidth; o++) {
          const px = alongX ? centerX : centerX + o;
          const pz = alongX ? centerZ + o : centerZ;
          if (px < 0 || px >= state.sizeX || pz < 0 || pz >= state.sizeZ) continue;
          const underKey = this.toVoxelKey(state, px, underY, pz);
          if (!finalRoadKeys.has(underKey)) this.setRoadWallBlock(ctx, state, px, underY, pz);
        }
      }

      for (let edge = -1; edge <= 1; edge += 2) {
        const o = edge * bridgeHalfWidth;
        const px = alongX ? centerX : centerX + o;
        const pz = alongX ? centerZ + o : centerZ;
        if (px < 0 || px >= state.sizeX || pz < 0 || pz >= state.sizeZ) continue;
        const deckKey = this.toVoxelKey(state, px, roadY, pz);
        // Never place parapets directly above another road deck column.
        if (finalRoadKeys.has(deckKey)) continue;

        for (let y = roadY; y <= roadY + 1 && y < state.sizeY; y++) {
          const wallKey = this.toVoxelKey(state, px, y, pz);
          if (finalRoadKeys.has(wallKey)) continue;
          this.setRoadWallBlock(ctx, state, px, y, pz);
        }
      }
    });

    // Bridge parapets/transition walls should never occupy the same x/z
    // column directly above a road deck voxel.
    finalRoadKeys.forEach((key) => {
      const y = (key / state.stride) | 0;
      const aboveY = y + 1;
      if (aboveY >= state.sizeY) return;
      const rem = key - y * state.stride;
      const z = (rem / state.sizeX) | 0;
      const x = rem - z * state.sizeX;
      const aboveKey = this.toVoxelKey(state, x, aboveY, z);
      if (finalRoadKeys.has(aboveKey)) return;
      if (!ctx.hasBlock(x, aboveY, z)) return;
      ctx.removeBlock(x, aboveY, z);
      state.wallVoxels.delete(aboveKey);
    });

    for (let i = 0; i < stripes.length; i++) {
      const s = stripes[i];
      const key = this.toVoxelKey(state, s.x, s.y, s.z);
      if (!state.roadVoxels.has(key)) continue;
      if (!state.centerlineVoxels.has(key)) continue;
      if (this.hasSteepAdjacentCenterlineStripe(state, s.x, s.y, s.z)) continue;
      ctx.setBlock(ROAD_STRIPE_BLOCK_ID, s.x, s.y, s.z);
    }
  }

  private applyErosion(
    ctx: GenerationContext,
    state: RoadPlacementState,
    seed: number,
    settings: RoadSettings
  ): void {
    const erosion = settings.erosion;
    if (!erosion.enabled) return;
    if (erosion.deckChance <= 0 && erosion.wallChance <= 0) return;

    const deckKeys = new Set<number>(state.roadVoxels);
    state.centerlineVoxels.forEach((key) => deckKeys.add(key));

    const columnCache = new Map<number, { severity: number; biomeMult: number }>();
    const columnData = (x: number, z: number): { severity: number; biomeMult: number } => {
      const key = this.toColumnKey(state, x, z);
      const cached = columnCache.get(key);
      if (cached) return cached;

      const mask = this.sampleErosionMask(seed, x, z, erosion.patchScale);
      let severity = 0;
      if (mask > erosion.patchThreshold) {
        const u = (mask - erosion.patchThreshold) / Math.max(1e-6, 1 - erosion.patchThreshold);
        severity = smoothstep01(u);
      }
      const biomeMult = clamp(ctx.getBiomeAt(x, z)?.roads?.erosionMult ?? 1, 0, 3);
      const sampled = { severity, biomeMult };
      columnCache.set(key, sampled);
      return sampled;
    };

    if (erosion.deckChance > 0) {
      const toRemove: number[] = [];
      deckKeys.forEach((key) => {
        const y = (key / state.stride) | 0;
        const rem = key - y * state.stride;
        const z = (rem / state.sizeX) | 0;
        const x = rem - z * state.sizeX;
        if (!ctx.hasBlock(x, y, z)) return;

        const { severity, biomeMult } = columnData(x, z);
        if (severity <= 0 || biomeMult <= 0) return;
        const chance = clamp(erosion.deckChance * severity * biomeMult, 0, 0.97);
        if (chance <= 0) return;
        const h = hash3(seed, x, (z + y * 131) | 0, 311);
        if (rand01(h) < chance) toRemove.push(key);
      });

      for (let i = 0; i < toRemove.length; i++) {
        const key = toRemove[i];
        const y = (key / state.stride) | 0;
        const rem = key - y * state.stride;
        const z = (rem / state.sizeX) | 0;
        const x = rem - z * state.sizeX;
        if (!ctx.hasBlock(x, y, z)) continue;
        ctx.removeBlock(x, y, z);
        this.removeRoadVoxel(state, x, y, z);
        state.centerlineVoxels.delete(key);
        state.bridgeCenterline.delete(key);
        state.supportAnchors.delete(key);
      }
    }

    if (erosion.wallChance > 0) {
      const wallKeys = Array.from(state.wallVoxels);
      for (let i = 0; i < wallKeys.length; i++) {
        const key = wallKeys[i];
        if (deckKeys.has(key)) {
          state.wallVoxels.delete(key);
          continue;
        }
        const y = (key / state.stride) | 0;
        const rem = key - y * state.stride;
        const z = (rem / state.sizeX) | 0;
        const x = rem - z * state.sizeX;
        if (!ctx.hasBlock(x, y, z)) {
          state.wallVoxels.delete(key);
          continue;
        }

        const { severity, biomeMult } = columnData(x, z);
        if (severity <= 0 || biomeMult <= 0) continue;
        const chance = clamp(erosion.wallChance * severity * biomeMult, 0, 0.98);
        if (chance <= 0) continue;
        const h = hash3(seed, x, (z + y * 193) | 0, 313);
        if (rand01(h) >= chance) continue;
        ctx.removeBlock(x, y, z);
        state.wallVoxels.delete(key);
      }
    }
  }

  private sampleErosionMask(seed: number, x: number, z: number, scale: number): number {
    const coarse = this.sampleValueNoise2D(seed, x, z, scale, 401);
    const detail = this.sampleValueNoise2D(seed, x, z, Math.max(4, scale * 0.5), 409);
    return clamp(coarse * 0.75 + detail * 0.25, 0, 1);
  }

  private sampleValueNoise2D(seed: number, x: number, z: number, scale: number, salt: number): number {
    const fx = x / scale;
    const fz = z / scale;
    const x0 = Math.floor(fx) | 0;
    const z0 = Math.floor(fz) | 0;
    const tx = smoothstep01(fx - x0);
    const tz = smoothstep01(fz - z0);

    const s = (seed ^ salt) | 0;
    const n00 = rand01(hash3(s, x0, z0, salt));
    const n10 = rand01(hash3(s, x0 + 1, z0, salt));
    const n01 = rand01(hash3(s, x0, z0 + 1, salt));
    const n11 = rand01(hash3(s, x0 + 1, z0 + 1, salt));

    const ix0 = n00 + (n10 - n00) * tx;
    const ix1 = n01 + (n11 - n01) * tx;
    return ix0 + (ix1 - ix0) * tz;
  }
}
