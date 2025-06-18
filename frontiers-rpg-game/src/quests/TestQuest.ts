import BaseQuest, { QuestObjective, QuestReward, QuestNpcDialogueInteraction } from './BaseQuest';
import BoatRepairmanSidEntity from '../regions/stalkhaven-port/npcs/BoatRepairmanSidEntity';
import type GamePlayerEntity from '../GamePlayerEntity';

export default class TestQuest extends BaseQuest {
  static readonly id = 'test';
  static readonly name = 'Test Quest';
  static readonly description = 'This is a test quest';

  static readonly objectives: QuestObjective[] = [];
  static readonly reward: QuestReward = { items: [], skillExperience: [] };
  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    {
      npcClass: BoatRepairmanSidEntity,
      dialogueOption: {
        text: 'I can help you repair your boat.',
        nextDialogue: {
          text: 'Great thanks!',
          options: [
            {
              text: 'Cool, I will get to it',
              dismiss: true,
              pureExit: true,
            }
          ]
        },
        onSelect: (interactor: GamePlayerEntity) => {
          interactor.gamePlayer.questLog.startQuest(this);
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return !interactor.gamePlayer.questLog.hasQuest(this.id);
      }
    }
  ];
}
