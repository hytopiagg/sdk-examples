import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';
import type GamePlayer from '../../GamePlayer';
import type GamePlayerEntity from '../../GamePlayerEntity';

import { BaseCraftingEntityPlayerEvent } from '../../entities/BaseCraftingEntity';
import { BaseItemPlayerEvent } from '../../items/BaseItem';
import type { BaseCraftingEntityPlayerEventPayloads } from '../../entities/BaseCraftingEntity';
import type { BaseItemPlayerEventPayloads } from '../../items/BaseItem';

import BlacksmithArdenEntity from '../../regions/stalkhaven/npcs/BlacksmithArdenEntity';
import ExploringStalkhavenQuest from '../main/ExploringStalkhavenQuest';
import RawHideItem from '../../items/materials/RawHideItem';

export default class HammersAndCraftingQuest extends BaseQuest {
  static readonly id = 'hammers-and-crafting';
  static readonly name = 'Hammers and Crafting';
  static readonly description = `Blacksmith Arden wants to introduce you to crafting. Bring him some materials and craft your first item.`;

  static readonly reward = {
    items: [
      { itemClass: RawHideItem, quantity: 10 },
    ],
    skillExperience: [
      { skillId: SkillId.CRAFTING, amount: 300 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'gather-materials',
      name: 'Gather Materials',
      description: 'Gather 15 Raw Hides by slaying Ratkin or foraging in Chitter Forest.',
      target: 15,
    },
    {
      id: 'craft-item',
      name: 'Craft an Item',
      description: 'Craft your first item after gathering materials. Blacksmith Arden in Stalkhaven can help you craft!',
      target: 1,
    },
    {
      id: 'talk-to-arden',
      name: 'Speak with Blacksmith Arden',
      description: 'Speak with Blacksmith Arden after gathering materials and crafting an item.',
      target: 1,
    }
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    // Start Quest
    {
      npcClass: BlacksmithArdenEntity,
      dialogueOption: {
        text: `Who are you?`,
        nextDialogue: {
          text: `Ahh, me? The name's Arden. I'm just a humble blacksmith making weapons and armor for the 7th regiment here in Stalkhaven. I can help you make some if you'd like?`,
          options: [
            {
              text: `Please teach me how to craft!`,
              nextDialogue: {
                text: `Absolutely, first you'll need to gather some materials. Raw Hide is the easiest to work with. Go slay those Ratkin beasts or forage in Chitter Forest to find some. 15 Raw Hides should do. I'll wait here.`,
                options: [
                  {
                    text: `That sounds great, I'll go get some Raw Hide.`,
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
              text: `Maybe later, thanks.`,
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
      npcClass: BlacksmithArdenEntity,
      dialogueOption: {
        text: `I've crafted my first item, that was fun!`,
        nextDialogue: {
          text: `Great work! You can come back to me anytime and I can help you craft more items. Improve your crafting skills and we'll be able to craft even better weapons and armor.`,
          options: [
            {
              text: `Thanks for the help!`,
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
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'gather-materials') &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'craft-item');
      }
    }
  ];

  public static setupForPlayer(gamePlayer: GamePlayer): () => void {
    // Add event listeners
    const itemPickupListener = (payload: BaseItemPlayerEventPayloads[BaseItemPlayerEvent.PICKED_UP]) => {
      if (payload.item.id === RawHideItem.id) {
        gamePlayer.questLog.adjustObjectiveProgress(this.id, 'gather-materials', payload.item.quantity);
      }
    };

    const craftListener = (payload: BaseCraftingEntityPlayerEventPayloads[BaseCraftingEntityPlayerEvent.CRAFT_ITEM]) => {
      gamePlayer.questLog.adjustObjectiveProgress(this.id, 'craft-item', 1);
    };

    gamePlayer.eventRouter.on(BaseItemPlayerEvent.PICKED_UP, itemPickupListener);
    gamePlayer.eventRouter.on(BaseCraftingEntityPlayerEvent.CRAFT_ITEM, craftListener);

    const cleanup = () => {
      gamePlayer.eventRouter.off(BaseItemPlayerEvent.PICKED_UP, itemPickupListener);
      gamePlayer.eventRouter.off(BaseCraftingEntityPlayerEvent.CRAFT_ITEM, craftListener);
    };

    return cleanup;
  }    
}
