import {
  BlockType,
  ColliderShape,
  CollisionGroup,
  Entity,
  EntityEvent,
  EventPayloads,
  QuaternionLike,
  Vector3Like,
  World,
} from 'hytopia';

const MOVEMENT_NOT_STUCK_DISTANCE_SQUARED = 2.5;

import BaseEntity, { BaseEntityOptions } from './BaseEntity';
import GamePlayerEntity from '../GamePlayerEntity';

export type BaseEnemyEntityOptions = {
  aggroRadius?: number; 
  aggroRetargetIntervalMs?: number;
  aggroSensorForwardOffset?: number;
  aggroTargetTypes?: (typeof BaseEntity)[];
  attackAnimations?: string[];
  attackAnimationSpeed?: number;
  attackCooldownMs?: number;
  attackDamage?: number;
  attackRange?: number;
} & BaseEntityOptions;

export default class BaseEnemyEntity extends BaseEntity {
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
  private _aggroSensorForwardOffset: number;
  private _attackAnimations: string[];
  private _attackAnimationSpeed: number;
  private _attackCooldownMs: number;
  private _attackDamage: number;
  private _attackRangeSquared: number;

  constructor(options: BaseEnemyEntityOptions) {
    super(options);

    this._aggroRadius = options.aggroRadius ?? 7.5;
    this._aggroRetargetIntervalMs = options.aggroRetargetIntervalMs ?? 1000;
    this._aggroPotentialTargetTypes = options.aggroTargetTypes || [ GamePlayerEntity ];
    this._aggroSensorForwardOffset = options.aggroSensorForwardOffset ?? 6;
    this._attackAnimations = options.attackAnimations ?? [];
    this._attackAnimationSpeed = options.attackAnimationSpeed ?? 1;
    this._attackCooldownMs = options.attackCooldownMs ?? 1000;
    this._attackDamage = options.attackDamage ?? 10;
    this._attackRangeSquared = options.attackRange ? options.attackRange ** 2 : 3 * 2;
    
    // Set accumulator to interval to trigger immediate target check on first tick
    this._aggroRetargetAccumulatorMs = this._aggroRetargetIntervalMs;

    this.on(EntityEvent.TICK, this._onTick);
  }

  public attack() {

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

  private _onTick = (payload: EventPayloads[EntityEvent.TICK]): void => {
    const { tickDeltaMs } = payload;

    this._aggroPathfindAccumulatorMs += tickDeltaMs;
    this._aggroRetargetAccumulatorMs += tickDeltaMs;

    // Periodic target evaluation
    if (this._aggroRetargetAccumulatorMs >= this._aggroRetargetIntervalMs) {
      // Only reset accumulator if we have targets to evaluate
      if (this._aggroPotentialTargets.size > 0) {
        this._aggroRetargetAccumulatorMs = 0;
      }
      
      // Clean up invalid target
      if (this._aggroActiveTarget && !this._aggroPotentialTargets.has(this._aggroActiveTarget)) {
        this._aggroActiveTarget = null;
      }
      
      const newTarget = this._findClosestAggroTarget();
      const currentTargetDistance = this._aggroActiveTarget ? this._distanceSquaredToTarget(this._aggroActiveTarget) : Infinity;
      
      // Update target if better option available
      if (newTarget && (!this._aggroPathfinding || this._distanceSquaredToTarget(newTarget) * 2 < currentTargetDistance)) {
        this._aggroActiveTarget = newTarget;
        this._aggroPathfinding = false;
      } else if (!newTarget && this._aggroActiveTarget) {
        this._aggroActiveTarget = null;
        this._aggroPathfinding = false;
        this.stopMoving();
      }
    }

    if (!this._aggroActiveTarget) return;

    // Periodic movement strategy evaluation
    if (this._aggroPathfindAccumulatorMs >= this._aggroPathfindIntervalMs) {
      this._aggroPathfindAccumulatorMs = 0;
      
      const lastPos = this._aggroPathfindLastPosition || this.position;
      const distanceMovedSquared = this._distanceSquaredBetweenPositions(lastPos, this.position);
      const targetDistanceSquared = this._distanceSquaredToTarget(this._aggroActiveTarget);
      
      // Pathfind if stuck and not at destination
      const shouldPathfind = distanceMovedSquared < MOVEMENT_NOT_STUCK_DISTANCE_SQUARED && 
                           (targetDistanceSquared > this._attackRangeSquared || targetDistanceSquared > 1);
      
      if (shouldPathfind !== this._aggroPathfinding) {
        this._aggroPathfinding = shouldPathfind;
        if (shouldPathfind) {
          this.pathfindTo(this._aggroActiveTarget.position, this.moveSpeed, { waypointTimeoutMs: 500 });
        }
      }
      
      this._aggroPathfindLastPosition = { ...this.position };
    }

    // Apply simple movement when not pathfinding
    if (!this._aggroPathfinding) {
      this.moveTo(this._aggroActiveTarget.position);
      this.faceTowards(this._aggroActiveTarget.position, this.moveSpeed * 2);
    }
  }
}