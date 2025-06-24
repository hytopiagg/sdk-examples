import { Collider, Entity, EntityOptions, RigidBodyType } from 'hytopia';

export type SpiderWebEntityOptions = {

} & EntityOptions;

export default class SpiderWebEntity extends Entity {
  public constructor(options?: SpiderWebEntityOptions) {
    super({
      ...options,
      modelUri: 'models/vfx/spider-web.gltf',
      rigidBodyOptions: {
        type: RigidBodyType.DYNAMIC,
        colliders: [
          {
            ...Collider.optionsFromModelUri('models/vfx/spider-web.gltf'),
            isSensor: true,
          }
        ]
      }
    });
  }
}