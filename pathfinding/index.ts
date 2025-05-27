import {
  startServer,
  DefaultPlayerEntity,
  Entity,
  PathfindingEntityController,
  PlayerEvent,
  Quaternion,
  RigidBodyType,
  ColliderShape,
} from 'hytopia';

import worldMap from './assets/map.json';

startServer(world => {
  world.loadMap(worldMap);

  // Spawn our zombie that will pathfind around the map
  const zombie = new Entity({
    controller: new PathfindingEntityController(),
    name: 'Zombie',
    modelUri: 'models/npcs/zombie.gltf',
    modelScale: 0.5,
    rigidBodyOptions: {
      enabledRotations: { x: false, y: true, z: false },
      ccdEnabled: true,
    },
  });

  const pathfindingController = zombie.controller as PathfindingEntityController;
  pathfindingController.idleLoopedAnimations = [ 'walk' ];
  pathfindingController.moveLoopedAnimations = [ 'run' ];

  // Spawn somewhere in front of the player
  zombie.spawn(world, { x: 4, y: 3, z: -6 }, Quaternion.fromEuler(0, 180, 0)); // rotate 180 degrees around Y, facing the player spawn point.

  // Enter /pathfind to make the zombie pathfind to the player
  let pathfindMarkers: Entity[] = [];
  world.chatManager.registerCommand('/pathfind', (player, args) => {
    // Get the entity of the palyer that entered the command
    const playerEntities = world.entityManager.getPlayerEntitiesByPlayer(player);
    const playerEntity = playerEntities[0];
    const playerPosition = playerEntity.position;

    // Remove all existing pathfind markers, which we use in the example just to visualize the path taken.
    pathfindMarkers.forEach(marker => marker.despawn());
    pathfindMarkers = [];
    
    // Pathfind the zombie to the player
    const pathfindingController = zombie.controller as PathfindingEntityController;

    // .pathfind() is synchronous and returns immediately soon as a path is found or not, but before the entity has reached the target.
    const succeeded = pathfindingController.pathfind(playerPosition, 3, { // all possible options for example
      debug: true, // Setting true will console log pathfinding result info
      maxFall: 5, // The maximum fall distance (in blocks) the entity can fall when considering a path.
      maxJump: 2,  // The maximum height (in blocks) the entity will jump when considering a path, the controller will apply the jumps automatically while pathfinding.
      maxOpenSetIterations: 400, // A performance optimization value. A lower value will make pathfinding faster but may fail for longer paths, a higher value can make pathfinding take longer but will work better for longer paths.
      verticalPenalty: -1, // A behavior control. The more negative the value, the more the entity will prefer taking a route that requires jumping and falling, even going out of its way to do so. A more positive value will prefer avoiding jumps and falls unless absolutely necessary.
      pathfindAbortCallback: () => { // Invoked when maxOpenSetIterations is reached and pathfinding aborts.
        console.log('Pathfinding aborted');
      },
      pathfindCompleteCallback: () => { // Invoked when the entity associated with the PathfindingEntityController finishes pathfinding and is now at the target coordinate.
        console.log('Pathfinding complete');
      },
      waypointMoveCompleteCallback: () => { // Invoked when the entity associated with the PathfindingEntityController finishes moving to a calculate waypoint of its current path.
        console.log('Waypoint reached');
      },
      waypointMoveSkippedCallback: () => { // Invoked when the entity associated with the PathfindingEntityController skips a waypoint because it exceeded the waypointTimeoutMs.
        console.log('Waypoint skipped');
      },
      waypointTimeoutMs: 2000, // The timeout in milliseconds for a waypoint to be considered reached. Defaults to 2000ms divided by the speed of the entity.
    });

    // .pathfind() will return true if the algorithm found a path and began traversing it.
    console.log(`Path found successfully?: ${succeeded}`);

    // Spawn visual markers for the path
    pathfindingController.waypoints.forEach(waypoint => {
      const pathfindMarker = new Entity({
        modelUri: 'models/items/cookie.gltf',
        rigidBodyOptions: {
          type: RigidBodyType.FIXED,
          colliders: [
            {
              shape: ColliderShape.BLOCK,
              halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
              isSensor: true,
            },
          ],
        },
      });
  
      pathfindMarker.spawn(world, waypoint);
      
      pathfindMarkers.push(pathfindMarker);
    });
  });

  // Spawn a player entity when a player joins the game.
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });

    world.chatManager.sendPlayerMessage(player, 'To make the zombie pathfind to you, enter: /pathfind', '00FF00');

    playerEntity.spawn(world, { x: 4, y: 3, z: 1 });
  });

  // Despawn all player entities when a player leaves the game.
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });
});
