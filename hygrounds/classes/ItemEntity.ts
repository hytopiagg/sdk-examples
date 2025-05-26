import {
  Audio,
  Collider,
  CollisionGroup,
  Entity,
  EntityOptions,
  BlockEntityOptions,
  ModelEntityOptions,
  PlayerEntityController,
  QuaternionLike,
  SceneUI,
  Vector3Like,
  World,
  ErrorHandler,
} from 'hytopia';

import GamePlayerEntity from './GamePlayerEntity';
import { ITEM_DESPAWN_TIME_MS } from '../gameConfig';

const INVENTORIED_POSITION = { x: 0, y: -300, z: 0 };

export type HeldHand = 'left' | 'right' | 'both';

export type ItemEntityOptions = {
  heldHand: HeldHand;    // The hand the item is held in.
  iconImageUri: string;  // The image uri of the weapon icon.
  idleAnimation: string; // The animation played when the player holding it is idle.
  mlAnimation: string;   // The animation played when the player holding it clicks the left mouse button.
  quantity?: number;
  consumable?: boolean;
  consumeAudioUri?: string;
  consumeTimeMs?: number;
} & EntityOptions;

export default class ItemEntity extends Entity {
  public readonly consumable: boolean;
  public quantity: number;
  public readonly heldHand: HeldHand;
  public readonly iconImageUri: string;
  protected readonly consumeAudioUri: string | undefined;
  protected readonly consumeTimeMs: number;
  protected readonly idleAnimation: string;
  protected readonly mlAnimation: string;
  private _despawnTimer: NodeJS.Timeout | undefined;
  private readonly _labelSceneUI: SceneUI;

  public constructor(options: ItemEntityOptions) {
    const colliderOptions = 'modelUri' in options && options.modelUri
      ? Collider.optionsFromModelUri(options.modelUri)
      : 'blockHalfExtents' in options && options.blockHalfExtents
        ? Collider.optionsFromBlockHalfExtents(options.blockHalfExtents)
        : undefined;

    if (!colliderOptions) {
      ErrorHandler.fatalError('ItemEntity.constructor(): Item must be a model or block entity!');
    }

    super({
      ...options,
      parentNodeName: ItemEntity._getHandAnchorNode(options.heldHand),
      rigidBodyOptions: ItemEntity._createRigidBodyOptions(colliderOptions, 'modelScale' in options ? options.modelScale ?? 1 : 1),
    });

    this.consumable = options.consumable ?? false;
    this.consumeAudioUri = options.consumeAudioUri;
    this.consumeTimeMs = options.consumeTimeMs ?? 0;
    this.quantity = options.quantity ?? -1;
    this.heldHand = options.heldHand;
    this.iconImageUri = options.iconImageUri;
    this.idleAnimation = options.idleAnimation;
    this.mlAnimation = options.mlAnimation;

    this._labelSceneUI = this._createLabelUI();
      
    if (options.parent) {
      this.setParentAnimations();
    }
  }

  public consume(): void {
    if (!this.consumable || !this.consumeAudioUri || this.quantity <= 0 || !this.parent || !this.world) return;

    if (!(this.parent instanceof GamePlayerEntity)) {
      return;
    }

    this.parent.player.input.ml = false;

    this.quantity--;

    this.parent.updateItemInventoryQuantity(this);
    
    if (!this.quantity) {
      this.parent.dropActiveInventoryItem();
      setTimeout(() => {
        this.despawn();
        this.stopDespawnTimer();
      }, 0);
    }

    (new Audio({
      attachedToEntity: this,
      uri: this.consumeAudioUri,
      volume: 0.5,
      referenceDistance: 5,
      cutoffDistance: 15,
    })).play(this.world);

  }

  public drop(fromPosition: Vector3Like, direction: Vector3Like): void {
    if (!this.world) return;

    this.startDespawnTimer();

    this.setParent(undefined, undefined, fromPosition);

    // Apply impulse in next tick to avoid physics issues
    setTimeout(() => {
      this.applyImpulse({
        x: direction.x * this.mass * 7,
        y: direction.y * this.mass * 15,
        z: direction.z * this.mass * 7,
      });
    }, 0);

    this._updateVisualEffects();
  }

  public equip() {
    this.setPosition({ x: 0, y: 0, z: 0 });
    this.setParentAnimations();
  }

  public unequip() {
    this.setPosition(INVENTORIED_POSITION);

    if (this.parent instanceof GamePlayerEntity) {
      this.parent.resetAnimations();
    }
  }
  
  public getQuantity(): number {
    return this.quantity;
  }

  public pickup(player: GamePlayerEntity): void {
    if (!player.world) return;

    this.stopDespawnTimer();

    this.setParent(player, ItemEntity._getHandAnchorNode(this.heldHand), INVENTORIED_POSITION);
    this._updateVisualEffects();
    
    player.addItemToInventory(this);
  }

  public setParentAnimations(): void {
    if (!this.parent || !this.parent.world || !(this.parent instanceof GamePlayerEntity)) return;

    const controller = this.parent.controller as PlayerEntityController;
    controller.idleLoopedAnimations = [ this.idleAnimation, 'idle_lower' ];
    controller.walkLoopedAnimations = [ this.idleAnimation, 'walk_lower' ];
    controller.runLoopedAnimations = [ this.idleAnimation, 'run_lower' ];
  }

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike): void {
    super.spawn(world, position, rotation);
    this._updateVisualEffects(); 
  }

  public startDespawnTimer(): void {
    if (this._despawnTimer) return;

    this._despawnTimer = setTimeout(() => {
      if (this.isSpawned) {
        this.despawn();
      }
    }, ITEM_DESPAWN_TIME_MS);
  }

  public stopDespawnTimer(): void {
    if (!this._despawnTimer) return;

    clearTimeout(this._despawnTimer);
    this._despawnTimer = undefined;
  }

  private _createLabelUI(): SceneUI {
    return new SceneUI({
      attachedToEntity: this,
      templateId: 'item-label',
      state: { name: this.name, quantity: this.getQuantity() },
      viewDistance: 8,
      offset: { x: 0, y: 1, z: 0 },
    });
  }

  private _updateVisualEffects(): void {
    if (!this.world) return;

    if (!this.parent) {
      this._labelSceneUI.setState({ quantity: this.getQuantity() });
      this._labelSceneUI.load(this.world);
    } else {
      this._labelSceneUI.unload();
    }
  }

  private static _getHandAnchorNode(heldHand: HeldHand): string {
    return heldHand === 'left' ? 'hand_left_anchor' : 'hand_right_anchor';
  }

  private static _createRigidBodyOptions(colliderOptions: any, modelScale: number) {
    return {
      enabledRotations: { x: false, y: true, z: false },
      colliders: [{
        ...colliderOptions,
        collisionGroups: {
          belongsTo: [ CollisionGroup.ENTITY ],
          collidesWith: [ CollisionGroup.BLOCK ],
        },
        halfExtents: colliderOptions.halfExtents ? {
          x: colliderOptions.halfExtents.x * modelScale,
          y: colliderOptions.halfExtents.y * modelScale * 1.5,
          z: colliderOptions.halfExtents.z * modelScale,
        } : undefined,
        halfHeight: colliderOptions.halfHeight ? colliderOptions.halfHeight * modelScale * 1.5 : undefined,
        radius: colliderOptions.radius ? colliderOptions.radius * modelScale * 1.5 : undefined,
      }]
    };
  }
}