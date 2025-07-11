import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';
import type GamePlayer from '../../GamePlayer';
import type GamePlayerEntity from '../../GamePlayerEntity';

import { BaseItemPlayerEvent } from '../../items/BaseItem';
import type { BaseItemPlayerEventPayloads } from '../../items/BaseItem';

import BlightedRootItem from '../../items/materials/BlightedRootItem';
import HealerMycelisEntity from '../../regions/stalkhaven/npcs/HealerMycelisEntity';
import AncientWisdomQuest from './AncientWisdomQuest';

export default class BlightedHarvestQuest extends BaseQuest {
  static readonly id = 'blighted-harvest';
  static readonly name = 'Blighted Harvest';
  static readonly description = `Scout Morel has discovered corrupted flowers spewing concentrated green vapor deep in the Ratkin Nest. He calls them Blight Blooms. These Blight Blooms are tainting the Ratkin. He needs you to destroy them and take their salvaged remains to Healer Mycelis.`;

  static readonly reward = {
    skillExperience: [
      { skillId: SkillId.COMBAT, amount: 300 },
      { skillId: SkillId.EXPLORATION, amount: 300 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'collect-blighted-roots',
      name: 'Collect 10 Blighted Roots',
      description: 'Collect 10 Blighted Roots from Lesser Blight Blooms in the Ratkin Nest.',
      target: 10,
    },
    {
      id: 'give-blighted-roots',
      name: 'Give 10 Blighted Roots to Healer Mycelis',
      description: 'Give 10 Blighted Roots to Healer Mycelis in Stalkhaven.',
      target: 1,
    }
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    {
      npcClass: HealerMycelisEntity,
      dialogueOption: {
        text: 'Scout Morel asked me to bring you these... things. What are they?',
        nextDialogue: {
          text: `What?... Where did you find these? These are ancient roots - I remember studying them as a boy in the old Capfolk archives. There was an entire section about these in the ancient texts.`,
          options: [
            {
              text: 'Where are these archives?',
              nextDialogue: {
                text: `The old archives building is in the Hearthwilds, along the path to Sporewick. It's been abandoned for decades and is just ruins now. But if any books survived, they might still hold knowledge about these roots.`,
                options: [
                  {
                    text: 'I could search the ruins for the books.',
                    nextDialogue: {
                      text: `You would? By the ancient spores, that's brave! But please be extremely careful - the fog is much denser in the Hearthwilds, and the creatures far more dangerous. You'll need to go through Chitter Forest to get to the Hearthwilds. Return to me with what you learn.`, 
                      options: [
                        {
                          text: `I'll find those archives.`,
                          dismiss: true,
                          pureExit: true,
                        }
                      ]
                    },
                    onSelect: (interactor: GamePlayerEntity) => {
                      interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'give-blighted-roots', 1);
                      interactor.gamePlayer.questLog.completeQuest(this.id);
                      interactor.gamePlayer.questLog.startQuest(AncientWisdomQuest);
                    }
                  },
                ]
              }
            },
          ]
        },
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'collect-blighted-roots');
      }
    }
  ];

  public static setupForPlayer(gamePlayer: GamePlayer): () => void {
    // Add event listeners
    const itemPickupListener = (payload: BaseItemPlayerEventPayloads[BaseItemPlayerEvent.PICKED_UP]) => {
      if (payload.item.id === BlightedRootItem.id) {
        gamePlayer.questLog.adjustObjectiveProgress(this.id, 'collect-blighted-roots', payload.item.quantity);
      }
    };

    gamePlayer.eventRouter.on(BaseItemPlayerEvent.PICKED_UP, itemPickupListener);

    const cleanup = () => {
      gamePlayer.eventRouter.off(BaseItemPlayerEvent.PICKED_UP, itemPickupListener);
    };

    return cleanup;
  }    
}
