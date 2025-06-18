import BaseQuest, { QuestObjective, QuestReward, QuestNpcDialogueInteraction } from './BaseQuest';
import BoatRepairmanSidEntity from '../regions/stalkhaven-port/npcs/BoatRepairmanSidEntity';

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
              text: 'Cool, done',
              dismiss: true,
              pureExit: true,
            }
          ]
        }
      },
      enabledForInteractor: () => true
    }
  ];
}
