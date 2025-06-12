import {
  Entity,
  EntityEvent,
  Quaternion,
} from 'hytopia';
import type { Vector3Like, World } from 'hytopia';
import type BaseEntity from '../entities/BaseEntity';
import type { WanderOptions } from '../entities/BaseEntity';

export type SpawnableEntity = {
  entity: typeof BaseEntity;
  wanders?: boolean;
  wanderOptions?: WanderOptions;
  weight: number;
}

export type SpawnerOptions = {
  maxSpawns: number;
  spawnableEntities: SpawnableEntity[];
  spawnBounds: { min: Vector3Like; max: Vector3Like; };
  spawnIntervalMs: number;
  world: World;
}

export default class Spawner {
  public readonly maxSpawns: number;
  public readonly spawnableEntities: SpawnableEntity[];
  public readonly spawnBounds: { min: Vector3Like; max: Vector3Like; };
  public readonly world: World;
  private readonly _spawnIntervalMs: number;
  private _spawnedEntities: Set<BaseEntity> = new Set();
  private _spawnInterval: NodeJS.Timeout | undefined;
  private _started: boolean = false;
  private _totalWeight: number = 0;

  public constructor(options: SpawnerOptions) {
    this.maxSpawns = options.maxSpawns;
    this.spawnableEntities = options.spawnableEntities;
    this.spawnBounds = options.spawnBounds;
    this.world = options.world;
    this._spawnIntervalMs = options.spawnIntervalMs;

    this._totalWeight = this.spawnableEntities.reduce((sum, e) => sum + e.weight, 0);
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

  private _pickRandomSpawnableEntity(): SpawnableEntity | null {
    if (this._totalWeight <= 0) return null;

    const random = Math.random() * this._totalWeight;
    let cumulativeWeight = 0;

    for (const spawnableEntity of this.spawnableEntities) {
      cumulativeWeight += spawnableEntity.weight;
      if (random < cumulativeWeight) {
        return spawnableEntity;
      }
    }

    // Should never reach here.
    return null;
  }

  private _spawnEntity(): void {
    const spawnableEntity = this._pickRandomSpawnableEntity();
    
    if (!spawnableEntity) return;
            
    const entity = new spawnableEntity.entity();
    
    entity.on(EntityEvent.DESPAWN, ({ entity }: { entity: Entity }) => {
      this._spawnedEntities.delete(entity as BaseEntity);
    });

    // Pick a random spawn point that is not in a block, with a maximum number of retries.
    const { min, max } = this.spawnBounds;
    let spawnPoint: Vector3Like | undefined;
    const maxRetries = 10;

    for (let i = 0; i < maxRetries; i++) {
      const point: Vector3Like = {
        x: Math.random() * (max.x - min.x) + min.x,
        y: Math.random() * (max.y - min.y) + min.y,
        z: Math.random() * (max.z - min.z) + min.z,
      };

      if (!this.world.chunkLattice.hasBlock(point)) {
        spawnPoint = point;
        break;
      }
    }

    // If no valid spawn point was found after all retries, abort.
    if (!spawnPoint) {
      return;
    }
    
    entity.spawn(this.world, spawnPoint, Quaternion.fromEuler(0, Math.random() * 360, 0));
    
    if (spawnableEntity.wanders && spawnableEntity.wanderOptions) {
      entity.wander(entity.moveSpeed, spawnableEntity.wanderOptions);
    }

    this._spawnedEntities.add(entity);
  }
}