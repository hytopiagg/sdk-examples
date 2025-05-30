import BaseItem, { BaseItemOptions } from './BaseItem';

export type BaseWeaponItemOptions = {

} & Omit<BaseItemOptions, 'stackable' | 'quantity'>

export default class BaseWeaponItem extends BaseItem {
  constructor(options: BaseWeaponItemOptions) {
    super(options);
  }
}