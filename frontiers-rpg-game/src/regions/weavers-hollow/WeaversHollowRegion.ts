import { Quaternion } from 'hytopia';
import GameRegion from '../../GameRegion';
import Spawner from '../../systems/Spawner';
import PortalEntity from '../../entities/PortalEntity';

import weaversHollowMap from '../../../assets/maps/weavers-hollow.json';

import SpiderWebEntity from '../../entities/environmental/SpiderWebEntity';
import QueenWeaverEntity from '../../entities/enemies/QueenWeaverEntity';
import WeaverBroodlingEntity from '../../entities/enemies/WeaverBroodlingEntity';

export default class WeaversHollowRegion extends GameRegion {
  public constructor() {
    super({
      id: 'weavers-hollow',
      name: `Weaver's Hollow`,
      map: weaversHollowMap,
      maxAmbientLightIntensity: 0.075,
      maxDirectionalLightIntensity: 0.8,
      minAmbientLightIntensity: 0.055,
      minDirectionalLightIntensity: 0.4,
      respawnOverride: {
        regionId: 'ratkin-nest',
        facingAngle: 135,
        spawnPoint: { x: -1, y: 10, z: -67 },
      },
      skyboxUri: 'skyboxes/black',
      spawnPoint: { x: 10, y: 2, z: 13 },
      ambientAudioUri: 'audio/music/cave-theme-looping.mp3',
    });
  }

  protected override setup(): void {
    super.setup();

    this._setupEnemySpawners();
    this._setupEnvironmentSpawners();
    this._setupPortals();
  }

  private _setupEnemySpawners(): void {
    const queenWeaverSpawner = new Spawner({
      maxSpawns: 1,
      spawnables: [
        { entityConstructor: QueenWeaverEntity, weight: 1 },
      ],
      spawnRegions: [
        {
          min: { x: -1, y: 16, z: 6 },
          max: { x: 0, y: 16, z: 7 },
          weight: 1,
        }
      ],
      spawnIntervalMs: 120000,
      world: this.world,
    });

    queenWeaverSpawner.start(true);

    // Spawn lure broodlings
    for (let i = 0; i < 3; i++) {
      const weaverBroodling = new WeaverBroodlingEntity({ facingAngle: Math.random() * 360 });
      weaverBroodling.spawn(this.world, {
        x: Math.random() * 8 - 4,
        y: 2,
        z: Math.random() * 8 - 4,
      });
    }
  }

  private _setupEnvironmentSpawners(): void {
    const spiderWebSpawner = new Spawner({
      groundCheckDistance: 8,
      maxSpawns: 20,
      spawnables: [
        { entityConstructor: SpiderWebEntity, weight: 1 },
      ],
      spawnRegions: [
        {
          min: { x: -13, y: 5, z: -9 },
          max: { x: 13, y: 8, z: 11 },
          weight: 1,
        }
      ],
      spawnIntervalMs: 10000,
      world: this.world,
    });

    spiderWebSpawner.start(true);
  }

  private _setupPortals(): void {
    const ratkinNestPortal = new PortalEntity({
      delayS: 10,
      destinationRegionId: 'ratkin-nest',
      destinationRegionPosition: { x: 35, y: 2, z: -118 },
      destinationRegionFacingAngle: 240,
    });

    ratkinNestPortal.spawn(this.world, { x: 13.5, y: 3.5, z: 18 }, Quaternion.fromEuler(0, 45, 0));
  }
}
