import type { DebugState } from "./types";

type Listener = (state: DebugState) => void;

let state: DebugState = {};
const listeners = new Set<Listener>();

export function getDebugState() {
  return state;
}

export function setDebugState(next: DebugState) {
  state = next;
  listeners.forEach((listener) => listener(state));
}

export function subscribeDebugState(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
