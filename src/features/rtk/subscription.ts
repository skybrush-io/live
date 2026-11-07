import { useEffect, useSyncExternalStore } from 'react';

/**
 * Number of mounted components that currently need up-to-date RTK status
 * information from the server. Kept outside of Redux because it is transient
 * UI bookkeeping that must never be persisted.
 */
let subscriberCount = 0;

const listeners = new Set<() => void>();

const setSubscriberCount = (value: number) => {
  subscriberCount = value;
  for (const listener of listeners) {
    listener();
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const hasSubscribers = () => subscriberCount > 0;

/**
 * Hook that declares that the calling component needs periodic RTK status
 * updates from the server while it is mounted and the hook is enabled.
 */
export const useRTKStatusSubscription = (enabled = true) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    setSubscriberCount(subscriberCount + 1);
    return () => {
      setSubscriberCount(subscriberCount - 1);
    };
  }, [enabled]);
};

/**
 * Hook that returns whether there is at least one component that needs
 * periodic RTK status updates from the server.
 */
export const useHasRTKStatusSubscribers = () =>
  useSyncExternalStore(subscribe, hasSubscribers);
