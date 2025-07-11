import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';
import type GamePlayer from '../../GamePlayer';
import type GamePlayerEntity from '../../GamePlayerEntity';

import { BaseEntityPlayerEvent } from '../../entities/BaseEntity';
import { BaseItemPlayerEvent } from '../../items/BaseItem';
import type { BaseEntityPlayerEventPayloads } from '../../entities/BaseEntity';
import type { BaseItemPlayerEventPayloads } from '../../items/BaseItem';

import GravekeeperArdenEntity from '../../regions/hearthwilds/npcs/GravekeeperArdenEntity';
import GorkinChieftanEntity from '../../entities/enemies/GorkinChieftanEntity';
import GorkinEnforcerEntity from '../../entities/enemies/GorkinEnforcerEntity';
import GorkinGruntEntity from '../../entities/enemies/GorkinGruntEntity';
import GorkinHunterEntity from '../../entities/enemies/GorkinHunterEntity';
import GorkinShamanEntity from '../../entities/enemies/GorkinShamanEntity';
import GorkinSwordsmanEntity from '../../entities/enemies/GorkinSwordsmanEntity';

import GoldItem from '../../items/general/GoldItem';
import IronIngotItem from '../../items/materials/IronIngotItem';
import GorkinSkullItem from '../../items/materials/GorkinSkullItem';

export default class SkullTrinketsQuest extends BaseQuest {
  static readonly id = 'skull-trinkets';
  static readonly name = 'Skull Trinkets';
  static readonly description = `Gravekeeper Arden is tired of dealing with the Gorkin, he wants you to thin them out and collect their skulls as trinkets.`;

  static readonly reward = {
    items: [
      { itemClass: GoldItem, quantity: 500 },
      { itemClass: IronIngotItem, quantity: 10 },
    ],
    skillExperience: [
      { skillId: SkillId.COMBAT, amount: 1000 },
      { skillId: SkillId.AGILITY, amount: 500 },
      { skillId: SkillId.EXPLORATION, amount: 750 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'kill-chieftan',
      name: 'Kill 1 Gorkin Chieftan',
      description: `Kill 1 Gorkin Chieftan, they're rare but sometimes spotted in Gorkin groups.`,
      target: 1,
    },
    {
      id: 'kill-enforcers',
      name: 'Kill 10 Gorkin Enforcers',
      description: `Kill 10 Gorkin Enforcers.`,
      target: 10,
    },
    {
      id: 'kill-grunts',
      name: 'Kill 25 Gorkin Grunts',
      description: `Kill 25 Gorkin Grunts.`,
      target: 25,
    },
    {
      id: 'kill-hunters',
      name: 'Kill 10 Gorkin Hunters',
      description: `Kill 10 Gorkin Hunters.`,
      target: 10,
    },
    {
      id: 'kill-shamans',
      name: 'Kill 10 Gorkin Shamans',
      description: `Kill 10 Gorkin Shamans.`,
      target: 10,
    },
    {
      id: 'kill-swordsmen',
      name: 'Kill 10 Gorkin Swordsmen',
      description: `Kill 10 Gorkin Swordsmen.`,
      target: 10,
    },
    {
      id: 'collect-skulls',
      name: 'Collect 25 Gorkin Skulls',
      description: `Collect 25 Gorkin Skulls.`,
      target: 25,
    },
    {
      id: 'talk-to-arden',
      name: 'Speak with Gravekeeper Arden',
      description: 'Speak with Gravekeeper Arden after completing all other objectives.',
      target: 1,
    }
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    // Start Quest
    {
      npcClass: GravekeeperArdenEntity,
      dialogueOption: {
        text: `You seem bothered by something.`,
        nextDialogue: {
          text: `Bothered? Hah... the Gorkin have been getting on my nerves lately. More than usual, I mean. They keep trampling through my graveyard, disturbing the peace of the dead. I use their skulls as decorations around here - gives the place character, don't you think? But I'm running low on fresh specimens. The dead appreciate the company of... well, other dead things. Need those beasts thinned out more, and I wouldn't mind collecting a few more skulls for my collection.`,
          options: [
            {
              text: `I can help you with that Gorkin problem.`,
              nextDialogue: {
                text: `Excellent! Bring me their skulls. The fresher the better, though I suppose they'll all be equally dead in the end. The dead here have been whispering about wanting new neighbors. Some more Gorkin skulls will quiet their restless spirits... or at least give me something interesting to look at during the long, foggy nights.`,
                options: [
                  {
                    text: `I'll thin the Gorkin out and bring you those skulls.`,
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
              text: `That's... quite a hobby you have there.. bye.`,
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
      npcClass: GravekeeperArdenEntity,
      dialogueOption: {
        text: `I've thinned out the Gorkin and brought you the skulls you wanted.`,
        nextDialogue: {
          text: `Perfect... absolutely perfect. Look at these specimens! The dead will be so pleased to have new company. I'll place these around the graveyard - they'll fit right in with the ancient warriors resting here. The Gorkin won't be trampling through my graveyard anymore, and my collection is complete. The whispers from the graves seem... quieter now. Thank you, wanderer. The dead appreciate your service.`,
          options: [
            {
              text: `Glad I could help with your... decorating.`,
              dismiss: true,
              pureExit: true,
            }
          ],
        },
        onSelect: (interactor: GamePlayerEntity) => {
          if (!interactor.gamePlayer.removeHeldItem(GorkinSkullItem, 25)) {
            return interactor.showNotification(`Gravekeeper Arden is looking for 25 Gorkin Skulls - seems you're a bit short!`, 'error');
          }

          interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'talk-to-arden', 1);
          interactor.gamePlayer.questLog.completeQuest(this.id);
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-chieftan') &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-enforcers') &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-grunts') &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-hunters') &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-shamans') &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-swordsmen') &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'collect-skulls');
      }
    }
  ];

  public static setupForPlayer(gamePlayer: GamePlayer): () => void {
    // Add event listeners
    const killListener = (payload: BaseEntityPlayerEventPayloads[BaseEntityPlayerEvent.KILLED]) => {
      if (payload.entity.name.includes('Gorkin')) {
        if (payload.entity instanceof GorkinChieftanEntity) {
          gamePlayer.questLog.adjustObjectiveProgress(this.id, 'kill-chieftan', 1);
        } else if (payload.entity instanceof GorkinEnforcerEntity) {
          gamePlayer.questLog.adjustObjectiveProgress(this.id, 'kill-enforcers', 1);
        } else if (payload.entity instanceof GorkinGruntEntity) {
          gamePlayer.questLog.adjustObjectiveProgress(this.id, 'kill-grunts', 1);
        } else if (payload.entity instanceof GorkinHunterEntity) {
          gamePlayer.questLog.adjustObjectiveProgress(this.id, 'kill-hunters', 1);
        } else if (payload.entity instanceof GorkinShamanEntity) {
          gamePlayer.questLog.adjustObjectiveProgress(this.id, 'kill-shamans', 1);
        } else if (payload.entity instanceof GorkinSwordsmanEntity) {
          gamePlayer.questLog.adjustObjectiveProgress(this.id, 'kill-swordsmen', 1);
        }
      }
    }

    const itemPickupListener = (payload: BaseItemPlayerEventPayloads[BaseItemPlayerEvent.PICKED_UP]) => {
      if (payload.item.id === GorkinSkullItem.id) {
        gamePlayer.questLog.adjustObjectiveProgress(this.id, 'collect-skulls', payload.item.quantity);
      }
    };

    gamePlayer.eventRouter.on(BaseEntityPlayerEvent.KILLED, killListener);
    gamePlayer.eventRouter.on(BaseItemPlayerEvent.PICKED_UP, itemPickupListener);

    const cleanup = () => {
      gamePlayer.eventRouter.off(BaseEntityPlayerEvent.KILLED, killListener);
      gamePlayer.eventRouter.off(BaseItemPlayerEvent.PICKED_UP, itemPickupListener);
    }

    return cleanup
  }    
}
