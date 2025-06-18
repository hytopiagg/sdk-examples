import BaseQuest, { QuestObjective, QuestReward, QuestNpcDialogueInteraction } from '../BaseQuest';
import BoatRepairmanSidEntity from '../../regions/stalkhaven-port/npcs/BoatRepairmanSidEntity';
import CommanderMarkEntity from '../../regions/stalkhaven/npcs/CommanderMarkEntity';
import GoldItem from '../../items/general/GoldItem';
import { SkillId } from '../../config';
import type GamePlayerEntity from '../../GamePlayerEntity';

export default class WelcomeToStalkhavenQuest extends BaseQuest {
  static readonly id = 'welcome-to-stalkhaven';
  static readonly name = 'Welcome to Stalkhaven';
  static readonly description = 'You have arrived in Stalkhaven. After talking to Sid at the port, he instructs you to find Commander Mark in town to learn more about the Frontier and fog.';

  static readonly reward = {
    items: [
      { itemClass: GoldItem, quantity: 50 },
    ],
    skillExperience: [
      { skillId: SkillId.EXPLORATION, amount: 250 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'talk-to-sid',
      name: 'Talk to Sid',
      description: 'Find Sid in Stalkhaven and speak with him.',
      target: 1,
    },
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    // Quest Start - Talk To Sid
    {
      npcClass: BoatRepairmanSidEntity,
      dialogueOption: {
        text: `Who's in charge here? Where can I learn more about the fog?`,
        nextDialogue: {
          text: 'That would be Commander Mark. He overseas Stalkhaven and has been helping keep beasts from getting into town. Head into town and talk with him.',
          options: [
            {
              text: `Thanks, I'll head into town and find Command Mark.`,
              dismiss: true,
              pureExit: true,
            }
          ]
        },
        onSelect: (interactor: GamePlayerEntity) => {
          interactor.gamePlayer.questLog.startQuest(this);
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return !interactor.gamePlayer.questLog.hasQuest(this.id);
      }
    },

    // Quest Complete, Talk To Mark
    {
      npcClass: CommanderMarkEntity,
      dialogueOption: {
        text: `What's going on here?`,
        nextDialogue: {
          text: `The fog is a danger to the town. It's been getting thicker and thicker. We've been seeing more and more beasts coming through.`,
          options: [
            {
              text: 'Got it.',
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
        return interactor.gamePlayer.questLog.isQuestActive(this.id);
      }
    }
  ];
}
