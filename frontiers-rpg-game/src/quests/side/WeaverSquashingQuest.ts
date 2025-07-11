import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';
import type GamePlayer from '../../GamePlayer';
import type GamePlayerEntity from '../../GamePlayerEntity';

import { BaseEntityPlayerEvent } from '../../entities/BaseEntity';
import type { BaseEntityPlayerEventPayloads } from '../../entities/BaseEntity';

import HerderBorisEntity from '../../regions/hearthwilds/npcs/HerderBorisEntity';
import ReclusiveWeaverEntity from '../../entities/enemies/ReclusiveWeaverEntity';

import GoldItem from '../../items/general/GoldItem';
import IronIngotItem from '../../items/materials/IronIngotItem';

export default class WeaverSquashingQuest extends BaseQuest {
  static readonly id = 'weaver-squashing';
  static readonly name = 'Weaver Squashing';
  static readonly description = `Reclusive Weavers have been coming out of the Hearthwilds ravines and attacking Herder Boris's Woolran. Can you help him out?`;

  static readonly reward = {
    items: [
      { itemClass: GoldItem, quantity: 300 },
      { itemClass: IronIngotItem, quantity: 5 },
    ],
    skillExperience: [
      { skillId: SkillId.COMBAT, amount: 500 },
      { skillId: SkillId.AGILITY, amount: 200 },
      { skillId: SkillId.EXPLORATION, amount: 250 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'kill-weavers',
      name: 'Kill 40 Reclusive Weavers',
      description: `Kill 40 Reclusive Weavers.`,
      target: 40,
    },
    {
      id: 'talk-to-boris',
      name: 'Speak with Herder Boris',
      description: 'Speak with Herder Boris after completing all other objectives.',
      target: 1,
    }
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    // Start Quest
    {
      npcClass: HerderBorisEntity,
      dialogueOption: {
        text: `Is there anything I can do to help you out?`,
        nextDialogue: {
          text: `BAH! You want to help? Well, since you're asking... Those blasted Reclusive Weavers have been crawling out of the Hearthwilds ravines and attacking my Woolran! Can't take my flock out to graze on the good grass without those eight-legged monsters skittering out and terrorizing them.`,
          options: [
            {
              text: `I can deal with those weavers for you.`,
              nextDialogue: {
                text: `Now that's what I like to hear! Clear out those Reclusive Weavers - at least forty of the buggers by my count. They're holed up in the ravines and crevices all around here. My woolran need safe grazing grounds, and I need my livelihood protected! You handle this weaver problem, and I'll make it worth your while.`,
                options: [
                  {
                    text: `I'll clear out those weavers for you.`,
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
              text: `That sounds dangerous. Maybe find someone else.`,
              dismiss: true,
              pureExit: true,
            }
          ],
        },
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return !interactor.gamePlayer.questLog.hasQuest(this.id);
      }
    },

    // Complete Quest
    {
      npcClass: HerderBorisEntity,
      dialogueOption: {
        text: `I've cleared out those Reclusive Weavers for you.`,
        nextDialogue: {
          text: `BAH! Finally! About time someone dealt with those eight-legged menaces. My woolran can graze in peace now without worrying about getting poisoned by weaver fangs. You've done me a real service here - my livelihood depends on keeping those animals safe. Here's your payment.`,
          options: [
            {
              text: `Glad I could help protect your woolran.`,
              dismiss: true,
              pureExit: true,
            }
          ],
        },
        onSelect: (interactor: GamePlayerEntity) => {
          interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'talk-to-boris', 1);
          interactor.gamePlayer.questLog.completeQuest(this.id);
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-weavers');
      }
    }
  ];

  public static setupForPlayer(gamePlayer: GamePlayer): () => void {
    // Add event listeners
    const killListener = (payload: BaseEntityPlayerEventPayloads[BaseEntityPlayerEvent.KILLED]) => {
      if (payload.entity instanceof ReclusiveWeaverEntity) {
        gamePlayer.questLog.adjustObjectiveProgress(this.id, 'kill-weavers', 1);
      }
    }

    gamePlayer.eventRouter.on(BaseEntityPlayerEvent.KILLED, killListener);

    const cleanup = () => {
      gamePlayer.eventRouter.off(BaseEntityPlayerEvent.KILLED, killListener);
    }

    return cleanup
  }    
}
