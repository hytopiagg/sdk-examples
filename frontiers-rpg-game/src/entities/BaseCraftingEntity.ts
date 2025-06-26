import BaseEntity, { BaseEntityOptions } from './BaseEntity';
import { ItemUIDataHelper } from '../items/ItemUIDataHelper';
import { SkillId } from '../config';
import type { ItemClass } from '../items/BaseItem';
import type { BaseEntityDialogueOption } from './BaseEntity';
import type GamePlayerEntity from '../GamePlayerEntity';

export type CraftingRecipe = {
  craftedItemClass: ItemClass;
  requirements: {
    itemClass: ItemClass;
    quantity: number;
  }[];
}

export type BaseCraftingEntityOptions = {
  additionalDialogueOptions?: BaseEntityDialogueOption[];
  craftingRecipes: CraftingRecipe[];
  dialogueAvatarImageUri: string;
  dialogueTitle: string;
} & BaseEntityOptions;

export default class BaseCraftingEntity extends BaseEntity {
  public readonly craftingRecipes: CraftingRecipe[];

  public constructor(options: BaseCraftingEntityOptions) {
    super({
      ...options,
      dialogue: {
        avatarImageUri: options.dialogueAvatarImageUri,
        title: options.dialogueTitle,
        dialogue: {
          text: 'Good to see you! What can I help you with?',
          options: [
            {
              text: `Craft items.`,
              onSelect: (interactor: GamePlayerEntity) => this.openCraftMenu(interactor),
              dismiss: true,
            },
            ...(options.additionalDialogueOptions ?? []),
            {
              text: `Nevermind, thanks!`,
              dismiss: true,
              pureExit: true,
            }
          ]
        }
      },
    });

    this.craftingRecipes = options.craftingRecipes;
  }


  public craftItem(interactor: GamePlayerEntity): void {

  }

  public openCraftMenu(interactor: GamePlayerEntity): void {
    interactor.setCurrentCraftingEntity(this);
    interactor.player.ui.sendData({
      type: 'toggleCrafting',
      crafterName: this.name,
      crafterTitle: this.dialogueRoot?.title,
      crafterAvatarUri: this.dialogueRoot?.avatarImageUri,
      craftingRecipes: this.craftingRecipes.map((recipe, index) => ({
        craftedItem: ItemUIDataHelper.getUIData(recipe.craftedItemClass),
        requirements: recipe.requirements.map(requirement => ItemUIDataHelper.getUIData(requirement.itemClass, { quantity: requirement.quantity })),
        position: index,
      })),
    })
  }

  private _awardCraftingSkillExperience(interactor: GamePlayerEntity) {

  }
}