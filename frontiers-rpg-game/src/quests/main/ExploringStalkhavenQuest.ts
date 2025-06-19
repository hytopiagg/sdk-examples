import BaseQuest, { QuestObjective, QuestNpcDialogueInteraction } from '../BaseQuest';
import HealerMycelisEntity from '../../regions/stalkhaven/npcs/HealerMycelisEntity';
import CaptainSpornEntity from '../../regions/stalkhaven/npcs/CaptainSpornEntity';
import CommanderMarkEntity from '../../regions/stalkhaven/npcs/CommanderMarkEntity';
import MerchantFinnEntity from '../../regions/stalkhaven/npcs/MerchantFinnEntity';
import { SkillId } from '../../config';
import type GamePlayerEntity from '../../GamePlayerEntity';

// Rewards
import DullSwordItem from '../../items/weapons/DullSwordItem';
import GoldItem from '../../items/general/GoldItem';

export default class ExploringStalkhavenQuest extends BaseQuest {
  static readonly id = 'exploring-stalkhaven';
  static readonly name = 'Exploring Stalkhaven';
  static readonly description = `Commander Mark advised you to learn from Stalkhaven\'s people before facing The Frontier\'s dangers. Speak with key townspeople - the healer who tends to fog survivors, the merchant who supplies brave souls, and the captain who leads refugees to safety. Their knowledge could mean the difference between life and death in the corrupted lands beyond.`;

  static readonly reward = {
    items: [
      { itemClass: DullSwordItem, quantity: 1 },
      { itemClass: GoldItem, quantity: 75 },
    ],
    skillExperience: [
      { skillId: SkillId.EXPLORATION, amount: 50 },
    ],
  }

  static readonly objectives: QuestObjective[] = [
    {
      id: 'talk-to-mycelis',
      name: 'Talk to Healer Mycelis',
      description: 'Find Healer Mycelis in Stalkhaven and speak with him.',
      target: 1,
    },
    {
      id: 'talk-to-finn',
      name: 'Talk to Merchant Finn',
      description: 'Find Merchant Finn in Stalkhaven and speak with him.',
      target: 1,
    },
    {
      id: 'talk-to-sporn',
      name: 'Talk to Captain Sporn',
      description: 'Find Captain Sporn in Stalkhaven and speak with him.',
      target: 1,
    },
    {
      id: 'talk-to-mark',
      name: 'Return to Commander Mark',
      description: 'Speak with Commander Mark after speaking with the others.',
      target: 1,
    }
  ];

  static readonly dialogueInteractions: QuestNpcDialogueInteraction[] = [
    // Healer Mycelis
    {
      npcClass: HealerMycelisEntity,
      dialogueOption: {
        text: `Commander Mark said I should speak with you before venturing into The Frontier.`,
        nextDialogue: {
          text: `Wise counsel from Mark. I am Mycelis, a healer who fled Sporewick when corruption consumed it. My spores can mend wounds and cleanse fog ailments. Return when you need healing, traveler.`,
          options: [
            {
              text: `Thank you, Elder. I'll remember.`,
              dismiss: true,
              pureExit: true,
              onSelect: (interactor: GamePlayerEntity) => {
                interactor.gamePlayer.questLog.updateObjectiveProgress(this.id, 'talk-to-mycelis', 1);
              }
            }
          ]
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) && !interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'talk-to-mycelis');
      }
    },

    // Merchant Finn
    {
      npcClass: MerchantFinnEntity,
      dialogueOption: {
        text: `Commander Mark said I should speak with you about equipment for The Frontier.`,
        nextDialogue: {
          text: `Smart thinking! I'm Finn, and I've got gear to keep you breathing out there. Quality blades, healing potions, whatever you need. Bring coin or trade goods, I'll keep you equipped.`,
          options: [
            {
              text: `I'll remember that. Thanks, Finn.`,
              dismiss: true,
              pureExit: true,
              onSelect: (interactor: GamePlayerEntity) => {
                interactor.gamePlayer.questLog.updateObjectiveProgress(this.id, 'talk-to-finn', 1);
              }
            }
          ]
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) && !interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'talk-to-finn');
      }
    },

    // Captain Sporn 
    {
      npcClass: CaptainSpornEntity,
      dialogueOption: {
        text: `Commander Mark sent me to learn about the threats beyond the gates.`,
        nextDialogue: {
          text: `Good preparation. Chitter Forest is overrun with corrupted Ratkin under the "Whisker King." Once peaceful traders, now they attack on sight. Get weapons from Finn before entering that cursed forest.`,
          options: [
            {
              text: `I'll arm myself first. Thanks for the warning.`,
              dismiss: true,
              pureExit: true,
              onSelect: (interactor: GamePlayerEntity) => {
                interactor.gamePlayer.questLog.updateObjectiveProgress(this.id, 'talk-to-sporn', 1);
              }
            }
          ]
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) && !interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'talk-to-sporn');
      }
    },

    // Return to Commander Mark to complete quest
    {
      npcClass: CommanderMarkEntity,
      dialogueOption: {
        text: `I've spoken with Healer Mycelis, Merchant Finn, and Captain Sporn as you suggested.`,
        nextDialogue: {
          text: `Excellent work. You've gained valuable allies - Mycelis for healing, Finn for equipment, Sporn for threat knowledge. Take this old dull sword I found - it's better than that wooden training blade. Also, here's some gold for supplies to get you started. You're ready for Chitter Forest. Stay vigilant against the Ratkin.`,
          options: [
            {
              text: `Thank you, Commander. I'll handle the Ratkin threat.`,
              dismiss: true,
              pureExit: true,
              onSelect: (interactor: GamePlayerEntity) => {
                interactor.gamePlayer.questLog.updateObjectiveProgress(this.id, 'talk-to-mark', 1);
                interactor.gamePlayer.questLog.completeQuest(this.id);
              }
            }
          ]
        }
      },
      enabledForInteractor: (interactor: GamePlayerEntity) => {
        return interactor.gamePlayer.questLog.isQuestActive(this.id) && 
          interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'talk-to-mycelis') &&
          interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'talk-to-finn') &&
          interactor.gamePlayer.questLog.isQuestObjectiveCompleted(this.id, 'talk-to-sporn');
      }
    }
  ];
}
