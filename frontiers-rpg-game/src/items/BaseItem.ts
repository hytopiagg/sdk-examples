import {
  Collider,
  ColliderShape,
  CollisionGroup,
  ErrorHandler,
  Entity,
  QuaternionLike,
  RgbColor,
  SceneUI,
  Vector3Like,
  World,
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

export type ItemRarity = 'common' | 'unusual' | 'rare' | 'epic' | 'legendary' | 'utopian';

export type BaseItemOptions = {
  buyPrice?: number;
  defaultRelativePositionAsChild?: Vector3Like;
  defaultRelativeRotationAsChild?: QuaternionLike;
  description?: string;
  iconImageUri: string;
  dropModelUri?: string;
  dropModelScale?: number;
  dropModelTintColor?: RgbColor;
  heldModelUri?: string;
  heldModelScale?: number;
  heldModelTintColor?: RgbColor;
  name: string;
  quantity?: number;
  rarity?: ItemRarity;
  sellPrice?: number;
  stackable?: boolean;
};

export default class BaseItem implements IInteractable {
  public readonly buyPrice: number | undefined;
  public readonly defaultRelativePositionAsChild: Vector3Like;
  public readonly defaultRelativeRotationAsChild: QuaternionLike | undefined;
  public readonly description: string;
  public readonly iconImageUri: string;
  public readonly dropModelUri: string | undefined;
  public readonly dropModelScale: number;
  public readonly dropModelTintColor: RgbColor | undefined;
  public readonly heldModelUri: string | undefined;
  public readonly heldModelScale: number;
  public readonly heldModelTintColor: RgbColor | undefined;
  public readonly name: string;
  public readonly rarity: ItemRarity;
  public readonly sellPrice: number;
  public readonly stackable: boolean;

  private _entity: BaseItemEntity | undefined;
  private _nameplateSceneUI: SceneUI | undefined;
  private _quantity: number = 1;

  public constructor(options: BaseItemOptions) {
    this.buyPrice = options.buyPrice;
    this.defaultRelativePositionAsChild = options.defaultRelativePositionAsChild ?? (!options.heldModelUri ? DEFAULT_MODEL_CHILD_RELATIVE_POSITION : { x: 0, y: 0, z: 0 });
    this.defaultRelativeRotationAsChild = options.defaultRelativeRotationAsChild;
    this.description = options.description ?? '';
    this.iconImageUri = options.iconImageUri;
    this.dropModelUri = options.dropModelUri;
    this.dropModelScale = options.dropModelScale ?? (!options.dropModelUri ? DEFAULT_MODEL_SCALE : 1);
    this.dropModelTintColor = options.dropModelTintColor;
    this.heldModelUri = options.heldModelUri;
    this.heldModelScale = options.heldModelScale ?? (!options.heldModelUri ? DEFAULT_MODEL_SCALE : 1);
    this.heldModelTintColor = options.heldModelTintColor;
    this.name = options.name;
    this.rarity = options.rarity ?? 'common';
    this.sellPrice = options.sellPrice ?? 1;
    this.stackable = options.stackable ?? false;

    if (this.stackable && options.quantity) {
      this._quantity = options.quantity;
    }
  }

  public get entity(): Entity | undefined { return this._entity; }
  public get quantity(): number { return this._quantity; }

  // If stackable (can have more than 1), adjust the quantity of the item.
  // Use this for spawned items (ground drops, held items) - updates nameplate only.
  // For inventory items, use inventory.adjustItemQuantity() to trigger UI updates.
  public adjustQuantity(quantity: number): void {
    if (!this.stackable) {
      return ErrorHandler.warning(`BaseItem.adjustQuantity(): Item ${this.name} is not stackable and cannot have a quantity.`);
    }
    
    this._quantity += quantity;
    this._updateNameplateSceneUI();
  }

  // Clone the item with optional overrides.
  public clone(overrideOptions?: Partial<BaseItemOptions>): BaseItem {
    return new BaseItem({
      defaultRelativePositionAsChild: this.defaultRelativePositionAsChild,
      defaultRelativeRotationAsChild: this.defaultRelativeRotationAsChild,
      description: this.description,
      iconImageUri: this.iconImageUri,
      dropModelUri: this.dropModelUri,
      dropModelScale: this.dropModelScale,
      dropModelTintColor: this.dropModelTintColor,
      heldModelUri: this.heldModelUri,
      heldModelScale: this.heldModelScale,
      heldModelTintColor: this.heldModelTintColor,
      name: this.name,
      quantity: this._quantity,
      stackable: this.stackable,
      ...overrideOptions,
    });
  }

  // Despawn the entity equivalent of the item from the world or parent entity.
  public despawnEntity(): void {
    if (!this._entity) return;

    this._nameplateSceneUI?.unload();
    this._nameplateSceneUI = undefined;

    this._entity.despawn();
    this._entity = undefined; 
  }

  public interact(playerEntity: GamePlayerEntity): void {
    const wouldAddToSelectedIndex = playerEntity.hotbar.wouldAddAtSelectedIndex(this);
    
    if (wouldAddToSelectedIndex) {
      this.despawnEntity(); // Must despawn first, since hotbar.addItem will trigger a held spawn when item added to selected index.
    }

    if (playerEntity.hotbar.addItem(this) || playerEntity.backpack.addItem(this)) {
      if (!wouldAddToSelectedIndex) {
        this.despawnEntity();
      }
    }
  }

  public setQuantity(quantity: number): void {
    if (!this.stackable && quantity > 1) {
      return ErrorHandler.warning(`BaseItem.setQuantity(): Item ${this.name} is not stackable and cannot have a quantity.`);
    }

    this._quantity = quantity;
    this._updateNameplateSceneUI();
  }

  // Spawn the entity equivalent of the item in the world, such as a drop.
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
        colliders: [ // 2x the collider scale for easier interacts
          Collider.optionsFromModelUri(modelUri, this.dropModelScale * 4, ColliderShape.BLOCK)
        ],
      },
    });

    this._entity.spawn(world, position, rotation);
    this._loadNameplateSceneUI();
    this._afterSpawn();
  }

  // Spawn the entity equivalent of the item as a child held by another entity, such as held by a player.
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

    this._entity.spawn(
      parent.world!, // Entity constructor ensures parent is spawned.
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
  
  // Split stackable item into a new item have a specified quantity which is deducted from the current item.
  public splitStack(newStackQuantity: number): BaseItem | undefined {
    if (!this.stackable) {
      ErrorHandler.warning(`BaseItem.splitStack(): Item ${this.name} is not stackable and cannot be split.`);
      return undefined;
    }

    if (newStackQuantity <= 0 || newStackQuantity >= this._quantity) {
      ErrorHandler.warning(`BaseItem.splitStack(): Quantity must be greater than 0 and less than the current stack size (${this._quantity}).`);
      return undefined;
    }

    this.adjustQuantity(-newStackQuantity);

    return this.clone({ quantity: newStackQuantity });
  }

  public useMouseLeft(): void {
    // Default behavior: do nothing (for non-usable items), intended to be overridden by subclasses.
    // useMouseLeft() is called when item is selected in the hotbar and mouse left is clicked.
  }

  public useMouseRight(): void {
    // Default behavior: do nothing (for non-usable items), intended to be overridden by subclasses.
    // useMouseRight() is called when item is selected in the hotbar and mouse right is clicked.
  }

  // Helpers
  private _afterSpawn(): void {
    if (!this._entity) return;

    this._entity.setCollisionGroupsForSolidColliders({
      belongsTo: [ CustomCollisionGroup.ITEM ],
      collidesWith: [ CollisionGroup.BLOCK, CollisionGroup.ENVIRONMENT_ENTITY ],
    });
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
      ErrorHandler.warning('BaseItem._requireNotSpawned(): Item is already spawned and must be despawned first.');
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