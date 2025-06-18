import { Player } from 'hytopia';
import BaseItem from '../items/BaseItem';
import ItemInventory from './ItemInventory';
import type GamePlayer from '../GamePlayer';

const STORAGE_SIZE = 70;
const STORAGE_GRID_WIDTH = 7;

export default class Storage extends ItemInventory {
  private _owner: GamePlayer;
  
  public constructor(owner: GamePlayer) {
    super(STORAGE_SIZE, STORAGE_GRID_WIDTH, 'storage');
    this._owner = owner;
  }

  protected override onSlotChanged(position: number, item: BaseItem | null): void {
    this.syncUIUpdate(this._owner.player, position, item);
  }
}