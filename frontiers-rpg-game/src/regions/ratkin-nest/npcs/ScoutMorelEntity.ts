import BaseEntity, { BaseEntityOptions } from '../../../entities/BaseEntity';

export default class ScoutMorelEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/mushroom-boy.gltf',
      modelScale: 0.65,
      moveSpeed: 3,
      name: 'Scout Morel',
      dialogue: {
        avatarImageUri: 'avatars/capfolk-villager.png',
        title: '7th Regiment Volunteer',
        dialogue: {
          text: `Hold there! What brings you to this cursed place? I'm Scout Morel of the 7th Regiment - been posted here to watch this Ratkin nest. This place... it's not safe.`,
          options: [
            {
              text: `What exactly is this cave?`,
              nextDialogue: {
                text: `This was once a peaceful Ratkin nest - simple burrow dwellers who traded with Stalkhaven. Outer tunnels are now crawling with aggressive Ratkin. Deeper in are Tainted ones.. Glowing green, unnaturally strong. I only explore during daylight. Sunlight comes through holes in the cave's ceiling. At night, you can't see anything.`,
                options: [
                  {
                    text: `I understand.`,
                    dismiss: true,
                    pureExit: true,
                  }
                ]
              }
            },
            {
              text: `Have you seen anything else unusual?`,
              nextDialogue: {
                text: `That's the worst part. Deep in the nest, I saw creatures I've never seen before. They were spewing thick vapor. When I got close to get a better look, I suddenly got dizzy - had to retreat.`,
                options: [
                  {
                    text: `Thanks for the info.`,
                    dismiss: true,
                    pureExit: true,
                  }
                ]
              }
            },
            {
              text: `How did you end up in Stalkhaven?`,
              nextDialogue: {
                text: `I was in Sporewick when the fog hit. Captain Chanterelion and Captain Sporn led the evacuation - chaos everywhere, corrupted spores in the air. Lost so many... I escaped with refugees and trained as a scout to honor those who didn't make it.`,
                options: [
                  {
                    text: `I'm glad you made it out safely.`,
                    dismiss: true,
                    pureExit: true,
                  }
                ]
              }
            },
            {
              text: `I'll be careful.`,
              dismiss: true,
              pureExit: true,
            }
          ]
        }
      },
      ...options,
    });
  }
}