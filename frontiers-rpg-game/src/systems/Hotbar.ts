import { Player } from 'hytopia';
import BaseItem from '../items/BaseItem';
import ItemInventory from './ItemInventory';

const HOTBAR_SIZE = 8;

export default class Hotbar extends ItemInventory {
  public onSelectedItemChanged: (selectedItem: BaseItem | null, lastItem: BaseItem | null) => void = () => {};
  private _owner: Player;
  private _selectedIndex: number = 0;

  public constructor(owner: Player) {
    super(HOTBAR_SIZE, HOTBAR_SIZE);
    this._owner = owner;
  }

  public get selectedIndex(): number { return this._selectedIndex; }
  public get selectedItem(): BaseItem | null { return this.getItemAt(this._selectedIndex); }

  public setSelectedIndex(index: number): boolean {
    if (index < 0 || index >= HOTBAR_SIZE) {
      return false;
    }

    if (this._selectedIndex === index) {
      return true;
    }

    const lastItem = this.selectedItem;
    this._selectedIndex = index;
    const newItem = this.selectedItem;

    if (lastItem !== newItem) {
      this.onSelectedItemChanged(newItem, lastItem);
    }

    return true;
  }

  public override addItem(item: BaseItem, position?: number): boolean {
    const lastSelectedItem = this.selectedItem;
    const result = super.addItem(item, position);
    
    if (result) {
      const newSelectedItem = this.selectedItem;
      if (lastSelectedItem !== newSelectedItem) {
        this.onSelectedItemChanged(newSelectedItem, lastSelectedItem);
      }
    }
    
    return result;
  }

  public override moveItem(fromPosition: number, toPosition: number): boolean {
    const lastSelectedItem = this.selectedItem;
    const result = super.moveItem(fromPosition, toPosition);
    
    if (result) {
      const newSelectedItem = this.selectedItem;
      if (lastSelectedItem !== newSelectedItem) {
        this.onSelectedItemChanged(newSelectedItem, lastSelectedItem);
      }
    }
    
    return result;
  }

  public override removeItem(position: number): BaseItem | null {
    const lastSelectedItem = this.selectedItem;
    const result = super.removeItem(position);
    
    if (result) {
      const newSelectedItem = this.selectedItem;
      if (lastSelectedItem !== newSelectedItem) {
        this.onSelectedItemChanged(newSelectedItem, lastSelectedItem);
      }
    }
    
    return result;
  }

  public wouldAddAtSelectedIndex(item: BaseItem): boolean {
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      if (!this.getItemAt(i)) {
        return i === this._selectedIndex;
      }
    }
    
    return false;
  }

  protected override onSlotChanged(position: number, item: BaseItem | null): void {
    this._owner.ui.sendData({
      type: 'hotbarUpdate',
      position,
      ...(item ? {
        name: item.name,
        iconImageUri: item.iconImageUri,
        description: item.description,
        quantity: item.quantity,
        sellValue: item.sellValue,
      } : { removed: true })
    })
  }
}