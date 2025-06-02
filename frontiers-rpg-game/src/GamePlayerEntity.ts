import {
  BaseEntityControllerEvent,
  DefaultPlayerEntity,
  DefaultPlayerEntityController,
  EventPayloads,
  Player,
  QuaternionLike,
  SceneUI,
  Vector3Like,
  World,
} from 'hytopia';

import ItemInventory from './systems/ItemInventory';

export default class GamePlayerEntity extends DefaultPlayerEntity {
  public readonly carriedInventory: ItemInventory = new ItemInventory(21, 7);
  public readonly hotbarInventory: ItemInventory = new ItemInventory(7, 7);
  public readonly storageInventory: ItemInventory = new ItemInventory(70, 7);
  private _health: number = 100;
  private _maxHealth: number = 100;
  private _nameplateSceneUI: SceneUI;

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

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike) {
    super.spawn(world, position, rotation);
    this._nameplateSceneUI.load(world);
  }

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
    this._nameplateSceneUI = new SceneUI({
      attachedToEntity: this,
      templateId: 'entity-nameplate',
      state: {
        name: this.player.username,
        health: this._health,
        maxHealth: this._maxHealth,
      },
      offset: { x: 0, y: this.height / 2 + 0.2, z: 0 },
    });

    // Offset the default player nametag for chat to be above ours
    this.nametagSceneUI.setOffset({ x: 0, y: this.height / 2 + 0.45, z: 0 });
  }
}