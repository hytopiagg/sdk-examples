import BaseWearableItem, { WearableSlot } from '../BaseWearableItem';

export default class AdventurerGlovesItem extends BaseWearableItem {
  static readonly id = 'adventurer_gloves';
  static readonly name = 'Adventurer Gloves';
  static readonly iconImageUri = 'icons/items/adventurer-gloves.png';
  static readonly description = `A basic pair of gloves, prevents blisters.`;
  static readonly buyPrice = 100;
  static readonly sellPrice = 10;

  static readonly damageReduction = 1;

  static readonly slot: WearableSlot = 'gloves';
}