import {
  BaseEntityControllerEvent,
  CollisionGroup,
  CollisionGroupsBuilder,
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

import { SkillId, skills } from './config';
import Backpack from './systems/Backpack';
import CustomCollisionGroup from './physics/CustomCollisionGroup';
import GameClock from './GameClock';
import Hotbar from './systems/Hotbar';
import Storage from './systems/Storage';
import type BaseEntity from './entities/BaseEntity';
import type BaseItem from './items/BaseItem';
import WoodenSwordItem from './items/weapons/WoodenSwordItem';

const CAMERA_OFFSET_Y = 0.8;
const CAMERA_SHOULDER_ANGLE = 11;
const DODGE_COOLDOWN_MS = 900;
const DODGE_DELAY_MS = 150;
const DODGE_DURATION_MS = 700;
const DODGE_HORIZONTAL_FORCE = 3;
const DODGE_VERTICAL_FORCE = 6;
const INTERACT_REACH = 3;

export default class GamePlayerEntity extends DefaultPlayerEntity {
  public readonly backpack: Backpack;
  public readonly hotbar: Hotbar;
  public readonly storage: Storage;
  private _currentDialogueEntity: BaseEntity | undefined;
  private _globalExperience: number = 0;
  private _lastDodgeTimeMs: number = 0;
  private _health: number = 100;
  private _maxHealth: number = 100;
  private _nameplateSceneUI: SceneUI;
  private _skillExperience: Map<SkillId, number> = new Map();

  public constructor(player: Player) {
    super({
      player,
      name: 'Player',
    });

    this.backpack = new Backpack(this.player);
    this.hotbar = new Hotbar(this.player);
    this.storage = new Storage(this.player);
    
    this._setupPlayerCamera();
    this._setupPlayerController();
    this._setupPlayerInventories();
    this._setupPlayerUI();
  }

  public get adjustedRaycastPosition(): Vector3Like { // I think this is still slightly off..
    return {
      x: this.position.x,
      y: this.position.y + CAMERA_OFFSET_Y / 2,
      z: this.position.z,
    }
  }

  public get adjustedFacingDirection(): Vector3Like { // May still be slightly off, revisit later.
    const shoulderAngleRad = -this.player.camera.shoulderAngle * Math.PI / 180; // We should maybe make the SDK account for this in the future?
    const facingDirection = this.player.camera.facingDirection;
    const cos = Math.cos(shoulderAngleRad);
    const sin = Math.sin(shoulderAngleRad);
    
    return {
      x: facingDirection.x * cos + facingDirection.z * sin,
      y: facingDirection.y,
      z: -facingDirection.x * sin + facingDirection.z * cos
    } 
  }

  public get canDodge(): boolean {
    return performance.now() - this._lastDodgeTimeMs >= DODGE_COOLDOWN_MS;
  }

  public get globalExperience(): number {
    return this._globalExperience;
  }
  
  public get health(): number {
    return this._health;
  }
  
  public get isDodging(): boolean {
    const timeSinceDodge = performance.now() - this._lastDodgeTimeMs;
    return timeSinceDodge >= DODGE_DELAY_MS && timeSinceDodge < (DODGE_DELAY_MS + DODGE_DURATION_MS);
  }
  
  public get maxHealth(): number {
    return this._maxHealth;
  } 
  
  public get playerController(): DefaultPlayerEntityController {
    return this.controller as DefaultPlayerEntityController;
  }

  public adjustGlobalExperience(amount: number): void {
    this._globalExperience = Math.max(0, this._globalExperience + amount);
  }

  public adjustHealth(amount: number): void {
    this._health = Math.max(0, Math.min(this._maxHealth, this._health + amount));
    this._updateHudHealthUI();
  }

  public adjustSkillExperience(skillId: SkillId, amount: number): void {
    this._skillExperience.set(skillId, Math.max(0, (this._skillExperience.get(skillId) ?? 0) + amount));
  }

  public getSkillExperience(skillId: SkillId): number {
    return this._skillExperience.get(skillId) ?? 0;
  }

  public setCurrentDialogueEntity(entity: BaseEntity): void {
    this._currentDialogueEntity = entity;
  }

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

    this._updateHudHealthUI();

    if (this._health <= 0) {
      console.log('Player died');
    }
  }

  private _dodge(): void {
    if (!this.canDodge) return;

    this.startModelOneshotAnimations([ 'dodge-roll' ]);
    this._lastDodgeTimeMs = performance.now();

    // Apply dodge impulse when not moving
    if (!this.playerController.isActivelyMoving) {
      const direction = this.directionFromRotation;
      const horizontalForce = DODGE_HORIZONTAL_FORCE * this.mass;
      const verticalForce = this.playerController.isGrounded ? DODGE_VERTICAL_FORCE * this.mass : 0;

      this.applyImpulse({
        x: direction.x * horizontalForce,
        y: verticalForce,
        z: direction.z * horizontalForce,
      });
    }
  }

  private _interact(): void {
    const raycastResult = this.world?.simulation.raycast(
      this.adjustedRaycastPosition,
      this.adjustedFacingDirection,
      INTERACT_REACH,
      {
        filterGroups: CollisionGroupsBuilder.buildRawCollisionGroups({ // The collision group the raycast belongs to
          belongsTo: [ CollisionGroup.ALL ],
          collidesWith: [ CollisionGroup.ENTITY, CustomCollisionGroup.ITEM ],
        }),
        filterExcludeRigidBody: this.rawRigidBody, // ignore self
        filterFlags: 8, // Rapier exclude sensors,
      },
    );

    if (raycastResult?.hitEntity) {
      if ('interact' in raycastResult.hitEntity && typeof raycastResult.hitEntity.interact === 'function') {
        raycastResult.hitEntity.interact(this);
      }
    }
  }

  private _onHotbarSelectedItemChanged = (selectedItem: BaseItem | null, lastItem: BaseItem | null): void => {
    lastItem?.despawnEntity();
    selectedItem?.spawnEntityAsHeld(this, 'hand_right_anchor');
  }

  private _onTickWithPlayerInput = (payload: EventPayloads[BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT]): void => {
    const { input } = payload;

    // Left click item usage
    if (input.ml) {
      const selectedItem = this.hotbar.selectedItem;
      
      if (selectedItem) {
        selectedItem.useMouseLeft();
      } else {
        this.startModelOneshotAnimations([ 'simple-interact' ]);
      }

      input.ml = false;
    }

    // Right click item usage
    if (input.mr) {
      const selectedItem = this.hotbar.selectedItem;

      if (selectedItem) {
        selectedItem.useMouseRight();
      }

      input.mr = false;
    }

    // NPC & Environment Interact
    if (input.e) {
      this._interact();
      input.e = false;
    }

    // Dodge
    if (input.q) {
      this._dodge();
      input.q = false;
    }

    // Backpack
    if (input.i) {
      this._toggleBackpack();
      input.i = false;
    }

    // Progress Log
    if (input.j) {
      this._toggleLog();
      input.j = false;
    }

    // Stats
    if (input.m) {
      this._toggleStats();
      input.m = false;
    }
  }

  private _onPlayerUIData = (payload: EventPayloads[PlayerUIEvent.DATA]): void => {
    const { data } = payload;

    if (data.type === 'dropItem') {
      const fromType = data.fromType;
      const fromIndex = parseInt(data.fromIndex);
      const container =
        fromType === 'backpack' ? this.backpack : 
        fromType === 'hotbar' ? this.hotbar :
        fromType === 'storage' ? this.storage :
        null;
      
      const droppedItem = container?.removeItem(fromIndex);

      if (droppedItem && this.world) {
        droppedItem.spawnEntityAsEjectedDrop(this.world, this.position, this.directionFromRotation);
      }
    }

    if (data.type === 'moveItem') {
      const { fromType, toType } = data;
      const fromIndex = parseInt(data.fromIndex);
      const toIndex = parseInt(data.toIndex);

      if (fromType === 'hotbar' && toType === 'hotbar') {
        this.hotbar.moveItem(fromIndex, toIndex);
      }

      if (fromType === 'backpack' && toType === 'backpack') {
        this.backpack.moveItem(fromIndex, toIndex);
      }

      if (fromType === 'backpack' && toType === 'hotbar') {
        const item = this.backpack.removeItem(fromIndex);
        if (item) {
          this.hotbar.addItem(item, toIndex);
        }
      }

      if (fromType === 'hotbar' && toType === 'backpack') {
        const item = this.hotbar.removeItem(fromIndex);
        if (item) {
          this.backpack.addItem(item, toIndex);
        }
      }
    }

    if (data.type === 'progressDialogue') {
      const { nextDialogueId } = data;

      if (this._currentDialogueEntity) {
        this._currentDialogueEntity.progressDialogue(this, nextDialogueId);
      }
    }

    if (data.type === 'setSelectedHotbarIndex') {
      this.hotbar.setSelectedIndex(data.index);
    }
  }

  private _setupPlayerCamera(): void {
    this.player.camera.setOffset({ x: 0, y: CAMERA_OFFSET_Y, z: 0 });
    this.player.camera.setFilmOffset(6.8);
    this.player.camera.setZoom(0.9);
    this.player.camera.setShoulderAngle(CAMERA_SHOULDER_ANGLE);
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

    // Sync Health UI
    this._updateHudHealthUI();

    // Listen for client->server UI data events
    this.player.ui.on(PlayerUIEvent.DATA, this._onPlayerUIData);
  }

  private _toggleBackpack = (): void => {
    this.player.ui.sendData({ type: 'toggleBackpack' });
  }

  private _toggleLog = (): void => {
    this.player.ui.sendData({ type: 'toggleLog' });
  }

  private _toggleStats = (): void => {
    this.player.ui.sendData({ type: 'toggleStats' });
  }

  private _updateHudHealthUI = (): void => {
    this.player.ui.sendData({
      type: 'syncHealth',
      health: this._health,
      maxHealth: this._maxHealth,
    });
  }
}