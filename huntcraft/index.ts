import { startServer, PlayerEvent, DefaultPlayerEntity } from 'hytopia';
import ProceduralRegion from './src/regions/ProceduralRegion';

import bridge from './assets/maps/procedural/forest/bridge.json';
import bridges from './assets/maps/procedural/forest/bridges.json';
import camp from './assets/maps/procedural/forest/camp.json';
import cap from './assets/maps/procedural/forest/cap.json';
import capSmall from './assets/maps/procedural/forest/cap-small.json';
import corridor from './assets/maps/procedural/forest/corridor.json';
import plateau from './assets/maps/procedural/forest/plateau.json';
import pond from './assets/maps/procedural/forest/pond.json';
import largeRuins from './assets/maps/procedural/forest/large-ruins.json';
import river from './assets/maps/procedural/forest/river.json';
import ruins from './assets/maps/procedural/forest/ruins.json';

import tidehaven from './assets/maps/tidehaven.json';

startServer(defaultWorld => {
  const proceduralRegion = new ProceduralRegion({
    liquidBlockNames: [ 'water-still' ],
    loadableSections: [
      { id: 'bridge', map: bridge, weight: 1 },
      { id: 'camp', map: camp, weight: 1 },
      { id: 'cap-small', map: capSmall, weight: 1 },
      { id: 'corridor', map: corridor, weight: 1 },
      { id: 'plateau', map: plateau, weight: 1 },
      { id: 'pond', map: pond, weight: 1 },
      { id: 'large-ruins', map: largeRuins, weight: 1 },
      { id: 'river', map: river, weight: 2 },
      { id: 'ruins', map: ruins, weight: 1 },
      { id: 'bridges', map: bridges, weight: 1 },
    ],
    ignoreColliderForModelNames: [ 'flower-white-2', 'flower-rose' ],
  });

  // defaultWorld.simulation.enableDebugRendering(true, 0);
  // defaultWorld.loadMap(proceduralRegion.generateMap(2));
  defaultWorld.loadMap(tidehaven);

  defaultWorld.on(PlayerEvent.JOINED_WORLD, ({ player }) => {
    const playerEntity = new DefaultPlayerEntity({
      player,
      name: 'Player',
    });
  
    playerEntity.spawn(defaultWorld, { x: 0, y: 10, z: 0 });
  });
});