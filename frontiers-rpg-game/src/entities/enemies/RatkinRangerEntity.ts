import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import BaseProjectileEntity from "../BaseProjectileEntity";
import type { Vector3Like } from 'hytopia';

import CommonMushroomItem from "../../items/consumables/CommonMushroomItem";
import CommonSeedsItem from "../../items/seeds/CommonSeedsItem";
import GoldItem from "../../items/general/GoldItem";
import RatkinBonesItem from "../../items/materials/RatkinBonesItem";
import RatkinEyesItem from "../../items/materials/RatkinEyes";
import RatkinTailItem from "../../items/materials/RatkinTailItem";
import RatkinToothItem from "../../items/materials/RatkinToothItem.ts";


export type RatkinRangerEntityOptions = {

} & BaseCombatEntityOptions;

export default class RatkinRangerEntity extends BaseCombatEntity {
  constructor(options?: RatkinRangerEntityOptions) {
    super({
      aggroRadius: 11,
      aggroSensorForwardOffset: 3,
      attacks: [
        { // Fast bow attack
          animations: [ 'atk1' ],
          complexAttack: (params) => {
            this._shootArrow(params.target.position, this.calculateDamageWithVariance(10, 0.5));
          },
          complexAttackDelayMs: 700,
          cooldownMs: 2000,
          range: 10,
          weight: 2,
        },
        { // Slow heavy bow attack
          animations: [ 'atk2' ],
          complexAttack: (params) => {
            this._shootArrow(params.target.position, this.calculateDamageWithVariance(20, 0.5));
          },
          complexAttackDelayMs: 1600,
          cooldownMs: 3000,
          range: 10,
          weight: 3,
        },
      ],
      combatExperienceReward: 250,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 1000,
      deathItemDrops: [
        {
          item: new GoldItem(),
          minQuantity: 30,
          maxQuantity: 70,
          weight: 2,
        },
        {
          item: new CommonMushroomItem(),
          minQuantity: 1,
          maxQuantity: 3,
          weight: 1,
        },
        {
          item: new CommonSeedsItem(),
          weight: 0.5,
        },
        {
          item: new RatkinBonesItem(),
          weight: 0.8,
        },
        {
          item: new RatkinEyesItem(),
          weight: 0.8,
        },
        {
          item: new RatkinToothItem(),
          weight: 0.8,
        },
        {
          item: new RatkinTailItem(),
          weight: 0.8,
        },
      ],
      health: 100,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/ratkin-ranger.gltf',
      modelScale: 0.8,
      moveAnimations: [ 'walk' ],
      moveSpeed: 3,
      name: 'Ratkin Ranger',
      pathfindingOptions: {
        maxJump: 2,
        maxFall: 2,
      },
      ...options,
    });
  }

  private _shootArrow(targetPosition: Vector3Like, damage: number) {
    if (!this.world) return;
    
    const arrow = new BaseProjectileEntity({
      damage,
      despawnAfterMs: 1000,
      direction: this.calculateDirectionToTargetPosition(targetPosition),
      gravityScale: 0.1,
      modelUri: 'models/projectiles/arrow.glb',
      modelScale: 0.75,
      speed: 30,
      source: this,
    });
    
    arrow.spawn(this.world, this.position, this.rotation);
  }
}