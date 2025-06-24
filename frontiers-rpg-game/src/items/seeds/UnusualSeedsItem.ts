import BaseItem from '../BaseItem';

export default class UnusualSeedsItem extends BaseItem {
  static readonly id = 'unusual_seeds';
  static readonly name = 'Unusual Seeds';
  static readonly iconImageUri = 'icons/items/unusual-seeds.png';
  static readonly description = `[4CAF50]Plantable[/][b]A small amount of seeds not found in the Frontier. It's unclear what will grow if you plant these.`;
  static readonly rarity = 'unusual';
  static readonly stackable = true;
  static readonly buyPrice = 1500;
  static readonly sellPrice = 150;

}