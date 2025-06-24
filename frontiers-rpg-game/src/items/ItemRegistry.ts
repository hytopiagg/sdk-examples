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
    
    const ItemClasses = require('./ItemClasses').default; // lazy load to avoid circular dependencies
    let loadedCount = 0;
    
    for (const ItemClass of ItemClasses) {
      try {
        if (ItemClass?.prototype instanceof BaseItem && ItemClass.id) {
          this.itemRegistry.set(ItemClass.id, ItemClass);
          loadedCount++;
        }
      } catch (error) {
        console.warn(`Failed to load item: ${ItemClass.id}`);
      }
    }

    console.log(`Loaded ${loadedCount} items`);
  }
}
