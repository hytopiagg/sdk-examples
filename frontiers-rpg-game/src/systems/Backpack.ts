import { Player } from 'hytopia';
import BaseItem from '../items/BaseItem';
import ItemInventory from './ItemInventory';

const BACKPACK_SIZE = 21;
const BACKPACK_GRID_WIDTH = 7;

export default class Backpack extends ItemInventory {
  private _owner: Player;

  public constructor(owner: Player) {
    super(BACKPACK_SIZE, BACKPACK_GRID_WIDTH);
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
        sellPrice: item.sellPrice,
      } : { removed: true })
    })
  }
}