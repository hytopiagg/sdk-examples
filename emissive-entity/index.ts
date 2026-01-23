import {
  startServer,
  Audio,
  DefaultPlayerEntity,
  Entity,
  PlayerEvent,
} from 'hytopia';

import worldMap from './assets/map.json' with { type: 'json' } ;

startServer(world => {
  world.loadMap(worldMap);

  // Spawn a glowing spider
  const spider = new Entity({
    modelUri: 'models/npcs/spider.gltf',
    modelScale: 3,
    emissiveColor: { r: 255, g: 255, b: 0 }, // yellow color
    emissiveIntensity: 2, // higher intensity for more intense/bright color.
  });

  spider.spawn(world, { x: 0, y: 10, z: -10 });

  // Spawn a player entity when a player joins the game.
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });
    
    // Give palyers a bright green head.
    playerEntity.setModelNodeEmissiveColor('head', { r: 0, g: 255, b: 0 });
    playerEntity.setModelNodeEmissiveIntensity('head', 10);

    setTimeout(() => { // unset emissive color after 5 seconds
      playerEntity.setModelNodeEmissiveColor('head', undefined);
      playerEntity.setModelNodeEmissiveIntensity('head', undefined);

      //playerEntity.setModelNodeOverride({ name: 'head' }); // alternatively, set a node override with a target name but no options to disable node overrides - like emissive.
    }, 5000);

    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });
  });

  // Despawn all player entities when a player leaves the game.
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });

  // Play some music on game start
  (new Audio({
    uri: 'audio/music/cave-theme.mp3',
    loop: true,
  })).play(world);
});
