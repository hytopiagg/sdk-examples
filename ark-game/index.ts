import {
  startServer,
  DefaultPlayerEntity,
  PlayerEvent,
} from 'hytopia';

import worldMap from './assets/maps/generator-base.json' with { type: 'json' };
import { WorldGenerator } from './src/generator';

startServer(async world => {
  world.loadMap(worldMap);

  // Create procedural world generator
  const generator = new WorldGenerator({
    seed: Date.now(),
    worldSize: { x: 384, y: 128, z: 384 },
  });
  
  const result = generator.generate();

  world.chunkLattice.initializeBlocks(result.blocks);

  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });

    playerEntity.spawn(world, result.spawnPoint);
  });

  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });
});
