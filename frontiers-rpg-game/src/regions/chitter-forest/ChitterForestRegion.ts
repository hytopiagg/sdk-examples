import GameRegion from '../../GameRegion';
import RatkinBruteEntity from '../../entities/enemies/RatkinBruteEntity';
import RatkinRangerEntity from '../../entities/enemies/RatkinRangerEntity';
import RatkinSpellcasterEntity from '../../entities/enemies/RatkinSpellcasterEntity';
import RatkinWarriorEntity from '../../entities/enemies/RatkinWarriorEntity';
import Spawner from '../../systems/Spawner';
import PortalEntity from '../../entities/PortalEntity';

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
    const forestAreaSpawner = new Spawner({
      maxSpawns: 15,
      spawnableEntities: [
        { entity: RatkinBruteEntity, weight: 2 },
        { entity: RatkinRangerEntity, weight: 2 },
        { entity: RatkinSpellcasterEntity, weight: 1.5 },
        { entity: RatkinWarriorEntity, weight: 7 },
      ],
      spawnBounds: {
        min: { x: -49, y: 2, z: -35 },
        max: { x: 35, y: 6, z: 23 },
      },
      spawnIntervalMs: 25000,
      world: this.world,
    });

    const forestCamp1Spawner = new Spawner({
      maxSpawns: 6,
      spawnableEntities: [
        { entity: RatkinBruteEntity, weight: 2 },
        { entity: RatkinWarriorEntity, weight: 7 },
      ],
      spawnBounds: {
        min: { x: -27, y: 2, z: -15 },
        max: { x: -2, y: 6, z: 14 },
      },
      spawnIntervalMs: 25000,
      world: this.world,
    });
    
    const forestCamp2Spawner = new Spawner({
      maxSpawns: 8,
      spawnableEntities: [
        { entity: RatkinBruteEntity, weight: 2 },
        { entity: RatkinRangerEntity, weight: 4 },
        { entity: RatkinWarriorEntity, weight: 7 },
      ],
      spawnBounds: {
        min: { x: -9, y: 2, z: -48 },
        max: { x: 19, y: 6, z: -21 },
      },
      spawnIntervalMs: 25000,
      world: this.world,
    });
    
    const pathCampSpawner = new Spawner({
      maxSpawns: 10,
      spawnableEntities: [
        { entity: RatkinBruteEntity, weight: 3 },
        { entity: RatkinRangerEntity, weight: 3 },
        { entity: RatkinSpellcasterEntity, weight: 3 },
        { entity: RatkinWarriorEntity, weight: 5 },
      ],
      spawnBounds: {
        min: { x: 48, y: 2, z: 21 },
        max: { x: 84, y: 6, z: 45 },
      },
      spawnIntervalMs: 25000,
      world: this.world,
    });
    
    const lakeCampSpawner = new Spawner({
      maxSpawns: 6,
      spawnableEntities: [
        { entity: RatkinRangerEntity, weight: 6 },
        { entity: RatkinSpellcasterEntity, weight: 3 },
      ],
      spawnBounds: {
        min: { x: -108, y: 2, z: 22 },
        max: { x: -98, y: 6, z: 52 },
      },
      spawnIntervalMs: 25000,
      world: this.world,
    });

    forestAreaSpawner.start(true);
    forestCamp1Spawner.start(true);
    forestCamp2Spawner.start(true);
    pathCampSpawner.start(true);
    lakeCampSpawner.start(true);
  }
}
