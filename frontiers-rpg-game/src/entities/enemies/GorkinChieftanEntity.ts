import { Collider, ColliderShape, ParticleEmitter, RigidBodyType } from "hytopia";
import BaseCombatEntity, { BaseCombatEntityOptions } from "../BaseCombatEntity";
import GamePlayerEntity from "../../GamePlayerEntity";
import { isDamageable } from '../../interfaces/IDamageable';
import type { Vector3Like, QuaternionLike, World } from 'hytopia';
import type BaseEntity from "../BaseEntity"; 

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

export type GorkinEnforcerEntityOptions = {

} & Partial<BaseCombatEntityOptions>;

export default class GorkinEnforcerEntity extends BaseCombatEntity {
  private _stompParticleEmitter: ParticleEmitter;

  constructor(options?: GorkinEnforcerEntityOptions) {
    super({
      aggroRadius: 9,
      aggroSensorForwardOffset: 3,
      attacks: [
        { // Slash, stab attack
          animations: [ 'atk1' ],
          complexAttack: (params) => this._slashStabAttack(params.target),
          complexAttackDelayMs: 700,
          cooldownMs: 3500,
          simpleAttackDamage: 70, // complex attack triggers simple attack processing
          simpleAttackDamageVariance: 0.3,
          stopAllAnimationForMs: 2500,
          stopMovingForDurationMs: 2500,
          range: 3,
          weight: 2,
        },
        { // Stomp
          animations: [ 'atk2' ],
          complexAttack: () => this._stompAttack(),
          complexAttackDelayMs: 550,
          cooldownMs: 1800,
          range: 4,
          stopAllAnimationForMs: 1400,
          stopMovingForDurationMs: 1400,
          weight: 1,
        },
        { // Double slash attack
          animations: [ 'atk3' ],
          complexAttack: (params) => this._doubleSlashAttack(params.target),
          complexAttackDelayMs: 700,
          cooldownMs: 3500,
          simpleAttackDamage: 55, // complex attack triggers simple attack processing
          simpleAttackDamageVariance: 0.2,
          stopAllAnimationForMs: 2500,
          stopMovingForDurationMs: 2500,
          range: 4,
          weight: 1,
        },
      ],
      combatExperienceReward: 65,
      deathAnimations: [ 'death' ],
      deathDespawnDelayMs: 2400,
      deathItemDrops: [
        { itemClass: GoldItem, minQuantity: 30, maxQuantity: 45, weight: 5 },
        { itemClass: GorkinEarItem, minQuantity: 1, maxQuantity: 2, weight: 4 },
        { itemClass: GorkinEyeItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: GorkinFootItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: GorkinHandItem, minQuantity: 1, maxQuantity: 2, weight: 3 },
        { itemClass: ShatteredSwordItem, weight: 3 },
        { itemClass: ToughMonsterHide, weight: 3 },
        { itemClass: GorkinSkullItem, weight: 2 },
        { itemClass: ShackleItem, weight: 2 },
      ],
      deathItemMaxDrops: 5,
      diameterOverride: 0.75,
      health: 1200,
      idleAnimations: [ 'idle' ],
      modelUri: 'models/enemies/gorkin-chieftan.gltf',
      modelPreferredShape: ColliderShape.CAPSULE,
      modelScale: 1.1,
      moveAnimations: [ 'fastwalk' ],
      moveSpeed: 5,
      moveAnimationSpeed: 1.25,
      name: 'Gorkin Chieftan',
      nameplateType: 'boss',
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        colliders: [ // manually sized collider since the chain whip breaks auto calculations
          {
            shape: ColliderShape.CAPSULE,
            halfHeight: 0.8,
            radius: 0.75,
          },
        ],
      },
      pathfindingOptions: {
        maxJump: 3,
        maxFall: 3,
      },
      ...options,
    });

    this._stompParticleEmitter = new ParticleEmitter({
      textureUri: 'particles/dirt.png',
      attachedToEntity: this,
      colorStart: { r: 194, g: 164, b: 132 },
      offset: { x: 0, y: -1, z: 0 },
      size: 1,
      sizeVariance: 1,
      lifetime: 5,
      lifetimeVariance: 3,
      rate: 125,
      maxParticles: 250,
      velocity: { x: 0, y: 6, z: 0 },
      velocityVariance: { x: 6, y: 2, z: 6 },
    });
  }

  public override spawn(world: World, position: Vector3Like, rotation: QuaternionLike) {
    super.spawn(world, position, rotation);
    this._stompParticleEmitter.spawn(world);
    this._stompParticleEmitter.stop();
  }

  private _doubleSlashAttack(target: BaseEntity | GamePlayerEntity) {
    this.processSimpleAttack(target, this.attacks[2]);
    setTimeout(() => this.processSimpleAttack(target, this.attacks[2]), 800);
  }

  private _slashStabAttack(target: BaseEntity | GamePlayerEntity) {
    this.processSimpleAttack(target, this.attacks[0]);
    setTimeout(() => this.processSimpleAttack(target, this.attacks[0]), 1000);
  }

  private _stompAttack() {
    if (!this.world) return;

    this._stompParticleEmitter.restart();
    setTimeout(() => this._stompParticleEmitter.stop(), 500);

    const aoeCollider = new Collider({
      shape: ColliderShape.CYLINDER,
      halfHeight: this.height / 2,
      radius: Math.sqrt(this.diameterSquared) / 2 + 3,
    })

    const targets = this.getTargetsByRawShapeIntersection(
      aoeCollider.rawShape,
      this.position,
      this.rotation,
    );

    for (const target of targets) {
      if (!target.isSpawned || !isDamageable(target)) continue;

      target.takeDamage(this.calculateDamageWithVariance(80, 0.2));

      // Ignore impulse if dodging.
      if (target instanceof GamePlayerEntity && target.isDodging) continue;

      const direction = this.calculateDirectionToTargetPosition(target.position);
      target.applyImpulse({
        x: direction.x * 13 * target.mass,
        y: 5 * target.mass,
        z: direction.z * 13 * target.mass,
      });
    }
  }
}