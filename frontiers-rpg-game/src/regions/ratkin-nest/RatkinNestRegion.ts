import { Quaternion } from 'hytopia';
import GameRegion from '../../GameRegion';
import Spawner from '../../systems/Spawner';
import PortalEntity from '../../entities/PortalEntity';
import type { WanderOptions } from '../../entities/BaseEntity';

// NPCs
import ScoutMorelEntity from './npcs/ScoutMorelEntity';

// Spawner Enemies
import RatkinBruteEntity from '../../entities/enemies/RatkinBruteEntity';
import RatkinRangerEntity from '../../entities/enemies/RatkinRangerEntity';
import RatkinSpellcasterEntity from '../../entities/enemies/RatkinSpellcasterEntity';
import RatkinWarriorEntity from '../../entities/enemies/RatkinWarriorEntity';

import TaintedRatkinBruteEntity from '../../entities/enemies/TaintedRatkinBruteEntity';
import TaintedRatkinRangerEntity from '../../entities/enemies/TaintedRatkinRangerEntity';
import TaintedRatkinSpellcasterEntity from '../../entities/enemies/TaintedRatkinSpellcasterEntity';
import TaintedRatkinWarriorEntity from '../../entities/enemies/TaintedRatkinWarriorEntity';

import LesserBlightBloomEntity from '../../entities/enemies/LesserBlightBloomEntity';

import WeaverBroodlingEntity from '../../entities/enemies/WeaverBroodlingEntity';

// Spawner Forageables
import DecayingPileEntity from '../../entities/forageables/DecayingPileEntity';

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
      fogColor: { r: 139, g: 69, b: 19 },
      fogNear: 0,
      fogFar: 90,
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
    const wanderOptions: WanderOptions = {
      idleMinMs: 8000,
      idleMaxMs: 30000,
      maxWanderRadius: 8,
      moveOptions: { moveCompletesWhenStuck: true }
    }

    const upperNestSpawner = new Spawner({
      groundCheckDistance: 6,
      maxSpawns: 15,
      spawnables: [
        { entityConstructor: RatkinBruteEntity, weight: 2, wanders: true, wanderOptions },
        { entityConstructor: RatkinRangerEntity, weight: 2, wanders: true, wanderOptions },
        { entityConstructor: RatkinSpellcasterEntity, weight: 1.5, wanders: true, wanderOptions },
        { entityConstructor: RatkinWarriorEntity, weight: 7, wanders: true, wanderOptions },
        { entityConstructor: TaintedRatkinBruteEntity, weight: 1, wanders: true, wanderOptions },
        { entityConstructor: TaintedRatkinRangerEntity, weight: 1, wanders: true, wanderOptions },
        { entityConstructor: TaintedRatkinSpellcasterEntity, weight: 0.5, wanders: true, wanderOptions },
        { entityConstructor: TaintedRatkinWarriorEntity, weight: 3, wanders: true, wanderOptions },
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

    const lowerNestSpawner = new Spawner({
      groundCheckDistance: 4,
      maxSpawns: 12,
      spawnables: [
        { entityConstructor: RatkinBruteEntity, weight: 1, wanders: true, wanderOptions },
        { entityConstructor: RatkinRangerEntity, weight: 1, wanders: true, wanderOptions },
        { entityConstructor: RatkinSpellcasterEntity, weight: 0.5, wanders: true, wanderOptions },
        { entityConstructor: RatkinWarriorEntity, weight: 3, wanders: true, wanderOptions },
        { entityConstructor: TaintedRatkinBruteEntity, weight: 2, wanders: true, wanderOptions },
        { entityConstructor: TaintedRatkinRangerEntity, weight: 2, wanders: true, wanderOptions },
        { entityConstructor: TaintedRatkinSpellcasterEntity, weight: 1.5, wanders: true, wanderOptions },
        { entityConstructor: TaintedRatkinWarriorEntity, weight: 7, wanders: true, wanderOptions },
      ],
      spawnRegions: [
        {
          min: { x: -3, y: 1, z: -47 },
          max: { x: 69, y: 3, z: 42 },
          weight: 1,
        }
      ],
      spawnIntervalMs: 60000,
      world: this.world,
    });

    const lowerNestLesserBlightBloomSpawner = new Spawner({
      groundCheckDistance: 4,
      maxSpawns: 7,
      spawnables: [
        { entityConstructor: LesserBlightBloomEntity, weight: 1 },
      ],
      spawnRegions: [
        {
          min: { x: -3, y: 1, z: -47 },
          max: { x: 69, y: 3, z: 42 },
          weight: 1,
        }
      ],
      spawnIntervalMs: 60000,
      world: this.world,
    });

    const weaverBroodlingSpawner = new Spawner({
      groundCheckDistance: 4,
      maxSpawns: 6,
      spawnables: [
        { entityConstructor: WeaverBroodlingEntity, weight: 1 },
      ],
      spawnRegions: [
        {
          min: { x: -4, y: 2, z: -112 },
          max: { x: 45, y: 5, z: -64 },
          weight: 1,
        }
      ],
      spawnIntervalMs: 15000,
      world: this.world,
    })

    upperNestSpawner.start(true);
    lowerNestSpawner.start(true);
    lowerNestLesserBlightBloomSpawner.start(true);
    weaverBroodlingSpawner.start(true);
  }

  private _setupForageableSpawners(): void {
    const ratkinNestSpawner = new Spawner({
      groundCheckDistance: 6,
      maxSpawns: 15,
      spawnables: [
        { entityConstructor: DecayingPileEntity, weight: 1 },
      ],
      spawnRegions: [
        { // Upper Nest
          min: { x: -79, y: 6, z: -75 },
          max: { x: -20, y: 12, z: -24 },
          weight: 0.5,
        },
        { // Upper Nest
          min: { x: -75, y: 6, z: -16 },
          max: { x: -7, y: 10, z: 25 },
          weight: 1,
        },
        { // Lower Nest
          min: { x: -3, y: 1, z: -47 },
          max: { x: 69, y: 3, z: 42 },
          weight: 2.5,
        }
      ],
      spawnIntervalMs: 30000,
      world: this.world,
    });

    ratkinNestSpawner.start(true);
  }

  private _setupNPCs(): void {
    // Scout Morel
    const scoutMorel = new ScoutMorelEntity({ facingAngle: -45 });
    scoutMorel.spawn(this.world, { x: -32.5, y: 24, z: -63.5 });
  }

  private _setupPortals(): void {
    const chitterForestPortal = new PortalEntity({
      destinationRegionId: 'chitter-forest',
      destinationRegionPosition: { x: -103.5, y: 2, z: 53.5 },
      destinationRegionFacingAngle: -45,
    });

    chitterForestPortal.spawn(this.world, { x: -31, y: 23.5, z: -71 }); 

    const weaversHollowPortal = new PortalEntity({
      destinationRegionId: 'weavers-hollow',
      destinationRegionPosition: { x: 10, y: 2, z: 13 },
      destinationRegionFacingAngle: 45,
      type: 'boss',
    });

    weaversHollowPortal.spawn(this.world, { x: 31, y: 3.5, z: -123 }, Quaternion.fromEuler(0, 45, 0));
  }
}
