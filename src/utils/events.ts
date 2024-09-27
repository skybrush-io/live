export type EventWithModifierKeys = Event & {
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
};

export const eventHasAltKey = (event: EventWithModifierKeys): boolean =>
  Boolean(event.altKey);

export const eventHasCtrlKey = (event: EventWithModifierKeys): boolean =>
  Boolean(event.ctrlKey);

export const eventHasMetaKey = (event: EventWithModifierKeys): boolean =>
  Boolean(event.metaKey);

export const eventHasShiftKey = (event: EventWithModifierKeys): boolean =>
  Boolean(event.shiftKey);
