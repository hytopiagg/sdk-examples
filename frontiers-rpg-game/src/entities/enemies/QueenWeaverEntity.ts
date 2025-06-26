import { Collider, ColliderShape, RigidBodyType } from 'hytopia';
import BaseCombatEntity, { BaseCombatEntityOptions } from '../BaseCombatEntity';
import GamePlayerEntity from '../../GamePlayerEntity';
import type BaseEntity from '../BaseEntity';

import WeaverBroodlingEntity from './WeaverBroodlingEntity';

// Drops
import GoldItem from "../../items/general/GoldItem";
import RareSeedsItem from '../../items/seeds/RareSeedsItem';
import UnusualSeedsItem from '../../items/seeds/UnusualSeedsItem';

export type QueenWeaverEntityOptions = {
  
} & Partial<BaseCombatEntityOptions>;

export default class QueenWeaverEntity extends BaseCombatEntity {
  constructor(options?: QueenWeaverEntityOptions) {
    super({
      aggroRadius: 20,
      attacks: [
        {
          animations: [ 'bite' ],
          cooldownMs: 1500,
          range: 2,
          simpleAttackDamage: 50,
          simpleAttackDamageVariance: 0.2,
          simpleAttackDamageDelayMs: 400,
          simpleAttackReach: 3,
          weight: 10,
        },
        {
          animations: [ 'cocoon' ],
          complexAttack: (params) => this._pounce(params.target),
          complexAttackDelayMs: 300,
          cooldownMs: 2500,
          range: 10,
          weight: 10,
        },
        {
          animations: [ 'web' ],
          complexAttack: () => this._slam(),
          complexAttackDelayMs: 600,
          cooldownMs: 2500,
          range: 5,
          weight: 10,
        },
        {
          animations: [ 'gas' ],
          complexAttack: () => this._spawnBroodling(),
          complexAttackDelayMs: 5000,
          cooldownMs: 6500,
          range: 8,
          stopMovingDuringDelay: true,
          weight: 4,
        }
      ],
      combatExperienceReward: 650,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 1500,
      deathItemDrops: [
        { itemClass: GoldItem, minQuantity: 93, maxQuantity: 186, weight: 40 },
        { itemClass: UnusualSeedsItem, minQuantity: 1, maxQuantity: 3, weight: 20 },
        { itemClass: RareSeedsItem, minQuantity: 1, maxQuantity: 3, weight: 1 },
      ],
      deathItemMaxDrops: 5,
      faceSpeed: 4,
      health: 1000,
      idleAnimations: [ 'waiting' ],
      modelUri: 'models/enemies/weaver.gltf',
      modelScale: 1.3,
      moveAnimations: [ 'walking' ],
      moveSpeed: 5,
      name: 'Queen Weaver',
      pathfindingOptions: {
        maxJump: 3,
        maxFall: 4,
        maxOpenSetIterations: 50,
      },
      pushable: false,
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        ccdEnabled: true,
      },
      ...options,
    })
  }

  private _pounce(target: BaseEntity | GamePlayerEntity) {
    if (!this.world) return;

    const position = target.position;
    const direction = this.calculateDirectionToTargetPosition(position);

    this.applyImpulse({
      x: direction.x * 10 * this.mass,
      y: 5 * this.mass,
      z: direction.z * 10 * this.mass,
    });

    this.faceTowards(position, 10);

    setTimeout(() => {
      if (!target.isSpawned || target.isDead) return;

      if (this.calculateDistanceSquaredToTarget(target) < this.diameterSquared + 1) {
        target.takeDamage(this.calculateDamageWithVariance(65, 0.4));
      }
    }, 1100);
  }

  private _slam() {
    if (!this.world) return;

    const aoeCollider = new Collider({
      shape: ColliderShape.CYLINDER,
      halfHeight: this.height / 2,
      radius: Math.sqrt(this.diameterSquared) / 2 + 2,
    })

    const targets = this.getTargetsByRawShapeIntersection(
      aoeCollider.rawShape,
      this.position,
      this.rotation,
    );

    for (const target of targets) {
      if (!target.isSpawned || !(target instanceof GamePlayerEntity)) continue;

      target.takeDamage(this.calculateDamageWithVariance(70, 0.2));
      
      if (!target.isDodging) { // we check here to allow damage to resolve for dodged exp
        const direction = this.calculateDirectionToTargetPosition(target.position);
        target.applyImpulse({
          x: direction.x * 13 * target.mass,
          y: 5 * target.mass,
          z: direction.z * 13 * target.mass,
        });
      }
    }
  }

  private _spawnBroodling() {
    if (!this.world) return;

    const weaverBroodling = new WeaverBroodlingEntity();
    const facingDirection = this.directionFromRotation;

    weaverBroodling.spawn(this.world, {
      x: this.position.x + (-facingDirection.x * 3),
      y: this.position.y + 1,
      z: this.position.z + (-facingDirection.z * 3),
    });
  }
}