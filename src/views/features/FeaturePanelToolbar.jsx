import GeoJSON from 'ol/format/GeoJSON';
import PropTypes from 'prop-types';
import React from 'react';
import { batch, connect } from 'react-redux';
import readShapeFile from 'shpjs';

import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';

import FolderOpen from '@material-ui/icons/FolderOpen';

import FileButton from '~/components/FileButton';
import { addFeatureWithName } from '~/features/map-features/actions';
import { showError, showNotification } from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';
import { createFeatureFromOpenLayers } from '~/model/openlayers';
import { readFileAsArrayBuffer } from '~/utils/files';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      background: theme.palette.action.hover,
      padding: theme.spacing(0, 1),
    },
  }),
  {
    name: 'FeaturePanelToolbar',
  }
);

const FeaturePanelToolbar = ({ importShapeFile }) => {
  const classes = useStyles();
  return (
    <Paper square className={classes.root} elevation={4}>
      <Toolbar
        disableGutters
        variant='dense'
        style={{ height: 36, minHeight: 36 }}
      >
        <FileButton
          size='small'
          filter={['application/zip']}
          startIcon={<FolderOpen />}
          onSelected={importShapeFile}
        >
          Import shapefile
        </FileButton>
      </Toolbar>
    </Paper>
  );
};

FeaturePanelToolbar.propTypes = {
  importShapeFile: PropTypes.func,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch) => ({
    async importShapeFile(file) {
      try {
        const data = await readFileAsArrayBuffer(file);
        // Force the result to be in an array, even if it's just a single element.
        const featureCollections = [await readShapeFile(data)].flat();
        const geoJSON = new GeoJSON({ featureProjection: 'EPSG:3857' });

        let counter = 0;

        batch(() => {
          for (const featureCollection of featureCollections) {
            const parsedFeatures = geoJSON
              .readFeatures(featureCollection)
              .flatMap((feature) => createFeatureFromOpenLayers(feature));
            for (const [i, feature] of parsedFeatures.entries()) {
              const suffix = i === 0 ? '' : ` (${i})`;
              dispatch(
                addFeatureWithName(
                  { ...feature, label: featureCollection.fileName + suffix },
                  featureCollection.fileName
                )
              );
              counter++;
            }
          }
        });

        dispatch(
          showNotification({
            message:
              // TODO: Use the `pluralize` package?
              `Successfully imported ${counter} feature${
                counter > 1 ? 's' : ''
              }`,

            semantics: MessageSemantics.SUCCESS,
          })
        );
      } catch (error) {
        dispatch(showError(`Error while importing shapefile: ${error}`));
      }
    },
  })
)(FeaturePanelToolbar);
