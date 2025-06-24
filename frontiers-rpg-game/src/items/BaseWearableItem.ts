import BaseItem, { ItemOverrides } from './BaseItem';

export const WEARABLE_SLOTS = ['helmet', 'armor', 'gloves', 'leggings', 'boots', 'accessory'] as const;
export type WearableSlot = typeof WEARABLE_SLOTS[number];
  
export type WearableOverrides = {
  damageBonus?: number;              // +5 flat outgoing damage
  damageBonusPercent?: number;       // +15% outgoing damage  
  damageReduction?: number;          // -3 flat incoming damage
  damageReductionPercent?: number;   // -20% incoming damage
} & ItemOverrides;

export default abstract class BaseWearableItem extends BaseItem {
  // Required static properties that wearable subclasses MUST implement
  static readonly slot: WearableSlot;
  
  // Optional static properties with defaults
  static readonly damageBonus: number = 0;
  static readonly damageBonusPercent: number = 0;
  static readonly damageReduction: number = 0;
  static readonly damageReductionPercent: number = 0;

  static readonly statsHeader: string = 'When equipped:';

  static isWearableItem(item: BaseItem | typeof BaseItem): item is BaseWearableItem {
    if (typeof item === 'function') {
      return BaseWearableItem.prototype.isPrototypeOf(item.prototype);
    }
  
    return item instanceof BaseWearableItem;
  }

  // Simple factory method
  static create(overrides?: WearableOverrides): BaseWearableItem {
    const ItemClass = this as any;
    return new ItemClass(overrides);
  }

  // Instance properties (delegate to static or use overrides)
  public get damageBonus(): number { return this._damageBonus ?? (this.constructor as typeof BaseWearableItem).damageBonus;  }
  public get damageBonusPercent(): number { return this._damageBonusPercent ?? (this.constructor as typeof BaseWearableItem).damageBonusPercent; }
  public get damageReduction(): number { return this._damageReduction ?? (this.constructor as typeof BaseWearableItem).damageReduction; }
  public get damageReductionPercent(): number { return this._damageReductionPercent ?? (this.constructor as typeof BaseWearableItem).damageReductionPercent; }
  public get slot(): WearableSlot { return (this.constructor as typeof BaseWearableItem).slot;}

  // Instance-specific properties that can be overridden
  private readonly _damageBonus?: number;
  private readonly _damageBonusPercent?: number;
  private readonly _damageReduction?: number;
  private readonly _damageReductionPercent?: number;

  public constructor(overrides?: WearableOverrides) {
    super(overrides);
    
    this._damageBonus = overrides?.damageBonus;
    this._damageBonusPercent = overrides?.damageBonusPercent;
    this._damageReduction = overrides?.damageReduction;
    this._damageReductionPercent = overrides?.damageReductionPercent;
  }

  public override clone(overrides?: WearableOverrides): BaseWearableItem {
    const WearableClass = this.constructor as any;
    return new WearableClass({
      quantity: this.quantity,
      damageBonus: this._damageBonus,
      damageBonusPercent: this._damageBonusPercent,
      damageReduction: this._damageReduction,
      damageReductionPercent: this._damageReductionPercent,
      ...overrides,
    });
  }
}