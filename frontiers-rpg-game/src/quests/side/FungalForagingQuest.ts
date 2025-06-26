import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';
import type GamePlayer from '../../GamePlayer';
import type GamePlayerEntity from '../../GamePlayerEntity';

import { BaseForageableEntityPlayerEvent } from '../../entities/BaseForageableEntity';
import { BaseItemPlayerEvent } from '../../items/BaseItem';
import type { BaseForageableEntityPlayerEventPayloads } from '../../entities/BaseForageableEntity';
import type { BaseItemPlayerEventPayloads } from '../../items/BaseItem';

import MerchantFinnEntity from '../../regions/stalkhaven/npcs/MerchantFinnEntity';
import ExploringStalkhavenQuest from '../main/ExploringStalkhavenQuest';

import AdventurerGlovesItem from '../../items/wearables/AdventurerGlovesItem';
import CommonMushroomItem from '../../items/consumables/CommonMushroomItem';
import GoldItem from '../../items/general/GoldItem';

export default class FungalForagingQuest extends BaseQuest {
  static readonly id = 'fungal-foraging';
  static readonly name = 'Fungal Foraging';
  static readonly description = `Merchant Finn is running low on mushrooms, and you're running low on coins. Can you help him out?`;

  static readonly reward = {
    items: [
      { itemClass: AdventurerGlovesItem, quantity: 1 },
      { itemClass: GoldItem, quantity: 125 },
    ],
    skillExperience: [
      { skillId: SkillId.FORAGING, amount: 300 },
      { skillId: SkillId.BARTERING, amount: 300 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'forage-logs',
      name: 'Forage At Least 5 Rotten Logs',
      description: 'Forage at least 5 Rotten Logs in the Chitter Forest.',
      target: 5,
    },
    {
      id: 'pick-mushrooms',
      name: 'Collect 25 Common Mushrooms',
      description: 'Collect 25 Common Mushrooms from Rotten Logs in Chitter Forest.',
      target: 25,
    },
    {
      id: 'give-mushrooms',
      name: 'Give 25 Common Mushrooms To Merchant Finn',
      description: 'Give 25 Common Mushrooms to Merchant Finn in Stalkhaven.',
      target: 1,
    }
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    // Start Quest
    {
      npcClass: MerchantFinnEntity,
      dialogueOption: {
        text: `Looking for work - got anything that pays?`,
        nextDialogue: {
          text: `Business has been good, maybe too good. The Capfolk can't get enough mushrooms and my supply's running dry. If you can bring me 25 Common Mushrooms from the Rotten Logs in Chitter Forest, I'll make it worth your while.`,
          options: [
            {
              text: `Sounds like a fair trade. I'll get those mushrooms.`,
              nextDialogue: {
                text: `Smart thinking! Just watch yourself out there - those Ratkin don't take kindly to visitors in their forest.`,
                options: [
                  {
                    text: `I can handle myself.`,
                    dismiss: true,
                    pureExit: true,
                  }
                ]
              },
              onSelect: (interactor: GamePlayerEntity) => {
                interactor.gamePlayer.questLog.startQuest(this);
              }
            },
            {
              text: `Not interested in forest work right now.`,
              dismiss: true,
              pureExit: true,
            }
          ],
        },
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestCompleted(ExploringStalkhavenQuest.id) &&
               !interactor.gamePlayer.questLog.hasQuest(this.id);
      }
    },

    // Complete Quest
    {
      npcClass: MerchantFinnEntity,
      dialogueOption: {
        text: `Got your mushrooms right here.`,
        nextDialogue: {
          text: `Perfect quality! My Capfolk customers will be pleased, and so will my coin purse. Here's your payment as promised.`,
          options: [
            {
              text: `Pleasure doing business.`,
              dismiss: true,
              pureExit: true,
            }
          ],
        },
        onSelect: (interactor: GamePlayerEntity) => {
          if (!interactor.gamePlayer.removeHeldItem(CommonMushroomItem, 25)) {
            return interactor.showNotification(`Merchant Finn is looking for 25 Common Mushrooms - seems you're a bit short!`, 'error');
          }

          interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'give-mushrooms', 1);
          interactor.gamePlayer.questLog.completeQuest(this.id);
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'forage-logs') &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'pick-mushrooms');
      }
    }
  ];

  public static setupForPlayer(gamePlayer: GamePlayer): () => void {
    // Add event listeners
    const forageListener = (payload: BaseForageableEntityPlayerEventPayloads[BaseForageableEntityPlayerEvent.FORAGED]) => {
      if (payload.entity.name === 'Rotten Log') {
        gamePlayer.questLog.adjustObjectiveProgress(this.id, 'forage-logs', 1);
      }
    };

    const itemPickupListener = (payload: BaseItemPlayerEventPayloads[BaseItemPlayerEvent.PICKED_UP]) => {
      if (payload.item.id === CommonMushroomItem.id) {
        gamePlayer.questLog.adjustObjectiveProgress(this.id, 'pick-mushrooms', payload.item.quantity);
      }
    };

    gamePlayer.eventRouter.on(BaseForageableEntityPlayerEvent.FORAGED, forageListener);
    gamePlayer.eventRouter.on(BaseItemPlayerEvent.PICKED_UP, itemPickupListener);

    const cleanup = () => {
      gamePlayer.eventRouter.off(BaseForageableEntityPlayerEvent.FORAGED, forageListener);
      gamePlayer.eventRouter.off(BaseItemPlayerEvent.PICKED_UP, itemPickupListener);
    };

    return cleanup;
  }    
}
