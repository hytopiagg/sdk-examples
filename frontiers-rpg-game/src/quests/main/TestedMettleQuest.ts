import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { BaseEntityPlayerEvent } from '../../entities/BaseEntity';
import CommanderMarkEntity from '../../regions/stalkhaven/npcs/CommanderMarkEntity';
import { GamePlayerEntityPlayerEvent } from '../../GamePlayerEntity';
import GoldItem from '../../items/general/GoldItem';
import { SkillId } from '../../config';
import StalkhavensOutpostQuest from './StalkhavensOutpostQuest';
import type { BaseEntityPlayerEventPayloads } from '../../entities/BaseEntity';
import type GamePlayer from '../../GamePlayer';
import type GamePlayerEntity from '../../GamePlayerEntity';
import type { GamePlayerEntityPlayerEventPayloads } from '../../GamePlayerEntity';

export default class TestedMettleQuest extends BaseQuest {
  static readonly id = 'tested-mettle';
  static readonly name = 'Tested Mettle';
  static readonly description = `Commander Mark wants to test your combat abilities before assigning you to military operations. Prove your mettle by eliminating corrupted Ratkin in Chitter Forest and demonstrating your dodging skills in combat.`;

  static readonly reward = {
    items: [
      { itemClass: GoldItem, quantity: 150 },
    ],
    skillExperience: [
      { skillId: SkillId.COMBAT, amount: 250 },
      { skillId: SkillId.EXPLORATION, amount: 250 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'kill-5-ratkin',
      name: 'Kill 5 Ratkin',
      description: 'Kill 5 Ratkin in Chitter Forest.',
      target: 5,
    },
    {
      id: 'dodge-3-times',
      name: 'Perform 3 Successful Roll Dodges',
      description: 'Roll dodge successfully 3 times in combat.',
      target: 3,
    },
    {
      id: 'talk-to-mark',
      name: 'Return to Commander Mark',
      description: 'Talk to Commander Mark after completing all other objectives.',
      target: 1,
    }
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    {
      npcClass: CommanderMarkEntity,
      dialogueOption: {
        text: `I've cleared out some of the Ratkin in Chitter Forest.`,
        nextDialogue: {
          text: `Impressive work. You've proven you can handle the corrupted Ratkin and stay alive doing it. I want you to go meet Captain Chanterelion. He's established an outpost just outside the Stalkhaven gates in Chitter Forest with Capfolk knights from his refugee group. They're planning coordinated strikes against the larger Ratkin encampments closes to Stalkhaven. Report to the camp - they need someone with your proven abilities.`,
          options: [
            {
              text: `I'll report to Captain Chanterelion's camp immediately.`,
              dismiss: true,
              pureExit: true,
            }
          ],
        },
        onSelect: (interactor: GamePlayerEntity) => {
          interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'talk-to-mark', 1);
          interactor.gamePlayer.questLog.completeQuest(this.id);
          interactor.gamePlayer.questLog.startQuest(StalkhavensOutpostQuest);
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-5-ratkin') &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'dodge-3-times')
      }
    }
  ];

  public static setupForPlayer(gamePlayer: GamePlayer): () => void {
    // Add event listeners
    const dodgeListener = (payload: GamePlayerEntityPlayerEventPayloads[GamePlayerEntityPlayerEvent.DODGED]) => {
      gamePlayer.questLog.adjustObjectiveProgress(this.id, 'dodge-3-times', 1);
    };

    const killListener = (payload: BaseEntityPlayerEventPayloads[BaseEntityPlayerEvent.KILLED]) => {
      if (payload.entity.name.includes('Ratkin')) {
        gamePlayer.questLog.adjustObjectiveProgress(this.id, 'kill-5-ratkin', 1);
      }
    }

    gamePlayer.eventRouter.on(GamePlayerEntityPlayerEvent.DODGED, dodgeListener);
    gamePlayer.eventRouter.on(BaseEntityPlayerEvent.KILLED, killListener);

    const cleanup = () => {
      gamePlayer.eventRouter.off(GamePlayerEntityPlayerEvent.DODGED, dodgeListener);
      gamePlayer.eventRouter.off(BaseEntityPlayerEvent.KILLED, killListener);
    };

    return cleanup;
  }    
}
