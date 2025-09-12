import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import { Checkboxes, TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { Form, FormSpy } from 'react-final-form';
import { connect } from 'react-redux';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import { updateFeatureAttributes } from '~/features/map-features/slice';
import { getGeofencePolygonId } from '~/features/mission/selectors';
import { clearGeofencePolygonId } from '~/features/mission/slice';
import Fence from '~/icons/PlacesFence';
import { FeatureType } from '~/model/features';
import { createValidator, optional, positive } from '~/utils/validation';

// PERF: Optimize this, it has lots of unnecessary recomputes
const FeatureAttributesForm = ({
  clearGeofencePolygonId,
  feature,
  isGeofence,
  onSetFeatureAttributes,
}) => {
  switch (feature.type) {
    case FeatureType.POLYGON: {
      if (isGeofence) {
        return (
          <BackgroundHint
            icon={<Fence />}
            header='This feature is the current geofence'
            text='It cannot be used as an exclusion zone at the same time'
            button={<Button onClick={clearGeofencePolygonId}>Clear</Button>}
          />
        );
      }

      return (
        <Form
          initialValues={feature.attributes}
          validate={createValidator({
            minAltitude: optional(positive),
            maxAltitude: optional(positive),
          })}
          onSubmit={({ isExclusionZone, minAltitude, maxAltitude }) => {
            onSetFeatureAttributes({
              isExclusionZone,
              minAltitude: Number(minAltitude) || undefined,
              maxAltitude: Number(maxAltitude) || undefined,
            });
          }}
        >
          {({ form, values }) => (
            <div>
              <Checkboxes
                name='isExclusionZone'
                data={{ label: 'Exclusion zone' }}
              />
              <FormHelperText style={{ marginTop: -8, marginBottom: 8 }}>
                Treat this polygon as an obstacle marker that should be excluded
                from the mission zone during planning and avoided while flying.
              </FormHelperText>

              <TextField
                name='minAltitude'
                label='Min AGL altitude'
                disabled={!values.isExclusionZone}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>m</InputAdornment>
                    ),
                    inputProps: {
                      inputMode: 'numeric',
                    },
                  },
                }}
              />
              <FormHelperText style={{ marginBottom: 8 }}>
                Distance of the top of the obstacle measured from the ground.
                UAVs should fly above this altitude limit to avoid collision.
              </FormHelperText>

              <TextField
                name='maxAltitude'
                label='Max AGL altitude'
                disabled={!values.isExclusionZone}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>m</InputAdornment>
                    ),
                    inputProps: {
                      inputMode: 'numeric',
                    },
                  },
                }}
              />
              <FormHelperText style={{ marginBottom: 8 }}>
                Distance of the bottom of the obstacle measured from the ground.
                UAVs should fly below this altitude limit to avoid collision.
              </FormHelperText>

              {/* HACK: Forms are not meant to be used like this... */}
              <FormSpy
                subscription={{ values: true }}
                onChange={() => form.submit()}
              />
            </div>
          )}
        </Form>
      );
    }

    default: {
      return (
        <BackgroundHint text="This feature type doesn't support attributes." />
      );
    }
  }
};

FeatureAttributesForm.propTypes = {
  clearGeofencePolygonId: PropTypes.func,
  feature: PropTypes.object.isRequired,
  isGeofence: PropTypes.bool,
  onSetFeatureAttributes: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state, { featureId }) => ({
    isGeofence: getGeofencePolygonId(state) === featureId,
  }),
  // mapDispatchToProps
  (dispatch, { featureId }) => ({
    clearGeofencePolygonId: () => dispatch(clearGeofencePolygonId()),
    onSetFeatureAttributes(attributes) {
      dispatch(updateFeatureAttributes({ id: featureId, attributes }));
    },
  })
)(FeatureAttributesForm);
