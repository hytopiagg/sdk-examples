import {
  startServer,
  DefaultPlayerEntity,
  PlayerEvent,
} from 'hytopia';

import MyEntityController from './MyEntityController';

import worldMap from './assets/map.json';

startServer(world => {
  // Uncomment this to visualize physics vertices, will cause noticable lag.
  // world.simulation.enableDebugRendering(true);
  
  // Visualize raycasts, like block breaking for our
  // entity controller.
  world.simulation.enableDebugRaycasting(true);

  world.loadMap(worldMap);

  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
      controller: new MyEntityController(), // attach our entity controller
    });

    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });
    console.log('Spawned player entity!');

  });
  
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });
});
