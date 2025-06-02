import {
  Entity,
  EntityOptions,
  MoveOptions,
  PathfindingEntityController,
  PathfindingOptions,
  Quaternion,
  QuaternionLike,
  RigidBodyType,
  SceneUI,
  Vector3Like,
  World,
} from 'hytopia';

import BaseItem from '../items/BaseItem';

export type BaseEntityItemDrop = {
  item: BaseItem;
  maxQuantity?: number; // Alternative range vs quantity
  minQuantity?: number; // Alternative range vs quantity
  probability: number; // 0 - 1
  quantity?: number;
}

export type BaseEntityOptions = {
  controller?: PathfindingEntityController;
  deathAnimations?: string[];
  deathDespawnDelayMs?: number;
  deathItemDrops?: BaseEntityItemDrop[];
  facingAngle?: number;
  facingPosition?: Vector3Like;
  idleAnimations?: string[];
  idleAnimationSpeed?: number;
  health?: number;
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
  private _deathAnimations: string[];
  private _deathDespawnDelayMs: number;
  private _deathItemDrops: BaseEntityItemDrop[];
  private _dying: boolean = false;
  private _health: number;
  private _maxHealth: number;
  private _moveSpeed: number;
  private _nameplateSceneUI: SceneUI;
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

    this._deathAnimations = options.deathAnimations ?? [];
    this._deathDespawnDelayMs = options.deathDespawnDelayMs ?? 0;
    this._deathItemDrops = options.deathItemDrops ?? [];
    this._health = options.health ?? 100;
    this._maxHealth = this._health;
    this._moveSpeed = options.moveSpeed ?? 2;

    this.pathfindingController.idleLoopedAnimations = options.idleAnimations ?? [];
    this.pathfindingController.idleLoopedAnimationsSpeed = options.idleAnimationSpeed ?? undefined;
    this.pathfindingController.moveLoopedAnimations = options.moveAnimations ?? [];
    this.pathfindingController.moveLoopedAnimationsSpeed = options.moveAnimationSpeed ?? undefined;

    if (options.facingPosition) {
      this.pathfindingController.face(options.facingPosition, this._moveSpeed);
    }

    this._setupNameplateUI();

    setInterval(() => {
      this.takeDamage(10);
    }, 2000);
  }

  public get idleAnimations(): string[] { return this.pathfindingController.idleLoopedAnimations; }
  public get idleAnimationsSpeed(): number | undefined { return this.pathfindingController.idleLoopedAnimationsSpeed; }
  public get health(): number { return this._health; }
  public get maxHealth(): number { return this._maxHealth; }
  public get moveAnimations(): string[] { return this.pathfindingController.moveLoopedAnimations; }
  public get moveAnimationsSpeed(): number | undefined { return this.pathfindingController.moveLoopedAnimationsSpeed; }
  public get moveSpeed(): number { return this._moveSpeed; }
  public get pathfindingController(): PathfindingEntityController { return this.controller as PathfindingEntityController; }

  public die(): void {
    if (this._dying) return;

    this._dying = true;

    this.startModelOneshotAnimations(this._deathAnimations);
    this.dropItems();
    setTimeout(() => this.despawn(), this._deathDespawnDelayMs);
  }

  public dropItems(): void {
    if (!this._deathItemDrops || !this.world) return;

    for (const drop of this._deathItemDrops) {
      if (Math.random() > drop.probability) continue;
      
      // Set quantity
      const quantity = drop.quantity ?? Math.floor(Math.random() * (drop.maxQuantity ?? 1) + (drop.minQuantity ?? 1));
      drop.item.setQuantity(quantity);
      
      // Spawn item for pickup
      drop.item.spawnEntity(this.world, this.position);

      // Apply impulse to item to simulate being dropped
      if (drop.item.entity) {
        const mass = drop.item.entity.mass;
        drop.item.entity.applyImpulse({
          x: mass * (2 + Math.random() * 3),
          y: mass * 5,
          z: mass * (2 + Math.random() * 3),
        });
      }
    }
  }

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

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike) {
    super.spawn(world, position, rotation);
    this._nameplateSceneUI.load(world);
  }

  public stopMoving() {
    this.pathfindingController.stopFace();
    this.pathfindingController.stopMove();
  }

  public takeDamage(damage: number): void {
    this._health -= damage;

    this._nameplateSceneUI.setState({
      damage,
      health: this._health
    });

    if (this._health <= 0) {
      this.die();
    }
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

  protected _setupNameplateUI(): void {
    this._nameplateSceneUI = new SceneUI({
      attachedToEntity: this,
      offset: { x: 0, y: this.height - (this.height * 0.1), z: 0 },
      templateId: 'entity-nameplate',
      state: {
        name: this.name,
        health: this.health,
        maxHealth: this.maxHealth,
      },
    });
  }
}