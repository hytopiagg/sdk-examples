import BaseEntity, { BaseEntityOptions } from '../../../entities/BaseEntity';

export default class CaptainSpornEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/mushroom-knight.gltf',
      modelScale: 0.65,
      moveSpeed: 3,
      name: 'Captain Sporn',
      dialogue: {
        avatarImageUri: 'avatars/capfolk-knight.png',
        title: 'South Gate Guard',
        dialogue: {
          text: `Hold there, traveler. I'm Captain Sporn. I led Capfolk refugees here from the fog, now I guard this gate. Chitter Forest beyond is overrun with twisted creatures. The Ratkin were never this aggressive before. You prepared for what's out there?`,
          options: [
            {
              text: `I'm ready to fight.`,
              nextDialogue: {
                text: `Good spirit! But the fog changed them - they're stronger, more cunning. Their leader calls himself the "Whisker King" now. Make sure you're well-armed before entering the fog.`,
                options: [
                  {
                    text: `Where can I get weapons?`,
                    nextDialogue: {
                      text: `Merchant Finn's got blades that cut through fog-touched hide. Tell him I sent you for a fair price. And if you hear chittering in the fog, retreat immediately.`,
                      options: [
                        {
                          text: `Thanks for the warning.`,
                          dismiss: true,
                          pureExit: true,
                        },
                      ]
                    }
                  },
                  {
                    text: `Any survival tips?`,
                    nextDialogue: {
                      text: `The fog's thickest off the main paths - that's where they hunt. Avoid anything glowing through the fog - it's never friendly. The forest itself fights you now.`,
                      options: [
                        {
                          text: `I'll be careful.`,
                          dismiss: true,
                          pureExit: true,
                        },
                      ]
                    }
                  },
                  {
                    text: `I'll clear them all out.`,
                    nextDialogue: {
                      text: `If you can push back the fog's influence, Stalkhaven will sing your name! We've lost too much to this cursed fog. Return with victory and I'll make you a local legend.`,
                      options: [
                        {
                          text: `I'll bring you their leader's head.`,
                          dismiss: true,
                          pureExit: true,
                        },
                      ]
                    }
                  },
                ]
              }
            },
            {
              text: `What's this Frontier Fog?`,
              nextDialogue: {
                text: `Came from nowhere two months ago - a creeping fog that turns peaceful creatures into monsters. Lost a dozen settlements already. My brother's patrol vanished when the fog first hit the forest.`,
                options: [
                  {
                    text: `I'll find answers about your brother.`,
                    nextDialogue: {
                      text: `The fog took him, but maybe not his soul. Look for signs in the fog - survivors say some folks are still trapped in there, changed but alive.`,
                      options: [
                        {
                          text: `I promise he'll be avenged.`,
                          dismiss: true,
                          pureExit: true,
                        },
                      ]
                    }
                  },
                  {
                    text: `Maybe I should avoid the forest.`,
                    nextDialogue: {
                      text: `Smart thinking. If you do decide to go out, make sure you've got a weapon.`,
                      options: [
                        {
                          text: `I'll prepare before entering Chitter Forest.`,
                          dismiss: true,
                          pureExit: true,
                        },
                      ]
                    }
                  },
                ]
              }
            },
            {
              text: `Just passing through.`,
              nextDialogue: {
                text: `Through fog-cursed wilderness? Either brave or mad. The fog claims most who enter unprepared. Grab weapons from Finn's shop - consider it frontier survival insurance.`,
                options: [
                  {
                    text: `Fine, I'll get equipped first.`,
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