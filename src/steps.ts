export type Steps<T> = Generator<void, T, void>;

export interface SliceOptions {
  readonly sliceMs?: number;
  readonly yieldToHost?: () => Promise<void>;
}

const DEFAULT_SLICE_MS = 8;

/**
 * Runs a step generator to the end without pausing.
 * @param steps - The generator to run.
 * @returns The value it returns.
 */
export function runSync<T>(steps: Steps<T>): T {
  let result = steps.next();
  while (!result.done) result = steps.next();
  return result.value;
}

/**
 * Runs a step generator in short slices, handing control back to the host between slices.
 * @param steps - The generator to run.
 * @param options - The slice length in milliseconds, and how to yield to the host.
 * @returns A promise of the value the generator returns.
 */
export async function runInSlices<T>(steps: Steps<T>, options: SliceOptions = {}): Promise<T> {
  const sliceMs = options.sliceMs ?? DEFAULT_SLICE_MS;
  const yieldToHost = options.yieldToHost ?? defaultYieldToHost;
  let sliceStart = Date.now();
  let result = steps.next();
  while (!result.done) {
    if (Date.now() - sliceStart >= sliceMs) {
      await yieldToHost();
      sliceStart = Date.now();
    }
    result = steps.next();
  }
  return result.value;
}

/**
 * Waits for the next turn of the event loop.
 * @returns A promise resolved by a zero delay timer.
 */
function defaultYieldToHost(): Promise<void> {
  const timers = globalThis as { setTimeout?: (callback: () => void, ms: number) => unknown };
  if (!timers.setTimeout) return Promise.resolve();
  const setTimer = timers.setTimeout;
  return new Promise((resolve) => setTimer(resolve, 0));
}
