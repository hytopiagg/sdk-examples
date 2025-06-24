import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class AdventurerBootsItem extends BaseWearableItem {
  static readonly id = 'adventurer_boots';
  static readonly name = 'Adventurer Boots';
  static readonly iconImageUri = 'icons/items/adventurer-boots.png';
  static readonly description = `A basic pair of boots, better than nothing.`;
  static readonly buyPrice = 150;
  static readonly sellPrice = 15;

  static readonly damageReduction = 1;

  static readonly slot: WearableSlot = 'boots';
}