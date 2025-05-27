import { startServer } from 'hytopia';

import GameManager from './src/GameManager';

/**
 * This example loads and simulates extremely large map that is
 * 750^2 blocks in area. Approximately 2,000,000+ blocks are loaded,
 * resulting in thousands of chunks and a large amount of physics vertices.
 * 
 * This example is meant to showcase the performance of the server.
 * When dealing with large fully simulated worlds, as well as benchmark
 * and test client performance.
 * 
 * Client load times may take a few seconds because batch
 * loading is not yet implemented.
 */

startServer(() => {
  GameManager.instance.loadRegions();
});