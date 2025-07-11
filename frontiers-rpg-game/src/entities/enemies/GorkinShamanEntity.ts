import { ColliderShape, Entity, RigidBodyType } from "hytopia";
import { isDamageable } from '../../interfaces/IDamageable';
import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import BaseProjectileEntity from '../BaseProjectileEntity';
import GamePlayerEntity from "../../GamePlayerEntity";

// Aggro Target Types
import ReclusiveWeaverEntity from "./ReclusiveWeaverEntity";

// Drops
import GoldItem from "../../items/general/GoldItem";
import GorkinEarItem from "../../items/materials/GorkinEarItem";
import GorkinEyeItem from "../../items/materials/GorkinEyeItem";
import GorkinFootItem from "../../items/materials/GorkinFootItem";
import GorkinHandItem from "../../items/materials/GorkinHandItem";
import GorkinSkullItem from "../../items/materials/GorkinSkullItem";
import IronIngotItem from "../../items/materials/IronIngotItem";
import ShackleItem from "../../items/materials/ShackleItem";
import ToughMonsterHide from "../../items/materials/ToughMonsterHide";

export type GorkinShamanEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class GorkinShamanEntity extends BaseCombatEntity {
  constructor(options?: GorkinShamanEntityOptions) {
    super({
      aggroRadius: 9,
      aggroSensorForwardOffset: 3,
      aggroTargetTypes: [
        GamePlayerEntity,
        ReclusiveWeaverEntity,
      ],
      attacks: [
        { // Toxic AoE
          animations: [ 'atk1' ],
          complexAttack: () => this._toxicAoE(30, 5),
          complexAttackDelayMs: 2000,
          cooldownMs: 2500,
          range: 6,
          stopAllAnimationForMs: 2200,
          stopMovingForDurationMs: 2200,
          weight: 100,
        },
        { // Toxic spread
          animations: [ 'atk2' ],
          complexAttack: () => this._toxicSpread(37),
          complexAttackDelayMs: 1300,
          cooldownMs: 3250,
          range: 7,
          stopAllAnimationForMs: 2200,
          stopMovingForDurationMs: 2200,
          weight: 2,
        },
      ],
      combatExperienceReward: 60,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 2700,
      deathItemDrops: [
        { itemClass: GoldItem, minQuantity: 20, maxQuantity: 29, weight: 5 },
        { itemClass: GorkinSkullItem, weight: 4 },
        { itemClass: GorkinEarItem, minQuantity: 1, maxQuantity: 2, weight: 4 },
        { itemClass: GorkinEyeItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: GorkinFootItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: GorkinHandItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: ToughMonsterHide, weight: 3 },
        { itemClass: ShackleItem, weight: 2 },
        { itemClass: IronIngotItem, minQuantity: 1, maxQuantity: 2, weight: 1 },
      ],
      diameterOverride: 0.65,
      health: 150,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/gorkin-shaman.gltf',
      modelPreferredShape: ColliderShape.CAPSULE,
      modelScale: 0.9,
      moveAnimations: [ 'walk' ],
      moveSpeed: 2,
      name: 'Gorkin Shaman',
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        colliders: [ // manually sized collider since the chain whip breaks auto calculations
          {
            shape: ColliderShape.CAPSULE,
            halfHeight: 0.175,
            radius: 0.65,
          },
        ],
      },
      pathfindingOptions: {
        maxJump: 2,
        maxFall: 2,
      },
      ...options,
    });
  }

  private _toxicAoE(baseDamage: number, aoeRadius: number) {
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

  private _toxicSpread(baseDamage: number) {
    if (!this.world) return;

    const direction = this.directionFromRotation;
    const gasSpray = new BaseProjectileEntity({
      damage: this.calculateDamageWithVariance(baseDamage, 0.3),
      despawnAfterMs: 2000,
      direction,
      gravityScale: 0.05,
      modelUri: 'models/projectiles/wide-spinning-fireball.gltf',
      modelLoopedAnimations: [ 'idle' ],
      modelScale: 0.75,
      speed: 12, 
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
}