import {
  startServer,
  Audio,
  DefaultPlayerEntity,
  Light,
  LightType,
  PlayerEvent,
} from 'hytopia';

import worldMap from './assets/map.json';

startServer(world => {
  world.loadMap(worldMap);

  world.setAmbientLightIntensity(0.2); // Reduce ambient light intensity
  world.setAmbientLightColor({ r: 218, g: 112, b: 214 }); // slightly purple
  world.setDirectionalLightIntensity(0); // turn diretional light (sun light) off

  // Create purple point lights
  const purpleLightPositions = [
    { x: 12, y: 5, z: -9 },
    { x: 10, y: 3, z: -10 },
    { x: 10, y: 3, z: -8 },
    { x: 12, y: 3, z: -8 },
    { x: 12, y: 3, z: -10 },
    { x: 11, y: 2, z: -7 },
    { x: 9, y: 2, z: -9 },
    { x: -10, y: 2, z: 20 },
    { x: -18, y: 3, z: -15 },
  ];

  purpleLightPositions.forEach(position => {
    (new Light({
      color: { r: 138, g: 43, b: 226 },
      intensity: 10,
      position,
    })).spawn(world);
  });

  // large ceiling spotlight
  (new Light({
    type: LightType.SPOTLIGHT,
    angle: Math.PI / 8,
    color: { r: 255, g: 255, b: 255 },
    intensity: 40,
    penumbra: 0.5,
    position: { x: 0, y: 15, z: 0 },
    trackedPosition: { x: 0, y: 0, z: 0 },
  })).spawn(world);
  

  // wall spotlight 1
  (new Light({
    type: LightType.SPOTLIGHT,
    angle: Math.PI / 8,
    color: { r: 255, g: 255, b: 255 },
    intensity: 40,
    penumbra: 0.5,
    position: { x: 13, y: 7, z: -20 },
    trackedPosition: { x: 13, y: 0, z: -15 },
  })).spawn(world);

  // wall spotlight 2
  (new Light({
    type: LightType.SPOTLIGHT,
    angle: Math.PI / 8,
    color: { r: 255, g: 255, b: 255 },
    intensity: 20,
    penumbra: 0.5,
    position: { x: 27, y: 3, z: -13 },
    trackedPosition: { x: 19, y: 0, z: -13 },
  })).spawn(world);

  // wall spotlight 3
  (new Light({
    type: LightType.SPOTLIGHT,
    angle: Math.PI / 8,
    color: { r: 255, g: 255, b: 255 },
    intensity: 20,
    penumbra: 0.5,
    position: { x: -7, y: 4, z: -20 },
    trackedPosition: { x: -7, y: 0, z: -11 },
  })).spawn(world);
  

  // Spawn a player entity when a player joins the game.
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });
  
    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });

    // Attach a subtle spotlight that follows the player
    (new Light({
      type: LightType.SPOTLIGHT,
      attachedToEntity: playerEntity,
      angle: Math.PI / 8,
      color: { r: 255, g: 200, b: 200 },
      intensity: 8,
      offset: { x: 0, y: 7, z: 0 },
      penumbra: 1,
      trackedEntity: playerEntity,
    })).spawn(world);
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
