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
  public get isFull(): boolean { return this._itemPositions.size >= this._size; }
  public get rows(): number { return Math.ceil(this._size / this._gridWidth); }
  public get size(): number { return this._size; }

  public addItem(item: BaseItem, position?: number): boolean {
    if (this._itemPositions.has(item)) {
      return false;
    }

    // Check if item is stackable and an item of the same type already exists
    if (item.stackable) {
      for (const existingItem of this._itemPositions.keys()) {
        if (
          existingItem.constructor === item.constructor && 
          existingItem.name === item.name && 
          existingItem.stackable
        ) {
          existingItem.adjustQuantity(item.quantity);
          this.onSlotChanged(this._itemPositions.get(existingItem)!, existingItem);
          return true;
        }
      }
    }

    // If not stackable, attempt to find an empty position
    const targetPosition = position ?? this._findEmptyPosition();
    
    if (targetPosition < 0 || targetPosition >= this._size) {
      return false;
    }

    if (this._positionItems.has(targetPosition)) {
      return false;
    }

    this._itemPositions.set(item, targetPosition);
    this._positionItems.set(targetPosition, item);
    this.onSlotChanged(targetPosition, item);
    
    return true;
  }

  // Adjust quantity of item in inventory with UI update
  // Use this instead of item.adjustQuantity() for items in inventory to trigger UI updates
  public adjustItemQuantity(position: number, quantity: number): boolean {
    const item = this._positionItems.get(position);
    if (!item || !item.stackable) {
      return false;
    }

    const newQuantity = item.quantity + quantity;
    if (newQuantity <= 0) {
      this.removeItem(position);
      return true;
    }

    item.adjustQuantity(quantity);
    this.onSlotChanged(position, item);
    return true;
  }

  // Adjust quantity of item in inventory by reference with UI update
  // Use this instead of item.adjustQuantity() for items in inventory to trigger UI updates
  public adjustItemQuantityByReference(item: BaseItem, quantity: number): boolean {
    const position = this._itemPositions.get(item);
    if (position === undefined) {
      return false;
    }
    return this.adjustItemQuantity(position, quantity);
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

  public getItemByClass(itemClass: new (...args: any[]) => BaseItem): BaseItem | null {
    for (const [ item ] of this._itemPositions) {
      if (item instanceof itemClass) {
        return item;
      }
    }

    return null;
  }

  public getItemsByClass(itemClass: new (...args: any[]) => BaseItem): BaseItem[] {
    const items: BaseItem[] = [];

    for (const [ item ] of this._itemPositions) {
      if (item instanceof itemClass) {
        items.push(item);
      }
    }

    return items;
  }

  public getItemPosition(item: BaseItem): number | null {
    return this._itemPositions.get(item) ?? null;
  }

  public getItemPositionByClass(itemClass: new (...args: any[]) => BaseItem): number | null {
    for (const [ item, position ] of this._itemPositions) {
      if (item instanceof itemClass) {
        return position;
      }
    }

    return null;
  }

  public isEmpty(position: number): boolean {
    return !this._positionItems.has(position);
  }

  public moveItem(fromPosition: number, toPosition: number): boolean {
    if (fromPosition < 0 || fromPosition >= this._size || toPosition < 0 || toPosition >= this._size) {
      return false;
    }

    if (fromPosition === toPosition) {
      return true;
    }

    const itemToMove = this._positionItems.get(fromPosition);
    if (!itemToMove) {
      return false;
    }

    const itemAtDestination = this._positionItems.get(toPosition);

    if (itemAtDestination) {
      // Swap items
      this._itemPositions.set(itemToMove, toPosition);
      this._itemPositions.set(itemAtDestination, fromPosition);
      this._positionItems.set(toPosition, itemToMove);
      this._positionItems.set(fromPosition, itemAtDestination);
      this.onSlotChanged(fromPosition, itemAtDestination);
      this.onSlotChanged(toPosition, itemToMove);
    } else {
      // Move to empty slot
      this._itemPositions.set(itemToMove, toPosition);
      this._positionItems.delete(fromPosition);
      this._positionItems.set(toPosition, itemToMove);
      this.onSlotChanged(fromPosition, null);
      this.onSlotChanged(toPosition, itemToMove);
    }

    return true;
  }

  public moveItemByReference(item: BaseItem, newPosition: number): boolean {
    const currentPosition = this._itemPositions.get(item);
    if (currentPosition === undefined) {
      return false;
    }
    return this.moveItem(currentPosition, newPosition);
  }

  public removeItem(position: number): BaseItem | null {
    if (position < 0 || position >= this._size) {
      return null;
    }

    const item = this._positionItems.get(position);
    if (!item) {
      return null;
    }

    this._itemPositions.delete(item);
    this._positionItems.delete(position);
    this.onSlotChanged(position, null);
    return item;
  }

  public removeItemByReference(item: BaseItem): boolean {
    const position = this._itemPositions.get(item);
    if (position === undefined) {
      return false;
    }
    return this.removeItem(position) !== null;
  }

  protected onSlotChanged(position: number, item: BaseItem | null): void {
    // Default implementation does nothing - subclasses can override
  }

  private _findEmptyPosition(): number {
    for (let i = 0; i < this._size; i++) {
      if (!this._positionItems.has(i)) {
        return i;
      }
    }
    return -1;
  }
}