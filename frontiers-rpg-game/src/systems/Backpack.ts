import BaseItem from '../items/BaseItem';
import ItemInventory from './ItemInventory';

const BACKPACK_SIZE = 21;
const BACKPACK_GRID_WIDTH = 7;

export default class Backpack extends ItemInventory {
  public constructor() {
    super(BACKPACK_SIZE, BACKPACK_GRID_WIDTH);
  }

  protected override onSlotChanged(position: number, item: BaseItem | null): void {

  }
}