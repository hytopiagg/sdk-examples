import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import GamePlayerEntity from "../../GamePlayerEntity";
import type BaseEntity from "../BaseEntity";

// Aggro Target Types
import RatkinBruteEntity from "./RatkinBruteEntity";
import RatkinRangerEntity from "./RatkinRangerEntity";
import RatkinSpellcasterEntity from "./RatkinSpellcasterEntity";
import RatkinWarriorEntity from "./RatkinWarriorEntity";
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

export type GorkinGruntEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class GorkinGruntEntity extends BaseCombatEntity {
  constructor(options?: GorkinGruntEntityOptions) {
    super({
      aggroRadius: 9,
      aggroSensorForwardOffset: 3,
      aggroTargetTypes: [
        GamePlayerEntity,
        RatkinBruteEntity,
        RatkinRangerEntity,
        RatkinSpellcasterEntity,
        RatkinWarriorEntity,
        ReclusiveWeaverEntity,
      ],
      attacks: [
        { // Light attack
          animations: [ 'atk1' ],
          cooldownMs: 2000,
          range: 1.5,
          simpleAttackDamage: 27,
          simpleAttackDamageVariance: 0.2,
          simpleAttackDamageDelayMs: 800,
          simpleAttackReach: 2,
          stopAllAnimationForMs: 1400,
          stopMovingForDurationMs: 1400,
          weight: 1,
        },
        { // Double swing attack
          animations: [ 'atk2' ],
          complexAttack: (params) => this._doubleSwingAttack(params.target),
          complexAttackDelayMs: 700,
          cooldownMs: 2000,
          simpleAttackDamage: 30, // complex attack triggers simple attack processing
          simpleAttackDamageVariance: 0.3,
          stopAllAnimationForMs: 1800,
          stopMovingForDurationMs: 2200,
          range: 1.5,
          weight: 1,
        },
        { // Heavy attack
          animations: [ 'atk3' ],
          cooldownMs: 2000,
          stopAllAnimationForMs: 1450,
          stopMovingForDurationMs: 1450,
          range: 1.5,
          simpleAttackDamage: 36,
          simpleAttackDamageVariance: 0.2,
          simpleAttackDamageDelayMs: 500,
          simpleAttackReach: 2,
          weight: 1,
        },
      ],
      combatExperienceReward: 50,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 2400,
      deathItemDrops: [
        { itemClass: GoldItem, minQuantity: 14, maxQuantity: 24, weight: 5 },
        { itemClass: GorkinEarItem, minQuantity: 1, maxQuantity: 2, weight: 4 },
        { itemClass: GorkinEyeItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: GorkinFootItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: GorkinHandItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: ToughMonsterHide, weight: 3 },
        { itemClass: GorkinSkullItem, weight: 2 },
        { itemClass: ShatteredSwordItem, weight: 1 },
        { itemClass: ShackleItem, weight: 1 },
      ],
      health: 200,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/gorkin-grunt.gltf',
      modelScale: 0.9,
      moveAnimations: [ 'walk' ],
      moveSpeed: 3,
      name: 'Gorkin Grunt',
      pathfindingOptions: {
        maxJump: 2,
        maxFall: 2,
      },
      ...options,
    });
  }

  private _doubleSwingAttack(target: BaseEntity | GamePlayerEntity) {
    this.processSimpleAttack(target, this.attacks[1]);
    setTimeout(() => this.processSimpleAttack(target, this.attacks[1]), 700);
  }
}