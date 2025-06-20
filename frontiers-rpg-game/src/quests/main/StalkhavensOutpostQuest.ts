import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import CaptainChanterelionEntity from '../../regions/chitter-forest/npcs/CaptainChanterelionEntity';
import { SkillId } from '../../config';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class StalkhavensOutpostQuest extends BaseQuest {
  static readonly id = 'stalkhavens-outpost';
  static readonly name = `Stalkhaven's Outpost`;
  static readonly description = 'Commander Mark has instructed you to meet Captain Chanterelion at his outpost in Chitter Forest just outside of the Stalkhaven gate. He needs your help to clear the Ratkin camps in the area.';

  static readonly reward = {
    skillExperience: [
      { skillId: SkillId.EXPLORATION, amount: 50 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'talk-to-chanterelion',
      name: 'Speak with Captain Chanterelion',
      description: 'Find Captain Chanterelion at his outpost in Chitter Forest and speak with him.',
      target: 1,
    },
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    // Quest Complete 
    {
      npcClass: CaptainChanterelionEntity,
      dialogueOption: {
        text: `Commander Mark sent me to report for strikes on the Ratkin camps.`,
        nextDialogue: {
          text: `Excellent, friend. Mark spoke true - we need someone with proven combat skills. The Ratkin have established four major encampments that threaten Stalkhaven. We need to clear these camps out before they can launch a full on assault on Stalkhaven.`,
          options: [
            {
              text: `I'm ready. Where are these camps?`,
              nextDialogue: {
                text: `Scattered throughout the forest - two in the main woodland, one by the lake, and another off an old beaten path. Clear them all and report back. Time is short - every day they grow stronger.`,
                options: [
                  {
                    text: `Consider it done, Captain.`,
                    dismiss: true,
                    pureExit: true,
                  }
                ],
              },
              onSelect: (interactor: GamePlayerEntity) => {
                interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'talk-to-chanterelion', 1);
                interactor.gamePlayer.questLog.completeQuest(this.id);
                // start encampmment clearing quest.
              }
            }
          ],
        },
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id);
      }
    }
  ];
}
