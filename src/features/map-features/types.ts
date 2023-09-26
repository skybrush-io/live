import { type LabelStyle } from '~/model/features';
import { type Identifier } from '~/utils/collections';

export enum FeatureEditorTab {
  GENERAL = 'general',
  // POINTS = 'points',
}

export type FeatureProperties = {
  color?: string;
  filled: boolean;
  id: Identifier;
  label?: string;
  labelStyle?: LabelStyle;
  measure: boolean;
  showPoints: boolean;
  visible: boolean;
};
