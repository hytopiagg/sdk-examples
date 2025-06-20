import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { BaseForageableEntityPlayerEvent } from '../../entities/BaseForageableEntity';
import { BaseItemPlayerEvent } from '../../items/BaseItem';
import GoldItem from '../../items/general/GoldItem';
import { SkillId } from '../../config';
import MerchantFinnEntity from '../../regions/stalkhaven/npcs/MerchantFinnEntity';
import ExploringStalkhavenQuest from '../main/ExploringStalkhavenQuest';
import type { BaseForageableEntityPlayerEventPayloads } from '../../entities/BaseForageableEntity';
import type { BaseItemPlayerEventPayloads } from '../../items/BaseItem';
import type GamePlayer from '../../GamePlayer';
import type GamePlayerEntity from '../../GamePlayerEntity';
import CommonMushroomItem from '../../items/consumables/CommonMushroomItem';

export default class TestedMettleQuest extends BaseQuest {
  static readonly id = 'tested-mettle';
  static readonly name = 'Tested Mettle';
  static readonly description = `Commander Mark wants to test your combat abilities before assigning you to military operations. Prove your mettle by eliminating corrupted Ratkin in Chitter Forest and demonstrating your dodging skills in combat.`;

  static readonly reward = {
    itemRewards: [
      { itemClass: GoldItem, quantity: 150 },
    ],
    skillExperience: [
      { skillId: SkillId.COMBAT, amount: 250 },
      { skillId: SkillId.EXPLORATION, amount: 250 },
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
      name: 'Pick 25 Common Mushrooms',
      description: 'Forage Rotten Logs in Chitter Forest and collect 25 Common Mushrooms.',
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
        text: `I'm new to town, anything I could help with to earn a few coins?`,
        nextDialogue: {
          text: `Actually, yes! I'm running low on mushrooms ever since the Capfolk have come to Stalkhaven. Could you head into Chitter Forest and forage Rotten Logs and collect 25 Common Mushrooms for me?`,
          options: [
            {
              text: `Happily! I'll head to Chitter Forest to forage for you.`,
              nextDialogue: {
                text: `Wonderful! I'll be waiting here for those mushrooms. Oh! And be careful, Chitter Forest is filled with violent Ratkin these days.`,
                options: [
                  {
                    text: `Thanks, I'll be careful.`,
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
              text: `Sorry, I can't do that right now.`,
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
        text: `Here's your mushrooms!`,
        nextDialogue: {
          text: `Wonderful! These will do great for my customers and keep the Capfolk happy. Here's your payment.`,
          options: [
            {
              text: `Thank you!`,
              dismiss: true,
              pureExit: true,
            }
          ],
        },
        onSelect: (interactor: GamePlayerEntity) => {
          const totalBackpackMushrooms = interactor.gamePlayer.backpack.getItemQuantityByClass(CommonMushroomItem);
          const totalHotbarMushrooms = interactor.gamePlayer.hotbar.getItemQuantityByClass(CommonMushroomItem);

          if (totalHotbarMushrooms + totalBackpackMushrooms < 25) {
            return interactor.showNotification(`You need at least 25 Common Mushrooms in your invetory to complete this quest!`, 'error');
          }

          // Remove 25 mushrooms from backpack and hotbar
          let remaining = 25;
          
          // Remove from backpack first
          for (const item of interactor.gamePlayer.backpack.getItemsByClass(CommonMushroomItem)) {
            if (remaining <= 0) break;
            const toRemove = Math.min(item.quantity, remaining);
            interactor.gamePlayer.backpack.adjustItemQuantityByReference(item, -toRemove);
            remaining -= toRemove;
          }
          
          // Remove from hotbar if needed
          for (const item of interactor.gamePlayer.hotbar.getItemsByClass(CommonMushroomItem)) {
            if (remaining <= 0) break;
            const toRemove = Math.min(item.quantity, remaining);
            interactor.gamePlayer.hotbar.adjustItemQuantityByReference(item, -toRemove);
            remaining -= toRemove;
          }

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
      if (payload.item.name === 'Common Mushroom') {
        gamePlayer.questLog.adjustObjectiveProgress(this.id, 'pick-mushrooms', 1);
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
