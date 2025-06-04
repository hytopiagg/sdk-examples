import { Player } from 'hytopia';
import BaseItem from '../items/BaseItem';
import ItemInventory from './ItemInventory';

const STORAGE_SIZE = 70;
const STORAGE_GRID_WIDTH = 7;

export default class Storage extends ItemInventory {
  private _owner: Player;
  
  public constructor(owner: Player) {
    super(STORAGE_SIZE, STORAGE_GRID_WIDTH);
    this._owner = owner;
  }

  protected override onSlotChanged(position: number, item: BaseItem | null): void {
    this._owner.ui.sendData({
      type: 'backpackUpdate',
      position,
      ...(item ? {
        name: item.name,
        iconImageUri: item.iconImageUri,
        description: item.description,
        quantity: item.quantity,
        sellValue: item.sellValue,
      } : { removed: true })
    })
  }
}