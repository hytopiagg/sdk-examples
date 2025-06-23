import BaseQuest, { QuestObjective, QuestReward, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';
import type GamePlayerEntity from '../../GamePlayerEntity';

import BoatRepairmanSidEntity from '../../regions/stalkhaven-port/npcs/BoatRepairmanSidEntity';
import CommanderMarkEntity from '../../regions/stalkhaven/npcs/CommanderMarkEntity';
import ExploringStalkhavenQuest from './ExploringStalkhavenQuest';

export default class WelcomeToStalkhavenQuest extends BaseQuest {
  static readonly id = 'welcome-to-stalkhaven';
  static readonly name = 'Welcome to Stalkhaven';
  static readonly description = 'You have arrived in Stalkhaven. After talking to Sid at the port, he instructs you to find Commander Mark in town to learn more about the Frontier and fog.';

  static readonly reward = {
    skillExperience: [
      { skillId: SkillId.EXPLORATION, amount: 50 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'talk-to-mark',
      name: 'Talk to Commander Mark',
      description: 'Find Commander Mark in Stalkhaven and speak with him.',
      target: 1,
    },
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    // Quest Start - Talk To Sid
    {
      npcClass: BoatRepairmanSidEntity,
      dialogueOption: {
        text: `I need to understand what's happening here. Who can tell me about the fog?`,
        nextDialogue: {
          text: `Commander Mark runs Stalkhaven - he's fighting to keep this place standing while The Frontier falls. Find him at the garrison, he'll tell you the truth about what we're facing.`,
          options: [
            {
              text: `I'll find Commander Mark.`,
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
        text: `Sid sent me. I need to know what I'm up against in The Frontier.`,
        nextDialogue: {
          text: `Smart of Sid to send you here. The fog isn't weather - it's alive, corrupting everything it touches. Stalkhaven may be the last free settlement standing. You'll need to understand the threats before venturing out.`,
          options: [
            {
              text: `What should I do to prepare?`,
              nextDialogue: {
                text: `Get familiar with Stalkhaven first. Talk to our merchants, guards, and refugees. They'll teach you what you need to survive. Knowledge saves lives in The Frontier.`,
                options: [
                  {
                    text: `I'll speak with everyone. Thank you, Commander.`,
                    dismiss: true,
                    pureExit: true,
                  }
                ],
              },
              onSelect: (interactor: GamePlayerEntity) => {
                interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'talk-to-mark', 1);
                interactor.gamePlayer.questLog.completeQuest(this.id);
                interactor.gamePlayer.questLog.startQuest(ExploringStalkhavenQuest);
              }
            }
          ],
        },
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id);
      }
    }
  ];
}
