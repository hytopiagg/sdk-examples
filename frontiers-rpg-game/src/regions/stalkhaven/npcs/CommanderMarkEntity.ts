import BaseEntity, { BaseEntityOptions } from '../../../entities/BaseEntity';

export default class CommanderMarkEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/knight-commander.gltf',
      modelScale: 0.75,
      name: 'Commander Mark',
      dialogue: {
        avatarImageUri: 'avatars/commander.png',
        title: '7th Regiment Commander',
        dialogue: {
          text: `Welcome to Stalkhaven, adventurer. I'm Commander Mark of the 7th Regiment. This might be the last free settlement in The Frontier - the fog has claimed everything else. You've come at a dark time, but we need brave souls like you.`,
          options: [
            {
              text: `Tell me about Stalkhaven.`,
              nextDialogue: {
                text: `Once The Frontier's greatest trading hub, now a refuge for survivors. Our port brought goods from distant lands, but we're barely holding the line against the fog.`,
                options: [
                  {
                    text: `What happened to other settlements?`,
                    nextDialogue: {
                      text: `Swallowed by fog, one by one. We've received refugees from a dozen settlements, but most places... nothing left but monsters and mist.`,
                      options: [
                        {
                          text: `Are there other survivors out there?`,
                          nextDialogue: {
                            text: `Captain Sporn led Capfolk refugees here last week. If they made it, others might still be alive, hiding in the fog.`,
                            options: [
                              {
                                text: `I'll search for more survivors.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                        {
                          text: `How has Stalkhaven survived?`,
                          nextDialogue: {
                            text: `Strong walls, good people, determination. We've fortified every entrance, but honestly? We're just lucky the fog hasn't fully reached us yet.`,
                            options: [
                              {
                                text: `I'll help defend this place.`,
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
                    text: `What about the port?`,
                    nextDialogue: {
                      text: `Eastern port is sealed tight. Sea monsters attacked days ago - creatures twisted by that same fog. No ships in or out until it's safe.`,
                      options: [
                        {
                          text: `I could help clear the port.`,
                          nextDialogue: {
                            text: `Brave offer, but those waters are treacherous. Speak with the harbor master first - we can't lose more good people to those depths.`,
                            options: [
                              {
                                text: `I'll investigate the harbor first.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                        {
                          text: `What kind of sea monsters?`,
                          nextDialogue: {
                            text: `Massive tentacled beasts with glowing eyes. They pulled two merchant vessels under before we could react. Something vast moves beneath the waves.`,
                            options: [
                              {
                                text: `The fog is affecting the seas too...`,
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
                    text: `Where can I settle here?`,
                    nextDialogue: {
                      text: `Planning to stay? Good. Head west to the farmlands - old farmer by the gate wants to sell his plot. Humble land, but it's yours to build on.`,
                      options: [
                        {
                          text: `How much is he asking?`,
                          nextDialogue: {
                            text: `Fair price. He wants someone who'll make good use of it. A working farm could help feed our growing refugee population.`,
                            options: [
                              {
                                text: `I'll speak with him about the land.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                        {
                          text: `Is the farmland safe?`,
                          nextDialogue: {
                            text: `Safer than most places. Fog hasn't reached western fields yet, and we patrol regularly. Best place to make a stand in The Frontier.`,
                            options: [
                              {
                                text: `I'll consider it.`,
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
              text: `What threats are we facing?`,
              nextDialogue: {
                text: `The fog spawns countless horrors. Chitter Forest is overrun with Ratkin - they were peaceful traders, now vicious killers under some "Whisker King."`,
                options: [
                  {
                    text: `What changed the Ratkin?`,
                    nextDialogue: {
                      text: `Nobody knows. They were our allies for generations - peaceful merchants. Now they attack on sight, organized under this Whisker King.`,
                      options: [
                        {
                          text: `I'll confront this Whisker King.`,
                          nextDialogue: {
                            text: `You'll need more than courage. Talk to Captain Sporn at the south gate first - he knows their movements. Get properly armed.`,
                            options: [
                              {
                                text: `I'll prepare thoroughly.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                        {
                          text: `Can they be saved?`,
                          nextDialogue: {
                            text: `That's what keeps me awake. If the fog's influence can be broken, maybe they can return. But we need to find the fog's source first.`,
                            options: [
                              {
                                text: `Finding the source is crucial then.`,
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
                    text: `Where does the fog come from?`,
                    nextDialogue: {
                      text: `Million-gold question. Appeared two months ago, spreading ever since. Thickest to the northeast, but none who venture deep return.`,
                      options: [
                        {
                          text: `I'll investigate the source.`,
                          nextDialogue: {
                            text: `Many tried, few return. Those who do come back... changed. Gather allies first - this isn't a solo mission.`,
                            options: [
                              {
                                text: `I'll find others to help.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                        {
                          text: `Any scouts survive to report back?`,
                          nextDialogue: {
                            text: `A handful. They speak of impossible things - shifting landscapes, creatures that shouldn't exist. The fog isn't just weather - it's alive.`,
                            options: [
                              {
                                text: `Alive? What do you mean?`,
                                nextDialogue: {
                                  text: `It moves with purpose, responds to threats. Some say it whispers, tries to turn you against companions. Whatever's at its center is intelligent.`,
                                  options: [
                                    {
                                      text: `We have to stop it.`,
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
                    text: `Other dangers besides the fog?`,
                    nextDialogue: {
                      text: `Fog corrupts everything it touches. Normal wolves become shadowbeasts, peaceful Ratkin turn savage. Every day brings new horrors.`,
                      options: [
                        {
                          text: `How do we fight that?`,
                          nextDialogue: {
                            text: `Steel, courage, unity. The fog preys on isolation and fear. Stay together, stay vigilant, never venture into heavy fog alone.`,
                            options: [
                              {
                                text: `I'll remember that.`,
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
              text: `I'm new here. What should I know?`,
              nextDialogue: {
                text: `Stalkhaven operates on mutual aid - everyone contributes. Visit our merchants for supplies, check with gate guards about threats.`,
                options: [
                  {
                    text: `Where should I start?`,
                    nextDialogue: {
                      text: `Get equipped first - Merchant Finn has quality gear. Talk to gate guards about threats. Capfolk refugees have intel about beyond our walls.`,
                      options: [
                        {
                          text: `Any specific tasks you need help with?`,
                          nextDialogue: {
                            text: `Always need scouts, monster hunters, anyone brave enough to venture into fog. Prove yourself with smaller missions first.`,
                            options: [
                              {
                                text: `I'll build my reputation.`,
                                dismiss: true,
                                pureExit: true,
                              },
                            ]
                          }
                        },
                        {
                          text: `Tell me about the Capfolk refugees.`,
                          nextDialogue: {
                            text: `Brave folk led here by Captain Sporn after their village fell. They provide valuable intelligence and many are skilled crafters.`,
                            options: [
                              {
                                text: `I should speak with them.`,
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
                    text: `What makes Stalkhaven special?`,
                    nextDialogue: {
                      text: `Before the fog, we were The Frontier's greatest trading hub. That spirit of cooperation keeps us alive now.`,
                      options: [
                        {
                          text: `Will trade return to normal?`,
                          nextDialogue: {
                            text: `Once we deal with the fog, absolutely. We'll rebuild bigger and stronger. We have to believe that.`,
                            options: [
                              {
                                text: `I'll help make that future possible.`,
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
              text: `I need to go. Stay safe, Commander.`,
              nextDialogue: {
                text: `And you as well. Remember - in The Frontier, we're stronger together. Don't face the fog alone, always have an escape route.`,
                options: [
                  {
                    text: `Thank you for the guidance.`,
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