import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';

import type GamePlayer from '../../GamePlayer';

import { BaseItemPlayerEvent } from '../../items/BaseItem';
import type { BaseItemPlayerEventPayloads } from '../../items/BaseItem';

import BlightedRootItem from '../../items/materials/BlightedRootItem';

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
    // add convo with healer mycelis
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
