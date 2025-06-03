import BaseItem, { BaseItemOptions } from './BaseItem';

export type BaseConsumableItemOptions = {
  consumeAnimations: string[];
  consumeCooldownMs: number;
} & BaseItemOptions;

export default class BaseConsumableItem extends BaseItem {
  public readonly consumeCooldownMs: number;

  public constructor(options: BaseConsumableItemOptions) {
    super(options);

    this.consumeCooldownMs = options.consumeCooldownMs;
  }

  public override use(): void {
    this.consume();
  }

  public consume(): void {

  }
}