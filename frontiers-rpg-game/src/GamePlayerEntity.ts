import {
  BaseEntityControllerEvent,
  DefaultPlayerEntity,
  DefaultPlayerEntityController,
  EventPayloads,
  Player,
} from 'hytopia';

import ItemInventory from './systems/ItemInventory';

export default class GamePlayerEntity extends DefaultPlayerEntity {
  public readonly carriedInventory: ItemInventory = new ItemInventory(21, 7);
  public readonly hotbarInventory: ItemInventory = new ItemInventory(7, 7);
  public readonly storageInventory: ItemInventory = new ItemInventory(70, 7);
 
  public get playerController(): DefaultPlayerEntityController { return this.controller as DefaultPlayerEntityController; }

  public constructor(player: Player) {
    super({
      player,
      name: 'Player',
    });
    
    this._setupPlayerController();
  }


  private _onTickWithPlayerInput = (payload: EventPayloads[BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT]): void => {
    const { input } = payload;
  }

  private _setupPlayerController(): void {
    this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);
  } 
}