import { Entity } from 'hytopia';
import BaseEntity from '../entities/BaseEntity';
import BaseItem, { ItemOverrides } from './BaseItem';
import GamePlayerEntity from '../GamePlayerEntity';
import { isDamageable } from '../interfaces/IDamageable';
import type { QuaternionLike, RawShape, Vector3Like } from 'hytopia';

export type BaseWeaponItemAttack = {
  id?: string;
  animations: string[];
  cooldownMs: number;
  damage: number;
  damageDelayMs: number;
  damageVariance?: number; // 0.2 = +/- 20% of damage
  knockbackForce?: number;
  reach: number;
}

export type WeaponOverrides = {
  attack?: BaseWeaponItemAttack;
  specialAttack?: BaseWeaponItemAttack;
} & ItemOverrides;
  
export default abstract class BaseWeaponItem extends BaseItem {
  // Required static properties that weapon subclasses MUST implement
  static readonly attack: BaseWeaponItemAttack;
  
  // Optional static properties with defaults
  static readonly specialAttack?: BaseWeaponItemAttack = undefined;

  // Simple factory method
  static create(overrides?: WeaponOverrides): BaseWeaponItem {
    const ItemClass = this as any;
    return new ItemClass(overrides);
  }

  static isWeaponItem(item: BaseItem | typeof BaseItem): item is BaseWeaponItem {
    if (typeof item === 'function') {
      return BaseWeaponItem.prototype.isPrototypeOf(item.prototype);
    }

    return item instanceof BaseWeaponItem;
  }

  // Instance properties (delegate to static or use overrides)
  public get attack(): BaseWeaponItemAttack { 
    return this._attack ?? (this.constructor as typeof BaseWeaponItem).attack; 
  }
  public get specialAttack(): BaseWeaponItemAttack { 
    return this._specialAttack ?? (this.constructor as typeof BaseWeaponItem).specialAttack ?? this.attack; 
  }

  // Instance-specific properties that can be overridden
  private readonly _attack?: BaseWeaponItemAttack;
  private readonly _specialAttack?: BaseWeaponItemAttack;
  private _attackCooledDownAtMs: number = 0;
  private _specialAttackCooledDownAtMs: number = 0;

  public constructor(overrides?: WeaponOverrides) {
    super(overrides);

    this._attack = overrides?.attack;
    this._specialAttack = overrides?.specialAttack;
  }

  public get canAttack(): boolean { return performance.now() >= this._attackCooledDownAtMs; }
  public get canSpecialAttack(): boolean { return performance.now() >= this._specialAttackCooledDownAtMs; }

  public override clone(overrides?: WeaponOverrides): BaseWeaponItem {
    const WeaponClass = this.constructor as any;
    return new WeaponClass({
      quantity: this.quantity,
      attack: this._attack,
      specialAttack: this._specialAttack,
      ...overrides,
    });
  }

  public override useMouseLeft(): void {
    this.performAttack();
  }

  public override useMouseRight(): void {
    this.performSpecialAttack();
  }

  public performAttack(): void {
    if (!this.entity?.parent || !this.canAttack) {
      return;
    }

    this.entity.parent.startModelOneshotAnimations(this.attack.animations);
    this.updateAttackCooldown(this.attack.cooldownMs);
    setTimeout(() => this.processAttackDamageTargets(this.attack), this.attack.damageDelayMs);
  }

  public performSpecialAttack(): void {
    if (!this.entity?.parent || !this.canSpecialAttack) {
      return;
    }

    this.entity.parent.startModelOneshotAnimations(this.specialAttack.animations);
    this.updateAttackCooldown(this.specialAttack.damageDelayMs); // prevents spamming regular attack mid-special attack
    this.updateSpecialAttackCooldown(this.specialAttack.cooldownMs);
    setTimeout(() => this.processAttackDamageTargets(this.specialAttack), this.specialAttack.damageDelayMs);
  }

  protected calculateDamageWithVariance(baseDamage: number, variance?: number): number {
    if (!variance) return baseDamage;
    
    // variance of 0.2 means damage can be 80% to 120% of base damage
    const min = baseDamage * (1 - variance);
    const max = baseDamage * (1 + variance);
    
    return Math.floor(min + Math.random() * (max - min));
  }

  protected processAttackDamageTargets(attack: BaseWeaponItemAttack): void {
    if (!this.entity?.parent) return;

    const attackPosition = (this.entity.parent as GamePlayerEntity).adjustedRaycastPosition ?? this.entity.parent.position;
    const attackDirection = (this.entity.parent as GamePlayerEntity).adjustedFacingDirection ?? this.entity.parent.directionFromRotation;

    const target = this.getTargetByRaycast(
      attackPosition,
      attackDirection,
      attack.reach,
    );

    if (target) {
      const damage = this.calculateDamageWithVariance(attack.damage, attack.damageVariance);
      this.dealDamage(target, damage, attackDirection, attack.knockbackForce);
    }
  }

  protected dealDamage(target: Entity, damage: number, knockbackDirection: Vector3Like, knockbackForce?: number): void {
    if (!isDamageable(target) || target instanceof GamePlayerEntity) { // disabled instanceof for pvp support later.
      return;
    }

    target.takeDamage(damage, this.entity?.parent);

    if (knockbackForce && target instanceof BaseEntity && target.pushable) {
      target.applyImpulse({
        x: knockbackDirection.x * knockbackForce * target.mass,
        y: 0,
        z: knockbackDirection.z * knockbackForce * target.mass,
      });
    }
  }

  protected getTargetsByRawShapeIntersection(rawShape: RawShape, position: Vector3Like, rotation: QuaternionLike): Entity[] {
    if (!this.entity?.parent || !this.entity.parent.world) {
      return [];
    }
    
    const intersectionsResults = this.entity.parent.world.simulation.intersectionsWithRawShape(
      rawShape,
      position,
      rotation,
      {
        filterExcludeRigidBody: this.entity.parent.rawRigidBody, // ignore self (parent/player)
        filterFlags: 8, // Rapier flag to exclude sensor colliders
      },
    );

    return intersectionsResults.map(result => result.intersectedEntity).filter(Boolean) as Entity[];
  }

  protected getTargetByRaycast(fromPosition: Vector3Like, toDirection: Vector3Like, reach: number): Entity | undefined {
    if (!this.entity?.parent || !this.entity.parent.world) {
      return;
    }

    const raycastResult = this.entity.parent.world.simulation.raycast(fromPosition, toDirection, reach, {
        filterExcludeRigidBody: this.entity.parent.rawRigidBody, // ignore self (parent/player)
        filterFlags: 8, // Rapier flag to exclude sensor colliders
      },
    );

    return raycastResult?.hitEntity;
  }

  protected updateAttackCooldown(attackCooldownMs: number): void {
    this._attackCooledDownAtMs = performance.now() + attackCooldownMs;
  }

  protected updateSpecialAttackCooldown(specialAttackCooldownMs: number): void {
    this._specialAttackCooledDownAtMs = performance.now() + specialAttackCooldownMs;
  }
}