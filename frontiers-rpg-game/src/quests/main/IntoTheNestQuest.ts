import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';
import type GamePlayerEntity from '../../GamePlayerEntity';

import ScoutMorelEntity from '../../regions/ratkin-nest/npcs/ScoutMorelEntity';

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
          text: `Thank the spores you're here! The Captain said he'd send someone. I've been scouting this corrupted nest and found something disturbing - deep inside, I saw creatures I've never seen before spewing thick vapor. I believe they might be the source of the Ratkin aggression and what's creating those Tainted Ratkin.`,
          options: [
            {
              text: `What do you need me to do?`,
              nextDialogue: {
                text: `I need you to explore deep within the nest and investigate those creatures. When I got close to get a better look, I suddenly got dizzy from the vapor - had to retreat. Maybe you can find a way to deal with whatever's down there and stop this corruption at its source.`,
                options: [
                  {
                    text: `I'll investigate the nest.`,
                    dismiss: true,
                    pureExit: true,
                  }
                ]
              },
              onSelect: (interactor: GamePlayerEntity) => {
                interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'talk-to-scout-morel', 1);
                interactor.gamePlayer.questLog.completeQuest(this.id);
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
