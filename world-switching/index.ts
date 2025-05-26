import {
  startServer,
  Collider,
  DefaultPlayerEntity,
  Entity,
  Player,
  PlayerEvent,
  WorldManager,
  World,
  RigidBodyType,
  BlockType,
} from 'hytopia';

/**
 * This example demonstrates how to use the world switching system.
 * 
 * The world switching system is designed to be flexible and performant, allowing you to:
 * - Create and manage multiple distinct worlds
 * - Switch players between worlds seamlessly
 * - Handle world-specific events and state
 * - Worlds act as fully isolated simulations from one another
 * 
 * Performance considerations:
 * - Memory usage is the primary constraint since each world's representative colliders for its map are stored in RAM
 * - The system can typically handle tens of millions of blocks across multiple worlds before memory becomes an issue
 * - Physics performance depends on the number of active (non-sleeping) entities across all worlds
 * - Worlds with only sleeping entities (entities that haven't moved recently) use minimal CPU resources (< 0.1ms per world)
 * - You can typically run a few thousand entities in total across all worlds before performance issues arise so long as they can sleep (not all moving at once).
 * - Worlds are currently all simulated in the same thread, so 1 non-performant world will have some impact on the performance of other worlds.
 */

// We'll use 2 maps in this example, 1 for each unique world.
import world1Map from './assets/maps/world1.json';
import world2Map from './assets/maps/world2.json';

// The server always starts with a created default world passed in the startServer callback.
startServer(defaultWorld => {
  // We'll use defaultWorld as world1 in this example.
  defaultWorld.loadMap(world1Map);

  // We'll create our second world using the WorldManager instance.
  // This is the correct way to create a new world.
  const world2 = WorldManager.instance.createWorld({
    name: 'World 2',
    skyboxUri: 'skyboxes/partly-cloudy', // We'll use the default skybox that ships with @hytopia.com/assets package
  });
  world2.loadMap(world2Map);

  // We made a convenience function that spawns a entity that acts as a portal.
  // When a player touches it, they'll teleport to the other world in this example.
  addPortal(defaultWorld, world2);
  addPortal(world2, defaultWorld);

  // Each world handles player join/leave events separately. When a player switches worlds,
  // they start fresh in the new world - no state or UI carries over. This gives you full
  // control over what loads in each world without handling complex state management.
  defaultWorld.on(PlayerEvent.JOINED_WORLD, playerJoinedWorld);
  defaultWorld.on(PlayerEvent.LEFT_WORLD, playerLeftWorld);
  
  world2.on(PlayerEvent.JOINED_WORLD, playerJoinedWorld);
  world2.on(PlayerEvent.LEFT_WORLD, playerLeftWorld);
});

function playerJoinedWorld({ player, world }: { player: Player, world: World }) {
  const playerEntity = new DefaultPlayerEntity({
    player,
    name: 'Player',
  });

  playerEntity.spawn(world, { x: 0, y: 10, z: 0 });
}

function playerLeftWorld({ player, world }: { player: Player, world: World }) {
  world.entityManager.getPlayerEntitiesByPlayer(player).forEach(entity => entity.despawn());
}

// Our portal function creates a entity using the jump pad model at the 5,1.5,-5 position
// in the world it's added to. When a player touches the entity, they'll be switched
// to the world provided for toWorld. When they switch, the LEFT_WORLD event
// is invoked on the previous world and the JOINED_WORLD event is invoked on the one switched to.
function addPortal(world: World, toWorld: World) {
  const portal = new Entity({
    name: 'Portal',
    modelUri: 'models/structures/jump-pad.gltf',
    rigidBodyOptions: {
      type: RigidBodyType.KINEMATIC_POSITION,
      colliders: [
        {
          ...Collider.optionsFromModelUri('models/structures/jump-pad.gltf'),
          isSensor: true,
          onCollision(other: Entity | BlockType, started: boolean) {
            if (started && other instanceof DefaultPlayerEntity) {
              other.player.joinWorld(toWorld);
            }
          },
        },
      ],
    },
  });

  portal.spawn(world, { x: 5, y: 1.5, z: -5 });
}