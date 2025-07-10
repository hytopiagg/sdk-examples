import BaseEntity, { BaseEntityOptions } from '../../../entities/BaseEntity';

export default class HerderBorisEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/herder.gltf',
      modelScale: 0.75,
      name: 'Herder Boris',
      dialogue: {
        avatarImageUri: 'avatars/herder.png',
        title: 'Herder',
        dialogue: {
          text: `Bah! Another wanderer stumbling through my grazing lands... I'm Boris, and I've been herding woolran in these Hearthwilds for twenty years. What d'you want? And what're you doing out here anyway? This cursed fog's driven away most of my business, but the woolran don't seem to mind it much. Lucky for them, I suppose.`,
          options: [
            {
              text: `Why are you still out here with this fog around?`,
              nextDialogue: {
                text: `Why? BAH! Where else would I go? This fog just makes my eyes water and gives me a cough, but I can't abandon my flock. These woolran depend on me, and I've raised some of them since they were babies. Besides, adventurers like you still wander through from time to time, so business is slow but not dead. Just... less profitable than it used to be.`,
                options: [
                  {
                    text: `That's dedication to your animals.`,
                    dismiss: true,
                    pureExit: true,
                  },
                ]
              }
            },
            {
              text: `What exactly are woolran?`,
              nextDialogue: {
                text: `What are woolran? Hah! Never heard of 'em, have you? They're the best way to get around the Hearthwilds and all the surrounding regions, that's what! Sturdy as mountain goats, fast as the wind, and smart enough to outrun those Gorkin hunting packs. Plus they're loyal companions once they trust you. Been my livelihood for decades - finest woolran stock in all the Eastern Frontier, or was before this blasted fog started scaring off my customers.`,
                options: [
                  {
                    text: `They sound impressive.`,
                    dismiss: true,
                    pureExit: true,
                  },
                ]
              }
            },
            {
              text: `Can I buy or borrow a woolran from you?`,
              nextDialogue: {
                text: `Buy? Borrow? BAH! You think I just hand out my woolran to any fool who wanders by? I don't sell my animals to just anyone, and I certainly don't lend them out like farming tools! These woolran are my life's work, bred and trained proper. You want one? Tough luck! Come back when you've proven you're not some bumbling adventurer who'll get my precious woolran killed in a Gorkin ambush.`,
                options: [
                  {
                    text: `I understand your caution.`,
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