import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import BaseProjectileEntity from "../BaseProjectileEntity";
import GamePlayerEntity from "../../GamePlayerEntity";
import type { Vector3Like } from 'hytopia';

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

export type GorkinHunterEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class GorkinHunterEntity extends BaseCombatEntity {
  constructor(options?: GorkinHunterEntityOptions) {
    super({
      aggroRadius: 13,
      aggroSensorForwardOffset: 4,
      aggroTargetTypes: [
        GamePlayerEntity,
        ReclusiveWeaverEntity,
      ],
      attacks: [
        { // Slow heavy bow attack
          animations: [ 'atk1' ],
          complexAttack: (params) => {
            this._shootArrow(params.target.position, this.calculateDamageWithVariance(24, 0.3));
          },
          complexAttackDelayMs: 1550,
          cooldownMs: 2500,
          range: 12,
          weight: 1,
        },
      ],
      combatExperienceReward: 65,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 2400,
      deathItemDrops: [
        { itemClass: GoldItem, minQuantity: 16, maxQuantity: 24, weight: 5 },
        { itemClass: GorkinSkullItem, weight: 4 },
        { itemClass: GorkinEarItem, minQuantity: 1, maxQuantity: 2, weight: 4 },
        { itemClass: GorkinEyeItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: GorkinFootItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: GorkinHandItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: ToughMonsterHide, weight: 3 },
        { itemClass: ShackleItem, weight: 2 },
        { itemClass: IronIngotItem, minQuantity: 1, maxQuantity: 2, weight: 1 },
      ],
      health: 160,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/gorkin-hunter.gltf',
      modelScale: 0.9,
      moveAnimations: [ 'walk' ],
      moveSpeed: 3,
      name: 'Gorkin Hunter',
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
      speed: 35,
      source: this,
    });
    
    arrow.spawn(this.world, this.position, this.rotation);
  }
}