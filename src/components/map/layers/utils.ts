import type { Layer as OLLayer } from 'ol/layer';

import { setLayerSelectable } from '~/model/layers';

export function markAsSelectable(layer?: { layer: OLLayer } | null) {
  if (layer) {
    setLayerSelectable(layer.layer);
  }
}
