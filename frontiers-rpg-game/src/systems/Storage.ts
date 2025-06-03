import ItemInventory from './ItemInventory';

const STORAGE_SIZE = 70;
const STORAGE_GRID_WIDTH = 7;

export default class Storage extends ItemInventory {
  public constructor() {
    super(STORAGE_SIZE, STORAGE_GRID_WIDTH);
  }
}