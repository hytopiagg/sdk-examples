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
import GoldItem from './items/general/GoldItem';
import Hotbar from './systems/Hotbar';
import Storage from './systems/Storage';
import type BaseEntity from './entities/BaseEntity';
import type BaseMerchantEntity from './entities/BaseMerchantEntity';
import type BaseItem from './items/BaseItem';
import type GameRegion from './GameRegion';
import type IDamageable from './interfaces/IDamageable';
import WoodenSwordItem from './items/weapons/WoodenSwordItem';

const CAMERA_OFFSET_Y = 0.8;
const CAMERA_SHOULDER_ANGLE = 11;
const DODGE_COOLDOWN_MS = 900;
const DODGE_DELAY_MS = 150;
const DODGE_DURATION_MS = 700;
const DODGE_HORIZONTAL_FORCE = 3;
const DODGE_VERTICAL_FORCE = 6;
const INTERACT_REACH = 3;

export default class GamePlayerEntity extends DefaultPlayerEntity implements IDamageable {
  public readonly backpack: Backpack;
  public readonly hotbar: Hotbar;
  public readonly storage: Storage;
  private _currentDialogueEntity: BaseEntity | undefined;
  private _currentMerchantEntity: BaseMerchantEntity | undefined;
  private _globalExperience: number = 0;
  private _lastDodgeTimeMs: number = 0;
  private _health: number = 100;
  private _maxHealth: number = 100;
  private _nameplateSceneUI: SceneUI;
  private _region: GameRegion;
  private _skillExperience: Map<SkillId, number> = new Map();

  public constructor(player: Player, region: GameRegion) {
    super({
      player,
      name: 'Player',
    });

    this.backpack = new Backpack(this.player);
    this.hotbar = new Hotbar(this.player);
    this.storage = new Storage(this.player);
    
    this._region = region;

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

  public adjustGold(amount: number, allowNegative: boolean = false): boolean {
    if (amount === 0) return true;

    if (amount > 0) {
      // Adding gold - stack with existing or create new
      const existingGold = this.hotbar.getItemByClass(GoldItem) ?? this.backpack.getItemByClass(GoldItem);
      if (existingGold) {
        // Use inventory method to trigger UI update
        const inventory = this.hotbar.getItemByClass(GoldItem) === existingGold ? this.hotbar : this.backpack;
        inventory.adjustItemQuantityByReference(existingGold, amount);
        return true;
      } else {
        const goldItem = new GoldItem({ quantity: amount });
        return this.hotbar.addItem(goldItem) || this.backpack.addItem(goldItem);
      }
    } else {
      // Subtracting gold - handle multiple stacks across inventories
      const hotbarGolds = this.hotbar.getItemsByClass(GoldItem);
      const backpackGolds = this.backpack.getItemsByClass(GoldItem);
      const totalGold = [...hotbarGolds, ...backpackGolds].reduce((sum, gold) => sum + gold.quantity, 0);
      let remainingToRemove = Math.abs(amount);
      
      if (totalGold < remainingToRemove && !allowNegative) {
        return false;
      }
            
      // Process hotbar golds first
      for (const gold of hotbarGolds) {
        if (remainingToRemove <= 0) break;
        
        if (gold.quantity <= remainingToRemove) {
          remainingToRemove -= gold.quantity;
          this.hotbar.removeItemByReference(gold);
        } else {
          this.hotbar.adjustItemQuantityByReference(gold, -remainingToRemove);
          remainingToRemove = 0;
        }
      }
      
      // Process backpack golds if needed
      for (const gold of backpackGolds) {
        if (remainingToRemove <= 0) break;
        
        if (gold.quantity <= remainingToRemove) {
          remainingToRemove -= gold.quantity;
          this.backpack.removeItemByReference(gold);
        } else {
          this.backpack.adjustItemQuantityByReference(gold, -remainingToRemove);
          remainingToRemove = 0;
        }
      }
      
      return true;
    }
  }

  public adjustHealth(amount: number): void {
    this._health = Math.max(0, Math.min(this._maxHealth, this._health + amount));
    this._updateHudHealthUI();
  }

  public adjustSkillExperience(skillId: SkillId, amount: number): void {
    this._globalExperience = Math.max(0, this._globalExperience + amount); // All skill XP adds to global XP
    this._skillExperience.set(skillId, Math.max(0, (this._skillExperience.get(skillId) ?? 0) + amount));
    this._updateExperienceUI();
  }

  public getSkillExperience(skillId: SkillId): number {
    return this._skillExperience.get(skillId) ?? 0;
  }

  public setCurrentDialogueEntity(entity: BaseEntity): void {
    this._currentDialogueEntity = entity;
  }

  public setCurrentMerchantEntity(entity: BaseMerchantEntity): void {
    this._currentMerchantEntity = entity;
  }

  public showNotification(message: string, notificationType: 'success' | 'error' | 'warning'): void {
    this.player.ui.sendData({
      type: 'showNotification',
      message,
      notificationType,
    });
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
      this.adjustSkillExperience(SkillId.AGILITY, damage);
      
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

  private _getLevelFromExperience(experience: number): number {
    if (experience <= 0) return 1;
    
    // Formula with lower starting values: xp = 35 * level^2.2
    // Inverse: level = (xp / 35)^(1/2.2)
    const calculatedLevel = Math.pow(experience / 35, 1 / 2.2);
    return Math.max(1, Math.floor(calculatedLevel));
  }

  private _getLevelRequiredExperience(level: number): number {
    if (level <= 1) return 0;
    // Formula with accessible early levels: xp = 35 * level^2.2
    return Math.floor(35 * Math.pow(level, 2.2));
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

    // Skills
    if (input.m) {
      this._toggleSkills();
      input.m = false;
    }
  }

  private _onPlayerUIData = (payload: EventPayloads[PlayerUIEvent.DATA]): void => {
    const { data } = payload;

    if (data.type === 'buyItem') {
      const { sourceIndex, quantity } = data;

      if (this._currentMerchantEntity) {
        this._currentMerchantEntity.buyItem(this, sourceIndex, quantity);
      }
    }

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
      const { optionId } = data;

      if (this._currentDialogueEntity && optionId !== undefined) {
        this._currentDialogueEntity.progressDialogue(this, optionId);
      }
    }

    if (data.type === 'sellItem') {
      const { sourceType, sourceIndex, quantity } = data;
      const fromItemInventory = 
        sourceType === 'backpack' ? this.backpack :
        sourceType === 'hotbar' ? this.hotbar :
        sourceType === 'storage' ? this.storage :
        null;

      if (fromItemInventory && this._currentMerchantEntity) {
        this._currentMerchantEntity.sellItem(this, fromItemInventory, sourceIndex, quantity);
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
        level: this._getLevelFromExperience(this._globalExperience),
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

    // Sync Experience UI
    this._updateExperienceUI();

    // Sync Health UI
    this._updateHudHealthUI();

    // Sync Skills Menu UI
    this._updateSkillsMenuUI();

    // Listen for client->server UI data events
    this.player.ui.on(PlayerUIEvent.DATA, this._onPlayerUIData);

    // Show Area Banner
    this.player.ui.sendData({
      type: 'showAreaBanner',
      areaName: this._region.name,
    });
  }

  private _toggleBackpack = (): void => {
    this.player.ui.sendData({ type: 'toggleBackpack' });
  }

  private _toggleLog = (): void => {
    this.player.ui.sendData({ type: 'toggleLog' });
  }

  private _toggleSkills = (): void => {
    this._updateSkillsExperienceUI();
    this.player.ui.sendData({ type: 'toggleSkills' });
  }

  private _updateExperienceUI = (): void => {
    const level = this._getLevelFromExperience(this._globalExperience);
    const currentLevelExp = this._getLevelRequiredExperience(level);
    const nextLevelExp = this._getLevelRequiredExperience(level + 1);
    
    this.player.ui.sendData({
      type: 'syncExp',
      level,
      exp: this._globalExperience,
      currentLevelExp,
      nextLevelExp,
    });
  }

  private _updateHudHealthUI = (): void => {
    this.player.ui.sendData({
      type: 'syncHealth',
      health: this._health,
      maxHealth: this._maxHealth,
    });
  }

  private _updateSkillsMenuUI = (): void => {
    this.player.ui.sendData({
      type: 'syncSkills',
      skills,
    });
  }

  private _updateSkillsExperienceUI = (): void => {
    this.player.ui.sendData({
      type: 'syncSkillsExp',
      skills: skills.map(skill => {
        const level = this._getLevelFromExperience(this.getSkillExperience(skill.id));

        return {
          skillId: skill.id,
          level,
          exp: this.getSkillExperience(skill.id),
          currentLevelExp: this._getLevelRequiredExperience(level),
          nextLevelExp: this._getLevelRequiredExperience(level + 1),
        }
      }),
    });
  }
}