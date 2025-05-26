import { Audio, CollisionGroup, Entity, Quaternion, Vector3Like, QuaternionLike, RigidBodyType, EntityEvent, Vector3, Collider } from 'hytopia';
import GunEntity from '../GunEntity';
import { BEDROCK_BLOCK_ID } from '../../gameConfig';
import type { GunEntityOptions } from '../GunEntity';
import type GamePlayerEntity from '../GamePlayerEntity';

const ROCKET_DESTRUCTION_RADIUS = 4;

const DEFAULT_ROCKET_LAUNCHER_OPTIONS: GunEntityOptions = {
  ammo: 1,
  damage: 80,
  fireRate: 0.8,
  heldHand: 'right',
  iconImageUri: 'icons/rocket-launcher.png',
  idleAnimation: 'idle_gun_right',
  mlAnimation: 'shoot_gun_right',
  name: 'Rocket Launcher',
  maxAmmo: 1,
  totalAmmo: 5,
  modelUri: 'models/items/rocket-launcher.glb',
  modelScale: 1.3,
  range: 8,
  reloadAudioUri: 'audio/sfx/rocket-launcher-reload.mp3',
  reloadTimeMs: 2500,
  shootAudioUri: 'audio/sfx/rocket-launcher-shoot.mp3',
};

export default class RocketLauncherEntity extends GunEntity {
  public constructor(options: Partial<GunEntityOptions> = {}) {
    super({ ...DEFAULT_ROCKET_LAUNCHER_OPTIONS, ...options });
  }

  public override shoot(): void {
    if (!this.parent || !this.processShoot()) return;

    super.shoot();
    
    // Cancel input since rocket launcher requires click-to-shoot
    // (this.parent as GamePlayerEntity).player.input.ml = false;
  }

  public override getMuzzleFlashPositionRotation(): { position: Vector3Like, rotation: QuaternionLike } {
    return {
      position: { x: 0.03, y: 0.6, z: -1.5 },
      rotation: Quaternion.fromEuler(0, 90, 0),
    };
  }

  public override equip(): void {
    super.equip();

    this.setPosition({ x: 0, y: 0.3, z: 0.4 });
  }

  public override shootRaycast(origin: Vector3Like, direction: Vector3Like, length: number) {
    // Instead of a raycast, we'll spawn a projectile that on collision with a block or entity explodes
    // and deals damage and blows up blocks
    if (!this.parent?.world) {
      return;
    }

    const rocketMissileEntity = new Entity({
      modelUri: 'models/items/rocket-missile.glb',
      modelScale: 0.75,
      rigidBodyOptions: {
        type: RigidBodyType.KINEMATIC_VELOCITY,
        colliders: [
          {
            ...Collider.optionsFromModelUri('models/items/rocket-missile.glb', 0.75),
            collisionGroups: {
              belongsTo: [ CollisionGroup.ENTITY ],
              collidesWith: [ CollisionGroup.BLOCK ],
            }
          },
        ],
        linearVelocity: { 
          x: direction.x * 30,
          y: direction.y * 30,
          z: direction.z * 30,
        },
      }
    });
    
    // Create a despawn timer if it doesn't hit
    setTimeout(() => {
      if (rocketMissileEntity.isSpawned) {
        rocketMissileEntity.despawn();
      }
    }, 3000);

    // Convert direction vector to quaternion that faces in the direction vector
    const directionQuat = Quaternion.fromEuler(
      Math.atan2(-direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z)) * 180 / Math.PI,
      Math.atan2(direction.x, direction.z) * 180 / Math.PI,
      0
    );

    rocketMissileEntity.on(EntityEvent.BLOCK_COLLISION, ({ blockType, colliderHandleA, colliderHandleB }) => {
      if (!this.parent?.world || !rocketMissileEntity.isSpawned || blockType.isLiquid) {
        return;
      }

      const { world } = this.parent;
      const contactManifold = world.simulation.getContactManifolds(colliderHandleA, colliderHandleB)[0];

      if (!contactManifold) {
        return;
      }

      const contactPoint = contactManifold.contactPoints[0];
      const contactCoordinate = {
        x: Math.floor(contactPoint.x),
        y: Math.floor(contactPoint.y), 
        z: Math.floor(contactPoint.z)
      };

      // Deal damage to nearby players
      this.parent.world.entityManager.getAllPlayerEntities().forEach(playerEntity => {
        const playerPos = Vector3.fromVector3Like(playerEntity.position);
        const contactPos = Vector3.fromVector3Like(contactPoint);
        const distance = playerPos.distance(contactPos);

        if (distance <= ROCKET_DESTRUCTION_RADIUS) {
          (playerEntity as GamePlayerEntity).takeDamage(this.damage, direction, this.parent as GamePlayerEntity);
        }
      });
      
      // Break blocks
      for (let dx = -ROCKET_DESTRUCTION_RADIUS; dx <= ROCKET_DESTRUCTION_RADIUS; dx++) {
        for (let dy = -ROCKET_DESTRUCTION_RADIUS; dy <= ROCKET_DESTRUCTION_RADIUS; dy++) {
          for (let dz = -ROCKET_DESTRUCTION_RADIUS; dz <= ROCKET_DESTRUCTION_RADIUS; dz++) {
            // Calculate distance from center of explosion
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Only destroy blocks within the spherical radius
            if (distance > ROCKET_DESTRUCTION_RADIUS) {
              continue;
            }

            const coordinate = {
              x: contactCoordinate.x + dx,
              y: contactCoordinate.y + dy,
              z: contactCoordinate.z + dz
            }

            // do not destroy bedrock!
            if (world.chunkLattice.getBlockId(coordinate) !== BEDROCK_BLOCK_ID) {
              world.chunkLattice.setBlock(coordinate, 0);
            }
          }
        }
      }

      // Explosion Visual
      const explosionEntity = new Entity({
        modelUri: 'models/environment/explosion.glb',
        modelScale: 0.2,
        rigidBodyOptions: { type: RigidBodyType.KINEMATIC_POSITION },
      });

      const explosionDirectionQuat = Quaternion.fromEuler(
        Math.atan2(-direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z)) * 180 / Math.PI + 90,
        Math.atan2(direction.x, direction.z) * 180 / Math.PI + 180, // Add 180 degrees to invert direction
        0
      );

      explosionEntity.spawn(world, contactPoint, explosionDirectionQuat);
      explosionEntity.setCollisionGroupsForSolidColliders({ 
        belongsTo: [],
        collidesWith: [],
      })

      const explosionEffectInterval = setInterval(() => {
        if (explosionEntity.opacity <= 0) {
          explosionEntity.despawn();
          clearInterval(explosionEffectInterval);
          return;
        }

        explosionEntity.setOpacity(explosionEntity.opacity - 0.1);
      }, 100);

      // Explosion Audio
      (new Audio({
        uri: 'audio/sfx/rocket-launcher-explosion.mp3',
        referenceDistance: 15,
        cutoffDistance: 100,
        volume: 0.4,
      })).play(world);

      rocketMissileEntity.despawn();
    });
    
    rocketMissileEntity.spawn(this.parent.world, origin, directionQuat);
  }
}
