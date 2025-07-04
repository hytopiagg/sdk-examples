import BaseEntity from '../entities/BaseEntity';
import BaseQuest from './BaseQuest';
import type { BaseEntityDialogueOption } from '../entities/BaseEntity';
import type GamePlayerEntity from '../GamePlayerEntity';
import type { QuestNpcDialogueInteraction } from './BaseQuest';

type QuestClass = typeof BaseQuest;

export const QUEST_DIALOGUE_OPTION_START_ID = 1000;

export default class QuestRegistry {
  private static _quests = new Map<string, QuestClass>();
  private static _dialogueOptionData = new Map<string, { option: BaseEntityDialogueOption; interaction: QuestNpcDialogueInteraction }>();
  private static _npcRootDialogueOptionIds = new Map<typeof BaseEntity, Set<number>>();

  public static getQuests(): Map<string, QuestClass> {
    return this._quests;
  }

  public static getQuestClass(questId: string): QuestClass | undefined {
    return this._quests.get(questId);
  }

  public static getQuestRootDialogueOptionsForNPC(npcClass: typeof BaseEntity, interactor: GamePlayerEntity): BaseEntityDialogueOption[] {
    const rootDialogueOptionIds = this._npcRootDialogueOptionIds.get(npcClass);
    if (!rootDialogueOptionIds) return [];

    const options: BaseEntityDialogueOption[] = [];
    for (const optionId of rootDialogueOptionIds) {
      const data = this._dialogueOptionData.get(`${npcClass.name}-${optionId}`);
      if (data?.interaction.enabledForInteractor(interactor)) {
        options.push(data.option);
      }
    }
    return options;
  }

  public static getValidQuestDialogueOptionForNPC(npcClass: typeof BaseEntity, optionId: number, interactor: GamePlayerEntity): BaseEntityDialogueOption | undefined {
    const data = this._dialogueOptionData.get(`${npcClass.name}-${optionId}`);
    return data?.interaction.enabledForInteractor(interactor) ? data.option : undefined;
  }
  
  public static initializeQuests(): void {
    console.log('Loading quests...');
    
    const QuestClasses = require('./QuestClasses').default; // lazy load to avoid circular dependencies
    const npcIdCounters = new Map<typeof BaseEntity, number>();
    let loadedCount = 0;
    
    for (const QuestClass of QuestClasses) {
      try {
        if (QuestClass?.prototype instanceof BaseQuest && QuestClass.id) {
          this._quests.set(QuestClass.id, QuestClass);
          
          for (const interaction of QuestClass.dialogueInteractions) {
            let currentId = npcIdCounters.get(interaction.npcClass) ?? QUEST_DIALOGUE_OPTION_START_ID;
            
            const assignIds = (dialogueOption: BaseEntityDialogueOption, isRoot: boolean = false): void => {
              const optionId = currentId++;
              
              dialogueOption._id = optionId;
              this._dialogueOptionData.set(`${interaction.npcClass.name}-${optionId}`, { option: dialogueOption, interaction });
              
              if (isRoot) {
                let npcRootOptionIds = this._npcRootDialogueOptionIds.get(interaction.npcClass);
                if (!npcRootOptionIds) {
                  npcRootOptionIds = new Set();
                  this._npcRootDialogueOptionIds.set(interaction.npcClass, npcRootOptionIds);
                }
                npcRootOptionIds.add(optionId);
              }

              if (dialogueOption.nextDialogue?.options) {
                for (const option of dialogueOption.nextDialogue.options) {
                  assignIds(option, false);
                }
              }
            };
            
            assignIds(interaction.dialogueOption, true);
            npcIdCounters.set(interaction.npcClass, currentId);
          }
          
          loadedCount++;
        }
      } catch (error) {
        console.warn(`Failed to load quest: ${QuestClass.id}`);
      }
    }

    console.log(`Loaded ${loadedCount} quests`);
  }
}

