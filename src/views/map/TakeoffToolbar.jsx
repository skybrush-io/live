import config from 'config';

import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Field, Form } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import { withTranslation } from 'react-i18next';

import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';

import partial from 'lodash-es/partial';
import { connect } from 'react-redux';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  getSelectedTool,
  getTakeoffGridProperties,
  setSelectedTool,
  setTakeoffGridProperties,
} from '~/features/map/tools';
import { tt } from '~/i18n';

import { Tool } from './tools';
import {
  Add,
  Delete,
  FontDownload,
  GridOn,
  LinkOff,
  Link,
  Lock,
  LockOpen,
  Replay,
} from '@material-ui/icons';
import { toggleHomePositionsLocked } from '~/features/mission/slice';
import {
  Checkbox,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Popover,
  Typography,
} from '@material-ui/core';
import { TextField } from 'mui-rff';

const TakeoffGridPropertiesForm = ({
  anchorEl,
  setAnchorEl,
  takeoffGridProperties,
  setTakeoffGridProperties,
}) => (
  <Form
    onSubmit={setTakeoffGridProperties}
    mutators={{ ...arrayMutators }}
    initialValues={takeoffGridProperties}
    render={({ handleSubmit, form, values }) => (
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ style: { marginTop: 4 } }}
        onClose={() => {
          form.submit();
          setAnchorEl();
        }}
      >
        <form onSubmit={handleSubmit}>
          <FieldArray name='subgrids'>
            {({ fields }) => (
              <List dense disablePadding>
                {fields?.map((name, index) => (
                  <ListItem key={name}>
                    <ListItemIcon style={{ minWidth: 32 }}>
                      <GridOn />
                    </ListItemIcon>
                    <Box
                      display='grid'
                      gap='4px 0px'
                      gridTemplateColumns='60px 75px 40px 75px'
                      gridTemplateAreas={`
                        '.......... xLabel ......... yLabel'
                        'countLabel xCount countLink yCount'
                        'spaceLabel xSpace spaceLink ySpace'
                      `}
                      // TODO: Should just be `placeItems='center'`,
                      //       but MUI v4 doesn't seem to support it
                      alignItems='center'
                      justifyItems='center'
                    >
                      <Typography style={{ gridArea: 'xLabel' }}>X</Typography>
                      <Typography style={{ gridArea: 'yLabel' }}>Y</Typography>
                      <Typography style={{ gridArea: 'countLabel' }}>
                        Count
                      </Typography>
                      <TextField
                        name={`${name}.xCount`}
                        type='number'
                        fieldProps={{ parse: (v) => v.length > 0 && Number(v) }}
                        variant='outlined'
                        size='small'
                        style={{ gridArea: 'xCount' }}
                        inputProps={{
                          style: { appearance: 'textfield' },
                          min: 1,
                        }}
                      />
                      {/* TODO: Is `type="checkbox"` necessary? */}
                      <Field name={`${name}.linkCount`} type='checkbox'>
                        {({ input }) => (
                          <Checkbox
                            {...input}
                            icon={<LinkOff />}
                            checkedIcon={<Link />}
                            color='primary'
                            style={{ gridArea: 'countLink' }}
                          />
                        )}
                      </Field>
                      <TextField
                        name={`${name}.yCount`}
                        type='number'
                        fieldProps={{ parse: (v) => v.length > 0 && Number(v) }}
                        variant='outlined'
                        size='small'
                        style={{ gridArea: 'yCount' }}
                        inputProps={{
                          style: { appearance: 'textfield' },
                          min: 1,
                        }}
                      />

                      <Typography style={{ gridArea: 'spaceLabel' }}>
                        Space
                      </Typography>
                      <TextField
                        name={`${name}.xSpace`}
                        type='number'
                        fieldProps={{ parse: (v) => v.length > 0 && Number(v) }}
                        variant='outlined'
                        size='small'
                        style={{ gridArea: 'xSpace' }}
                        inputProps={{
                          style: { appearance: 'textfield' },
                          min: 0.1,
                          step: 0.1,
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>m</InputAdornment>
                          ),
                        }}
                      />
                      {/* TODO: Is `type="checkbox"` necessary? */}
                      <Field name={`${name}.linkSpace`} type='checkbox'>
                        {({ input }) => (
                          <Checkbox
                            {...input}
                            icon={<LinkOff />}
                            checkedIcon={<Link />}
                            color='primary'
                            style={{ gridArea: 'spaceLink' }}
                          />
                        )}
                      </Field>
                      <TextField
                        name={`${name}.ySpace`}
                        type='number'
                        fieldProps={{ parse: (v) => v.length > 0 && Number(v) }}
                        variant='outlined'
                        size='small'
                        style={{ gridArea: 'ySpace' }}
                        inputProps={{
                          style: { appearance: 'textfield' },
                          min: 0.1,
                          step: 0.1,
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>m</InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                    <ListItemSecondaryAction>
                      <IconButton
                        edge='end'
                        onClick={() => fields.remove(index)}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                <ListItem
                  button
                  onClick={() =>
                    fields.push({
                      xCount: 3,
                      yCount: 3,
                      linkCount: true,
                      xSpace: 1,
                      ySpace: 1,
                      linkSpace: true,
                    })
                  }
                >
                  <ListItemIcon style={{ minWidth: 42 }}>
                    <Add />
                  </ListItemIcon>
                  <ListItemText
                    primary='Add new subgrid'
                    primaryTypographyProps={{ align: 'center' }}
                  />
                </ListItem>
              </List>
            )}
          </FieldArray>

          {/* <pre>{JSON.stringify(values, 0, 2)}</pre> */}
        </form>
      </Popover>
    )}
  />
);

/**
 * Presentation component for the drawing toolbar.
 *
 * @return {React.Element} the rendered component
 */
const TakeoffToolbarPresentation = ({
  homePositionsLocked,
  toggleHomePositionsLocked,
  setTakeoffGridProperties,
  takeoffGridProperties,
  onToolSelected,
  selectedTool,
  t,
}) => {
  const colorForTool = (tool) =>
    selectedTool === tool ? 'primary' : undefined;

  const [anchorEl, setAnchorEl] = useState();

  return (
    <Box display='flex'>
      <Tooltip placement='bottom' content='Lock'>
        <IconButton onClick={toggleHomePositionsLocked}>
          {homePositionsLocked ? <Lock /> : <LockOpen />}
        </IconButton>
      </Tooltip>

      <Divider flexItem orientation='vertical' />

      <Tooltip placement='bottom' content='Reset'>
        <IconButton onClick={() => {}}>
          <Replay />
        </IconButton>
      </Tooltip>

      <Tooltip placement='bottom' content='Grid'>
        <IconButton
          onClick={partial(onToolSelected, Tool.TAKEOFF_GRID)}
          onContextMenu={(e) => {
            e.preventDefault();
            setAnchorEl(e.currentTarget);
          }}
        >
          <GridOn color={colorForTool(Tool.TAKEOFF_GRID)} />
        </IconButton>
      </Tooltip>

      <TakeoffGridPropertiesForm
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        takeoffGridProperties={takeoffGridProperties}
        setTakeoffGridProperties={setTakeoffGridProperties}
      />

      <Tooltip placement='bottom' content='Auto'>
        <IconButton onClick={() => {}}>
          <FontDownload />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

TakeoffToolbarPresentation.propTypes = {
  onToolSelected: PropTypes.func,
  selectedTool: PropTypes.string,
  takeoffGridProperties: PropTypes.object, // TODO:
  t: PropTypes.func,
};

/**
 * Takeoff toolbar on the map.
 */
const TakeoffToolbar = connect(
  // mapStateToProps
  (state) => ({
    homePositionsLocked: state.mission.homePositionsLocked,
    takeoffGridProperties: getTakeoffGridProperties(state),
    selectedTool: getSelectedTool(state),
  }),
  // mapDispatchToProps
  {
    toggleHomePositionsLocked,
    setTakeoffGridProperties,
    onToolSelected: setSelectedTool,
  }
)(withTranslation()(TakeoffToolbarPresentation));

export default TakeoffToolbar;
