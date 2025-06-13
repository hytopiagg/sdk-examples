import BaseItem, { BaseItemOptions } from '../BaseItem';

export default class CommonSeedsItem extends BaseItem {
  public constructor(options?: Partial<BaseItemOptions>) {
    super({
      name: 'Common Seeds',
      description: `[4CAF50]Plantable[/][b]A handful of seeds common to the Frontier. It's unclear what they are. Plant them at your farm to see what grows!`,
      iconImageUri: 'icons/items/common-seeds.png',
      stackable: true,
      ...options,
    });
  }
}