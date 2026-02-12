import {
  Audio,
  BaseEntityController,
  ColliderShape,
  CoefficientCombineRule,
  CollisionGroup,
  Entity,
  EntityEvent,
  EntityModelAnimationLoopMode,
  ErrorHandler,
  PlayerEntity,
  BlockType,
} from 'hytopia';

import type {
  PlayerInput,
  PlayerCameraOrientation,
  Vector3Like,
} from 'hytopia';

/** Options for creating a MyEntityController instance. @public */
export interface MyEntityControllerOptions {
  /** Whether to apply directional rotations to the entity while moving, defaults to true. */
  applyDirectionalMovementRotations?: boolean;

  /** Whether to automatically cancel left click input after first processed tick, defaults to true. */
  autoCancelMouseLeftClick?: boolean;

  /** A function allowing custom logic to determine if the entity can jump. */
  canJump?: () => boolean;

  /** A function allowing custom logic to determine if the entity can run. */
  canRun?: () => boolean;

  /** A function allowing custom logic to determine if the entity can swim. */
  canSwim?: () => boolean;
  
  /** A function allowing custom logic to determine if the entity can walk. */
  canWalk?: () => boolean;

  /** Whether the entity rotates to face the camera direction when idle. */
  facesCameraWhenIdle?: boolean;

  /** Overrides the animation(s) that will play when the entity is idle. */
  idleLoopedAnimations?: string[];

  /** Overrides the animation(s) that will play when the entity interacts (left click) */
  interactOneshotAnimations?: string[];

  /** Overrides the animation(s) that will play when the entity is jumping. */
  jumpOneshotAnimations?: string[];

  /** Overrides the animation(s) that will play when the entity lands with a high velocity. */
  jumpLandHeavyOneshotAnimations?: string[];
  
  /** Overrides the animation(s) that will play when the entity lands after jumping or being airborne. */
  jumpLandLightOneshotAnimations?: string[];

  /** The upward velocity applied to the entity when it jumps. */
  jumpVelocity?: number;

  /** The normalized horizontal velocity applied to the entity when it runs. */
  runVelocity?: number;

  /** Overrides the animation(s) that will play when the entity is running. */
  runLoopedAnimations?: string[];

  /** Whether the entity sticks to platforms, defaults to true. */
  sticksToPlatforms?: boolean;

  /** The normalized horizontal velocity applied to the entity when it swims fast (equivalent to running). */
  swimFastVelocity?: number;

  /** The gravity modifier applied to the entity when swimming. */
  swimGravity?: number;

  /** The maximum downward velocity that the entity can reach when affected by gravity while swimming. */
  swimMaxGravityVelocity?: number;

  /** The looped animation(s) that will play when the entity is swimming in any direction. */
  swimLoopedAnimations?: string[];

  /** The looped animation(s) that will play when the entity is not moving while swimming. */
  swimIdleLoopedAnimations?: string[];

  /** The normalized horizontal velocity applied to the entity when it swims slowly (equivalent to walking). */
  swimSlowVelocity?: number;

  /** The upward velocity applied to the entity when swimming. */
  swimUpwardVelocity?: number;

  /** Overrides the animation(s) that will play when the entity is walking. */
  walkLoopedAnimations?: string[];

  /** The normalized horizontal velocity applied to the entity when it walks. */
  walkVelocity?: number;
}

export default class MyEntityController extends BaseEntityController {
  // These constants are based on a model scale of 1, and will scale relative to the entity.modelScale
  private static readonly BASE_ENTITY_HEIGHT = 1.5;
  private static readonly GROUND_SENSOR_HEIGHT_SCALE = 0.125;
  private static readonly GROUND_SENSOR_RADIUS_SCALE = 0.23;
  private static readonly JUMP_LAND_HEAVY_VELOCITY_THRESHOLD = -12;
  private static readonly WALL_COLLIDER_HEIGHT_SCALE = 0.33;
  private static readonly WALL_COLLIDER_RADIUS_SCALE = 0.40;

  // Movement rotation lookup (static to avoid per-tick allocation)
  private static readonly MOVEMENT_ROTATIONS: Record<string, number> = {
    'wa': Math.PI / 4,
    'wd': -Math.PI / 4,
    'sa': Math.PI - Math.PI / 4,
    'sd': Math.PI + Math.PI / 4,
    's': Math.PI,
    'asd': Math.PI, // Special case for a+s+d without w
    'a': Math.PI / 2,
    'd': -Math.PI / 2,
  };

  // Physics constants
  private static readonly EXTERNAL_IMPULSE_DECAY_RATE = 0.253;
  private static readonly SWIM_UPWARD_COOLDOWN_MS = 600;
  private static readonly SWIMMING_DRAG_FACTOR = 0.05;
  private static readonly WATER_ENTRY_SINKING_FACTOR = 0.8;
  private static readonly WATER_ENTRY_SINKING_MS = 250;

  /** Whether to apply directional rotations to the entity while moving, defaults to true. */
  public applyDirectionalMovementRotations: boolean = true;

  /** Whether to automatically cancel left click input after first processed tick, defaults to true. */
  public autoCancelMouseLeftClick: boolean = true;

  /**
   * A function allowing custom logic to determine if the entity can jump.
   * @param controller - The default player entity controller instance.
   * @returns Whether the entity of the entity controller can jump.
   */
  public canJump: (controller: MyEntityController) => boolean = () => true;

  /**
   * A function allowing custom logic to determine if the entity can run.
   * @param controller - The default player entity controller instance.
   * @returns Whether the entity of the entity controller can run.
   */
  public canRun: (controller: MyEntityController) => boolean = () => true;

  /**
   * A function allowing custom logic to determine if the entity can swim.
   * @param controller - The default player entity controller instance.
   * @returns Whether the entity of the entity controller can swim.
   */
  public canSwim: (controller: MyEntityController) => boolean = () => true;
  
  /**
   * A function allowing custom logic to determine if the entity can walk.
   * @param controller - The default player entity controller instance.
   * @returns Whether the entity of the entity controller can walk.
   */
  public canWalk: (controller: MyEntityController) => boolean = () => true;

  /** Whether the entity rotates to face the camera direction when idle. When `true`, the entity always faces the camera direction. When `false`, the entity only rotates while actively moving. */
  public facesCameraWhenIdle: boolean = false;

  /** The looped animation(s) that will play when the entity is idle. */
  public idleLoopedAnimations: string[] = [ 'idle-upper', 'idle-lower' ];

  /** The oneshot animation(s) that will play when the entity interacts (left click) */
  public interactOneshotAnimations: string[] = [ 'simple-interact' ];

  /** The oneshot animation(s) that will play when the entity lands with a high velocity. */
  public jumpLandHeavyOneshotAnimations: string[] = [ 'jump-post-heavy' ];

  /** The oneshot animation(s) that will play when the entity lands after jumping or being airborne. */
  public jumpLandLightOneshotAnimations: string[] = [ 'jump-post-light' ];

  /** The oneshot animation(s) that will play when the entity is jumping. */
  public jumpOneshotAnimations: string[] = [ 'jump-loop' ];

  /** The upward velocity applied to the entity when it jumps. */
  public jumpVelocity: number = 10;

  /** The looped animation(s) that will play when the entity is running. */
  public runLoopedAnimations: string[] = [ 'run-upper', 'run-lower' ];

  /** The normalized horizontal velocity applied to the entity when it runs. */
  public runVelocity: number = 8;

  /** Whether the entity sticks to platforms. */
  public sticksToPlatforms: boolean = true;

  /** The normalized horizontal velocity applied to the entity when it swims fast (equivalent to running). */
  public swimFastVelocity: number = 5;

  /** The gravity modifier applied to the entity when swimming. */
  public swimGravity: number = 0;

  /** The looped animation(s) that will play when the entity is not moving while swimming. */
  public swimIdleLoopedAnimations: string[] = [ 'swim-idle' ];

  /** The looped animation(s) that will play when the entity is swimming in any direction. */
  public swimLoopedAnimations: string[] = [ 'swim-forward' ];

  /** The maximum downward velocity that the entity can reach when affected by gravity while swimming. */
  public swimMaxGravityVelocity: number = -1;

  /** The normalized horizontal velocity applied to the entity when it swims slowly (equivalent to walking). */
  public swimSlowVelocity: number = 3;

  /** The upward velocity applied to the entity when swimming. */
  public swimUpwardVelocity: number = 2;

  /** The looped animation(s) that will play when the entity is walking. */
  public walkLoopedAnimations: string[] = [ 'walk-upper', 'walk-lower' ];

  /** The normalized horizontal velocity applied to the entity when it walks. */
  public walkVelocity: number = 4;

  /** @internal */
  private readonly _externalVelocity = { x: 0, y: 0, z: 0 };

  /** @internal */
  private _magnitudeYTracker: number = 0;

  /** @internal */
  private _groundContactCount: number = 0;

  /** @internal */
  private _internalApplyImpulse: (impulse: Vector3Like) => void = () => {};

  /** @internal */
  private _isActivelyMoving: boolean = false;

  /** @internal */
  private _isFullySubmerged: boolean = false;

  /** @internal */
  private _justSubmergedUntil: number = 0;

  /** @internal */
  private _liquidContactCount: number = 0;

  /** @internal */
  private _platform: Entity | undefined;

  /** @internal - Reusable vector for impulse calculation to avoid per-tick allocation */
  private readonly _reusableImpulse = { x: 0, y: 0, z: 0 };

  /** @internal - Reusable vector for platform velocity fallback to avoid per-tick allocation */
  private readonly _reusablePlatformVelocity = { x: 0, y: 0, z: 0 };

  /** @internal - Reusable vector for target velocities to avoid per-tick allocation */
  private readonly _reusableTargetVelocities = { x: 0, y: 0, z: 0 };

  /** @internal - Reusable vector for velocity clamping to avoid per-tick allocation */
  private readonly _reusableVelocityClamp = { x: 0, y: 0, z: 0 };

  /** @internal */
  private _stepAudio: Audio | undefined;

  /** @internal */
  private _swimUpwardCooldownAt: number = 0;

  /**
   * @param options - Options for the controller.
   */
  public constructor(options: MyEntityControllerOptions = {}) {
    super();

    // Basic behavior options
    this.applyDirectionalMovementRotations = options.applyDirectionalMovementRotations ?? this.applyDirectionalMovementRotations;
    this.autoCancelMouseLeftClick = options.autoCancelMouseLeftClick ?? this.autoCancelMouseLeftClick;
    this.facesCameraWhenIdle = options.facesCameraWhenIdle ?? this.facesCameraWhenIdle;
    this.sticksToPlatforms = options.sticksToPlatforms ?? this.sticksToPlatforms;

    // Capability functions
    this.canJump = options.canJump ?? this.canJump;
    this.canRun = options.canRun ?? this.canRun;
    this.canSwim = options.canSwim ?? this.canSwim;
    this.canWalk = options.canWalk ?? this.canWalk;

    // Movement velocities
    this.jumpVelocity = options.jumpVelocity ?? this.jumpVelocity;
    this.runVelocity = options.runVelocity ?? this.runVelocity;
    this.walkVelocity = options.walkVelocity ?? this.walkVelocity;
    this.swimFastVelocity = options.swimFastVelocity ?? this.swimFastVelocity;
    this.swimSlowVelocity = options.swimSlowVelocity ?? this.swimSlowVelocity;
    this.swimUpwardVelocity = options.swimUpwardVelocity ?? this.swimUpwardVelocity;

    // Swimming physics
    this.swimGravity = options.swimGravity ?? this.swimGravity;
    this.swimMaxGravityVelocity = options.swimMaxGravityVelocity ?? this.swimMaxGravityVelocity;

    // Animation overrides
    this.idleLoopedAnimations = options.idleLoopedAnimations ?? this.idleLoopedAnimations;
    this.interactOneshotAnimations = options.interactOneshotAnimations ?? this.interactOneshotAnimations;
    this.jumpOneshotAnimations = options.jumpOneshotAnimations ?? this.jumpOneshotAnimations;
    this.jumpLandHeavyOneshotAnimations = options.jumpLandHeavyOneshotAnimations ?? this.jumpLandHeavyOneshotAnimations;
    this.jumpLandLightOneshotAnimations = options.jumpLandLightOneshotAnimations ?? this.jumpLandLightOneshotAnimations;
    this.runLoopedAnimations = options.runLoopedAnimations ?? this.runLoopedAnimations;
    this.swimLoopedAnimations = options.swimLoopedAnimations ?? this.swimLoopedAnimations;
    this.swimIdleLoopedAnimations = options.swimIdleLoopedAnimations ?? this.swimIdleLoopedAnimations;
    this.walkLoopedAnimations = options.walkLoopedAnimations ?? this.walkLoopedAnimations;
  }

  /** Whether the entity is moving from player inputs. */
  public get isActivelyMoving(): boolean { return this._isActivelyMoving; }

  /** Whether the entity is grounded. */
  public get isGrounded(): boolean { return this._groundContactCount > 0; }

  /** Whether the entity is on a platform, a platform is any entity with a kinematic rigid body. */
  public get isOnPlatform(): boolean { return !!this._platform; }

  /** Whether the entity is swimming, this is determined by if the entity is in a liquid block. */
  public get isSwimming(): boolean { return this._liquidContactCount > 0; }

  /** The platform the entity is on, if any. */
  public get platform(): Entity | undefined { return this._platform; }

  /**
   * Called when the controller is attached to an entity.
   * @param entity - The entity to attach the controller to.
   */
  public override attach(entity: Entity) {
    super.attach(entity);
   
    // Alter applyImpulse to handle external velocities within internal movement velocity conflicts.
    this._internalApplyImpulse = entity.applyImpulse.bind(entity);
    entity.applyImpulse = (impulse: Vector3Like) => {
      // Convert impulses to velocity (impulse = mass * velocity)
      const mass = entity.mass || 1;
      this._externalVelocity.x += impulse.x / mass;
      this._externalVelocity.y += impulse.y / mass;
      this._externalVelocity.z += impulse.z / mass;
    };

    this._stepAudio = new Audio({
      uri: 'audio/sfx/step/stone/stone-step-04.mp3',
      loop: true,
      volume: 0.1,
      referenceDistance: 2,
      cutoffDistance: 15,
      attachedToEntity: entity,
    });

    entity.setCcdEnabled(true);
    entity.lockAllRotations(); // prevent physics from applying rotation to the entity, we can still explicitly set it.
    
    // Handle swimming when in contact with a liquid block
    entity.on(EntityEvent.BLOCK_COLLISION, ({ blockType, started }) => {
      if (!blockType.isLiquid || !this.canSwim(this)) {
        return;
      }

      // Slow the linear velocity of the entity when 
      // first entering the liquid to feel more natural
      if (this._liquidContactCount <= 0 && started) {
        const currentLinearVelocity = entity.linearVelocity;
        entity.setLinearVelocity({
          x: currentLinearVelocity.x * this.swimGravity,
          y: currentLinearVelocity.y * this.swimGravity,
          z: currentLinearVelocity.z * this.swimGravity,
        });
      }

      this._liquidContactCount += started ? 1 : -1;

      if (this._liquidContactCount > 0) {
        entity.setGravityScale(this.swimGravity);
        entity.stopAllModelAnimations(a => this.swimLoopedAnimations.includes(a.name));
        this._swimUpwardCooldownAt = performance.now() + MyEntityController.SWIM_UPWARD_COOLDOWN_MS;
      } else {
        entity.setGravityScale(1);
        entity.stopModelAnimations(this.swimLoopedAnimations);
      }
    });
  }

  /**
   * Called when the controlled entity is spawned.
   * In DefaultPlayerEntityController, this function is used to create
   * the colliders for the entity for wall and ground detection.
   * @param entity - The entity that is spawned.
   */
  public spawn(entity: Entity): void {
    if (!entity.isSpawned) {
      return ErrorHandler.error('MyEntityController.spawn(): Entity is not spawned!');
    }

    // Ground sensor
    entity.createAndAddChildCollider({
      shape: ColliderShape.CYLINDER,
      radius: MyEntityController.GROUND_SENSOR_RADIUS_SCALE * (entity.height / MyEntityController.BASE_ENTITY_HEIGHT),
      halfHeight: MyEntityController.GROUND_SENSOR_HEIGHT_SCALE * (entity.height / MyEntityController.BASE_ENTITY_HEIGHT),
      collisionGroups: {
        belongsTo: [ CollisionGroup.ENTITY_SENSOR ],
        collidesWith: [ CollisionGroup.BLOCK, CollisionGroup.ENTITY, CollisionGroup.ENVIRONMENT_ENTITY ],
      },
      isSensor: true,
      relativePosition: { x: 0, y: -entity.height / 2, z: 0 },
      tag: 'groundSensor',
      onCollision: (_other: BlockType | Entity, started: boolean) => {
        if (!entity.isSpawned) { return; }
        
        // Ground contact
        if (!(_other instanceof BlockType) || !_other.isLiquid) {
          // Landing detection: check before updating ground count
          if (started && this._groundContactCount === 0 && entity.linearVelocity.y < -1) {
            if (entity.linearVelocity.y < MyEntityController.JUMP_LAND_HEAVY_VELOCITY_THRESHOLD) {
              for (const n of this.jumpLandHeavyOneshotAnimations) { entity.getModelAnimation(n)?.restart(); }
            } else {
              for (const n of this.jumpLandLightOneshotAnimations) { entity.getModelAnimation(n)?.restart(); }
            }
          }

          this._groundContactCount += started ? 1 : -1;
        }
  
        if (!this._groundContactCount && !this.isSwimming) {
          for (const n of this.jumpOneshotAnimations) { entity.getModelAnimation(n)?.restart(); }
        } else {
          entity.stopModelAnimations(this.jumpOneshotAnimations);
        }

        // Platform contact
        if (!(_other instanceof Entity)) return;
        
        if (started && this.sticksToPlatforms) {
          this._platform = _other;
        } else if (_other === this._platform && !started) {
          this._platform = undefined;
        }
      },
    });

    // Wall collider
    entity.createAndAddChildCollider({
      shape: ColliderShape.CAPSULE,
      halfHeight: MyEntityController.WALL_COLLIDER_HEIGHT_SCALE * (entity.height / MyEntityController.BASE_ENTITY_HEIGHT),
      radius: MyEntityController.WALL_COLLIDER_RADIUS_SCALE * (entity.height / MyEntityController.BASE_ENTITY_HEIGHT),
      collisionGroups: {
        belongsTo: [ CollisionGroup.ENTITY_SENSOR ],
        collidesWith: [ CollisionGroup.BLOCK, CollisionGroup.ENTITY, CollisionGroup.ENVIRONMENT_ENTITY ],
      },
      friction: 0,
      frictionCombineRule: CoefficientCombineRule.Min,
      tag: 'wallCollider',
    });
  }

  /**
   * Ticks the player movement for the entity controller,
   * overriding the default implementation. If the entity to tick
   * is a child entity, only the event will be emitted but the default
   * movement logic will not be applied.
   * 
   * @param entity - The entity to tick.
   * @param input - The current input state of the player.
   * @param cameraOrientation - The current camera orientation state of the player.
   * @param deltaTimeMs - The delta time in milliseconds since the last tick.
   */
  public tickWithPlayerInput(entity: PlayerEntity, input: PlayerInput, cameraOrientation: PlayerCameraOrientation, deltaTimeMs: number) {
    if (!entity.isSpawned || !entity.world) return;

    super.tickWithPlayerInput(entity, input, cameraOrientation, deltaTimeMs);
    if (entity.parent) return;

    // Input and state setup
    const { w, a, s, d, c, sp, sh, ml, jd } = input;
    const { yaw } = cameraOrientation;
    const currentVelocity = entity.linearVelocity;

    // Reset reusable target velocities
    this._reusableTargetVelocities.x = 0;
    this._reusableTargetVelocities.y = 0;
    this._reusableTargetVelocities.z = 0;
    
    const hasJoystickInput = typeof jd === 'number';
    this._isActivelyMoving = hasJoystickInput || !!(w || a || s || d);
    const isFastMovement = sh;
    const hasConflictingInputs = !hasJoystickInput && ((a && d && !w && !s) || (w && s && !a && !d));
    const canMove = (isFastMovement && this.canRun(this)) || (!isFastMovement && this.canWalk(this));

    // Update swimming state and handle water entry sinking
    if (this.isSwimming && !this._isFullySubmerged) {
      this._isFullySubmerged = true;
      this._justSubmergedUntil = performance.now() + MyEntityController.WATER_ENTRY_SINKING_MS;
    } else if (!this.isSwimming) {
      this._isFullySubmerged = false;
      this._justSubmergedUntil = 0;
    }

    // Handle movement animations and audio
    if (this.isGrounded && !this.isSwimming && this._isActivelyMoving && !hasConflictingInputs && canMove) {
      // Ground movement animations
      const animations = isFastMovement ? this.runLoopedAnimations : this.walkLoopedAnimations;
      entity.stopAllModelAnimations(a => animations.includes(a.name));
      for (const n of animations) { const a = entity.getModelAnimation(n); if (a) { a.setLoopMode(EntityModelAnimationLoopMode.LOOP); a.play(); } }
      this._stepAudio?.setPlaybackRate(isFastMovement ? 0.75 : 0.51);
      this._stepAudio?.play(entity.world, !this._stepAudio?.isPlaying);
    } else if (this._isFullySubmerged && this.canSwim(this)) {
      this._stepAudio?.pause();
      if (this._isActivelyMoving) {
        entity.stopAllModelAnimations(a => this.swimLoopedAnimations.includes(a.name));
        for (const n of this.swimLoopedAnimations) { const a = entity.getModelAnimation(n); if (a) { a.setLoopMode(EntityModelAnimationLoopMode.LOOP); a.play(); } }
      } else {
        entity.stopAllModelAnimations(a => this.swimIdleLoopedAnimations.includes(a.name));
        for (const n of this.swimIdleLoopedAnimations) { const a = entity.getModelAnimation(n); if (a) { a.setLoopMode(EntityModelAnimationLoopMode.LOOP); a.play(); } }
      }
    } else {
      // Idle animations
      this._stepAudio?.pause();
      entity.stopAllModelAnimations(a => this.idleLoopedAnimations.includes(a.name));
      for (const n of this.idleLoopedAnimations) { const a = entity.getModelAnimation(n); if (a) { a.setLoopMode(EntityModelAnimationLoopMode.LOOP); a.play(); } }
    }

    // Calculate movement rotation for character facing (avoid string concatenation)
    let movementDiagonalRotation: number | undefined;
    if (this.applyDirectionalMovementRotations && canMove) {
      if (hasJoystickInput) {
        // Joystick: face the exact joystick direction
        movementDiagonalRotation = jd;
      } else {
        // WASD: use discrete directional rotations
        if (w && a && !d && !s) movementDiagonalRotation = MyEntityController.MOVEMENT_ROTATIONS.wa;
        else if (w && d && !a && !s) movementDiagonalRotation = MyEntityController.MOVEMENT_ROTATIONS.wd;
        else if (s && a && !w && !d) movementDiagonalRotation = MyEntityController.MOVEMENT_ROTATIONS.sa;
        else if (s && d && !w && !a) movementDiagonalRotation = MyEntityController.MOVEMENT_ROTATIONS.sd;
        else if ((s && !w && !a && !d) || (a && s && d && !w)) movementDiagonalRotation = MyEntityController.MOVEMENT_ROTATIONS.s;
        else if (a && !w && !s && !d) movementDiagonalRotation = MyEntityController.MOVEMENT_ROTATIONS.a;
        else if (d && !w && !a && !s) movementDiagonalRotation = MyEntityController.MOVEMENT_ROTATIONS.d;
      }
    }

    // Handle interaction input
    if (ml) {
      for (const n of this.interactOneshotAnimations) { entity.getModelAnimation(n)?.restart(); }
      input.ml = !this.autoCancelMouseLeftClick;
    }

    // Calculate horizontal movement velocities
    if (canMove) {
      const velocity = !this.isSwimming 
        ? isFastMovement ? this.runVelocity : this.walkVelocity
        : isFastMovement ? this.swimFastVelocity : this.swimSlowVelocity;

      if (hasJoystickInput) {
        // Joystick movement: exact direction relative to camera (jd: 0=forward)
        const movementAngle = yaw + jd;
        this._reusableTargetVelocities.x = -velocity * Math.sin(movementAngle);
        this._reusableTargetVelocities.z = -velocity * Math.cos(movementAngle);
      } else {
        // WASD movement: discrete directions relative to camera
        const sinYaw = Math.sin(yaw);
        const cosYaw = Math.cos(yaw);

        if (w) { this._reusableTargetVelocities.x -= velocity * sinYaw; this._reusableTargetVelocities.z -= velocity * cosYaw; }
        if (s) { this._reusableTargetVelocities.x += velocity * sinYaw; this._reusableTargetVelocities.z += velocity * cosYaw; }
        if (a) { this._reusableTargetVelocities.x -= velocity * cosYaw; this._reusableTargetVelocities.z += velocity * sinYaw; }
        if (d) { this._reusableTargetVelocities.x += velocity * cosYaw; this._reusableTargetVelocities.z -= velocity * sinYaw; }

        // Normalize diagonal movement to prevent speed boost
        const horizontalSpeed = Math.sqrt(this._reusableTargetVelocities.x * this._reusableTargetVelocities.x + this._reusableTargetVelocities.z * this._reusableTargetVelocities.z);
        if (horizontalSpeed > velocity) {
          const factor = velocity / horizontalSpeed;
          this._reusableTargetVelocities.x *= factor;
          this._reusableTargetVelocities.z *= factor;
        }
      }
    }

    // Handle swimming physics and vertical movement
    if (this.isSwimming) {
      // Clamp swimming velocities (avoid object spread allocation)
      if (currentVelocity.y < this.swimMaxGravityVelocity) {
        this._reusableVelocityClamp.x = currentVelocity.x;
        this._reusableVelocityClamp.y = this.swimMaxGravityVelocity;
        this._reusableVelocityClamp.z = currentVelocity.z;
        entity.setLinearVelocity(this._reusableVelocityClamp);
      }
      if (currentVelocity.y > this.swimUpwardVelocity * 2) {
        this._reusableVelocityClamp.x = currentVelocity.x;
        this._reusableVelocityClamp.y = this.swimUpwardVelocity * 2;
        this._reusableVelocityClamp.z = currentVelocity.z;
        entity.setLinearVelocity(this._reusableVelocityClamp);
      }

      // Handle diving and water entry sinking
      if (c) {
        this._reusableTargetVelocities.y = -this.swimUpwardVelocity;
      } else if (performance.now() < this._justSubmergedUntil) {
        this._reusableTargetVelocities.y = -this.swimUpwardVelocity * MyEntityController.WATER_ENTRY_SINKING_FACTOR;
      } else if (!sp) {
        this._reusableTargetVelocities.y = -currentVelocity.y * MyEntityController.SWIMMING_DRAG_FACTOR;
      }
    }

    // Handle jumping and swimming upward
    if (sp && this.canJump(this)) {
      if (this.isGrounded && !this.isSwimming && currentVelocity.y > -0.001 && currentVelocity.y <= 3) {
        this._reusableTargetVelocities.y = this.jumpVelocity;
      } else if (this.isSwimming && performance.now() > this._swimUpwardCooldownAt) {
        this._reusableTargetVelocities.y = this.swimUpwardVelocity;
      }
    }

    // Apply physics impulses (avoid platform velocity object allocation)
    const platformVelocity = this._platform?.linearVelocity ?? this._reusablePlatformVelocity;

    if (this._externalVelocity.y !== 0) {
      this._magnitudeYTracker += this._externalVelocity.y;
    }
    
    // Process external impulses if they exist
    if (this._externalVelocity.x !== 0 || this._externalVelocity.y !== 0 || this._externalVelocity.z !== 0) {
      // Only decay horizontal impulses when grounded (physics doesn't decay horizontal velocity in air)
      if (this.isGrounded) {
        // Apply decay to external impulses while preserving direction
        const magnitude = Math.sqrt(
          this._externalVelocity.x * this._externalVelocity.x + 
          this._magnitudeYTracker * this._magnitudeYTracker +
          this._externalVelocity.z * this._externalVelocity.z,
        );
        
        if (magnitude > 0.01) {
          // Decay the magnitude
          const newMagnitude = Math.max(0, magnitude - MyEntityController.EXTERNAL_IMPULSE_DECAY_RATE);
          const scale = newMagnitude / magnitude;
          
          // Apply the scale to preserve direction
          this._externalVelocity.x *= scale;
          this._magnitudeYTracker *= scale;  // Also scale the Y tracker
          this._externalVelocity.z *= scale;
        } else {
          // Clear very small values
          this._externalVelocity.x = 0;
          this._externalVelocity.y = 0;
          this._magnitudeYTracker = 0;  // Clear the Y tracker
          this._externalVelocity.z = 0;
        }
      }
    }

    // Calculate total target velocity (player input + external + platform)
    const deltaX = this._reusableTargetVelocities.x + this._externalVelocity.x - currentVelocity.x + platformVelocity.x;
    const deltaY = this._reusableTargetVelocities.y + this._externalVelocity.y + platformVelocity.y;
    const deltaZ = this._reusableTargetVelocities.z + this._externalVelocity.z - currentVelocity.z + platformVelocity.z;

    this._externalVelocity.y = 0;

    if (deltaX !== 0 || deltaY !== 0 || deltaZ !== 0) {
      const mass = entity.mass;
      this._reusableImpulse.x = deltaX * mass;
      this._reusableImpulse.y = deltaY * mass;
      this._reusableImpulse.z = deltaZ * mass;
      this._internalApplyImpulse(this._reusableImpulse);
    }

    // Apply character rotation
    if (yaw !== undefined && (this.facesCameraWhenIdle || this.isActivelyMoving)) {
      const finalYaw = movementDiagonalRotation !== undefined ? yaw + movementDiagonalRotation : yaw;
      const halfFinalYaw = finalYaw * 0.5;
      
      entity.setRotation({
        x: 0,
        y: Math.sin(halfFinalYaw),
        z: 0,
        w: Math.cos(halfFinalYaw),
      });
    }
  }
}
