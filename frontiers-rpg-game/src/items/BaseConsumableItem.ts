import BaseItem, { BaseItemOptions } from './BaseItem';

export type BaseConsumableItemOptions = {

} & BaseItemOptions;

export default class BaseConsumableItem extends BaseItem {
  constructor(options: BaseConsumableItemOptions) {
    super(options);
  }
}