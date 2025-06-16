import BaseItem from '../BaseItem';

export default class CommonSeedsItem extends BaseItem {
  static readonly id = 'common_seeds';
  static readonly name = 'Common Seeds';
  static readonly iconImageUri = 'icons/items/common-seeds.png';
  static readonly description = `[4CAF50]Plantable[/][b]A handful of seeds common to the Frontier. It's unclear what they are. Plant them at your farm to see what grows!`;
  static readonly stackable = true;
}