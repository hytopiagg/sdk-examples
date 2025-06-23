import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';
import type GamePlayerEntity from '../../GamePlayerEntity';

import ScoutMorelEntity from '../../regions/ratkin-nest/npcs/ScoutMorelEntity';
import BlightedHarvestQuest from './BlightedHarvestQuest';

export default class IntoTheNestQuest extends BaseQuest {
  static readonly id = 'into-the-nest';
  static readonly name = `Into the Nest`;
  static readonly description = `Captain Chanterelion has sent you to meet his scout in a cave by the nearby lake that's the entrance to a Ratkin Nest.`;

  static readonly reward = {
    skillExperience: [
      { skillId: SkillId.EXPLORATION, amount: 50 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'talk-to-scout-morel',
      name: 'Find and speak with Scout Morel',
      description: 'Find Scout Morel in the Ratkin nest by the Chitter Forest lake and speak with him.',
      target: 1,
    },
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    // Quest Complete 
    {
      npcClass: ScoutMorelEntity,
      dialogueOption: {
        text: `Captain Chanterelion sent me to find you. What's going on here?`,
        nextDialogue: {
          text: `Thank the spores you're here! The Captain said he'd send someone. I've been scouting this corrupted nest and found something deeply disturbing - twisted, pulsating growths I've never seen before. They're like corrupted flowers, spewing concentrated sickly green vapor that is similar to the fog. I'm calling them Blight Blooms - they seem to be spreading the corruption that's turning the Ratkin into those aggressive Tainted ones.`,
          options: [
            {
              text: `What do you need me to do?`,
              nextDialogue: {
                text: `These Blight Blooms... they're not natural. Us Capfolk have generations of knowledge about fungi and plant corruption - if we can get remains of these things back to Healer Mycelis in Stalkhaven, he might be able to determine where this blight is coming from. I need you to destroy those foul Blight Blooms, collect whatever remains you can salvage, and bring them to Healer Mycelis in Stalkhaven.`,
                options: [
                  {
                    text: `I'll destroy the Blight Blooms and bring the remains to Healer Mycelis.`,
                    dismiss: true,
                    pureExit: true,
                  }
                ]
              },
              onSelect: (interactor: GamePlayerEntity) => {
                interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'talk-to-scout-morel', 1);
                interactor.gamePlayer.questLog.completeQuest(this.id);
                interactor.gamePlayer.questLog.startQuest(BlightedHarvestQuest);
              }
            }
          ]
        },
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id);
      }
    }
  ];
}
