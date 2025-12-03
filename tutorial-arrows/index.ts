import {
  startServer,
  Audio,
  DefaultPlayerEntity,
  Entity,
  Player,
  PlayerEvent,
} from 'hytopia';

import worldMap from './assets/map.json' with { type: 'json' } ;

// Simple map for player -> singular controlled entity
const playerEntityMap = new Map<Player, DefaultPlayerEntity>();

startServer(world => {
  world.loadMap(worldMap);

  const tutorialTargetEntity = new Entity({
    name: 'tutorial-target', // our arrow logic in our ui/index.html will reference our target by name.
    modelUri: 'models/portal.gltf',
  })
  
  tutorialTargetEntity.spawn(world, { x: 8, y: 6, z: 8 });

  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    // Load the UI for the player.
    // Tutorial arrows are handled client side and unique per player.
    player.ui.load('ui/index.html');

    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });

    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });

    // Set the player entity on our map for when
    // we do player list updates.
    playerEntityMap.set(player, playerEntity);
  });

  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
    // Remove the player entity from our map for our list.
    playerEntityMap.delete(player);
  });

  new Audio({
    uri: 'audio/music/hytopia-main.mp3',
    loop: true,
    volume: 0.2,
  }).play(world);
});