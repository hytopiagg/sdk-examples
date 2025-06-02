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
    if (this._health <= 0) return; // dead, don't take more damage

    this._health -= damage;

    this._nameplateSceneUI.setState({
      damage,
      health: this._health,
    });

    if (this._health <= 0) {
      console.log('Player died');
    }
  }

  private _onTickWithPlayerInput = (payload: EventPayloads[BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT]): void => {
    const { input } = payload;

    if (input.e) {
      this._toggleInventory();
      input.e = false;
    }
  }

  private _toggleInventory = (): void => {
    this.player.ui.sendData({ type: 'toggleInventory' });
  }

  private _setupPlayerController(): void {
    this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);
  } 

  private _setupPlayerUI(): void {
    this.player.ui.load('ui/index.html');

    const nameplateYOffset = this.height / 2 + 0.2;

    // Setup Health UI
    this._nameplateSceneUI = new SceneUI({
      attachedToEntity: this,
      templateId: 'entity-nameplate',
      state: {
        name: this.player.username,
        level: 12,
        health: this._health,
        maxHealth: this._maxHealth,
      },
      offset: { x: 0, y: nameplateYOffset, z: 0 },
    });

    // Offset the default player nametag for chat to be above our nameplate
    this.nametagSceneUI.setOffset({ x: 0, y: nameplateYOffset + 0.25, z: 0 });
  }
}