import BaseItem, { BaseItemOptions } from './BaseItem';
import GamePlayerEntity from '../GamePlayerEntity';

export type BaseConsumableItemOptions = {
  consumeAnimations?: string[];
  consumeCooldownMs: number;
  consumeRequiresDamaged?: boolean;
} & BaseItemOptions;

export default class BaseConsumableItem extends BaseItem {
  public readonly consumeAnimations: string[];
  public readonly consumeCooldownMs: number;
  public readonly consumeRequiresDamaged: boolean;
  private _lastConsumeTimeMs: number = 0;

  public constructor(options: BaseConsumableItemOptions) {
    super(options);
    this.consumeAnimations = options.consumeAnimations ?? [ 'consume-upper' ];
    this.consumeCooldownMs = options.consumeCooldownMs;
    this.consumeRequiresDamaged = options.consumeRequiresDamaged ?? false;
  }

  public override clone(overrideOptions?: Partial<BaseConsumableItemOptions>): this {
    return new (this.constructor as new (options: BaseConsumableItemOptions) => this)({
      ...this.toOptions(),
      ...overrideOptions,
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

  public override toOptions(): BaseConsumableItemOptions {
    return {
      ...super.toOptions(),
      consumeAnimations: this.consumeAnimations,
      consumeCooldownMs: this.consumeCooldownMs,
    };
  }

  public override useMouseLeft(): void {
    this.consume();
  }
}