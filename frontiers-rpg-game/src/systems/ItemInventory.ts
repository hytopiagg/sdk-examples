import BaseItem from '../items/BaseItem';

export default class ItemInventory {
  private _gridWidth: number;
  private _itemPositions: Map<BaseItem, number> = new Map();
  private _positionItems: Map<number, BaseItem> = new Map();
  private _size: number;

  public constructor(size: number, gridWidth: number) {
    if (size <= 0 || gridWidth <= 0) {
      throw new Error('Size and gridWidth must be positive numbers');
    }
    this._size = size;
    this._gridWidth = gridWidth;
  }

  public get gridWidth(): number { return this._gridWidth; }
  public get items(): BaseItem[] { return Array.from(this._itemPositions.keys()); }
  public get rows(): number { return Math.ceil(this._size / this._gridWidth); }
  public get size(): number { return this._size; }

  public addItem(item: BaseItem, position?: number): boolean {

    if (this._itemPositions.has(item)) {
      return false;
    }

    const targetPosition = position ?? this.findEmptyPosition();
    
    if (targetPosition < 0 || targetPosition >= this._size) {
      return false;
    }

    if (this._positionItems.has(targetPosition)) {
      return false;
    }

    this._itemPositions.set(item, targetPosition);
    this._positionItems.set(targetPosition, item);

    return true;
  }

  public coordinatesToPosition(x: number, y: number): number | null {
    if (x < 0 || x >= this._gridWidth || y < 0 || y >= this.rows) {
      return null;
    }
    return y * this._gridWidth + x;
  }

  public expandSize(newSize: number): boolean {
    if (newSize <= this._size) {
      return false;
    }

    this._size = newSize;
    
    return true;
  }

  public getItemAt(position: number): BaseItem | null {
    return this._positionItems.get(position) ?? null;
  }

  public getItemPosition(item: BaseItem): number | null {
    return this._itemPositions.get(item) ?? null;
  }

  public isEmpty(position: number): boolean {
    return !this._positionItems.has(position);
  }

  public moveItem(item: BaseItem, newPosition: number): boolean {
    if (newPosition < 0 || newPosition >= this._size) {
      return false;
    }

    const currentPosition = this._itemPositions.get(item);

    if (currentPosition === undefined) {
      return false;
    }

    if (currentPosition === newPosition) {
      return true;
    }

    const itemAtNewPosition = this._positionItems.get(newPosition);

    if (itemAtNewPosition) { // Swap
      this._itemPositions.set(item, newPosition);
      this._itemPositions.set(itemAtNewPosition, currentPosition);
      this._positionItems.set(newPosition, item);
      this._positionItems.set(currentPosition, itemAtNewPosition);
    } else {
      this._itemPositions.set(item, newPosition);
      this._positionItems.delete(currentPosition);
      this._positionItems.set(newPosition, item);
    }

    return true;
  }


  public removeItem(item: BaseItem): boolean {
    const position = this._itemPositions.get(item);
    if (position === undefined) {
      return false;
    }

    this._itemPositions.delete(item);
    this._positionItems.delete(position);
    return true;
  }

  private findEmptyPosition(): number {
    for (let i = 0; i < this._size; i++) {
      if (!this._positionItems.has(i)) {
        return i;
      }
    }
    return -1;
  }
}