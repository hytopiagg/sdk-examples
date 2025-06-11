import GameRegion from '../../GameRegion';
import stalkhavenMap from '../../../assets/maps/stalkhaven.json';

import CaptainSpornEntity from './npcs/CaptainSpornEntity';
import BankerJohnEntity from '../../entities/npcs/BankerJohnEntity';
import MerchantFinnEntity from '../../entities/npcs/MerchantFinnEntity';
import PortalEntity from '../../entities/PortalEntity';

export default class StalkhavenRegion extends GameRegion {
  public constructor() {
    super({
      name: 'Stalkhaven',
      map: stalkhavenMap,
      skyboxUri: 'skyboxes/partly-cloudy',
      spawnPoint: { x: 1, y: 2, z: 40 },
      ambientAudioUri: 'audio/music/hytopia-main-theme.mp3',
      tag: 'stalkhaven',
    });
  }

  protected override setup(): void {
    super.setup();
    
    const chitterForestPortal = new PortalEntity({
      destinationRegionTag: 'chitterForest',
      destinationRegionPosition: { x: -7, y: 2, z: 76 },
      modelScale: 2,
    });
    chitterForestPortal.spawn(this.world, { x: 1, y: 3.5, z: 46 });

    (new BankerJohnEntity({ facingAngle: 90 })).spawn(this.world, { x: 12, y: 3, z: 41 });
    (new CaptainSpornEntity({ facingAngle: 315 })).spawn(this.world, { x: -2, y: 3, z: 43 });
    (new MerchantFinnEntity({ facingAngle: 90 })).spawn(this.world, { x: 13, y: 3, z: 26.5 });
  }
}