import {
  startServer,
  Audio,
  DefaultPlayerEntity,
  PlayerEvent,
} from 'hytopia';

import worldMap from './assets/map.json';

const sfxFiles = [
  'audio/sfx/hit-metal-hard-anvil.mp3',
  'audio/sfx/hit-metal-thin.mp3',
  'audio/sfx/hit-wood.mp3',
  'audio/sfx/hit-woodbreak.mp3',
  'audio/sfx/hit.mp3',
  'audio/sfx/fall-small.mp3',
  'audio/sfx/glass-break-01.mp3',
  'audio/sfx/glass-break-02.mp3',
  'audio/sfx/glass-break-03.mp3',
  'audio/sfx/hit-metal-1.mp3',
  'audio/sfx/hit-metal-2.mp3',
  'audio/sfx/explode.mp3',
  'audio/sfx/fall-big.mp3',
];


startServer(world => {
  world.loadMap(worldMap);

  // Spawn a player entity when a player joins the game.
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });
  
    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });

    setInterval(() => {
      // const position = {
      //   x: Math.random() * 60 - 30, // Random value between -30 and 30
      //   y: Math.random() * 20, // Random value between 0 and 20
      //   z: Math.random() * 60 - 30, // Random value between -30 and 30
      // };
  
      const audioSfx = new Audio({
        attachedToEntity: playerEntity,
        uri: sfxFiles[Math.floor(Math.random() * sfxFiles.length)],
        cutoffDistance: 30,
        volume: 0.75,
        // position: position,
      });
  
      audioSfx.play(world);
    }, 25);
  });

  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });
});