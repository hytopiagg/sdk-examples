import {
  startServer,
  ColliderShape,
  DefaultPlayerEntity,
  PlayerEvent,
  Entity,
  EntityEvent,
  RigidBodyType,
  GameServer,
  SimpleEntityController,
} from 'hytopia';

import worldMap from './assets/map.json';

startServer(world => {
  // Boilerplate
  
  // Uncomment this to visualize physics vertices, will cause noticable lag.
  // world.simulation.enableDebugRendering(true);
  
  world.loadMap(worldMap);
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });
  
    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });
  });

  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });

  /**
   * Spawn a block entity as a moving platform
   */
  const blockPlatform = new Entity({
    blockTextureUri: 'blocks/grass', // A texture URI without a file extension will use a folder and look for the textures for each face in the folder (-x.png, +x.png, -y.png, +y.png, -z.png, +z.png)
    blockHalfExtents: { x: 1, y: 0.5, z: 1 },
    rigidBodyOptions: {
      type: RigidBodyType.KINEMATIC_VELOCITY, // Kinematic means platform won't be effected by external physics, including gravity
      linearVelocity: { x: 0, y: 0, z: 3 }, // A starting velocity that won't change until we change it, because it's kinematic
    },
  });

  // Clamp the z range the platform moves back and forth between
  blockPlatform.on(EntityEvent.TICK, () => { 
    const position = blockPlatform.position;

    if (position.z < -9) {
      blockPlatform.setLinearVelocity({ x: 0, y: 0, z: 3 });
    }

    if (position.z > 8) {
      blockPlatform.setLinearVelocity({ x: 0, y: 0, z: -3 });
    }
  });

  blockPlatform.spawn(world, { x: 3, y: 3, z: -7 });

  /**
   * Spawn a 2x2x2 block entity that spins in the air
   */
  const spinningBlock = new Entity({
    blockTextureUri: 'blocks/stone-bricks.png',
    blockHalfExtents: { x: 1, y: 1, z: 1 }, // half extents at the target size / 2.
    rigidBodyOptions: {
      type: RigidBodyType.KINEMATIC_VELOCITY,
      angularVelocity: { x: 1, y: 1, z: 1 },
    },
  });

  spinningBlock.spawn(world, { x: 0, y: 10, z: -6 });

  /**
   * Spawn a block entity that interacts with physics and can be pushed by players
   */
  const movableBlock = new Entity({ // Entity is dynamic by default, meaning it will interact with external forces, including gravity
    blockTextureUri: 'blocks/sand.png',

    // A block of 1x1x1 would be half extents of 0.5x0.5x0.5, 
    // if you do not explicitly create rigidBodyOptions.colliders 
    // for the block, a collider will be created automatically 
    // based on the block half extends.
    blockHalfExtents: { x: 0.5, y: 0.5, z: 0.5 }, 
  });

  movableBlock.on(EntityEvent.ENTITY_COLLISION, ({ started }) => {
    if (started) {
      world.chatManager.sendBroadcastMessage('The sand block was pushed!');
    }
  });

  movableBlock.spawn(world, { x: -4, y: 10, z: -6 });

  /**
   * Spawn a very heavy block that interacts with physics, and is much harder to move,
   * Also, prevent it from rotating.
   */
  const heavyBlock = new Entity({
    blockTextureUri: 'blocks/stone-bricks.png',
    blockHalfExtents: { x: 0.5, y: 0.5, z: 0.5 },
    rigidBodyOptions: {
      type: RigidBodyType.DYNAMIC,
      additionalMass: 10,
      enabledRotations: { x: false, y: false, z: false },
    },
  });

  heavyBlock.spawn(world, { x: -4, y: 10, z: -1 });

  /**
   * Spawn a bouncing block, because why not?
   * Also disable rotations so it doesn't spin around like a maniac
   */
  const bouncingBlock = new Entity({
    blockTextureUri: 'blocks/ice.png',
    blockHalfExtents: { x: 0.5, y: 0.5, z: 0.5 },
    rigidBodyOptions: {
      type: RigidBodyType.DYNAMIC,
      enabledRotations: { x: false, y: false, z: false },
      colliders: [
        {
          shape: ColliderShape.BLOCK,
          halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
          bounciness: 2,
        },
      ],
    },
  });

  bouncingBlock.spawn(world, { x: 0, y: 10, z: -3 });

  /**
   * Make a block pet that follows a player around
   * Because, again why not?
   */
  const blockPet = new Entity({
    blockTextureUri: 'blocks/bricks.png',
    blockHalfExtents: { x: 0.5, y: 0.5, z: 0.5 },
    // attach a simple entity controller so we can pathfind,
    // the entity controller will be created and associated when we spawn the entity
    controller: new SimpleEntityController(), 
  });

  blockPet.spawn(world, { x: 0, y: 10, z: -6 });

  // Simple pathfinding
  let pathfindAccumulator = 0;
  blockPet.on(EntityEvent.TICK, ({ tickDeltaMs }) => {
    pathfindAccumulator += tickDeltaMs;

    if (pathfindAccumulator > 3000) { // only pathfind every 3 seconds so we don't do unecessary pathfinding
      pathfindAccumulator = 0;

      const connectedPlayers = GameServer.instance.playerManager.getConnectedPlayers();
      if (!connectedPlayers.length) { return; } // if no players, don't pathfind.

      // pick a random player to follow
      const targetPlayer = connectedPlayers[Math.floor(Math.random() * connectedPlayers.length)];

      // get the player's entity
      const targetPlayerEntity = world.entityManager.getPlayerEntitiesByPlayer(targetPlayer)[0];

      if (!targetPlayerEntity) { return; } // if the player doesn't have an entity, don't pathfind.

      // pathfind to the player's entity
      const blockPetEntityController = blockPet.controller as SimpleEntityController;
      const targetPosition = targetPlayerEntity.position;
      blockPetEntityController.move(targetPosition, 3);
      blockPetEntityController.face(targetPosition, 1);
    }
  });
});
