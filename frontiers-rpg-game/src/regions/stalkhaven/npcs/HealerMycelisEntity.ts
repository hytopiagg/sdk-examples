import BaseEntity, { BaseEntityOptions } from '../../../entities/BaseEntity';

export default class HealerMycelisEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/mushroom-elder.gltf',
      modelScale: 0.55,
      name: 'Healer Mycelis',
      dialogue: {
        avatarImageUri: 'avatars/capfolk-elder.png',
        title: 'Capfolk Elder',
        dialogue: {
          text: `Greetings, traveler. I am Mycelis, a healer who fled the fog. My spores can mend your wounds if you need aid.`,
          options: [
            {
              text: `Heal me, please.`,
              onSelect: (interactor) => {
                interactor.adjustHealth(interactor.maxHealth);
              },
              nextDialogue: {
                text: `Of course, child. Breathe deeply as my healing spores mend your wounds and restore your strength. There... you should feel much better now.`,
                options: [
                  {
                    text: `Thank you for the healing.`,
                    dismiss: true,
                    pureExit: true,
                  },
                ]
              }
            },
            {
              text: `Tell me about your journey here.`,
              nextDialogue: {
                text: `I fled Sporewick when the fog consumed my village. Watched my people transform into twisted creatures. Barely escaped alive.`,
                options: [
                  {
                    text: `What happened when the fog arrived?`,
                    nextDialogue: {
                      text: `Came at dawn like a living thing. Our mushroom circles glowed with sickly light. My people breathed corrupted spores and... changed.`,
                      options: [
                        {
                          text: `How did you escape?`,
                          nextDialogue: {
                            text: `Sealed myself in the healing chambers for three days. The ventilation kept pure air flowing. Then I fled with what I could carry.`,
                            options: [
                              {
                                text: `You're brave to have survived.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                        {
                          text: `Any other survivors?`,
                          nextDialogue: {
                            text: `Two others made it out from Sporewick. They're at a refugee camp beyond the eastern hills. The fog claimed most in minutes.`,
                            options: [
                              {
                                text: `Maybe you can rebuild someday.`,
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
                    text: `What was Sporewick like before?`,
                    nextDialogue: {
                      text: `Underground chambers filled with glowing fungi. We cultivated healing spores for The Frontier. It was beautiful... now it's gone.`,
                      options: [
                        {
                          text: `Your knowledge lives on.`,
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
              text: `Tell me about The Frontier's history.`,
              nextDialogue: {
                text: `Once untamed wilderness, we built a network of settlements over centuries. Humans, Capfolk, Ratkin - all cooperating peacefully.`,
                options: [
                  {
                    text: `What made it special?`,
                    nextDialogue: {
                      text: `Each settlement specialized - Stalkhaven for trade, Sporewick for healing. Three centuries of prosperity until the fog destroyed it all.`,
                      options: [
                        {
                          text: `Can it be rebuilt?`,
                          nextDialogue: {
                            text: `Maybe, if we stop the fog. But it'll take generations to restore what was lost.`,
                            options: [
                              {
                                text: `At least some remember.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                        {
                          text: `What about before the settlements?`,
                          nextDialogue: {
                            text: `Ancient peoples left stone circles and burial mounds. Maybe they faced something like this fog before.`,
                            options: [
                              {
                                text: `That could be important.`,
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
                    text: `Were there always monsters?`,
                    nextDialogue: {
                      text: `Some, but they kept to deep forests. Most creatures were peaceful - even Ratkin were traders. The fog corrupted everything.`,
                      options: [
                        {
                          text: `We need to find its source.`,
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
              text: `I should continue on my journey.`,
              nextDialogue: {
                text: `Travel safely, friend. Carry pure water and breathe through cloth in fog-touched lands. Stay vigilant.`,
                options: [
                  {
                    text: `Thank you for the advice.`,
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