import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';
import { layer, source } from '@collmot/ol-react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Image from '@material-ui/icons/Image';
import Skeleton from '@material-ui/lab/Skeleton';

import FileButton from '~/components/FileButton';
import {
  LatitudeField,
  LongitudeField,
  HeadingField,
  TextField,
} from '~/components/forms';
import { setLayerParametersById } from '~/features/map/layers';
import { getMapViewCenterPosition } from '~/selectors/map';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { toRadians } from '~/utils/math';

const getFileAsBase64 = async (file) =>
  new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
      resolve(fileReader.result);
    });
    fileReader.readAsDataURL(file);
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
        position: {
          lon: mapViewCenterPosition[0].toFixed(6),
          lat: mapViewCenterPosition[1].toFixed(6),
        },
        angle: 0,
        scale: 1,
      });
    }
  });

  return (
    <Form
      initialValues={{ ...parameters.transform }}
      onSubmit={updateTransform}
    >
      {({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
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
              <span>{parameters.image.name}</span>
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
              inputProps={{ min: 0.1, max: 10, step: 0.1 }}
              margin='dense'
              name='scale'
              label='Scale'
              variant='filled'
            />
          </Box>
          <div style={{ textAlign: 'center', paddingTop: '1em' }}>
            <Button variant='contained' type='submit'>
              Update transformation
            </Button>
          </div>
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
      dispatch(
        setLayerParametersById(ownProps.layerId, {
          image: {
            data: await getFileAsBase64(file),
            name: file.name,
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
        imageScale={scale}
      />
    </layer.GeoImage>
  ) : null;

ImageLayerPresentation.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number,
};

export const ImageLayer = ImageLayerPresentation;
