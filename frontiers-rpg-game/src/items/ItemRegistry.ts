import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import BaseItem, { ItemClass } from './BaseItem';

const itemRegistry = new Map<string, ItemClass>();

export function getItemClass(itemId: string): ItemClass | undefined {
  return itemRegistry.get(itemId);
}

export function initializeItems(): void {
  console.log('Loading items...');
  
  const itemFiles = findItemFiles(__dirname);
  let loadedCount = 0;
  
  for (const filePath of itemFiles) {
    try {
      const ItemClass = require(filePath).default;
      
      if (ItemClass?.prototype instanceof BaseItem && ItemClass.id) {
        itemRegistry.set(ItemClass.id, ItemClass);
        loadedCount++;
      }
    } catch (error) {
      console.warn(`Failed to load item: ${filePath}`);
    }
  }

  console.log(`Loaded ${loadedCount} items`);
}

function findItemFiles(dir: string): string[] {
  const files: string[] = [];
  
  for (const item of readdirSync(dir)) {
    const path = join(dir, item);
    
    if (statSync(path).isDirectory()) {
      files.push(...findItemFiles(path));
    } else if (!item.startsWith('Base')) {
      files.push(path);
    }
  }

  return files;
}

export { itemRegistry };
