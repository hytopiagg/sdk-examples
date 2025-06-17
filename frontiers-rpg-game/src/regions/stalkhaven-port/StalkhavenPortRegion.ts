import GameRegion from '../../GameRegion';
import stalkhavenPortMap from '../../../assets/maps/stalkhaven-port.json';

import BoatRepairmanSidEntity from './npcs/BoatRepairmanSidEntity';
import PirateCaptainShroudEntity from './npcs/PirateCaptainShroudEntity';
import PortalEntity from '../../entities/PortalEntity';

export default class StalkhavenRegion extends GameRegion {
  public constructor() {
    super({
      id: 'stalkhaven-port',
      name: 'Stalkhaven Port',
      map: stalkhavenPortMap,
      skyboxUri: 'skyboxes/partly-cloudy',
      spawnPoint: { x: -7, y: 8, z: 11 },
      ambientAudioUri: 'audio/music/hytopia-main-theme.mp3',
    });
  }

  protected override setup(): void {
    super.setup();

    const stalkhavenPortPortal = new PortalEntity({
      destinationRegionId: 'stalkhaven',
      destinationRegionPosition: { x: 32, y: 2, z: 1 },
      modelScale: 2,
    });
    stalkhavenPortPortal.spawn(this.world, { x: -6, y: 8, z: -31 });

    (new BoatRepairmanSidEntity({ facingAngle: 155 })).spawn(this.world, { x: 2.5, y: 8, z: 3 });
    (new PirateCaptainShroudEntity({ facingAngle: 270 })).spawn(this.world, { x: -8.5, y: 8, z: 10.5 });
  }
}