import BaseWearableItem, { isWearableItem } from '../items/BaseWearableItem';
import BaseItem from '../items/BaseItem';
import ItemInventory from './ItemInventory';
import type GamePlayer from '../GamePlayer';
import type { WearableSlot } from '../items/BaseWearableItem';
import type { SerializedItemInventoryData } from './ItemInventory';

export type SerializedWearablesData = SerializedItemInventoryData;

export default class Wearables extends ItemInventory {
  private static readonly SLOT_POSITIONS: Record<WearableSlot, number> = {
    helmet: 0,
    armor: 1,
    gloves: 2,
    leggings: 3,
    boots: 4,
    accessory: 5,
  };

  private _owner: GamePlayer;

  public constructor(owner: GamePlayer) {
    super(6, 6, 'wearables'); // 6 slots, single row
    this._owner = owner;
  }

  public getWearableItem(slot: WearableSlot): BaseWearableItem | null {
    const position = this._getPositionForSlot(slot);
    const item = this.getItemAt(position);
    return item && isWearableItem(item) ? item : null;
  }

  public override addItem(item: BaseItem): boolean {
    if (!isWearableItem(item)) return false;
    
    const targetPosition = this._getPositionForSlot(item.slot);
    return super.addItem(item, targetPosition);
  }

  protected override onSlotChanged(position: number, item: BaseItem | null): void {
    this.syncUIUpdate(this._owner.player, position, item);
  }

  private _getPositionForSlot(slot: WearableSlot): number {
    return Wearables.SLOT_POSITIONS[slot];
  }
}

