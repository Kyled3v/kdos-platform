/**
 * Every event the update lifecycle can emit, from the initial check
 * through completion, failure, or rollback.
 */
export enum UpdateEventType {
  CHECKING = "CHECKING",
  FOUND = "FOUND",
  DOWNLOADING = "DOWNLOADING",
  VERIFYING = "VERIFYING",
  INSTALLING = "INSTALLING",
  RESTARTING = "RESTARTING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  ROLLBACK_STARTED = "ROLLBACK_STARTED",
  ROLLBACK_COMPLETED = "ROLLBACK_COMPLETED",
}

/**
 * A single emitted update event.
 */
export interface UpdateEvent {
  readonly type: UpdateEventType;
  readonly message: string;
  readonly emittedAt: string;
}

export type UpdateEventListener = (event: UpdateEvent) => void;

/**
 * Contract for publishing and observing update events, so every update
 * component depends on this interface rather than a concrete emitter.
 */
export interface UpdateEventBus {
  emit(type: UpdateEventType, message: string): UpdateEvent;
  subscribe(type: UpdateEventType, listener: UpdateEventListener): string;
  unsubscribe(type: UpdateEventType, subscriptionId: string): void;
}

/**
 * In-process implementation of {@link UpdateEventBus}.
 */
export class UpdateEventEmitter implements UpdateEventBus {
  private readonly listeners: Map<UpdateEventType, Map<string, UpdateEventListener>>;
  private subscriptionCounter: number;

  constructor() {
    this.listeners = new Map();
    this.subscriptionCounter = 0;
  }

  emit(type: UpdateEventType, message: string): UpdateEvent {
    const event: UpdateEvent = { type, message, emittedAt: new Date().toISOString() };
    const typeListeners = this.listeners.get(type);

    if (typeListeners) {
      for (const listener of typeListeners.values()) {
        listener(event);
      }
    }

    return event;
  }

  subscribe(type: UpdateEventType, listener: UpdateEventListener): string {
    const subscriptionId = `update-event-${this.subscriptionCounter++}`;
    const typeListeners = this.listeners.get(type) ?? new Map<string, UpdateEventListener>();

    typeListeners.set(subscriptionId, listener);
    this.listeners.set(type, typeListeners);

    return subscriptionId;
  }

  unsubscribe(type: UpdateEventType, subscriptionId: string): void {
    const typeListeners = this.listeners.get(type);

    if (!typeListeners || !typeListeners.has(subscriptionId)) {
      throw new Error(`No subscription "${subscriptionId}" found for event type "${type}".`);
    }

    typeListeners.delete(subscriptionId);

    if (typeListeners.size === 0) {
      this.listeners.delete(type);
    }
  }
}