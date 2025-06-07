import BaseEntity, { BaseEntityOptions } from '../BaseEntity';
import GamePlayerEntity from '../../GamePlayerEntity';

export default class MerchantEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/merchant.gltf',
      modelScale: 0.75,
      name: 'Merchant Finn',
      dialogue: {
        avatarImageUri: 'avatars/merchant.png',
        title: 'Goods Vendor',
        dialogue: {
          text: 'Welcome to my shop! How can I help you today?',
          options: [
            {
              text: `I'd like to buy some items.`,
              onSelect: (interactor: GamePlayerEntity) => this._openBuyMenu(interactor),
              dismiss: true,
            },
            {
              text: `I'd like to sell some items.`,
              onSelect: (interactor: GamePlayerEntity) => this._openSellMenu(interactor),
              dismiss: true,
            },
            {
              text: `Nevermind, I don't need anything.`,
              dismiss: true,
              pureExit: true,
            },
          ]
        }
      },
      ...options,
    });
  }

  private _openBuyMenu(interactor: GamePlayerEntity): void {
    interactor.player.ui.sendData({
      type: 'toggleMerchant',
      mode: 'buy',
      merchantName: this.name,
      merchantTitle: this.dialogueRoot?.title,
      merchantAvatarUri: this.dialogueRoot?.avatarImageUri,
      buyItems: [],
    })
  }

  private _openSellMenu(interactor: GamePlayerEntity): void {
    interactor.player.ui.sendData({
      type: 'toggleMerchant',
      mode: 'sell',
      merchantName: this.name,
      merchantTitle: this.dialogueRoot?.title,
      merchantAvatarUri: this.dialogueRoot?.avatarImageUri,
    })
  }
}