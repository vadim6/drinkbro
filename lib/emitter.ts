import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var __orderEmitter: EventEmitter | undefined;
}

export const orderEmitter: EventEmitter =
  globalThis.__orderEmitter ??
  (globalThis.__orderEmitter = new EventEmitter());

orderEmitter.setMaxListeners(200);
