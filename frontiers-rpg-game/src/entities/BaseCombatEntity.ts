import {
  BlockType,
  ColliderShape,
  CollisionGroup,
  Entity,
  EntityEvent,
  ErrorHandler,
  EventPayloads,
  QuaternionLike,
  Vector3Like,
  World,
} from 'hytopia';

const MOVEMENT_NOT_STUCK_DISTANCE_SQUARED = 3;

import BaseEntity, { BaseEntityOptions } from './BaseEntity';
import GamePlayerEntity from '../GamePlayerEntity';

export type BaseCombatEntityAttack = {
  animations: string[];
  damage: number;
  damageVariance?: number; // Percentage variance (0-1), e.g., 0.2 = ±20% damage
  damageDelayMs?: number; // When during animation to deal damage
  cooldownMs: number;
  range: number;
  reach: number;
  weight: number;
  onHit?: (target: BaseEntity | GamePlayerEntity, attacker: BaseCombatEntity) => void;
}

export type BaseCombatEntityOptions = {
  aggroRadius: number; 
  aggroRetargetIntervalMs?: number;
  aggroReturnToStart?: boolean;
  aggroSensorForwardOffset?: number;
  aggroTargetTypes?: (typeof BaseEntity | typeof GamePlayerEntity)[];
  attacks?: BaseCombatEntityAttack[];
  health: number;
} & BaseEntityOptions;

export default class BaseCombatEntity extends BaseEntity {
  private _aggroActiveTarget: BaseEntity | GamePlayerEntity | null = null;
  private _aggroPathfinding: boolean = false;
  private _aggroPathfindAccumulatorMs: number = 0;
  private _aggroPathfindLastPosition: Vector3Like | null = null;
  private _aggroPathfindIntervalMs: number = 2000;
  private _aggroPotentialTargets: Set<BaseEntity | GamePlayerEntity> = new Set();
  private _aggroPotentialTargetTypes: (typeof BaseEntity | typeof GamePlayerEntity)[];
  private _aggroRadius: number;
  private _aggroRetargetAccumulatorMs: number;
  private _aggroRetargetIntervalMs: number;
  private _aggroReturnToStart: boolean;
  private _aggroSensorForwardOffset: number;
  private _aggroStartPosition: Vector3Like | null = null;
  private _attacks: BaseCombatEntityAttack[];
  private _attackAccumulatorMs: number = 0;
  private _attackCooldownMs: number = 0;
  private _attackTotalWeight: number = 0;
  private _nextAttack: BaseCombatEntityAttack | null = null;

  constructor(options: BaseCombatEntityOptions) {
    super(options);

    this._aggroRadius = options.aggroRadius;
    this._aggroRetargetIntervalMs = options.aggroRetargetIntervalMs ?? 1000;
    this._aggroReturnToStart = options.aggroReturnToStart ?? false;
    this._aggroPotentialTargetTypes = options.aggroTargetTypes || [ GamePlayerEntity ];
    this._aggroSensorForwardOffset = options.aggroSensorForwardOffset ?? 0;
    this._attacks = options.attacks ?? [];
    this._attackTotalWeight = this._attacks.reduce((sum, attack) => sum + attack.weight, 0);
    
    this._nextAttack = this._pickRandomAttack();
    
    // Set accumulator to interval to trigger immediate target check on first tick
    this._aggroRetargetAccumulatorMs = this._aggroRetargetIntervalMs;

    // Validate attacks
    for (let i = 0; i < this._attacks.length; i++) {
      const attack = this._attacks[i];

      if (attack.weight < 0) {
        ErrorHandler.error(`BaseCombatEntity.constructor(): Attack at index ${i} has a negative weight!`);
      }

      if (attack.reach < attack.range) {
        ErrorHandler.error(`BaseCombatEntity.constructor(): Attack at index ${i} has a reach that is less than it's range!`);
      }
    }

    this.on(EntityEvent.TICK, this._onTick);
  }

  public attack() {
    if (!this._nextAttack || !this._aggroActiveTarget) return;
    
    const attack = this._nextAttack;
    const target = this._aggroActiveTarget;
    
    this.startModelOneshotAnimations(attack.animations);
    
    const damageDelay = attack.damageDelayMs ?? 0;
    
    setTimeout(() => {
      if (!target || !this._aggroPotentialTargets.has(target)) return;
      
      const distanceSquared = this._distanceSquaredToTarget(target);
      const reachSquared = attack.reach ** 2;
      
      if (distanceSquared <= reachSquared) { // make sure target is in reach still
        if ('takeDamage' in target && typeof target.takeDamage === 'function') {
          const damage = this._calculateDamageWithVariance(attack.damage, attack.damageVariance);
          target.takeDamage(damage);
        }
        
        if (attack.onHit) {
          attack.onHit(target, this);
        }
      }
    }, damageDelay);

    this._attackCooldownMs = this._nextAttack.cooldownMs;
    this._nextAttack = this._pickRandomAttack();
  }

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike): void {
    super.spawn(world, position, rotation);

    // Create the aggro sensor collider
    this.createAndAddChildCollider({
      shape: ColliderShape.BALL,
      radius: this._aggroRadius,
      collisionGroups: {
        belongsTo: [ CollisionGroup.ENTITY_SENSOR ],
        collidesWith: [ CollisionGroup.ENTITY ],
      },
      isSensor: true,
      tag: 'aggroSensor',
      relativePosition: { x: 0, y: 0, z: -this._aggroSensorForwardOffset },
      onCollision: (other: Entity | BlockType, started: boolean) => {
        for (const targetType of this._aggroPotentialTargetTypes) {
          if (other instanceof targetType) {
            started ? this._aggroPotentialTargets.add(other) : this._aggroPotentialTargets.delete(other);
          }
        }
      }
    });
  }
  
  private _calculateDamageWithVariance(baseDamage: number, variance?: number): number {
    if (!variance) return baseDamage;
    
    // variance of 0.2 means damage can be 80% to 120% of base damage
    const min = baseDamage * (1 - variance);
    const max = baseDamage * (1 + variance);
    
    return Math.floor(min + Math.random() * (max - min));
  }
  
  private _distanceSquaredBetweenPositions(currentPosition: Vector3Like, targetPosition: Vector3Like): number {
    const dx = targetPosition.x - currentPosition.x;
    const dy = targetPosition.y - currentPosition.y;
    const dz = targetPosition.z - currentPosition.z;

    return dx * dx + dy * dy + dz * dz;
  }

  private _distanceSquaredToTarget(target: BaseEntity | GamePlayerEntity): number {
    return this._distanceSquaredBetweenPositions(this.position, target.position);
  }

  private _findClosestAggroTarget(): BaseEntity | GamePlayerEntity | null {
    let closestTarget: BaseEntity | GamePlayerEntity | null = null;
    let closestDistanceSquared = Infinity;

    for (const target of this._aggroPotentialTargets) {
      const distanceSquared = this._distanceSquaredToTarget(target);

      if (distanceSquared < closestDistanceSquared) {
        closestDistanceSquared = distanceSquared;
        closestTarget = target;
      }
    }

    return closestTarget;
  }

  private _handleLostTarget(): void {
    this._aggroActiveTarget = null;

    if (this._aggroPotentialTargets.size === 0) {
      if (this._aggroReturnToStart && this._aggroStartPosition) {
        this.pathfindTo(this._aggroStartPosition, this.moveSpeed, {
          maxOpenSetIterations: 400,
          waypointTimeoutMs: 500,
        });
      } else {
        this.stopMoving();
      }
    }
  }

  private _onTick = (payload: EventPayloads[EntityEvent.TICK]): void => {
    const { tickDeltaMs } = payload;

    this._aggroPathfindAccumulatorMs += tickDeltaMs;
    this._aggroRetargetAccumulatorMs += tickDeltaMs;
    this._attackAccumulatorMs += tickDeltaMs;

    if (this._aggroRetargetAccumulatorMs >= this._aggroRetargetIntervalMs) {
      this._updateTargeting();
    }

    if (!this._aggroActiveTarget) return;

    const targetDistanceSquared = this._distanceSquaredToTarget(this._aggroActiveTarget);

    // Handle attacks if available
    if (this._nextAttack) {
      const attackRangeSquared = this._nextAttack.range ** 2;

      if (targetDistanceSquared <= attackRangeSquared && this._attackAccumulatorMs >= this._attackCooldownMs) {
        this._attackAccumulatorMs = 0;
        this.attack();
      }

      // Update movement strategy
      if (this._aggroPathfindAccumulatorMs >= this._aggroPathfindIntervalMs) {
        this._updateMovementStrategy(targetDistanceSquared);
      }

      if (!this._aggroPathfinding) {
        // Only move if not within attack range, but always face the target
        if (targetDistanceSquared > attackRangeSquared) {
          this.moveTo(this._aggroActiveTarget.position);
        } else {
          this.stopMoving();
        }
        this.faceTowards(this._aggroActiveTarget.position, this.moveSpeed * 2);
      }
    } else {
      // No attacks - just follow the target
      if (this._aggroPathfindAccumulatorMs >= this._aggroPathfindIntervalMs) {
        this._updateMovementStrategy(targetDistanceSquared);
      }

      if (!this._aggroPathfinding) {
        this.moveTo(this._aggroActiveTarget.position);
        this.faceTowards(this._aggroActiveTarget.position, this.moveSpeed * 2);
      }
    }
  }

  private _pickRandomAttack(): BaseCombatEntityAttack | null {
    if (this._attacks.length === 0) return null;

    // If all weights are 0, use uniform random selection
    if (this._attackTotalWeight === 0) {
      return this._attacks[Math.floor(Math.random() * this._attacks.length)];
    }

    const randomValue = Math.random() * this._attackTotalWeight;
    let cumulativeWeight = 0;

    for (const attack of this._attacks) {
      cumulativeWeight += attack.weight;
      if (randomValue <= cumulativeWeight) {
        return attack;
      }
    }

    // Fallback to last attack (should never reach here)
    return this._attacks[this._attacks.length - 1];
  }

  private _shouldSwitchTarget(newTarget: BaseEntity | GamePlayerEntity): boolean {
    if (!this._aggroActiveTarget) return true;
    if (!this._aggroPathfinding) return true; // Always switch when using simple movement
    
    return this._distanceSquaredToTarget(newTarget) * 2 < this._distanceSquaredToTarget(this._aggroActiveTarget);
  }

  private _updateMovementStrategy(targetDistanceSquared: number): void {
    this._aggroPathfindAccumulatorMs = 0;
    
    // Skip first check to establish baseline
    if (!this._aggroPathfindLastPosition) {
      this._aggroPathfindLastPosition = this.position;
      return;
    }
    
    const distanceMovedSquared = this._distanceSquaredBetweenPositions(this._aggroPathfindLastPosition, this.position);
    const isStuck = distanceMovedSquared < MOVEMENT_NOT_STUCK_DISTANCE_SQUARED;
    const notAtDestination = this._nextAttack ? targetDistanceSquared > this._nextAttack.range ** 2 : false;
    
    const shouldPathfind = isStuck && notAtDestination;
    
    if (shouldPathfind !== this._aggroPathfinding) {
      this._aggroPathfinding = shouldPathfind;
      if (shouldPathfind && this._aggroActiveTarget) {
        this.pathfindTo(this._aggroActiveTarget.position, this.moveSpeed, { waypointTimeoutMs: 500 });
      }
    }
    
    this._aggroPathfindLastPosition = this.position;
  }

  private _updateTargeting(): void {
    // Reset accumulator only if we have potential targets
    if (this._aggroPotentialTargets.size > 0) {
      this._aggroRetargetAccumulatorMs = 0;
    }
    
    // Handle lost target
    if (this._aggroActiveTarget && !this._aggroPotentialTargets.has(this._aggroActiveTarget)) {
      this._handleLostTarget();
    }
    
    // Find and evaluate new target
    const newTarget = this._findClosestAggroTarget();
    
    // Set start position on initial aggro
    if (newTarget && !this._aggroActiveTarget) {
      this._aggroStartPosition = this.position;
    }
    
    // Switch to better target if available
    if (newTarget && this._shouldSwitchTarget(newTarget)) {
      this._aggroActiveTarget = newTarget;
      this._aggroPathfinding = false;
    }
  }  
}