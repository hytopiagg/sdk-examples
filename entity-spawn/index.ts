import {
  startServer,
  BlockType,
  Collider,
  ColliderShape,
  DefaultPlayerEntity,
  Entity,
  EntityEvent,
  PlayerEvent,
  RigidBodyType,
  World,
} from 'hytopia';

import worldMap from './assets/map.json';

startServer(world => {
  // Boilerplate setup for our example, ignore this.
  setup(world);

  // Spawn a giant spider.
  // Model uri's are relative to your project's assets folder.
  // Learn more about Entity here: https://github.com/hytopiagg/sdk/blob/main/docs/server.entity.md
  const spider = new Entity({ 
    modelUri: 'models/npcs/spider.gltf',
    modelScale: 3,
    // We can have the entity play any animations
    // at spawn we'd like, multiple animation will be blended.
    modelLoopedAnimations: [ 'idle' ],
    // Learn more about rigidBodyOptions here: https://github.com/hytopiagg/sdk/blob/main/docs/server.rigidbodyoptions.md
    rigidBodyOptions: { 
      type: RigidBodyType.DYNAMIC,
      enabledRotations: { x: false, y: true, z: false },
      // Note: If you set rigidBodyOptions, but don't 
      // set any colliders, the entity will not be affected by physics.
      // Learn more about collider options here: https://github.com/hytopiagg/sdk/blob/main/docs/server.collideroptions.md
      colliders: [
        // Get hitbox collider as collider options based on the model & scale.
        Collider.optionsFromModelUri('models/npcs/spider.gltf', 3),
        {
          shape: ColliderShape.CYLINDER,
          halfHeight: 1.7,
          radius: 9,
          isSensor: true, // Sensors are colliders that do not react with physics, but can still trigger collision events.
          tag: 'aggro-sensor',
          onCollision: (other: Entity | BlockType, started: boolean) => {
            console.log('spider aggro-sensor colliding with', other.name, started);
          },
        },
      ],
      rotation: { x: 0, y: 0.4, z: 0, w: 0.6 }, // rotations are provided as a quaternion
    },
  });

  // A simple collision callback that logs when the spider collides with another Entity.
  spider.on(EntityEvent.ENTITY_COLLISION, ({ otherEntity, started }) => {
    console.log('spider colliding with', otherEntity.name, started);
  });

  spider.spawn(world, { x: 15, y: 10, z: 0 });
});

/**
 * Boilerplate setup for our example
 */
function setup(world: World) {
  // Uncomment this to visualize physics vertices, will cause noticable lag.
  // world.simulation.enableDebugRendering(true);
  
  world.loadMap(worldMap);

  // Spawn a player entity when a player joins the game.
  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });
  
    playerEntity.spawn(world, { x: 0, y: 10, z: 0 });
  });

  // Despawn all player entities when a player leaves the game.
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => {
    world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
  });
}