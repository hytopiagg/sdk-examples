import {
  startServer,
  DefaultPlayerEntity,
  PlayerEvent,
} from 'hytopia';

import worldMap from './assets/maps/generator-base.json' with { type: 'json' } ;
import { WorldGenerator } from './src/generator';
import type { GeneratorConfig } from './src/generator';


startServer(async world => {
  world.loadMap(worldMap);

  const config: GeneratorConfig = {
    seed: Date.now(),
    worldSize: { x: 256, y: 192, z: 256 },
    urbanDensity: 0.45,
    decayLevel: 0.45,
    caveFrequency: 0.5,
    oreAbundance: 0.5,
    waterLevel: 58,
  };

  const generator = new WorldGenerator(config, worldMap.blockTypes);
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
