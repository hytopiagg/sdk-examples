import { Block, Vector3Like, World } from 'hytopia';
import {
  BEDROCK_BLOCK_ID,
  BLOCK_ID_BREAK_DAMAGE,
  BLOCK_ID_MATERIALS,
 } from '../gameConfig';

interface BlockDamage {
  blockId: number;
  totalDamage: number;
}

export default class TerrainDamageManager {
  public static instance: TerrainDamageManager = new TerrainDamageManager();

  private _blockDamages: Map<string, BlockDamage> = new Map();

  private constructor() {}

  public static getBreakMaterialCount(blockId: number): number {
    return BLOCK_ID_MATERIALS[blockId] ?? BLOCK_ID_MATERIALS.default; 
  }

  public damageBlock(world: World, block: Block, damage: number): boolean {
    const coordinateKey = this._coordinateToKey(block.globalCoordinate);
    let blockDamage = this._blockDamages.get(coordinateKey);

    if (!blockDamage) {
      const blockId = block.blockType.id;

      if (block.blockType.isLiquid || blockId === BEDROCK_BLOCK_ID) {
        return false;
      }

      blockDamage = { blockId, totalDamage: 0 };
      this._blockDamages.set(coordinateKey, blockDamage);
    }

    blockDamage.totalDamage += damage;

    const requiredBreakDamage = BLOCK_ID_BREAK_DAMAGE[blockDamage.blockId] ?? BLOCK_ID_BREAK_DAMAGE.default;

    if (blockDamage.totalDamage >= requiredBreakDamage) {
      world.chunkLattice.setBlock(block.globalCoordinate, 0);
      this._blockDamages.delete(coordinateKey);
      
      return true;
    }

    return false;
  }

  private _coordinateToKey(coordinate: Vector3Like): string {
    return `${coordinate.x},${coordinate.y},${coordinate.z}`;
  }
}