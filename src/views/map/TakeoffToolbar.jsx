import config from 'config';

import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import { Field, Form } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import { withTranslation } from 'react-i18next';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import clsx from 'clsx';
import createDecorator from 'final-form-calculate';

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
  DragHandle,
} from '@material-ui/icons';
import { toggleHomePositionsLocked } from '~/features/mission/slice';
import {
  Checkbox,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  Popover,
  Typography,
} from '@material-ui/core';
import { TextField } from 'mui-rff';

const DEFAULT_SUBGRID = {
  xCount: 3,
  yCount: 3,
  linkCount: true,
  xSpace: 1,
  ySpace: 1,
  linkSpace: true,
};

const makeOnDragEndFunction = (fields) => (result) => {
  if (result.destination) {
    fields.move(result.source.index, result.destination.index);
  }
};

const useStyles = makeStyles((theme) => ({
  dragged: { background: theme.palette.action.hover },
}));

const decorator = createDecorator(
  {
    field: /(subgrids\[\d+].linkCount)|(subgrids\[\d+].xCount)/,
    updates(_value, name, allValues) {
      const index = Number(
        name.match(/subgrids\[(?<index>\d+)]/).groups?.index
      );
      return allValues.subgrids[index].linkCount
        ? {
            [`subgrids[${index}].yCount`]: allValues.subgrids[index].xCount,
          }
        : {};
    },
  },
  {
    field: /(subgrids\[\d+].linkSpace)|(subgrids\[\d+].xSpace)/,
    updates(_value, name, allValues) {
      const index = Number(
        name.match(/subgrids\[(?<index>\d+)]/).groups?.index
      );
      return allValues.subgrids[index].linkSpace
        ? {
            [`subgrids[${index}].ySpace`]: allValues.subgrids[index].xSpace,
          }
        : {};
    },
  }
);

const TakeoffSubgridProperties = ({
  fields,
  index,
  name,
  provided,
  snapshot,
}) => {
  const classes = useStyles();
  return (
    <ListItem
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={clsx(snapshot.isDragging && classes.dragged)}
      style={{
        ...provided.draggableProps.style,
      }}
    >
      <Box
        display='grid'
        gap='4px 0px'
        gridTemplateColumns='32px 60px 75px 40px 75px'
        gridTemplateAreas={`
        '.......... .......... xLabel ......... yLabel'
        'dragHandle countLabel xCount countLink yCount'
        'removeIcon spaceLabel xSpace spaceLink ySpace'
      `}
        // TODO: Should just be `placeItems='center'`,
        //       but MUI v4 doesn't seem to support it
        alignItems='center'
        justifyItems='center'
      >
        <ListItemIcon
          style={{ gridArea: 'dragHandle', minWidth: 32 }}
          {...provided.dragHandleProps}
        >
          <DragHandle />
        </ListItemIcon>
        <ListItemIcon style={{ gridArea: 'removeIcon' }}>
          <IconButton onClick={() => fields.remove(index)}>
            <Delete />
          </IconButton>
        </ListItemIcon>
        <Typography style={{ gridArea: 'xLabel' }}>X</Typography>
        <Typography style={{ gridArea: 'yLabel' }}>Y</Typography>
        <Typography style={{ gridArea: 'countLabel' }}>Count</Typography>
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
          disabled={fields.value[index].linkCount}
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

        <Typography style={{ gridArea: 'spaceLabel' }}>Space</Typography>
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
            endAdornment: <InputAdornment position='end'>m</InputAdornment>,
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
          disabled={fields.value[index].linkSpace}
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
            endAdornment: <InputAdornment position='end'>m</InputAdornment>,
          }}
        />
      </Box>
    </ListItem>
  );
};

TakeoffSubgridProperties.propTypes = {
  fields: PropTypes.object,
  index: PropTypes.number,
  name: PropTypes.string,
  snapshot: PropTypes.object,
  provided: PropTypes.object,
};

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
    decorators={[decorator]}
    render={({ handleSubmit, form }) => (
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
              <DragDropContext onDragEnd={makeOnDragEndFunction(fields)}>
                <Droppable droppableId='droppable'>
                  {(provided, snapshot) => (
                    <List
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      dense
                      disablePadding
                      style={
                        {
                          // ...(snapshot.isDraggingOver && { background: 'gray' }),
                        }
                      }
                    >
                      {fields?.map((name, index) => (
                        <Draggable key={name} draggableId={name} index={index}>
                          {(provided, snapshot) => (
                            <TakeoffSubgridProperties
                              key={name}
                              fields={fields}
                              index={index}
                              name={name}
                              provided={provided}
                              snapshot={snapshot}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      <ListItem
                        button
                        style={{ minWidth: 315 }}
                        onClick={() => fields.push(DEFAULT_SUBGRID)}
                      >
                        <ListItemIcon style={{ minWidth: 32 }}>
                          <Add />
                        </ListItemIcon>
                        <ListItemText
                          primary='Add new subgrid'
                          primaryTypographyProps={{ align: 'center' }}
                        />
                      </ListItem>
                    </List>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </FieldArray>
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
  const toolbarRef = useRef();

  return (
    <Box ref={toolbarRef} display='flex'>
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
            setAnchorEl(toolbarRef.current);
            // setAnchorEl(e.currentTarget);
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
