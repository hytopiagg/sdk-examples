import { Entity } from 'hytopia';
import BaseItem, { BaseItemOptions } from './BaseItem';
import GamePlayerEntity from '../GamePlayerEntity';
import { isDamageable } from '../interfaces/IDamageable';

export type BaseWeaponItemOptions = {
  attackAnimations: string[];
  attackCooldownMs: number;
  attackDamage: number;
  attackDamageDelayMs: number;
  attackDamageVariance?: number;
  attackKnockbackForce?: number;
  attackReach: number;
} & Omit<BaseItemOptions, 'stackable' | 'quantity'>
  
export default class BaseWeaponItem extends BaseItem {
  public readonly attackAnimations: string[];
  public readonly attackCooldownMs: number;
  public readonly attackDamage: number;
  public readonly attackDamageDelayMs: number;
  public readonly attackDamageVariance: number;
  public readonly attackKnockbackForce: number;
  public readonly attackReach: number;
  private _lastAttackCooldownMs: number = 0;
  private _lastAttackTimeMs: number = 0;

  public constructor(options: BaseWeaponItemOptions) {
    super(options);

    this.attackAnimations = options.attackAnimations;
    this.attackCooldownMs = options.attackCooldownMs;
    this.attackDamage = options.attackDamage;
    this.attackDamageDelayMs = options.attackDamageDelayMs ?? 0;
    this.attackDamageVariance = options.attackDamageVariance ?? 0;
    this.attackKnockbackForce = options.attackKnockbackForce ?? 0;
    this.attackReach = options.attackReach;
  }

  // Convert current state to constructor options for cloning
  public override toOptions(): BaseWeaponItemOptions {
    return {
      ...super.toOptions(),
      attackAnimations: this.attackAnimations,
      attackCooldownMs: this.attackCooldownMs,
      attackDamage: this.attackDamage,
      attackDamageDelayMs: this.attackDamageDelayMs,
      attackDamageVariance: this.attackDamageVariance,
      attackKnockbackForce: this.attackKnockbackForce,
      attackReach: this.attackReach,
    };
  }

  public override clone(overrideOptions?: Partial<BaseWeaponItemOptions>): BaseWeaponItem {
    return new BaseWeaponItem({
      ...this.toOptions(),
      ...overrideOptions,
    });
  }

  public override useMouseLeft(): void {
    this.attack();
  }

  public override useMouseRight(): void {
    this.entity?.parent?.startModelOneshotAnimations([ 'sword-attack2-upper' ]);
  }

  public attack(): void {
    if (!this.entity?.parent) {
      return;
    }
    
    const now = performance.now();

    if (now - this._lastAttackTimeMs < this._lastAttackCooldownMs) {
      return;
    }

    this._lastAttackTimeMs = now;
    this._lastAttackCooldownMs = this.attackCooldownMs;

    this.entity.parent.startModelOneshotAnimations(this.attackAnimations);

    this.processAttack();
  }

  protected applyAttackDamage(hitEntity: Entity): void {
    if (!isDamageable(hitEntity)) {
      return;
    }

    if (!this.entity?.parent || !this.entity.parent.world) {
      return;
    }

    const damage = this._calculateDamageWithVariance(this.attackDamage, this.attackDamageVariance);
    hitEntity.takeDamage(damage, this.entity.parent);

    if (this.attackKnockbackForce) {
      const direction = this.entity.parent.directionFromRotation;
      hitEntity.applyImpulse({
        x: direction.x * this.attackKnockbackForce * hitEntity.mass,
        y: 0,
        z: direction.z * this.attackKnockbackForce * hitEntity.mass,
      })
    }
  }

  private _calculateDamageWithVariance(baseDamage: number, variance?: number): number {
    if (!variance) return baseDamage;
    
    // variance of 0.2 means damage can be 80% to 120% of base damage
    const min = baseDamage * (1 - variance);
    const max = baseDamage * (1 + variance);
    
    return Math.floor(min + Math.random() * (max - min));
  }

  protected processAttack(): void {
    setTimeout(() => {
      if (!this.entity?.parent || !this.entity.parent.world) {
        return;
      }

      const raycastResult = this.entity.parent.world.simulation.raycast(
        (this.entity.parent as GamePlayerEntity)?.adjustedRaycastPosition ?? this.entity.parent.position,
        (this.entity.parent as GamePlayerEntity)?.adjustedFacingDirection ?? this.entity.directionFromRotation, 
        this.attackReach, 
        {
          filterExcludeRigidBody: this.entity.parent.rawRigidBody, // ignore self
          filterFlags: 8, // Rapier exclude sensors,
        },
      );

      if (raycastResult?.hitEntity) {
        this.applyAttackDamage(raycastResult.hitEntity);
      }
    }, this.attackDamageDelayMs);
  }
}