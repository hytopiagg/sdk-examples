import {
  EventPayloads,
  EventRouter,
  Player,
  PlayerUIEvent,
  Vector3Like,
} from 'hytopia';

import { SkillId, skills } from './config';
import Backpack from './systems/Backpack';
import GameManager from './GameManager';
import GoldItem from './items/general/GoldItem';
import Hotbar from './systems/Hotbar';
import Levels from './systems/Levels';
import QuestLog from './systems/QuestLog';
import Storage from './systems/Storage';
import Wearables from './systems/Wearables';
import type BaseEntity from './entities/BaseEntity';
import type BaseMerchantEntity from './entities/BaseMerchantEntity';
import type BaseItem from './items/BaseItem';
import type GamePlayerEntity from './GamePlayerEntity';
import type GameRegion from './GameRegion';
import ItemInventory, { SerializedItemInventoryData } from './systems/ItemInventory';
import type { SerializedQuestLogData } from './systems/QuestLog';
import type { SerializedWearablesData } from './systems/Wearables';

import TrainingSwordItem from './items/weapons/TrainingSwordItem';

export enum GamePlayerPlayerEvent {
  DIED = 'GamePlayer.DIED',
  RESPAWNED = 'GamePlayer.RESPAWNED',
}

export type GamePlayerPlayerEventPayloads = {
  [GamePlayerPlayerEvent.DIED]: null;
  [GamePlayerPlayerEvent.RESPAWNED]: null;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'complete' | 'new';

type SerializedGamePlayerData = {
  health: number;
  currentRegionId: string | undefined;
  currentRegionSpawnFacingAngle: number | undefined;
  currentRegionSpawnPoint: Vector3Like | undefined;
  skillExperience: [SkillId, number][];
  backpack: SerializedItemInventoryData;
  hotbar: SerializedItemInventoryData;
  questLog: SerializedQuestLogData;
  storage: SerializedItemInventoryData;
  wearables: SerializedWearablesData;
}

export default class GamePlayer {
  private static _instances: Map<string, GamePlayer> = new Map();
  
  public readonly eventRouter: EventRouter;
  public readonly player: Player;
  public readonly backpack: Backpack;
  public readonly hotbar: Hotbar;
  public readonly questLog: QuestLog;
  public readonly storage: Storage;
  public readonly wearables: Wearables
  
  private _currentDialogueEntity: BaseEntity | undefined;
  private _currentMerchantEntity: BaseMerchantEntity | undefined;
  private _currentEntity: GamePlayerEntity | undefined;
  private _currentRegion: GameRegion | undefined;
  private _currentRegionSpawnFacingAngle: number | undefined;
  private _currentRegionSpawnPoint: Vector3Like | undefined;
  private _entityAlertClassNames: Set<string> = new Set();
  private _globalExperience: number = 0;
  private _health: number = 100;
  private _isDead: boolean = false;
  private _skillExperience: Map<SkillId, number> = new Map();

  private constructor(player: Player) {
    this.eventRouter = new EventRouter();
    this.player = player;
    this.backpack = new Backpack(this);
    this.hotbar = new Hotbar(this);
    this.storage = new Storage(this);
    this.questLog = new QuestLog(this);
    this.wearables = new Wearables(this);
    
    // Setup hotbar item handling
    this.hotbar.onSelectedItemChanged = this._onHotbarSelectedItemChanged;
  }

  public static async getOrCreate(player: Player): Promise<GamePlayer> {
    let gamePlayer = this._instances.get(player.id);
    if (!gamePlayer) {
      gamePlayer = new GamePlayer(player);
      await gamePlayer.load();
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

  public get currentRegionSpawnPoint(): Vector3Like | undefined {
    return this._currentRegionSpawnPoint;
  }

  public get currentRegionSpawnFacingAngle(): number | undefined {
    return this._currentRegionSpawnFacingAngle;
  }

  public get entityAlertClassNames(): Set<string> {
    return this._entityAlertClassNames;
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
    const level = Levels.getLevelFromExperience(this._globalExperience);
    return 100 + (level - 1) * 10;
  }

  public get respawnFacingAngle(): number {
    return this._currentRegionSpawnFacingAngle ?? this._currentRegion!.spawnFacingAngle;
  }

  public get respawnPoint(): Vector3Like {
    return this._currentRegionSpawnPoint ?? this._currentRegion!.spawnPoint;
  }

  public addEntityAlert(entityClass: typeof BaseEntity): void {
    if (this._entityAlertClassNames.has(entityClass.name)) return;

    this._entityAlertClassNames.add(entityClass.name);

    this.player.ui.sendData({
      type: 'addEntityAlert',
      className: entityClass.name,
    });
  }

  // Game state methods
  public adjustHealth(amount: number): void {
    const willDie = this._health > 0 && this._health + amount <= 0;
    this._health = Math.max(0, Math.min(this.maxHealth, this._health + amount));
    this._isDead = this._health <= 0;
    this._updateHudHealthUI();
    this._updateEntityHealthSceneUI();

    if (this._currentEntity) {
      this._currentEntity.playerController.idleLoopedAnimations = this._isDead ? ['sleep'] : ['idle-lower', 'idle-upper'];
    }

    if (willDie) {
      this.eventRouter.emit(GamePlayerPlayerEvent.DIED, null);
    }
  }

  public adjustInventoryItemQuantityByReference(itemInventory: Backpack | Hotbar | Storage, item: BaseItem, amount: number): boolean {
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
        return this.adjustInventoryItemQuantityByReference(inventory, existingGold, amount);
      } else {
        const goldItem = GoldItem.create({ quantity: amount });
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
        this.adjustInventoryItemQuantityByReference(this.hotbar, gold, -removeFromThis);
        remainingToRemove -= removeFromThis;
      }
      
      // Process backpack gold if needed
      for (const gold of backpackGolds) {
        if (remainingToRemove <= 0) break;
        
        const removeFromThis = Math.min(gold.quantity, remainingToRemove);
        this.adjustInventoryItemQuantityByReference(this.backpack, gold, -removeFromThis);
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
      // Full heal on level up!
      this._health = this.maxHealth;
      
      this._currentEntity?.setNameplateLevel(newMainLevel);
      this.showNotification(`Level up! You are now level ${newMainLevel}!`, 'success');
      this._updateHudHealthUI();
      this._updateEntityHealthSceneUI();
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

  public async load(): Promise<void> {
    const serializedGamePlayerData = await this.player.getPersistedData();

    if (serializedGamePlayerData) { // Existing player, load their state
      this._loadFromSerializedData(serializedGamePlayerData as SerializedGamePlayerData);
    } else { // New player, give them starting training sword
      const trainingSword = TrainingSwordItem.create();
      this.hotbar.addItem(trainingSword);
    }
  }

  public onEntitySpawned(entity: GamePlayerEntity): void {
    this._currentEntity = entity;
    this._loadUI();
    this._spawnHeldItem();
  }

  public removeEntityAlert(entityClass: typeof BaseEntity): void {
    if (!this._entityAlertClassNames.has(entityClass.name)) return;

    this._entityAlertClassNames.delete(entityClass.name);

    this.player.ui.sendData({
      type: 'removeEntityAlert',
      className: entityClass.name,
    });
  }

  public respawn(): void {
    if (!this._isDead || !this._currentEntity) return;

    // Restore health
    this.adjustHealth(this.maxHealth);

    // Teleport to spawn point if available
    this._currentEntity.setPosition(this.respawnPoint);

    // Re enable movement if it was disabled
    this._currentEntity.setIsMovementDisabled(false);

    // Show respawn notification
    this.showNotification('You have respawned!', 'success');

    // Emit event to GamePlayer to handle respawn
    this.eventRouter.emit(GamePlayerPlayerEvent.RESPAWNED, null);
  }

  public setCurrentDialogueEntity(entity: BaseEntity): void {
    this._currentDialogueEntity = entity;
  }

  public setCurrentMerchantEntity(entity: BaseMerchantEntity): void {
    this._currentMerchantEntity = entity;
  }

  public setCurrentRegion(region: GameRegion): void {
    this._currentRegion = region;
  }
  
  public setCurrentRegionSpawnFacingAngle(facingAngle: number): void {
    this._currentRegionSpawnFacingAngle = facingAngle;
  }

  public setCurrentRegionSpawnPoint(position: Vector3Like): void {
    this._currentRegionSpawnPoint = position;
  }

  public save(): void {
    this.player.setPersistedData(this._serialize());
  }

  public showNotification(message: string, notificationType: NotificationType): void {
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

  public toggleHelp = (): void => {
    this.player.ui.sendData({ type: 'toggleHelp' });
  }

  public toggleQuests = (): void => {
    this.player.ui.sendData({ type: 'toggleQuests' });
  }

  public toggleSkills = (): void => {
    this._updateSkillsExperienceUI();
    this.player.ui.sendData({ type: 'toggleSkills' });
  }

  private _loadFromSerializedData(serializedGamePlayerData: SerializedGamePlayerData): boolean {
    try {
      const playerData = serializedGamePlayerData;

      // Restore basic stats
      this._currentRegionSpawnFacingAngle = playerData.currentRegionSpawnFacingAngle;
      this._currentRegionSpawnPoint = playerData.currentRegionSpawnPoint;
      this._globalExperience = playerData.skillExperience.reduce((acc, [, experience]) => acc + experience, 0);
      this._health = playerData.health;
      this._isDead = this._health <= 0;
      
      // Restore current region if available
      if (playerData.currentRegionId) {
        
        const region = GameManager.instance.getRegion(playerData.currentRegionId);
        if (region) {
          this._currentRegion = region;
        }
      }
      
      // Restore skill experience
      this._skillExperience.clear();
      if (playerData.skillExperience) {
        for (const [skillId, experience] of playerData.skillExperience) {
          this._skillExperience.set(skillId, experience);
        }
      }
      
      // Restore inventories
      const backpackSuccess = this.backpack.loadFromSerializedData(playerData.backpack);
      const hotbarSuccess = this.hotbar.loadFromSerializedData(playerData.hotbar);
      const storageSuccess = this.storage.loadFromSerializedData(playerData.storage);
      const wearablesSuccess = this.wearables.loadFromSerializedData(playerData.wearables);
      
      // Restore quest log
      const questLogSuccess = this.questLog.loadFromSerializedData(playerData.questLog);

      return backpackSuccess && hotbarSuccess && storageSuccess && wearablesSuccess && questLogSuccess;
    } catch (error) {
      console.error('Failed to deserialize GamePlayer data:', error);
      return false;
    }
  }

  private _spawnHeldItem(): void {
    if (this._currentEntity && this.hotbar.selectedItem) {
      this.hotbar.selectedItem.spawnEntityAsHeld(this._currentEntity, 'hand-right-anchor');
    }
  }

  private _onHotbarSelectedItemChanged = (selectedItem: BaseItem | null, lastItem: BaseItem | null): void => {
    lastItem?.despawnEntity();
    if (this._currentEntity && selectedItem) {
      selectedItem.spawnEntityAsHeld(this._currentEntity, 'hand-right-anchor');
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
        this._moveInventoryItem(this.backpack, this.hotbar, fromIndex, toIndex);
      }

      if (fromType === 'backpack' && toType === 'wearables') {
        this._moveInventoryItem(this.backpack, this.wearables, fromIndex, 0);
      }

      if (fromType === 'hotbar' && toType === 'backpack') {
        this._moveInventoryItem(this.hotbar, this.backpack, fromIndex, toIndex);
      }

      if (fromType === 'hotbar' && toType === 'wearables') {
        this._moveInventoryItem(this.hotbar, this.wearables, fromIndex, 0);
      }

      if (fromType === 'wearables' && toType === 'backpack') {
        this._moveInventoryItem(this.wearables, this.backpack, fromIndex, toIndex);
      }

      if (fromType === 'wearables' && toType === 'hotbar') {
        this._moveInventoryItem(this.wearables, this.hotbar, fromIndex, toIndex);
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
    this._updateEntityAlertsSceneUIs();
    this.backpack.syncUI(this.player);
    this.hotbar.syncUI(this.player);
    this.wearables.syncUI(this.player);
    this.questLog.syncUI();

    // Setup UI event listener (remove existing to prevent duplicates)
    this.player.ui.off(PlayerUIEvent.DATA, this._onPlayerUIData);
    this.player.ui.on(PlayerUIEvent.DATA, this._onPlayerUIData);
  }

  private _moveInventoryItem(source: ItemInventory, dest: ItemInventory, fromIndex: number, toIndex: number): void {
    const item = source.removeItem(fromIndex);
    if (item && !dest.addItem(item, toIndex)) {
      source.addItem(item, fromIndex); // Put back where it was if failed
    }
  }

  private _serialize(): SerializedGamePlayerData {    
    const playerData = {
      health: this._health,
      currentRegionId: this._currentRegion?.id,
      currentRegionSpawnFacingAngle: this._currentRegionSpawnFacingAngle,
      currentRegionSpawnPoint: this._currentRegionSpawnPoint,
      skillExperience: Array.from(this._skillExperience.entries()),
      backpack: this.backpack.serialize(),
      hotbar: this.hotbar.serialize(),
      questLog: this.questLog.serialize(),
      storage: this.storage.serialize(),
      wearables: this.wearables.serialize(),
    };
    
    return playerData;
  }

  private _updateEntityAlertsSceneUIs(): void {
    this.player.ui.sendData({
      type: 'syncEntityAlerts',
      classNames: Array.from(this._entityAlertClassNames),
    });
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
      maxHealth: this.maxHealth,
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
