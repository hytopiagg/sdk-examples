import BaseEntity, { BaseEntityOptions } from '../../../entities/BaseEntity';

export default class ArchivesBookshelf2Entity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/environment/bookshelf.gltf',
      modelScale: 0.75,
      name: 'Archives Bookshelf',
      rotatesOnInteract: false,
      dialogue: {
        avatarImageUri: 'avatars/bookshelf.png',
        title: 'Books with Capfolk markings...',
        dialogue: {
          text: `*You fumble through the books on the shelf, most are too rotten or weathered to read, but some are still intact*`,
          options: [
            {
              text: `Read "Sacred Fungi of the Eastern Frontier"`,
              nextDialogue: {
                text: `*You open the elaborately illustrated tome, its pages filled with detailed mushroom drawings:*

"The sacred fungi of the Eastern Frontier are far more than mere plants - they are the lifeblood of Capfolk civilization. For millennia, these mystical mushrooms have provided healing, sustenance, and spiritual guidance to our people."`,
                options: [
                  {
                    text: `Continue reading...`,
                    nextDialogue: {
                      text: `"The Healing Caps grant restoration to the wounded, while the rare Sight Spores can grant visions of distant places. Moon Mushrooms glow with ethereal light in darkness, ancient Grove Guardians are said to whisper wisdom to those pure of heart. The Eastern Frontier is home to hundreds of kinds of mushrooms, each with their own unique properties and uses."`,
                      options: [
                        {
                          text: `Turn to the next page...`,
                          nextDialogue: {
                            text: `"But above all, the Great Mycelium connects all fungi in an invisible network beneath the earth. Through this sacred web, we Capfolk learned our first lessons of unity and connected consciousness. To harm the sacred groves is to wound the very soul of our people."`,
                            options: [
                              {
                                text: `Close the book`,
                                dismiss: true,
                                pureExit: true,
                              }
                            ]
                          }
                        }
                      ]
                    }
                  },
                  {
                    text: `Close the book`,
                    dismiss: true,
                    pureExit: true,
                  }
                ]
              }
            },
            {
              text: `Read "The Withering Age Chronicles"`,
              nextDialogue: {
                text: `*You carefully open the ancient chronicle, its pages dark with age and warning:*

"In the earliest days of Capfolk consciousness, when our people were but young sprouts of wisdom, a great shadow fell across the Eastern Frontier. An intelligent hunger awakened deep within the earth - a vast network of parasitic roots that devoured all in its path."`,
                options: [
                  {
                    text: `Continue reading...`,
                    nextDialogue: {
                      text: `"This cunning plant-mind spread silently through the soil, sapping nutrients from every living thing and destroying our sacred groves. Rivers ran dry, forests withered, and the very earth turned gray and lifeless. No ordinary plant could grow, no creature could thrive, as this ancient evil consumed the essence of life itself."`,
                      options: [
                        {
                          text: `Turn to the next page...`,
                          nextDialogue: {
                            text: `"For centuries our ancestors suffered under this blight, until the Great Pilgrimage was declared. United as one people, the Capfolk marched into the Outer Mountains to face the source. The siege lasted seven seasons, but at last the heart of the hunger was driven out of the land. The Withering Age ended, and the land bloomed anew."`,
                            options: [
                              {
                                text: `Close the chronicle`,
                                dismiss: true,
                                pureExit: true,
                              }
                            ]
                          }
                        }
                      ]
                    }
                  },
                  {
                    text: `Close the chronicle`,
                    dismiss: true,
                    pureExit: true,
                  }
                ]
              }
            },
            {
              text: `Read "The Great Departure"`,
              nextDialogue: {
                text: `*The weathered journal opens with a melancholy creak, its pages filled with farewell songs:*

"As the age of human expansion reached its height, many of our wisest elders spoke of an ancient calling - a summons from the lands beyond the Outer Mountains, beyond the mountain's caves where our people first emerged."`,
                options: [
                  {
                    text: `Continue reading...`,
                    nextDialogue: {
                      text: `"Hundreds of our kin answered the call, gathering their belongings and walking through the treacherous mountain passes. They spoke of returning to the source, of preserving the old ways in a place untouched by the changing world, and taking a pilgramage to the new that lay beyond the mountains."`,
                      options: [
                        {
                          text: `Turn to the next page...`,
                          nextDialogue: {
                            text: `"That was generations ago. No word has come from those who departed, no traveler has returned to tell of their fate. The lands beyond remain shrouded in mystery. Some say they found their paradise, others fear they found only shadow. The mountains and the land beyond keep their secrets."`,
                            options: [
                              {
                                text: `Close the journal`,
                                dismiss: true,
                                pureExit: true,
                              }
                            ]
                          }
                        }
                      ]
                    }
                  },
                  {
                    text: `Close the journal`,
                    dismiss: true,
                    pureExit: true,
                  }
                ]
              }
            },
            {
              text: `Step away from the bookshelf`,
              dismiss: true,
              pureExit: true,
            },
          ],
        }
      },
      ...options,
    });
  }
}