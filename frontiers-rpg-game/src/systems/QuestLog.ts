import QuestRegistry from '../quests/QuestRegistry';
import type BaseQuest from '../quests/BaseQuest';
import type GamePlayer from '../GamePlayer';
import type BaseEntity from '../entities/BaseEntity';
import type { PlayerQuestState } from '../quests/BaseQuest';

export type SerializedQuestLogData = {
  quests: PlayerQuestState[];
};

export default class QuestLog {
  private _entityAlertClasses = new Set<typeof BaseEntity>();
  private _owner: GamePlayer;
  private _questStates = new Map<string, PlayerQuestState>();

  public constructor(owner: GamePlayer) {
    this._owner = owner;
  }

  public get owner(): GamePlayer { return this._owner; }
  
  public get activeQuests(): PlayerQuestState[] { 
    return Array.from(this._questStates.values()).filter(quest => quest.state === 'active');
  }

  public adjustObjectiveProgress(questId: string, objectiveId: string, adjustAmount: number): boolean {
    const questState = this._questStates.get(questId);
    if (!questState || questState.state !== 'active') return false;

    const questClass = QuestRegistry.getQuestClass(questId);
    if (!questClass) return false;

    const objective = questClass.objectives.find(o => o.id === objectiveId);
    if (!objective) return false;

    if (questState.objectiveProgress[objectiveId] >= objective.target) return false; // Already completed

    questState.objectiveProgress[objectiveId] += adjustAmount;

    if (questState.objectiveProgress[objectiveId] >= objective.target) {
      this._owner.showNotification(`Completed objective: ${objective.name}.`, 'complete');
    }

    this.syncUIUpdate(questId);
    this.updateEntityAlerts();

    this._owner.save();

    return true;
  }

  public startQuest(questClass: typeof BaseQuest): boolean {
    if (!questClass.id || this._questStates.has(questClass.id)) {
      return false;
    }

    const questState: PlayerQuestState = {
      questId: questClass.id,
      state: 'active',
      objectiveProgress: Object.fromEntries(questClass.objectives.map(obj => [obj.id, 0])),
      completionCleanup: questClass.setupForPlayer(this._owner),
    };

    this._questStates.set(questClass.id, questState);


    this.syncUIUpdate(questClass.id);
    this._owner.showNotification(`Started quest: ${questClass.name}. See quests for more details.`, 'new');

    this._owner.save();

    this.updateEntityAlerts();

    return true;
  }

  public updateEntityAlerts(): void {
    if (!this._owner.currentEntity) return;

    const shouldShowEntityClasses = new Set<typeof BaseEntity>();

    // Iterate all known quests and determine which entity classes should show alerts
    for (const questClass of QuestRegistry.getQuests().values()) {
      for (const dialogueInteraction of questClass.dialogueInteractions) {
        if (dialogueInteraction.enabledForInteractor(this._owner.currentEntity)) {
          shouldShowEntityClasses.add(dialogueInteraction.npcClass);
        }
      }
    }

    // Add new alerts
    for (const entityClass of shouldShowEntityClasses) {
      if (!this._entityAlertClasses.has(entityClass)) {
        this._owner.addEntityAlert(entityClass);
        this._entityAlertClasses.add(entityClass);
      }
    }

    // Remove alerts that are no longer needed
    for (const entityClass of this._entityAlertClasses) {
      if (!shouldShowEntityClasses.has(entityClass)) {
        this._owner.removeEntityAlert(entityClass);
        this._entityAlertClasses.delete(entityClass);
      }
    }
  }

  public completeQuest(questId: string): boolean {
    const questClass = QuestRegistry.getQuestClass(questId);
    const questState = this._questStates.get(questId);

    if (!questClass || !questState || questState.state !== 'active' || !questClass.rewardCompletionForPlayer(this._owner)) {
      return false;
    }

    questState.state = 'completed';
    questState.completionCleanup?.();
    
    this.syncUIUpdate(questId);
    this._owner.showNotification(`Completed quest: ${questClass.name}.`, 'success');

    this.updateEntityAlerts();

    return true;
  }

  public getQuestState(questId: string): PlayerQuestState | undefined {
    return this._questStates.get(questId);
  }

  public hasQuest(questId: string): boolean {
    return this._questStates.has(questId);
  }

  public isQuestActive(questId: string): boolean {
    return this._questStates.get(questId)?.state === 'active';
  }

  public isQuestCompleted(questId: string): boolean {
    return this._questStates.get(questId)?.state === 'completed';
  }

  public isQuestObjectiveCompleted(questId: string, objectiveId: string): boolean {
    const questState = this._questStates.get(questId);
    if (!questState || questState.state !== 'active') return false;

    const questClass = QuestRegistry.getQuestClass(questId);
    if (!questClass) return false;

    const objective = questClass.objectives.find(o => o.id === objectiveId);
    if (!objective) return false;

    if (questState.objectiveProgress[objectiveId] >= objective.target) {
      return true;
    }

    return false;
  }

  public serialize(): SerializedQuestLogData {
    const quests = Array.from(this._questStates.values());
    return { quests };
  }

  public syncUI(): void {
    for (const [ questId ] of this._questStates) {
      this.syncUIUpdate(questId);
    }
  }

  public syncUIUpdate(questId: string): void {
    const questClass = QuestRegistry.getQuestClass(questId);
    const questState = this._questStates.get(questId);

    if (!questClass || !questState) return;

    this._owner.player.ui.sendData({
      type: 'questUpdate',
      id: questId,
      name: questClass.name,
      description: questClass.description,
      objectives: questClass.objectives,
      reward: {
        items: questClass.reward.items?.map(item => ({
          name: item.itemClass.name,
          iconImageUri: item.itemClass.iconImageUri,
          quantity: item.quantity,
        })),
        skillExperience: questClass.reward.skillExperience,
      },
      state: questState
    });
  }

  public loadFromSerializedData(serializedQuestLogData: SerializedQuestLogData): boolean {
    try {
      const { quests } = serializedQuestLogData;
      
      // Clear existing quest states and alert classes
      this._entityAlertClasses.clear();
      this._questStates.clear();
      
      // Load quests
      for (const questState of quests) {
        const questClass = QuestRegistry.getQuestClass(questState.questId);
        
        if (!questState.questId || !questState.state || !questClass) continue;
        if (questState.state !== 'active' && questState.state !== 'completed') continue;
        
        // Load quest state
        this._questStates.set(questState.questId, {
          questId: questState.questId,
          state: questState.state,
          objectiveProgress: questState.objectiveProgress || {},
          completionCleanup: questClass.setupForPlayer(this._owner),
        });
      }

      return true;
    } catch {
      return false;
    }
  }
}