import { ColliderShape, RigidBodyType } from "hytopia";
import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import GamePlayerEntity from "../../GamePlayerEntity";
import type BaseEntity from "../BaseEntity";

// Aggro Target Types
import ReclusiveWeaverEntity from "./ReclusiveWeaverEntity";

// Drops
import GoldItem from "../../items/general/GoldItem";
import GorkinEarItem from "../../items/materials/GorkinEarItem";
import GorkinEyeItem from "../../items/materials/GorkinEyeItem";
import GorkinFootItem from "../../items/materials/GorkinFootItem";
import GorkinHandItem from "../../items/materials/GorkinHandItem";
import GorkinSkullItem from "../../items/materials/GorkinSkullItem";
import ShatteredSwordItem from "../../items/materials/ShatteredSwordItem";
import ShackleItem from "../../items/materials/ShackleItem";
import ToughMonsterHide from "../../items/materials/ToughMonsterHide";

export type GorkinSwordsmanEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class GorkinSwordsmanEntity extends BaseCombatEntity {
  constructor(options?: GorkinSwordsmanEntityOptions) {
    super({
      aggroRadius: 9,
      aggroSensorForwardOffset: 3,
      aggroTargetTypes: [
        GamePlayerEntity,
        ReclusiveWeaverEntity,
      ],
      attacks: [
        { // heavy, slow slam attack
          animations: [ 'atk1' ],
          cooldownMs: 2700,
          range: 2.5, // width/depth calculation is messed up and too large because of the model idle shape, so we use 0
          simpleAttackDamage: 64,
          simpleAttackDamageVariance: 0.3,
          simpleAttackDamageDelayMs: 1400,
          stopAllAnimationForMs: 2200,
          stopMovingForDurationMs: 2200,
          weight: 1,
        },
        { // Double swing attack, standstill
          animations: [ 'atk2' ],
          complexAttack: (params) => this._doubleSwingAttackStill(params.target),
          complexAttackDelayMs: 750,
          cooldownMs: 3500,
          simpleAttackDamage: 41, // complex attack triggers simple attack processing
          simpleAttackDamageVariance: 0.3,
          stopAllAnimationForMs: 2700,
          stopMovingForDurationMs: 2700,
          range: 2.25,
          weight: 1,
        },
        { // Double swing attack, moving
          animations: [ 'atk2_SC' ],
          complexAttack: (params) => this._doubleSwingAttackMoving(params.target),
          complexAttackDelayMs: 750,
          cooldownMs: 3500,
          simpleAttackDamage: 41, // complex attack triggers simple attack processing
          simpleAttackDamageVariance: 0.3,
          stopAllAnimationForMs: 2700,
          range: 2.5,
          weight: 2,
        },
      ],
      combatExperienceReward: 55,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 1000,
      deathItemDrops: [
        { itemClass: GoldItem, minQuantity: 18, maxQuantity: 27, weight: 5 },
        { itemClass: ShatteredSwordItem, weight: 4 },
        { itemClass: GorkinEarItem, minQuantity: 1, maxQuantity: 2, weight: 4 },
        { itemClass: GorkinEyeItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: GorkinFootItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: GorkinHandItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: ToughMonsterHide, weight: 3 },
        { itemClass: GorkinSkullItem, weight: 2 },
        { itemClass: ShackleItem, weight: 2 },
      ],
      diameterOverride: 0.65,
      health: 230,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/gorkin-swordsman.gltf',
      modelPreferredShape: ColliderShape.CAPSULE,
      modelScale: 0.9,
      moveAnimations: [ 'walk' ],
      moveSpeed: 2.75,
      name: 'Gorkin Swordsman',
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        colliders: [ // manually sized collider since the chain whip breaks auto calculations
          {
            shape: ColliderShape.CAPSULE,
            halfHeight: 0.2,
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

  private _doubleSwingAttackStill(target: BaseEntity | GamePlayerEntity) {
    this.processSimpleAttack(target, this.attacks[1]);
    setTimeout(() => this.processSimpleAttack(target, this.attacks[1]), 1100);
  }

  private _doubleSwingAttackMoving(target: BaseEntity | GamePlayerEntity) {
    this.processSimpleAttack(target, this.attacks[2]);
    setTimeout(() => this.processSimpleAttack(target, this.attacks[2]), 1100);
  }
}