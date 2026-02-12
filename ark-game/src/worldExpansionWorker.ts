import { parentPort } from 'node:worker_threads';
import WorldGenerator, { type GeneratorChunkResult } from './generator/WorldGenerator.ts';

interface GenerateStageRequest {
  type: 'generate-stage';
  stageId: number;
  seed: number;
  worldHeight: number;
  chunkSize: number;
  innerEdge: number;
  outerEdge: number;
  isFinalStage: boolean;
  batchChunkLimit: number;
}

interface BatchAppliedMessage {
  type: 'batch-applied';
  stageId: number;
}

type WorkerInput = GenerateStageRequest | BatchAppliedMessage;

interface RingBatchMessage {
  type: 'ring-batch';
  stageId: number;
  chunks: GeneratorChunkResult[];
}

interface FinalSnapshotMessage {
  type: 'final-snapshot';
  stageId: number;
  blocks: ReturnType<WorldGenerator['generate']>['blocks'];
  spawnPoint: ReturnType<WorldGenerator['generate']>['spawnPoint'];
  totalBlocks: number;
}

interface StageCompleteMessage {
  type: 'stage-complete';
  stageId: number;
  chunkCount: number;
  blockCount: number;
  generationTimeMs: number;
}

interface StageErrorMessage {
  type: 'stage-error';
  stageId: number;
  message: string;
}

type WorkerOutput =
  | RingBatchMessage
  | FinalSnapshotMessage
  | StageCompleteMessage
  | StageErrorMessage;

interface PendingAck {
  stageId: number;
  resolve: () => void;
}

let pendingAck: PendingAck | null = null;
let running = false;

function postMessage(message: WorkerOutput): void {
  parentPort?.postMessage(message);
}

function waitForBatchAck(stageId: number): Promise<void> {
  return new Promise((resolve) => {
    pendingAck = { stageId, resolve };
  });
}

async function runStage(job: GenerateStageRequest): Promise<void> {
  if (running) {
    postMessage({
      type: 'stage-error',
      stageId: job.stageId,
      message: '[WorldStreamWorker] Received generate-stage while another stage is running.',
    });
    return;
  }

  running = true;
  try {
    const nextSize = job.outerEdge * job.chunkSize;
    const generator = new WorldGenerator({
      seed: job.seed,
      worldSize: { x: nextSize, y: job.worldHeight, z: nextSize },
    });
    const snapshot = generator.generate();

    const heightChunks = Math.ceil(job.worldHeight / job.chunkSize);
    const totalChunkCount = job.outerEdge * job.outerEdge * heightChunks;

    if (job.isFinalStage) {
      postMessage({
        type: 'final-snapshot',
        stageId: job.stageId,
        blocks: snapshot.blocks,
        spawnPoint: snapshot.spawnPoint,
        totalBlocks: snapshot.stats.totalBlocks,
      });
      postMessage({
        type: 'stage-complete',
        stageId: job.stageId,
        chunkCount: totalChunkCount,
        blockCount: snapshot.stats.totalBlocks,
        generationTimeMs: snapshot.stats.generationTimeMs,
      });
      return;
    }

    let chunkCount = 0;
    let blockCount = 0;
    let batch: GeneratorChunkResult[] = [];
    const batchChunkLimit = Math.max(1, job.batchChunkLimit | 0);

    for (let cx = 0; cx < job.outerEdge; cx++) {
      for (let cz = 0; cz < job.outerEdge; cz++) {
        if (cx < job.innerEdge && cz < job.innerEdge) continue;
        for (let cy = 0; cy < heightChunks; cy++) {
          const chunk = generator.generateChunk(cx, cy, cz, job.chunkSize);
          chunkCount++;
          if (chunk.totalBlocks === 0) continue;

          blockCount += chunk.totalBlocks;
          batch.push(chunk);
          if (batch.length >= batchChunkLimit) {
            postMessage({
              type: 'ring-batch',
              stageId: job.stageId,
              chunks: batch,
            });
            batch = [];
            await waitForBatchAck(job.stageId);
          }
        }
      }
    }

    if (batch.length > 0) {
      postMessage({
        type: 'ring-batch',
        stageId: job.stageId,
        chunks: batch,
      });
      await waitForBatchAck(job.stageId);
    }

    postMessage({
      type: 'stage-complete',
      stageId: job.stageId,
      chunkCount,
      blockCount,
      generationTimeMs: snapshot.stats.generationTimeMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    postMessage({
      type: 'stage-error',
      stageId: job.stageId,
      message,
    });
  } finally {
    running = false;
  }
}

parentPort?.on('message', (message: WorkerInput) => {
  if (message.type === 'batch-applied') {
    if (pendingAck && pendingAck.stageId === message.stageId) {
      const resolve = pendingAck.resolve;
      pendingAck = null;
      resolve();
    }
    return;
  }

  void runStage(message);
});
