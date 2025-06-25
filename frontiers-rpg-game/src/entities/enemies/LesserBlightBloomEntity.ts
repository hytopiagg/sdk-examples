import { ColliderShape, Entity, RigidBodyType } from 'hytopia';
import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import BaseProjectileEntity from '../BaseProjectileEntity';
import { isDamageable } from '../../interfaces/IDamageable';

// Drops
import BlightedRootItem from '../../items/materials/BlightedRootItem';
import CommonMushroomItem from '../../items/consumables/CommonMushroomItem';
import CommonSeedsItem from '../../items/seeds/CommonSeedsItem';
import UnusualSeedsItem from '../../items/seeds/UnusualSeedsItem';
import GoldItem from '../../items/general/GoldItem';

export type LesserBlightBloomEntityOptions = {

} & BaseCombatEntityOptions;

export default class LesserBlightBloomEntity extends BaseCombatEntity {
  constructor(options?: LesserBlightBloomEntityOptions) {
    super({
      aggroRadius: 8,
      attacks: [
        { // Eat
          animations: [ 'eat' ],
          complexAttack: () => this._eatTarget(),
          complexAttackDelayMs: 750,
          cooldownMs: 4000,
          range: 4,
          weight: 4,
        },
        { // AoEGas
          animations: [ 'gas_explode' ],
          complexAttack: () => this._emitGasAoE(25, 4),
          complexAttackDelayMs: 2500,
          cooldownMs: 4000,
          range: 10,
          weight: 2,
        },
        { // Spray 3 wide gas projectiles
          animations: [ 'spore_splash' ],
          complexAttack: () => this._sprayGas(18),
          complexAttackDelayMs: 700,
          cooldownMs: 4000,
          range: 10,
          weight: 2,
        },
      ],
      combatExperienceReward: 60,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 5000,
      deathItemDrops: [
        { itemClass: BlightedRootItem, minQuantity: 1, maxQuantity: 3, weight: 30 },
        { itemClass: CommonMushroomItem, minQuantity: 1, maxQuantity: 3, weight: 15 },
        { itemClass: GoldItem, minQuantity: 12, maxQuantity: 23, weight: 9 },
        { itemClass: CommonSeedsItem, minQuantity: 1, maxQuantity: 3, weight: 6 },
        { itemClass: UnusualSeedsItem, minQuantity: 1, maxQuantity: 3, weight: 1 },
      ],
      deathItemMaxDrops: 3,
      faceSpeed: 0.75,
      health: 250,
      idleAnimations: [ 'waiting' ],
      modelUri: 'models/enemies/blight-bloom.gltf',
      modelScale: 0.5,
      moveAnimations: [ 'waiting' ],
      moveSpeed: 0, // stationary, doesn't move.
      name: 'Lesser Blight Bloom',
      pathfindingOptions: {
        maxJump: 2,
        maxFall: 2,
      },
      pushable: false,
      tintColor: { r: 128, g: 255, b: 128 },
      ...options,
    });
  }

  private _eatTarget() {
    if (!this.world) return;

    const currentDirection = this.directionFromRotation;
    const raycastDirection = {
      x: currentDirection.x,
      y: currentDirection.y - 0.5, // aim down
      z: currentDirection.z,
    }

    const raycastResult = this.world.simulation.raycast(this.position, raycastDirection, 4, {
      filterExcludeRigidBody: this.rawRigidBody,
      filterFlags: 8, // Rapier flag to exclude sensor colliders
    });

    if (isDamageable(raycastResult?.hitEntity)) {
      raycastResult.hitEntity.takeDamage(this.calculateDamageWithVariance(80, 0.3));
    }
  }
  
  private _emitGasAoE(baseDamage: number, aoeRadius: number) {
    if (!this.world) return;

    const gas = new Entity({
      modelUri: 'models/vfx/gas-explode.gltf',
      modelLoopedAnimations: [ 'actived' ],
      rigidBodyOptions: {
        type: RigidBodyType.FIXED,
        colliders: [
          {
            shape: ColliderShape.BALL,
            radius: aoeRadius,
            isSensor: true,
            onCollision: (other, started) => {
              if (started && other !== this && isDamageable(other)) {
                other.takeDamage(this.calculateDamageWithVariance(baseDamage, 0.3));
              }
            }
          }
        ]
      },
      tintColor: { r: 0, g: 255, b: 0 },
    });

    gas.spawn(this.world, this.position);

    setTimeout(() => {
      gas.despawn();
    }, 1800);
  }

  private _sprayGas(baseDamage: number) {
    const spray = () => {
      if (!this.world) return;

      const direction = this.directionFromRotation;
      const gasSpray = new BaseProjectileEntity({
        damage: this.calculateDamageWithVariance(baseDamage, 0.3),
        despawnAfterMs: 2000,
        direction,
        gravityScale: 0.15,
        modelUri: 'models/projectiles/wide-spinning-fireball.gltf',
        modelLoopedAnimations: [ 'idle' ],
        modelScale: 0.75,
        speed: 4, 
        source: this,
        tintColor: { r: 0, g: 255, b: 128 },
      });

      const sourcePosition = this.position;
      const offsetSpawnPosition = {
        x: sourcePosition.x + direction.x * 2,
        y: sourcePosition.y + direction.y * 2,
        z: sourcePosition.z + direction.z * 2,
      }

      gasSpray.spawn(this.world, offsetSpawnPosition, this.rotation);
    }

    // 3 sprays
    spray();
    setTimeout(spray, 600);
    setTimeout(spray, 1200);
  }
}