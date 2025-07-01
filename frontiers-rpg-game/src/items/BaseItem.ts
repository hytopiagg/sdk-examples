import {
  Collider,
  ColliderShape,
  CollisionGroup,
  ErrorHandler,
  Entity,
  EntityEvent,
  QuaternionLike,
  RgbColor,
  SceneUI,
  Vector3Like,
  World,
  RigidBodyType,
} from 'hytopia';

import BaseItemEntity from '../entities/BaseItemEntity';
import CustomCollisionGroup from '../physics/CustomCollisionGroup';
import GamePlayerEntity from '../GamePlayerEntity';
import IInteractable from '../interfaces/IInteractable';

const DEFAULT_MODEL_CHILD_RELATIVE_POSITION = { x: -0.025, y: 0, z: -0.15 };
const DEFAULT_MODEL_URI = 'models/items/snowball.gltf';
const DEFAULT_MODEL_SCALE = 0.35;

export const RARITY_RGB_COLORS: Record<ItemRarity, RgbColor> = {
  common: { r: 225, g: 225, b: 225 },      // Light gray - subtle but visible
  unusual: { r: 115, g: 215, b: 115 },     // Soft green - not too bright
  rare: { r: 140, g: 190, b: 255 },        // Sky blue - easier on eyes
  epic: { r: 200, g: 120, b: 255 },        // Purple - classic epic color - 255, 100, 180
  legendary: { r: 255, g: 180, b: 50 },    // Golden orange - warm and premium - 255, 180, 50
  utopian: { r: 255, g: 70, b: 70 },     // Pink-red - unique and special
};

export enum BaseItemPlayerEvent {
  PICKED_UP = 'BaseItem.PICKED_UP',
}

export type BaseItemPlayerEventPayloads = {
  [BaseItemPlayerEvent.PICKED_UP]: { item: BaseItem };
}

export type ItemClass = typeof BaseItem;

export type ItemRarity = 'common' | 'unusual' | 'rare' | 'epic' | 'legendary' | 'utopian';

export type ItemOverrides = {
  quantity?: number;
};

export default abstract class BaseItem implements IInteractable {
  // Required static properties that subclasses MUST implement
  static readonly id: string;
  static readonly name: string;
  static readonly iconImageUri: string;
  
  // Optional static properties with defaults
  static readonly buyPrice?: number = undefined;
  static readonly description: string = '';
  static readonly dropModelUri?: string = undefined;
  static readonly dropModelScale: number = DEFAULT_MODEL_SCALE;
  static readonly dropModelTintColor?: RgbColor = undefined;
  static readonly heldModelUri?: string = undefined;
  static readonly heldModelScale: number = DEFAULT_MODEL_SCALE;
  static readonly heldModelTintColor?: RgbColor = undefined;
  static readonly defaultRelativePositionAsChild: Vector3Like = DEFAULT_MODEL_CHILD_RELATIVE_POSITION;
  static readonly defaultRelativeRotationAsChild?: QuaternionLike = undefined;
  static readonly rarity: ItemRarity = 'common';
  static readonly sellPrice: number = 1;
  static readonly statsHeader: string = '';
  static readonly statTexts: string[] = [];
  static readonly stackable: boolean = false;

  // Simple factory method
  static create(overrides?: ItemOverrides): BaseItem {
    const ItemClass = this as any;
    return new ItemClass(overrides);
  }



  // Instance properties (mostly delegate to static)
  public get id(): string { return (this.constructor as typeof BaseItem).id; }
  public get name(): string { return (this.constructor as typeof BaseItem).name; }
  public get iconImageUri(): string { return (this.constructor as typeof BaseItem).iconImageUri; }
  public get buyPrice(): number | undefined { return (this.constructor as typeof BaseItem).buyPrice; }
  public get description(): string { return (this.constructor as typeof BaseItem).description; }
  public get dropModelUri(): string | undefined { return (this.constructor as typeof BaseItem).dropModelUri; }
  public get dropModelScale(): number { return (this.constructor as typeof BaseItem).dropModelScale; }
  public get dropModelTintColor(): RgbColor | undefined { return (this.constructor as typeof BaseItem).dropModelTintColor; }
  public get heldModelUri(): string | undefined { return (this.constructor as typeof BaseItem).heldModelUri; }
  public get heldModelScale(): number { return (this.constructor as typeof BaseItem).heldModelScale; }
  public get heldModelTintColor(): RgbColor | undefined { return (this.constructor as typeof BaseItem).heldModelTintColor; }
  public get defaultRelativePositionAsChild(): Vector3Like { return (this.constructor as typeof BaseItem).defaultRelativePositionAsChild; }
  public get defaultRelativeRotationAsChild(): QuaternionLike | undefined { return (this.constructor as typeof BaseItem).defaultRelativeRotationAsChild; }
  public get rarity(): ItemRarity { return (this.constructor as typeof BaseItem).rarity; }
  public get sellPrice(): number { return (this.constructor as typeof BaseItem).sellPrice; }
  public get statsHeader(): string { return (this.constructor as typeof BaseItem).statsHeader; }
  public get statTexts(): string[] { return (this.constructor as typeof BaseItem).statTexts; }
  public get stackable(): boolean { return (this.constructor as typeof BaseItem).stackable; }

  // Instance-specific properties that can be overridden
  private _entity: BaseItemEntity | undefined;
  private _nameplateSceneUI: SceneUI | undefined;
  private _quantity: number = 1;

  public constructor(overrides?: ItemOverrides) {
    const staticClass = this.constructor as typeof BaseItem;
    
    if (staticClass.stackable && overrides?.quantity) {
      this._quantity = overrides.quantity;
    }
  }

  public get entity(): Entity | undefined { return this._entity; }
  public get quantity(): number { return this._quantity; }

  public adjustQuantity(quantity: number): void {
    if (!this.stackable) {
      return ErrorHandler.warning(`BaseItem.adjustQuantity(): Item ${this.name} is not stackable.`);
    }
    
    this._quantity += quantity;
    this._updateNameplateSceneUI();
  }

  public clone(overrides?: ItemOverrides): BaseItem {
    const ItemClass = this.constructor as any;
    return new ItemClass({
      quantity: this._quantity,
      ...overrides,
    });
  }

  public despawnEntity(): void {
    if (!this._entity) return;
    this._entity.despawn();
  }

  public interact(playerEntity: GamePlayerEntity): void {
    const wouldAddToSelectedIndex = playerEntity.gamePlayer.hotbar.wouldAddAtSelectedIndex(this);
    
    if (wouldAddToSelectedIndex) {
      this.despawnEntity();
    }

    if (playerEntity.gamePlayer.hotbar.addItem(this) || playerEntity.gamePlayer.backpack.addItem(this)) {
      if (!wouldAddToSelectedIndex) {
        this.despawnEntity();
      }

      playerEntity.gamePlayer.eventRouter.emit(BaseItemPlayerEvent.PICKED_UP, { item: this });
    }
  }

  public setQuantity(quantity: number): void {
    if (!this.stackable && quantity > 1) {
      return ErrorHandler.warning(`BaseItem.setQuantity(): Item ${this.name} is not stackable.`);
    }

    this._quantity = quantity;
    this._updateNameplateSceneUI();
  }

  public spawnEntityAsDrop(world: World, position: Vector3Like, rotation?: QuaternionLike): void {
    if (!this._requireNotSpawned()) return;

    const modelUri = this.dropModelUri ?? DEFAULT_MODEL_URI;

    this._entity = new BaseItemEntity({
      item: this,
      name: this.name,
      modelUri,
      modelScale: this.dropModelScale,
      tintColor: this.dropModelTintColor ?? RARITY_RGB_COLORS[this.rarity],
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        colliders: [
          Collider.optionsFromModelUri(modelUri, this.dropModelScale * 6, ColliderShape.BLOCK)
        ],
      },
    });

    this._entity.on(EntityEvent.DESPAWN, () => this._despawnCleanup())
    this._entity.spawn(world, position, rotation);
    this._loadNameplateSceneUI();
    this._afterSpawn();
  }

  public spawnEntityAsHeld(parent: Entity, parentNodeName?: string, relativePosition?: Vector3Like, relativeRotation?: QuaternionLike): void {
    if (!this._requireNotSpawned()) return;

    this._entity = new BaseItemEntity({
      item: this,
      name: this.name,
      modelUri: this.heldModelUri ?? DEFAULT_MODEL_URI,
      modelScale: this.heldModelScale,
      tintColor: this.heldModelTintColor ?? RARITY_RGB_COLORS[this.rarity],
      parent: parent,
      parentNodeName: parentNodeName,
    });

    this._entity.on(EntityEvent.DESPAWN, () => this._despawnCleanup())
    this._entity.spawn(
      parent.world!,
      relativePosition ?? this.defaultRelativePositionAsChild,
      relativeRotation ?? this.defaultRelativeRotationAsChild,
    );
    this._afterSpawn();
  }

  public spawnEntityAsEjectedDrop(world: World, position: Vector3Like, facingDirection?: Vector3Like): void {
    this.spawnEntityAsDrop(world, position);
    
    if (this.entity) {
      const mass = this.entity.mass;
      const angle = facingDirection 
        ? Math.atan2(facingDirection.z, facingDirection.x) + (Math.random() * Math.PI/2 - Math.PI/4)
        : Math.random() * Math.PI * 2;
      
      this.entity.applyImpulse({
        x: mass * Math.cos(angle) * 5,
        y: mass * 3.5,
        z: mass * Math.sin(angle) * 5,
      });
    }
  }
  
  public splitStack(newStackQuantity: number): BaseItem | undefined {
    if (!this.stackable) {
      ErrorHandler.warning(`BaseItem.splitStack(): Item ${this.name} is not stackable.`);
      return undefined;
    }

    if (newStackQuantity <= 0 || newStackQuantity >= this._quantity) {
      ErrorHandler.warning(`BaseItem.splitStack(): Invalid quantity.`);
      return undefined;
    }

    this.adjustQuantity(-newStackQuantity);
    return this.clone({ quantity: newStackQuantity });
  }

  public useMouseLeft(): void {
    // Override in subclasses for usable items
  }

  public useMouseRight(): void {
    // Override in subclasses for usable items
  }

  private _afterSpawn(): void {
    if (!this._entity) return;

    this._entity.setCollisionGroupsForSolidColliders({
      belongsTo: [ CustomCollisionGroup.ITEM ],
      collidesWith: [ CollisionGroup.BLOCK, CollisionGroup.ENVIRONMENT_ENTITY ],
    });
  }

  private _despawnCleanup(): void {
    this._nameplateSceneUI?.unload();
    this._nameplateSceneUI = undefined;
    this._entity = undefined; 
  }

  private _loadNameplateSceneUI(): void {
    if (this._nameplateSceneUI || !this._entity || !this._entity.world) return;

    this._nameplateSceneUI = new SceneUI({
      attachedToEntity: this._entity,
      offset: { x: 0, y: 0.45, z: 0 },
      templateId: 'item-nameplate',
      viewDistance: 8,
      state: {
        name: this.name,
        iconImageUri: this.iconImageUri,
        rarityColor: RARITY_RGB_COLORS[this.rarity],
        quantity: this.quantity,
      },
    });

    this._nameplateSceneUI.load(this._entity.world);
  }

  private _requireNotSpawned(): boolean {
    if (this._entity) {
      ErrorHandler.warning('BaseItem: Item is already spawned.');
      return false;
    }
    return true;
  }

  private _updateNameplateSceneUI(): void {
    if (!this._nameplateSceneUI) return;

    this._nameplateSceneUI.setState({
      quantity: this.quantity,
    })
  }
}