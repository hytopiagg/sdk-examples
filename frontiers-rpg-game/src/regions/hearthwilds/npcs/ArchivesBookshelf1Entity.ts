import BaseEntity, { BaseEntityOptions } from '../../../entities/BaseEntity';

export default class ArchivesBookshelf1Entity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/environment/bookshelf.gltf',
      modelScale: 0.75,
      name: 'Archives Bookshelf',
      rotatesOnInteract: false,
      dialogue: {
        avatarImageUri: 'avatars/bookshelf.png',
        title: 'Moldy, rotten, old books...',
        dialogue: {
          text: `*You fumble through the books on the shelf, most are too rotten or weathered to read, but some are still intact*`,
          options: [
            {
              text: `Read "History of the Eastern Frontier"`,
              nextDialogue: {
                text: `*The leather-bound tome creaks as you open it. The first page reads:*

"When the first human settlers arrived in the Eastern Frontier three centuries ago, they found a land of unimaginable beauty. Ancient forests stretched endlessly, teeming with exotic wildlife and fruit-laden trees. Rivers ran crystal clear, and the very air seemed alive with magic."`,
                options: [
                  {
                    text: `Continue reading...`,
                    nextDialogue: {
                      text: `"The early settlers were in awe, but also determined. They saw opportunity where others saw wilderness. Year by year, they cleared the forests for farmland, diverted rivers for their mills, and drove back the native creatures to establish their towns and trade routes."`,
                      options: [
                        {
                          text: `Turn to the next page...`,
                          nextDialogue: {
                            text: `"What took nature millennia to grow, human ambition conquered in mere decades. Stalkhaven rose as the great trading hub, connecting distant settlements. Yet with each passing year, the wild beauty of the Frontier dimmed. The price of civilization was the very wilderness that first drew them here."`,
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
              text: `Read "History of the Capfolk"`,
              nextDialogue: {
                text: `*You carefully open the ancient text, its pages yellow with age:*

"The Capfolk have dwelt in the Eastern Frontier since time immemorial, long before human feet touched this soil. They lived as one with the forest, tending to the sacred mushroom groves and maintaining the delicate balance of nature."`,
                options: [
                  {
                    text: `Continue reading...`,
                    nextDialogue: {
                      text: `"When the human settlers arrived, the Capfolk welcomed them with open hearts, sharing their knowledge of healing spores and offering trade partnerships. Yet as the years passed, they grew troubled watching the great forests fall to human axes and the ancient ways forgotten."`,
                      options: [
                        {
                          text: `Turn to the next page...`,
                          nextDialogue: {
                            text: `"Legend speaks of the Capfolk's origin - that deep within the Outer Mountains lies a vast fungal cavern, where the first spark of Capfolk consciousness emerged from the earth itself millennia ago. It is said that in times of great peril, their kind may yet return to that sacred place."`,
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
              text: `Read "Findings in the Outer Mountains"`,
              nextDialogue: {
                text: `*The journal's pages flutter as you open it, filled with sketches and hurried notes:*

"The Outer Mountains remain the Eastern Frontier's greatest mystery. These towering peaks encircle the land like ancient sentinels, their slopes often barren and treacherous, shrouded in perpetual mist."`,
                options: [
                  {
                    text: `Continue reading...`,
                    nextDialogue: {
                      text: `"Expeditions into these heights report strange phenomena - ethereal beings that mock travelers with illusions, pathways that lead nowhere, and an unsettling feeling of being watched. Many brave souls have ventured into the peaks, never to return."`,
                      options: [
                        {
                          text: `Turn to the next page...`,
                          nextDialogue: {
                            text: `"The mountain folk speak in whispers of lights that dance in the high valleys, of voices that call from empty air, and of caves that seem to breathe. Whether these are spirits of the ancient past or something else entirely, none can say. The mountains keep their secrets well."`,
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