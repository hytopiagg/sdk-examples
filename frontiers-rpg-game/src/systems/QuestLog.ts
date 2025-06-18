import { Player } from 'hytopia';
import QuestRegistry from '../quests/QuestRegistry';
import type BaseQuest from '../quests/BaseQuest';
import type GamePlayer from '../GamePlayer';
import type { PlayerQuestState } from '../quests/BaseQuest';

export type SerializedQuestLogData = {
  quests: PlayerQuestState[];
};

export default class QuestLog {
  private _owner: GamePlayer;
  private _questStates = new Map<string, PlayerQuestState>();

  public constructor(owner: GamePlayer) {
    this._owner = owner;
  }

  public get owner(): GamePlayer { return this._owner; }
  public get activeQuests(): PlayerQuestState[] { 
    return Array.from(this._questStates.values()).filter(quest => quest.state === 'active');
  }

  public startQuest(questClass: typeof BaseQuest): boolean {
    if (!questClass.id || this._questStates.has(questClass.id)) {
      return false;
    }

    const questState: PlayerQuestState = {
      questId: questClass.id,
      state: 'active',
      objectiveProgress: Object.fromEntries(questClass.objectives.map(obj => [obj.id, 0]))
    };

    this._questStates.set(questClass.id, questState);

    return true;
  }

  public updateObjectiveProgress(questId: string, objectiveId: string, progress: number): boolean {
    const questState = this._questStates.get(questId);
    if (!questState || questState.state !== 'active') {
      return false;
    }

    questState.objectiveProgress[objectiveId] = progress;
    
    return true;
  }

  public completeQuest(questId: string): boolean {
    const questClass = QuestRegistry.getQuestClass(questId);
    const questState = this._questStates.get(questId);

    if (!questClass || !questState || questState.state !== 'active' || !questClass.rewardCompletionForPlayer(this._owner)) {
      return false;
    }

    questState.state = 'completed';
    
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

  public serialize(): SerializedQuestLogData {
    const quests = Array.from(this._questStates.values());
    return { quests };
  }

  public loadFromSerializedData(serializedQuestLogData: SerializedQuestLogData): boolean {
    try {
      const { quests } = serializedQuestLogData;
      
      // Clear existing quest states
      this._questStates.clear();
      
      // Load quests
      for (const questState of quests) {
        if (!questState.questId || !questState.state) continue;
        if (questState.state !== 'active' && questState.state !== 'completed') continue;
        
        // Load quest state
        this._questStates.set(questState.questId, {
          questId: questState.questId,
          state: questState.state,
          objectiveProgress: questState.objectiveProgress || {}
        });

        // Setup quest for player, IE event listeners, etc.
        const questClass = QuestRegistry.getQuestClass(questState.questId);

        if (questClass) {
          questClass.setupForPlayer(this._owner);
        }
      }

      return true;
    } catch {
      return false;
    }
  }
}