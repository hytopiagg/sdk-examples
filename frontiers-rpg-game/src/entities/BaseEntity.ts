import {
  Entity,
  EntityOptions,
  MoveOptions,
  PathfindingEntityController,
  PathfindingOptions,
  Quaternion,
  RigidBodyType,
  Vector3Like,
} from 'hytopia';

export type BaseEntityOptions = {
  controller?: PathfindingEntityController;
  facingAngle?: number;
  facingPosition?: Vector3Like;
  idleAnimations?: string[];
  idleAnimationSpeed?: number;
  moveAnimations?: string[];
  moveAnimationSpeed?: number;
  moveSpeed?: number;
  pushable?: boolean;
} & EntityOptions;

export type WanderOptions = {
  idleMinMs: number;
  idleMaxMs: number;
  moveOptions?: MoveOptions;
  pathfindOptions?: PathfindingOptions;
}

export default class BaseEntity extends Entity {
  private _moveSpeed: number;
  private _wanderAccumulatorMs: number = 0;
  
  public constructor(options: BaseEntityOptions) {
    super({
      ...options,
      controller: new PathfindingEntityController(),
      rigidBodyOptions: {
        ...options.rigidBodyOptions,
        type: RigidBodyType.DYNAMIC,
        enabledRotations: { x: false, y: true, z: false },
        rotation: Quaternion.fromEuler(0, options.facingAngle ?? 0, 0),
        additionalMass: !options.pushable ? 1000 : 0,
      }
    });

    this._moveSpeed = options.moveSpeed ?? 2;

    this.pathfindingController.idleLoopedAnimations = options.idleAnimations ?? [];
    this.pathfindingController.idleLoopedAnimationsSpeed = options.idleAnimationSpeed ?? undefined;
    this.pathfindingController.moveLoopedAnimations = options.moveAnimations ?? [];
    this.pathfindingController.moveLoopedAnimationsSpeed = options.moveAnimationSpeed ?? undefined;

    if (options.facingPosition) {
      this.pathfindingController.face(options.facingPosition, this._moveSpeed);
    }
  }

  public get idleAnimations(): string[] { return this.pathfindingController.idleLoopedAnimations; }
  public get idleAnimationsSpeed(): number | undefined { return this.pathfindingController.idleLoopedAnimationsSpeed; }
  public get moveAnimations(): string[] { return this.pathfindingController.moveLoopedAnimations; }
  public get moveAnimationsSpeed(): number | undefined { return this.pathfindingController.moveLoopedAnimationsSpeed; }
  public get moveSpeed(): number { return this._moveSpeed; }
  public get pathfindingController(): PathfindingEntityController { return this.controller as PathfindingEntityController; }

  public faceTowards(target: Vector3Like, faceSpeed: number) {
    this.pathfindingController.face(target, faceSpeed);
  }

  public jump(height: number) {
    this.pathfindingController.jump(height);
  }

  public pathfindTo(target: Vector3Like, speed: number = this._moveSpeed, options?: PathfindingOptions) {
    this.pathfindingController.pathfind(target, speed, options);
  }

  public moveTo(target: Vector3Like, speed: number = this._moveSpeed, options?: MoveOptions) {
    this.pathfindingController.move(target, speed, options);
  }

  public stopMoving() {
    // reset & cancels all movements.
    this.pathfindingController.pathfind(this.position, 1);
  }

  public wander(targets: Vector3Like[], speed: number = this._moveSpeed, options?: WanderOptions) {
    const randomIndex = Math.floor(Math.random() * targets.length);
    const target = targets[randomIndex];
    this.pathfindTo(target, speed, {
      debug: true,
      maxFall: 5,
      maxJump: 0,
      maxOpenSetIterations: 400,
      waypointTimeoutMs: 500,
      pathfindCompleteCallback: () => {
        setTimeout(() => this.wander(targets, speed, options), 2000);
      }
    });
    console.log('wandering to', target);
  }
}