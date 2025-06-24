import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';
import type GamePlayer from '../../GamePlayer';
import type GamePlayerEntity from '../../GamePlayerEntity';

import { GamePlayerEntityPlayerEvent } from '../../GamePlayerEntity';
import type { GamePlayerEntityPlayerEventPayloads } from '../../GamePlayerEntity';

import CaptainSpornEntity from '../../regions/stalkhaven/npcs/CaptainSpornEntity';
import ExploringStalkhavenQuest from '../main/ExploringStalkhavenQuest';

import AdventurerLeggingsItem from '../../items/wearables/AdventurerLeggingsItem';

export default class DipDuckDodgeQuest extends BaseQuest {
  static readonly id = 'dip-duck-dodge';
  static readonly name = 'Dip, Duck, Dodge!';
  static readonly description = `Captain Sporn wants to sharpen up your survival skills. Improving your dodge timing is critical to surviving in the Frontier.`;

  static readonly reward = {
    items: [
      { itemClass: AdventurerLeggingsItem, quantity: 1 },
    ],
    skillExperience: [
      { skillId: SkillId.AGILITY, amount: 750 },
      { skillId: SkillId.COMBAT, amount: 250 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'dodge',
      name: 'Perform 100 Successful Roll Dodges',
      description: 'Perform 100 successful roll dodges in combat.',
      target: 100,
    },
    {
      id: 'talk-to-sporn',
      name: 'Speak with Captain Sporn',
      description: 'Speak with Captain Sporn after completing 100 successful roll dodges.',
      target: 1,
    }
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    // Start Quest
    {
      npcClass: CaptainSpornEntity,
      dialogueOption: {
        text: `Teach me to survive against fog-touched creatures.`,
        nextDialogue: {
          text: `Smart request. Those Ratkin move fast and strike without warning. Your best defense? Master dodging. Evasion keeps you breathing.`,
          options: [
            {
              text: `I'm ready for whatever training you've got.`,
              nextDialogue: {
                text: `Let's start with 100 successful roll dodges. The fog-touched monsters won't give you second chances, so your timing needs to be perfect. Find some enemies and practice.`,
                options: [
                  {
                    text: `Understood, Captain.`,
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
              text: `Maybe I'll stick to safer areas for now.`,
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
      npcClass: CaptainSpornEntity,
      dialogueOption: {
        text: `That was tough, but I've completed your evasion training.`,
        nextDialogue: {
          text: `Excellent work. Your footwork's improved - might just keep you alive when you venture into the fog.`,
          options: [
            {
              text: `I'll be on my way.`,
              dismiss: true,
              pureExit: true,
            }
          ],
        },
        onSelect: (interactor: GamePlayerEntity) => {
          interactor.gamePlayer.questLog.completeQuest(this.id);
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'dodge');
      }
    }
  ];

  public static setupForPlayer(gamePlayer: GamePlayer): () => void {
    // Add event listeners
    const dodgeListener = (payload: GamePlayerEntityPlayerEventPayloads[GamePlayerEntityPlayerEvent.DODGED]) => {
      gamePlayer.questLog.adjustObjectiveProgress(this.id, 'dodge', 1);
    };

    gamePlayer.eventRouter.on(GamePlayerEntityPlayerEvent.DODGED, dodgeListener);

    const cleanup = () => {
      gamePlayer.eventRouter.off(GamePlayerEntityPlayerEvent.DODGED, dodgeListener);
    };

    return cleanup;
  }    
}
