import { Quaternion } from 'hytopia';
import GameRegion from '../../GameRegion';
import Spawner from '../../systems/Spawner';
import PortalEntity from '../../entities/PortalEntity';
import type { WanderOptions } from '../../entities/BaseEntity';

import hearthwildsMap from '../../../assets/maps/hearthwilds.json';

// NPCs
import ArchivesBookshelf1Entity from './npcs/ArchivesBookshelf1Entity';
import ArchivesBookshelf2Entity from './npcs/ArchivesBookshelf2Entity';
import GravekeeperArdenEntity from './npcs/GravekeeperArdenEntity';
import HerderBorisEntity from './npcs/HerderBorisEntity';
import MerchantFonnEntity from './npcs/MerchantFonnEntity';
import SurvivorMycelEntity from './npcs/SurvivorMycelEntity';
import WoolranEntity from '../../entities/npcs/WoolranEntity';

// Spawner Enemies
import GorkinChieftanEntity from '../../entities/enemies/GorkinChieftanEntity';
import GorkinEnforcerEntity from '../../entities/enemies/GorkinEnforcerEntity';
import GorkinGruntEntity from '../../entities/enemies/GorkinGruntEntity';
import GorkinShamanEntity from '../../entities/enemies/GorkinShamanEntity';
import GorkinSwordsmanEntity from '../../entities/enemies/GorkinSwordsmanEntity';
import GorkinHunterEntity from '../../entities/enemies/GorkinHunterEntity';
import ReclusiveWeaverEntity from '../../entities/enemies/ReclusiveWeaverEntity';

export default class HearthwildsRegion extends GameRegion {
  public constructor() {
    super({
      id: 'hearthwilds',
      name: 'Hearthwilds',
      map: hearthwildsMap,
      skyboxUri: 'skyboxes/partly-cloudy',
      spawnPoint: { x: 245, y: 22, z: -90 },
      ambientAudioUri: 'audio/music/jungle-theme-looping.mp3',
      fogColor: { r: 152, g: 196, b: 127 },
      fogNear: 15,
      fogFar: 50,
    });
  }

  protected override setup(): void {
    super.setup();

    this._setupEnemySpawners();
    this._setupNPCs();
    this._setupPortals();
  }

  private _setupEnemySpawners(): void {
    const roamWanderOptions: WanderOptions = {
      idleMinMs: 12000,
      idleMaxMs: 30000,
      maxWanderRadius: 12,
      moveOptions: { moveCompletesWhenStuck: true }
    };

    // Gorkin
    const gorkinSpawnables = [
      { entityConstructor: GorkinChieftanEntity, weight: 1, wanders: true, wanderOptions: roamWanderOptions }, // boss
      { entityConstructor: GorkinEnforcerEntity, weight: 15, wanders: true, wanderOptions: roamWanderOptions },
      { entityConstructor: GorkinGruntEntity, weight: 20, wanders: true, wanderOptions: roamWanderOptions },
      { entityConstructor: GorkinShamanEntity, weight: 15, wanders: true, wanderOptions: roamWanderOptions },
      { entityConstructor: GorkinSwordsmanEntity, weight: 17, wanders: true, wanderOptions: roamWanderOptions },
      { entityConstructor: GorkinHunterEntity, weight: 18, wanders: true, wanderOptions: roamWanderOptions },
    ];

    const gorkinSpawnerRegions = [
      { maxSpawns: 5, min: { x: 171, y: 12, z: -95 }, max: { x: 213, y: 16, z: -55 } }, // entry ruins
      { maxSpawns: 6, min: { x: 124, y: 10, z: -194 }, max: { x: 151, y: 15, z: -170 } }, // graveyard camp
      { maxSpawns: 11, min: { x: 61, y: 6, z: -197 }, max: { x: 91, y: 10, z: -173 } }, // graveyard valley
      { maxSpawns: 7, min: { x: 29, y: 12, z: -97 }, max: { x: 64, y: 14, z: -77 } }, // path camp 1
      { maxSpawns: 5, min: { x: 13, y: 12, z: -185 }, max: { x: 24, y: 15, z: -170 } }, // path camp 2
      { maxSpawns: 8, min: { x: -83, y: 12, z: -167 }, max: { x: -29, y: 15, z: -163 } }, // walled path 1
      { maxSpawns: 14, min: { x: -186, y: 12, z: -183 }, max: { x: -113, y: 15, z: -134 } }, // ruined city 1
      { maxSpawns: 9, min: { x: -215, y: 12, z: -149 }, max: { x: -197, y: 15, z: -114 } }, // ruined city 1 camp
      { maxSpawns: 5, min: { x: 6, y: 12, z: -50 }, max: { x: 23, y: 15, z: -40 } }, // church bridge camp
      { maxSpawns: 7, min: { x: -41, y: 12, z: -28 }, max: { x: -20, y: 15, z: -5 } }, // tower camp
      { maxSpawns: 5, min: { x: -20, y: 12, z: 39 }, max: { x: -5, y: 15, z: 57 } }, // bridge camp 1
      { maxSpawns: 15, min: { x: 55, y: 12, z: 81 }, max: { x: 133, y: 15, z: 119 } }, // ruined city 2
      { maxSpawns: 11, min: { x: 70, y: 12, z: 33 }, max: { x: 105, y: 15, z: 70 } }, // ruined city 2 camp 1
      { maxSpawns: 5, min: { x: 21, y: 12, z: 91 }, max: { x: 39, y: 15, z: 113 } }, // ruined city 2 camp 2
      { maxSpawns: 13, min: { x: 173, y: 12, z: 2 }, max: { x: 200, y: 15, z: 58 } }, // temple ruins
      { maxSpawns: 15, min: { x: -98, y: 8, z: 4 }, max: { x: -53, y: 12, z: 37 } }, // capfolk entrance camp
      { maxSpawns: 15, min: { x: -66, y: 8, z: -146 }, max: { x: 16, y: 12, z: -59 } }, // tower valley
      { maxSpawns: 10, min: { x: -131, y: 13, z: -120 }, max: { x: -114, y: 16, z: -86 } }, // island ruins
      { maxSpawns: 4, min: { x: -104, y: 12, z: -153 }, max: { x: -91, y: 15, z: -142 } } // island bridge camp
    ];
    
    for (const gorkinSpawnerRegion of gorkinSpawnerRegions) {
      const spawner = new Spawner({
        maxSpawns: gorkinSpawnerRegion.maxSpawns,
        spawnables: gorkinSpawnables,
        spawnRegions: [ { min: gorkinSpawnerRegion.min, max: gorkinSpawnerRegion.max } ],
        spawnIntervalMs: 15000,
        world: this.world,
      });

      spawner.start(true);
    }

    // Reclusive Weavers
    const reclusiveWeaversSpawnables = [
      { entityConstructor: ReclusiveWeaverEntity, weight: 1, wanders: true, wanderOptions: roamWanderOptions },
    ];

    const reclusiveWeaversSpawnerRegions = [

      { maxSpawns: 15, min: { x: 109, y: 2, z: -193 }, max: { x: 193, y: 5, z: -82 } }, // woolran camp ravine
      { maxSpawns: 15, min: { x: -26, y: 2, z: -71 }, max: { x: 90, y: 5, z: -13 } }, // church ruins ravine
      { maxSpawns: 10, min: { x: -39, y: 2, z: 33 }, max: { x: 17, y: 5, z: 119 } }, // bridge ruins ravine
    ];

    for (const reclusiveWeaversSpawnerRegion of reclusiveWeaversSpawnerRegions) {
      const spawner = new Spawner({
        maxSpawns: reclusiveWeaversSpawnerRegion.maxSpawns,
        spawnables: reclusiveWeaversSpawnables,
        spawnRegions: [ { min: reclusiveWeaversSpawnerRegion.min, max: reclusiveWeaversSpawnerRegion.max } ],
        spawnIntervalMs: 15000,
        world: this.world,
      });

      spawner.start(true);
    }
  }

  private _setupNPCs(): void {
    // Archival Bookshelves
    const archivalBookshelf1 = new ArchivesBookshelf1Entity({ facingAngle: -90 });
    archivalBookshelf1.spawn(this.world, { x: -120.5, y: 11, z: 12.5 });

    const archivalBookshelf2 = new ArchivesBookshelf2Entity({ facingAngle: 180 });
    archivalBookshelf2.spawn(this.world, { x: -114.5, y: 11, z: 11.5 });

    // Gravekeeper Arden
    const gravekeeperArden = new GravekeeperArdenEntity({ facingAngle: 135 });
    gravekeeperArden.spawn(this.world, { x: 166, y: 14, z: -211.5 });

    // Herder Boris
    const herderBoris = new HerderBorisEntity({ facingAngle: 200 });
    herderBoris.spawn(this.world, { x: 159, y: 14, z: -161 });

    // Merchant Fonn
    const merchantFonn = new MerchantFonnEntity({ facingAngle: -30 });
    merchantFonn.spawn(this.world, { x: 138, y: 14, z: -4.5 });

    // Survivor Mycel
    const survivorMycel = new SurvivorMycelEntity({ facingAngle: -80 });
    survivorMycel.spawn(this.world, { x: 208, y: 14, z: -103.5 });

    // Woolran in stable
    [
      { facingAngle: 210, position: { x: 163, y: 14, z: -168 } }, // stable
      { facingAngle: 160, position: { x: 167, y: 14, z: -165 } }, // stable
      { facingAngle: 280, position: { x: 176, y: 14, z: -143 } }, // by bridge 1
      { facingAngle: 300, position: { x: 149, y: 14, z: -155 } }, // by bridge 2
    ].forEach(woolran => {
      const woolranEntity = new WoolranEntity({ facingAngle: woolran.facingAngle });
      woolranEntity.spawn(this.world, woolran.position);
    });
  }

  private _setupPortals(): void {
    const chitterForestPortal = new PortalEntity({
      destinationRegionId: 'chitter-forest',
      destinationRegionPosition: { x: 145, y: 2, z: -14 }, 
      destinationRegionFacingAngle: 120,
    });

    chitterForestPortal.spawn(this.world, { x: 252, y: 22, z: -89.25 }, Quaternion.fromEuler(0, 90, 0));
  }
}