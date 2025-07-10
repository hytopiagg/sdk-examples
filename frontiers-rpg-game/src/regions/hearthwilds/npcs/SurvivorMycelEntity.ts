import BaseEntity, { BaseEntityOptions } from '../../../entities/BaseEntity';

export default class SurvivorMycelEntity extends BaseEntity {
  public constructor(options?: BaseEntityOptions) {
    super({
      idleAnimations: [ 'idle' ],
      modelUri: 'models/npcs/mushroom-boy.gltf',
      modelScale: 0.65,
      moveSpeed: 3,
      name: 'Survivor Mycel',
      dialogue: {
        avatarImageUri: 'avatars/capfolk-villager.png',
        title: 'Sporewick Refugee',
        dialogue: {
          text: `By the ancient spores! Another soul wandering these cursed lands... I'm Mycel, fled from Sporewick when that damned fog consumed everything. Been trying to reach Stalkhaven for days now, but these Hearthwilds... they're more dangerous than I ever imagined with the lingering fog.`,
          options: [
            {
              text: `What are you doing out here alone?`,
              nextDialogue: {
                text: `Alone? Ha! Not by choice, friend. When the fog hit Sporewick, I was in the outer mushroom groves gathering healing spores. Heard the screaming, saw that sickly green mist rolling in... barely escaped with my life. Been wandering these flatlands ever since, trying to avoid the Gorkin hunting parties while making my way to Stalkhaven. Lost my travel pack to those brutes two nights ago.`,
                options: [
                  {
                    text: `You're brave to keep going.`,
                    dismiss: true,
                    pureExit: true,
                  },
                ]
              }
            },
            {
              text: `Tell me about this place - the Hearthwilds.`,
              nextDialogue: {
                text: `Aye, the Hearthwilds - vast flatlands that stretch between Sporewick, Stalkhaven and the Outer Mountains. Before the fog, it was peaceful enough if you knew the safe paths. But the Gorkin... they've always been here, tribal hunters with minds sharp as their spears. They're not corrupted by the fog - they're just naturally vicious. Intelligent too, which makes them twice as dangerous. They hunt in packs, use the tall grass for cover, and they don't take kindly to travelers crossing their territory.`,
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
              text: `How do I get to Sporewick from here?`,
              nextDialogue: {
                text: `Sporewick? Friend, there's nothing left of my home but fog and corruption. But if you're fool enough to try... with this cursed mist everywhere, I can't tell directions proper anymore. The fog plays tricks on your mind, makes the sun look wrong. Your best bet is to follow the old trading path.. Just... promise me you won't go alone. That fog changes everything it touches.`,
                options: [
                  {
                    text: `I'll be careful if I go.`,
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