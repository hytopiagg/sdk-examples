import {
  ErrorHandler,
  Entity,
  QuaternionLike,
  Vector3Like,
  World
} from 'hytopia';

export type BaseItemOptions = {
  defaultRelativePositionAsChild?: Vector3Like;
  defaultRelativeRotationAsChild?: QuaternionLike;
  description?: string;
  iconImageUri: string;
  modelUri: string;
  modelScale?: number;
  name: string;
  quantity?: number;
  sellValue?: number;
  stackable?: boolean;
};

export default class BaseItem {
  public readonly defaultRelativePositionAsChild: Vector3Like;
  public readonly defaultRelativeRotationAsChild: QuaternionLike;
  public readonly description: string;
  public readonly iconImageUri: string;
  public readonly modelUri: string;
  public readonly modelScale: number;
  public readonly name: string;
  public readonly sellValue: number;
  public readonly stackable: boolean;

  private _entity: Entity | undefined;
  private _quantity: number = 1;

  public constructor(options: BaseItemOptions) {
    this.defaultRelativePositionAsChild = options.defaultRelativePositionAsChild ?? { x: 0, y: 0, z: 0 };
    this.defaultRelativeRotationAsChild = options.defaultRelativeRotationAsChild ?? { x: 0, y: 0, z: 0, w: 1 };
    this.description = options.description ?? '';
    this.iconImageUri = options.iconImageUri;
    this.modelUri = options.modelUri;
    this.modelScale = options.modelScale ?? 1;
    this.name = options.name;
    this.sellValue = options.sellValue ?? 0;
    this.stackable = options.stackable ?? false;

    if (this.stackable && options.quantity) {
      this._quantity = options.quantity;
    }
  }

  public get entity(): Entity | undefined { return this._entity; }
  public get quantity(): number { return this._quantity; }

  // If stackable (can have more than 1), adjust the quantity of the item.
  public adjustQuantity(quantity: number): void {
    if (!this.stackable) {
      return ErrorHandler.warning(`BaseItem.adjustQuantity(): Item ${this.name} is not stackable and cannot have a quantity.`);
    }
    
    this._quantity += quantity;
  }

  // Clone the item with optional overrides.
  public clone(overrideOptions?: Partial<BaseItemOptions>): BaseItem {
    return new BaseItem({
      defaultRelativePositionAsChild: this.defaultRelativePositionAsChild,
      defaultRelativeRotationAsChild: this.defaultRelativeRotationAsChild,
      description: this.description,
      iconImageUri: this.iconImageUri,
      modelUri: this.modelUri,
      modelScale: this.modelScale,
      name: this.name,
      quantity: this._quantity,
      stackable: this.stackable,
      ...overrideOptions,
    });
  }

  // Despawn the entity equivalent of the item from the world or parent entity.
  public despawnEntity(): void {
    if (!this._entity) return;
    this._entity.despawn();
    this._entity = undefined;
  }

  // Spawn the entity equivalent of the item in the world, such as a drop.
  public spawnEntity(world: World, position: Vector3Like, rotation?: QuaternionLike): void {
    if (!this._requireNotSpawned()) return;

    this._entity = new Entity({
      name: this.name,
      modelUri: this.modelUri,
      modelScale: this.modelScale,
    });

    this._entity.spawn(world, position, rotation);
  }

  // Spawn the entity equivalent of the item as a child of another entity, such as held by a player.
  public spawnEntityAsChild(parent: Entity, parentNodeName?: string, relativePosition?: Vector3Like, relativeRotation?: QuaternionLike): void {
    if (!this._requireNotSpawned()) return;

    this._entity = new Entity({
      name: this.name,
      modelUri: this.modelUri,
      modelScale: this.modelScale,
      parent: parent,
      parentNodeName: parentNodeName,
    });

    this._entity.spawn(
      parent.world!, // Entity constructor ensures parent is spawned.
      relativePosition ?? this.defaultRelativePositionAsChild,
      relativeRotation ?? this.defaultRelativeRotationAsChild,
    );
  }
  
  // Split stackable item into a new item have a specified quantity which is deducted from the current item.
  public splitStack(quantity: number): BaseItem | undefined {
    if (!this.stackable) {
      ErrorHandler.warning(`BaseItem.splitStack(): Item ${this.name} is not stackable and cannot be split.`);
      return undefined;
    }

    if (quantity <= 0 || quantity >= this._quantity) {
      ErrorHandler.warning(`BaseItem.splitStack(): Quantity must be greater than 0 and less than the current stack size (${this._quantity}).`);
      return undefined;
    }

    this._quantity -= quantity;

    return this.clone({ quantity });
  }

  // Helpers
  private _requireNotSpawned(): boolean {
    if (this._entity) {
      ErrorHandler.warning('BaseItem._requireNotSpawned(): Item is already spawned and must be despawned first.');
      return false;
    }

    return true;
  }
}