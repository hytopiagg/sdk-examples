import GameRegion from '../../GameRegion';
import stalkhavenMap from '../../../assets/maps/stalkhaven.json';

import CapfolkVillagerEntity from '../../entities/npcs/CapfolkVillagerEntity';
import CaptainSpornEntity from './npcs/CaptainSpornEntity';
import CommanderMarkEntity from './npcs/CommanderMarkEntity';
import BankerJohnEntity from '../../entities/npcs/BankerJohnEntity';
import MerchantFinnEntity from '../../entities/npcs/MerchantFinnEntity';
import PortalEntity from '../../entities/PortalEntity';

export default class StalkhavenRegion extends GameRegion {
  public constructor() {
    super({
      id: 'stalkhaven',
      name: 'Stalkhaven',
      map: stalkhavenMap,
      skyboxUri: 'skyboxes/partly-cloudy',
      spawnPoint: { x: 1, y: 2, z: 40 },
      ambientAudioUri: 'audio/music/hytopia-main-theme.mp3',
    });
  }

  protected override setup(): void {
    super.setup();
    
    const chitterForestPortal = new PortalEntity({
      destinationRegionId: 'chitterForest',
      destinationRegionPosition: { x: -7, y: 2, z: 76 },
      modelScale: 2,
    });
    chitterForestPortal.spawn(this.world, { x: 1, y: 3.5, z: 46 });

    (new BankerJohnEntity({ facingAngle: 90 })).spawn(this.world, { x: 12, y: 3, z: 41 });
    (new CaptainSpornEntity({ facingAngle: 315 })).spawn(this.world, { x: -2, y: 3, z: 43 });
    (new CommanderMarkEntity({ facingAngle: 180 })).spawn(this.world, { x: 3, y: 3, z: 12 });
    (new MerchantFinnEntity({ facingAngle: 90 })).spawn(this.world, { x: 13, y: 3, z: 26.5 });

    // Wandering Villagers 
    const villagerStartPositions = [
      { x: -6, y: 3, z: 13 }, // town center
      { x: 14, y: 3, z: 4 }, // town center
      { x: -2, y: 3, z: -15 }, // town center
      { x: 23, y: 3, z: 41 }, // well
      { x: 26, y: 3, z: -22 }, // market
      { x: 15, y: 3, z: -30 }, // market
    ];

    for (const position of villagerStartPositions) {
      const villager = new CapfolkVillagerEntity({ facingAngle: Math.random() * 360 });
      villager.spawn(this.world, position);
      villager.wander(villager.moveSpeed, {
        idleMinMs: 5000,
        idleMaxMs: 15000,
        maxWanderRadius: 12,
        moveOptions: {
          moveCompletesWhenStuck: true,
          moveStoppingDistance: 1,
        }
      });
    }
  }
}