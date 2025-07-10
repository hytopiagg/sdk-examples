import { Quaternion } from 'hytopia';
import GameRegion from '../../GameRegion';
import Spawner from '../../systems/Spawner';
import PortalEntity from '../../entities/PortalEntity';
import type { WanderOptions } from '../../entities/BaseEntity';

// NPCs
import CapfolkKnightEntity from '../../entities/npcs/CapfolkKnightEntity';
import CaptainChanterelionEntity from './npcs/CaptainChanterelionEntity';

// Spawner Enemies
import GorkinGruntEntity from '../../entities/enemies/GorkinGruntEntity';
import RatkinBruteEntity from '../../entities/enemies/RatkinBruteEntity';
import RatkinRangerEntity from '../../entities/enemies/RatkinRangerEntity';
import RatkinSpellcasterEntity from '../../entities/enemies/RatkinSpellcasterEntity';
import RatkinWarriorEntity from '../../entities/enemies/RatkinWarriorEntity';

// Spawner Forageables
import RottenLogEntity from '../../entities/forageables/RottenLogEntity';

import chitterForestMap from '../../../assets/maps/chitter-forest.json';

export default class ChitterForestRegion extends GameRegion {
  public constructor() {
    super({
      id: 'chitter-forest',
      name: 'Chitter Forest',
      map: chitterForestMap,
      skyboxUri: 'skyboxes/partly-cloudy',
      spawnPoint: { x: -7, y: 2, z: 75 },
      ambientAudioUri: 'audio/music/jungle-theme-looping.mp3',
    });
  }

  protected override setup(): void {
    super.setup();

    this._setupEnemySpawners();
    this._setupForageableSpawners();
    this._setupNPCs();
    this._setupPortals();
  }

  private _setupEnemySpawners(): void {
    const roamWanderOptions: WanderOptions = {
      idleMinMs: 8000,
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
      spawnables: [
        { entityConstructor: RatkinBruteEntity, weight: 2, wanders: true, wanderOptions: roamWanderOptions },
        { entityConstructor: RatkinRangerEntity, weight: 2, wanders: true, wanderOptions: roamWanderOptions },
        { entityConstructor: RatkinSpellcasterEntity, weight: 1.5, wanders: true, wanderOptions: roamWanderOptions },
        { entityConstructor: RatkinWarriorEntity, weight: 7, wanders: true, wanderOptions: roamWanderOptions },
      ],
      spawnRegions: [
        { // Main forest area
          min: { x: -49, y: 2, z: -35 },
          max: { x: 35, y: 6, z: 23 },
          weight: 1,
        },
        { // Surrounding lake area
          min: { x: -106, y: 2, z: 16 },
          max: { x: -46, y: 4, z: 59 },
          weight: 2,
        },
      ],
      spawnIntervalMs: 60000,
      world: this.world,
    });

    const forestCamp1Spawner = new Spawner({
      maxSpawns: 6,
      spawnables: [
        { entityConstructor: RatkinBruteEntity, weight: 2, wanders: true, wanderOptions: campWanderOptions },
        { entityConstructor: RatkinWarriorEntity, weight: 7, wanders: true, wanderOptions: campWanderOptions },
      ],
      spawnRegions: [
        {
          min: { x: -27, y: 2, z: -15 },
          max: { x: -2, y: 6, z: 14 },
        }
      ],
      spawnIntervalMs: 60000,
      world: this.world,
    });
    
    const forestCamp2Spawner = new Spawner({
      maxSpawns: 8,
      spawnables: [
        { entityConstructor: RatkinBruteEntity, weight: 2, wanders: true, wanderOptions: campWanderOptions },
        { entityConstructor: RatkinRangerEntity, weight: 4, wanders: true, wanderOptions: campWanderOptions },
        { entityConstructor: RatkinWarriorEntity, weight: 7, wanders: true, wanderOptions: campWanderOptions },
      ],
      spawnRegions: [
        {
          min: { x: -9, y: 2, z: -48 },
          max: { x: 19, y: 6, z: -21 },
        }
      ],
      spawnIntervalMs: 60000,
      world: this.world,
    });
    
    const pathCampSpawner = new Spawner({
      maxSpawns: 10,
      spawnables: [
        { entityConstructor: RatkinBruteEntity, weight: 3, wanders: true, wanderOptions: campWanderOptions },
        { entityConstructor: RatkinRangerEntity, weight: 3, wanders: true, wanderOptions: campWanderOptions },
        { entityConstructor: RatkinSpellcasterEntity, weight: 3, wanders: true, wanderOptions: campWanderOptions },
        { entityConstructor: RatkinWarriorEntity, weight: 5, wanders: true, wanderOptions: campWanderOptions },
      ],
      spawnRegions: [
        {
          min: { x: 48, y: 2, z: 21 },
          max: { x: 84, y: 6, z: 45 },
        }
      ],
      spawnIntervalMs: 60000,
      world: this.world,
    });
    
    const lakeCampSpawner = new Spawner({
      maxSpawns: 6,
      spawnables: [
        { entityConstructor: RatkinRangerEntity, weight: 6, wanders: true, wanderOptions: campWanderOptions },
        { entityConstructor: RatkinSpellcasterEntity, weight: 3, wanders: true, wanderOptions: campWanderOptions },
      ],
      spawnRegions: [
        {
          min: { x: -108, y: 2, z: 22 },
          max: { x: -98, y: 6, z: 52 },
        }
      ],
      spawnIntervalMs: 60000,
      world: this.world,
    });

    const gorkinGruntsSpawner = new Spawner({
      maxSpawns: 5,
      spawnables: [
        { entityConstructor: GorkinGruntEntity, weight: 1, wanders: true, wanderOptions: roamWanderOptions },
      ],
      spawnRegions: [
        {
          min: { x: 125, y: 2, z: -16 },
          max: { x: 134, y: 4, z: 36 },
        }
      ],
      spawnIntervalMs: 60000,
      world: this.world,
    });

    forestAreaSpawner.start(true);
    forestCamp1Spawner.start(true);
    forestCamp2Spawner.start(true);
    pathCampSpawner.start(true);
    lakeCampSpawner.start(true);
    gorkinGruntsSpawner.start(true);
  }

  private _setupForageableSpawners(): void {
    const forestAreaSpawner = new Spawner({
      maxSpawns: 15,
      spawnables: [
        { entityConstructor: RottenLogEntity, weight: 1 },
      ],
      spawnRegions: [
        { // Main forest area
          min: { x: -49, y: 2, z: -35 },
          max: { x: 35, y: 6, z: 23 },
          weight: 1,
        },
        { // Surrounding lake area
          min: { x: -106, y: 2, z: 16 },
          max: { x: -46, y: 4, z: 59 },
          weight: 2,
        },
      ],
      spawnIntervalMs: 30000,
      world: this.world,
    });

    forestAreaSpawner.start(true);
  }

  private _setupNPCs(): void {
    // Camp Knights
    [
      { facingAngle: 45, position: { x: 41, y: 2, z: 60 } },
      { facingAngle: 135, position: { x: 40, y: 2, z: 51 } },
      { facingAngle: 180, position: { x: 32, y: 2, z: 49 } },
      { facingAngle: -45, position: { x: 32, y: 2, z: 60 } },
    ].forEach(capfolkKnight => {
      const knight = new CapfolkKnightEntity({ facingAngle: capfolkKnight.facingAngle });
      knight.spawn(this.world, capfolkKnight.position);
    });

    // Captain Chanterelion
    const captainChanterelion = new CaptainChanterelionEntity({ facingAngle: 90 });
    captainChanterelion.spawn(this.world, { x: 42, y: 2, z: 55 });
  }

  private _setupPortals(): void {
    const hearthwildsPortal = new PortalEntity({
      destinationRegionId: 'hearthwilds',
      destinationRegionPosition: { x: 249, y: 22, z: -89 },
      destinationRegionFacingAngle: 90,
    });

    hearthwildsPortal.spawn(this.world, { x: 149, y: 3.5, z: -15 }, Quaternion.fromEuler(0, -90, 0));

    const stalkhavenPortal = new PortalEntity({
      destinationRegionId: 'stalkhaven',
      destinationRegionPosition: { x: 1, y: 2, z: 40 },
    });

    stalkhavenPortal.spawn(this.world, { x: -7, y: 3.5, z: 80.2 });

    const ratkinNestPortal = new PortalEntity({
      destinationRegionId: 'ratkin-nest',
      destinationRegionPosition: { x: -31, y: 23, z: -67 },
      destinationRegionFacingAngle: 180,
    });

    ratkinNestPortal.spawn(this.world, { x: -105.75, y: 3.5, z: 55.5 }, Quaternion.fromEuler(0, -45, 0));
  }
}
