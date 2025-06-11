import {
  Player,
  PlayerUIEvent,
  EventPayloads,
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

export default class GamePlayer {
  private static _instances: Map<string, GamePlayer> = new Map();
  
  public readonly player: Player;
  public readonly backpack: Backpack;
  public readonly hotbar: Hotbar;
  public readonly storage: Storage;
  
  private _currentDialogueEntity: BaseEntity | undefined;
  private _currentMerchantEntity: BaseMerchantEntity | undefined;
  private _currentEntity: GamePlayerEntity | undefined;
  private _globalExperience: number = 0;
  private _health: number = 100;
  private _maxHealth: number = 100;
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

  public get globalExperience(): number {
    return this._globalExperience;
  }
  
  public get health(): number {
    return this._health;
  }
  
  public get maxHealth(): number {
    return this._maxHealth;
  }

  // Entity and UI management
  public spawnInRegion(entity: GamePlayerEntity): void {
    // Associate entity and load complete UI for region
    this._currentEntity = entity;
    this._loadUI();
    this._spawnHeldItem();
  }

  public despawnFromRegion(): void {
    this._currentEntity = undefined;
  }

  public setCurrentDialogueEntity(entity: BaseEntity): void {
    this._currentDialogueEntity = entity;
  }

  public setCurrentMerchantEntity(entity: BaseMerchantEntity): void {
    this._currentMerchantEntity = entity;
  }

  // Game state methods
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

  public getSkillExperience(skillId: SkillId): number {
    return this._skillExperience.get(skillId) ?? 0;
  }

  // UI Communication
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

  // Private implementation
  private _spawnHeldItem(): void {
    // Spawn held item for new entity
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
