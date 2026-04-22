import { EventEmitter } from "node:events";

type RealtimeEvent = {
  type: string;
  payload: Record<string, unknown>;
  at: string;
};

const globalRealtime = globalThis as typeof globalThis & {
  __smallbusRealtimeEmitter?: EventEmitter;
};

const emitter = globalRealtime.__smallbusRealtimeEmitter ?? new EventEmitter();
if (!globalRealtime.__smallbusRealtimeEmitter) {
  emitter.setMaxListeners(50);
  globalRealtime.__smallbusRealtimeEmitter = emitter;
}

const EVENT_NAME = "smallbus:event";

export function emitRealtime(type: string, payload: Record<string, unknown>) {
  const event: RealtimeEvent = {
    type,
    payload,
    at: new Date().toISOString()
  };

  emitter.emit(EVENT_NAME, event);
}

export function onRealtimeEvent(listener: (event: RealtimeEvent) => void) {
  emitter.on(EVENT_NAME, listener);
  return () => {
    emitter.off(EVENT_NAME, listener);
  };
}
