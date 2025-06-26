import { Quaternion } from 'hytopia';
import GameRegion from '../../GameRegion';
import Spawner from '../../systems/Spawner';
import PortalEntity from '../../entities/PortalEntity';
import type { WanderOptions } from '../../entities/BaseEntity';

// NPCs
import CapfolkVillagerEntity from '../../entities/npcs/CapfolkVillagerEntity';
import CaptainSpornEntity from './npcs/CaptainSpornEntity';
import CommanderMarkEntity from './npcs/CommanderMarkEntity';
import BankerJohnEntity from './npcs/BankerJohnEntity';
import BlacksmithArdenEntity from './npcs/BlacksmithArdenEntity';
import HealerMycelisEntity from './npcs/HealerMycelisEntity';
import MerchantFinnEntity from './npcs/MerchantFinnEntity';

import stalkhavenMap from '../../../assets/maps/stalkhaven.json';

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
    
    this._setupNPCs();
    this._setupNPCSpawners();
    this._setupPortals();
  }

  private _setupNPCs(): void {
    (new BankerJohnEntity({ facingAngle: 90 })).spawn(this.world, { x: 12, y: 3, z: 41 });
    (new BlacksmithArdenEntity({ facingAngle: 250 })).spawn(this.world, { x: -25, y: 3, z: -13 });
    (new CaptainSpornEntity({ facingAngle: 315 })).spawn(this.world, { x: -2, y: 3, z: 43 });
    (new CommanderMarkEntity({ facingAngle: 180 })).spawn(this.world, { x: 3, y: 3, z: 12 });
    (new HealerMycelisEntity({ facingAngle: 180 })).spawn(this.world, { x: -13.5, y: 3, z: -30 });
    (new MerchantFinnEntity({ facingAngle: 90 })).spawn(this.world, { x: 13, y: 3, z: 26.5 });
  }

  private _setupNPCSpawners(): void {
    const wanderOptions: WanderOptions = {
      idleMinMs: 5000,
      idleMaxMs: 15000,
      maxWanderRadius: 12,
      moveOptions: {
        moveCompletesWhenStuck: true,
        moveStoppingDistance: 1,
      }
    }

    const capfolkVillagerSpawner = new Spawner({
      groundCheckDistance: 10,
      maxSpawns: 10,
      spawnables: [
        { entityConstructor: CapfolkVillagerEntity, weight: 1, wanders: true, wanderOptions },
      ],
      spawnRegions: [
        {
          min: { x: -24, y: 2, z: -29 },
          max: { x: 29, y: 12, z: 38 },
          weight: 1,
        }
      ],
      spawnIntervalMs: 60000,
      world: this.world,
    });

    capfolkVillagerSpawner.start(true);
  } 

  private _setupPortals(): void {
    const chitterForestPortal = new PortalEntity({
      destinationRegionId: 'chitter-forest',
      destinationRegionFacingAngle: 0,
      destinationRegionPosition: { x: -7, y: 2, z: 76 },
      modelScale: 2,
    });
    chitterForestPortal.spawn(this.world, { x: 1, y: 3.5, z: 46 });

    const stalkhavenPortPortal = new PortalEntity({
      destinationRegionId: 'stalkhaven-port',
      destinationRegionFacingAngle: 180,
      destinationRegionPosition: { x: -6, y: 8, z: -28 },
      modelScale: 2,
    });
    stalkhavenPortPortal.spawn(this.world, { x: 35.5, y: 3.5, z: 1 }, Quaternion.fromEuler(0, 90, 0));
  }
}