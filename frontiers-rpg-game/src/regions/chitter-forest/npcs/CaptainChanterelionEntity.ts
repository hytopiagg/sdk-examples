import BaseEntity, { BaseEntityOptions } from '../../../entities/BaseEntity';

export default class CaptainChanterelionEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/mushroom-knight.gltf',
      modelScale: 0.85,
      moveSpeed: 3,
      name: 'Captain Chanterelion',
      tintColor: { r: 255, g: 255, b: 64 },
      dialogue: {
        avatarImageUri: 'avatars/capfolk-captain-chanterelion.png',
        title: '7th Regiment Volunteer',
        dialogue: {
          text: `Hail, traveler! I am Captain Chanterelion of the 7th Regiment. These are dark times indeed - the forest grows more dangerous by the day, and we few stand guard to protect Stalkhaven's refugees.`,
          options: [
            {
              text: `Why are you so... big and yellow?`,
              nextDialogue: {
                text: `Ha! You've keen eyes, friend. I'm a Capfolk of the Chantre clan - we're known for our golden hue and impressive stature. My ancestors were the guardians of old Sporewick in the mountains, bred large to defend the deep tunnels.`,
                options: [
                  {
                    text: `Tell me about the Chantre clan.`,
                    nextDialogue: {
                      text: `We were the shield-bearers of Sporewick for generations. While other Capfolk tended the healing spores, we Chantre stood watch at the gates. Our size comes from generations of eating the golden fungi that grew only in our ancestral halls.`,
                      options: [
                        {
                          text: `Those halls are lost now?`,
                          nextDialogue: {
                            text: `Aye, consumed by that cursed fog. But the Chantre bloodline endures, and we'll rebuild when this darkness passes. Our strength is needed now more than ever.`,
                            options: [
                              {
                                text: `Your people are fortunate to have you.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                        {
                          text: `Impressive heritage.`,
                          dismiss: true,
                          pureExit: true,
                        },
                      ]
                    }
                  },
                  {
                    text: `That's fascinating.`,
                    dismiss: true,
                    pureExit: true,
                  },
                ]
              }
            },
            {
              text: `Why are you stationed here?`,
              nextDialogue: {
                text: `I escaped Sporewick alongside Captain Sporn when the fog consumed our homeland. Lost too many good soldiers that day... Now I volunteer to guard this outpost, protecting the Capfolk refugees who've taken shelter in Stalkhaven.`,
                options: [
                  {
                    text: `How did you escape Sporewick?`,
                    nextDialogue: {
                      text: `Captain Sporn led the evacuation when the fog first crept in. I held the rear guard, buying time for families to flee. We lost half our regiment, but saved many innocent lives.`,
                      options: [
                        {
                          text: `You're a true hero.`,
                          nextDialogue: {
                            text: `No hero - just a soldier doing his duty. The real heroes were those who didn't make it out. We carry their memory forward, and we'll reclaim our homeland in their name.`,
                            options: [
                              {
                                text: `They would be proud.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                        {
                          text: `How many Capfolk made it to Stalkhaven?`,
                          nextDialogue: {
                            text: `Hard to say. What I do know is, it was mostly families, with a handful of us soldiers. We've integrated well with the local community, but we dream of the day we can return home.`,
                            options: [
                              {
                                text: `That day will come.`,
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
                    text: `What about Captain Sporn?`,
                    nextDialogue: {
                      text: `Sporn guards Stalkhaven's southern gate while I watch this forest approach. We coordinate our patrols - can't let those corrupted Ratkin catch us off guard. He's a good leader, saved many lives during the evacuation.`,
                      options: [
                        {
                          text: `Good to have experienced commanders.`,
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
              text: `What's the current situation?`,
              nextDialogue: {
                text: `Dire, friend. The Ratkin have grown unnaturally aggressive since the fog touched them. They're establishing camps closer to Stalkhaven each week - bold raids that would have been unthinkable before the corruption.`,
                options: [
                  {
                    text: `How close are they getting?`,
                    nextDialogue: {
                      text: `Too close for comfort. We've spotted their war-banners just two leagues out. My scouts report they're building siege equipment - crude but effective. They mean to test our defenses soon.`,
                      options: [
                        {
                          text: `Can Stalkhaven's defenses hold?`,
                          nextDialogue: {
                            text: `We'll fight to the last spore, but honestly? We're undermanned. Captain Sporn and I, plus maybe a dozen able fighters. Against hundreds of corrupted Ratkin... the odds aren't favorable.`,
                            options: [
                              {
                                text: `Maybe I can help thin their numbers.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                        {
                          text: `What kind of siege equipment?`,
                          nextDialogue: {
                            text: `Crude catapults and battering rams, but effective enough. The fog has made them cleverer - they're using tactics we've never seen from Ratkin before. It's deeply unsettling.`,
                            options: [
                              {
                                text: `The fog changes everything.`,
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
                    text: `What about the lake area?`,
                    nextDialogue: {
                      text: `Ah, you've heard the reports? There's a cave system by the lake where many fog sick Ratkin have made their lair. We call them 'Tainted' - they glow green with sickly fog-light and have unnatural strength..`,
                      options: [
                        {
                          text: `How dangerous are these Tainted?`,
                          nextDialogue: {
                            text: `Far beyond normal Ratkin. If they push toward Stalkhaven in force, I fear we cannot hold.`,
                            options: [
                              {
                                text: `Someone needs to deal with them.`,
                                nextDialogue: {
                                  text: `Aye, but who? We can't spare soldiers for such a dangerous mission, and the refugees aren't fighters. If a brave soul were willing to venture into their lair... it might buy us the time we need.`,
                                  options: [
                                    {
                                      text: `Hopefully you find someone brave enough.`,
                                      dismiss: true,
                                      pureExit: true,
                                    },
                                  ]
                                }
                              },
                              {
                                text: `That sounds terrifying.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                        {
                          text: `Have you seen them yourself?`,
                          nextDialogue: {
                            text: `Once, from a distance. Their eyes burn like green flame, and the very air around them shimmers with corruption. I've seen many horrors since the fog came, but the Tainted... they chill my very spores.`,
                            options: [
                              {
                                text: `Stay safe out here.`,
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
                    text: `What can be done?`,
                    nextDialogue: {
                      text: `We need to disrupt their camps, eliminate their leaders, and buy time for reinforcements to arrive. But with our current forces... it's a tall order. Every day they grow bolder, every night they creep closer.`,
                      options: [
                        {
                          text: `Reinforcements are coming?`,
                          nextDialogue: {
                            text: `Messages have been sent to other settlements, but with the fog disrupting travel... who knows if help will arrive in time. We must assume we fight alone and prepare accordingly.`,
                            options: [
                              {
                                text: `You're doing all you can.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                      ]
                    }
                  },
                ]
              }
            },
            {
              text: `I'll leave you to your duties.`,
              nextDialogue: {
                text: `Travel carefully, friend. The forest is no longer safe for the unwary. If you encounter any Ratkin, don't underestimate them - the fog has made them far more dangerous than they ever were before.`,
                options: [
                  {
                    text: `Thank you for the warning.`,
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