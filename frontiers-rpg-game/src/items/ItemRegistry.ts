import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import BaseItem, { ItemClass } from './BaseItem';

export default class ItemRegistry {
  private static itemRegistry = new Map<string, ItemClass>();

  public static getItemClass(itemId: string): ItemClass | undefined {
    return this.itemRegistry.get(itemId);
  }

  public static initializeItems(): void {
    console.log('Loading items...');
    
    const itemFiles = this._findItemFiles(__dirname);
    let loadedCount = 0;
    
    for (const filePath of itemFiles) {
      try {
        const ItemClass = require(filePath).default;
        
        if (ItemClass?.prototype instanceof BaseItem && ItemClass.id) {
          this.itemRegistry.set(ItemClass.id, ItemClass);
          loadedCount++;
        }
      } catch (error) {
        console.warn(`Failed to load item: ${filePath}`);
      }
    }

    console.log(`Loaded ${loadedCount} items`);
  }

  private static _findItemFiles(dir: string): string[] {
    const files: string[] = [];
    
    for (const item of readdirSync(dir)) {
      const path = join(dir, item);
      
      if (statSync(path).isDirectory()) {
        files.push(...this._findItemFiles(path));
      } else if (!item.startsWith('Base')) {
        files.push(path);
      }
    }

    return files;
  }
}
