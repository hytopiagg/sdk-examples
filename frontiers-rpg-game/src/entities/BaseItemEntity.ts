import { Entity, EntityEvent, EntityOptions, EventPayloads, Player, QuaternionLike, Vector3Like, World } from 'hytopia';
import BaseItem from '../items/BaseItem';
import GamePlayerEntity from '../GamePlayerEntity';

export type BaseItemEntityOptions = {
  item: BaseItem;
} & EntityOptions;

/**
 * Note: This is an entity wrapper for BaseItem that enables interaction through the entity system.
 * This adapter allows items to be interacted with via raycast hits on their entities.
 */
export default class BaseItemEntity extends Entity {
  public readonly item: BaseItem;

  public constructor(options: BaseItemEntityOptions) {
    super(options);

    this.item = options.item;
  }

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike) {
    super.spawn(world, position, rotation);
    
    // Listen to the new interact system
    this.on(EntityEvent.INTERACT, this._onInteract);
  }

  private _onInteract = (payload: EventPayloads[EntityEvent.INTERACT]): void => {
    const playerEntity = this._getGamePlayerEntity(payload.player);
    if (!playerEntity) return;
    
    this.item.interact(playerEntity);
  };

  private _getGamePlayerEntity(player: Player): GamePlayerEntity | undefined {
    return this.world?.entityManager.getPlayerEntitiesByPlayer(player)[0] as GamePlayerEntity | undefined;
  }
}