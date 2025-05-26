import {
  startServer,
  PlayerEvent,
} from 'hytopia';

import GameManager from './classes/GameManager';

import worldMap from './assets/map.json';

startServer(world => {
  // Load the game map
  world.loadMap(worldMap);

  // Set lighting
  world.setAmbientLightIntensity(0.8);
  world.setDirectionalLightIntensity(5);

  GameManager.instance.setupGame(world);

  // Handle player joining the game
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    GameManager.instance.spawnPlayerEntity(player);
    GameManager.instance.playerCount++;
  });

  // Handle player leaving the game
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    // Clean up player entities
    world.entityManager
      .getPlayerEntitiesByPlayer(player)
      .forEach(entity => entity.despawn());

    GameManager.instance.playerCount--;
  });
});


/*
- raycasts from weapons need to ignore other items
- Fix players stuck in placed blocks
*/