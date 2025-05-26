import {
  startServer,
  DefaultPlayerEntity,
  PlayerEvent,
} from 'hytopia';

import worldMap from './assets/map.json';

/**
 * This example loads and simulates extremely large map that is
 * 750^2 blocks in area. Approximately 2,000,000+ blocks are loaded,
 * resulting in thousands of chunks and a large amount of physics vertices.
 * 
 * This example is meant to showcase the performance of the server.
 * When dealing with large fully simulated worlds, as well as benchmark
 * and test client performance.
 * 
 * Client load times may take a few seconds because batch
 * loading is not yet implemented.
 */

startServer(world => {
  world.loadMap(worldMap);

  // Spawn a player entity when a player joins the game.
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });
  
    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });
  });

  // Despawn all player entities when a player leaves the game.
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });
});