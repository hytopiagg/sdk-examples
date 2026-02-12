import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';
import type GamePlayer from '../../GamePlayer';
import type GamePlayerEntity from '../../GamePlayerEntity';

import { BaseEntityPlayerEvent } from '../../entities/BaseEntity';
import type { BaseEntityPlayerEventPayloads } from '../../entities/BaseEntity';

import BlacksmithArdenEntity from '../../regions/stalkhaven/npcs/BlacksmithArdenEntity';
import WelcomeToStalkhavenQuest from '../main/WelcomeToStalkhavenQuest';

import GoldItem from '../../items/general/GoldItem';

import GorkinGruntEntity from '../../entities/enemies/GorkinGruntEntity';
import GorkinHunterEntity from '../../entities/enemies/GorkinHunterEntity';
import GorkinShamanEntity from '../../entities/enemies/GorkinShamanEntity';
import GorkinSwordsmanEntity from '../../entities/enemies/GorkinSwordsmanEntity';
import GorkinEnforcerEntity from '../../entities/enemies/GorkinEnforcerEntity';
import GorkinChieftanEntity from '../../entities/enemies/GorkinChieftanEntity';

export default class GorkinBountyQuest extends BaseQuest {
  static readonly id = 'gorkin-bounty';
  static readonly name = 'Gorkin Bounty';
  static readonly description = 'The Gorkin tribes have been raiding supply caravans heading to Stalkhaven. Blacksmith Arden has put a bounty on them - kill 10 Gorkin and collect your reward.';

  static readonly reward = {
    items: [
      { itemClass: GoldItem, quantity: 500 },
    ],
    skillExperience: [
      { skillId: SkillId.COMBAT, amount: 300 },
      { skillId: SkillId.EXPLORATION, amount: 150 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'kill-gorkin',
      name: 'Kill 10 Gorkin',
      description: 'Kill 10 Gorkin of any type. They can be found in various camps throughout the Frontier.',
      target: 10,
    },
    {
      id: 'talk-to-arden',
      name: 'Speak with Blacksmith Arden',
      description: 'Return to Blacksmith Arden in Stalkhaven to claim your bounty reward.',
      target: 1,
    }
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    {
      npcClass: BlacksmithArdenEntity,
      dialogueOption: {
        text: "Do you have any work for me?",
        nextDialogue: {
          text: "Ah, looking to earn some coin? The Gorkin tribes have been getting bolder - raiding our supply caravans and making life difficult for everyone in Stalkhaven. The garrison is too busy with the Ratkin threat to deal with them.",
          options: [
            {
              text: "I'll deal with the Gorkin for you.",
              nextDialogue: {
                text: "That's what I like to hear! Take down 10 of those brutes - grunts, hunters, shamans, whatever you find. They're camped out in various spots around the Frontier. Come back when you've thinning their numbers and I'll pay you 500 gold for your trouble.",
                options: [
                  {
                    text: "I'll take care of them.",
                    dismiss: true,
                    pureExit: true,
                  }
                ],
              },
              onSelect: (interactor: GamePlayerEntity) => {
                interactor.gamePlayer.questLog.startQuest(this);
              }
            },
            {
              text: "That sounds too dangerous for me right now.",
              dismiss: true,
              pureExit: true,
            }
          ],
        },
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestCompleted(WelcomeToStalkhavenQuest.id) &&
               !interactor.gamePlayer.questLog.hasQuest(this.id);
      }
    },

    {
      npcClass: BlacksmithArdenEntity,
      dialogueOption: {
        text: "I've taken down 10 Gorkin. Here's proof of my work.",
        nextDialogue: {
          text: "Excellent work! Those Gorkin have been a thorn in our side for too long. With 10 of them taken out, hopefully they'll think twice before attacking our caravans again. Here's your 500 gold - well earned! Come back anytime if you're looking for more work.",
          options: [
            {
              text: "Thanks for the bounty.",
              dismiss: true,
              pureExit: true,
            }
          ],
        },
        onSelect: (interactor: GamePlayerEntity) => {
          interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'talk-to-arden', 1);
          interactor.gamePlayer.questLog.completeQuest(this.id);
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-gorkin');
      }
    }
  ];

  public static setupForPlayer(gamePlayer: GamePlayer): () => void {
    const killListener = (payload: BaseEntityPlayerEventPayloads[BaseEntityPlayerEvent.KILLED]) => {
      const entity = payload.entity;

      if (
        entity instanceof GorkinGruntEntity ||
        entity instanceof GorkinHunterEntity ||
        entity instanceof GorkinShamanEntity ||
        entity instanceof GorkinSwordsmanEntity ||
        entity instanceof GorkinEnforcerEntity ||
        entity instanceof GorkinChieftanEntity
      ) {
        gamePlayer.questLog.adjustObjectiveProgress(this.id, 'kill-gorkin', 1);
      }
    };

    gamePlayer.eventRouter.on(BaseEntityPlayerEvent.KILLED, killListener);

    const cleanup = () => {
      gamePlayer.eventRouter.off(BaseEntityPlayerEvent.KILLED, killListener);
    };

    return cleanup;
  }
}
