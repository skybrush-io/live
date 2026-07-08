import type { FeatureName } from '~/utils/configuration';

export type ComponentRegistryEntry = {
  component: React.ComponentType<any>;
  label?: string;
  detachable?: boolean;
  feature?: FeatureName;
};

export type ComponentRegistry = Record<string, ComponentRegistryEntry>;
