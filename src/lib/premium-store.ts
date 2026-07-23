import { useSyncExternalStore } from "react";

let isPremium = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setPremium(v: boolean) {
  isPremium = v;
  emit();
}

export function getPremium() {
  return isPremium;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useIsPremium() {
  return useSyncExternalStore(
    subscribe,
    () => isPremium,
    () => false,
  );
}
