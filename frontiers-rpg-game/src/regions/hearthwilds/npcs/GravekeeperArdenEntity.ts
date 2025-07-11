import BaseEntity, { BaseEntityOptions } from '../../../entities/BaseEntity';

export default class GravekeeperArdenEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/gravekeeper.gltf',
      modelScale: 0.75,
      name: 'Gravekeeper Arden',
      dialogue: {
        avatarImageUri: 'avatars/gravekeeper.png',
        title: 'Hearthwilds Gravetender',
        dialogue: {
          text: `Ah... another wanderer. Tell me, stranger... do you know what this fog is? It's been whispering to me for weeks now, making me feel... more off than usual. And I was already plenty off to begin with, mind you. The dead don't seem to mind it much, but then again, they don't mind much of anything anymore...`,
          options: [
            {
              text: `What are you doing out here in the Hearthwilds?`,
              nextDialogue: {
                text: `I'm the gravekeeper here, been tending these graves for... oh, fifteen years now? Maybe twenty? Time gets muddy when you spend your days with the dead. Can't leave my post, you see. Duty is duty, fog or no fog. These souls have been resting here for over a thousand years - someone needs to keep the weeds from their bones and the creatures from disturbing their eternal sleep. The fog may have driven everyone else away, but the dead... they're excellent company. Very quiet. Never complain about my cooking.`,
                options: [
                  {
                    text: `That's... admirable dedication.`,
                    dismiss: true,
                    pureExit: true,
                  },
                ]
              }
            },
            {
              text: `What graves are these exactly?`,
              nextDialogue: {
                text: `Ah, now that's a story worth telling! These are the resting places of the most noble souls - Capfolk and human warriors who fought side by side in the ancient days. Over a thousand years ago, when the Eastern Frontier was young and the world was... different. Legend says these brave souls brought peace to the land after some great calamity. The Capfolk call it the Withering Age in their old chronicles. When all seemed lost, these warriors united the peoples and drove back the darkness. Sometimes, I swear I can hear their voices... sharing stories around phantom campfires. They seem... restless lately..`,
                options: [
                  {
                    text: `That's fascinating... and unsettling.`,
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