import GameRegion from '../../GameRegion';
import Spawner from '../../systems/Spawner';
import PortalEntity from '../../entities/PortalEntity';
import type { WanderOptions } from '../../entities/BaseEntity';

// Spawner Enemies
import RatkinBruteEntity from '../../entities/enemies/RatkinBruteEntity';
import RatkinRangerEntity from '../../entities/enemies/RatkinRangerEntity';
import RatkinSpellcasterEntity from '../../entities/enemies/RatkinSpellcasterEntity';
import RatkinWarriorEntity from '../../entities/enemies/RatkinWarriorEntity';

// Spawner Forageables
import RottenLogEntity from '../../entities/forageables/RottenLogEntity';

import ratkinNestMap from '../../../assets/maps/ratkin-nest.json';

export default class RatkinNestRegion extends GameRegion {
  public constructor() {
    super({
      id: 'ratkin-nest',
      name: 'Ratkin Nest',
      map: ratkinNestMap,
      maxAmbientLightIntensity: 0.275,
      maxDirectionalLightIntensity: 1.75,
      minAmbientLightIntensity: 0.225,
      minDirectionalLightIntensity: 0.5,
      skyboxUri: 'skyboxes/black',
      spawnPoint: { x: -30, y: 23, z: -62 },
      ambientAudioUri: 'audio/music/cave-theme-looping.mp3',
    });
  }

  protected override setup(): void {
    super.setup();

    this._setupEnemySpawners();
    this._setupForageableSpawners();
    this._setupPortals();
  }
  private _setupEnemySpawners(): void {
    
  }

  private _setupForageableSpawners(): void {
    const wanderOptions: WanderOptions = {
      idleMinMs: 8000,
      idleMaxMs: 30000,
      maxWanderRadius: 8,
      moveOptions: { moveCompletesWhenStuck: true }
    }

    const upperNestSpawner = new Spawner({
      groundCheckDistance: 6,
      maxSpawns: 20,
      spawnables: [
        { entityConstructor: RatkinBruteEntity, weight: 2, wanders: true, wanderOptions },
        { entityConstructor: RatkinRangerEntity, weight: 2, wanders: true, wanderOptions },
        { entityConstructor: RatkinSpellcasterEntity, weight: 1.5, wanders: true, wanderOptions },
        { entityConstructor: RatkinWarriorEntity, weight: 7, wanders: true, wanderOptions },
      ],
      spawnRegions: [
        {
          min: { x: -79, y: 6, z: -75 },
          max: { x: -20, y: 12, z: -24 },
          weight: 1,
        },
        {
          min: { x: -75, y: 6, z: -16 },
          max: { x: -7, y: 10, z: 25 },
          weight: 2,
        }
      ],
      spawnIntervalMs: 60000,
      world: this.world,
    });

    upperNestSpawner.start(true);
  }

  private _setupPortals(): void {
    const chitterForestPortal = new PortalEntity({
      destinationRegionId: 'chitter-forest',
      destinationRegionPosition: { x: -103.5, y: 2, z: 53.5 },
      destinationRegionFacingAngle: -45,
    });

    chitterForestPortal.spawn(this.world, { x: -31, y: 23.5, z: -71 }); 
  }
}
