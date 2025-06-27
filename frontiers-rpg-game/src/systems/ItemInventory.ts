import type { Player } from 'hytopia';
import BaseItem from '../items/BaseItem';
import ItemRegistry from '../items/ItemRegistry';
import { ItemUIDataHelper } from '../items/ItemUIDataHelper';

export type SerializedItem = {
  position: number;
  itemId: string;
  quantity?: number;
};

export type SerializedItemInventoryData = {
  items: SerializedItem[];
};

export default class ItemInventory {
  private _gridWidth: number;
  private _itemPositions: Map<BaseItem, number> = new Map();
  private _positionItems: Map<number, BaseItem> = new Map();
  private _size: number;
  private _tag: string;

  public constructor(size: number, gridWidth: number, tag: string) {
    if (size <= 0 || gridWidth <= 0) {
      throw new Error('Size and gridWidth must be positive numbers');
    }
    
    this._size = size;
    this._gridWidth = gridWidth;
    this._tag = tag;
  }

  public get gridWidth(): number { return this._gridWidth; }
  public get items(): MapIterator<BaseItem> { return this._positionItems.values(); }
  public get isFull(): boolean { return this._itemPositions.size >= this._size; }
  public get rows(): number { return Math.ceil(this._size / this._gridWidth); }
  public get size(): number { return this._size; }
  public get tag(): string { return this._tag; }
  public get totalEmptySlots(): number { return this._size - this._itemPositions.size; }

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

  // Check if the inventory has an item of the same type and name and is stackable
  public hasStackableItem(item: BaseItem): boolean {
    for (const existingItem of this._itemPositions.keys()) {
      if (
        existingItem.constructor === item.constructor && 
        existingItem.name === item.name && 
        existingItem.stackable
      ) {
        return true;
      }
    }
    return false;
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

  public getItemByClass(itemClass: typeof BaseItem): BaseItem | null {
    for (const [ item ] of this._itemPositions) {
      if (item instanceof itemClass) {
        return item;
      }
    }

    return null;
  }

  public getItemsByClass(itemClass: typeof BaseItem): BaseItem[] {
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

  public getItemPositionByClass(itemClass: typeof BaseItem): number | null {
    for (const [ item, position ] of this._itemPositions) {
      if (item instanceof itemClass) {
        return position;
      }
    }

    return null;
  }

  public getItemQuantityByClass(itemClass: typeof BaseItem): number {
    let quantity = 0;
    
    for (const item of this.getItemsByClass(itemClass)) {
      quantity += item.quantity;
    }
    
    return quantity;
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
  
  public syncUI(player: Player): void {
    for (const [ position, item ] of this._positionItems) {
      this.syncUIUpdate(player, position, item);
    }
  }

  public syncUIUpdate(player: Player, position: number, item: BaseItem | null): void {
    const type = `${this._tag}Update`;

    if (item) {
      player.ui.sendData(ItemUIDataHelper.getUIData(item, {
        position,
        sellPrice: item.sellPrice,
        quantity: item.quantity,
        type,
      }));
    } else {
      player.ui.sendData({
        position,
        type,
        removed: true,
      });
    }
  }


  protected onSlotChanged(position: number, item: BaseItem | null): void {
    // Default implementation does nothing - subclasses can override
  }

  public serialize(): SerializedItemInventoryData {
    const items: SerializedItem[] = [];
    
    for (const [position, item] of this._positionItems) {
      const serializedItem: SerializedItem = {
        position,
        itemId: item.id,
      };
      
      // Only include quantity if it's not the default
      if (item.stackable && item.quantity !== 1) {
        serializedItem.quantity = item.quantity;
      }
      
      items.push(serializedItem);
    }
    
    return { items };
  }

  public loadFromSerializedData(serializedItemInventoryData: SerializedItemInventoryData): boolean {
    try {
      const { items } = serializedItemInventoryData;
      
      // Clear existing inventory
      this._itemPositions.clear();
      this._positionItems.clear();
      
      // Load items
      for (const itemData of items) {
        const ItemClass = ItemRegistry.getItemClass(itemData.itemId);
        if (!ItemClass) continue; // Skip unknown items silently
        
        if (itemData.position < 0 || itemData.position >= this._size) continue;
        if (this._positionItems.has(itemData.position)) continue;
        
        const item = ItemClass.create({ quantity: itemData.quantity });
        this._itemPositions.set(item, itemData.position);
        this._positionItems.set(itemData.position, item);
      }
      
      return true;
    } catch {
      return false;
    }
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