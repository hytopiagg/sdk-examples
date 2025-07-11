import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';
import type GamePlayerEntity from '../../GamePlayerEntity';

import HealerMycelisEntity from '../../regions/stalkhaven/npcs/HealerMycelisEntity';
import ArchivesBookshelf2Entity from '../../regions/hearthwilds/npcs/ArchivesBookshelf2Entity';

export default class AncientWisdomQuest extends BaseQuest {
  static readonly id = 'ancient-wisdom';
  static readonly name = 'Ancient Wisdom';
  static readonly description = `Healer Mycelis has asked you to find the old Capfolk archives in the Hearthwilds and see what you can learn about the Blighted Roots.`;

  static readonly reward = {
    skillExperience: [
      { skillId: SkillId.EXPLORATION, amount: 550 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'find-archives',
      name: 'Find the old Capfolk Archives and learn about the Blighted Roots',
      description: 'Find the old Capfolk archives in the Hearthwilds and see what you can learn about the Blighted Roots.',
      target: 1,
    },
    {
      id: 'return-to-healer-mycelis',
      name: 'Return to Healer Mycelis',
      description: 'Return to Healer Mycelis in Stalkhaven and share the what you learned.',
      target: 1,
    }
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    {
      npcClass: ArchivesBookshelf2Entity,
      dialogueOption: {
        text: 'Read the book peaking out from under dust and rot...',
        nextDialogue: {
          text: `*You carefully pull out a thick tome titled "The Great Shadow & The Withering Age". Opening to a marked page, you read:*

"The great shadow that fell upon our land was not merely darkness, but a living hunger that spread through twisted roots beneath the earth. This ancient evil spawned grotesque growths across the countryside - writhing vines and corrupted plants that bore roots of a sickly, unnatural hue."`,
          options: [
            {
              text: `Continue reading...`,
              nextDialogue: {
                text: `"All these twisted growths were interconnected through a vast underground network of tainted roots, sharing the stolen life force of everything they consumed. The very air grew thick and poisonous where these abominations took hold, choking the land with their malevolent presence."`,
                options: [
                  {
                    text: `Turn to the next page...`,
                    nextDialogue: {
                      text: `*You turn the page and gasp - there's a detailed illustration of gnarled, twisted roots. The drawing looks exactly like the blighted roots you collected from the Blight Blooms in the Ratkin nest. Below the image, ancient text reads:*

"When our people marched to the mountain's heart, we found not death but slumber. The great hunger was driven deep, beyond the peaks where shadow dwells eternal. Yet the wise among us whispered warnings - that which feeds on life's essence cannot be truly slain, only... displaced. Should the tainted roots emerge anew in distant lands, know that the mountain's vigil may be weakening."`,
                      options: [
                        {
                          text: `Close the book and remember to return to Healer Mycelis`,
                          dismiss: true,
                          pureExit: true,
                        }
                      ]
                    },
                    onSelect: (interactor: GamePlayerEntity) => {
                      interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'find-archives', 1);
                    }
                  }
                ]
              }
            },
            {
              text: `Close the book`,
              dismiss: true,
              pureExit: true,
            }
          ]
        },
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) &&
               !interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'find-archives');
      }
    },
    {
      npcClass: HealerMycelisEntity,
      dialogueOption: {
        text: 'I found the archives and learned about the Blighted Roots.',
        nextDialogue: {
          text: `Devs: Well, you've reached the end of the main questline content! We'll have another update next week! In the meantime, there's lot of new sidequests in the Hearthwilds, go explore!`,
          options: [
            {
              text: `Ok, I'll come back next week.`,
              dismiss: true,
              pureExit: true,
            }
          ]
          // text: `By the ancient spores! What did you discover? Tell me everything you learned from those old texts.`,
          // options: [
          //   {
          //     text: 'The roots match ancient drawings, but the text speaks in riddles about mountains and a slumbering hunger .',
          //     nextDialogue: {
          //       text: `Mountains... slumber... By the sacred groves, this sounds like the old tales of the Withering Age. If these roots are connected to that ancient threat, and if it was merely driven away rather than destroyed... This knowledge is both invaluable and deeply troubling.`,
          //       options: [
          //         {
          //           text: `What should we do with this information?`,
          //           dismiss: true,
          //           pureExit: true,
          //         }
          //       ]
          //     },
          //     onSelect: (interactor: GamePlayerEntity) => {
          //       interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'return-to-healer-mycelis', 1);
          //       interactor.gamePlayer.questLog.completeQuest(this.id);
          //       // next quest
          //     }
          //   }
          // ]
        },
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'find-archives')
      }
    },
  ];
}