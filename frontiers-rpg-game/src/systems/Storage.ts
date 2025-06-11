import { Player } from 'hytopia';
import BaseItem from '../items/BaseItem';
import ItemInventory from './ItemInventory';

const STORAGE_SIZE = 70;
const STORAGE_GRID_WIDTH = 7;

export default class Storage extends ItemInventory {
  private _owner: Player;
  
  public constructor(owner: Player) {
    super(STORAGE_SIZE, STORAGE_GRID_WIDTH, 'storage');
    this._owner = owner;
  }

  protected override onSlotChanged(position: number, item: BaseItem | null): void {
    this.syncUIUpdate(this._owner, position, item);
  }
}