import {
  BaseEntityControllerEvent,
  DefaultPlayerEntity,
  DefaultPlayerEntityController,
  EventPayloads,
  Player,
  SceneUI,
} from 'hytopia';

import ItemInventory from './systems/ItemInventory';

export default class GamePlayerEntity extends DefaultPlayerEntity {
  public readonly carriedInventory: ItemInventory = new ItemInventory(21, 7);
  public readonly hotbarInventory: ItemInventory = new ItemInventory(7, 7);
  public readonly storageInventory: ItemInventory = new ItemInventory(70, 7);
  private _health: number = 100;
  private _healthSceneUI: SceneUI;
  private _maxHealth: number = 100;

  public constructor(player: Player) {
    super({
      player,
      name: 'Player',
    });
    
    this._setupPlayerController();
    this._setupPlayerUI();
  }

  public get health(): number { return this._health; }
  public get maxHealth(): number { return this._maxHealth; } 
  public get playerController(): DefaultPlayerEntityController { return this.controller as DefaultPlayerEntityController; }

  public takeDamage(damage: number): void {
    this._health = Math.max(0, this._health - damage);
    console.log(`Player took ${damage} damage, health is now ${this._health}`);
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

  private _setupPlayerUI(): void {
    this.player.ui.load('ui/index.html');

    // Setup Health UI
    this._healthSceneUI = new SceneUI({
      attachedToEntity: this,
      templateId: 'entity-nameplate',
      state: {
        health: this._health,
        maxHealth: this._maxHealth,
      },
      offset: { x: 0, y: 1.15, z: 0 },
    });
  }
}