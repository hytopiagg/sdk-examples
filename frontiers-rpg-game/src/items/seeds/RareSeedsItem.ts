import BaseItem from '../BaseItem';

export default class RareSeedsItem extends BaseItem {
  static readonly id = 'rare_seeds';
  static readonly name = 'Rare Seeds';
  static readonly iconImageUri = 'icons/items/rare-seeds.png';
  static readonly description = `[4CAF50]Plantable[/][b]These seeds seem special. Something exotic may grow from them!`;
  static readonly rarity = 'rare';
  static readonly stackable = true;
  static readonly buyPrice = 2500;
  static readonly sellPrice = 250;
}