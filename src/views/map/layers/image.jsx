import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';
import { Form, FormSpy } from 'react-final-form';
import { connect } from 'react-redux';
import { usePrevious } from 'react-use';
import { getPointResolution } from 'ol/proj';
import { layer, source } from '@collmot/ol-react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Image from '@material-ui/icons/Image';
import InputAdornment from '@material-ui/core/InputAdornment';
import Skeleton from '@material-ui/lab/Skeleton';

import FileButton from '~/components/FileButton';
import {
  LatitudeField,
  LongitudeField,
  HeadingField,
  TextField,
  forceFormSubmission,
} from '~/components/forms';
import { setLayerParametersById } from '~/features/map/layers';
import { getMapViewCenterPosition } from '~/selectors/map';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { toRadians } from '~/utils/math';
import { finite, join, positive, required } from '~/utils/validation';

const AutoSaveOnBlur = ({ active, save }) => {
  const prevActive = usePrevious(active);
  if (prevActive && prevActive !== active) {
    setTimeout(save, 0);
  }

  return null;
};

AutoSaveOnBlur.propTypes = {
  active: PropTypes.string,
  save: PropTypes.func,
};

const getFileAsBase64 = async (file) =>
  new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
      resolve(fileReader.result);
    });
    fileReader.readAsDataURL(file);
  });

const getDimensions = async (source) =>
  new Promise((resolve) => {
    const image = new window.Image();
    image.addEventListener('load', () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    });
    image.src = source;
  });

const ImageLayerSettingsPresentation = ({
  layer: { parameters },
  mapViewCenterPosition,
  selectImage,
  updateTransform,
}) => {
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

  return (
    <Form
      initialValues={{ ...parameters.transform }}
      onSubmit={updateTransform}
    >
      {({ handleSubmit }) => (
        <form id='ImageTransformEditor' onSubmit={handleSubmit}>
          <FormSpy
            subscription={{ active: true, values: true }}
            component={AutoSaveOnBlur}
            save={_forceFormSubmission}
          />
          <Box display='flex' flexDirection='row'>
            {parameters.image.name ? (
              <img
                src={parameters.image.data}
                style={{
                  width: '100%',
                  minWidth: '0', // Not needed in Firefox, not quite sure why.
                  height: '10em',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <Skeleton
                variant='rect'
                width='100%'
                height='10em'
                onClick={handleClick}
              />
            )}
            <Box p={0.75} />
            <Box textAlign='center' margin='auto' width='100%'>
              <FileButton
                ref={inputRef}
                filter={['image/*']}
                variant='contained'
                startIcon={<Image />}
                onSelected={selectImage}
              >
                Select
              </FileButton>
              <Box p={0.75} />
              {parameters.image.name ? (
                <>
                  <span>{parameters.image.name}</span>
                  <br />
                  <span style={{ fontStyle: 'italic' }}>
                    {parameters.image.dimensions.width}&nbsp;×&nbsp;
                    {parameters.image.dimensions.height}&nbsp;px
                  </span>
                </>
              ) : (
                'Please select an image!'
              )}
            </Box>
          </Box>
          <Box display='flex' flexDirection='row'>
            <LatitudeField
              fullWidth
              margin='dense'
              name='position.lat'
              label='Latitude of center'
            />
            <Box p={0.75} />
            <LongitudeField
              fullWidth
              margin='dense'
              name='position.lon'
              label='Longitude of center'
            />
          </Box>
          <Box display='flex' flexDirection='row'>
            <HeadingField fullWidth margin='dense' name='angle' label='Angle' />
            <Box p={0.75} />
            <TextField
              fullWidth
              type='number'
              inputProps={{ step: 0.1 }}
              fieldProps={{ validate: join([required, finite, positive]) }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>cm/px</InputAdornment>
                ),
              }}
              margin='dense'
              name='scale'
              label='Scale'
              variant='filled'
            />
          </Box>
          <input type='submit' hidden />
        </form>
      )}
    </Form>
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
      const data = await getFileAsBase64(file);
      dispatch(
        setLayerParametersById(ownProps.layerId, {
          image: {
            data,
            name: file.name,
            dimensions: await getDimensions(data),
          },
        })
      );
    },
    updateTransform(transform) {
      const parsedTransform = {
        position: {
          lon: Number(transform.position.lon),
          lat: Number(transform.position.lat),
        },
        angle: Number(transform.angle),
        scale: Number(transform.scale),
      };
      dispatch(
        setLayerParametersById(ownProps.layerId, {
          transform: parsedTransform,
        })
      );
    },
  })
)(ImageLayerSettingsPresentation);

const ImageLayerPresentation = ({
  layer: {
    parameters: {
      image,
      transform: { position, angle, scale },
    },
  },
  zIndex,
}) =>
  position ? (
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

export const ImageLayer = ImageLayerPresentation;
