import GameRegion from '../../GameRegion';
import RatkinBruteEntity from '../../entities/enemies/RatkinBruteEntity';
import RatkinRangerEntity from '../../entities/enemies/RatkinRangerEntity';
import RatkinSpellcasterEntity from '../../entities/enemies/RatkinSpellcasterEntity';
import RatkinWarriorEntity from '../../entities/enemies/RatkinWarriorEntity';
import Spawner from '../../systems/Spawner';
import PortalEntity from '../../entities/PortalEntity';
import type { WanderOptions } from '../../entities/BaseEntity';

import chitterForestMap from '../../../assets/maps/chitter-forest.json';

export default class ChitterForestRegion extends GameRegion {
  public constructor() {
    super({
      name: 'Chitter Forest',
      map: chitterForestMap,
      skyboxUri: 'skyboxes/partly-cloudy',
      spawnPoint: { x: -7, y: 2, z: 75 },
      ambientAudioUri: 'audio/music/jungle-theme-looping.mp3',
      tag: 'chitterForest',
    });
  }

  protected override setup(): void {
    super.setup();

    this._setupPortals();
    this._setupSpawners();
  }

  private _setupPortals(): void {
    const stalkhavenPortal = new PortalEntity({
      destinationRegionTag: 'stalkhaven',
      destinationRegionPosition: { x: 1, y: 2, z: 40 },
    });

    stalkhavenPortal.spawn(this.world, { x: -7, y: 3.5, z: 80.2 });
  }

  private _setupSpawners(): void {
    const roamWanderOptions: WanderOptions = {
      idleMinMs: 6000,
      idleMaxMs: 25000,
      maxWanderRadius: 12,
      moveOptions: { moveCompletesWhenStuck: true }
    };

    const campWanderOptions: WanderOptions = {
      idleMinMs: 7000,
      idleMaxMs: 25000,
      maxWanderRadius: 4,
      moveOptions: { moveCompletesWhenStuck: true }
    };

    const forestAreaSpawner = new Spawner({
      maxSpawns: 15,
      spawnableEntities: [
        { entity: RatkinBruteEntity, weight: 2, wanders: true, wanderOptions: roamWanderOptions },
        { entity: RatkinRangerEntity, weight: 2, wanders: true, wanderOptions: roamWanderOptions },
        { entity: RatkinSpellcasterEntity, weight: 1.5, wanders: true, wanderOptions: roamWanderOptions },
        { entity: RatkinWarriorEntity, weight: 7, wanders: true, wanderOptions: roamWanderOptions },
      ],
      spawnBounds: {
        min: { x: -49, y: 2, z: -35 },
        max: { x: 35, y: 6, z: 23 },
      },
      spawnIntervalMs: 60000,
      world: this.world,
    });

    const forestCamp1Spawner = new Spawner({
      maxSpawns: 6,
      spawnableEntities: [
        { entity: RatkinBruteEntity, weight: 2, wanders: true, wanderOptions: campWanderOptions },
        { entity: RatkinWarriorEntity, weight: 7, wanders: true, wanderOptions: campWanderOptions },
      ],
      spawnBounds: {
        min: { x: -27, y: 2, z: -15 },
        max: { x: -2, y: 6, z: 14 },
      },
      spawnIntervalMs: 60000,
      world: this.world,
    });
    
    const forestCamp2Spawner = new Spawner({
      maxSpawns: 8,
      spawnableEntities: [
        { entity: RatkinBruteEntity, weight: 2, wanders: true, wanderOptions: campWanderOptions },
        { entity: RatkinRangerEntity, weight: 4, wanders: true, wanderOptions: campWanderOptions },
        { entity: RatkinWarriorEntity, weight: 7, wanders: true, wanderOptions: campWanderOptions },
      ],
      spawnBounds: {
        min: { x: -9, y: 2, z: -48 },
        max: { x: 19, y: 6, z: -21 },
      },
      spawnIntervalMs: 60000,
      world: this.world,
    });
    
    const pathCampSpawner = new Spawner({
      maxSpawns: 10,
      spawnableEntities: [
        { entity: RatkinBruteEntity, weight: 3, wanders: true, wanderOptions: campWanderOptions },
        { entity: RatkinRangerEntity, weight: 3, wanders: true, wanderOptions: campWanderOptions },
        { entity: RatkinSpellcasterEntity, weight: 3, wanders: true, wanderOptions: campWanderOptions },
        { entity: RatkinWarriorEntity, weight: 5, wanders: true, wanderOptions: campWanderOptions },
      ],
      spawnBounds: {
        min: { x: 48, y: 2, z: 21 },
        max: { x: 84, y: 6, z: 45 },
      },
      spawnIntervalMs: 60000,
      world: this.world,
    });
    
    const lakeCampSpawner = new Spawner({
      maxSpawns: 6,
      spawnableEntities: [
        { entity: RatkinRangerEntity, weight: 6, wanders: true, wanderOptions: campWanderOptions },
        { entity: RatkinSpellcasterEntity, weight: 3, wanders: true, wanderOptions: campWanderOptions },
      ],
      spawnBounds: {
        min: { x: -108, y: 2, z: 22 },
        max: { x: -98, y: 6, z: 52 },
      },
      spawnIntervalMs: 60000,
      world: this.world,
    });

    forestAreaSpawner.start(true);
    forestCamp1Spawner.start(true);
    forestCamp2Spawner.start(true);
    pathCampSpawner.start(true);
    lakeCampSpawner.start(true);
  }
}
