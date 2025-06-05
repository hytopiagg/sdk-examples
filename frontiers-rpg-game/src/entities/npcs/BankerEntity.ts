import BaseEntity, { BaseEntityOptions } from '../BaseEntity';

export default class BankerEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/banker.gltf',
      modelScale: 0.75,
      name: 'Banker John',
      dialogue: {
        avatarImageUri: 'avatars/banker.png',
        title: 'Head of the Bank',
        dialogue: {
          text: 'Sorry, the bank is still under construction. Please check back later.',
          options: [
            {
              text: 'How is the town doing?',
              nextDialogue: {
                text: 'The town is doing well, thanks for asking.',
                options: [
                  {
                    text: 'That\'s good to hear.',
                    dismiss: true,
                  },
                ]
              }
            },
            {
              text: 'Ok, I will check back later.',
              dismiss: true,
            },
          ],
        }
      },
      ...options,
    });
  }
}