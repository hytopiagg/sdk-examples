import type { Entity } from 'hytopia';


export default interface IDamageable {
  takeDamage(damage: number, attacker?: Entity): void;
}

/**
 * Type guard to check if an entity implements IDamageable
 */
export function isDamageable(target: any): target is IDamageable {
  return target && typeof target.takeDamage === 'function';
}