import {
  BaseEntityControllerEvent,
  DefaultPlayerEntity,
  DefaultPlayerEntityController,
  EventPayloads,
  Player,
  PlayerUIEvent,
  QuaternionLike,
  SceneUI,
  Vector3Like,
  World,
} from 'hytopia';

import { skills } from './config';
import GameClock from './GameClock';
import Hotbar from './systems/Hotbar';
import ItemInventory from './systems/ItemInventory';

import BaseItem from './items/BaseItem';
import WoodenSwordItem from './items/weapons/WoodenSwordItem';

export default class GamePlayerEntity extends DefaultPlayerEntity {
  public readonly carriedInventory: ItemInventory = new ItemInventory(21, 7);
  public readonly hotbar: Hotbar = new Hotbar();
  public readonly storageInventory: ItemInventory = new ItemInventory(70, 7);
  private _dodgeCooldownMs: number = 1500;
  private _dodgeDelayMs: number = 150;
  private _dodgeDurationMs: number = 700;
  private _lastDodgeTimeMs: number = 0;
  private _health: number = 100;
  private _maxHealth: number = 100;
  private _nameplateSceneUI: SceneUI;

  public constructor(player: Player) {
    super({
      player,
      name: 'Player',
    });
    
    this._setupPlayerController();
    this._setupPlayerInventories();
    this._setupPlayerUI();
  }

  public get canDodge(): boolean { return performance.now() - this._lastDodgeTimeMs >= this._dodgeCooldownMs; }
  public get health(): number { return this._health; }
  public get isDodging(): boolean {
    const timeSinceDodge = performance.now() - this._lastDodgeTimeMs;
    return timeSinceDodge >= this._dodgeDelayMs && timeSinceDodge < (this._dodgeDelayMs + this._dodgeDurationMs);
  }
  public get maxHealth(): number { return this._maxHealth; } 
  public get playerController(): DefaultPlayerEntityController { return this.controller as DefaultPlayerEntityController; }

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike) {
    super.spawn(world, position, rotation);
    this._nameplateSceneUI.load(world);

    const woodenSword = new WoodenSwordItem();
    this.hotbar.addItem(woodenSword);

  }

  public takeDamage(damage: number): void {
    if (this._health <= 0) return; // dead, don't take more damage
    
    if (this.isDodging) { // in dodge state, don't take damage
      this._nameplateSceneUI.setState({
        damage: 0,
        dodged: true
      });
      return;
    } 

    this._health -= damage;

    this._nameplateSceneUI.setState({
      damage,
      dodged: false,
      health: this._health,
    });

    if (this._health <= 0) {
      console.log('Player died');
    }
  }

  private _dodge = (): void => {
    if (!this.canDodge) return;

    this.startModelOneshotAnimations([ 'dodge-roll' ]);
    this._lastDodgeTimeMs = performance.now();
  }

  private _onHotbarSelectedItemChanged = (selectedItem: BaseItem | null, lastItem: BaseItem | null): void => {
    lastItem?.despawnEntity();
    selectedItem?.spawnEntityAsChild(this, 'hand_right_anchor');
  }

  private _onTickWithPlayerInput = (payload: EventPayloads[BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT]): void => {
    const { input } = payload;

    if (input.ml) {
      const selectedItem = this.hotbar.selectedItem;
      
      if (selectedItem) {
        selectedItem.use();
      } else {
        this.startModelOneshotAnimations([ 'simple-interact' ]);
      }
    }

    if (input.q) {
      this._dodge();
      input.q = false;
    }

    if (input.i) {
      this._toggleInventory();
      input.i = false;
    }

    if (input.j) {
      this._toggleLog();
      input.j = false;
    }

    if (input.m) {
      this._toggleStats();
      input.m = false;
    }
  }

  private _onPlayerUIData = (payload: EventPayloads[PlayerUIEvent.DATA]): void => {
    const { data } = payload;

    if (data.type === 'setSelectedHotbarIndex') {
      this.hotbar.setSelectedIndex(data.index);
    }
  }

  private _setupPlayerController(): void {
    this.playerController.interactOneshotAnimations = []; // disable default interact animations, we trigger them based on the item.
    this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);
  } 

  private _setupPlayerInventories(): void {
    this.hotbar.onSelectedItemChanged = this._onHotbarSelectedItemChanged;
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

    // Sync HUD Clock
    this.player.ui.sendData({
      type: 'syncClock',
      hour: GameClock.instance.hour,
      minute: GameClock.instance.minute,
    });

    // Sync Skills
    this.player.ui.sendData({
      type: 'syncSkills',
      skills,
    });

    // Listen for client->server UI data events
    this.player.ui.on(PlayerUIEvent.DATA, this._onPlayerUIData);
  }

  private _toggleInventory = (): void => {
    this.player.ui.sendData({ type: 'toggleInventory' });
  }

  private _toggleLog = (): void => {
    this.player.ui.sendData({ type: 'toggleLog' });
  }

  private _toggleStats = (): void => {
    this.player.ui.sendData({ type: 'toggleStats' });
  }
}