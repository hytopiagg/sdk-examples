import { ColliderShape, RigidBodyType } from "hytopia";
import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import type BaseEntity from "../BaseEntity";
import type GamePlayerEntity from "../../GamePlayerEntity";

// Drops
import GoldItem from "../../items/general/GoldItem";
import GorkinEarItem from "../../items/materials/GorkinEarItem";
import GorkinEyeItem from "../../items/materials/GorkinEyeItem";
import GorkinFootItem from "../../items/materials/GorkinFootItem";
import GorkinHandItem from "../../items/materials/GorkinHandItem";
import GorkinSkullItem from "../../items/materials/GorkinSkullItem";
import ShatteredSwordItem from "../../items/materials/ShatteredSwordItem";
import ShackleItem from "../../items/materials/ShackleItem";

export type GorkinGruntEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class GorkinGruntEntity extends BaseCombatEntity {
  constructor(options?: GorkinGruntEntityOptions) {
    super({
      aggroRadius: 9,
      aggroSensorForwardOffset: 3,
      attacks: [
        {
          animations: [ 'atk1' ],
          cooldownMs: 3000,
          range: 5, // width/depth calculation is messed up and too large because of the model idle shape, so we use 0
          simpleAttackDamage: 23,
          simpleAttackDamageVariance: 0.2,
          simpleAttackDamageDelayMs: 800,
          stopAllAnimationForMs: 1900,
          stopMovingForDurationMs: 1900,
          weight: 1,
        },
      ],
      combatExperienceReward: 65,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 2400,
      deathItemDrops: [
        { itemClass: GoldItem, minQuantity: 18, maxQuantity: 27, weight: 5 },
        { itemClass: GorkinEarItem, minQuantity: 1, maxQuantity: 2, weight: 4 },
        { itemClass: GorkinEyeItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: GorkinFootItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: GorkinHandItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: ShatteredSwordItem, weight: 3 },
        { itemClass: GorkinSkullItem, weight: 2 },
        { itemClass: ShackleItem, weight: 2 },
      ],
      diameterOverride: 0.75,
      health: 260,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/gorkin-enforcer.gltf',
      modelPreferredShape: ColliderShape.CAPSULE,
      modelScale: 0.9,
      moveAnimations: [ 'walk' ],
      moveSpeed: 3,
      name: 'Gorkin Enforcer',
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        colliders: [ // manually sized collider since the chain whip breaks auto calculations
          {
            shape: ColliderShape.CAPSULE,
            halfHeight: 0.35,
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
}