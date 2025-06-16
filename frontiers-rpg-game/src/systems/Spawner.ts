import {
  Entity,
  EntityEvent,
  Quaternion,
  Vector3Like,
  World,
} from 'hytopia';

import BaseEntity from '../entities/BaseEntity';
import BaseItem from '../items/BaseItem';
import type { ItemClass } from '../items/BaseItem';
import type { WanderOptions } from '../entities/BaseEntity';

export type BoundingBox = {
  min: Vector3Like;
  max: Vector3Like;
};

export type SpawnRegion = BoundingBox & {
  weight?: number;
};

export type EntitySpawnable = {
  entityConstructor: new () => BaseEntity;
  weight: number;
  wanders?: boolean;
  wanderOptions?: WanderOptions;
};

export type ItemSpawnable = {
  itemClass: ItemClass;
  minQuantity?: number;
  maxQuantity?: number;
  weight: number;
};

export type Spawnable = EntitySpawnable | ItemSpawnable;

export type SpawnerOptions = {
  exclusionZones?: BoundingBox[];
  maxSpawns: number;
  spawnables: Spawnable[];
  spawnRegions: SpawnRegion[];
  spawnIntervalMs: number;
  world: World;
};

export default class Spawner {
  private _exclusionZones: BoundingBox[];
  private _maxSpawns: number;
  private _spawnables: Spawnable[];
  private _spawnedEntities: Set<Entity> = new Set();
  private _spawnInterval: NodeJS.Timeout | undefined;
  private _spawnIntervalMs: number;
  private _spawnRegions: SpawnRegion[];
  private _totalSpawnableWeight: number;
  private _totalRegionWeight: number;
  private _world: World;

  public constructor(options: SpawnerOptions) {
    if (options.spawnables.length === 0) {
      throw new Error('Spawner: spawnables cannot be empty');
    }

    if (options.spawnRegions.length === 0) {
      throw new Error('Spawner: spawnRegions cannot be empty');
    }

    this._maxSpawns = Math.max(1, options.maxSpawns);
    this._spawnables = options.spawnables;
    this._spawnRegions = options.spawnRegions;
    this._exclusionZones = options.exclusionZones ?? [];
    this._spawnIntervalMs = Math.max(100, options.spawnIntervalMs);
    this._world = options.world;

    this._totalSpawnableWeight = this._spawnables.reduce((sum, spawnable) => sum + Math.max(0, spawnable.weight), 0);
    this._totalRegionWeight = this._spawnRegions.reduce((sum, region) => sum + Math.max(1, region.weight ?? 1), 0);
  }

  public get exclusionZones(): BoundingBox[] { return this._exclusionZones; }
  public get isStarted(): boolean { return this._spawnInterval !== undefined; }
  public get maxSpawns(): number { return this._maxSpawns; }
  public get spawnables(): Spawnable[] { return this._spawnables; }
  public get spawnedCount(): number { return this._spawnedEntities.size; }
  public get spawnIntervalMs(): number { return this._spawnIntervalMs; }
  public get spawnRegions(): SpawnRegion[] { return this._spawnRegions; }
  public get world(): World { return this._world; }

  public start(spawnAllImmediately: boolean = false): void {
    if (this._spawnInterval) return;

    if (spawnAllImmediately) {
      const spawnCount = this._maxSpawns - this._spawnedEntities.size;
      for (let i = 0; i < spawnCount; i++) {
        this._spawnEntity();
      }
    }

    this._spawnInterval = setInterval(() => {
      if (this._spawnedEntities.size < this._maxSpawns) {
        this._spawnEntity();
      }
    }, this._spawnIntervalMs);
  }

  public stop(): void {
    if (this._spawnInterval) {
      clearInterval(this._spawnInterval);
      this._spawnInterval = undefined;
    }
  }

  private _spawnEntity(): void {
    const spawnable = this._pickRandomSpawnable();
    if (!spawnable) return;

    const spawnPoint = this._findValidSpawnPoint();
    if (!spawnPoint) return;

    const rotation = Quaternion.fromEuler(0, Math.random() * 360, 0);

    if ('entityConstructor' in spawnable) {
      // Handle BaseEntity spawning
      const instance = new spawnable.entityConstructor();
      
      instance.on(EntityEvent.DESPAWN, ({ entity }: { entity: Entity }) => {
        this._spawnedEntities.delete(entity);
      });

      instance.spawn(this._world, spawnPoint, rotation);

      // Apply wandering behavior if configured
      if (spawnable.wanders && spawnable.wanderOptions) {
        instance.wander(instance.moveSpeed, spawnable.wanderOptions);
      }

      this._spawnedEntities.add(instance);
    } else {
      // Handle BaseItem spawning
      const minQty = spawnable.minQuantity ?? 1;
      const maxQty = spawnable.maxQuantity ?? 1;
      const quantity = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;
      
      const instance = spawnable.itemClass.create({ quantity });
      instance.spawnEntityAsDrop(this._world, spawnPoint, rotation);
      
      // Track the created entity (BaseItem handles its own despawn cleanup)
      const spawnedEntity = instance.entity;

      if (spawnedEntity) {
        spawnedEntity.on(EntityEvent.DESPAWN, ({ entity }: { entity: Entity }) => {
          this._spawnedEntities.delete(entity);
        });
        
        this._spawnedEntities.add(spawnedEntity);
      }
    }
  }

  private _findValidSpawnPoint(): Vector3Like | null {
    for (let attempt = 0; attempt < 15; attempt++) {
      const region = this._pickRandomSpawnRegion();
      if (!region) continue;

      const point = {
        x: Math.random() * (region.max.x - region.min.x) + region.min.x,
        y: Math.random() * (region.max.y - region.min.y) + region.min.y,
        z: Math.random() * (region.max.z - region.min.z) + region.min.z,
      };

      if (!this._world.chunkLattice.hasBlock(point) && !this._isInExclusionZone(point)) {
        return point;
      }
    }

    return null;
  }

  private _isInExclusionZone(point: Vector3Like): boolean {
    return this._exclusionZones.some(zone =>
      point.x >= zone.min.x && point.x <= zone.max.x &&
      point.y >= zone.min.y && point.y <= zone.max.y &&
      point.z >= zone.min.z && point.z <= zone.max.z
    );
  }

  private _pickRandomSpawnRegion(): SpawnRegion | null {
    if (this._totalRegionWeight <= 0) return this._spawnRegions[0] ?? null;

    const random = Math.random() * this._totalRegionWeight;
    let cumulativeWeight = 0;

    for (const region of this._spawnRegions) {
      cumulativeWeight += Math.max(1, region.weight ?? 1);
      if (random < cumulativeWeight) {
        return region;
      }
    }

    return this._spawnRegions[0] ?? null;
  }

  private _pickRandomSpawnable(): Spawnable | null {
    if (this._totalSpawnableWeight <= 0) return this._spawnables[0] ?? null;

    const random = Math.random() * this._totalSpawnableWeight;
    let cumulativeWeight = 0;

    for (const spawnable of this._spawnables) {
      cumulativeWeight += Math.max(0, spawnable.weight);
      if (random < cumulativeWeight) {
        return spawnable;
      }
    }

    return this._spawnables[0] ?? null;
  }
}