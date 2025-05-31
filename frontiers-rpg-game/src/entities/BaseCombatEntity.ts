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

const MOVEMENT_NOT_STUCK_DISTANCE_SQUARED = 2.5;

import BaseEntity, { BaseEntityOptions } from './BaseEntity';
import GamePlayerEntity from '../GamePlayerEntity';

export type BaseCombatEntityOptions = {
  aggroRadius: number; 
  aggroRetargetIntervalMs?: number;
  aggroReturnToStart?: boolean;
  aggroSensorForwardOffset?: number;
  aggroTargetTypes?: (typeof BaseEntity | typeof GamePlayerEntity)[];
  attackAnimations: string[];
  attackCooldownMs: number;
  attackDamage: number;
  attackRange: number;
  attackReach: number;
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
  private _attackAccumulatorMs: number = 0;
  private _attackAnimations: string[];
  private _attackCooldownMs: number;
  private _attackDamage: number;
  private _attackRangeSquared: number;
  private _attackReachSquared: number;

  constructor(options: BaseCombatEntityOptions) {
    super(options);

    this._aggroRadius = options.aggroRadius;
    this._aggroRetargetIntervalMs = options.aggroRetargetIntervalMs ?? 1000;
    this._aggroReturnToStart = options.aggroReturnToStart ?? false;
    this._aggroPotentialTargetTypes = options.aggroTargetTypes || [ GamePlayerEntity ];
    this._aggroSensorForwardOffset = options.aggroSensorForwardOffset ?? 6;
    this._attackAnimations = options.attackAnimations;
    this._attackCooldownMs = options.attackCooldownMs;
    this._attackDamage = options.attackDamage;
    this._attackRangeSquared = options.attackRange ** 2;
    this._attackReachSquared = options.attackReach ** 2;
    
    // Set accumulator to interval to trigger immediate target check on first tick
    this._aggroRetargetAccumulatorMs = this._aggroRetargetIntervalMs;

    if (this._attackReachSquared < this._attackRangeSquared) {
      ErrorHandler.error('BaseCombatEntity.constructor(): Attack reach must be greater than attack range!');
    }

    this.on(EntityEvent.TICK, this._onTick);
  }

  public attack() {
    this.startModelOneshotAnimations(this._attackAnimations);
  }

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike): void {
    super.spawn(world, position, rotation);

    // Create the aggro sensor collider
    this.createAndAddChildCollider({
      shape: ColliderShape.CYLINDER,
      radius: this._aggroRadius,
      halfHeight: this.height,
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

    if (targetDistanceSquared <= this._attackRangeSquared && this._attackAccumulatorMs >= this._attackCooldownMs) {
      this._attackAccumulatorMs = 0;
      this.attack();
    }
    
    if (this._aggroPathfindAccumulatorMs >= this._aggroPathfindIntervalMs) {
      this._updateMovementStrategy(targetDistanceSquared);
    }

    if (!this._aggroPathfinding) {
      // Only move if not within attack range, but always face the target
      if (targetDistanceSquared > this._attackRangeSquared) {
        this.moveTo(this._aggroActiveTarget.position);
      } else {
        this.stopMoving();
      }
      this.faceTowards(this._aggroActiveTarget.position, this.moveSpeed * 2);
    }
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
    const notAtDestination = targetDistanceSquared > this._attackRangeSquared;
    
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