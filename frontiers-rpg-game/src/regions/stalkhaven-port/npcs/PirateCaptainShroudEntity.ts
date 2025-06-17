import BaseEntity, { BaseEntityOptions } from '../../../entities/BaseEntity';

export default class PirateCaptainShroudEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/hunter.gltf',
      modelScale: 0.75,
      name: 'Captain Shroud',
      dialogue: {
        avatarImageUri: 'avatars/hunter.png',
        title: 'Pirate Captain',
        dialogue: {
          text: `Arr, we made it through them cursed waters! Lucky for ye, my crew knows these seas better than any. The fog-twisted beasts gave us a proper fight, but here ye be - safe in Stalkhaven Port.`,
          options: [
            {
              text: `That was quite the journey.`,
              nextDialogue: {
                text: `Aye, rougher than usual. Sea monsters getting bolder every week. Most captains won't even try the crossing anymore - but not Captain Shroud!`,
                options: [
                  {
                    text: `Will you be sailing anywhere else?`,
                    nextDialogue: {
                      text: `Wherever the coin flows, mate! Bring me enough gold and I'll sail ye to the ends of the earth. Just find me at the docks when ye need passage.`,
                      options: [
                        {
                          text: `I'll remember that.`,
                          dismiss: true,
                          pureExit: true,
                        },
                      ]
                    }
                  },
                  {
                    text: `Thanks for getting me here safely.`,
                    dismiss: true,
                    pureExit: true,
                  },
                ]
              }
            },
            {
              text: `How much for future voyages?`,
              nextDialogue: {
                text: `Depends where ye want to go, savvy? More dangerous the waters, higher the price. But I guarantee safe passage - Captain Shroud's never lost a paying customer!`,
                options: [
                  {
                    text: `I'll keep you in mind.`,
                    dismiss: true,
                    pureExit: true,
                  },
                ]
              }
            },
            {
              text: `I need to get going.`,
              nextDialogue: {
                text: `Off with ye then! Explore this cursed frontier, but remember - when ye need real passage across dangerous waters, Captain Shroud's yer man!`,
                options: [
                  {
                    text: `Fair winds, Captain.`,
                    dismiss: true,
                    pureExit: true,
                  },
                ]
              }
            },
          ],
        }
      },
      ...options,
    });
  }
}