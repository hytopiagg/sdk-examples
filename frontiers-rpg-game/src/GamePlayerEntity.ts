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
  
  private _health: number = 100;
  private _maxHealth: number = 100;
 
  public get playerController(): DefaultPlayerEntityController { return this.controller as DefaultPlayerEntityController; }
  public get health(): number { return this._health; }
  public get maxHealth(): number { return this._maxHealth; }

  public constructor(player: Player) {
    super({
      player,
      name: 'Player',
    });
    
    this._setupPlayerController();
  }

  public takeDamage(damage: number): void {
    this._health = Math.max(0, this._health - damage);
    
    // TODO: Handle player death, UI updates, etc.
    if (this._health <= 0) {
      // Handle player death
    }
  }

  private _onTickWithPlayerInput = (payload: EventPayloads[BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT]): void => {
    const { input } = payload;
  }

  private _setupPlayerController(): void {
    this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);
  } 
}