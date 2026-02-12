import {
  startServer,
  PlayerCameraMode,
  DefaultPlayerEntity,
  PlayerEvent,
} from 'hytopia';

import worldMap from './assets/maps/generator-base.json' with { type: 'json' };
import { WorldGenerator } from './src/generator';

const WORLD_SIZE = 512;
const WORLD_HEIGHT = 128;

startServer(async (world) => {
  world.loadMap(worldMap);

  const generator = new WorldGenerator({
    seed: Date.now(),
    worldSize: { x: WORLD_SIZE, y: WORLD_HEIGHT, z: WORLD_SIZE },
  });

  const result = generator.generate();
  world.chunkLattice.initializeBlocks(result.blocks);

  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });

    playerEntity.spawn(world, result.spawnPoint);

    player.camera.setMode(PlayerCameraMode.FIRST_PERSON);
    player.camera.setAttachedToEntity(playerEntity);
    player.camera.setViewModel('models/players/player-fp.gltf');
    player.camera.setViewModelPitchesWithCamera(true);
    player.camera.setViewModelYawsWithCamera(true);
    player.camera.setOffset({ x: 0, y: 0.5, z: -0.1 });
  });

  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach((entity) => entity.despawn());
  });
});
