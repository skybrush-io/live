import type { MissionIndex } from '~/model/missions';
import type { Identifier } from '~/utils/collections';

export type ResolvedDrone = {
  missionIndex: MissionIndex | null;
  uavId: Identifier;
};

export type SlotState = {
  filterText: string;
  resolved: ResolvedDrone | null;
};

export type PreviewBadgeColor = 'added' | 'removed' | 'slot';

export type PreviewBadge = {
  color?: PreviewBadgeColor;
  label: string;
};

export type PreviewLine = {
  badges: Record<string, PreviewBadge>;
  i18nKey: string;
};

export type PreviewState =
  | { kind: 'blocked'; message: string }
  | { kind: 'placeholder'; message: string }
  | { kind: 'ready'; lines: PreviewLine[] }
  | { kind: 'warning'; message: string };
