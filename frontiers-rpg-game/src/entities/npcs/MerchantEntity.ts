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
            },
            {
              text: `I'd like to sell some items.`,
              onSelect: (interactor: GamePlayerEntity) => this._openSellMenu(interactor),
            },
            {
              text: `Nevermind, I don't need anything.`,
              dismiss: true,
            },
          ]
        }
      },
      ...options,
    });
  }

  private _openBuyMenu(interactor: GamePlayerEntity): void {
    console.log('open buy menu');
  }

  private _openSellMenu(interactor: GamePlayerEntity): void {
    console.log('open sell menu');
  }
}