import {
  BaseEntityControllerEvent,
  CollisionGroup,
  CollisionGroupsBuilder,
  DefaultPlayerEntity,
  DefaultPlayerEntityController,
  EventPayloads,
  QuaternionLike,
  SceneUI,
  Vector3Like,
  World,
} from 'hytopia';

import { SkillId } from './config';
import CustomCollisionGroup from './physics/CustomCollisionGroup';
import GameClock from './GameClock';
import GamePlayer from './GamePlayer';
import Levels from './systems/Levels';
import type GameRegion from './GameRegion';
import type IDamageable from './interfaces/IDamageable';
import type { NotificationType } from './GamePlayer';

export enum GamePlayerEntityPlayerEvent {
  DAMAGED = 'GamePlayerEntity.DAMAGED',
  DODGED = 'GamePlayerEntity.DODGED',
}

export type GamePlayerEntityPlayerEventPayloads = {
  [GamePlayerEntityPlayerEvent.DAMAGED]: { damage: number };
  [GamePlayerEntityPlayerEvent.DODGED]: null;
}

const CAMERA_OFFSET_Y = 0.8;
const CAMERA_SHOULDER_ANGLE = 11;
const DODGE_COOLDOWN_MS = 900;
const DODGE_DELAY_MS = 150;
const DODGE_DURATION_MS = 700;
const DODGE_HORIZONTAL_FORCE = 3;
const DODGE_VERTICAL_FORCE = 6;
const INTERACT_REACH = 3;

export default class GamePlayerEntity extends DefaultPlayerEntity implements IDamageable {
  private readonly _gamePlayer: GamePlayer;
  private _isMovementDisabled: boolean = false;
  private _lastDodgeTimeMs: number = 0;
  private _nameplateSceneUI: SceneUI;

  public constructor(gamePlayer: GamePlayer) {
    super({
      player: gamePlayer.player,
      name: 'Player',
    });

    this._gamePlayer = gamePlayer;

    this._setupPlayerCamera();
    this._setupPlayerController();
    this._setupPlayerUI();
  }

  // Delegate state getters to GamePlayer
  public get adjustedRaycastPosition(): Vector3Like {
    return {
      x: this.position.x,
      y: this.position.y + CAMERA_OFFSET_Y / 2,
      z: this.position.z,
    }
  }

  public get adjustedFacingDirection(): Vector3Like {
    const shoulderAngleRad = -this.player.camera.shoulderAngle * Math.PI / 180;
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

  public get gamePlayer(): GamePlayer {
    return this._gamePlayer;
  }

  public get globalExperience(): number {
    return this._gamePlayer.globalExperience;
  }
  
  public get health(): number {
    return this._gamePlayer.health;
  }

  public get isDamaged(): boolean {
    return this._gamePlayer.health < this._gamePlayer.maxHealth;
  }
  
  public get isDodging(): boolean {
    const timeSinceDodge = performance.now() - this._lastDodgeTimeMs;
    return timeSinceDodge >= DODGE_DELAY_MS && timeSinceDodge < (DODGE_DELAY_MS + DODGE_DURATION_MS);
  }

  public get isMovementDisabled(): boolean {
    return this._isMovementDisabled;
  }
  
  public get maxHealth(): number {
    return this._gamePlayer.maxHealth;
  } 

  public get nameplateSceneUI(): SceneUI {
    return this._nameplateSceneUI;
  }
  
  public get playerController(): DefaultPlayerEntityController {
    return this.controller as DefaultPlayerEntityController;
  }

  public get region(): GameRegion {
    return this._gamePlayer.currentRegion!;
  }

  // Delegate state management methods to GamePlayer
  public adjustGold(amount: number, allowNegative: boolean = false): boolean {
    return this._gamePlayer.adjustGold(amount, allowNegative);
  }

  public adjustHealth(amount: number): void {
    this._gamePlayer.adjustHealth(amount);
  }

  public adjustSkillExperience(skillId: SkillId, amount: number): void {
    this._gamePlayer.adjustSkillExperience(skillId, amount);
  }

  public getSkillExperience(skillId: SkillId): number {
    return this._gamePlayer.getSkillExperience(skillId);
  }

  public setCurrentDialogueEntity(entity: any): void {
    this._gamePlayer.setCurrentDialogueEntity(entity);
  }

  public setCurrentMerchantEntity(entity: any): void {
    this._gamePlayer.setCurrentMerchantEntity(entity);
  }

  public setIsMovementDisabled(isDisabled: boolean): void {
    this._isMovementDisabled = isDisabled;
  }

  public setNameplateLevel(level: number): void {
    this._nameplateSceneUI.setState({ level });
  }

  public showNotification(message: string, notificationType: NotificationType): void {
    this._gamePlayer.showNotification(message, notificationType);
  }

  public override spawn(world: World, position: Vector3Like, rotation?: QuaternionLike) {
    super.spawn(world, position, rotation);
    
    this._gamePlayer.onEntitySpawned(this);
    
    this._nameplateSceneUI.load(world);

    // Load entity alerts after spawn since alert state can depend on entity state not just the player.
    this._gamePlayer.questLog.updateEntityAlerts();
  }

  public override despawn(): void {
    // Call super despawn first to clean up the entity properly
    super.despawn();
    // Disassociate entity from GamePlayer
    this._gamePlayer.despawnFromRegion();
    // Save player data
    this._gamePlayer.save();
  }

  public takeDamage(damage: number): void {
    if (this._gamePlayer.health <= 0) return; // dead, don't take more damage
    
    if (this.isDodging) { // in dodge state, don't take damage
      this.adjustSkillExperience(SkillId.AGILITY, damage);
      
      this._nameplateSceneUI.setState({ dodged: true });

      this._gamePlayer.eventRouter.emit(GamePlayerEntityPlayerEvent.DODGED, null);

      return;
    } 

    this._gamePlayer.adjustHealth(-damage);

    this._gamePlayer.eventRouter.emit(GamePlayerEntityPlayerEvent.DAMAGED, { damage });
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
        filterGroups: CollisionGroupsBuilder.buildRawCollisionGroups({
          belongsTo: [ CollisionGroup.ALL ],
          collidesWith: [ CollisionGroup.ENTITY, CustomCollisionGroup.ITEM ],
        }),
        filterExcludeRigidBody: this.rawRigidBody,
        filterFlags: 8,
      },
    );

    if (raycastResult?.hitEntity) {
      if ('interact' in raycastResult.hitEntity && typeof raycastResult.hitEntity.interact === 'function') {
        raycastResult.hitEntity.interact(this);
      }
    }
  }

  private _onTickWithPlayerInput = (payload: EventPayloads[BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT]): void => {
    const { input } = payload;
    const canInteract = !this._isMovementDisabled && !this._gamePlayer.isDead;

    // Face camera direction on item usage & interact
    if ((input.ml || input.mr || input.e) && canInteract) {
      const halfYaw = this.player.camera.orientation.yaw * 0.5;
      this.setRotation({
        x: 0,
        y: Math.sin(halfYaw),
        z: 0,
        w: Math.cos(halfYaw),
      });
    }

    // Left click item usage
    if (input.ml && canInteract) {
      const selectedItem = this._gamePlayer.hotbar.selectedItem;
      
      if (selectedItem) {
        selectedItem.useMouseLeft();
      } else {
        this.startModelOneshotAnimations([ 'simple-interact' ]);
      }

      input.ml = false;
    }

    // Right click item usage
    if (input.mr && canInteract) {
      const selectedItem = this._gamePlayer.hotbar.selectedItem;

      if (selectedItem) {
        selectedItem.useMouseRight();
      }

      input.mr = false;
    }

    // NPC & Environment Interact
    if (input.e && canInteract) {
      this._interact();
      input.e = false;
    }

    // Dodge
    if (input.q && canInteract) {
      this._dodge();
      input.q = false;
    }

    // Backpack
    if (input.i) {
      this._gamePlayer.toggleBackpack();
      input.i = false;
    }

    // Quest Log
    if (input.j) {
      this._gamePlayer.toggleQuests();
      input.j = false;
    }

    // Skills
    if (input.m) {
      this._gamePlayer.toggleSkills();
      input.m = false;
    }

    // Help
    if (input.o) {
      this._gamePlayer.toggleHelp();
      input.o = false;
    }
  }

  private _setupPlayerCamera(): void {
    this.player.camera.setOffset({ x: 0, y: CAMERA_OFFSET_Y, z: 0 });
    this.player.camera.setFilmOffset(6.8);
    this.player.camera.setZoom(0.9);
    this.player.camera.setShoulderAngle(CAMERA_SHOULDER_ANGLE);
  }

  private _setupPlayerController(): void {
    this.playerController.faceForwardOnStop = false;
    this.playerController.interactOneshotAnimations = [];
    this.playerController.canJump = () => !this._gamePlayer.isDead && !this._isMovementDisabled;
    this.playerController.canRun = () => !this._gamePlayer.isDead && !this._isMovementDisabled;
    this.playerController.canSwim = () => !this._gamePlayer.isDead && !this._isMovementDisabled;
    this.playerController.canWalk = () => !this._gamePlayer.isDead && !this._isMovementDisabled;
    this.playerController.on(BaseEntityControllerEvent.TICK_WITH_PLAYER_INPUT, this._onTickWithPlayerInput);
  } 

  private _setupPlayerUI(): void {
    const nameplateYOffset = this.height / 2 + 0.2;

    // Setup Health UI
    this._nameplateSceneUI = new SceneUI({
      attachedToEntity: this,
      templateId: 'entity-nameplate',
      state: {
        name: this.player.username,
        level: Levels.getLevelFromExperience(this._gamePlayer.globalExperience),
        health: this._gamePlayer.health,
        maxHealth: this._gamePlayer.maxHealth,
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

    // Show Area Banner
    this._gamePlayer.showAreaBanner(this._gamePlayer.currentRegion!.name);
  }
}