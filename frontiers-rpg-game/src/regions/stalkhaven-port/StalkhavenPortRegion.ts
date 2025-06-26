import GameRegion from '../../GameRegion';
import PortalEntity from '../../entities/PortalEntity';

import BoatRepairmanSidEntity from './npcs/BoatRepairmanSidEntity';
import PirateCaptainShroudEntity from './npcs/PirateCaptainShroudEntity';

import stalkhavenPortMap from '../../../assets/maps/stalkhaven-port.json';

export default class StalkhavenRegion extends GameRegion {
  public constructor() {
    super({
      id: 'stalkhaven-port',
      name: 'Stalkhaven Port',
      map: stalkhavenPortMap,
      skyboxUri: 'skyboxes/partly-cloudy',
      spawnPoint: { x: -5, y: 8, z: 11 },
      ambientAudioUri: 'audio/music/hytopia-main-theme.mp3',
    });
  }

  protected override setup(): void {
    super.setup();

    this._setupNPCs();
    this._setupPortals();
  }

  private _setupNPCs(): void {
    (new BoatRepairmanSidEntity({ facingAngle: 155 })).spawn(this.world, { x: 2.5, y: 8, z: 3 });
    (new PirateCaptainShroudEntity({ facingAngle: 270 })).spawn(this.world, { x: -8.5, y: 8, z: 10.5 });
  }

  private _setupPortals(): void {
    const stalkhavenPortal = new PortalEntity({
      destinationRegionId: 'stalkhaven',
      destinationRegionPosition: { x: 32, y: 2, z: 1 },
      destinationRegionFacingAngle: 90,
      modelScale: 2,
    });
    
    stalkhavenPortal.spawn(this.world, { x: -6, y: 9.5, z: -31 });
  }
}