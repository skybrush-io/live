import React from 'react';

import { ThreeDInteractionMode } from '~/features/three-d/types';

import ThreeDTopLevelView from './ThreeDTopLevelView';

export default function PathGeneratorTopLevelView() {
  return (
    <ThreeDTopLevelView
      forcedInteractionMode={ThreeDInteractionMode.CREATE}
      hideInteractionModeToggle
    />
  );
}
