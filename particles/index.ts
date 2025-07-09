import {
  startServer,
  Entity,
  DefaultPlayerEntity,
  ParticleEmitter,
  PlayerEvent,
  Quaternion,
} from 'hytopia';

import worldMap from './assets/map.json';

startServer(world => {
  world.loadMap(worldMap);

  // Spawn a player entity when a player joins the game.
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });
  
    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });

    attachPlayerParticles(playerEntity);
  });

  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });

  // Setup particle emitters around the map

  // Dirt spewing particle emitter
  const dirtParticleEmitter = new ParticleEmitter({
    textureUri: 'particles/dirt.png',
    colorStart: { r: 194, g: 164, b: 132 },
    size: 1, 
    sizeVariance: 1, // Variates the base size +/- this value
    lifetime: 5, // How long the particles live for in seconds
    lifetimeVariance: 3, // Variates the base lifetime +/- this value
    position: { x: 0, y: 1, z: 0 }, // Position of the emitter
    rate: 20, // How many particles to emit per second

    velocity: { x: 0, y: 5, z: 0}, // Velocity of the particles
    velocityVariance: { x: 4, y: 2, z: 4 }, // Variates the base velocity +/- this value
  });
  dirtParticleEmitter.spawn(world);

  // Start/stop the emitter every 3 seconds 
  setInterval(() => {
    if (dirtParticleEmitter.isStopped) {
      dirtParticleEmitter.restart();
    } else {
      dirtParticleEmitter.stop();
    }
  }, 5000);


  // Falling sparkles emitter
  const fallingSparklesEmitter = new ParticleEmitter({
    textureUri: 'particles/star-2.png',
    colorStart: { r: 255, g: 255, b: 255 }, // White base color
    colorStartVariance: { r: 255, g: 255, b: 255 }, // rgb varies +/- 255
    colorEnd: { r: 255, g: 255, b: 255 }, // White base color
    colorEndVariance: { r: 255, g: 255, b: 255 }, // rgb varies +/- 255
    gravity: { x: 0, y: -3, z: 0 }, // Gravity of the particles, pull them down at a rate of 3 blocks per second
    size: 1, // Base size of the particles
    sizeVariance: 2, // Variates the base size +/- this value
    lifetime: 5, // How long the particles live for in seconds
    lifetimeVariance: 3, // Variates the base lifetime +/- this value
    rate: 50, // How many particles to emit per second

    position: { x: 17, y: 10, z: 0 }, // Position of the emitter
    velocityVariance: { x: 3, y: 3, z: 3 }, // Variates the base velocity +/- this value
  });
  fallingSparklesEmitter.spawn(world);

  // Swap the texture every 3 seconds
  setInterval(() => {
    if (fallingSparklesEmitter.textureUri === 'particles/star-2.png') {
      fallingSparklesEmitter.setTextureUri('particles/star.png');
    } else {
      fallingSparklesEmitter.setTextureUri('particles/star-2.png');
    }
  }, 2000);

  // Smoke emitter
  const smokeEmitter = new ParticleEmitter({
    textureUri: 'particles/smoke.png',
    colorStart: { r: 220, g: 220, b: 220 }, // White-ish color
    opacityStart: 0.7, // Starting opacity of the particles
    opacityStartVariance: 0.5, // Variates the base opacity +/- this value
    opacityEnd: 0, // Ending opacity of the particles
    size: 3, // Base size of the particles
    sizeVariance: 1.5, // Variates the base size +/- this value
    lifetime: 10, // How long the particles live for in seconds
    lifetimeVariance: 5, // Variates the base lifetime +/- this value
    rate: 40, // How many particles to emit per second
    position: { x: -13, y: 1, z: 12 }, // World position of the emitter
    velocity: { x: 0, y: 2, z: 0 }, // Velocity of the particles
    velocityVariance: { x: 0.5, y: 1, z: 0.5 }, // Variates the base velocity +/- this value
  });
  smokeEmitter.spawn(world);
});

function attachPlayerParticles(playerEntity: DefaultPlayerEntity) {
  if (!playerEntity.world) {
    return console.log('Player entity must be spawned to attach particles.');
  }
  
  // Bubble emitter effect from players
  const particleEmitter = new ParticleEmitter({
    attachedToEntity: playerEntity, // Attached to an entity instead of a position, in this case the player entity
    attachedToEntityNodeName: 'hand-right-anchor', // Optional, Emit from the right hand named model node of the player entity, this is an explicit name of a gltf node in the model.
    textureUri: 'particles/circle-blur.png',
    colorStart: { r: 128, g: 128, b: 255 }, // Blue base color
    gravity: { x: 0, y: -1, z: 0 }, // Gravity of the particles, pull them down at a rate of 1 block per second
    opacityStartVariance: 0.5, // Variates the base opacity +/- this value
    velocity: { x: 0, y: 1, z: 0 }, // Velocity of the particles
    velocityVariance: { x: 1, y: 0.5, z: 1 }, // Variates the base velocity +/- this value
    size: 0.1, // Base size of the particles
    sizeVariance: 0.25, // Variates the base size +/- this value
    lifetime: 4, // How long the particles live for in seconds
    rate: 10, // How many particles to emit per second
    maxParticles: 30, // Maximum number of visible particles at any given time
  });

  particleEmitter.spawn(playerEntity.world);
}