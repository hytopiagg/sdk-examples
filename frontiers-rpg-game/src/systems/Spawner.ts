import { EntityEvent, Entity } from 'hytopia';
import type { Vector3Like, World } from 'hytopia';
import type BaseEntity from '../entities/BaseEntity';

export type SpawnableEntity = {
  entity: typeof BaseEntity;
  probability: number; // 0 - 1
}

export type SpawnerOptions = {
  maxSpawns: number;
  respawnDelayRangeMs: [ number, number ];
  spawnableEntities: SpawnableEntity[];
  spawnBounds: { min: Vector3Like; max: Vector3Like; };
  spawnIntervalMs: number;
  world: World;
}

export default class Spawner {
  public readonly maxSpawns: number;
  public readonly respawnDelayRangeMs: [ number, number ];
  public readonly spawnableEntities: SpawnableEntity[];
  public readonly spawnBounds: { min: Vector3Like; max: Vector3Like; };
  public readonly world: World;
  private readonly _spawnIntervalMs: number;
  private _spawnedEntities: Set<BaseEntity> = new Set();
  private _spawnInterval: NodeJS.Timeout | undefined;
  private _started: boolean = false;

  public constructor(options: SpawnerOptions) {
    this.maxSpawns = options.maxSpawns;
    this.respawnDelayRangeMs = options.respawnDelayRangeMs;
    this.spawnableEntities = options.spawnableEntities;
    this.spawnBounds = options.spawnBounds;
    this.world = options.world;
    this._spawnIntervalMs = options.spawnIntervalMs;
  }

  public get isStarted(): boolean { return this._started; }
  public get spawnedCount(): number { return this._spawnedEntities.size; }
  public get canSpawn(): boolean { return this._spawnedEntities.size < this.maxSpawns; }

  public start(spawnMaxOnStart: boolean = false): void {
    if (this._started) return;

    if (spawnMaxOnStart) {
      for (let i = 0; i < this.maxSpawns; i++) {
        this._spawnEntity();
      }
    }

    this._spawnInterval = setInterval(() => {
      if (this.canSpawn) {
        this._spawnEntity();
      }
    }, this._spawnIntervalMs);

    this._started = true;
  }

  public stop(): void {
    if (!this._started) return;

    if (this._spawnInterval) {
      clearInterval(this._spawnInterval);
      this._spawnInterval = undefined;
    }
    
    this._started = false;
  }

  private _spawnEntity(): void {
    // Select random entity based on probability
    let selectedEntityClass: typeof BaseEntity | null = null;
    for (const spawnableEntity of this.spawnableEntities) {
      if (Math.random() <= spawnableEntity.probability) {
        selectedEntityClass = spawnableEntity.entity;
        break;
      }
    }
    
    if (!selectedEntityClass) return;
            
    const entity = new selectedEntityClass();
    
    entity.on(EntityEvent.DESPAWN, ({ entity }: { entity: Entity }) => {
      this._spawnedEntities.delete(entity as BaseEntity);
    });

    const { min, max } = this.spawnBounds;
    entity.spawn(this.world, {
      x: Math.random() * (max.x - min.x) + min.x,
      y: Math.random() * (max.y - min.y) + min.y,
      z: Math.random() * (max.z - min.z) + min.z,
    });
    
    this._spawnedEntities.add(entity);
  }
}