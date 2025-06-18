import BaseQuest, { QuestObjective, QuestReward, QuestNpcDialogueInteraction } from './BaseQuest';
import BoatRepairmanSidEntity from '../regions/stalkhaven-port/npcs/BoatRepairmanSidEntity';

export default class TestQuest2 extends BaseQuest {
  static readonly id = 'test2';
  static readonly name = 'Test Quest 2';
  static readonly description = 'This is a test quest 2';

  static readonly objectives: QuestObjective[] = [];
  static readonly reward: QuestReward = { items: [], skillExperience: [] };
  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    {
      npcClass: BoatRepairmanSidEntity,
      dialogueOption: {
        text: 'I can help you repair your boat 2.',
      },
      enabledForInteractor: () => true
    }
  ];
}
