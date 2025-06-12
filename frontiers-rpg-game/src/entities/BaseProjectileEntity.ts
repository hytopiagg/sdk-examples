import {
  BlockType,
  Collider,
  Entity,
  EntityOptions,
  RigidBodyType,
  Vector3Like,
} from 'hytopia';
import { isDamageable } from '../interfaces/IDamageable';

export type BaseProjectileEntityOptions = {
  damage: number;
  despawnAfterMs: number;
  direction: Vector3Like;
  gravityScale?: number;
  source: Entity;
  speed: number;
} & EntityOptions;

export default class BaseProjectileEntity extends Entity {
  public readonly damage: number;
  public readonly direction: Vector3Like;
  public readonly source: Entity;
  public readonly speed: number;
  private _despawnTimeout: NodeJS.Timeout | undefined;

  constructor(options: BaseProjectileEntityOptions) {
    const { damage, direction, source, speed, ...rest } = options;
    
    super({
      ...rest,
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        gravityScale: options.gravityScale ?? 1,
        linearVelocity: {
          x: direction.x * speed,
          y: direction.y * speed,
          z: direction.z * speed,
        },
        colliders: [
          {
            ...Collider.optionsFromModelUri('models/projectiles/arrow.gltf'),
            isSensor: true,
            onCollision: (other, started) => this.onCollision(other, started),
          }
        ],
      }
    });

    this.damage = damage;
    this.direction = direction;
    this.source = source;
    this.speed = speed;

    this._despawnTimeout = setTimeout(this.safeDespawn, options.despawnAfterMs);
  }

  protected safeDespawn = (): void => {
    if (!this.isSpawned) return;
    this.despawn();
  }

  protected onCollision = (other: BlockType | Entity, started: boolean) => {
    if (!started || other === this.source) return;
    
    if (isDamageable(other)) {
      other.takeDamage(this.damage);
    }

    clearTimeout(this._despawnTimeout);
    this.safeDespawn();
  }
}