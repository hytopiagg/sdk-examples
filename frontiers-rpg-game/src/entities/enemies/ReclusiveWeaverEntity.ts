import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import SpiderwebEntity from "./SpiderWebEntity";
import { RigidBodyType } from "hytopia";
import type BaseEntity from "../BaseEntity";
import type GamePlayerEntity from "../../GamePlayerEntity";

// Drops
import GoldItem from "../../items/general/GoldItem";
import WeaverCarapaceItem from "../../items/materials/WeaverCarapaceItem";
import WeaverHeartItem from "../../items/materials/WeaverHeartItem";
import WeaverSilkItem from "../../items/materials/WeaverSilkItem";
import WeaverEggItem from "../../items/materials/WeaverEggItem";

export type ReclusiveWeaverEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class ReclusiveWeaverEntity extends BaseCombatEntity {
  constructor(options?: ReclusiveWeaverEntityOptions) {
    super({
      aggroRadius: 10,
      aggroSensorForwardOffset: 7,
      attacks: [
        { // Bite attack
          animations: [ 'fang_attack' ],
          cooldownMs: 1400,
          range: 2,
          simpleAttackDamage: 24,
          simpleAttackDamageVariance: 0.2,
          simpleAttackDamageDelayMs: 500,
          weight: 15,
        },
        { // Web attack
          animations: [ 'web_attack' ],
          complexAttack: (params) => {
            this._shootWeb(params.target);
          },
          complexAttackDelayMs: 1000,
          cooldownMs: 2000,
          range: 5,
          stopMovingDuringDelay: true,
          weight: 1,
        }
      ],
      combatExperienceReward: 45,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 3000,
      deathItemDrops: [
        { itemClass: GoldItem, minQuantity: 18, maxQuantity: 28, weight: 10 },
        { itemClass: WeaverCarapaceItem, weight: 5 },
        { itemClass: WeaverHeartItem, weight: 4 },
        { itemClass: WeaverEggItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: WeaverSilkItem, minQuantity: 1, maxQuantity: 3, weight: 2 },
      ],
      deathItemMaxDrops: 2,
      health: 200,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/reclusive-weaver.gltf',
      modelScale: 0.8,
      moveAnimations: [ 'walk' ],
      moveSpeed: 3,
      name: 'Reclusive Weaver',
      pathfindingOptions: {
        maxJump: 3,
        maxFall: 3,
      },
      ...options,
    });
  }

  private _shootWeb(target: BaseEntity | GamePlayerEntity) {
    if (!this.world) return;

    const direction = this.calculateDirectionToTargetPosition(target.position);
    const distance = Math.sqrt(this.calculateDistanceSquaredToTarget(target));

    const web = new SpiderwebEntity({
      modelScale: 1,
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        linearVelocity: {
          x: 1.5 * direction.x * distance,
          y: distance,
          z: 1.5 * direction.z * distance,
        }
      }
    });

    web.spawn(this.world, {
      x: this.position.x,
      y: this.position.y + 1,
      z: this.position.z,
    }, this.rotation);

    // Despawn web after 8 seconds
    setTimeout(() => {
      if (web.isSpawned) {
        web.despawn();
      }
    }, 8000);
  }
}