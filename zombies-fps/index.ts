import { startServer, PlayerEvent } from 'hytopia';
import worldMap from './assets/maps/terrain.json';

import GameManager from './classes/GameManager';

startServer(world => {
  // Load map.
  world.loadMap(worldMap);

  // Setup lighting
  world.setAmbientLightIntensity(0.0001);
  world.setAmbientLightColor({ r: 255, g: 192, b: 192 });
  world.setDirectionalLightIntensity(0.0001);

  // Setup game
  GameManager.instance.setupGame(world);

  // Spawn a player entity when a player joins the game.
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    if (GameManager.instance.isStarted) {
      return world.chatManager.sendPlayerMessage(player, 'This round has already started, you will automatically join when the next round starts. While you wait, you can fly around as a spectator by using W, A, S, D.', 'FF0000');
    }

    GameManager.instance.spawnPlayerEntity(player);
  });

  // Despawn all player entities when a player leaves the game.
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });
});