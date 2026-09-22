import type { Layer as OLLayer } from 'ol/layer';

import { setLayerEditable, setLayerSelectable } from '~/model/layers';

type MaybeLayerRef = { layer: OLLayer } | undefined | null;

export function noMark(_layer?: MaybeLayerRef) {
  // do nothing
}

export function markAsSelectable(layer?: MaybeLayerRef) {
  if (layer) {
    setLayerSelectable(layer.layer);
  }
}

export function markAsSelectableAndEditable(layer?: MaybeLayerRef) {
  if (layer) {
    setLayerEditable(layer.layer);
    setLayerSelectable(layer.layer);
  }
}
