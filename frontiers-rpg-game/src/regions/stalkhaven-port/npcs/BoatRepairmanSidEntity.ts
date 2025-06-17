import BaseEntity, { BaseEntityOptions } from '../../../entities/BaseEntity';

export default class BoatRepairmanSidEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/mechanic.gltf',
      modelScale: 0.75,
      name: 'Sid',
      dialogue: {
        avatarImageUri: 'avatars/mechanic.png',
        title: 'Boat Repairman',
        dialogue: {
          text: `Welcome to Stalkhaven Port, brave soul! You picked a hell of a time to visit The Frontier. Takes real guts to sail here with those pirates - they're the only ones still making the crossing since the fog hit.`,
          options: [
            {
              text: `What's this fog everyone mentions?`,
              nextDialogue: {
                text: `Appeared two months back, turning everything it touches into monsters. Corrupted the seas, the forests, even peaceful folk. Most settlements are gone.`,
                options: [
                  {
                    text: `Where should I go to learn more?`,
                    nextDialogue: {
                      text: `Head into town and find Commander Mark - he'll give you the full picture. Just follow the main road up from the docks.`,
                      options: [
                        {
                          text: `Thanks for the directions.`,
                          dismiss: true,
                          pureExit: true,
                        },
                      ]
                    }
                  },
                  {
                    text: `Is anywhere safe?`,
                    nextDialogue: {
                      text: `Stalkhaven's holding strong for now. Good walls, good people. But the fog's always creeping closer.`,
                      options: [
                        {
                          text: `I'll help however I can.`,
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
              text: `Why are only pirates still sailing?`,
              nextDialogue: {
                text: `Sea monsters patrol these waters now - twisted things with too many teeth. Regular merchants won't risk it, but pirates? They're crazy enough to try anything for coin.`,
                options: [
                  {
                    text: `Glad they brought me here safely.`,
                    nextDialogue: {
                      text: `Count yourself lucky. Half the ships that attempt the crossing don't make it back. Now get into town before dark - Commander Mark can tell you more.`,
                      options: [
                        {
                          text: `I'll head there now.`,
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
              text: `I need to get into town.`,
              nextDialogue: {
                text: `Smart thinking. Follow the main road straight up from here - can't miss it. Find Commander Mark at the garrison, he'll catch you up on everything.`,
                options: [
                  {
                    text: `Thanks, I'll find him.`,
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