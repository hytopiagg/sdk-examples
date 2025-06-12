import {
  Player,
  PlayerUIEvent,
  EventPayloads,
  Vector3Like,
} from 'hytopia';

import { SkillId, skills } from './config';
import Backpack from './systems/Backpack';
import Hotbar from './systems/Hotbar';
import Levels from './systems/Levels';
import Storage from './systems/Storage';
import GoldItem from './items/general/GoldItem';
import type BaseEntity from './entities/BaseEntity';
import type BaseMerchantEntity from './entities/BaseMerchantEntity';
import type BaseItem from './items/BaseItem';
import type GamePlayerEntity from './GamePlayerEntity';
import type GameRegion from './GameRegion';

export default class GamePlayer {
  private static _instances: Map<string, GamePlayer> = new Map();
  
  public readonly player: Player;
  public readonly backpack: Backpack;
  public readonly hotbar: Hotbar;
  public readonly storage: Storage;
  
  private _currentDialogueEntity: BaseEntity | undefined;
  private _currentMerchantEntity: BaseMerchantEntity | undefined;
  private _currentEntity: GamePlayerEntity | undefined;
  private _currentRegion: GameRegion | undefined;
  private _globalExperience: number = 0;
  private _health: number = 100;
  private _isDead: boolean = false;
  private _maxHealth: number = 100;
  private _regionSpawnPoint: Vector3Like | undefined;
  private _skillExperience: Map<SkillId, number> = new Map();

  private constructor(player: Player) {
    this.player = player;
    this.backpack = new Backpack(this.player);
    this.hotbar = new Hotbar(this.player);
    this.storage = new Storage(this.player);
    
    // Setup hotbar item handling
    this.hotbar.onSelectedItemChanged = this._onHotbarSelectedItemChanged;
  }

  public static getOrCreate(player: Player): GamePlayer {
    let gamePlayer = this._instances.get(player.id);
    if (!gamePlayer) {
      gamePlayer = new GamePlayer(player);
      this._instances.set(player.id, gamePlayer);
    }
    return gamePlayer;
  }

  public static remove(player: Player): void {
    const gamePlayer = this._instances.get(player.id);
    if (gamePlayer) {
      // Clean up any current entity association
      if (gamePlayer._currentEntity) {
        gamePlayer._currentEntity.despawn();
      }
      
      // Remove UI event listeners
      gamePlayer.player.ui.off(PlayerUIEvent.DATA, gamePlayer._onPlayerUIData);
      
      // Remove from instances map
      this._instances.delete(player.id);
    }
  }

  public static cleanup(): void {
    // Helper method to clean up all instances (useful for server shutdown)
    for (const [playerId, gamePlayer] of this._instances) {
      if (gamePlayer._currentEntity) {
        gamePlayer._currentEntity.despawn();
      }
      gamePlayer.player.ui.off(PlayerUIEvent.DATA, gamePlayer._onPlayerUIData);
    }
    this._instances.clear();
  }

  // Getters
  public get currentDialogueEntity(): BaseEntity | undefined {
    return this._currentDialogueEntity;
  }

  public get currentMerchantEntity(): BaseMerchantEntity | undefined {
    return this._currentMerchantEntity;
  }

  public get currentEntity(): GamePlayerEntity | undefined {
    return this._currentEntity;
  }

  public get currentRegion(): GameRegion | undefined {
    return this._currentRegion;
  }

  public get globalExperience(): number {
    return this._globalExperience;
  }
  
  public get health(): number {
    return this._health;
  }

  public get isDead(): boolean {
    return this._isDead;
  }
  
  public get maxHealth(): number {
    return this._maxHealth;
  }

  public get regionSpawnPoint(): Vector3Like | undefined {
    return this._regionSpawnPoint;
  }

  // Game state methods
  public adjustHealth(amount: number): void {
    this._health = Math.max(0, Math.min(this._maxHealth, this._health + amount));
    this._isDead = this._health <= 0;
    this._updateHudHealthUI();
    this._updateEntityHealthSceneUI();
  }

  public adjustInventoryItemQuantity(itemInventory: Backpack | Hotbar | Storage, item: BaseItem, amount: number): boolean {
    if (amount === 0) return true;

    const newQuantity = item.quantity + amount;
    
    if (newQuantity <= 0) {
      itemInventory.removeItemByReference(item);
      return true;
    } else {
      itemInventory.adjustItemQuantityByReference(item, amount);
      return true;
    }
  }

  public adjustGold(amount: number, allowNegative: boolean = false): boolean {
    if (amount === 0) return true;

    if (amount > 0) {
      // Adding gold - stack with existing or create new
      const existingGold = this.hotbar.getItemByClass(GoldItem) ?? this.backpack.getItemByClass(GoldItem);
      if (existingGold) {
        const inventory = this.hotbar.getItemByClass(GoldItem) === existingGold ? this.hotbar : this.backpack;
        return this.adjustInventoryItemQuantity(inventory, existingGold, amount);
      } else {
        const goldItem = new GoldItem({ quantity: amount });
        return this.hotbar.addItem(goldItem) || this.backpack.addItem(goldItem);
      }
    } else {
      // Subtracting gold - handle multiple stacks across inventories
      const hotbarGolds = this.hotbar.getItemsByClass(GoldItem);
      const backpackGolds = this.backpack.getItemsByClass(GoldItem);
      let totalGold = 0;
      
      // Calculate total gold without creating new arrays
      for (const gold of hotbarGolds) {
        totalGold += gold.quantity;
      }
      for (const gold of backpackGolds) {
        totalGold += gold.quantity;
      }
      
      let remainingToRemove = Math.abs(amount);
      
      if (totalGold < remainingToRemove && !allowNegative) {
        return false;
      }

      // Process hotbar gold first
      for (const gold of hotbarGolds) {
        if (remainingToRemove <= 0) break;
        
        const removeFromThis = Math.min(gold.quantity, remainingToRemove);
        this.adjustInventoryItemQuantity(this.hotbar, gold, -removeFromThis);
        remainingToRemove -= removeFromThis;
      }
      
      // Process backpack gold if needed
      for (const gold of backpackGolds) {
        if (remainingToRemove <= 0) break;
        
        const removeFromThis = Math.min(gold.quantity, remainingToRemove);
        this.adjustInventoryItemQuantity(this.backpack, gold, -removeFromThis);
        remainingToRemove -= removeFromThis;
      }
      
      return true;
    }
  }

  public adjustSkillExperience(skillId: SkillId, amount: number): void {
    // Capture current levels
    const oldMainLevel = Levels.getLevelFromExperience(this._globalExperience);
    const oldSkillLevel = Levels.getLevelFromExperience(this.getSkillExperience(skillId));
    
    // Update experience
    this._globalExperience += amount;
    this._skillExperience.set(skillId, (this._skillExperience.get(skillId) ?? 0) + amount);
    
    // Check for level ups and notify
    const newMainLevel = Levels.getLevelFromExperience(this._globalExperience);
    const newSkillLevel = Levels.getLevelFromExperience(this.getSkillExperience(skillId));
    
    if (newMainLevel > oldMainLevel) {
      this.showNotification(`Level up! You are now level ${newMainLevel}!`, 'success');
    }
    
    if (newSkillLevel > oldSkillLevel) {
      const skillName = skills.find(s => s.id === skillId)?.name ?? skillId;
      this.showNotification(`${skillName} leveled up to ${newSkillLevel}!`, 'success');
    }
    
    this._updateExperienceUI();
  }

  public despawnFromRegion(): void {
    this._currentEntity = undefined;
  }

  public getSkillExperience(skillId: SkillId): number {
    return this._skillExperience.get(skillId) ?? 0;
  }

  public onEntitySpawned(entity: GamePlayerEntity): void {
    this._currentEntity = entity;
    this._loadUI();
    this._spawnHeldItem();
  }

  public respawn(): void {
    if (!this._isDead || !this._currentEntity) return;

    // Restore health
    this._health = this._maxHealth;
    this._isDead = false;

    // Update UI
    this._updateHudHealthUI();
    this._updateEntityHealthSceneUI();

    // Teleport to spawn point if available
    this._currentEntity.setPosition(this._regionSpawnPoint ?? this._currentRegion!.spawnPoint);

    // Show respawn notification
    this.showNotification('You have respawned!', 'success');
  }

  public setCurrentDialogueEntity(entity: BaseEntity): void {
    this._currentDialogueEntity = entity;
  }

  public setCurrentMerchantEntity(entity: BaseMerchantEntity): void {
    this._currentMerchantEntity = entity;
  }

  public setRegionSpawnPoint(position: Vector3Like): void {
    this._regionSpawnPoint = position;
  }

  public setCurrentRegion(region: GameRegion): void {
    this._currentRegion = region;
  }

  public showNotification(message: string, notificationType: 'success' | 'error' | 'warning'): void {
    this.player.ui.sendData({
      type: 'showNotification',
      message,
      notificationType,
    });
  }

  public showAreaBanner(areaName: string): void {
    this.player.ui.sendData({
      type: 'showAreaBanner',
      areaName,
    });
  }

  public toggleBackpack = (): void => {
    this.player.ui.sendData({ type: 'toggleBackpack' });
  }

  public toggleLog = (): void => {
    this.player.ui.sendData({ type: 'toggleLog' });
  }

  public toggleSkills = (): void => {
    this._updateSkillsExperienceUI();
    this.player.ui.sendData({ type: 'toggleSkills' });
  }

  private _spawnHeldItem(): void {
    if (this._currentEntity && this.hotbar.selectedItem) {
      this.hotbar.selectedItem.spawnEntityAsHeld(this._currentEntity, 'hand_right_anchor');
    }
  }

  private _onHotbarSelectedItemChanged = (selectedItem: BaseItem | null, lastItem: BaseItem | null): void => {
    lastItem?.despawnEntity();
    if (this._currentEntity && selectedItem) {
      selectedItem.spawnEntityAsHeld(this._currentEntity, 'hand_right_anchor');
    }
  }

  private _onPlayerUIData = (payload: EventPayloads[PlayerUIEvent.DATA]): void => {
    const { data } = payload;

    if (data.type === 'buyItem') {
      const { sourceIndex, quantity } = data;

      if (this._currentMerchantEntity && this._currentEntity) {
        this._currentMerchantEntity.buyItem(this._currentEntity, sourceIndex, quantity);
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

      if (droppedItem && this._currentEntity?.world) {
        droppedItem.spawnEntityAsEjectedDrop(this._currentEntity.world, this._currentEntity.position, this._currentEntity.directionFromRotation);
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

      if (this._currentDialogueEntity && this._currentEntity && optionId !== undefined) {
        this._currentDialogueEntity.progressDialogue(this._currentEntity, optionId);
      }
    }

    if (data.type === 'respawnPlayer') {
      this.respawn();
    }

    if (data.type === 'sellItem') {
      const { sourceType, sourceIndex, quantity } = data;
      const fromItemInventory = 
        sourceType === 'backpack' ? this.backpack :
        sourceType === 'hotbar' ? this.hotbar :
        sourceType === 'storage' ? this.storage :
        null;

      if (fromItemInventory && this._currentMerchantEntity && this._currentEntity) {
        this._currentMerchantEntity.sellItem(this._currentEntity, fromItemInventory, sourceIndex, quantity);
      }
    }

    if (data.type === 'setSelectedHotbarIndex') {
      this.hotbar.setSelectedIndex(data.index);
    }
  }

  private _loadUI(): void {
    // Complete UI reload for region changes (client disconnect/reconnect)
    this.player.ui.load('ui/index.html');

    // Sync all UI state
    this._updateExperienceUI();
    this._updateHudHealthUI();
    this._updateSkillsMenuUI();
    this.backpack.syncUI(this.player);
    this.hotbar.syncUI(this.player);

    // Setup UI event listener (remove existing to prevent duplicates)
    this.player.ui.off(PlayerUIEvent.DATA, this._onPlayerUIData);
    this.player.ui.on(PlayerUIEvent.DATA, this._onPlayerUIData);
  }

  private _updateEntityHealthSceneUI(): void {
    if (!this._currentEntity) return;

    this._currentEntity.nameplateSceneUI.setState({
      dodged: false,
      health: this.health,
      maxHealth: this.maxHealth,
    });
  }

  private _updateExperienceUI(): void {
    const level = Levels.getLevelFromExperience(this._globalExperience);
    const currentLevelExp = Levels.getLevelRequiredExperience(level);
    const nextLevelExp = Levels.getLevelRequiredExperience(level + 1);
    
    this.player.ui.sendData({
      type: 'syncExp',
      level,
      exp: this._globalExperience,
      currentLevelExp,
      nextLevelExp,
    });
  }

  private _updateHudHealthUI(): void {
    this.player.ui.sendData({
      type: 'syncHealth',
      health: this._health,
      maxHealth: this._maxHealth,
    });
  }

  private _updateSkillsMenuUI(): void {
    this.player.ui.sendData({
      type: 'syncSkills',
      skills,
    });
  }

  private _updateSkillsExperienceUI(): void {
    this.player.ui.sendData({
      type: 'syncSkillsExp',
      skills: skills.map(skill => {
        const level = Levels.getLevelFromExperience(this.getSkillExperience(skill.id));

        return {
          skillId: skill.id,
          level,
          exp: this.getSkillExperience(skill.id),
          currentLevelExp: Levels.getLevelRequiredExperience(level),
          nextLevelExp: Levels.getLevelRequiredExperience(level + 1),
        }
      }),
    });
  }
}
