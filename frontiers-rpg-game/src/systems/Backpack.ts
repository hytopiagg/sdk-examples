import { Player } from 'hytopia';
import BaseItem from '../items/BaseItem';
import ItemInventory from './ItemInventory';

const BACKPACK_SIZE = 21;
const BACKPACK_GRID_WIDTH = 7;

export default class Backpack extends ItemInventory {
  private _owner: Player;

  public constructor(owner: Player) {
    super(BACKPACK_SIZE, BACKPACK_GRID_WIDTH, 'backpack');
    this._owner = owner;
  }

  protected override onSlotChanged(position: number, item: BaseItem | null): void {
    this.syncUIUpdate(this._owner, position, item);
  }
}