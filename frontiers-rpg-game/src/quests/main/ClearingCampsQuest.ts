import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import { SkillId } from '../../config';
import type GamePlayer from '../../GamePlayer';
import type GamePlayerEntity from '../../GamePlayerEntity';

import { BaseEntityPlayerEvent } from '../../entities/BaseEntity';
import type { BaseEntityPlayerEventPayloads } from '../../entities/BaseEntity';

import CaptainChanterelionEntity from '../../regions/chitter-forest/npcs/CaptainChanterelionEntity';
import IntoTheNestQuest from './IntoTheNestQuest';

import GoldItem from '../../items/general/GoldItem';

// Bounding boxes we check when a kill happens to determine if it was in an objective area.
const CAMP_KILL_BOUNDING_BOXES = [
  { // Main camp
    objectiveId: 'kill-main-camp',
    min: { x: -31, y: 1, z: -21 },
    max: { x: 1, y: 6, z: 16 },
  },
  { // Secondary camp
    objectiveId: 'kill-secondary-camp',
    min: { x: -20, y: 1, z: -60 },
    max: { x: 24, y: 6, z: -29 },
  },
  { // Lake camp
    objectiveId: 'kill-lake-camp',
    min: { x: -115, y: 1, z: 13},
    max: { x: -65, y: 6, z: 70 },
  },
  { // Corridor camp
    objectiveId: 'kill-corridor-camp',
    min: { x: 38, y: 1, z: 13 },
    max: { x: 97, y: 6, z: 55 },
  },
];

export default class ClearingCampsQuest extends BaseQuest {
  static readonly id = 'clearing-camps';
  static readonly name = `Clearing Camps`;
  static readonly description = 'The Ratkin have established four major encampments that threaten Stalkhaven. We need to thin out these camps before they can launch a full on assault on Stalkhaven.';

  static readonly reward = {
    items: [
      { itemClass: GoldItem, quantity: 100 },
    ],
    skillExperience: [
      { skillId: SkillId.AGILITY, amount: 50 },
      { skillId: SkillId.COMBAT, amount: 200 },
      { skillId: SkillId.EXPLORATION, amount: 175 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'kill-main-camp',
      name: 'Kill 3 Main camp Ratkin',
      description: 'Kill 3 Ratkin at their main camp in Chitter Forest',
      target: 3,
    },
    {
      id: 'kill-secondary-camp',
      name: 'Kill 3 Secondary camp Ratkin',
      description: 'Kill 3 Ratkin at their secondary camp in Chitter Forest',
      target: 3,
    },
    {
      id: 'kill-lake-camp',
      name: 'Kill 3 Lake camp Ratkin',
      description: 'Kill 3 Ratkin at their lake camp in Chitter Forest',
      target: 3,
    },
    {
      id: 'kill-corridor-camp',
      name: 'Kill 3 Corridor camp Ratkin',
      description: 'Kill 3 Ratkin at their corridor camp in Chitter Forest',
      target: 3,
    },
    {
      id: 'talk-to-chanterelion',
      name: 'Talk to Captain Chanterelion',
      description: 'Talk to Captain Chanterelion at his outpost in Chitter Forest after completing all other objectives.',
      target: 1,
    }
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    // Quest Complete 
    {
      npcClass: CaptainChanterelionEntity,
      dialogueOption: {
        text: `I've cleared out the Ratkin camps. What's the situation now?`,
        nextDialogue: {
          text: `Great work. You've bought us precious time. My scouts report the surviving Ratkin are retreating toward the lake cave. That cave was once a peaceful Ratkin nest before the fog corrupted them. If there's a source to their madness in that cave, we might have a chance to end this threat at its root.`,
          options: [
            {
              text: `Sounds like that's where we'll need to strike next.`,
              nextDialogue: {
                text: `I agree, we're already ahead of you - I've sent one of our scouts to the entrance of the cave to get more intel. Head to the cave and meet with him, we'll need a brave warrior like you to get to the bottom of this.`,
                options: [
                  {
                    text: `I'll head there immediately.`,
                    dismiss: true,
                    pureExit: true,
                  }
                ]
              },
              onSelect: (interactor: GamePlayerEntity) => {
                interactor.gamePlayer.questLog.adjustObjectiveProgress(this.id, 'talk-to-chanterelion', 1);
                interactor.gamePlayer.questLog.completeQuest(this.id);
                interactor.gamePlayer.questLog.startQuest(IntoTheNestQuest);
              }
            }
          ]
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-main-camp') &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-secondary-camp') &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-lake-camp') &&
               interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'kill-corridor-camp');
      }
    }
  ];

  public static setupForPlayer(gamePlayer: GamePlayer): () => void {
    // Add event listeners
    const killListener = (payload: BaseEntityPlayerEventPayloads[BaseEntityPlayerEvent.KILLED]) => {
      const entity = payload.entity;

      if (entity.name.includes('Ratkin')) {
        const killedInObjectiveBoundingBox = CAMP_KILL_BOUNDING_BOXES.find(boundingBox => {
          return entity.position.x >= boundingBox.min.x && entity.position.z >= boundingBox.min.z &&
                 entity.position.x <= boundingBox.max.x && entity.position.z <= boundingBox.max.z;
        });

        if (killedInObjectiveBoundingBox) {
          gamePlayer.questLog.adjustObjectiveProgress(this.id, killedInObjectiveBoundingBox.objectiveId, 1);
        }
      }
    }

    gamePlayer.eventRouter.on(BaseEntityPlayerEvent.KILLED, killListener);

    const cleanup = () => {
      gamePlayer.eventRouter.off(BaseEntityPlayerEvent.KILLED, killListener);
    };

    return cleanup;
  } 
}
