import { Player } from 'hytopia';
import BaseItem from '../items/BaseItem';
import ItemInventory from './ItemInventory';
import type GamePlayer from '../GamePlayer';

const BACKPACK_SIZE = 21;
const BACKPACK_GRID_WIDTH = 7;

export default class Backpack extends ItemInventory {
  private _owner: GamePlayer;

  public constructor(owner: GamePlayer) {
    super(BACKPACK_SIZE, BACKPACK_GRID_WIDTH, 'backpack');
    this._owner = owner;
  }

  protected override onSlotChanged(position: number, item: BaseItem | null): void {
    this.syncUIUpdate(this._owner.player, position, item);
  }
}