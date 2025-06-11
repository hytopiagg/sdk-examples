import BaseItem, { BaseItemOptions } from './BaseItem';

export type BaseConsumableItemOptions = {
  consumeAnimations: string[];
  consumeCooldownMs: number;
} & BaseItemOptions;

export default class BaseConsumableItem extends BaseItem {
  public readonly consumeAnimations: string[];
  public readonly consumeCooldownMs: number;

  public constructor(options: BaseConsumableItemOptions) {
    super(options);

    this.consumeAnimations = options.consumeAnimations;
    this.consumeCooldownMs = options.consumeCooldownMs;
  }

  public override clone(overrideOptions?: Partial<BaseConsumableItemOptions>): BaseConsumableItem {
    return new BaseConsumableItem({
      ...this.toOptions(),
      ...overrideOptions,
    });
  }

  public consume(): void {

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