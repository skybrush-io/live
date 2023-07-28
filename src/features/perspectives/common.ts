import { type PerspectiveName, type PerspectiveObject } from 'perspective';

/* Object holding well-known panel layouts that may potentially be used in
 * multiple configuration files. Perspective configurations may refer to these
 * by their names only */
const commonLayouts: Record<PerspectiveName, PerspectiveObject> = {
  default: {
    label: 'Default',
    layout: {
      type: 'columns',
      contents: [
        {
          type: 'stack',
          contents: [
            { type: 'panel', component: 'map', id: 'map' },
            { type: 'panel', component: 'uav-list', id: 'uavs' },
            { type: 'panel', component: 'three-d-view', id: 'threeDView' },
          ],
        },
        {
          type: 'rows',
          contents: [
            {
              type: 'stack',
              contents: [
                { type: 'panel', component: 'lcd-clock-panel', id: 'clocks' },
                {
                  type: 'panel',
                  component: 'saved-location-list',
                  id: 'locations',
                },
                { type: 'panel', component: 'layer-list', id: 'layers' },
              ],
              height: 25,
            },
            {
              type: 'stack',
              contents: [
                { type: 'panel', component: 'show-control', id: 'show' },
                { type: 'panel', component: 'light-control', id: 'lights' },
              ],
            },
          ],
          width: 25,
        },
      ],
    },
  },
};

export default commonLayouts;
