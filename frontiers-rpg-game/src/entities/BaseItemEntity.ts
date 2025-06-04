import { Entity, EntityOptions } from 'hytopia';
import BaseItem from '../items/BaseItem';
import GamePlayerEntity from '../GamePlayerEntity';
import IInteractable from '../interfaces/IInteractable';

export type BaseItemEntityOptions = {
  item: BaseItem;
} & EntityOptions;

/**
 * Note: This is an entity wrapper for BaseItem that enables interaction through the entity system.
 * This adapter allows items to be interacted with via raycast hits on their entities.
 */
export default class BaseItemEntity extends Entity implements IInteractable {
  public readonly item: BaseItem;

  public constructor(options: BaseItemEntityOptions) {
    super(options);

    this.item = options.item;
  }

  public interact(playerEntity: GamePlayerEntity): void {
    this.item.interact(playerEntity);
  }
}