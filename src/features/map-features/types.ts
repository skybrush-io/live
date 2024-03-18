import { type LabelStyle } from '~/model/features';
import { type Identifier } from '~/utils/collections';

export enum FeatureEditorDialogTab {
  GENERAL = 'general',
  ATTRIBUTES = 'attributes',
  POINTS = 'points',
}

export const featureEditorDialogTabs = [
  FeatureEditorDialogTab.GENERAL,
  FeatureEditorDialogTab.ATTRIBUTES,
  // FeatureEditorDialogTab.POINTS,
];

export const labelForFeatureEditorDialogTab: Record<
  FeatureEditorDialogTab,
  string
> = {
  [FeatureEditorDialogTab.GENERAL]: 'General',
  [FeatureEditorDialogTab.ATTRIBUTES]: 'Attributes',
  [FeatureEditorDialogTab.POINTS]: 'Points',
};

export type FeatureProperties = {
  attributes?: Record<string, unknown>;
  color?: string;
  filled: boolean;
  id: Identifier;
  label?: string;
  labelStyle?: LabelStyle;
  measure: boolean;
  showPoints: boolean;
  visible: boolean;
};
