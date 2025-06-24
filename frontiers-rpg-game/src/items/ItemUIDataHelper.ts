import BaseItem from './BaseItem';
import BaseWearableItem from './BaseWearableItem';
import BaseWeaponItem from './BaseWeaponItem';

export type ItemUIData = {
  name: string;
  description: string;
  iconImageUri: string;
  buyPrice?: number;
  sellPrice?: number;
  quantity?: number;
  damageBonus?: number;
  damageBonusPercent?: number;
  damageReduction?: number;
  damageReductionPercent?: number;
  damage?: number;
  damageVariance?: number;
  position?: number;
  statsHeader?: string;
  statTexts?: string[];
  type?: string; // UI update type
}

export type ItemUIDataOverrides = {
  position?: number;
  buyPrice?: number;
  sellPrice?: number;
  quantity?: number;
  type?: string;
}

export class ItemUIDataHelper {
  static getUIData(itemInstanceOrClass: BaseItem | typeof BaseItem, overrides?: ItemUIDataOverrides): ItemUIData {
    const uiData: ItemUIData = {
      name: itemInstanceOrClass.name,
      description: itemInstanceOrClass.description,
      iconImageUri: itemInstanceOrClass.iconImageUri,
      ...overrides,
    };

    if (BaseWearableItem.isWearableItem(itemInstanceOrClass)) {
      if (itemInstanceOrClass.damageBonus !== 0) uiData.damageBonus = itemInstanceOrClass.damageBonus;
      if (itemInstanceOrClass.damageBonusPercent !== 0) uiData.damageBonusPercent = itemInstanceOrClass.damageBonusPercent;
      if (itemInstanceOrClass.damageReduction !== 0) uiData.damageReduction = itemInstanceOrClass.damageReduction;
      if (itemInstanceOrClass.damageReductionPercent !== 0) uiData.damageReductionPercent = itemInstanceOrClass.damageReductionPercent;
    }

    // Add weapon-specific properties if item is a weapon
    if (BaseWeaponItem.isWeaponItem(itemInstanceOrClass)) {
      if (itemInstanceOrClass.attack.damage !== 0) uiData.damage = itemInstanceOrClass.attack.damage;
      if (itemInstanceOrClass.attack.damageVariance !== 0) uiData.damageVariance = itemInstanceOrClass.attack.damageVariance;
    }

    if (itemInstanceOrClass.statsHeader) {
      uiData.statsHeader = itemInstanceOrClass.statsHeader;
    }

    if (itemInstanceOrClass.statTexts.length > 0) {
      uiData.statTexts = itemInstanceOrClass.statTexts;
    }

    return uiData;
  }
} 