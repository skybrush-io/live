import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ToolbarDivider from '~/components/ToolbarDivider';
import { selectMapSource } from '~/features/map/layers';
import { LayerType } from '~/model/layers';
import { Source, Sources } from '~/model/sources';

const NORMAL_MAP_SOURCE_PRIORITY = [
  Source.OSM,
  Source.MAPTILER.STREETS,
  Source.MAPTILER.BASIC,
  Source.MAPBOX.STATIC,
  Source.GOOGLE.ROADS,
  Source.GOOGLE.DEFAULT,
  Source.BING.ROAD,
  Source.STAMEN.TERRAIN,
];

const SATELLITE_MAP_SOURCE_PRIORITY = [
  Source.ESRI_WORLD_IMAGERY,
  Source.MAPBOX.SATELLITE,
  Source.MAPTILER.SATELLITE,
  Source.MAPTILER.HYBRID,
  Source.GOOGLE.SATELLITE,
  Source.BING.AERIAL_WITH_LABELS,
];

const findPreferredAvailableSource = (sourcePriority) =>
  sourcePriority.find((source) => Sources.includes(source));

const getBaseLayer = (layers) =>
  layers.order
    .map((layerId) => layers.byId[layerId])
    .find((layer) => layer?.type === LayerType.BASE);

const MapSourceToggleButton = ({
  baseLayerId,
  currentSource,
  mapSource,
  onSourceSelected,
  satelliteSource,
  t,
}) => {
  const handleChange = useCallback(
    (_event, value) => {
      if (!value) {
        return;
      }

      const source = value === 'satellite' ? satelliteSource : mapSource;
      if (source && source !== currentSource) {
        onSourceSelected(baseLayerId, source);
      }
    },
    [baseLayerId, currentSource, mapSource, onSourceSelected, satelliteSource]
  );

  if (!baseLayerId || !mapSource || !satelliteSource) {
    return null;
  }

  const value = SATELLITE_MAP_SOURCE_PRIORITY.includes(currentSource)
    ? 'satellite'
    : 'map';

  return (
    <>
      <ToolbarDivider orientation='vertical' />
      <ToggleButtonGroup
        exclusive
        size='small'
        value={value}
        onChange={handleChange}
        aria-label={t('mapSourceToggle.label')}
        sx={{ bgcolor: 'background.paper' }}
      >
        <ToggleButton value='map' aria-label={t('mapSourceToggle.map')}>
          {t('mapSourceToggle.map')}
        </ToggleButton>
        <ToggleButton
          value='satellite'
          aria-label={t('mapSourceToggle.satellite')}
        >
          {t('mapSourceToggle.satellite')}
        </ToggleButton>
      </ToggleButtonGroup>
      <ToolbarDivider orientation='vertical' />
    </>
  );
};

MapSourceToggleButton.propTypes = {
  baseLayerId: PropTypes.string,
  currentSource: PropTypes.string,
  mapSource: PropTypes.string,
  onSourceSelected: PropTypes.func.isRequired,
  satelliteSource: PropTypes.string,
  t: PropTypes.func.isRequired,
};

const ConnectedMapSourceToggleButton = connect(
  (state) => {
    const baseLayer = getBaseLayer(state.map.layers);
    return {
      baseLayerId: baseLayer?.id,
      currentSource: baseLayer?.parameters?.source,
      mapSource: findPreferredAvailableSource(NORMAL_MAP_SOURCE_PRIORITY),
      satelliteSource: findPreferredAvailableSource(
        SATELLITE_MAP_SOURCE_PRIORITY
      ),
    };
  },
  {
    onSourceSelected: (layerId, source) =>
      selectMapSource({ layerId, source }),
  }
)(MapSourceToggleButton);

export default withTranslation()(ConnectedMapSourceToggleButton);
