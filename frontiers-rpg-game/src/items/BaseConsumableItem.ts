import BaseItem, { ItemOverrides } from './BaseItem';
import GamePlayerEntity from '../GamePlayerEntity';

export type ConsumableOverrides = {
  consumeAnimations?: string[];
  consumeCooldownMs?: number;
  consumeRequiresDamaged?: boolean;
} & ItemOverrides;

export default abstract class BaseConsumableItem extends BaseItem {
  // Required static properties that consumable subclasses MUST implement
  static readonly consumeCooldownMs: number;
  
  // Optional static properties with defaults
  static readonly consumeAnimations: string[] = ['consume-upper'];
  static readonly consumeRequiresDamaged: boolean = false;

  // Simple factory method
  static create(overrides?: ConsumableOverrides): BaseConsumableItem {
    const ItemClass = this as any;
    return new ItemClass(overrides);
  }

  // Instance properties (delegate to static or use overrides)
  public get consumeAnimations(): string[] { 
    return this._consumeAnimations ?? (this.constructor as typeof BaseConsumableItem).consumeAnimations; 
  }
  public get consumeCooldownMs(): number { 
    return this._consumeCooldownMs ?? (this.constructor as typeof BaseConsumableItem).consumeCooldownMs; 
  }
  public get consumeRequiresDamaged(): boolean { 
    return this._consumeRequiresDamaged ?? (this.constructor as typeof BaseConsumableItem).consumeRequiresDamaged; 
  }

  // Instance-specific properties that can be overridden
  private readonly _consumeAnimations?: string[];
  private readonly _consumeCooldownMs?: number;
  private readonly _consumeRequiresDamaged?: boolean;
  private _lastConsumeTimeMs: number = 0;

  public constructor(overrides?: ConsumableOverrides) {
    super(overrides);
    
    this._consumeAnimations = overrides?.consumeAnimations;
    this._consumeCooldownMs = overrides?.consumeCooldownMs;
    this._consumeRequiresDamaged = overrides?.consumeRequiresDamaged;
  }

  public override clone(overrides?: ConsumableOverrides): BaseConsumableItem {
    const ConsumableClass = this.constructor as any;
    return new ConsumableClass({
      quantity: this.quantity,
      consumeAnimations: this._consumeAnimations,
      consumeCooldownMs: this._consumeCooldownMs,
      consumeRequiresDamaged: this._consumeRequiresDamaged,
      ...overrides,
    });
  }

  public consume(): void {
    if (!this.entity?.parent) return;

    const now = performance.now();

    if (now - this._lastConsumeTimeMs < this.consumeCooldownMs) {
      return;
    }
    
    const gamePlayerEntity = this.entity.parent as GamePlayerEntity;
    const gamePlayer = gamePlayerEntity.gamePlayer;

    if (this.consumeRequiresDamaged && !gamePlayerEntity.isDamaged) {
      return;
    }

    const itemInventory = 
      gamePlayer.hotbar.getItemPosition(this) !== null ? gamePlayer.hotbar : 
      gamePlayer.backpack.getItemPosition(this) !== null ? gamePlayer.backpack : null;
   
    if (!itemInventory || !gamePlayer.adjustInventoryItemQuantity(itemInventory, this, -1)) {
      return;
    }

    this._lastConsumeTimeMs = now;
    gamePlayerEntity.startModelOneshotAnimations(this.consumeAnimations);
    this.applyEffects(gamePlayerEntity);
  }

  protected applyEffects(playerEntity: GamePlayerEntity): void {
    // Override in subclasses to apply specific effects (healing, buffs, etc.)
  }

  public override useMouseLeft(): void {
    this.consume();
  }
}