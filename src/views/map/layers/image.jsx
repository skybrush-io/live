import { Base64 } from 'js-base64';
import isEqual from 'lodash-es/isEqual';
import { getPointResolution, transformExtent } from 'ol/proj';
import { fromEPSGCode, register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef } from 'react';
import { Form, FormSpy } from 'react-final-form';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { layer, source } from '@collmot/ol-react';

import Image from '@mui/icons-material/Image';
import Navigation from '@mui/icons-material/Navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';

import FileButton from '~/components/FileButton';
import {
  HeadingField,
  LatitudeField,
  LongitudeField,
  TextField,
  forceFormSubmission,
} from '~/components/forms';
import { setLayerParametersById } from '~/features/map/layers';
import { isDeveloperModeEnabled } from '~/features/session/selectors';
import { getMapViewCenterPosition } from '~/selectors/map';
import { mapReferenceRequestSignal, mapViewToExtentSignal } from '~/signals';
import { readFileAsDataURL } from '~/utils/files';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { toRadians } from '~/utils/math';
import { finite, join, positive, required } from '~/utils/validation';

// TODO: Do this initialization call in a more appropriate part of the codebase!
register(proj4);

// NOTE: This is more like a quick and dirty solution for a specific use case
//       rather than a proper generic data url to blob converter, so I defined
//       it here locally instead of putting it into a shared utility file.
const base64DataURLToBlob = (base64DataURL) => {
  // NOTE: `fetch` cannot be used due to the limit on the length of the URL
  // const blob = await fetch(image.data).then((response) => response.blob());
  const base64DataURLPattern = /^data:(?<type>.*?);base64,(?<data>.*)$/;
  const { type, data } = base64DataURL.match(base64DataURLPattern).groups;
  // NOTE: Alternative in case we would like to drop the `Base64` dependency:
  // const part = Uint8Array.from(window.atob(data), (m) => m.codePointAt(0));
  return new Blob([Base64.toUint8Array(data)], { type });
};

const getDimensions = async (source) =>
  new Promise((resolve) => {
    const image = new window.Image();
    image.addEventListener('load', () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    });
    image.src = source;
  });

const ImageLayerSettingsPresentation = ({
  layer: { id, parameters },
  mapViewCenterPosition,
  selectImage,
  updateTransform,
}) => {
  const { t } = useTranslation();

  const inputRef = useRef();
  const handleClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  useEffect(() => {
    if (!parameters.transform.position) {
      updateTransform({
        ...parameters.transform,
        position: {
          lon: mapViewCenterPosition[0].toFixed(6),
          lat: mapViewCenterPosition[1].toFixed(6),
        },
      });
    }
  });

  const _forceFormSubmission = useCallback(() => {
    forceFormSubmission('ImageTransformEditor');
  }, []);

  const filePicker = (
    <>
      <FileButton
        ref={inputRef}
        filter={['image/*']}
        variant='contained'
        startIcon={<Image />}
        onSelected={selectImage}
      >
        {t('general.action.select')}
      </FileButton>
      <Box sx={{ p: 0.75 }} />
      {parameters.image.name ? (
        <>
          <span>{parameters.image.name}</span>
          {parameters.image.dimensions && (
            <span style={{ fontStyle: 'italic' }}>
              {parameters.image.dimensions.width}&nbsp;×&nbsp;
              {parameters.image.dimensions.height}&nbsp;px
            </span>
          )}
        </>
      ) : (
        t('ImageLayer.selectImage')
      )}
    </>
  );

  const isGeoTIFF = parameters.image.data.startsWith('data:image/tiff');

  const navigateToGeoTIFFLocation = useCallback(() => {
    mapReferenceRequestSignal.dispatch(async (map) => {
      const source = map
        .getLayers()
        .getArray()
        .find((l) => l.get('id') === id)
        ?.getSource?.();
      if (source) {
        const projection = await fromEPSGCode(source.getProjection().getCode());
        const view = await source.getView();
        mapViewToExtentSignal.dispatch(
          transformExtent(view.extent, projection, 'EPSG:3857')
        );
      }
    });
  }, [id]);

  return (
    <>
      <Collapse in={!isGeoTIFF}>
        <Form
          initialValues={{ ...parameters.transform }}
          onSubmit={updateTransform}
        >
          {({ handleSubmit, values }) => (
            <form id='ImageTransformEditor' onSubmit={handleSubmit}>
              <FormSpy
                subscription={{ values: true }}
                onChange={({ values: newValues }) => {
                  if (!isEqual(values, newValues)) {
                    _forceFormSubmission();
                  }
                }}
              />
              <Grid container spacing={1}>
                <Grid
                  size={6}
                  display='flex'
                  justifyContent='center'
                  alignItems='center'
                >
                  {parameters.image.name ? (
                    <img
                      src={parameters.image.data}
                      style={{
                        width: '100%',
                        height: '10em',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <Skeleton
                      variant='rectangular'
                      width='100%'
                      height='10em'
                      onClick={handleClick}
                    />
                  )}
                </Grid>
                <Grid
                  size={6}
                  display='flex'
                  flexDirection='column'
                  justifyContent='center'
                  alignItems='center'
                >
                  {filePicker}
                </Grid>
                <Grid size={6}>
                  <LatitudeField
                    size='small'
                    name='position.lat'
                    label={t('general.geography.latitude')}
                  />
                </Grid>
                <Grid size={6}>
                  <LongitudeField
                    size='small'
                    name='position.lon'
                    label={t('general.geography.longitude')}
                  />
                </Grid>
                <Grid size={6}>
                  <HeadingField
                    size='small'
                    name='angle'
                    label={t('general.geometry.angle')}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    type='number'
                    fieldProps={{
                      validate: join([required, finite, positive]),
                    }}
                    slotProps={{
                      htmlInput: { step: 0.1 },
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>cm/px</InputAdornment>
                        ),
                      },
                    }}
                    size='small'
                    name='scale'
                    label={t('general.geometry.scale')}
                    variant='filled'
                  />
                </Grid>
              </Grid>
              <input hidden type='submit' />
            </form>
          )}
        </Form>
      </Collapse>
      <Collapse in={isGeoTIFF}>
        <Grid container spacing={1}>
          <Grid
            size={6}
            display='flex'
            justifyContent='center'
            alignItems='center'
          >
            <Button
              variant='contained'
              endIcon={<Navigation />}
              onClick={navigateToGeoTIFFLocation}
            >
              {t('general.action.navigate')}
            </Button>
          </Grid>
          <Grid
            size={6}
            display='flex'
            flexDirection='column'
            justifyContent='center'
            alignItems='center'
          >
            {filePicker}
          </Grid>
          <Grid size={12}>
            <Alert severity='warning'>
              {t('ImageLayer.geoTIFFOnlyInDevMode')}
            </Alert>
          </Grid>
        </Grid>
      </Collapse>
    </>
  );
};

ImageLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  mapViewCenterPosition: PropTypes.arrayOf(PropTypes.number),
  selectImage: PropTypes.func,
  updateTransform: PropTypes.func,
};

export const ImageLayerSettings = connect(
  // mapStateToProps
  (state) => ({
    mapViewCenterPosition: getMapViewCenterPosition(state),
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    async selectImage(file) {
      // TODO: use `localforage` to persistently store images
      //       as blobs and `URL.createOjectURL` to load them?
      const data = await readFileAsDataURL(file);
      dispatch(
        setLayerParametersById(ownProps.layerId, {
          image: {
            data,
            name: file.name,
            dimensions: data.startsWith('data:image/tiff')
              ? undefined
              : await getDimensions(data),
          },
        })
      );
    },
    updateTransform(transform) {
      dispatch(
        setLayerParametersById(ownProps.layerId, {
          transform: {
            position: {
              lon: Number(transform.position.lon),
              lat: Number(transform.position.lat),
            },
            angle: Number(transform.angle),
            scale: Number(transform.scale),
          },
        })
      );
    },
  })
)(ImageLayerSettingsPresentation);

const ImageLayerPresentation = ({
  devMode,
  layer: {
    id,
    parameters: {
      image,
      transform: { position, angle, scale },
    },
  },
  zIndex,
}) =>
  image.data.startsWith('data:image/tiff') ? (
    devMode && (
      <layer.WebGLTile properties={{ id }} zIndex={zIndex}>
        <source.GeoTIFF sources={[{ blob: base64DataURLToBlob(image.data) }]} />
      </layer.WebGLTile>
    )
  ) : position ? (
    <layer.GeoImage zIndex={zIndex}>
      <source.GeoImage
        url={image.data}
        imageCenter={mapViewCoordinateFromLonLat([position.lon, position.lat])}
        imageRotate={toRadians(angle)}
        imageScale={
          scale / // Scale is given by the user in cm / px
          getPointResolution(
            'EPSG:3857',
            100, // One meter needs 100 divisions to get cm as resolution
            mapViewCoordinateFromLonLat([position.lon, position.lat])
          )
        }
      />
    </layer.GeoImage>
  ) : null;

ImageLayerPresentation.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number,
};

export const ImageLayer = connect(
  // mapStateToProps
  (state) => ({
    devMode: isDeveloperModeEnabled(state),
  }),
  // mapDispatchToProps
  null
)(ImageLayerPresentation);
